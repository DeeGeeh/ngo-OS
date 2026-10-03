import "server-only";

import { env } from "@/env";

export type TelegramActor = {
  userId: string;
  orgId: string | null;
};

export async function requireTelegramActor(ownerUserId?: string | null): Promise<TelegramActor> {
  if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !env.CLERK_SECRET_KEY) {
    throw new Error("Telegram actions require an authenticated workspace.");
  }
  const { auth } = await import("@clerk/nextjs/server");
  const session = await auth();
  if (!session.isAuthenticated || !session.userId) {
    throw new Error("Sign in before using Telegram.");
  }
  if (ownerUserId && ownerUserId !== session.userId) {
    throw new Error("This Telegram account belongs to another workspace user.");
  }
  return { userId: session.userId, orgId: session.orgId ?? null };
}
