import { writeFileSync } from "node:fs";

import { createClient } from "@libsql/client";

import { demoCalendar } from "../src/server/luma/seed";
import { demoWorkspace } from "../src/server/workspace/seed";

const url = process.env.WORKSPACE_DATABASE_URL ?? "file:./tres-demo.db";
const client = createClient({ url });

const tables = [
  { name: "workspace", data: demoWorkspace },
  { name: "luma", data: demoCalendar },
] as const;

async function reseed(table: (typeof tables)[number]) {
  await client.execute(
    `CREATE TABLE IF NOT EXISTS ${table.name} (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL CHECK (json_valid(data)), revision INTEGER NOT NULL DEFAULT 0)`,
  );
  const existing = await client.execute(`SELECT data FROM ${table.name} WHERE id = 1`);
  const previous = existing.rows[0]?.data;
  if (typeof previous === "string") {
    const backup = `${table.name}-backup-${Date.now()}.json`;
    writeFileSync(backup, previous);
    process.stdout.write(`backed up previous ${table.name} to ${backup}
`);
  }
  await client.execute({
    sql: `INSERT INTO ${table.name} (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, revision = revision + 1`,
    args: [JSON.stringify(table.data)],
  });
}

await Promise.all(tables.map(reseed));
client.close();
process.stdout.write(`reseeded ${url}
`);
