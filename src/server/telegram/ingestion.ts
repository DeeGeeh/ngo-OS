import { classifyJevMessage } from "./relevance";
import { appendTelegramMessage } from "@/server/workspace/facade";

import type { AppendTelegramMessage } from "@/lib/workspace";

export async function ingestTelegramMessage(input: AppendTelegramMessage) {
  "use workflow";
  const classification = await classifyTelegramMessage(input.text);
  if (!classification.relevant) return { stored: false, reason: classification.reason };
  await storeTelegramMessage(input);
  return { stored: true, reason: classification.reason };
}

async function classifyTelegramMessage(text: string) {
  "use step";
  return classifyJevMessage(text);
}

async function storeTelegramMessage(input: AppendTelegramMessage) {
  "use step";
  return appendTelegramMessage(input);
}
