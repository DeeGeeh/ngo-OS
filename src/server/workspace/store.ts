import "server-only";

import { createClient } from "@libsql/client";
import { z } from "zod";

import { env } from "@/env";
import { workspaceSchema, type Workspace } from "@/lib/workspace";

import { demoWorkspace } from "./seed";

const snapshotSchema = z.object({ data: z.string(), revision: z.number().int().nonnegative() });
const maxWriteAttempts = 20;

export async function withWorkspace<T>(operation: (workspace: Workspace) => T, write = true) {
  const client = createClient({ url: env.WORKSPACE_DATABASE_URL });
  try {
    await client.batch([
      "CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL CHECK (json_valid(data)), revision INTEGER NOT NULL DEFAULT 0)",
      {
        sql: "INSERT OR IGNORE INTO workspace (id, data) VALUES (1, ?)",
        args: [JSON.stringify(demoWorkspace)],
      },
    ]);
    async function apply(attempt: number): Promise<T> {
      const rows = await client.execute("SELECT data, revision FROM workspace WHERE id = 1");
      const snapshot = snapshotSchema.parse(rows.rows[0]);
      const workspace = workspaceSchema.parse(JSON.parse(snapshot.data));
      const result = operation(workspace);
      if (!write) return result;
      const saved = await client.execute({
        sql: "UPDATE workspace SET data = ?, revision = revision + 1 WHERE id = 1 AND revision = ?",
        args: [JSON.stringify(workspaceSchema.parse(workspace)), snapshot.revision],
      });
      if (saved.rowsAffected === 1) return result;
      if (attempt + 1 === maxWriteAttempts) {
        throw new Error("The workspace changed repeatedly. Please try again.");
      }
      return apply(attempt + 1);
    }
    return await apply(0);
  } finally {
    client.close();
  }
}
