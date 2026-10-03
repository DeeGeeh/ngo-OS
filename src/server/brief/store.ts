import "server-only";

import { createClient } from "@libsql/client";
import { env } from "@/env";
import { dailyBriefSchema, type DailyBrief } from "@/lib/brief";

async function openClient() {
  const client = createClient({ url: env.WORKSPACE_DATABASE_URL });
  await client.execute(
    "CREATE TABLE IF NOT EXISTS daily_briefs (date TEXT PRIMARY KEY, data TEXT NOT NULL)",
  );
  return client;
}

export async function readBrief(date: string) {
  const client = await openClient();
  try {
    const result = await client.execute({
      sql: "SELECT data FROM daily_briefs WHERE date = ?",
      args: [date],
    });
    const data = result.rows[0]?.data;
    if (typeof data !== "string") return null;
    const parsed = dailyBriefSchema.safeParse(JSON.parse(data));
    return parsed.success ? parsed.data : null;
  } finally {
    client.close();
  }
}

export async function writeBrief(brief: DailyBrief) {
  const client = await openClient();
  try {
    await client.execute({
      sql: "INSERT INTO daily_briefs (date, data) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET data = excluded.data",
      args: [brief.date, JSON.stringify(brief)],
    });
  } finally {
    client.close();
  }
}
