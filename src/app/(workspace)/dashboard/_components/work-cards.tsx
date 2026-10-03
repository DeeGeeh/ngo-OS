"use client";

import { CalendarDays, CheckCircle2, Flag, FolderOpen, ListChecks } from "lucide-react";

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToday } from "@/hooks/use-today";
import { cn } from "@/lib/utils";
import {
  memberPortrait,
  priorityMeta,
  type Member,
  type Project,
  type Task,
  type Workspace,
} from "@/lib/workspace";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

export function MemberAvatar({
  member,
  size = "sm",
}: {
  member: Member;
  size?: "sm" | "default" | "lg";
}) {
  const portrait = memberPortrait(member);
  return (
    <Avatar size={size} title={member.name}>
      {portrait && <AvatarImage src={portrait} alt={member.name} />}
      <AvatarFallback>{initials(member.name)}</AvatarFallback>
    </Avatar>
  );
}

export function AssigneeAvatars({
  workspace,
  assigneeIds,
}: {
  workspace: Workspace;
  assigneeIds: string[];
}) {
  const people = workspace.members.filter((member) => assigneeIds.includes(member.id));
  if (people.length === 0) {
    return <span className="text-xs text-muted-foreground">Unassigned</span>;
  }
  return (
    <AvatarGroup>
      {people.map((member) => (
        <MemberAvatar key={member.id} member={member} />
      ))}
    </AvatarGroup>
  );
}

export function PriorityFlag({ priority }: { priority: Task["priority"] }) {
  const meta = priorityMeta[priority];
  return (
    <span
      className={cn("flex items-center gap-1 text-xs font-medium", meta.color)}
      title={`${meta.label} priority`}
    >
      <Flag className={cn("size-3.5", meta.filled && "fill-current")} />
      {meta.label}
    </span>
  );
}

function DueDate({ dueDate, done }: { dueDate: string; done: boolean }) {
  const today = useToday();
  const overdue = today !== null && !done && dueDate < today;
  const dueToday = today !== null && !done && dueDate === today;
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs tabular-nums",
        overdue && "bg-destructive/10 font-medium text-destructive",
        dueToday && "bg-primary/10 font-medium text-primary",
        !overdue && !dueToday && "text-muted-foreground",
      )}
      title={overdue ? "Overdue" : dueToday ? "Due today" : "Due date"}
    >
      <CalendarDays className="size-3.5" />
      {dateFormat.format(new Date(`${dueDate}T12:00:00Z`))}
    </span>
  );
}

export function TaskCard({ task, workspace }: { task: Task; workspace: Workspace }) {
  const project = workspace.projects.find((item) => item.id === task.projectId);
  const done = task.status === "done";
  return (
    <Card size="sm">
      <CardContent>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "text-sm leading-snug font-medium",
                done && "text-muted-foreground line-through",
              )}
            >
              {task.title}
            </p>
            {done && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />}
          </div>
          {(project || task.tags.length > 0 || task.subtasks.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {project && (
                <Badge variant="secondary">
                  <FolderOpen data-icon="inline-start" />
                  {project.title}
                </Badge>
              )}
              {task.subtasks.length > 0 && (
                <Badge variant="outline">
                  <ListChecks data-icon="inline-start" />
                  {task.subtasks.filter((subtask) => subtask.done).length}/{task.subtasks.length}
                </Badge>
              )}
              {task.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <AssigneeAvatars workspace={workspace} assigneeIds={task.assigneeIds} />
        <div className="flex shrink-0 items-center gap-2">
          {task.priority !== "normal" && <PriorityFlag priority={task.priority} />}
          {task.dueDate && <DueDate dueDate={task.dueDate} done={done} />}
        </div>
      </CardFooter>
    </Card>
  );
}

export function ProjectCard({ project, workspace }: { project: Project; workspace: Workspace }) {
  const tasks = workspace.tasks.filter((task) => task.projectId === project.id);
  const complete = tasks.filter((task) => task.status === "done").length;
  const percent = tasks.length === 0 ? 0 : Math.round((complete / tasks.length) * 100);
  return (
    <div className="flex flex-col">
      <div className="relative z-10 -mb-px flex w-fit items-center gap-1.5 rounded-t-lg border border-b-0 border-foreground/10 bg-secondary px-2.5 pt-1 pb-1.5 text-xs font-medium">
        <FolderOpen className="size-3.5" />
        Project
      </div>
      <div className="flex flex-col gap-3 rounded-xl rounded-tl-none border border-foreground/10 bg-secondary px-3.5 py-3">
        <p className="text-sm leading-snug font-semibold">{project.title}</p>
        {tasks.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ListChecks className="size-3.5" />
                {complete} of {tasks.length} done
              </span>
              <span className="tabular-nums">{percent}%</span>
            </div>
            <Progress value={percent} />
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <AssigneeAvatars workspace={workspace} assigneeIds={project.assigneeIds} />
          {project.dueDate && (
            <DueDate dueDate={project.dueDate} done={project.status === "done"} />
          )}
        </div>
      </div>
    </div>
  );
}
