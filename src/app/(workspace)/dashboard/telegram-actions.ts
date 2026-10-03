"use server";

import type {
  TelegramInviteMembers,
  TelegramLinkMember,
  TelegramLoginComplete,
  TelegramLoginStart,
  TelegramProject,
  TelegramSendMessage,
} from "@/lib/telegram";
import {
  completeTelegramLogin,
  createTelegramProjectInviteLink,
  ensureProjectTelegramGroup,
  getTelegramStatus,
  inviteTelegramProjectMembers,
  linkTelegramMember,
  listTelegramProjectMembers,
  readTelegramProjectMessages,
  sendTelegramProjectMessage,
  startTelegramLogin,
} from "@/server/telegram/facade";

export async function getTelegramStatusAction() {
  return getTelegramStatus();
}

export async function startTelegramLoginAction(input: TelegramLoginStart) {
  return startTelegramLogin(input);
}

export async function completeTelegramLoginAction(input: TelegramLoginComplete) {
  return completeTelegramLogin(input);
}

export async function linkTelegramMemberAction(input: TelegramLinkMember) {
  return linkTelegramMember(input);
}

export async function ensureProjectTelegramGroupAction(input: TelegramProject) {
  return ensureProjectTelegramGroup(input);
}

export async function inviteTelegramProjectMembersAction(input: TelegramInviteMembers) {
  return inviteTelegramProjectMembers(input);
}

export async function listTelegramProjectMembersAction(input: TelegramProject) {
  return listTelegramProjectMembers(input);
}

export async function readTelegramProjectMessagesAction(input: TelegramProject) {
  return readTelegramProjectMessages(input);
}

export async function sendTelegramProjectMessageAction(input: TelegramSendMessage) {
  return sendTelegramProjectMessage(input);
}

export async function createTelegramProjectInviteLinkAction(input: TelegramProject) {
  return createTelegramProjectInviteLink(input);
}
