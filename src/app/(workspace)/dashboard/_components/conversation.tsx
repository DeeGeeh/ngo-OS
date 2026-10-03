"use client";

import {
  AssistantRuntimeProvider,
  AuiIf,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
  useExternalStoreRuntime,
  type AppendMessage,
  type AssistantState,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, MessageSquare } from "lucide-react";
import { useCallback, useMemo } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { useToday } from "@/hooks/use-today";
import { cn } from "@/lib/utils";
import {
  workspaceQueryKey,
  type Conversation as ConversationTarget,
  type Message,
  type Workspace,
} from "@/lib/workspace";

import { sendMessageAction } from "../actions";

function convertMessage(message: Message): ThreadMessageLike {
  return {
    id: message.id,
    role: "user",
    content: [{ type: "text", text: message.text }],
    createdAt: new Date(message.createdAt),
  };
}

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Helsinki",
  hourCycle: "h23",
});
const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Helsinki",
});
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki" });
const stampFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Helsinki",
  hourCycle: "h23",
});
const isEmpty = (state: AssistantState) => state.thread.isEmpty;

function dayKey(iso: string) {
  return dayKeyFormat.format(new Date(iso));
}

function dayOffset(key: string, today: string) {
  const diff = Date.parse(`${key}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`);
  return Math.round(diff / 86_400_000);
}

function DaySeparator({ iso }: { iso: string }) {
  const today = useToday();
  const key = dayKey(iso);
  const offset = today === null ? null : dayOffset(key, today);
  const label =
    offset === 0 ? "Today" : offset === -1 ? "Yesterday" : dayFormat.format(new Date(iso));
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <span className="h-px flex-1 bg-border" />
      <span className="rounded-full border bg-background px-3 py-0.5 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function TeamMessage({ workspace, messages }: { workspace: Workspace; messages: Message[] }) {
  const id = useAuiState((state) => state.message.id);
  const index = messages.findIndex((entry) => entry.id === id);
  const message = index === -1 ? undefined : messages[index];
  const previous = index > 0 ? messages[index - 1] : undefined;
  const author = workspace.members.find((member) => member.id === message?.authorId);
  const startsDay = Boolean(
    message && (!previous || dayKey(previous.createdAt) !== dayKey(message.createdAt)),
  );
  const grouped = Boolean(
    message &&
    previous &&
    !startsDay &&
    previous.authorId === message.authorId &&
    Date.parse(message.createdAt) - Date.parse(previous.createdAt) < 5 * 60_000,
  );

  return (
    <>
      {message && startsDay && <DaySeparator iso={message.createdAt} />}
      <MessagePrimitive.Root
        className={cn(
          "group/message flex gap-3 px-5 hover:bg-muted/40",
          grouped ? "py-0.5" : "pt-3 pb-1",
        )}
      >
        {grouped ? (
          <span className="w-8 shrink-0 pt-0.5 text-right text-xs text-muted-foreground tabular-nums opacity-0 group-hover/message:opacity-100">
            {message && timeFormat.format(new Date(message.createdAt))}
          </span>
        ) : (
          <Avatar>
            <AvatarFallback>
              {author?.name
                .split(" ")
                .map((name) => name[0])
                .join("") ?? "?"}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0 flex-1">
          {!grouped && (
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-sm font-semibold">{author?.name ?? "Team member"}</span>
              {message && (
                <time
                  className="text-xs text-muted-foreground tabular-nums"
                  dateTime={message.createdAt}
                  title={stampFormat.format(new Date(message.createdAt))}
                >
                  {timeFormat.format(new Date(message.createdAt))}
                </time>
              )}
            </div>
          )}
          <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
            <MessagePrimitive.Parts />
          </div>
        </div>
      </MessagePrimitive.Root>
    </>
  );
}

function ConversationThread({
  workspace,
  conversation,
}: {
  workspace: Workspace;
  conversation: ConversationTarget;
}) {
  const queryClient = useQueryClient();
  const send = useMutation({
    mutationFn: sendMessageAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceQueryKey }),
  });
  const messages = useMemo(
    () =>
      workspace.messages.filter(
        (message) =>
          message.conversation.kind === conversation.kind &&
          message.conversation.id === conversation.id,
      ),
    [workspace.messages, conversation.kind, conversation.id],
  );
  const runtime = useExternalStoreRuntime({
    messages,
    convertMessage,
    isRunning: send.isPending,
    onNew: async (message: AppendMessage) => {
      const text = message.content
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n");
      await send.mutateAsync({ conversation, text });
    },
  });
  const renderMessage = useCallback(
    () => <TeamMessage workspace={workspace} messages={messages} />,
    [workspace, messages],
  );
  const recipient =
    conversation.kind === "direct"
      ? workspace.members.find((member) => member.id === conversation.id)?.name
      : undefined;
  const placeholder = recipient ? `Message ${recipient}...` : "Message the team...";
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPrimitive.Root className="flex h-full min-h-0 flex-col">
        <ThreadPrimitive.Viewport className="min-h-0 flex-1 overflow-y-auto py-3">
          <AuiIf condition={isEmpty}>
            <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
              <MessageSquare className="size-6" />
              <p className="text-sm">Start the conversation.</p>
            </div>
          </AuiIf>
          <ThreadPrimitive.Messages>{renderMessage}</ThreadPrimitive.Messages>
        </ThreadPrimitive.Viewport>
        <div className="flex shrink-0 flex-col gap-3 p-4">
          {send.error && (
            <Alert variant="destructive">
              <AlertDescription>{send.error.message}</AlertDescription>
            </Alert>
          )}
          <ComposerPrimitive.Root className="rounded-xl border bg-background p-3">
            <ComposerPrimitive.Input
              className="max-h-40 min-h-16 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder={placeholder}
              aria-label={placeholder}
              maxLength={4000}
            />
            <div className="flex justify-end">
              <ComposerPrimitive.Send
                className={buttonVariants({ size: "icon" })}
                aria-label="Send message"
              >
                <ArrowUp />
              </ComposerPrimitive.Send>
            </div>
          </ComposerPrimitive.Root>
        </div>
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  );
}

export function Conversation({
  workspace,
  conversation,
}: {
  workspace: Workspace;
  conversation: ConversationTarget;
}) {
  return (
    <ConversationThread
      key={`${conversation.kind}-${conversation.id}`}
      workspace={workspace}
      conversation={conversation}
    />
  );
}
