import { writeFileSync } from "node:fs";

import { createClient } from "@libsql/client";

import { demoWorkspace } from "../src/server/workspace/seed";

const url = process.env.WORKSPACE_DATABASE_URL ?? "file:./tres-demo.db";
const client = createClient({ url });

const existing = await client.execute("SELECT data FROM workspace WHERE id = 1");
const previous = existing.rows[0]?.data;
if (typeof previous === "string") {
  const backup = `workspace-backup-${Date.now()}.json`;
  writeFileSync(backup, previous);
  process.stdout.write(`backed up previous workspace to ${backup}
`);
}

await client.execute({
  sql: "UPDATE workspace SET data = ?, revision = revision + 1 WHERE id = 1",
  args: [JSON.stringify(demoWorkspace)],
});
client.close();
process.stdout.write(`reseeded ${url}
`);
