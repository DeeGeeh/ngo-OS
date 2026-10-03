"use client";

import {
  AuiIf,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAuiEvent,
  type AssistantState,
} from "@assistant-ui/react";
import { List, MessageSquare, Plus } from "lucide-react";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { AssistantThread } from "./assistant-panel";

const isLoading = (state: AssistantState) => state.threads.isLoading;
const isEmpty = (state: AssistantState) =>
  !state.threads.isLoading && state.threads.threadIds.length === 0;

function SavedThread() {
  return (
    <ThreadListItemPrimitive.Root className="flex items-center gap-1 rounded-lg data-active:bg-muted">
      <ThreadListItemPrimitive.Trigger
        className={buttonVariants({ variant: "ghost", className: "min-w-0 flex-1 justify-start" })}
      >
        <MessageSquare data-icon="inline-start" />
        <span className="truncate">
          <ThreadListItemPrimitive.Title fallback="New conversation" />
        </span>
      </ThreadListItemPrimitive.Trigger>
    </ThreadListItemPrimitive.Root>
  );
}

const threadComponents = { ThreadListItem: SavedThread };
const conversationsButton = <Button variant="outline" size="sm" />;

function SavedThreads() {
  return (
    <ThreadListPrimitive.Root className="flex h-full min-h-0 flex-col gap-4 p-4">
      <ThreadListPrimitive.New
        className={buttonVariants({ variant: "outline", className: "w-full justify-start" })}
      >
        <Plus data-icon="inline-start" />
        New conversation
      </ThreadListPrimitive.New>
      <ScrollArea className="min-h-0 flex-1">
        <h2 className="mb-3 px-2 text-sm font-medium text-muted-foreground">Conversations</h2>
        <AuiIf condition={isLoading}>
          <p className="px-2 text-sm text-muted-foreground">Loading conversations...</p>
        </AuiIf>
        <AuiIf condition={isEmpty}>
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No saved conversations</EmptyTitle>
            </EmptyHeader>
          </Empty>
        </AuiIf>
        <ThreadListPrimitive.Items components={threadComponents} />
      </ScrollArea>
    </ThreadListPrimitive.Root>
  );
}

export function AgentPage() {
  const [open, setOpen] = useState(false);
  useAuiEvent("threads.selectionChanged", () => setOpen(false));
  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <aside className="hidden w-64 shrink-0 border-r md:block" aria-label="Saved conversations">
        <SavedThreads />
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="border-b p-3 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={conversationsButton}>
              <List data-icon="inline-start" />
              Conversations
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Conversations</SheetTitle>
              </SheetHeader>
              <SavedThreads />
            </SheetContent>
          </Sheet>
        </div>
        <AssistantThread wide />
      </div>
    </div>
  );
}
