"use client";

import { ChevronDown, Folder, Hash, MessageSquare } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  memberPortrait,
  type Channel,
  type Conversation as ConversationTarget,
  type Member,
  type Workspace,
} from "@/lib/workspace";

import { Conversation } from "./conversation";

type ChatSelection = { kind: "channel" | "direct"; id: string };

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

function MemberAvatar({ member, size = "sm" }: { member: Member; size?: "sm" | "default" }) {
  const portrait = memberPortrait(member);
  return (
    <Avatar size={size}>
      {portrait ? <AvatarImage src={portrait} alt="" /> : null}
      <AvatarFallback>{initials(member.name)}</AvatarFallback>
    </Avatar>
  );
}

function ChannelItem({
  channel,
  selected,
  onSelect,
  nested = false,
}: {
  channel: Channel;
  selected: boolean;
  onSelect: (id: string) => void;
  nested?: boolean;
}) {
  const select = useCallback(() => onSelect(channel.id), [channel.id, onSelect]);
  return (
    <Button
      variant={selected ? "secondary" : "ghost"}
      size={nested ? "sm" : "default"}
      className="w-full min-w-0 justify-start"
      onClick={select}
      aria-pressed={selected}
    >
      {nested ? <Folder data-icon="inline-start" /> : <Hash data-icon="inline-start" />}
      <span className="truncate">{channel.name}</span>
    </Button>
  );
}

function DirectItem({
  member,
  selected,
  onSelect,
}: {
  member: Member;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const select = useCallback(() => onSelect(member.id), [member.id, onSelect]);
  return (
    <Button
      variant={selected ? "secondary" : "ghost"}
      className="w-full min-w-0 justify-start"
      onClick={select}
      aria-pressed={selected}
    >
      <MemberAvatar member={member} />
      <span className="truncate">{member.name}</span>
    </Button>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: typeof Hash; label: string }) {
  return (
    <span className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-muted-foreground">
      <Icon className="size-4" />
      <span className="flex-1 text-left">{label}</span>
      <ChevronDown className="size-4" />
    </span>
  );
}

export function WorkspaceChat({
  workspace,
  projectId,
}: {
  workspace: Workspace;
  projectId?: string;
}) {
  const [selection, setSelection] = useState<ChatSelection | undefined>(() => {
    const projectChannel = workspace.channels.find(
      (channel) => channel.kind === "project" && channel.projectId === projectId,
    );
    if (projectChannel) return { kind: "channel", id: projectChannel.id };
    const general = workspace.channels.find((channel) => channel.kind === "general");
    return general ? { kind: "channel", id: general.id } : undefined;
  });
  const selectChannel = useCallback((id: string) => {
    setSelection({ kind: "channel", id });
  }, []);
  const selectDirect = useCallback((id: string) => {
    setSelection({ kind: "direct", id });
  }, []);
  const selectedChannel =
    selection?.kind === "channel"
      ? workspace.channels.find((channel) => channel.id === selection.id)
      : undefined;
  const selectedMember =
    selection?.kind === "direct"
      ? workspace.members.find(
          (member) => member.id === selection.id && member.id !== workspace.currentMemberId,
        )
      : undefined;
  const generalChannels = workspace.channels.filter((channel) => channel.kind === "general");
  const projectChannels = workspace.channels.filter((channel) => channel.kind === "project");
  const others = workspace.members.filter((member) => member.id !== workspace.currentMemberId);
  const teamMembers = others.filter((member) => member.role !== "Volunteer");
  const volunteers = others.filter((member) => member.role === "Volunteer");
  const conversation = useMemo(() => {
    if (selectedChannel) {
      return { kind: "channel", id: selectedChannel.id } satisfies ConversationTarget;
    }
    if (selectedMember) {
      return { kind: "direct", id: selectedMember.id } satisfies ConversationTarget;
    }
    return undefined;
  }, [selectedChannel, selectedMember]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-background sm:flex-row">
      <aside className="flex shrink-0 flex-col border-b sm:w-64 sm:border-r sm:border-b-0">
        <h2 className="flex h-16 items-center px-5 font-semibold">Chat</h2>
        <ScrollArea className="min-h-0 flex-1">
          <nav className="flex flex-col gap-1 px-3 pb-4" aria-label="Conversations">
            {generalChannels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                selected={selection?.kind === "channel" && selection.id === channel.id}
                onSelect={selectChannel}
              />
            ))}
            <Collapsible defaultOpen={Boolean(projectId)} className="mt-3">
              <CollapsibleTrigger className="w-full">
                <SectionLabel icon={Folder} label="Projects" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col gap-0.5 pt-1 pl-8 text-muted-foreground">
                  {projectChannels.map((channel) => (
                    <ChannelItem
                      key={channel.id}
                      channel={channel}
                      selected={selection?.kind === "channel" && selection.id === channel.id}
                      onSelect={selectChannel}
                      nested
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
            <Collapsible defaultOpen className="mt-3">
              <CollapsibleTrigger className="w-full">
                <SectionLabel icon={MessageSquare} label="Direct messages" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col gap-1 pt-1">
                  {teamMembers.length > 0 && (
                    <p className="px-2 pt-1 text-xs font-medium text-muted-foreground">Team</p>
                  )}
                  {teamMembers.map((member) => (
                    <DirectItem
                      key={member.id}
                      member={member}
                      selected={selection?.kind === "direct" && selection.id === member.id}
                      onSelect={selectDirect}
                    />
                  ))}
                  {volunteers.length > 0 && (
                    <p className="px-2 pt-2 text-xs font-medium text-muted-foreground">
                      Volunteers
                    </p>
                  )}
                  {volunteers.map((member) => (
                    <DirectItem
                      key={member.id}
                      member={member}
                      selected={selection?.kind === "direct" && selection.id === member.id}
                      onSelect={selectDirect}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </nav>
        </ScrollArea>
      </aside>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        {conversation ? (
          <>
            <header className="flex h-16 shrink-0 items-center gap-3 border-b px-5">
              {selectedMember ? (
                <>
                  <MemberAvatar member={selectedMember} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{selectedMember.name}</div>
                    <div className="truncate text-xs font-normal text-muted-foreground">
                      {selectedMember.role}
                    </div>
                  </div>
                </>
              ) : (
                selectedChannel && (
                  <>
                    {selectedChannel.kind === "project" ? (
                      <Folder className="size-4 text-muted-foreground" />
                    ) : (
                      <Hash className="size-4 text-muted-foreground" />
                    )}
                    <span className="truncate font-semibold">{selectedChannel.name}</span>
                  </>
                )
              )}
            </header>
            <div className="min-h-0 flex-1">
              <Conversation workspace={workspace} conversation={conversation} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Choose a conversation.
          </div>
        )}
      </section>
    </div>
  );
}
