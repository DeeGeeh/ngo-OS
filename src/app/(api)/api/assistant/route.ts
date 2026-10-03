import { streamAssistant } from "@/server/assistant/facade";

export const maxDuration = 60;

export async function POST(request: Request) {
  return streamAssistant(request);
}
