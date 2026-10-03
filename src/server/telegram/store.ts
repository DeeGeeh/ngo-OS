import "server-only";

import { createClient } from "@libsql/client";
import { z } from "zod";

import { env } from "@/env";

const integrationRowSchema = z.object({
  id: z.coerce.number(),
  organizer_session: z.string().nullable(),
  owner_user_id: z.string().nullable(),
  organizer_user_id: z.string().nullable(),
  organizer_username: z.string().nullable(),
  pending_session: z.string().nullable(),
  pending_phone: z.string().nullable(),
  pending_code_hash: z.string().nullable(),
  pending_started_at: z.string().nullable(),
  pending_owner_user_id: z.string().nullable(),
  pending_password_required: z.coerce
    .number()
    .int()
    .min(0)
    .max(1)
    .transform((value) => value === 1),
});

const identityRowSchema = z.object({
  workspace_member_id: z.string(),
  telegram_user_id: z.string(),
  telegram_access_hash: z.string(),
  telegram_username: z.string().nullable(),
  display_name: z.string().nullable(),
  updated_at: z.string(),
});

const projectChatRowSchema = z.object({
  project_id: z.string(),
  telegram_chat_id: z.string(),
  telegram_access_hash: z.string(),
  title: z.string(),
  updated_at: z.string(),
});

const projectCreationRowSchema = z.object({
  project_id: z.string(),
  title: z.string(),
  telegram_chat_id: z.string().nullable(),
  telegram_access_hash: z.string().nullable(),
  created_at: z.string(),
});

export type TelegramIntegrationState = z.infer<typeof integrationRowSchema>;
export type TelegramMemberIdentity = z.infer<typeof identityRowSchema>;
export type TelegramProjectChat = z.infer<typeof projectChatRowSchema>;
export type TelegramProjectCreation = z.infer<typeof projectCreationRowSchema>;

async function withClient<T>(operation: (client: ReturnType<typeof createClient>) => Promise<T>) {
  const client = createClient({ url: env.WORKSPACE_DATABASE_URL });
  try {
    await client.batch([
      `CREATE TABLE IF NOT EXISTS telegram_integration (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        organizer_session TEXT,
        owner_user_id TEXT,
        organizer_user_id TEXT,
        organizer_username TEXT,
        pending_session TEXT,
        pending_phone TEXT,
        pending_code_hash TEXT,
        pending_started_at TEXT,
        pending_owner_user_id TEXT,
        pending_password_required INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS telegram_member_identity (
        workspace_member_id TEXT PRIMARY KEY,
        telegram_user_id TEXT NOT NULL,
        telegram_access_hash TEXT NOT NULL,
        telegram_username TEXT,
        display_name TEXT,
        updated_at TEXT NOT NULL
      )`,
      "CREATE UNIQUE INDEX IF NOT EXISTS telegram_member_user_identity ON telegram_member_identity (telegram_user_id)",
      `CREATE TABLE IF NOT EXISTS telegram_project_chat (
        project_id TEXT PRIMARY KEY,
        telegram_chat_id TEXT NOT NULL,
        telegram_access_hash TEXT NOT NULL,
        title TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS telegram_project_creation (
        project_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        telegram_chat_id TEXT,
        telegram_access_hash TEXT,
        created_at TEXT NOT NULL
      )`,
    ]);
    return await operation(client);
  } finally {
    client.close();
  }
}

const emptyIntegrationState = {
  id: 1,
  organizer_session: null,
  owner_user_id: null,
  organizer_user_id: null,
  organizer_username: null,
  pending_session: null,
  pending_phone: null,
  pending_code_hash: null,
  pending_started_at: null,
  pending_owner_user_id: null,
  pending_password_required: false,
} satisfies TelegramIntegrationState;

export async function getTelegramIntegrationState() {
  return withClient(async (client) => {
    const result = await client.execute("SELECT * FROM telegram_integration WHERE id = 1");
    const row = result.rows[0];
    return row ? integrationRowSchema.parse(row) : emptyIntegrationState;
  });
}

export async function saveTelegramIntegrationState(state: TelegramIntegrationState) {
  return withClient(async (client) => {
    await client.execute({
      sql: `INSERT INTO telegram_integration
        (id, organizer_session, owner_user_id, organizer_user_id, organizer_username, pending_session, pending_phone, pending_code_hash, pending_started_at, pending_owner_user_id, pending_password_required)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          organizer_session = excluded.organizer_session,
          owner_user_id = excluded.owner_user_id,
          organizer_user_id = excluded.organizer_user_id,
          organizer_username = excluded.organizer_username,
          pending_session = excluded.pending_session,
          pending_phone = excluded.pending_phone,
          pending_code_hash = excluded.pending_code_hash,
          pending_started_at = excluded.pending_started_at,
          pending_owner_user_id = excluded.pending_owner_user_id,
          pending_password_required = excluded.pending_password_required`,
      args: [
        state.organizer_session,
        state.owner_user_id,
        state.organizer_user_id,
        state.organizer_username,
        state.pending_session,
        state.pending_phone,
        state.pending_code_hash,
        state.pending_started_at,
        state.pending_owner_user_id,
        state.pending_password_required ? 1 : 0,
      ],
    });
  });
}

export async function getTelegramMemberIdentity(memberId: string) {
  return withClient(async (client) => {
    const result = await client.execute({
      sql: "SELECT * FROM telegram_member_identity WHERE workspace_member_id = ?",
      args: [memberId],
    });
    const row = result.rows[0];
    return row ? identityRowSchema.parse(row) : null;
  });
}

export async function getTelegramMemberIdentityByTelegramUserId(telegramUserId: string) {
  return withClient(async (client) => {
    const result = await client.execute({
      sql: "SELECT * FROM telegram_member_identity WHERE telegram_user_id = ?",
      args: [telegramUserId],
    });
    const row = result.rows[0];
    return row ? identityRowSchema.parse(row) : null;
  });
}

export async function saveTelegramMemberIdentity(
  identity: Omit<TelegramMemberIdentity, "updated_at">,
) {
  return withClient(async (client) => {
    await client.execute({
      sql: `INSERT INTO telegram_member_identity
        (workspace_member_id, telegram_user_id, telegram_access_hash, telegram_username, display_name, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(workspace_member_id) DO UPDATE SET
          telegram_user_id = excluded.telegram_user_id,
          telegram_access_hash = excluded.telegram_access_hash,
          telegram_username = excluded.telegram_username,
          display_name = excluded.display_name,
          updated_at = excluded.updated_at`,
      args: [
        identity.workspace_member_id,
        identity.telegram_user_id,
        identity.telegram_access_hash,
        identity.telegram_username,
        identity.display_name,
        new Date().toISOString(),
      ],
    });
  });
}

export async function getTelegramProjectChat(projectId: string) {
  return withClient(async (client) => {
    const result = await client.execute({
      sql: "SELECT * FROM telegram_project_chat WHERE project_id = ?",
      args: [projectId],
    });
    const row = result.rows[0];
    return row ? projectChatRowSchema.parse(row) : null;
  });
}

export async function claimTelegramProjectCreation(projectId: string, title: string) {
  return withClient(async (client) => {
    const result = await client.execute({
      sql: `INSERT OR IGNORE INTO telegram_project_creation
        (project_id, title, created_at) VALUES (?, ?, ?)`,
      args: [projectId, title, new Date().toISOString()],
    });
    const current = await client.execute({
      sql: "SELECT * FROM telegram_project_creation WHERE project_id = ?",
      args: [projectId],
    });
    const row = current.rows[0];
    return {
      claimed: result.rowsAffected === 1,
      existing: row ? projectCreationRowSchema.parse(row) : null,
    };
  });
}

export async function saveTelegramProjectCreationResult(
  projectId: string,
  telegramChatId: string,
  telegramAccessHash: string,
) {
  return withClient(async (client) => {
    await client.execute({
      sql: `UPDATE telegram_project_creation
        SET telegram_chat_id = ?, telegram_access_hash = ? WHERE project_id = ?`,
      args: [telegramChatId, telegramAccessHash, projectId],
    });
  });
}

export async function clearTelegramProjectCreation(projectId: string) {
  return withClient(async (client) => {
    await client.execute({
      sql: "DELETE FROM telegram_project_creation WHERE project_id = ?",
      args: [projectId],
    });
  });
}

export async function saveTelegramProjectChat(chat: Omit<TelegramProjectChat, "updated_at">) {
  return withClient(async (client) => {
    await client.execute({
      sql: `INSERT INTO telegram_project_chat
        (project_id, telegram_chat_id, telegram_access_hash, title, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(project_id) DO UPDATE SET
          telegram_chat_id = excluded.telegram_chat_id,
          telegram_access_hash = excluded.telegram_access_hash,
          title = excluded.title,
          updated_at = excluded.updated_at`,
      args: [
        chat.project_id,
        chat.telegram_chat_id,
        chat.telegram_access_hash,
        chat.title,
        new Date().toISOString(),
      ],
    });
  });
}
