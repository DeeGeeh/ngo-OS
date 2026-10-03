import "server-only";

import { env } from "@/env";

export type TelegramOrganizerConfig = {
  apiId: number;
  apiHash: string;
  sessionEncryptionKey: string;
};

export type TelegramBotConfig = {
  botToken: string;
  webhookSecret: string;
  mainChatId: string;
};

export function getTelegramOrganizerConfig() {
  const {
    TELEGRAM_API_ID: apiId,
    TELEGRAM_API_HASH: apiHash,
    TELEGRAM_SESSION_ENCRYPTION_KEY: sessionEncryptionKey,
  } = env;
  if (apiId === undefined || !apiHash || !sessionEncryptionKey) {
    throw new Error("Telegram organizer configuration is incomplete.");
  }
  return { apiId, apiHash, sessionEncryptionKey };
}

export function getTelegramBotConfig(): TelegramBotConfig {
  const {
    TELEGRAM_BOT_TOKEN: botToken,
    TELEGRAM_WEBHOOK_SECRET: webhookSecret,
    TELEGRAM_MAIN_CHAT_ID: mainChatId,
  } = env;
  if (!botToken || !webhookSecret || !mainChatId) {
    throw new Error("Telegram bot configuration is incomplete.");
  }

  return { botToken, webhookSecret, mainChatId };
}
