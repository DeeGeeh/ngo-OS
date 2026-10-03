import "server-only";

import { createClient, type Client } from "@libsql/client";
import { z } from "zod";

import { env } from "@/env";
import {
  assistantMessageSchema,
  assistantThreadSchema,
  assistantTitle,
  type AssistantBranch,
  type AssistantMessageWrite,
  type AssistantThreadPatch,
} from "@/lib/assistant";

const threadColumns = "id, title, status, head_id AS headId, updated_at AS updatedAt";
const storedMessageSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  format: z.string(),
  content: z.string(),
});

async function withAssistantStore<T>(operation: (client: Client) => Promise<T>) {
  const client = createClient({ url: env.WORKSPACE_DATABASE_URL });
  try {
    await client.execute("PRAGMA busy_timeout = 5000");
    await client.batch(
      [
        "CREATE TABLE IF NOT EXISTS assistant_threads (id TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('regular', 'archived')), head_id TEXT, updated_at TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS assistant_messages (position INTEGER PRIMARY KEY AUTOINCREMENT, thread_id TEXT NOT NULL, id TEXT NOT NULL, parent_id TEXT, format TEXT NOT NULL, content TEXT NOT NULL CHECK (json_valid(content)), UNIQUE (thread_id, id))",
      ],
      "write",
    );
    return await operation(client);
  } finally {
    client.close();
  }
}

export function listThreads() {
  return withAssistantStore(async (client) => {
    const result = await client.execute(
      `SELECT ${threadColumns} FROM assistant_threads ORDER BY updated_at DESC, id`,
    );
    return result.rows.map((row) => assistantThreadSchema.parse(row));
  });
}

export function initializeThread(id: string) {
  return withAssistantStore(async (client) => {
    await client.execute({
      sql: "INSERT OR IGNORE INTO assistant_threads (id, title, status, updated_at) VALUES (?, 'New conversation', 'regular', ?)",
      args: [id, new Date().toISOString()],
    });
    const result = await client.execute({
      sql: `SELECT ${threadColumns} FROM assistant_threads WHERE id = ?`,
      args: [id],
    });
    return assistantThreadSchema.parse(result.rows[0]);
  });
}

export function readThread(id: string) {
  return withAssistantStore(async (client) => {
    const transaction = await client.transaction("read");
    try {
      const threads = await transaction.execute({
        sql: `SELECT ${threadColumns} FROM assistant_threads WHERE id = ?`,
        args: [id],
      });
      if (!threads.rows[0]) throw new Error("Conversation does not exist.");
      const result = await transaction.execute({
        sql: "SELECT id, parent_id AS parentId, format, content FROM assistant_messages WHERE thread_id = ? ORDER BY position",
        args: [id],
      });
      const messages = result.rows.map((row) => {
        const message = storedMessageSchema.parse(row);
        const content: unknown = JSON.parse(message.content);
        return assistantMessageSchema.parse({ ...message, content });
      });
      return { thread: assistantThreadSchema.parse(threads.rows[0]), messages };
    } finally {
      transaction.close();
    }
  });
}

export function saveMessage({ threadId, message, select }: AssistantMessageWrite) {
  return withAssistantStore(async (client) => {
    const transaction = await client.transaction("write");
    try {
      const thread = await transaction.execute({
        sql: `SELECT ${threadColumns} FROM assistant_threads WHERE id = ?`,
        args: [threadId],
      });
      if (!thread.rows[0]) throw new Error("Conversation does not exist.");
      const previous = await transaction.execute({
        sql: "SELECT parent_id AS parentId FROM assistant_messages WHERE thread_id = ? AND id = ?",
        args: [threadId, message.id],
      });
      if (previous.rows[0] && previous.rows[0].parentId !== message.parentId) {
        throw new Error("A saved message cannot change its parent.");
      }
      if (message.parentId !== null) {
        const parent = await transaction.execute({
          sql: "SELECT id FROM assistant_messages WHERE thread_id = ? AND id = ?",
          args: [threadId, message.parentId],
        });
        if (!parent.rows[0])
          throw new Error("The parent message does not exist in this conversation.");
      }
      await transaction.execute({
        sql: "INSERT INTO assistant_messages (thread_id, id, parent_id, format, content) VALUES (?, ?, ?, ?, ?) ON CONFLICT (thread_id, id) DO UPDATE SET content = excluded.content",
        args: [
          threadId,
          message.id,
          message.parentId,
          message.format,
          JSON.stringify(message.content),
        ],
      });
      const text = message.content.parts
        .flatMap((part) =>
          part.type === "text" && typeof part.text === "string" ? [part.text] : [],
        )
        .join(" ");
      const title =
        message.content.role === "user" && message.parentId === null
          ? assistantTitle(text)
          : assistantThreadSchema.parse(thread.rows[0]).title;
      await transaction.execute({
        sql: "UPDATE assistant_threads SET title = CASE WHEN title = 'New conversation' THEN ? ELSE title END, head_id = CASE WHEN ? THEN ? ELSE head_id END, updated_at = ? WHERE id = ?",
        args: [title, select ? 1 : 0, message.id, new Date().toISOString(), threadId],
      });
      await transaction.commit();
    } finally {
      transaction.close();
    }
  });
}

export function selectBranch({ threadId, headId }: AssistantBranch) {
  return withAssistantStore(async (client) => {
    const transaction = await client.transaction("write");
    try {
      if (headId !== null) {
        const result = await transaction.execute({
          sql: "SELECT id FROM assistant_messages WHERE thread_id = ? AND id = ?",
          args: [threadId, headId],
        });
        if (!result.rows[0])
          throw new Error("The selected message does not exist in this conversation.");
      }
      const result = await transaction.execute({
        sql: "UPDATE assistant_threads SET head_id = ?, updated_at = ? WHERE id = ?",
        args: [headId, new Date().toISOString(), threadId],
      });
      if (result.rowsAffected !== 1) throw new Error("Conversation does not exist.");
      await transaction.commit();
    } finally {
      transaction.close();
    }
  });
}

export function updateThread(id: string, patch: AssistantThreadPatch) {
  return withAssistantStore(async (client) => {
    const result = await client.execute({
      sql: "UPDATE assistant_threads SET title = COALESCE(?, title), status = COALESCE(?, status), updated_at = ? WHERE id = ?",
      args: [patch.title ?? null, patch.status ?? null, new Date().toISOString(), id],
    });
    if (result.rowsAffected !== 1) throw new Error("Conversation does not exist.");
  });
}

export function deleteThread(id: string) {
  return withAssistantStore(async (client) => {
    await client.batch(
      [
        { sql: "DELETE FROM assistant_messages WHERE thread_id = ?", args: [id] },
        { sql: "DELETE FROM assistant_threads WHERE id = ?", args: [id] },
      ],
      "write",
    );
  });
}
