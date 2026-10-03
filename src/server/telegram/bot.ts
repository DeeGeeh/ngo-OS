import "server-only";

import { Bot } from "grammy";
import { start } from "workflow/api";

import type { TelegramBotConfig } from "./config";
import { getTelegramMemberIdentityByTelegramUserId } from "./store";
import { ingestTelegramMessage } from "./ingestion";

export function createTelegramBot(config: TelegramBotConfig) {
  const bot = new Bot(config.botToken);
  bot.on("message:text", async (ctx) => {
    if (String(ctx.chat.id) !== config.mainChatId) return;
    const telegramUserId = String(ctx.from.id);
    const identity = await getTelegramMemberIdentityByTelegramUserId(telegramUserId);
    await start(ingestTelegramMessage, [
      {
        externalId: `${ctx.chat.id}:${ctx.message.message_id}`,
        authorId: identity?.workspace_member_id ?? `telegram-${telegramUserId}`,
        authorName:
          [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" ") || ctx.from.username,
        text: ctx.message.text,
        createdAt: new Date(ctx.message.date * 1000).toISOString(),
      },
    ]);
  });
  return bot;
}
