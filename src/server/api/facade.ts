import "server-only";

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { trpcConfig } from "@/trpc/config";

import { appRouter } from "./router";
import { createTRPCContext } from "./context";

export { appRouter, createTRPCContext };
export type { AppRouter } from "./router";

export function handleTRPCRequest(req: Request) {
  return fetchRequestHandler({
    endpoint: trpcConfig.endpoint,
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });
}
