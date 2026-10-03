import "server-only";

import { randomUUID } from "node:crypto";

import {
  createProjectSchema,
  createTaskSchema,
  appendTelegramMessageSchema,
  sendMessageSchema,
  updateProjectSchema,
  updateTaskSchema,
  userSettingsSchema,
  type UserSettings,
  type CreateProject,
  type CreateTask,
  type AppendTelegramMessage,
  type Message,
  type Project,
  type SendMessage,
  type Task,
  type UpdateProject,
  type UpdateTask,
  type Workspace,
} from "@/lib/workspace";

import { withWorkspace } from "./store";

function validateAssignees(workspace: Workspace, assigneeIds: string[]) {
  if (new Set(assigneeIds).size !== assigneeIds.length) {
    throw new Error("Choose each member only once.");
  }
  if (assigneeIds.some((id) => !workspace.members.some((member) => member.id === id))) {
    throw new Error("A selected member does not exist.");
  }
}

function validateProject(workspace: Workspace, projectId: string | null) {
  if (projectId !== null && !workspace.projects.some((project) => project.id === projectId)) {
    throw new Error("Project does not exist.");
  }
}

export async function getWorkspace(): Promise<Workspace> {
  return withWorkspace((workspace) => {
    const member = workspace.members.find((item) => item.id === workspace.currentMemberId);
    if (member && !member.settings) {
      const [firstName = "", ...lastName] = member.name.trim().split(/\s+/);
      member.settings = { firstName, lastName: lastName.join(" "), email: "", telegramHandle: "" };
    }
    return workspace;
  }, false);
}

export async function createTask(input: CreateTask): Promise<Task> {
  const data = createTaskSchema.parse(input);
  return withWorkspace((workspace) => {
    validateAssignees(workspace, data.assigneeIds);
    validateProject(workspace, data.projectId);
    const task = { ...data, id: randomUUID() };
    workspace.tasks.push(task);
    return task;
  });
}

export async function updateTask(input: UpdateTask): Promise<Task> {
  const { id, ...changes } = updateTaskSchema.parse(input);
  return withWorkspace((workspace) => {
    const task = workspace.tasks.find((item) => item.id === id);
    if (!task) throw new Error("Task does not exist.");
    const updated = {
      ...task,
      title: changes.title ?? task.title,
      description: changes.description ?? task.description,
      status: changes.status ?? task.status,
      projectId: changes.projectId === undefined ? task.projectId : changes.projectId,
      assigneeIds: changes.assigneeIds ?? task.assigneeIds,
      dueDate: changes.dueDate === undefined ? task.dueDate : changes.dueDate,
      priority: changes.priority ?? task.priority,
      tags: changes.tags ?? task.tags,
      subtasks: changes.subtasks ?? task.subtasks,
    };
    validateAssignees(workspace, updated.assigneeIds);
    validateProject(workspace, updated.projectId);
    Object.assign(task, updated);
    return task;
  });
}

export async function createProject(input: CreateProject): Promise<Project> {
  const data = createProjectSchema.parse(input);
  return withWorkspace((workspace) => {
    validateAssignees(workspace, data.assigneeIds);
    const project = { ...data, id: randomUUID() };
    workspace.projects.push(project);
    workspace.channels.push({
      id: randomUUID(),
      name: project.title,
      kind: "project",
      projectId: project.id,
    });
    return project;
  });
}

export async function updateProject(input: UpdateProject): Promise<Project> {
  const { id, ...changes } = updateProjectSchema.parse(input);
  return withWorkspace((workspace) => {
    const project = workspace.projects.find((item) => item.id === id);
    if (!project) throw new Error("Project does not exist.");
    const updated = {
      ...project,
      title: changes.title ?? project.title,
      description: changes.description ?? project.description,
      status: changes.status ?? project.status,
      assigneeIds: changes.assigneeIds ?? project.assigneeIds,
      dueDate: changes.dueDate === undefined ? project.dueDate : changes.dueDate,
      location: changes.location ?? project.location,
      capacity: changes.capacity === undefined ? project.capacity : changes.capacity,
      format: changes.format ?? project.format,
    };
    validateAssignees(workspace, updated.assigneeIds);
    Object.assign(project, updated);
    const channel = workspace.channels.find(
      (item) => item.kind === "project" && item.projectId === id,
    );
    if (!channel) throw new Error("Project channel does not exist.");
    channel.name = project.title;
    return project;
  });
}

function conversationExists(workspace: Workspace, conversation: SendMessage["conversation"]) {
  if (conversation.kind === "channel") {
    return workspace.channels.some((channel) => channel.id === conversation.id);
  }
  if (conversation.kind === "task") {
    return workspace.tasks.some((task) => task.id === conversation.id);
  }
  return workspace.members.some(
    (member) => member.id === conversation.id && member.id !== workspace.currentMemberId,
  );
}

export async function sendMessage(input: SendMessage): Promise<Message> {
  const data = sendMessageSchema.parse(input);
  return withWorkspace((workspace) => {
    if (!conversationExists(workspace, data.conversation)) {
      throw new Error("Conversation does not exist.");
    }
    const message = {
      ...data,
      id: randomUUID(),
      authorId: workspace.currentMemberId,
      source: "workspace" as const,
      createdAt: new Date().toISOString(),
    };
    workspace.messages.push(message);
    return message;
  });
}

export async function updateUserSettings(input: UserSettings) {
  const settings = userSettingsSchema.parse(input);
  return withWorkspace((workspace) => {
    const member = workspace.members.find((item) => item.id === workspace.currentMemberId);
    if (!member) throw new Error("Current member does not exist.");
    member.settings = settings;
    member.name = [settings.firstName, settings.lastName].filter(Boolean).join(" ");
    return member;
  });
}

export async function appendTelegramMessage(input: AppendTelegramMessage): Promise<Message | null> {
  const data = appendTelegramMessageSchema.parse(input);
  return withWorkspace((workspace) => {
    const existing = workspace.messages.find(
      (message) => message.source === "telegram" && message.externalId === data.externalId,
    );
    if (existing) return existing;
    const channel = workspace.channels.find((item) => item.kind === "general");
    if (!channel) throw new Error("General channel does not exist.");
    const message = {
      id: randomUUID(),
      conversation: { kind: "channel" as const, id: channel.id },
      authorId: data.authorId,
      authorName: data.authorName,
      source: "telegram" as const,
      externalId: data.externalId,
      text: data.text,
      createdAt: data.createdAt,
    };
    workspace.messages.push(message);
    return message;
  });
}
