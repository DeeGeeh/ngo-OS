"use client";

import { useAISDKError } from "@assistant-ui/ai-sdk";
import {
  ActionBarPrimitive,
  AttachmentPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  SuggestionPrimitive,
  ThreadListPrimitive,
  ThreadPrimitive,
  useAui,
  type AssistantState,
  type ToolCallMessagePartProps,
  type DataMessagePartProps,
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
  FileUp,
  Pencil,
  Plus,
  RotateCcw,
  Square,
  HardDrive,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dataLibraryQueryKey, sourceSummarySchema } from "@/lib/data";
import { workspaceQueryKey } from "@/lib/workspace";

import { useAssistantPersistenceError } from "./assistant-runtime";

const toolLabels: Record<string, string> = {
  readWorkspace: "Read workspace",
  createTask: "Create task",
  updateTask: "Update task",
  createProject: "Create project",
  updateProject: "Update project",
  readDataLibrary: "Read data library",
  inspectSource: "Inspect data source",
  saveDashboard: "Save dashboard",
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
      if (toolName === "saveDashboard")
        void queryClient.invalidateQueries({ queryKey: dataLibraryQueryKey });
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

function SourceReferenceMessage({ data }: DataMessagePartProps) {
  const source = sourceSummarySchema.parse(data);
  return (
    <p className="mt-2 flex items-center gap-2">
      <FileUp className="size-4" />
      {source.name}
    </p>
  );
}

const userMessageParts = { data: { by_name: { source: SourceReferenceMessage } } };

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
        <MessagePrimitive.Parts components={userMessageParts} />
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

function GoogleSourceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const aui = useAui();
  const [kind, setKind] = useState<"google-sheet" | "google-drive-csv">("google-sheet");
  const [access, setAccess] = useState<"public" | "service-account">("public");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
      setError(null);
    },
    [onOpenChange],
  );

  const addSource = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const payload =
        kind === "google-sheet"
          ? { kind, url, access }
          : { kind, url, access: "service-account" as const };
      const response = await fetch("/api/data/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());
      const source = sourceSummarySchema.parse(await response.json());
      await aui.composer.addAttachment({
        id: source.id,
        type: "document",
        name: source.name,
        contentType: "text/csv",
        content: [
          {
            type: "data",
            name: "source",
            data: source,
          },
        ],
      });
      setUrl("");
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The source could not be added.");
    } finally {
      setIsSubmitting(false);
    }
  }, [access, aui, kind, url, onOpenChange]);
  const changeKind = useCallback((value: string | null) => {
    if (value === "google-sheet" || value === "google-drive-csv") setKind(value);
  }, []);
  const changeAccess = useCallback((value: string | null) => {
    if (value === "public" || value === "service-account") setAccess(value);
  }, []);
  const changeUrl = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  }, []);
  const submitSource = useCallback(() => void addSource(), [addSource]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Google source</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Select value={kind} onValueChange={changeKind}>
            <SelectTrigger aria-label="Google source type">
              <SelectValue>
                {kind === "google-sheet" ? "Google Sheet" : "Google Drive CSV"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google-sheet">Google Sheet</SelectItem>
              <SelectItem value="google-drive-csv">Google Drive CSV</SelectItem>
            </SelectContent>
          </Select>
          {kind === "google-sheet" && (
            <Select value={access} onValueChange={changeAccess}>
              <SelectTrigger aria-label="Google Sheet access">
                <SelectValue>
                  {access === "public" ? "Public link" : "Shared with TRES"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public link</SelectItem>
                <SelectItem value="service-account">Shared with TRES</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Input
            type="url"
            value={url}
            onChange={changeUrl}
            placeholder={
              kind === "google-sheet"
                ? "https://docs.google.com/spreadsheets/d/..."
                : "https://drive.google.com/file/d/..."
            }
            aria-label="Google source URL"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose render={Button}>Cancel</DialogClose>
          <Button type="button" onClick={submitSource} disabled={isSubmitting || url.trim() === ""}>
            {isSubmitting ? "Adding" : "Add source"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const messages = { UserMessage, AssistantMessage, EditComposer };
const attachmentMenuItem = (
  <DropdownMenuItem>
    <FileUp />
    Upload CSV
  </DropdownMenuItem>
);
const composerMenuTrigger = (
  <Button type="button" variant="ghost" size="icon-sm" aria-label="Add source">
    <Plus />
  </Button>
);

export function AssistantThread({
  onClose,
  wide = false,
}: {
  onClose?: () => void;
  wide?: boolean;
}) {
  const error = useAISDKError();
  const persistenceError = useAssistantPersistenceError();
  const [googleSourceOpen, setGoogleSourceOpen] = useState(false);
  const openGoogleSource = useCallback(() => setGoogleSourceOpen(true), []);
  return (
    <ThreadPrimitive.Root className="flex h-full min-h-0 flex-col bg-background">
      {!wide && (
        <header className="flex h-16 shrink-0 items-center justify-end border-b px-5">
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
        <ComposerPrimitive.AttachmentDropzone className="rounded-xl border bg-background p-3 shadow-sm">
          <ComposerPrimitive.Root>
            <ComposerPrimitive.Attachments>
              {({ attachment }) => {
                const status =
                  attachment.status.type === "incomplete"
                    ? (attachment.status.message ?? "Upload failed")
                    : attachment.status.type === "running"
                      ? "Uploading"
                      : "Ready";
                return (
                  <AttachmentPrimitive.Root className="flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1 text-xs">
                    <span className="max-w-48 truncate">
                      <AttachmentPrimitive.Name />
                    </span>
                    <span className="text-muted-foreground">{status}</span>
                    <AttachmentPrimitive.Remove
                      className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
                      aria-label={`Remove ${attachment.name}`}
                    >
                      <X />
                    </AttachmentPrimitive.Remove>
                  </AttachmentPrimitive.Root>
                );
              }}
            </ComposerPrimitive.Attachments>
            <ComposerPrimitive.Input
              className="max-h-40 min-h-16 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Ask or give a task..."
              aria-label="Message assistant"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger render={composerMenuTrigger} />
                  <DropdownMenuContent>
                    <ComposerPrimitive.AddAttachment render={attachmentMenuItem} />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <HardDrive />
                        Plugins
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={openGoogleSource}>
                          <HardDrive />
                          Google Drive
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
                <GoogleSourceDialog open={googleSourceOpen} onOpenChange={setGoogleSourceOpen} />
              </div>
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
            </div>
          </ComposerPrimitive.Root>
        </ComposerPrimitive.AttachmentDropzone>
      </div>
    </ThreadPrimitive.Root>
  );
}

export function AssistantPanel({ onClose }: { onClose?: () => void } = {}) {
  return <AssistantThread onClose={onClose} />;
}
