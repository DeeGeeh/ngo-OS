import assert from "node:assert/strict";
import { test } from "node:test";

import { TRPCClientError, createTRPCClient, httpBatchLink } from "@trpc/client";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { z } from "zod";

import type { createTRPCContext } from "@/server/api/context";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { trpcConfig } from "@/trpc/config";

const fixtureRouter = createTRPCRouter({
  actor: protectedProcedure.query(({ ctx }) => ctx.userId),
  echo: protectedProcedure
    .input(z.object({ message: z.string().min(1), at: z.date() }))
    .mutation(({ input, ctx }) => ({ ...input, userId: ctx.userId })),
});

function createClient(context: Awaited<ReturnType<typeof createTRPCContext>>) {
  return createTRPCClient<typeof fixtureRouter>({
    links: [
      httpBatchLink({
        url: `https://ngo-os.test${trpcConfig.endpoint}`,
        transformer: superjson,
        fetch: (url, options) =>
          fetchRequestHandler({
            endpoint: trpcConfig.endpoint,
            req: new Request(url, options),
            router: fixtureRouter,
            createContext: () => context,
          }),
      }),
    ],
  });
}

await test("tRPC transport enforces auth, validates inputs, and preserves typed responses", async () => {
  const anonymous = createClient({ userId: null, orgId: null });
  await assert.rejects(anonymous.actor.query(), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.equal(TRPCClientError.from<typeof fixtureRouter>(error).data?.code, "UNAUTHORIZED");
    return true;
  });

  const client = createClient({ userId: "fixture-user", orgId: null });
  assert.equal(await client.actor.query(), "fixture-user");

  const at = new Date("2026-10-03T12:00:00.000Z");
  const result = await client.echo.mutate({ message: "ready", at });
  assert.deepEqual(result, { message: "ready", at, userId: "fixture-user" });
  assert.equal(result.at.toISOString(), "2026-10-03T12:00:00.000Z");

  await assert.rejects(client.echo.mutate({ message: "", at }), (error: unknown) => {
    assert.ok(error instanceof Error);
    const rpcError = TRPCClientError.from<typeof fixtureRouter>(error);
    assert.equal(rpcError.data?.code, "BAD_REQUEST");
    assert.ok(rpcError.data?.zodError?.fieldErrors.message?.length);
    return true;
  });
});
