import { CalendarDays, Folder, MessageSquare } from "lucide-react";

import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type Project, type Task, type Workspace } from "@/lib/workspace";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

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
          <Avatar key={member.id} size="sm" title={member.name}>
            <AvatarFallback>
              {member.name
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
        ))}
    </AvatarGroup>
  );
}

export function TaskCard({ task, workspace }: { task: Task; workspace: Workspace }) {
  const project = workspace.projects.find((item) => item.id === task.projectId);
  const messageCount = workspace.messages.filter(
    (message) => message.conversation.kind === "task" && message.conversation.id === task.id,
  ).length;
  return (
    <>
      <CardHeader>
        <CardTitle>{task.title}</CardTitle>
      </CardHeader>
      {project && (
        <CardContent>
          <Badge variant="secondary">
            <Folder data-icon="inline-start" />
            {project.title}
          </Badge>
        </CardContent>
      )}
      <CardFooter className="justify-between">
        <AssigneeAvatars workspace={workspace} assigneeIds={task.assigneeIds} />
        <div className="flex items-center gap-3 text-muted-foreground">
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              {dateFormat.format(new Date(`${task.dueDate}T12:00:00Z`))}
            </span>
          )}
          {messageCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3.5" />
              {messageCount}
            </span>
          )}
        </div>
      </CardFooter>
    </>
  );
}

export function ProjectCard({ project, workspace }: { project: Project; workspace: Workspace }) {
  const tasks = workspace.tasks.filter((task) => task.projectId === project.id);
  const completed = tasks.filter((task) => task.status === "done").length;
  return (
    <>
      <CardHeader>
        <Badge variant="outline" className="w-fit">
          <Folder data-icon="inline-start" />
          Project
        </Badge>
        <CardTitle>{project.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span>
              {completed}/{tasks.length} tasks
            </span>
            <AssigneeAvatars workspace={workspace} assigneeIds={project.assigneeIds} />
          </div>
          <Progress
            value={tasks.length ? (completed / tasks.length) * 100 : 0}
            aria-label={`${project.title} progress`}
          />
        </div>
      </CardContent>
      {project.dueDate && (
        <CardFooter>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4" />
            {dateFormat.format(new Date(`${project.dueDate}T12:00:00Z`))}
          </div>
        </CardFooter>
      )}
    </>
  );
}
