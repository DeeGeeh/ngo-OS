import "server-only";

import bigInt from "big-integer";
import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

import type { TelegramOrganizerConfig } from "./config";
import { decryptTelegramSecret, encryptTelegramSecret } from "./crypto";
import {
  getTelegramIntegrationState,
  saveTelegramIntegrationState,
  type TelegramIntegrationState,
  type TelegramMemberIdentity,
  type TelegramProjectChat,
} from "./store";

type OrganizerOperation<T> = (client: TelegramClient) => Promise<T>;

export function toInputUser(identity: TelegramMemberIdentity) {
  return new Api.InputUser({
    userId: bigInt(identity.telegram_user_id),
    accessHash: bigInt(identity.telegram_access_hash),
  });
}

export function toInputChannel(chat: TelegramProjectChat) {
  return new Api.InputChannel({
    channelId: bigInt(chat.telegram_chat_id),
    accessHash: bigInt(chat.telegram_access_hash),
  });
}

export function telegramErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "errorMessage" in error) {
    const message = error.errorMessage;
    if (typeof message === "string") return message;
  }
  return "Telegram operation failed.";
}

export async function withOrganizerClient<T>(
  config: TelegramOrganizerConfig,
  operation: OrganizerOperation<T>,
) {
  const state = await getTelegramIntegrationState();
  if (!state.organizer_session) throw new Error("Connect an organizer Telegram account first.");

  const session = decryptTelegramSecret(state.organizer_session, config.sessionEncryptionKey);
  const stringSession = new StringSession(session);
  const client = new TelegramClient(stringSession, config.apiId, config.apiHash, {
    connectionRetries: 3,
  });
  try {
    await client.connect();
    if (!(await client.checkAuthorization())) {
      throw new Error("The organizer Telegram session has expired. Connect it again.");
    }
    return await operation(client);
  } finally {
    await client.disconnect().catch(() => undefined);
  }
}

export async function beginOrganizerLogin(
  phoneNumber: string,
  config: TelegramOrganizerConfig,
  ownerUserId: string,
) {
  const stringSession = new StringSession("");
  const client = new TelegramClient(stringSession, config.apiId, config.apiHash, {
    connectionRetries: 3,
  });
  try {
    await client.connect();
    const result = await client.sendCode(
      { apiId: config.apiId, apiHash: config.apiHash },
      phoneNumber,
    );
    const current = await getTelegramIntegrationState();
    const next: TelegramIntegrationState = {
      ...current,
      pending_session: encryptTelegramSecret(stringSession.save(), config.sessionEncryptionKey),
      pending_phone: phoneNumber,
      pending_code_hash: result.phoneCodeHash,
      pending_started_at: new Date().toISOString(),
      pending_owner_user_id: ownerUserId,
      pending_password_required: false,
    };
    await saveTelegramIntegrationState(next);
    return { isCodeViaApp: result.isCodeViaApp };
  } finally {
    await client.disconnect().catch(() => undefined);
  }
}

export async function completeOrganizerLogin(
  code: string,
  password: string | undefined,
  config: TelegramOrganizerConfig,
  ownerUserId: string,
) {
  const state = await getTelegramIntegrationState();
  if (!state.pending_session || !state.pending_phone || !state.pending_code_hash) {
    throw new Error("Start Telegram login before submitting a code.");
  }
  const session = decryptTelegramSecret(state.pending_session, config.sessionEncryptionKey);
  const stringSession = new StringSession(session);
  const client = new TelegramClient(stringSession, config.apiId, config.apiHash, {
    connectionRetries: 3,
  });
  if (state.pending_owner_user_id && state.pending_owner_user_id !== ownerUserId) {
    throw new Error("This Telegram login belongs to another workspace user.");
  }
  try {
    await client.connect();
    let authorization: Api.auth.TypeAuthorization;
    if (state.pending_password_required) {
      if (!password) return { requiresPassword: true };
      authorization = await signInWithPassword(client, config, password);
    } else {
      try {
        authorization = await client.invoke(
          new Api.auth.SignIn({
            phoneNumber: state.pending_phone,
            phoneCodeHash: state.pending_code_hash,
            phoneCode: code,
          }),
        );
      } catch (error) {
        if (!isSessionPasswordNeeded(error))
          throw new Error(telegramErrorMessage(error), { cause: error });
        if (!password) {
          await saveTelegramIntegrationState({
            ...state,
            pending_session: encryptTelegramSecret(
              stringSession.save(),
              config.sessionEncryptionKey,
            ),
            pending_owner_user_id: ownerUserId,
            pending_password_required: true,
          });
          return { requiresPassword: true };
        }
        authorization = await signInWithPassword(client, config, password);
      }
    }
    if (!(authorization instanceof Api.auth.Authorization)) {
      throw new Error("Telegram account setup requires an existing account.");
    }
    if (!(authorization.user instanceof Api.User)) {
      throw new Error("Telegram returned an unexpected organizer account.");
    }
    const authenticatedUserId = authorization.user.id.toString();
    if (state.organizer_user_id && state.organizer_user_id !== authenticatedUserId) {
      throw new Error(
        "Reconnect the same Telegram organizer account to preserve linked identities.",
      );
    }
    const next: TelegramIntegrationState = {
      ...state,
      organizer_session: encryptTelegramSecret(stringSession.save(), config.sessionEncryptionKey),
      owner_user_id: ownerUserId,
      organizer_user_id: authenticatedUserId,
      organizer_username: authorization.user.username ?? null,
      pending_session: null,
      pending_phone: null,
      pending_code_hash: null,
      pending_started_at: null,
      pending_owner_user_id: null,
      pending_password_required: false,
    };
    await saveTelegramIntegrationState(next);
    return {
      organizerUsername: next.organizer_username,
      organizerUserId: next.organizer_user_id,
    };
  } finally {
    await client.disconnect().catch(() => undefined);
  }
}

export async function resolveOrganizerEntity(identifier: string, config: TelegramOrganizerConfig) {
  return withOrganizerClient(config, async (client) => {
    const entity = await client.getEntity(
      identifier.startsWith("+") ? identifier : identifier.replace(/^@/, ""),
    );
    if (!(entity instanceof Api.User) || !entity.accessHash) {
      throw new Error("Telegram did not return a reusable user entity.");
    }
    return {
      telegramUserId: entity.id.toString(),
      telegramAccessHash: entity.accessHash.toString(),
      telegramUsername: entity.username ?? null,
      displayName: [entity.firstName, entity.lastName].filter(Boolean).join(" ") || null,
    };
  });
}

async function signInWithPassword(
  client: TelegramClient,
  config: TelegramOrganizerConfig,
  password: string,
) {
  return client
    .signInWithPassword(
      { apiId: config.apiId, apiHash: config.apiHash },
      {
        password: async () => password,
        onError: (error) => {
          throw error;
        },
      },
    )
    .then((user) => new Api.auth.Authorization({ user }));
}

function isSessionPasswordNeeded(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "errorMessage" in error &&
    error.errorMessage === "SESSION_PASSWORD_NEEDED"
  );
}
