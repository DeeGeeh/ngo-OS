"use client";

import { ChevronDown, Hash, Layers } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Channel, Conversation as ConversationTarget, Workspace } from "@/lib/workspace";

import { Conversation } from "./conversation";

function ChannelItem({
  channel,
  selected,
  onSelect,
}: {
  channel: Channel;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const select = useCallback(() => onSelect(channel.id), [channel.id, onSelect]);
  return (
    <Button
      variant={selected ? "secondary" : "ghost"}
      className="w-full justify-start"
      onClick={select}
      aria-pressed={selected}
    >
      <Hash />
      {channel.name}
    </Button>
  );
}

export function WorkspaceChat({
  workspace,
  projectId,
}: {
  workspace: Workspace;
  projectId?: string;
}) {
  const [selectedId, setSelectedId] = useState(
    () =>
      workspace.channels.find(
        (channel) => channel.kind === "project" && channel.projectId === projectId,
      )?.id ?? workspace.channels.find((channel) => channel.kind === "general")?.id,
  );
  const selected = workspace.channels.find((channel) => channel.id === selectedId);
  const generalChannels = workspace.channels.filter((channel) => channel.kind === "general");
  const projectChannels = workspace.channels.filter((channel) => channel.kind === "project");
  const conversation = useMemo(
    () =>
      selected ? ({ kind: "channel", id: selected.id } satisfies ConversationTarget) : undefined,
    [selected],
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-background sm:flex-row">
      <aside className="flex shrink-0 flex-col border-b sm:w-56 sm:border-r sm:border-b-0">
        <h2 className="flex h-16 items-center px-5 font-semibold">Channels</h2>
        <ScrollArea className="min-h-0 flex-1">
          <nav className="flex flex-col gap-1 px-3 pb-4" aria-label="Channels">
            {generalChannels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                selected={selectedId === channel.id}
                onSelect={setSelectedId}
              />
            ))}
            <Collapsible defaultOpen={Boolean(projectId)} className="mt-3">
              <CollapsibleTrigger className="w-full">
                <span className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-muted-foreground">
                  <Layers className="size-4" />
                  <span className="flex-1 text-left">Projects</span>
                  <ChevronDown className="size-4" />
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col gap-1 pt-1">
                  {projectChannels.map((channel) => (
                    <ChannelItem
                      key={channel.id}
                      channel={channel}
                      selected={selectedId === channel.id}
                      onSelect={setSelectedId}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </nav>
        </ScrollArea>
      </aside>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        {selected && conversation ? (
          <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-5 font-semibold">
              <Hash className="size-4 text-muted-foreground" />
              {selected.name}
            </header>
            <div className="min-h-0 flex-1">
              <Conversation workspace={workspace} conversation={conversation} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Choose a channel.
          </div>
        )}
      </section>
    </div>
  );
}
