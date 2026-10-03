import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { env } from "@/env";

const clerk = clerkMiddleware();

export default function proxy(...args: Parameters<typeof clerk>) {
  if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !env.CLERK_SECRET_KEY) {
    return NextResponse.next();
  }

  return clerk(...args);
}

export const config = {
  matcher: [
    "/((?!_next|\\.well-known/workflow/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
