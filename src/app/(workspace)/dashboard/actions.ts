"use server";

import type { AssistantBranch, AssistantMessageWrite, AssistantThreadPatch } from "@/lib/assistant";
import {
  deleteAssistantThread,
  initializeAssistantThread,
  listAssistantThreads,
  readAssistantThread,
  saveAssistantMessage,
  selectAssistantBranch,
  updateAssistantThread,
} from "@/server/assistant/facade";
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

export async function listAssistantThreadsAction() {
  return listAssistantThreads();
}

export async function initializeAssistantThreadAction(id: string) {
  return initializeAssistantThread(id);
}

export async function readAssistantThreadAction(id: string) {
  return readAssistantThread(id);
}

export async function saveAssistantMessageAction(input: AssistantMessageWrite) {
  return saveAssistantMessage(input);
}

export async function selectAssistantBranchAction(input: AssistantBranch) {
  return selectAssistantBranch(input);
}

export async function updateAssistantThreadAction(id: string, input: AssistantThreadPatch) {
  return updateAssistantThread(id, input);
}

export async function deleteAssistantThreadAction(id: string) {
  return deleteAssistantThread(id);
}
