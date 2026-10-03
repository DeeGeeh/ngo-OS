import "server-only";

import { webhookCallback } from "grammy";
import { Api } from "telegram";
import { RPCError } from "telegram/errors";

import {
  telegramInviteMembersSchema,
  telegramLinkMemberSchema,
  telegramLoginCompleteSchema,
  telegramLoginStartSchema,
  telegramProjectSchema,
  telegramSendMessageSchema,
  type TelegramConnectionStatus,
  type TelegramInviteOutcome,
  type TelegramInviteMembers,
  type TelegramLinkMember,
  type TelegramLoginComplete,
  type TelegramLoginStart,
  type TelegramProject,
  type TelegramSendMessage,
} from "@/lib/telegram";
import { env } from "@/env";
import { getWorkspace } from "@/server/workspace/facade";
import { createTelegramBot } from "./bot";

import { requireTelegramActor } from "./access";
import {
  beginOrganizerLogin,
  completeOrganizerLogin,
  resolveOrganizerEntity,
  telegramErrorMessage,
  toInputChannel,
  toInputUser,
  withOrganizerClient,
} from "./account";
import { getTelegramBotConfig, getTelegramOrganizerConfig } from "./config";
import {
  getTelegramIntegrationState,
  getTelegramMemberIdentity,
  getTelegramProjectChat,
  claimTelegramProjectCreation,
  clearTelegramProjectCreation,
  saveTelegramProjectCreationResult,
  saveTelegramMemberIdentity,
  saveTelegramProjectChat,
} from "./store";

export async function getTelegramStatus(): Promise<TelegramConnectionStatus> {
  const state = await getTelegramIntegrationState();
  if (state.organizer_session || state.pending_session) {
    await requireTelegramActor(state.owner_user_id ?? state.pending_owner_user_id);
  }
  const configured = Boolean(
    env.TELEGRAM_API_ID && env.TELEGRAM_API_HASH && env.TELEGRAM_SESSION_ENCRYPTION_KEY,
  );
  return {
    configured,
    authenticationConfigured: Boolean(
      env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY,
    ),
    organizerConnected: Boolean(state.organizer_session),
    organizerUsername: state.organizer_username,
    mainGroupConfigured: Boolean(env.TELEGRAM_MAIN_CHAT_ID),
    loginPending: Boolean(state.pending_session),
    loginPhase: state.pending_password_required
      ? "password"
      : state.pending_session
        ? "code"
        : "idle",
  };
}

let telegramWebhook: ReturnType<typeof createTelegramWebhook> | undefined;

function createTelegramWebhook() {
  const config = getTelegramBotConfig();
  return webhookCallback(createTelegramBot(config), "std/http", {
    secretToken: config.webhookSecret,
  });
}

export async function handleTelegramWebhook(request: Request) {
  telegramWebhook ??= createTelegramWebhook();
  return telegramWebhook(request);
}

export async function startTelegramLogin(input: TelegramLoginStart) {
  const data = telegramLoginStartSchema.parse(input);
  const state = await getTelegramIntegrationState();
  const actor = await requireTelegramActor(state.owner_user_id ?? state.pending_owner_user_id);
  const config = getTelegramOrganizerConfig();
  return beginOrganizerLogin(data.phoneNumber, config, actor.userId);
}

export async function completeTelegramLogin(input: TelegramLoginComplete) {
  const data = telegramLoginCompleteSchema.parse(input);
  const state = await getTelegramIntegrationState();
  const actor = await requireTelegramActor(state.owner_user_id ?? state.pending_owner_user_id);
  const config = getTelegramOrganizerConfig();
  return completeOrganizerLogin(data.code ?? "", data.password, config, actor.userId);
}

export async function linkTelegramMember(input: TelegramLinkMember) {
  const data = telegramLinkMemberSchema.parse(input);
  const state = await getTelegramIntegrationState();
  await requireTelegramActor(state.owner_user_id);
  const workspace = await getWorkspace();
  const member = workspace.members.find((item) => item.id === data.memberId);
  if (!member) throw new Error("Member does not exist.");
  if (!data.username && !data.phoneNumber)
    throw new Error("Add a Telegram username or phone number.");
  const config = getTelegramOrganizerConfig();
  const identity = await resolveOrganizerEntity(data.username ?? data.phoneNumber ?? "", config);
  await saveTelegramMemberIdentity({
    workspace_member_id: member.id,
    telegram_user_id: identity.telegramUserId,
    telegram_access_hash: identity.telegramAccessHash,
    telegram_username: identity.telegramUsername,
    display_name: identity.displayName ?? member.name,
  });
  return {
    memberId: member.id,
    telegramUserId: identity.telegramUserId,
    telegramUsername: identity.telegramUsername,
    displayName: identity.displayName,
  };
}

export async function ensureProjectTelegramGroup(input: TelegramProject) {
  const data = telegramProjectSchema.parse(input);
  const state = await getTelegramIntegrationState();
  await requireTelegramActor(state.owner_user_id);
  const workspace = await getWorkspace();
  const project = workspace.projects.find((item) => item.id === data.projectId);
  if (!project) throw new Error("Project does not exist.");
  const existing = await getTelegramProjectChat(project.id);
  if (existing) return publicProjectChat(existing);
  const config = getTelegramOrganizerConfig();
  if (!state.organizer_session) throw new Error("Connect an organizer Telegram account first.");
  const claim = await claimTelegramProjectCreation(project.id, project.title);
  if (!claim.claimed) {
    if (claim.existing?.telegram_chat_id && claim.existing.telegram_access_hash) {
      const saved = {
        project_id: project.id,
        telegram_chat_id: claim.existing.telegram_chat_id,
        telegram_access_hash: claim.existing.telegram_access_hash,
        title: claim.existing.title,
      };
      await saveTelegramProjectChat(saved);
      return publicProjectChat(saved);
    }
    throw new Error("Telegram project group creation is already in progress.");
  }
  let persisted = false;
  let remoteOperationStarted = false;
  try {
    return await withOrganizerClient(config, async (client) => {
      remoteOperationStarted = true;
      const channel = await createProjectChannel(client, project.title, project.description);
      if (!channel.accessHash) throw new Error("Telegram did not return a reusable project group.");
      const saved = {
        project_id: project.id,
        telegram_chat_id: channel.id.toString(),
        telegram_access_hash: channel.accessHash.toString(),
        title: channel.title,
      };
      await saveTelegramProjectCreationResult(
        project.id,
        saved.telegram_chat_id,
        saved.telegram_access_hash,
      );
      await saveTelegramProjectChat(saved);
      persisted = true;
      return publicProjectChat(saved);
    });
  } catch (error) {
    if (error instanceof RPCError && error.code !== undefined && error.code < 500) {
      await clearTelegramProjectCreation(project.id);
    }
    throw error;
  } finally {
    if (persisted || !remoteOperationStarted) await clearTelegramProjectCreation(project.id);
  }
}

export async function inviteTelegramProjectMembers(input: TelegramInviteMembers) {
  const data = telegramInviteMembersSchema.parse(input);
  const state = await getTelegramIntegrationState();
  await requireTelegramActor(state.owner_user_id);
  const workspace = await getWorkspace();
  const project = workspace.projects.find((item) => item.id === data.projectId);
  if (!project) throw new Error("Project does not exist.");
  if (data.memberIds.some((id) => !workspace.members.some((member) => member.id === id))) {
    throw new Error("Member does not exist.");
  }
  const chat = await getTelegramProjectChat(project.id);
  if (!chat) throw new Error("Create the Telegram project group first.");
  const config = getTelegramOrganizerConfig();
  const identities = await Promise.all(
    data.memberIds.map(
      async (memberId) => [memberId, await getTelegramMemberIdentity(memberId)] as const,
    ),
  );
  return withOrganizerClient(config, async (client) => {
    const channel = toInputChannel(chat);
    const participants = new Set<string>();
    for await (const participant of client.iterParticipants(channel, { limit: 10000 })) {
      participants.add(participant.id.toString());
    }
    const outcomes = identities.map(([memberId, identity]) => {
      if (!identity)
        return {
          memberId,
          status: "failed" as const,
          reason: "Link this member to Telegram first.",
        };
      if (participants.has(identity.telegram_user_id))
        return { memberId, status: "already_member" as const };
      return { memberId, identity, status: "pending" as const };
    });
    const pending = outcomes.filter((outcome) => outcome.status === "pending");
    const results = new Map<
      string,
      { status: "added" | "invite_required" | "failed"; reason?: string }
    >();
    await Promise.all(
      pending.map(async (outcome) => {
        try {
          const result = await client.invoke(
            new Api.channels.InviteToChannel({
              channel,
              users: [toInputUser(outcome.identity)],
            }),
          );
          const missing = result.missingInvitees.some(
            (item) => item.userId.toString() === outcome.identity.telegram_user_id,
          );
          results.set(
            outcome.memberId,
            missing
              ? {
                  status: "invite_required",
                  reason: "Telegram did not allow direct addition for this member.",
                }
              : { status: "added" },
          );
        } catch (error) {
          const reason = telegramErrorMessage(error);
          results.set(
            outcome.memberId,
            /USER_PRIVACY_RESTRICTED|USER_NOT_MUTUAL_CONTACT|USER_BLOCKED|USER_CHANNELS_TOO_MUCH/.test(
              reason,
            )
              ? { status: "invite_required", reason }
              : { status: "failed", reason },
          );
        }
      }),
    );
    const inviteRequired = [...results.values()].some(
      (result) => result.status === "invite_required",
    );
    let inviteLink: string | undefined;
    if (inviteRequired) {
      try {
        inviteLink = await createInviteLink(client, channel);
      } catch (error) {
        const reason = telegramErrorMessage(error);
        for (const [memberId, result] of results) {
          if (result.status === "invite_required") {
            results.set(
              memberId,
              Object.assign({}, result, {
                reason: `${result.reason ?? "Invite required."} ${reason}`,
              }),
            );
          }
        }
      }
    }
    const finalOutcomes: TelegramInviteOutcome[] = [];
    for (const outcome of outcomes) {
      if (outcome.status !== "pending") {
        finalOutcomes.push({
          memberId: outcome.memberId,
          status: outcome.status,
          reason: outcome.reason,
        });
        continue;
      }
      const result = results.get(outcome.memberId) ?? {
        status: "failed" as const,
        reason: "No Telegram result was returned.",
      };
      finalOutcomes.push({
        memberId: outcome.memberId,
        status: result.status,
        reason: result.reason,
        ...(inviteLink && result.status === "invite_required" ? { inviteLink } : {}),
      });
    }
    return finalOutcomes;
  });
}

export async function listTelegramProjectMembers(input: TelegramProject) {
  const data = telegramProjectSchema.parse(input);
  const state = await getTelegramIntegrationState();
  await requireTelegramActor(state.owner_user_id);
  const chat = await getTelegramProjectChat(data.projectId);
  if (!chat) throw new Error("Create the Telegram project group first.");
  const config = getTelegramOrganizerConfig();
  return withOrganizerClient(config, async (client) => {
    const members = [];
    for await (const participant of client.iterParticipants(toInputChannel(chat), {
      limit: 10000,
    })) {
      if (!(participant instanceof Api.User)) continue;
      members.push({
        id: participant.id.toString(),
        name:
          [participant.firstName, participant.lastName].filter(Boolean).join(" ") ||
          participant.username ||
          "Telegram user",
        username: participant.username ?? null,
      });
    }
    return members;
  });
}

export async function readTelegramProjectMessages(input: TelegramProject) {
  const data = telegramProjectSchema.parse(input);
  const state = await getTelegramIntegrationState();
  await requireTelegramActor(state.owner_user_id);
  const chat = await getTelegramProjectChat(data.projectId);
  if (!chat) throw new Error("Create the Telegram project group first.");
  const config = getTelegramOrganizerConfig();
  return withOrganizerClient(config, async (client) => {
    const messages = [];
    for await (const message of client.iterMessages(toInputChannel(chat), { limit: 50 })) {
      if (!message.message) continue;
      const sender = message.sender instanceof Api.User ? message.sender : undefined;
      messages.push({
        id: message.id.toString(),
        senderId: message.senderId?.toString() ?? null,
        senderName: sender
          ? [sender.firstName, sender.lastName].filter(Boolean).join(" ") || sender.username || null
          : null,
        text: message.message,
        createdAt: new Date(message.date * 1000).toISOString(),
      });
    }
    return messages;
  });
}

export async function sendTelegramProjectMessage(input: TelegramSendMessage) {
  const data = telegramSendMessageSchema.parse(input);
  const state = await getTelegramIntegrationState();
  await requireTelegramActor(state.owner_user_id);
  const chat = await getTelegramProjectChat(data.projectId);
  if (!chat) throw new Error("Create the Telegram project group first.");
  const config = getTelegramOrganizerConfig();
  return withOrganizerClient(config, async (client) => {
    const message = await client.sendMessage(toInputChannel(chat), { message: data.text });
    return { id: message.id.toString(), text: data.text };
  });
}

export async function createTelegramProjectInviteLink(input: TelegramProject) {
  const data = telegramProjectSchema.parse(input);
  const state = await getTelegramIntegrationState();
  await requireTelegramActor(state.owner_user_id);
  const chat = await getTelegramProjectChat(data.projectId);
  if (!chat) throw new Error("Create the Telegram project group first.");
  const config = getTelegramOrganizerConfig();
  return withOrganizerClient(config, async (client) => ({
    link: await createInviteLink(client, toInputChannel(chat)),
  }));
}

export async function requireTelegramAssistantAccess() {
  const state = await getTelegramIntegrationState();
  if (!state.organizer_session) return;
  await requireTelegramActor(state.owner_user_id);
}

async function createProjectChannel(
  client: import("telegram").TelegramClient,
  title: string,
  about: string,
) {
  const result = await client.invoke(
    new Api.channels.CreateChannel({ title, about: about.slice(0, 255), megagroup: true }),
  );
  const chats =
    result instanceof Api.Updates || result instanceof Api.UpdatesCombined ? result.chats : [];
  const channel = chats.find((chat) => chat instanceof Api.Channel && chat.megagroup);
  if (!(channel instanceof Api.Channel))
    throw new Error("Telegram did not return the created project group.");
  return channel;
}

async function createInviteLink(
  client: import("telegram").TelegramClient,
  channel: Api.InputChannel,
) {
  const invite = await client.invoke(new Api.messages.ExportChatInvite({ peer: channel }));
  if (!("link" in invite) || typeof invite.link !== "string")
    throw new Error("Telegram did not return an invite link.");
  return invite.link;
}

function publicProjectChat(chat: { project_id: string; telegram_chat_id: string; title: string }) {
  return {
    projectId: chat.project_id,
    telegramChatId: chat.telegram_chat_id,
    title: chat.title,
  };
}
