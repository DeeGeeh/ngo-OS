# NGO OS (placeholder name)

Next.js/T3 scaffold for a NGO Operating System made for a hackathon.

- [Product context](docs/product-context.md)
- [Luo research](docs/research/luo-ngo-demo/README.md)
- [Claude subscription integration research](docs/research/claude-subscriptions.md)

## Development

Requires Node 24 and pnpm.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

`/` contains the cloud hero. `/dashboard` contains only the sidebar. `/sign-in` and `/sign-up` use Clerk when credentials are configured.

Provider keys are optional until their integrations are used. Configure them in `.env.local`; names and defaults are in `.env.example` and `src/env.ts`. The database defaults to local SQLite. Never commit keys.

Set `APP_URL` to the local origin if using a port other than 3000. Vercel supplies `VERCEL_URL` for hosted environments.

## Commands

```sh
pnpm check          # architecture, lint, formatting, types, integration
pnpm test:integration
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## Structure

```text
docs/                  Product context and research, grouped by topic
src/app/(marketing)/    Marketing routes and private _components
src/app/(workspace)/    Dashboard routes and private UI
src/app/(auth)/         Clerk routes
src/app/(api)/          API route handlers
src/components/ui/     Shared UI and registry components
src/hooks/             Shared UI hooks
src/lib/               Shared utilities
src/server/db/         Database connection and schema
src/server/api/        tRPC router, Clerk context, and HTTP adapter
src/trpc/              Typed client, request caches, and RSC hydration
src/styles/            Shared styles and generated theme tokens
src/env.ts             Validated configuration
src/proxy.ts           Next.js request proxy
```

Add data domains under `src/server/<domain>/` when needed. Routes and other domains access their data through `facade.ts`; each facade imports `server-only`. Keep storage/provider details private. Oxlint enforces resolved import boundaries, provider restrictions, known source locations, and cycles through `pnpm check` and CI.

The tRPC router starts empty. Add thin procedures that validate inputs and call domain facades. Use `protectedProcedure` for authenticated operations. Client components use `useTRPC()` with React Query options; Server Components use `trpc`, `getQueryClient`, and `HydrateClient` from `src/trpc/server.tsx`. SuperJSON preserves values through HTTP and hydration.

## UI

Components use shadcn, Tailwind, Motion, and Inter. Both light and dark palettes are available.

Change theme tokens through the theme builder and shadcn CLI. Reapply Inter after importing a theme.

```sh
pnpm ui add https://tweakcn.com/r/themes/vercel.json
pnpm ui add @shadcn/font-inter
```

Official provider skills are in `.agents/skills`. Read the relevant skill before adding provider logic.
