"use client";

import {
  AssistantChatTransport,
  useChatRuntime,
  type UseChatRuntimeOptions,
} from "@assistant-ui/ai-sdk";
import {
  AssistantRuntimeProvider,
  AuiConfig,
  Suggestions,
  getExternalStoreMessages,
  useAui,
  useRemoteThreadListRuntime,
  type AssistantRuntime,
  type MessageFormatAdapter,
  type RemoteThreadListAdapter,
  type ThreadHistoryAdapter,
} from "@assistant-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { createAssistantStream } from "assistant-stream";
import { usePathname, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  assistantContentSchema,
  assistantIdSchema,
  assistantTitle,
  type AssistantThread,
} from "@/lib/assistant";
import { dataLibraryQueryKey } from "@/lib/data";
import { workspaceQueryKey } from "@/lib/workspace";

import {
  deleteAssistantThreadAction,
  initializeAssistantThreadAction,
  listAssistantThreadsAction,
  readAssistantThreadAction,
  saveAssistantMessageAction,
  selectAssistantBranchAction,
  updateAssistantThreadAction,
} from "../actions";

import { csvAttachmentAdapter } from "./data-attachments";

type RuntimeMessage = NonNullable<UseChatRuntimeOptions["messages"]>[number];
type PersistenceOperation = <T>(operation: () => Promise<T>) => Promise<T>;
const PersistenceContext = createContext<{
  error: string | null;
  persist: PersistenceOperation;
} | null>(null);
const assistantConfig = AuiConfig({
  suggestions: Suggestions([
    "Understand the workspace",
    "Plan this week",
    "Find task owners",
    "Spot project risks",
  ]),
});

function usePersistence() {
  const context = useContext(PersistenceContext);
  if (!context) throw new Error("The assistant persistence provider is missing.");
  return context;
}

export function useAssistantPersistenceError() {
  return usePersistence().error;
}

function createThreadHistory(aui: ReturnType<typeof useAui>, persist: PersistenceOperation) {
  let pinnedItem: ReturnType<typeof aui.threads.item> | undefined;
  let writes = Promise.resolve();
  const pin = () => {
    pinnedItem ??= aui.threads.item({ id: aui.threadListItem.getState().id });
  };
  const destination = async () => {
    pin();
    if (!pinnedItem) throw new Error("The conversation is unavailable.");
    return pinnedItem.getState().remoteId ?? (await pinnedItem.initialize()).remoteId;
  };
  const enqueue = (operation: () => Promise<void>) => {
    const next = writes.then(() => persist(operation));
    writes = next.catch(() => undefined);
    return next;
  };
  const adapter = {
    async load() {
      throw new Error("Use the AI SDK message format to load conversations.");
    },
    async append() {
      throw new Error("Use the AI SDK message format to save conversations.");
    },
    withFormat<TMessage, TStorageFormat extends Record<string, unknown>>(
      formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>,
    ) {
      if (formatAdapter.format !== "ai-sdk/v6")
        throw new Error("This conversation format is unsupported.");
      const codec: MessageFormatAdapter<TMessage, Record<string, unknown>> = formatAdapter;
      const save = (item: { parentId: string | null; message: TMessage }, select: boolean) =>
        enqueue(async () => {
          const threadId = await destination();
          await saveAssistantMessageAction({
            threadId,
            select,
            message: {
              id: formatAdapter.getId(item.message),
              parentId: item.parentId,
              format: "ai-sdk/v6",
              content: assistantContentSchema.parse(formatAdapter.encode(item)),
            },
          });
        });
      return {
        pin,
        async load() {
          pin();
          const threadId = pinnedItem?.getState().remoteId;
          if (!threadId) return { headId: null, messages: [] };
          const saved = await persist(() => readAssistantThreadAction(threadId));
          return {
            headId: saved.thread.headId,
            messages: saved.messages.map((message) =>
              codec.decode({
                id: message.id,
                parent_id: message.parentId,
                format: message.format,
                content: assistantContentSchema.parse(message.content),
              }),
            ),
          };
        },
        append: (item: { parentId: string | null; message: TMessage }) => save(item, true),
        update: (item: { parentId: string | null; message: TMessage }) => save(item, false),
      };
    },
    select(headId: string | null) {
      return enqueue(async () => {
        await selectAssistantBranchAction({ threadId: await destination(), headId });
      });
    },
  } satisfies ThreadHistoryAdapter & { select: (headId: string | null) => Promise<void> };
  return adapter;
}

function SavedChatRuntime() {
  const aui = useAui();
  const queryClient = useQueryClient();
  const { persist } = usePersistence();
  const history = useMemo(() => createThreadHistory(aui, persist), [aui, persist]);
  const [transport] = useState(() => new AssistantChatTransport({ api: "/api/assistant" }));
  const runtime: AssistantRuntime = useChatRuntime({
    transport,
    adapters: { history, attachments: csvAttachmentAdapter },
    onFinish: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceQueryKey });
      void queryClient.invalidateQueries({ queryKey: dataLibraryQueryKey });
    },
    unstable_onBranchChange: ({ headId }) => {
      const message = runtime.thread.getState().messages.find((item) => item.id === headId);
      const storageHead = message
        ? (getExternalStoreMessages<RuntimeMessage>(message).at(-1)?.id ?? headId)
        : headId;
      void history.select(storageHead).catch(() => undefined);
    },
  });
  return runtime;
}

function remoteMetadata(thread: AssistantThread) {
  return {
    remoteId: thread.id,
    title: thread.title,
    status: thread.status,
    lastMessageAt: new Date(thread.updatedAt),
  };
}

export function AssistantProvider({
  children,
  initialThreads,
}: {
  children: ReactNode;
  initialThreads: AssistantThread[];
}) {
  const [error, setError] = useState<string | null>(null);
  const persist = useCallback(async <T,>(operation: () => Promise<T>) => {
    try {
      const result = await operation();
      setError(null);
      return result;
    } catch {
      setError("The conversation could not be saved or loaded. Please try again.");
      throw new Error("The conversation could not be saved or loaded.");
    }
  }, []);
  const [adapter] = useState<RemoteThreadListAdapter>(() => {
    let firstList = true;
    return {
      async list() {
        const threads = firstList ? initialThreads : await persist(listAssistantThreadsAction);
        firstList = false;
        return { threads: threads.map(remoteMetadata) };
      },
      async initialize(id) {
        const thread = await persist(() => initializeAssistantThreadAction(id));
        return { remoteId: thread.id };
      },
      async fetch(id) {
        const { thread } = await persist(() => readAssistantThreadAction(id));
        return remoteMetadata(thread);
      },
      rename: (id, title) => persist(() => updateAssistantThreadAction(id, { title })),
      archive: (id) => persist(() => updateAssistantThreadAction(id, { status: "archived" })),
      unarchive: (id) => persist(() => updateAssistantThreadAction(id, { status: "regular" })),
      delete: (id) => persist(() => deleteAssistantThreadAction(id)),
      async generateTitle(_id, messages) {
        const userMessage = messages.find((message) => message.role === "user");
        const text =
          userMessage?.content
            .flatMap((part) => (part.type === "text" ? [part.text] : []))
            .join(" ") ?? "";
        const title = assistantTitle(text);
        return createAssistantStream((controller) => {
          controller.appendText(title);
        });
      },
    };
  });
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const parsedThreadId = assistantIdSchema.safeParse(searchParams.get("thread"));
  const runtime = useRemoteThreadListRuntime({
    runtimeHook: SavedChatRuntime,
    adapter,
    threadId: parsedThreadId.success ? parsedThreadId.data : undefined,
    onThreadIdChange: (id) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) params.set("thread", id);
      else params.delete("thread");
      const query = params.toString();
      window.history.replaceState(null, "", `${pathname}${query ? `?${query}` : ""}`);
    },
  });
  const persistence = useMemo(() => ({ error, persist }), [error, persist]);
  return (
    <PersistenceContext value={persistence}>
      <AssistantRuntimeProvider runtime={runtime} config={assistantConfig}>
        {children}
      </AssistantRuntimeProvider>
    </PersistenceContext>
  );
}
