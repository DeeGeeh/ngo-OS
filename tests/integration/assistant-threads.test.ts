import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

await test("saved assistant threads retain isolated message branches across reloads", async () => {
  const directory = await mkdtemp(join(tmpdir(), "tres-threads-"));
  process.env.WORKSPACE_DATABASE_URL = `file:${join(directory, "workspace.db")}`;
  const {
    deleteAssistantThread,
    initializeAssistantThread,
    listAssistantThreads,
    readAssistantThread,
    saveAssistantMessage,
    selectAssistantBranch,
    updateAssistantThread,
  } = await import("@/server/assistant/facade");
  const user = { role: "user", parts: [{ type: "text", text: "Plan volunteer onboarding" }] };
  const reply = {
    role: "assistant",
    parts: [{ type: "text", text: "Ask Aino to lead onboarding." }],
  };
  try {
    const first = await initializeAssistantThread("first-thread");
    assert.deepEqual(await initializeAssistantThread("first-thread"), first);
    await initializeAssistantThread("second-thread");
    await saveAssistantMessage({
      threadId: "first-thread",
      select: true,
      message: { id: "user-1", parentId: null, format: "ai-sdk/v6", content: user },
    });
    await saveAssistantMessage({
      threadId: "first-thread",
      select: true,
      message: { id: "reply-1", parentId: "user-1", format: "ai-sdk/v6", content: reply },
    });
    await saveAssistantMessage({
      threadId: "first-thread",
      select: true,
      message: {
        id: "reply-2",
        parentId: "user-1",
        format: "ai-sdk/v6",
        content: {
          role: "assistant",
          parts: [{ type: "text", text: "Ask Diar to lead onboarding." }],
        },
      },
    });
    await saveAssistantMessage({
      threadId: "first-thread",
      select: true,
      message: {
        id: "user-edited",
        parentId: null,
        format: "ai-sdk/v6",
        content: { role: "user", parts: [{ type: "text", text: "Plan project staffing" }] },
      },
    });
    await selectAssistantBranch({ threadId: "first-thread", headId: "reply-1" });
    await saveAssistantMessage({
      threadId: "first-thread",
      select: false,
      message: {
        id: "reply-2",
        parentId: "user-1",
        format: "ai-sdk/v6",
        content: { role: "assistant", parts: [{ type: "text", text: "Diar has confirmed." }] },
      },
    });
    const saved = await readAssistantThread("first-thread");
    assert.equal(saved.thread.title, "Plan volunteer onboarding");
    assert.equal(saved.thread.headId, "reply-1");
    assert.deepEqual(
      saved.messages.map(({ id, parentId }) => ({ id, parentId })),
      [
        { id: "user-1", parentId: null },
        { id: "reply-1", parentId: "user-1" },
        { id: "reply-2", parentId: "user-1" },
        { id: "user-edited", parentId: null },
      ],
    );
    assert.deepEqual(saved.messages[2]?.content, {
      role: "assistant",
      parts: [{ type: "text", text: "Diar has confirmed." }],
    });
    const other = await readAssistantThread("second-thread");
    assert.equal(other.thread.title, "New conversation");
    assert.equal(other.thread.headId, null);
    assert.deepEqual(other.messages, []);

    const invalidMessages = [
      { id: "foreign-parent", parentId: "reply-1", format: "ai-sdk/v6", content: user },
      { id: "bad-format", parentId: null, format: "unsupported", content: user },
      {
        id: "bad-message",
        parentId: null,
        format: "ai-sdk/v6",
        content: { role: "user", parts: [{ type: "text", text: 42 }] },
      },
    ];
    await Promise.all(
      invalidMessages.map((message) =>
        assert.rejects(saveAssistantMessage({ threadId: "second-thread", select: true, message })),
      ),
    );
    await assert.rejects(selectAssistantBranch({ threadId: "second-thread", headId: "reply-1" }));
    assert.deepEqual(await readAssistantThread("second-thread"), other);
    assert.deepEqual(await readAssistantThread("first-thread"), saved);

    await updateAssistantThread("first-thread", { title: "Onboarding", status: "archived" });
    const listed = await listAssistantThreads();
    assert.deepEqual(
      listed
        .map(({ id, title, status }) => ({ id, title, status }))
        .toSorted((a, b) => a.id.localeCompare(b.id)),
      [
        { id: "first-thread", title: "Onboarding", status: "archived" },
        { id: "second-thread", title: "New conversation", status: "regular" },
      ],
    );
    await updateAssistantThread("first-thread", { status: "regular" });
    assert.equal((await readAssistantThread("first-thread")).thread.status, "regular");
    await deleteAssistantThread("first-thread");
    await assert.rejects(readAssistantThread("first-thread"), /does not exist/);
    assert.deepEqual(
      (await listAssistantThreads()).map((thread) => thread.id),
      ["second-thread"],
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
