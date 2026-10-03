import { handleTelegramWebhook } from "@/server/telegram/facade";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleTelegramWebhook(request);
}
