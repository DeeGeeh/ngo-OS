"use client";

import {
  ArrowUp,
  CalendarDays,
  ChevronRight,
  FolderOpen,
  Hash,
  ListChecks,
  Sparkles,
  Ticket,
} from "lucide-react";
import {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import { useToday } from "@/hooks/use-today";
import type { LumaCalendar } from "@/lib/luma";
import { cn } from "@/lib/utils";
import type { Task, Workspace } from "@/lib/workspace";

import { MemberAvatar } from "./work-cards";

const suggestions = [
  "What should we focus on this week?",
  "Who could help at the Founder Night check-in?",
  "Summarize what is blocking Campus Builders",
];

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const eventDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Helsinki",
});
const longDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

type HomeScreenProps = {
  workspace: Workspace;
  luma: LumaCalendar;
  organizationName: string;
  unread: Record<string, number>;
  onAsk: (prompt: string) => void;
  onOpenChannel: (channelId: string) => void;
  onTask: (id: string) => void;
  onProject: (id: string) => void;
};

function Suggestion({ text, onAsk }: { text: string; onAsk: (prompt: string) => void }) {
  const ask = useCallback(() => onAsk(text), [onAsk, text]);
  return (
    <Button variant="outline" size="sm" onClick={ask}>
      {text}
    </Button>
  );
}

function AskBox({
  organizationName,
  onAsk,
}: {
  organizationName: string;
  onAsk: (prompt: string) => void;
}) {
  const [text, setText] = useState("");
  const submit = useCallback(
    (event?: FormEvent) => {
      event?.preventDefault();
      const prompt = text.trim();
      if (prompt) onAsk(prompt);
    },
    [onAsk, text],
  );
  const change = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => setText(event.target.value),
    [],
  );
  const keyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) submit(event);
    },
    [submit],
  );
  return (
    <section className="flex flex-col items-center gap-5 text-center" aria-label="Ask the agent">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="size-5" />
      </span>
      <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
        How can I help you, {organizationName}?
      </h2>
      <form onSubmit={submit} className="w-full max-w-2xl">
        <div className="rounded-xl bg-card shadow-md">
          <InputGroup>
            <InputGroupTextarea
              value={text}
              onChange={change}
              onKeyDown={keyDown}
              rows={2}
              placeholder="Ask about projects, volunteers, sponsors or events…"
              aria-label="Message the agent"
            />
            <InputGroupAddon align="block-end">
              <InputGroupButton
                type="submit"
                variant="default"
                size="icon-sm"
                className="ml-auto"
                disabled={!text.trim()}
                aria-label="Send to the agent"
              >
                <ArrowUp />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </form>
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion) => (
          <Suggestion key={suggestion} text={suggestion} onAsk={onAsk} />
        ))}
      </div>
    </section>
  );
}

function UnreadNotice({
  workspace,
  unread,
  onOpenChannel,
}: {
  workspace: Workspace;
  unread: Record<string, number>;
  onOpenChannel: (channelId: string) => void;
}) {
  const channelId = Object.keys(unread)[0];
  const open = useCallback(() => {
    if (channelId) onOpenChannel(channelId);
  }, [channelId, onOpenChannel]);
  if (!channelId) return null;
  const channel = workspace.channels.find((item) => item.id === channelId);
  const latest = workspace.messages
    .filter(
      (message) => message.conversation.kind === "channel" && message.conversation.id === channelId,
    )
    .toSorted((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  const author = workspace.members.find((member) => member.id === latest?.authorId);
  return (
    <button
      type="button"
      onClick={open}
      className="group mx-auto flex w-full max-w-2xl items-center gap-3 rounded-full border bg-card/60 py-1.5 pr-3 pl-1.5 text-left text-sm shadow-xs transition-colors outline-none hover:bg-card focus-visible:ring-2 focus-visible:ring-ring"
    >
      {author ? (
        <MemberAvatar member={author} />
      ) : (
        <Hash className="size-4 text-muted-foreground" />
      )}
      <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-muted-foreground">
        <span className="font-medium text-foreground">
          {unread[channelId]} unread in #{channel?.name ?? channelId}
        </span>
        {latest && (
          <>
            {" · "}
            {author?.name.split(" ")[0]}: {latest.text}
          </>
        )}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border bg-card px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
      <span className="truncate text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

function RowButton({
  id,
  onOpen,
  children,
}: {
  id: string;
  onOpen: (id: string) => void;
  children: React.ReactNode;
}) {
  const open = useCallback(() => onOpen(id), [id, onOpen]);
  return (
    <button
      type="button"
      onClick={open}
      className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function subtaskProgress(task: Task) {
  if (task.subtasks.length === 0) return null;
  return Math.round(
    (task.subtasks.filter((subtask) => subtask.done).length / task.subtasks.length) * 100,
  );
}

export function HomeScreen({
  workspace,
  luma,
  organizationName,
  unread,
  onAsk,
  onOpenChannel,
  onTask,
  onProject,
}: HomeScreenProps) {
  const today = useToday();
  const me = workspace.members.find((member) => member.id === workspace.currentMemberId);
  const openTasks = workspace.tasks.filter((task) => task.status !== "done");
  const inProgress = workspace.tasks.filter((task) => task.status === "doing");
  const team = useMemo(
    () =>
      workspace.members.map((member) => {
        const current = workspace.tasks
          .filter((task) => task.status === "doing" && task.assigneeIds.includes(member.id))
          .toSorted((left, right) =>
            (left.dueDate ?? "9999").localeCompare(right.dueDate ?? "9999"),
          )[0];
        const next = workspace.tasks
          .filter((task) => task.status === "todo" && task.assigneeIds.includes(member.id))
          .toSorted((left, right) =>
            (left.dueDate ?? "9999").localeCompare(right.dueDate ?? "9999"),
          )[0];
        return { member, task: current ?? next, active: Boolean(current) };
      }),
    [workspace],
  );
  const dueSoon = useMemo(
    () =>
      openTasks
        .filter((task) => task.dueDate)
        .toSorted((left, right) => (left.dueDate ?? "").localeCompare(right.dueDate ?? ""))
        .slice(0, 5),
    [openTasks],
  );
  const upcoming = useMemo(
    () =>
      luma.events
        .filter((event) => event.endAt >= `${today ?? "2026-10-03"}T00:00:00.000Z`)
        .toSorted((left, right) => left.startAt.localeCompare(right.startAt))
        .slice(0, 3),
    [luma.events, today],
  );
  const nextEvent = upcoming[0];
  const nextGoing =
    nextEvent?.guests.filter((guest) => guest.approvalStatus === "approved").length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 lg:p-8">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          {today ? longDate.format(new Date(`${today}T12:00:00Z`)) : " "}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">
          Welcome back{me ? `, ${me.name.split(" ")[0]}` : ""}
        </h1>
      </div>

      <div className="flex flex-col gap-4 py-6">
        <AskBox organizationName={organizationName} onAsk={onAsk} />
        <UnreadNotice workspace={workspace} unread={unread} onOpenChannel={onOpenChannel} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Open tasks"
          value={String(openTasks.length)}
          hint={`${inProgress.length} in progress`}
        />
        <Stat
          label="Projects"
          value={String(workspace.projects.length)}
          hint={workspace.projects.map((project) => project.title).join(" · ")}
        />
        <Stat
          label="Next event"
          value={String(nextGoing)}
          hint={nextEvent ? `going to ${nextEvent.name}` : "No upcoming events"}
        />
        <Stat
          label="Team members"
          value={String(workspace.members.length)}
          hint={`${team.filter((row) => row.active).length} working on something now`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Team right now</CardTitle>
            <CardDescription>What everyone is working on from the board</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              {team.map(({ member, task, active }) => {
                const progress = task ? subtaskProgress(task) : null;
                const row = (
                  <>
                    <MemberAvatar member={member} size="default" />
                    <span className="flex w-28 shrink-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {member.name.split(" ")[0]}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">{member.role}</span>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-center gap-2 text-sm">
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            active ? "bg-chart-2" : "bg-muted-foreground/40",
                          )}
                          aria-hidden="true"
                        />
                        <span className={cn("truncate", !task && "text-muted-foreground")}>
                          {task ? task.title : "Nothing assigned"}
                        </span>
                      </span>
                      {task && (
                        <span className="pl-3.5 text-xs text-muted-foreground">
                          {active ? "In progress" : "Up next"}
                          {progress !== null && ` · ${progress}% of subtasks`}
                        </span>
                      )}
                    </span>
                    {progress !== null && (
                      <Progress value={progress} className="hidden w-20 shrink-0 sm:flex" />
                    )}
                  </>
                );
                return task ? (
                  <RowButton key={member.id} id={task.id} onOpen={onTask}>
                    {row}
                  </RowButton>
                ) : (
                  <div key={member.id} className="flex items-center gap-3 px-2 py-2">
                    {row}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Due soon</CardTitle>
            <CardDescription>Open tasks with the nearest deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              {dueSoon.map((task) => {
                const overdue = today !== null && task.dueDate !== null && task.dueDate < today;
                return (
                  <RowButton key={task.id} id={task.id} onOpen={onTask}>
                    <span
                      className={cn(
                        "flex w-14 shrink-0 items-center gap-1 text-xs tabular-nums",
                        overdue ? "font-medium text-destructive" : "text-muted-foreground",
                      )}
                    >
                      <CalendarDays className="size-3.5" />
                      {task.dueDate && shortDate.format(new Date(`${task.dueDate}T12:00:00Z`))}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
                  </RowButton>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Progress across active projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              {workspace.projects.map((project) => {
                const tasks = workspace.tasks.filter((task) => task.projectId === project.id);
                const done = tasks.filter((task) => task.status === "done").length;
                const percent = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);
                return (
                  <RowButton key={project.id} id={project.id} onOpen={onProject}>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <FolderOpen className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium">{project.title}</span>
                        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                          <ListChecks className="size-3.5" />
                          {done}/{tasks.length}
                        </span>
                      </span>
                      <Progress value={percent} />
                    </span>
                  </RowButton>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming events</CardTitle>
            <CardDescription>From the Luma calendar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {upcoming.map((event) => {
                const going = event.guests.filter(
                  (guest) => guest.approvalStatus === "approved",
                ).length;
                return (
                  <div key={event.apiId} className="flex items-center gap-3 px-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Ticket className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{event.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {eventDate.format(new Date(event.startAt))} · {going} going
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
