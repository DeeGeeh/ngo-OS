import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { MockLanguageModelV4 } from "ai/test";

await test("Daily brief uses workspace context, persists results and protects scheduled refresh", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "nest-brief-"));
  Object.assign(process.env, {
    WORKSPACE_DATABASE_URL: `file:${join(directory, "workspace.db")}`,
    OPENROUTER_API_KEY: "test-key",
    CRON_SECRET: "x".repeat(32),
  });
  let calls = 0;
  let fail = false;
  let citedSource = "Board and team messages";
  let prompt = "";
  const model = new MockLanguageModelV4({
    doGenerate: async (options) => {
      calls += 1;
      prompt = JSON.stringify(options.prompt);
      if (fail) throw new Error("Provider unavailable");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              summary: "Founder Night needs a decision after all speakers cancelled.",
              actions: [
                {
                  title: "Track speaker cancellations",
                  instruction:
                    "Create an unassigned follow-up task for Founder Night speaker cancellations, without guessing a project.",
                  canHandle: true,
                  sources: [citedSource],
                },
                {
                  title: "Confirm the affected project",
                  instruction: "Ask the team which project Founder Night refers to.",
                  canHandle: false,
                  sources: [citedSource],
                },
              ],
            }),
          },
        ],
        finishReason: { unified: "stop", raw: undefined },
        usage: {
          inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
          outputTokens: { total: 1, text: 1, reasoning: undefined },
        },
        warnings: [],
      };
    },
  });
  t.mock.module("@openrouter/ai-sdk-provider", {
    exports: { createOpenRouter: () => () => model },
  });
  t.mock.module("@/server/google/facade", {
    exports: {
      getGoogleConnection: async () => ({ kind: "disconnected" }),
      getGoogleAccessToken: async () => {
        throw new Error("Google is disconnected");
      },
      getUpcomingGoogleEvents: async () => [],
    },
  });
  const { appendTelegramMessage } = await import("@/server/workspace/facade");
  const { getDailyBrief, refreshDailyBrief } = await import("@/server/brief/facade");
  const { GET } = await import("@/app/(api)/api/brief/route");
  try {
    await appendTelegramMessage({
      externalId: "test:1",
      authorId: "diar",
      authorName: "Diar",
      text: "Every speaker cancelled Founder Night.",
      createdAt: new Date().toISOString(),
    });
    const first = await getDailyBrief();
    assert.match(prompt, /Every speaker cancelled Founder Night/);
    assert.match(prompt, /Startup World Tampere/);
    assert.equal(first.actions[0]?.canHandle, true);
    assert.equal(first.actions[1]?.canHandle, false);
    assert.ok(first.unavailableSources.includes("Connected Google Calendar"));
    assert.deepEqual(await getDailyBrief(), first);
    assert.equal(calls, 1);
    await Promise.all([refreshDailyBrief(), refreshDailyBrief()]);
    assert.equal(calls, 2);
    fail = true;
    await assert.rejects(refreshDailyBrief(), /Provider unavailable/);
    assert.equal((await getDailyBrief()).summary, first.summary);
    fail = false;
    citedSource = "Invented source";
    await assert.rejects(refreshDailyBrief(), /unknown source/);
    assert.equal((await getDailyBrief()).summary, first.summary);
    const unauthorized = await GET(new Request("http://localhost/api/brief"));
    assert.equal(unauthorized.status, 401);
    citedSource = "Board and team messages";
    const scheduled = await GET(
      new Request("http://localhost/api/brief", {
        headers: { authorization: `Bearer ${"x".repeat(32)}` },
      }),
    );
    assert.equal(scheduled.status, 200);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
