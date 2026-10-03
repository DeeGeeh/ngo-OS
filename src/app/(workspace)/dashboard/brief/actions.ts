"use server";

import { auth } from "@clerk/nextjs/server";
import { refresh } from "next/cache";
import type { BriefRefreshState } from "@/lib/brief";
import { refreshDailyBrief } from "@/server/brief/facade";

export async function refreshBriefAction(): Promise<BriefRefreshState> {
  const session = await auth();
  if (!session.isAuthenticated) return { error: "Sign in to refresh the brief." };
  try {
    await refreshDailyBrief();
    refresh();
    return { error: null };
  } catch {
    return { error: "The brief could not refresh. Try again." };
  }
}
