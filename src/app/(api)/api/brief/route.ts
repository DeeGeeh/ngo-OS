import { env } from "@/env";
import { refreshDailyBrief } from "@/server/brief/facade";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: Request) {
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const brief = await refreshDailyBrief();
    return Response.json({ date: brief.date, generatedAt: brief.generatedAt });
  } catch {
    return new Response("The brief could not be generated.", { status: 503 });
  }
}
