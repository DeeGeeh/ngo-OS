"use client";

import { useAISDKError } from "@assistant-ui/ai-sdk";
import {
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  SuggestionPrimitive,
  ThreadListPrimitive,
  ThreadPrimitive,
  type AssistantState,
  type ToolCallMessagePartProps,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Square,
  Wrench,
  X,
} from "lucide-react";
import { useEffect } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { workspaceQueryKey } from "@/lib/workspace";

import { useAssistantPersistenceError } from "./assistant-runtime";

const toolLabels: Record<string, string> = {
  readWorkspace: "Read workspace",
  createTask: "Create task",
  updateTask: "Update task",
  createProject: "Create project",
  updateProject: "Update project",
  telegramStatus: "Check Telegram",
  linkTelegramMember: "Link Telegram member",
  ensureProjectTelegramGroup: "Create Telegram group",
  inviteTelegramProjectMembers: "Invite Telegram members",
  listTelegramProjectMembers: "Read Telegram members",
  readTelegramProjectMessages: "Read Telegram messages",
  sendTelegramProjectMessage: "Send Telegram message",
  createTelegramProjectInviteLink: "Create Telegram invite link",
};

const isEmpty = (state: AssistantState) => state.thread.isEmpty && !state.thread.isLoading;
const isLoading = (state: AssistantState) => state.thread.isLoading;
const isRunning = (state: AssistantState) => state.thread.isRunning;
const isIdle = (state: AssistantState) => !state.thread.isRunning;

function ToolResult({ toolName, status, isError }: ToolCallMessagePartProps<unknown>) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (status.type === "complete" && !isError && toolName !== "readWorkspace") {
      void queryClient.invalidateQueries({ queryKey: workspaceQueryKey });
    }
  }, [status.type, isError, toolName, queryClient]);
  return (
    <div className="my-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
      {status.type === "complete" && !isError ? (
        <Check className="size-4 text-primary" />
      ) : (
        <Wrench className="size-4" />
      )}
      <span className="flex-1">{toolLabels[toolName] ?? "Workspace action"}</span>
      {isError && <span className="text-destructive">Failed</span>}
      {status.type === "running" && <span className="text-muted-foreground">Working</span>}
    </div>
  );
}

function MarkdownText() {
  return <MarkdownTextPrimitive />;
}

const messageParts = { Text: MarkdownText, tools: { Fallback: ToolResult } };

function BranchPicker() {
  return (
    <BranchPickerPrimitive.Root
      className="flex items-center gap-1 text-sm text-muted-foreground"
      hideWhenSingleBranch
    >
      <BranchPickerPrimitive.Previous
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        aria-label="Previous version"
      >
        <ChevronLeft />
      </BranchPickerPrimitive.Previous>
      <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      <BranchPickerPrimitive.Next
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        aria-label="Next version"
      >
        <ChevronRight />
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="mb-5 flex flex-col items-end gap-1">
      <div className="max-w-full rounded-2xl bg-muted px-4 py-3 text-sm leading-relaxed">
        <MessagePrimitive.Parts />
      </div>
      <div className="flex items-center gap-1">
        <BranchPicker />
        <ActionBarPrimitive.Root>
          <ActionBarPrimitive.Edit
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            aria-label="Edit message"
          >
            <Pencil />
          </ActionBarPrimitive.Edit>
        </ActionBarPrimitive.Root>
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="mb-6 text-sm leading-relaxed">
      <div className="mb-2 flex items-center gap-2 font-medium">
        <Sparkles className="size-4 text-primary" />
        Assistant
      </div>
      <div className="flex flex-col gap-3 break-words">
        <MessagePrimitive.Parts components={messageParts} />
      </div>
      <div className="mt-2 flex items-center gap-1">
        <ActionBarPrimitive.Root hideWhenRunning>
          <ActionBarPrimitive.Copy
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            aria-label="Copy response"
          >
            <Copy />
          </ActionBarPrimitive.Copy>
          <ActionBarPrimitive.Reload
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            aria-label="Retry response"
          >
            <RotateCcw />
          </ActionBarPrimitive.Reload>
        </ActionBarPrimitive.Root>
        <BranchPicker />
      </div>
    </MessagePrimitive.Root>
  );
}

function EditComposer() {
  return (
    <ComposerPrimitive.Root className="mb-5 rounded-lg border p-3">
      <ComposerPrimitive.Input
        className="min-h-20 w-full resize-none bg-transparent text-sm outline-none"
        aria-label="Edit message"
      />
      <div className="mt-2 flex justify-end gap-2">
        <ComposerPrimitive.Cancel className={buttonVariants({ variant: "ghost" })}>
          Cancel
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send className={buttonVariants()}>Save</ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
}

const messages = { UserMessage, AssistantMessage, EditComposer };

export function AssistantThread({
  onClose,
  wide = false,
}: {
  onClose?: () => void;
  wide?: boolean;
}) {
  const error = useAISDKError();
  const persistenceError = useAssistantPersistenceError();
  return (
    <ThreadPrimitive.Root className="flex h-full min-h-0 flex-col bg-background">
      {!wide && (
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-primary" />
            Assistant
          </h2>
          <div className="flex items-center gap-1">
            <ThreadListPrimitive.New
              className={buttonVariants({ variant: "ghost", size: "icon" })}
              aria-label="New conversation"
            >
              <Plus />
            </ThreadListPrimitive.New>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close assistant">
                <X />
              </Button>
            )}
          </div>
        </header>
      )}
      <ThreadPrimitive.Viewport className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <div className={wide ? "mx-auto w-full max-w-3xl" : "w-full"}>
          <AuiIf condition={isLoading}>
            <p className="text-sm text-muted-foreground">Loading conversation...</p>
          </AuiIf>
          <AuiIf condition={isEmpty}>
            <div className="flex min-h-52 flex-col justify-center gap-4">
              <h3 className="text-xl font-semibold tracking-tight">What needs doing?</h3>
              <div className="grid gap-2">
                <ThreadPrimitive.Suggestions>
                  {() => (
                    <SuggestionPrimitive.Trigger send asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <SuggestionPrimitive.Title />
                      </Button>
                    </SuggestionPrimitive.Trigger>
                  )}
                </ThreadPrimitive.Suggestions>
              </div>
            </div>
          </AuiIf>
          <ThreadPrimitive.Messages components={messages} />
          <AuiIf condition={isRunning}>
            <p className="text-sm text-muted-foreground">Working...</p>
          </AuiIf>
          <ThreadPrimitive.ScrollToBottom
            className={buttonVariants({
              variant: "outline",
              size: "icon-sm",
              className: "sticky bottom-0 mx-auto flex disabled:hidden",
            })}
            aria-label="Scroll to latest message"
          >
            <ArrowDown />
          </ThreadPrimitive.ScrollToBottom>
        </div>
      </ThreadPrimitive.Viewport>
      <div
        className={
          wide
            ? "mx-auto flex w-full max-w-3xl shrink-0 flex-col gap-3 p-4"
            : "flex shrink-0 flex-col gap-3 p-4"
        }
      >
        {persistenceError && (
          <Alert variant="destructive">
            <AlertDescription>{persistenceError}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        <ComposerPrimitive.Root className="rounded-xl border bg-background p-3 shadow-sm">
          <ComposerPrimitive.Input
            className="max-h-40 min-h-16 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Ask or give a task..."
            aria-label="Message assistant"
          />
          <div className="flex justify-end">
            <AuiIf condition={isIdle}>
              <ComposerPrimitive.Send
                className={buttonVariants({ size: "icon" })}
                aria-label="Send message"
              >
                <ArrowUp />
              </ComposerPrimitive.Send>
            </AuiIf>
            <AuiIf condition={isRunning}>
              <ComposerPrimitive.Cancel
                className={buttonVariants({ variant: "secondary", size: "icon" })}
                aria-label="Stop response"
              >
                <Square />
              </ComposerPrimitive.Cancel>
            </AuiIf>
          </div>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  );
}

export function AssistantPanel({ onClose }: { onClose?: () => void } = {}) {
  return <AssistantThread onClose={onClose} />;
}
