import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    APP_URL: z.url({ protocol: /^https?$/ }).default("http://localhost:3000"),
    VERCEL_URL: z.string().min(1).optional(),
    NEXT_OUTPUT_DIR: z
      .string()
      .regex(/^\.next(?:-[a-z0-9-]+)?$/)
      .default(".next"),
    WORKSPACE_DATABASE_URL: z.string().startsWith("file:").default("file:./tres-demo.db"),
    WORKSPACE_AI_MODEL: z.string().min(1).default("google/gemini-3.8-flash"),
    TURSO_DATABASE_URL: z.url().default("file:./local.db"),
    TURSO_AUTH_TOKEN: z.string().min(1).optional(),
    CLERK_SECRET_KEY: z.string().min(1).optional(),
    OPENROUTER_API_KEY: z.string().min(1).optional(),
    GOOGLE_SERVICE_ACCOUNT_JSON: z.string().min(1).optional(),
    TYPESAFE_API_KEY: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    RESEND_FROM_EMAIL: z.email().optional(),
    GOOGLE_CALENDAR_ICS_URL: z.url().optional(),
    TELEGRAM_API_ID: z.coerce.number().int().positive().optional(),
    TELEGRAM_API_HASH: z.string().min(1).optional(),
    TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
    TELEGRAM_WEBHOOK_SECRET: z.string().min(1).optional(),
    TELEGRAM_MAIN_CHAT_ID: z.string().min(1).optional(),
    TELEGRAM_SESSION_ENCRYPTION_KEY: z
      .string()
      .regex(/^[a-f0-9]{64}$/i)
      .optional(),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    APP_URL: process.env.APP_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    NEXT_OUTPUT_DIR: process.env.NEXT_OUTPUT_DIR,
    WORKSPACE_DATABASE_URL: process.env.WORKSPACE_DATABASE_URL,
    WORKSPACE_AI_MODEL: process.env.WORKSPACE_AI_MODEL,
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    TYPESAFE_API_KEY: process.env.TYPESAFE_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    GOOGLE_CALENDAR_ICS_URL: process.env.GOOGLE_CALENDAR_ICS_URL,
    TELEGRAM_API_ID: process.env.TELEGRAM_API_ID,
    TELEGRAM_API_HASH: process.env.TELEGRAM_API_HASH,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
    TELEGRAM_MAIN_CHAT_ID: process.env.TELEGRAM_MAIN_CHAT_ID,
    TELEGRAM_SESSION_ENCRYPTION_KEY: process.env.TELEGRAM_SESSION_ENCRYPTION_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  emptyStringAsUndefined: true,
});
