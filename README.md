# NGO OS

Next.js/T3 scaffold for the NGO Operating System hackathon. No domain features yet.

## Development

Requires Node 24 and pnpm.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

`/` contains the cloud hero. `/dashboard` contains only the sidebar. `/sign-in` and `/sign-up` use Clerk when credentials are configured.

Provider keys are optional until their integrations are used. Configure them in `.env.local`; names and defaults are in `.env.example` and `src/env.ts`. The database defaults to local SQLite. Never commit keys.

## Commands

```sh
pnpm check          # architecture, lint, formatting, types
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## Structure

```text
src/app/(marketing)/    Marketing routes and private _components
src/app/(workspace)/    Dashboard routes and private UI
src/app/(auth)/         Clerk routes
src/components/ui/     Shared UI and registry components
src/hooks/             Shared UI hooks
src/lib/               Shared utilities
src/server/db/         Database connection and schema
src/styles/            Shared styles and generated theme tokens
src/env.ts             Validated configuration
src/proxy.ts           Next.js request proxy
```

Add data domains under `src/server/<domain>/` when needed. Routes and other domains access their data through `facade.ts`; each facade imports `server-only`. Keep storage/provider details private. Oxlint enforces resolved import boundaries, provider restrictions, known source locations, and cycles through `pnpm check` and CI.

## UI

Components use shadcn, Tailwind, Motion, and Inter. Both light and dark palettes are available.

Change theme tokens through the theme builder and shadcn CLI. Reapply Inter after importing a theme.

```sh
pnpm ui add https://tweakcn.com/r/themes/vercel.json
pnpm ui add @shadcn/font-inter
```

Official provider skills are in `.agents/skills`. Read the relevant skill before adding provider logic.
