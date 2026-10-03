"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Circle,
  CircleCheck,
  Flag,
  ListChecks,
  Plus,
  Tag,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  priorities,
  workStatuses,
  workTags,
  workspaceQueryKey,
  type Priority,
  type Subtask,
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

function SubtaskRow({
  subtask,
  onToggle,
  onRemove,
}: {
  subtask: Subtask;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const toggle = useCallback(() => onToggle(subtask.id), [onToggle, subtask.id]);
  const remove = useCallback(() => onRemove(subtask.id), [onRemove, subtask.id]);
  return (
    <div className="group/subtask flex items-center gap-2 rounded-lg border bg-card p-1 pr-1 pl-2.5 transition-colors hover:border-ring hover:bg-accent">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={subtask.done}
        className="flex min-w-0 flex-1 items-center gap-2.5 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {subtask.done ? (
          <CircleCheck className="size-4 shrink-0 text-primary" />
        ) : (
          <Circle className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span
          className={cn("truncate text-sm", subtask.done && "text-muted-foreground line-through")}
        >
          {subtask.title}
        </span>
      </button>
      <span className="opacity-0 group-hover/subtask:opacity-100 focus-within:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Remove subtask ${subtask.title}`}
          onClick={remove}
        >
          <Trash2 />
        </Button>
      </span>
    </div>
  );
}

function SubtaskList({ task, onChange }: { task: Task; onChange: (next: Subtask[]) => void }) {
  const [draft, setDraft] = useState("");
  const done = task.subtasks.filter((subtask) => subtask.done).length;
  const percent = task.subtasks.length === 0 ? 0 : Math.round((done / task.subtasks.length) * 100);

  const toggle = useCallback(
    (id: string) =>
      onChange(
        task.subtasks.map((subtask) =>
          subtask.id === id ? { ...subtask, done: !subtask.done } : subtask,
        ),
      ),
    [onChange, task.subtasks],
  );
  const remove = useCallback(
    (id: string) => onChange(task.subtasks.filter((subtask) => subtask.id !== id)),
    [onChange, task.subtasks],
  );
  const changeDraft = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setDraft(event.target.value),
    [],
  );
  const add = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const title = draft.trim();
      if (!title) return;
      onChange([...task.subtasks, { id: crypto.randomUUID(), title, done: false }]);
      setDraft("");
    },
    [draft, onChange, task.subtasks],
  );

  return (
    <section className="flex flex-col gap-2.5" aria-label="Subtasks">
      <div className="flex items-center gap-2">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <ListChecks className="size-4 text-muted-foreground" />
          Subtasks
        </h3>
        {task.subtasks.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
            {done}/{task.subtasks.length}
          </span>
        )}
        {task.subtasks.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">{percent}%</span>
        )}
      </div>
      {task.subtasks.length > 0 && <Progress value={percent} />}
      <div className="flex flex-col gap-1.5">
        {task.subtasks.map((subtask) => (
          <SubtaskRow key={subtask.id} subtask={subtask} onToggle={toggle} onRemove={remove} />
        ))}
      </div>
      <form onSubmit={add} className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={changeDraft}
          aria-label="New subtask"
          placeholder="Add a subtask"
          maxLength={160}
        />
        <Button type="submit" variant="outline" disabled={draft.trim().length === 0}>
          <Plus data-icon="inline-start" />
          Add
        </Button>
      </form>
    </section>
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
  const changeSubtasks = useCallback((subtasks: Subtask[]) => persist({ subtasks }), [persist]);
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
        <SubtaskList task={task} onChange={changeSubtasks} />
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
