import "server-only";

import { auth } from "@clerk/nextjs/server";
import { cache } from "react";

import { env } from "@/env";

export const createTRPCContext = cache(async () => {
  const session =
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY ? await auth() : null;

  if (!session?.isAuthenticated) {
    return { userId: null, orgId: null };
  }

  return { userId: session.userId, orgId: session.orgId ?? null };
});
