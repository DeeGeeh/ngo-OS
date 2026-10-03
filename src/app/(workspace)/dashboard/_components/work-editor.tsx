"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState, type FormEvent } from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  createProjectSchema,
  createTaskSchema,
  priorities,
  projectFormats,
  workStatuses,
  workTags,
  workspaceQueryKey,
  type Priority,
  type Project,
  type ProjectFormat,
  type Task,
  type Workspace,
  type WorkStatus,
  type WorkTag,
} from "@/lib/workspace";

import { MemberAvatar } from "./work-cards";

import {
  createProjectAction,
  createTaskAction,
  updateProjectAction,
  updateTaskAction,
} from "../actions";

const statusItems = workStatuses.map((status) => ({ value: status.id, label: status.label }));
const priorityItems = priorities.map((priority) => ({ value: priority.id, label: priority.label }));
const tagItems = workTags.map((tag) => ({ value: tag, label: tag }));

function isTag(value: string): value is WorkTag {
  return workTags.some((tag) => tag === value);
}

function readCapacity(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return null;
  return Number(value);
}

type WorkEditorProps = {
  workspace: Workspace;
  onSaved: () => void;
  status?: WorkStatus;
} & ({ kind: "task"; task?: Task; projectId?: string } | { kind: "project"; project?: Project });

export function WorkEditor(props: WorkEditorProps) {
  const { workspace, onSaved } = props;
  const existing = props.kind === "task" ? props.task : props.project;
  const [status, setStatus] = useState(existing?.status ?? props.status ?? "todo");
  const [format, setFormat] = useState<ProjectFormat>(
    props.kind === "project" ? (props.project?.format ?? "in-person") : "in-person",
  );
  const [assigneeIds, setAssigneeIds] = useState(existing?.assigneeIds ?? []);
  const [priority, setPriority] = useState<Priority>(
    props.kind === "task" ? (props.task?.priority ?? "normal") : "normal",
  );
  const [tags, setTags] = useState<WorkTag[]>(props.kind === "task" ? (props.task?.tags ?? []) : []);
  const [projectId, setProjectId] = useState(
    props.kind === "task" ? (props.task?.projectId ?? props.projectId ?? "none") : "none",
  );
  const queryClient = useQueryClient();
  const members = useMemo(
    () => workspace.members.map((member) => ({ value: member.id, label: member.name })),
    [workspace.members],
  );
  const projects = useMemo(
    () => [
      { value: "none", label: "No project" },
      ...workspace.projects.map((project) => ({ value: project.id, label: project.title })),
    ],
    [workspace.projects],
  );
  const save = useMutation({
    mutationFn: async (form: FormData) => {
      const fields = {
        title: form.get("title"),
        description: form.get("description"),
        dueDate: form.get("dueDate") || null,
        status,
        assigneeIds,
      };
      if (props.kind === "project") {
        const input = createProjectSchema.parse({
          ...fields,
          location: form.get("location"),
          capacity: readCapacity(form.get("capacity")),
          format,
        });
        return props.project
          ? updateProjectAction({ ...input, id: props.project.id })
          : createProjectAction(input);
      }
      const input = createTaskSchema.parse({
        ...fields,
        projectId: projectId === "none" ? null : projectId,
        priority,
        tags,
      });
      return props.task
        ? updateTaskAction({ ...input, id: props.task.id })
        : createTaskAction(input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceQueryKey });
      onSaved();
    },
  });

  const { mutate: saveWork } = save;
  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      saveWork(new FormData(event.currentTarget));
    },
    [saveWork],
  );
  const changeStatus = useCallback((value: WorkStatus | null) => {
    if (value) setStatus(value);
  }, []);
  const changeProject = useCallback((value: string | null) => {
    if (value) setProjectId(value);
  }, []);
  const changePriority = useCallback((value: Priority | null) => {
    if (value) setPriority(value);
  }, []);
  const changeTags = useCallback((value: string[]) => {
    setTags(value.filter(isTag));
  }, []);
  const selectedFormat = useMemo(() => [format], [format]);
  const changeFormat = useCallback((values: string[]) => {
    const value = values[0];
    if (value === "in-person" || value === "online") setFormat(value);
  }, []);

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <FieldGroup className={cn(props.kind === "project" && "sm:grid sm:grid-cols-2")}>
        <Field className={cn(props.kind === "project" && "sm:col-span-2")}>
          <FieldLabel htmlFor="work-title">Name</FieldLabel>
          <Input
            id="work-title"
            name="title"
            defaultValue={existing?.title}
            placeholder={props.kind === "project" ? "Project name" : "What needs doing?"}
            required
            maxLength={160}
          />
        </Field>
        <Field className={cn(props.kind === "project" && "sm:col-span-2")}>
          <FieldLabel htmlFor="work-description">Description</FieldLabel>
          <Textarea
            id="work-description"
            name="description"
            defaultValue={existing?.description}
            placeholder="Add details"
            maxLength={5000}
            rows={3}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="work-status">Status</FieldLabel>
          <Select items={statusItems} value={status} onValueChange={changeStatus}>
            <SelectTrigger id="work-status" className="w-full">
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
        </Field>
        <Field>
          <FieldLabel htmlFor="work-assignees">Assignees</FieldLabel>
          <Select items={members} multiple value={assigneeIds} onValueChange={setAssigneeIds}>
            <SelectTrigger id="work-assignees" className="w-full">
              <SelectValue>
                {(value: string[]) =>
                  value.length
                    ? workspace.members
                        .filter((member) => value.includes(member.id))
                        .map((member) => member.name.split(" ")[0])
                        .join(", ")
                    : "Assign people"
                }
              </SelectValue>
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
        </Field>
        {props.kind === "task" ? (
          <Field>
            <FieldLabel htmlFor="work-project">Project</FieldLabel>
            <Select items={projects} value={projectId} onValueChange={changeProject}>
              <SelectTrigger id="work-project" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {projects.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        ) : (
          <>
            <Field>
              <FieldLabel>Format</FieldLabel>
              <ToggleGroup
                value={selectedFormat}
                onValueChange={changeFormat}
                aria-label="Format"
                className="w-full"
              >
                {projectFormats.map((item) => (
                  <ToggleGroupItem key={item.id} value={item.id} className="flex-1">
                    {item.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="work-location">Location</FieldLabel>
              <Input
                id="work-location"
                name="location"
                defaultValue={props.project?.location}
                placeholder="Tampere"
                maxLength={200}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="work-capacity">Capacity</FieldLabel>
              <Input
                id="work-capacity"
                name="capacity"
                type="number"
                min={1}
                max={10000}
                defaultValue={props.project?.capacity ?? ""}
                placeholder="How many people"
              />
            </Field>
          </>
        )}
        <Field>
          <FieldLabel htmlFor="work-date">
            {props.kind === "project" ? "Date" : "Due date"}
          </FieldLabel>
          <Input id="work-date" name="dueDate" type="date" defaultValue={existing?.dueDate ?? ""} />
        </Field>
      </FieldGroup>
      {save.error && (
        <Alert variant="destructive">
          <AlertTitle>{save.error.message}</AlertTitle>
        </Alert>
      )}
      <Button type="submit" size="lg" disabled={save.isPending}>
        {save.isPending
          ? "Saving…"
          : existing
            ? "Save changes"
            : props.kind === "project"
              ? "Create project"
              : "Create task"}
      </Button>
    </form>
  );
}
