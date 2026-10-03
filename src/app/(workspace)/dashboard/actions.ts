"use server";

import type { AddLumaGuest, CreateLumaEvent, SendLumaBlast, UpdateLumaGuest } from "@/lib/luma";
import type {
  CreateProject,
  CreateTask,
  SendMessage,
  UpdateProject,
  UpdateTask,
} from "@/lib/workspace";
import {
  addLumaGuest,
  createLumaEvent,
  getLumaCalendar,
  sendLumaBlast,
  updateLumaGuest,
} from "@/server/luma/facade";
import {
  createProject,
  createTask,
  getWorkspace,
  sendMessage,
  updateProject,
  updateTask,
} from "@/server/workspace/facade";

function saved<T>(work: () => Promise<T>) {
  return work().catch((error: unknown) => {
    if (error instanceof Error && error.name !== "ZodError") throw error;
    throw new Error("Check the details and try again.");
  });
}

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

export async function getLumaCalendarAction() {
  return getLumaCalendar();
}

export async function createLumaEventAction(input: CreateLumaEvent) {
  return saved(() => createLumaEvent(input));
}

export async function addLumaGuestAction(input: AddLumaGuest) {
  return saved(() => addLumaGuest(input));
}

export async function updateLumaGuestAction(input: UpdateLumaGuest) {
  return saved(() => updateLumaGuest(input));
}

export async function sendLumaBlastAction(input: SendLumaBlast) {
  return saved(() => sendLumaBlast(input));
}
