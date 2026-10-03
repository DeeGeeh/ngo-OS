import "server-only";

import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";

import type { createTRPCContext } from "./context";

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const zodError: ReturnType<typeof z.flattenError<Record<string, unknown>>> | null =
      error.cause instanceof z.ZodError ? z.flattenError(error.cause) : null;

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
