"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Folder,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import {
  projectFormats,
  workStatuses,
  workspaceQueryKey,
  type Project,
  type Task,
  type UpdateTask,
  type Workspace,
} from "@/lib/workspace";

import { updateTaskAction } from "../actions";
import { AssigneeAvatars } from "./work-cards";
import { WorkEditor } from "./work-editor";
import { Conversation } from "./conversation";
import { TelegramProjectControls } from "./telegram-project-controls";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function SetupCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Icon className="size-4" />
            {title}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

type ProjectDetailProps = {
  project: Project;
  workspace: Workspace;
  onBack: () => void;
  onTask: (id: string) => void;
  onNewTask: (projectId: string) => void;
};

export function ProjectDetail({
  project,
  workspace,
  onBack,
  onTask,
  onNewTask,
}: ProjectDetailProps) {
  const [editing, setEditing] = useState(false);
  const [registered, setRegistered] = useState(false);
  const queryClient = useQueryClient();
  const tasks = workspace.tasks.filter((task) => task.projectId === project.id);
  const channel = workspace.channels.find(
    (item) => item.kind === "project" && item.projectId === project.id,
  );
  const conversation = useMemo(
    () => (channel ? { kind: "channel" as const, id: channel.id } : undefined),
    [channel],
  );
  const updateTask = useMutation({
    mutationFn: updateTaskAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceQueryKey }),
  });

  const openEditor = useCallback(() => setEditing(true), []);
  const closeEditor = useCallback(() => setEditing(false), []);
  const addTask = useCallback(() => onNewTask(project.id), [onNewTask, project.id]);
  const toggleRegistration = useCallback(() => setRegistered((value) => !value), []);
  const formatLabel = projectFormats.find((item) => item.id === project.format)?.label;

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          Board
        </Button>
        <Button variant="outline" onClick={openEditor}>
          <Pencil data-icon="inline-start" />
          Edit project
        </Button>
      </div>
      <div className="flex flex-col">
        <div className="z-10 flex w-fit items-center gap-2 rounded-t-xl border border-b-0 border-foreground/10 bg-muted px-4 py-2 text-sm font-medium">
          <Folder className="size-4" />
          Project
        </div>
        <div className="-mt-px flex flex-col gap-8 rounded-xl rounded-tl-none border border-foreground/10 bg-muted p-6 lg:p-8">
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-3xl font-semibold tracking-tight">{project.title}</h1>
              <div className="flex items-center gap-3">
                <AssigneeAvatars workspace={workspace} assigneeIds={project.assigneeIds} />
                <Badge variant="secondary">
                  {workStatuses.find((status) => status.id === project.status)?.label}
                </Badge>
              </div>
            </div>
            {project.description && (
              <p className="max-w-3xl text-muted-foreground">{project.description}</p>
            )}
          </header>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Project setup">
            <SetupCard title="Date" icon={CalendarDays}>
              {project.dueDate
                ? dateFormat.format(new Date(`${project.dueDate}T12:00:00Z`))
                : "Not set"}
            </SetupCard>
            <SetupCard title="Place" icon={MapPin}>
              {project.location || "Not set"}
            </SetupCard>
            <SetupCard title="Format" icon={Ticket}>
              {formatLabel}
            </SetupCard>
            <SetupCard title="Capacity" icon={Users}>
              {project.capacity ? `${project.capacity} people` : "Not set"}
            </SetupCard>
          </section>
          <div className="grid gap-8 xl:grid-cols-3">
            <section className="flex flex-col gap-6 xl:col-span-2" aria-label="Project tasks">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">
                  Tasks <span className="text-muted-foreground">{tasks.length}</span>
                </h2>
                <Button variant="outline" onClick={addTask}>
                  <Plus data-icon="inline-start" />
                  Add task
                </Button>
              </div>
              {updateTask.error && (
                <Alert variant="destructive">
                  <AlertTitle>{updateTask.error.message}</AlertTitle>
                </Alert>
              )}
              <div className="flex flex-col gap-3">
                {tasks.map((task) => (
                  <ProjectTaskRow
                    key={task.id}
                    task={task}
                    workspace={workspace}
                    onTask={onTask}
                    onToggle={updateTask.mutate}
                    pending={updateTask.isPending}
                  />
                ))}
                {tasks.length === 0 && (
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No tasks yet</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                )}
              </div>
              <Separator />
              <TelegramProjectControls project={project} workspace={workspace} />
              <Separator />
              <Card>
                <CardHeader>
                  <CardTitle>
                    <div className="flex items-center gap-2">
                      <Ticket className="size-5" />
                      Luma
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-semibold">{project.title}</h3>
                    <div className="flex flex-col gap-2 text-sm">
                      <span className="flex items-center gap-2">
                        <CalendarDays className="size-4" />
                        {project.dueDate ?? "Date to be announced"}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="size-4" />
                        {project.location || "Location to be announced"}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="w-fit">
                          Free admission
                        </Badge>
                        {formatLabel && (
                          <Badge variant="outline" className="w-fit">
                            {formatLabel}
                          </Badge>
                        )}
                        {project.capacity && (
                          <Badge variant="outline" className="w-fit">
                            {project.capacity} spots
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={toggleRegistration}
                      variant={registered ? "outline" : "default"}
                    >
                      {registered ? "Registered · Cancel" : "Register"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
            <section className="flex min-h-96 flex-col gap-4" aria-label="Project discussion">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <MessageSquare className="size-5" />
                Project chat
              </h2>
              {conversation && <Conversation workspace={workspace} conversation={conversation} />}
            </section>
          </div>
        </div>
      </div>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          <WorkEditor
            kind="project"
            project={project}
            workspace={workspace}
            onSaved={closeEditor}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectTaskRow({
  task,
  workspace,
  onTask,
  onToggle,
  pending,
}: {
  task: Task;
  workspace: Workspace;
  onTask: (id: string) => void;
  onToggle: (input: UpdateTask) => void;
  pending: boolean;
}) {
  const toggle = useCallback(
    (checked: boolean) => onToggle({ id: task.id, status: checked ? "done" : "todo" }),
    [onToggle, task.id],
  );
  const open = useCallback(() => onTask(task.id), [onTask, task.id]);
  return (
    <div className="flex items-center gap-3">
      <Checkbox
        aria-label={`Mark ${task.title} ${task.status === "done" ? "to do" : "done"}`}
        checked={task.status === "done"}
        disabled={pending}
        onCheckedChange={toggle}
      />
      <Button
        variant="ghost"
        onClick={open}
        className="h-auto flex-1 justify-start text-left whitespace-normal"
      >
        {task.title}
      </Button>
      <AssigneeAvatars workspace={workspace} assigneeIds={task.assigneeIds} />
    </div>
  );
}
