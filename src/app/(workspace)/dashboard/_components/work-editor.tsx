"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState, type FormEvent } from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  createProjectSchema,
  createTaskSchema,
  workStatuses,
  workspaceQueryKey,
  type Project,
  type Task,
  type Workspace,
  type WorkStatus,
} from "@/lib/workspace";

import {
  createProjectAction,
  createTaskAction,
  updateProjectAction,
  updateTaskAction,
} from "../actions";

const statusItems = workStatuses.map((status) => ({ value: status.id, label: status.label }));

type WorkEditorProps = {
  workspace: Workspace;
  onSaved: () => void;
  status?: WorkStatus;
} & ({ kind: "task"; task?: Task; projectId?: string } | { kind: "project"; project?: Project });

export function WorkEditor(props: WorkEditorProps) {
  const { workspace, onSaved } = props;
  const existing = props.kind === "task" ? props.task : props.project;
  const [status, setStatus] = useState(existing?.status ?? props.status ?? "todo");
  const [assigneeIds, setAssigneeIds] = useState(existing?.assigneeIds ?? []);
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
        const input = createProjectSchema.parse({ ...fields, location: form.get("location") });
        return props.project
          ? updateProjectAction({ ...input, id: props.project.id })
          : createProjectAction(input);
      }
      const input = createTaskSchema.parse({
        ...fields,
        projectId: projectId === "none" ? null : projectId,
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

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
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
        <Field>
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
                    <Avatar size="sm">
                      <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
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
        )}
        <Field>
          <FieldLabel htmlFor="work-date">Due date</FieldLabel>
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
