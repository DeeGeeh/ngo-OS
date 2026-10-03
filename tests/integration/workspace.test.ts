import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

import { workspaceSchema } from "@/lib/workspace";

const runProcess = promisify(execFile);

await test("workspace facade persists valid edits in an isolated local database", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "tres-workspace-"));
  const databaseUrl = `file:${join(directory, "workspace.db")}`;
  process.env.WORKSPACE_DATABASE_URL = databaseUrl;
  const workspace = await import("@/server/workspace/facade");
  try {
    await t.test(
      "projects and their channels commit together and renames preserve fields",
      async () => {
        const project = await workspace.createProject({
          title: "  Community Lunch  ",
          description: "Meet the new members.",
          status: "todo",
          assigneeIds: ["aino", "diar"],
          dueDate: "2026-11-12",
          location: "Campus cafe",
        });
        assert.equal(project.title, "Community Lunch");
        const saved = await workspace.getWorkspace();
        assert.deepEqual(
          saved.projects.find((item) => item.id === project.id),
          project,
        );
        const channels = saved.channels.filter(
          (channel) => channel.kind === "project" && channel.projectId === project.id,
        );
        assert.equal(channels.length, 1);
        assert.equal(channels[0]?.name, "Community Lunch");

        const updated = await workspace.updateProject({
          id: project.id,
          title: "Member Lunch",
          location: undefined,
        });
        assert.deepEqual(updated, { ...project, title: "Member Lunch" });
        const renamed = await workspace.getWorkspace();
        assert.equal(
          renamed.channels.find((channel) => channel.id === channels[0]?.id)?.name,
          "Member Lunch",
        );
        assert.equal(
          renamed.channels.filter(
            (channel) => channel.kind === "project" && channel.projectId === project.id,
          ).length,
          1,
        );

        const beforeInvalid = await workspace.getWorkspace();
        await assert.rejects(
          workspace.createProject({ ...project, title: "Invalid", assigneeIds: ["missing"] }),
          /member does not exist/,
        );
        await assert.rejects(
          workspace.updateProject({ id: project.id, assigneeIds: ["aino", "aino"] }),
          /only once/,
        );
        await assert.rejects(
          workspace.updateProject({ id: "missing", status: "done" }),
          /Project does not exist/,
        );
        assert.deepEqual(await workspace.getWorkspace(), beforeInvalid);
      },
    );

    await t.test(
      "tasks validate references and partial updates preserve or clear fields",
      async () => {
        const task = await workspace.createTask({
          title: "  Order lunch  ",
          description: "Include a vegan option.",
          status: "todo",
          projectId: "campus-builders",
          assigneeIds: ["leo"],
          dueDate: "2026-10-30",
        });
        assert.equal(task.title, "Order lunch");
        const updated = await workspace.updateTask({
          id: task.id,
          status: "doing",
          title: undefined,
        });
        assert.deepEqual(updated, { ...task, status: "doing" });
        const cleared = await workspace.updateTask({
          id: task.id,
          projectId: null,
          dueDate: null,
          assigneeIds: [],
        });
        assert.deepEqual(cleared, { ...updated, projectId: null, dueDate: null, assigneeIds: [] });

        const beforeInvalid = await workspace.getWorkspace();
        await assert.rejects(
          workspace.createTask({ ...task, projectId: "missing" }),
          /Project does not exist/,
        );
        await assert.rejects(
          workspace.createTask({ ...task, assigneeIds: ["missing"] }),
          /member does not exist/,
        );
        await assert.rejects(
          workspace.updateTask({ id: task.id, projectId: "missing" }),
          /Project does not exist/,
        );
        await assert.rejects(
          workspace.updateTask({ id: task.id, assigneeIds: ["diar", "diar"] }),
          /only once/,
        );
        await assert.rejects(
          workspace.updateTask({ id: "missing", status: "done" }),
          /Task does not exist/,
        );
        await assert.rejects(workspace.updateTask({ id: task.id, title: " " }));
        assert.deepEqual(await workspace.getWorkspace(), beforeInvalid);
      },
    );

    await t.test(
      "messages use the current member and only accept existing conversation targets",
      async () => {
        const channelMessage = await workspace.sendMessage({
          conversation: { kind: "channel", id: "general" },
          text: "  Lunch is ready.  ",
        });
        assert.equal(channelMessage.text, "Lunch is ready.");
        assert.equal(channelMessage.authorId, "diar");
        assert.deepEqual(channelMessage.conversation, { kind: "channel", id: "general" });
        const taskMessage = await workspace.sendMessage({
          conversation: { kind: "task", id: "campus-format" },
          text: "I can help.",
        });
        assert.equal(taskMessage.text, "I can help.");
        const saved = await workspace.getWorkspace();
        assert.deepEqual(
          saved.messages.find((message) => message.id === channelMessage.id),
          channelMessage,
        );
        assert.deepEqual(
          saved.messages.find((message) => message.id === taskMessage.id),
          taskMessage,
        );
        await assert.rejects(
          workspace.sendMessage({
            conversation: { kind: "channel", id: "campus-format" },
            text: "Wrong target",
          }),
          /Conversation does not exist/,
        );
        await assert.rejects(
          workspace.sendMessage({
            conversation: { kind: "task", id: "general" },
            text: "Wrong target",
          }),
          /Conversation does not exist/,
        );
        await assert.rejects(
          workspace.sendMessage({ conversation: { kind: "task", id: "missing" }, text: "Missing" }),
          /Conversation does not exist/,
        );
        await assert.rejects(
          workspace.sendMessage({ conversation: { kind: "channel", id: "general" }, text: " " }),
        );
        assert.deepEqual(await workspace.getWorkspace(), saved);
      },
    );

    await t.test(
      "concurrent writes retain every project, channel, and independent task field",
      async () => {
        const created = await Promise.all(
          Array.from({ length: 8 }, (_, index) =>
            workspace.createProject({
              title: `Parallel project ${index}`,
              description: "Created together.",
              status: "todo",
              assigneeIds: ["diar"],
              dueDate: null,
              location: "Tampere",
            }),
          ),
        );
        await Promise.all([
          workspace.updateTask({ id: "campus-format", title: "Finalize the builder format" }),
          workspace.updateTask({ id: "campus-format", status: "done" }),
          workspace.updateTask({ id: "campus-format", assigneeIds: ["diar", "leo"] }),
        ]);
        const saved = await workspace.getWorkspace();
        for (const project of created) {
          assert.deepEqual(
            saved.projects.find((item) => item.id === project.id),
            project,
          );
          const channels = saved.channels.filter(
            (channel) => channel.kind === "project" && channel.projectId === project.id,
          );
          assert.equal(channels.length, 1);
          assert.equal(channels[0]?.name, project.title);
        }
        const task = saved.tasks.find((item) => item.id === "campus-format");
        assert.equal(task?.title, "Finalize the builder format");
        assert.equal(task?.status, "done");
        assert.deepEqual(task?.assigneeIds, ["diar", "leo"]);
      },
    );

    await t.test("a fresh process reloads the persisted workspace", async () => {
      const { stdout } = await runProcess(
        process.execPath,
        [
          "--import",
          "tsx",
          "--conditions=react-server",
          "--input-type=module",
          "--eval",
          'import { getWorkspace } from "./src/server/workspace/facade.ts"; process.stdout.write(JSON.stringify(await getWorkspace()));',
        ],
        { env: { ...process.env, WORKSPACE_DATABASE_URL: databaseUrl } },
      );
      const persisted = workspaceSchema.parse(JSON.parse(stdout));
      assert.deepEqual(persisted, await workspace.getWorkspace());
      assert.equal(
        persisted.tasks.find((task) => task.id === "campus-format")?.title,
        "Finalize the builder format",
      );
      assert.equal(
        persisted.messages.find((message) => message.text === "Lunch is ready.")?.authorId,
        "diar",
      );
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
