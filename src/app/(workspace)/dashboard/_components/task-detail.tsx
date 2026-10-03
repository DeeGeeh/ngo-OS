"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Circle, Flag, Tag, UserRound } from "lucide-react";
import { useCallback, useMemo, useState, type ChangeEvent, type ReactNode } from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  priorities,
  workStatuses,
  workTags,
  workspaceQueryKey,
  type Priority,
  type Task,
  type UpdateTask,
  type Workspace,
  type WorkStatus,
  type WorkTag,
} from "@/lib/workspace";

import { updateTaskAction } from "../actions";
import { Conversation } from "./conversation";
import { MemberAvatar } from "./work-cards";

const statusItems = workStatuses.map((status) => ({ value: status.id, label: status.label }));
const priorityItems = priorities.map((priority) => ({ value: priority.id, label: priority.label }));
const tagItems = workTags.map((tag) => ({ value: tag, label: tag }));

function isTag(value: string): value is WorkTag {
  return workTags.some((tag) => tag === value);
}

function Property({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof Flag;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex w-28 shrink-0 items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function TaskDetail({ task, workspace }: { task: Task; workspace: Workspace }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const queryClient = useQueryClient();
  const conversation = useMemo(() => ({ kind: "task" as const, id: task.id }), [task.id]);
  const members = useMemo(
    () => workspace.members.map((member) => ({ value: member.id, label: member.name })),
    [workspace.members],
  );
  const save = useMutation({
    mutationFn: updateTaskAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceQueryKey }),
  });
  const { mutate } = save;
  const persist = useCallback(
    (changes: Omit<UpdateTask, "id">) => mutate({ id: task.id, ...changes }),
    [mutate, task.id],
  );
  const changeTitle = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  }, []);
  const saveTitle = useCallback(() => {
    const next = title.trim();
    if (next && next !== task.title) persist({ title: next });
  }, [persist, task.title, title]);
  const changeDescription = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  }, []);
  const saveDescription = useCallback(() => {
    if (description !== task.description) persist({ description });
  }, [description, persist, task.description]);
  const changeStatus = useCallback(
    (value: WorkStatus | null) => {
      if (value && value !== task.status) persist({ status: value });
    },
    [persist, task.status],
  );
  const changePriority = useCallback(
    (value: Priority | null) => {
      if (value && value !== task.priority) persist({ priority: value });
    },
    [persist, task.priority],
  );
  const changeAssignees = useCallback(
    (value: string[]) => persist({ assigneeIds: value }),
    [persist],
  );
  const changeTags = useCallback(
    (value: string[]) => persist({ tags: value.filter(isTag) }),
    [persist],
  );
  const changeDate = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const dueDate = event.target.value || null;
      if (dueDate !== task.dueDate) persist({ dueDate });
    },
    [persist, task.dueDate],
  );
  const assigneeLabel = useCallback(
    (value: string[]) => {
      const people = workspace.members.filter((member) => value.includes(member.id));
      if (people.length === 0) return "Empty";
      if (people.length === 1) return people[0]?.name ?? "Empty";
      return `${people.length} people`;
    },
    [workspace.members],
  );

  return (
    <div className="grid max-h-dvh md:grid-cols-3">
      <div className="flex flex-col gap-6 overflow-y-auto p-6 md:col-span-2">
        <Input
          value={title}
          onChange={changeTitle}
          onBlur={saveTitle}
          aria-label="Task name"
          maxLength={160}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Property label="Status" icon={Circle}>
            <Select items={statusItems} value={task.status} onValueChange={changeStatus}>
              <SelectTrigger className="w-full" aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {statusItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Property>
          <Property label="Assignees" icon={UserRound}>
            <Select
              items={members}
              multiple
              value={task.assigneeIds}
              onValueChange={changeAssignees}
            >
              <SelectTrigger className="w-full" aria-label="Assignees">
                <SelectValue>{assigneeLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {workspace.members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <MemberAvatar member={member} />
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Property>
          <Property label="Date" icon={CalendarDays}>
            <Input
              type="date"
              aria-label="Due date"
              defaultValue={task.dueDate ?? ""}
              onChange={changeDate}
            />
          </Property>
          <Property label="Priority" icon={Flag}>
            <Select items={priorityItems} value={task.priority} onValueChange={changePriority}>
              <SelectTrigger className="w-full" aria-label="Priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {priorityItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Property>
          <div className="sm:col-span-2">
            <Property label="Tags" icon={Tag}>
              <Select items={tagItems} multiple value={task.tags} onValueChange={changeTags}>
                <SelectTrigger className="w-full" aria-label="Tags">
                  <SelectValue>
                    {(value: string[]) => (value.length ? value.join(", ") : "Empty")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {workTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Property>
          </div>
        </div>
        <Textarea
          value={description}
          onChange={changeDescription}
          onBlur={saveDescription}
          aria-label="Description"
          placeholder="Add description"
          maxLength={5000}
          rows={5}
        />
        {save.error && (
          <Alert variant="destructive">
            <AlertTitle>{save.error.message}</AlertTitle>
          </Alert>
        )}
      </div>
      <aside className="flex min-h-96 flex-col border-t md:min-h-0 md:border-t-0 md:border-l">
        <h2 className="px-4 pt-4 font-medium">Activity</h2>
        <Conversation workspace={workspace} conversation={conversation} />
      </aside>
    </div>
  );
}
