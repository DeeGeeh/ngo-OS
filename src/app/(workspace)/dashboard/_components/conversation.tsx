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
import { useCallback } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
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
});
const isEmpty = (state: AssistantState) => state.thread.isEmpty;

function TeamMessage({ workspace }: { workspace: Workspace }) {
  const id = useAuiState((state) => state.message.id);
  const message = workspace.messages.find((entry) => entry.id === id);
  const author = workspace.members.find((member) => member.id === message?.authorId);
  return (
    <MessagePrimitive.Root className="flex gap-3 px-5 py-3">
      <Avatar>
        <AvatarFallback>
          {author?.name
            .split(" ")
            .map((name) => name[0])
            .join("") ?? "?"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline gap-3">
          <span className="text-sm font-semibold">{author?.name ?? "Team member"}</span>
          {message && (
            <time className="text-sm text-muted-foreground" dateTime={message.createdAt}>
              {timeFormat.format(new Date(message.createdAt))}
            </time>
          )}
        </div>
        <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
          <MessagePrimitive.Parts />
        </div>
      </div>
    </MessagePrimitive.Root>
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
  const messages = workspace.messages.filter(
    (message) =>
      message.conversation.kind === conversation.kind &&
      message.conversation.id === conversation.id,
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
  const renderMessage = useCallback(() => <TeamMessage workspace={workspace} />, [workspace]);
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
              placeholder="Message the team..."
              aria-label="Message the team"
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
