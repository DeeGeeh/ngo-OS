import { CalendarDays, FolderOpen, Flag } from "lucide-react";

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  memberPortrait,
  priorities,
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
      <AvatarFallback>
        {member.name
          .split(" ")
          .map((part) => part[0])
          .join("")}
      </AvatarFallback>
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
  return (
    <AvatarGroup>
      {workspace.members
        .filter((member) => assigneeIds.includes(member.id))
        .map((member) => (
          <MemberAvatar key={member.id} member={member} />
        ))}
    </AvatarGroup>
  );
}

export function TaskCard({ task, workspace }: { task: Task; workspace: Workspace }) {
  const project = workspace.projects.find((item) => item.id === task.projectId);
  const priority = priorities.find((item) => item.id === task.priority);
  return (
    <>
      <CardHeader>
        <CardTitle>{task.title}</CardTitle>
      </CardHeader>
      {(project || (priority && task.priority !== "normal") || task.tags[0]) && (
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {project && <Badge variant="secondary">{project.title}</Badge>}
            {priority && task.priority !== "normal" && (
              <Badge variant={task.priority === "urgent" ? "destructive" : "outline"}>
                <Flag data-icon="inline-start" />
                {priority.label}
              </Badge>
            )}
            {task.tags[0] && <Badge variant="outline">{task.tags[0]}</Badge>}
          </div>
        </CardContent>
      )}
      <CardFooter className="justify-between">
        <AssigneeAvatars workspace={workspace} assigneeIds={task.assigneeIds} />
        {task.dueDate && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {dateFormat.format(new Date(`${task.dueDate}T12:00:00Z`))}
          </span>
        )}
      </CardFooter>
    </>
  );
}

export function ProjectCard({ project, workspace }: { project: Project; workspace: Workspace }) {
  const tasks = workspace.tasks.filter((task) => task.projectId === project.id);
  return (
    <div className="relative pt-3">
      <div
        aria-hidden="true"
        className="absolute top-1 right-3 left-8 h-4 rounded-t-md bg-muted ring-1 ring-foreground/10"
      />
      <div className="relative">
        <div className="absolute -top-3 left-2 z-10 flex items-center gap-1 rounded-t-lg bg-secondary px-2.5 py-1 text-xs font-medium">
          <FolderOpen className="size-3.5" />
          Folder
        </div>
        <div className="relative z-10 flex flex-col gap-2 rounded-xl rounded-tl-sm bg-secondary px-3 py-3 ring-1 ring-foreground/10">
          <p className="font-medium leading-snug">{project.title}</p>
          <div className="flex items-center justify-between gap-2 text-muted-foreground">
            <span>
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
            </span>
            <AssigneeAvatars workspace={workspace} assigneeIds={project.assigneeIds} />
          </div>
        </div>
      </div>
    </div>
  );
}
