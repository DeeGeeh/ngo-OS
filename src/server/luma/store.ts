import "server-only";

import { createHash } from "node:crypto";

import { createClient } from "@libsql/client";
import { z } from "zod";

import { env } from "@/env";
import { lumaCalendarSchema, type LumaCalendar } from "@/lib/luma";

import { demoCalendar } from "./seed";

const snapshotSchema = z.object({ data: z.string(), revision: z.number().int().nonnegative() });
const maxWriteAttempts = 20;
const seedData = JSON.stringify(demoCalendar);
const seedVersion = createHash("sha256").update(seedData).digest("hex");

export async function withLuma<T>(operation: (calendar: LumaCalendar) => T, write = true) {
  const client = createClient({ url: env.WORKSPACE_DATABASE_URL });
  try {
    await client.batch([
      "CREATE TABLE IF NOT EXISTS luma (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL CHECK (json_valid(data)), revision INTEGER NOT NULL DEFAULT 0)",
      "CREATE TABLE IF NOT EXISTS seed_versions (name TEXT PRIMARY KEY, version TEXT NOT NULL)",
      {
        sql: "INSERT OR IGNORE INTO luma (id, data) VALUES (1, ?)",
        args: [seedData],
      },
      {
        sql: "UPDATE luma SET data = ?, revision = revision + 1 WHERE id = 1 AND NOT EXISTS (SELECT 1 FROM seed_versions WHERE name = 'luma' AND version = ?)",
        args: [seedData, seedVersion],
      },
      {
        sql: "INSERT INTO seed_versions (name, version) VALUES ('luma', ?) ON CONFLICT(name) DO UPDATE SET version = excluded.version",
        args: [seedVersion],
      },
    ]);
    async function apply(attempt: number): Promise<T> {
      const rows = await client.execute("SELECT data, revision FROM luma WHERE id = 1");
      const snapshot = snapshotSchema.parse(rows.rows[0]);
      const calendar = lumaCalendarSchema.parse(JSON.parse(snapshot.data));
      const result = operation(calendar);
      if (!write) return result;
      const saved = await client.execute({
        sql: "UPDATE luma SET data = ?, revision = revision + 1 WHERE id = 1 AND revision = ?",
        args: [JSON.stringify(lumaCalendarSchema.parse(calendar)), snapshot.revision],
      });
      if (saved.rowsAffected === 1) return result;
      if (attempt + 1 === maxWriteAttempts) {
        throw new Error("Luma was updated at the same time. Please try again.");
      }
      return apply(attempt + 1);
    }
    return await apply(0);
  } finally {
    client.close();
  }
}
