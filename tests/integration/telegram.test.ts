import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { MockLanguageModelV4 } from "ai/test";

import bigInt from "big-integer";
import { Bot } from "grammy";
import { Api, TelegramClient } from "telegram";
import { AuthKey } from "telegram/crypto/AuthKey";
import { RPCError } from "telegram/errors";
import type { UserPasswordAuthParams } from "telegram/client/auth";
import type { AppendTelegramMessage } from "@/lib/workspace";

function webhookRequest(body: unknown, secret: string) {
  return new Request("https://example.test/api/telegram/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": secret,
    },
    body: JSON.stringify(body),
  });
}

await test("Telegram organizer and bot flows use shared facades and isolated persistence", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "tres-telegram-"));
  Object.assign(process.env, {
    WORKSPACE_DATABASE_URL: `file:${join(directory, "workspace.db")}`,
    TELEGRAM_API_ID: "12345",
    TELEGRAM_API_HASH: "test-api-hash",
    TELEGRAM_SESSION_ENCRYPTION_KEY: "ab".repeat(32),
    TELEGRAM_BOT_TOKEN: "12345:test-token",
    TELEGRAM_WEBHOOK_SECRET: "test-webhook-secret",
    TELEGRAM_MAIN_CHAT_ID: "-10012345",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_test",
    CLERK_SECRET_KEY: "sk_test_test",
    OPENROUTER_API_KEY: "test-key",
  });
  let actor: string | null = "owner";
  const queued: AppendTelegramMessage[] = [];
  t.mock.module("@clerk/nextjs/server", {
    exports: { auth: async () => ({ isAuthenticated: actor !== null, userId: actor }) },
  });
  t.mock.module("workflow/api", {
    exports: {
      start: async (_workflow: unknown, [input]: [AppendTelegramMessage]) => queued.push(input),
    },
  });
  let relevant = true;
  const model = new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            relevant,
            reason: relevant ? "Project coordination" : "Routine chatter",
          }),
        },
      ],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 1, text: 1, reasoning: undefined },
      },
      warnings: [],
    }),
  });
  t.mock.module("@openrouter/ai-sdk-provider", {
    exports: { createOpenRouter: () => () => model },
  });
  const organizer = new Api.User({ id: bigInt(100), username: "organizer", firstName: "Diar" });
  const aino = new Api.User({
    id: bigInt(101),
    accessHash: bigInt(201),
    firstName: "Aino",
    username: "aino",
  });
  const leo = new Api.User({
    id: bigInt(102),
    accessHash: bigInt(202),
    firstName: "Leo",
    username: "leo",
  });
  const elias = new Api.User({
    id: bigInt(103),
    accessHash: bigInt(203),
    firstName: "Elias",
    username: "elias",
  });
  let authorized = true;
  let rejectCreation = false;
  let rejectLink = false;
  let creationCount = 0;
  const invited: string[] = [];
  const sent: string[] = [];
  t.mock.method(TelegramClient.prototype, "connect", async function (this: TelegramClient) {
    this.session.setDC(2, "149.154.167.50", 443);
    const key = new AuthKey();
    await key.setKey(Buffer.alloc(256, 1));
    this.session.setAuthKey(key);
    return true;
  });
  t.mock.method(TelegramClient.prototype, "disconnect", async () => undefined);
  t.mock.method(TelegramClient.prototype, "checkAuthorization", async () => authorized);
  t.mock.method(TelegramClient.prototype, "sendCode", async () => ({
    phoneCodeHash: "code-hash",
    isCodeViaApp: true,
  }));
  t.mock.method(
    TelegramClient.prototype,
    "signInWithPassword",
    async (_credentials: unknown, params: UserPasswordAuthParams) => {
      const password = await params.password?.();
      if (password !== "correct-password") {
        await params.onError(new Error("PASSWORD_HASH_INVALID"));
        throw new Error("Unexpected password retry.");
      }
      return organizer;
    },
  );
  t.mock.method(TelegramClient.prototype, "getEntity", async (identifier: string) => {
    const user = [aino, leo, elias].find((item) => item.username === identifier);
    if (!user) throw new Error("USERNAME_NOT_OCCUPIED");
    return user;
  });
  t.mock.method(TelegramClient.prototype, "iterParticipants", async function* () {
    yield elias;
  });
  t.mock.method(TelegramClient.prototype, "invoke", async (request: Api.AnyRequest) => {
    if (request instanceof Api.auth.SignIn)
      throw new RPCError("SESSION_PASSWORD_NEEDED", request, 401);
    if (request instanceof Api.channels.CreateChannel) {
      if (rejectCreation) throw new RPCError("CHAT_ADMIN_REQUIRED", request, 400);
      creationCount++;
      assert.ok(request.about.length <= 255);
      return new Api.Updates({
        updates: [],
        users: [],
        chats: [
          new Api.Channel({
            id: bigInt(300 + creationCount),
            accessHash: bigInt(400),
            title: request.title,
            megagroup: true,
            photo: new Api.ChatPhotoEmpty(),
            date: 1,
          }),
        ],
        date: 1,
        seq: 1,
      });
    }
    if (request instanceof Api.channels.InviteToChannel) {
      const user = request.users[0];
      assert.ok(user instanceof Api.InputUser);
      invited.push(user.userId.toString());
      return new Api.messages.InvitedUsers({
        updates: new Api.UpdatesTooLong(),
        missingInvitees: user.userId.equals(leo.id)
          ? [new Api.MissingInvitee({ userId: leo.id })]
          : [],
      });
    }
    if (request instanceof Api.messages.ExportChatInvite) {
      if (rejectLink) throw new RPCError("CHAT_ADMIN_REQUIRED", request, 400);
      return new Api.ChatInviteExported({
        link: "https://t.me/+test-link",
        adminId: organizer.id,
        date: 1,
      });
    }
    throw new Error(`Unexpected Telegram request ${request.className}`);
  });
  t.mock.method(
    TelegramClient.prototype,
    "sendMessage",
    async (_peer: unknown, input: { message: string }) => {
      sent.push(input.message);
      return new Api.Message({ id: 1, message: input.message, date: 1 });
    },
  );
  t.mock.method(TelegramClient.prototype, "iterMessages", async function* () {
    yield new Api.Message({ id: 2, message: "Meet at six", date: 1 });
  });
  const initializeBot = t.mock.method(Bot.prototype, "init", async function (this: Bot) {
    this.botInfo = {
      id: 12345,
      is_bot: true,
      first_name: "Jev",
      username: "jev_bot",
      can_join_groups: true,
      can_read_all_group_messages: true,
      supports_inline_queries: false,
      can_connect_to_business: false,
      has_main_web_app: false,
      has_topics_enabled: false,
      allows_users_to_create_topics: false,
      can_manage_bots: false,
      supports_join_request_queries: false,
    };
  });
  const telegram = await import("@/server/telegram/facade");
  const store = await import("@/server/telegram/store");
  const workspace = await import("@/server/workspace/facade");
  const { workspaceTools } = await import("@/server/assistant/facade");
  try {
    const telegramProject = await workspace.createProject({
      title: "Telegram coordination",
      description: "Project for organizer and agent integration checks",
      status: "todo",
      assigneeIds: ["aino", "leo", "elias", "noora"],
      dueDate: null,
      location: "Campus",
    });
    await t.test(
      "login resumes two-step verification and binds encrypted sessions to the owner",
      async () => {
        await telegram.startTelegramLogin({ phoneNumber: "+3581234567" });
        assert.deepEqual(await telegram.completeTelegramLogin({ code: "12345" }), {
          requiresPassword: true,
        });
        assert.equal((await telegram.getTelegramStatus()).loginPhase, "password");
        await assert.rejects(
          telegram.completeTelegramLogin({ password: "wrong" }),
          /PASSWORD_HASH_INVALID/,
        );
        await telegram.completeTelegramLogin({ password: "correct-password" });
        const state = await store.getTelegramIntegrationState();
        assert.equal(state.owner_user_id, "owner");
        assert.equal(state.organizer_user_id, "100");
        assert.ok(state.organizer_session);
        assert.equal(state.pending_session, null);
        assert.ok(!JSON.stringify(state).includes("correct-password"));
        actor = "other-owner";
        await assert.rejects(telegram.getTelegramStatus(), /another workspace user/);
        await assert.rejects(
          telegram.sendTelegramProjectMessage({ projectId: telegramProject.id, text: "blocked" }),
          /another workspace user/,
        );
        actor = "owner";
      },
    );
    await t.test(
      "member identity mappings and group creation preserve ownership and retries",
      async () => {
        await telegram.linkTelegramMember({ memberId: "aino", username: "@aino" });
        await telegram.linkTelegramMember({ memberId: "leo", username: "@leo" });
        await telegram.linkTelegramMember({ memberId: "elias", username: "@elias" });
        await assert.rejects(
          telegram.linkTelegramMember({ memberId: "noora", username: "@aino" }),
          /UNIQUE/,
        );
        const project = await workspace.createProject({
          title: "Same title",
          description: "x".repeat(500),
          status: "todo",
          assigneeIds: ["aino"],
          dueDate: null,
          location: "Campus",
        });
        rejectCreation = true;
        await assert.rejects(
          telegram.ensureProjectTelegramGroup({ projectId: project.id }),
          /CHAT_ADMIN_REQUIRED/,
        );
        rejectCreation = false;
        const creations = await Promise.allSettled([
          telegram.ensureProjectTelegramGroup({ projectId: project.id }),
          telegram.ensureProjectTelegramGroup({ projectId: project.id }),
        ]);
        assert.ok(creations.some((result) => result.status === "fulfilled"));
        const group = await telegram.ensureProjectTelegramGroup({ projectId: project.id });
        assert.deepEqual(group, {
          projectId: project.id,
          telegramChatId: "301",
          title: "Same title",
        });
        assert.equal(creationCount, 1);
        const second = await workspace.createProject({
          title: project.title,
          description: "Another project",
          status: "todo",
          assigneeIds: [],
          dueDate: null,
          location: "Campus",
        });
        assert.equal(
          (await telegram.ensureProjectTelegramGroup({ projectId: second.id })).telegramChatId,
          "302",
        );
        authorized = false;
        await assert.rejects(
          telegram.sendTelegramProjectMessage({ projectId: project.id, text: "blocked" }),
          /session has expired/,
        );
        authorized = true;
        await telegram.ensureProjectTelegramGroup({ projectId: telegramProject.id });
      },
    );
    await t.test(
      "agent tools return partial invitations, read members and messages, and send through the same facade",
      async () => {
        const options = { toolCallId: "telegram-flow", messages: [], context: {} };
        assert.ok(workspaceTools.inviteTelegramProjectMembers.execute);
        const result = await workspaceTools.inviteTelegramProjectMembers.execute(
          { projectId: telegramProject.id, memberIds: ["aino", "leo", "elias", "noora", "aino"] },
          options,
        );
        assert.deepEqual(result, [
          { memberId: "aino", status: "added", reason: undefined },
          {
            memberId: "leo",
            status: "invite_required",
            reason: "Telegram did not allow direct addition for this member.",
            inviteLink: "https://t.me/+test-link",
          },
          { memberId: "elias", status: "already_member", reason: undefined },
          { memberId: "noora", status: "failed", reason: "Link this member to Telegram first." },
        ]);
        assert.deepEqual(invited, ["101", "102"]);
        rejectLink = true;
        const withoutLink = await telegram.inviteTelegramProjectMembers({
          projectId: telegramProject.id,
          memberIds: ["aino", "leo"],
        });
        assert.equal(withoutLink[0]?.status, "added");
        assert.equal(withoutLink[1]?.status, "invite_required");
        rejectLink = false;
        assert.deepEqual(
          await telegram.listTelegramProjectMembers({ projectId: telegramProject.id }),
          [{ id: "103", name: "Elias", username: "elias" }],
        );
        assert.equal(
          (await telegram.readTelegramProjectMessages({ projectId: telegramProject.id }))[0]?.text,
          "Meet at six",
        );
        assert.ok(workspaceTools.sendTelegramProjectMessage.execute);
        await workspaceTools.sendTelegramProjectMessage.execute(
          { projectId: telegramProject.id, text: "Meet at six" },
          options,
        );
        assert.deepEqual(sent, ["Meet at six"]);
      },
    );
    await t.test(
      "the bot authenticates webhooks and queues only the configured main group's messages",
      async () => {
        const update = {
          update_id: 1,
          message: {
            message_id: 5,
            date: 1,
            text: "x".repeat(4096),
            chat: { id: -10012345, type: "supergroup", title: "Main group" },
            from: { id: 101, is_bot: false, first_name: "Aino" },
          },
        };
        assert.equal(
          (await telegram.handleTelegramWebhook(webhookRequest(update, "wrong"))).status,
          401,
        );
        assert.equal(queued.length, 0);
        await telegram.handleTelegramWebhook(
          webhookRequest(
            {
              ...update,
              message: { ...update.message, chat: { ...update.message.chat, id: -999 } },
            },
            "test-webhook-secret",
          ),
        );
        assert.equal(queued.length, 0);
        assert.equal(
          (await telegram.handleTelegramWebhook(webhookRequest(update, "test-webhook-secret")))
            .status,
          200,
        );
        assert.equal(queued.length, 1);
        assert.equal(initializeBot.mock.callCount(), 1);
        assert.equal(queued[0]?.authorId, "aino");
        const input = queued[0];
        assert.ok(input);
        const before = (await workspace.getWorkspace()).messages.length;
        const { ingestTelegramMessage } = await import("@/server/telegram/ingestion");
        await Promise.all([ingestTelegramMessage(input), ingestTelegramMessage(input)]);
        const saved = await workspace.getWorkspace();
        assert.equal(saved.messages.length, before + 1);
        assert.equal(saved.messages.at(-1)?.text.length, 4096);
        assert.equal(saved.messages.at(-1)?.source, "telegram");
        relevant = false;
        assert.deepEqual(
          await ingestTelegramMessage({ ...input, externalId: "irrelevant", text: "Hello" }),
          { stored: false, reason: "Routine chatter" },
        );
        assert.equal((await workspace.getWorkspace()).messages.length, before + 1);
        actor = null;
        await assert.rejects(
          telegram.listTelegramProjectMembers({ projectId: telegramProject.id }),
          /Sign in/,
        );
      },
    );
  } finally {
    t.mock.restoreAll();
    await rm(directory, { recursive: true, force: true });
  }
});
