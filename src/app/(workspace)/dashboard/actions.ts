"use server";

import type {
  CreateProject,
  CreateTask,
  SendMessage,
  UpdateProject,
  UpdateTask,
} from "@/lib/workspace";
import {
  createProject,
  createTask,
  getWorkspace,
  sendMessage,
  updateProject,
  updateTask,
} from "@/server/workspace/facade";

export async function getWorkspaceAction() {
  return getWorkspace();
}

export async function createTaskAction(input: CreateTask) {
  return createTask(input);
}

export async function updateTaskAction(input: UpdateTask) {
  return updateTask(input);
}

export async function createProjectAction(input: CreateProject) {
  return createProject(input);
}

export async function updateProjectAction(input: UpdateProject) {
  return updateProject(input);
}

export async function sendMessageAction(input: SendMessage) {
  return sendMessage(input);
}
