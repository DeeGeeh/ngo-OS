# NGO OS (placeholder name, not final)

## Product context:

This is a hackathon project. Meaning it will never reach real production use.
We are building an Operating System for NGOs.

Product scope: [docs/product-context.md](docs/product-context.md).

## Development

- Keep project documentation in `docs/`, grouped by topic. Root `README.md` and `AGENTS.md` are entry points.
- Scaffold only. Define the NGO problem before adding features or domain schemas.
- Use pnpm and latest dependencies. Never edit the lockfile manually.
- SSR first. Keep route handlers and UI thin; fetch data through `src/server/<domain>/facade.ts` (marked `server-only`).
- Co-locate route UI in its route group; reusable UI belongs in `src/components/ui`. Create domain folders only when needed; `.oxlintrc.json` enforces import boundaries.
- Env vars go through env.ts getters, never raw process.env. ; validate configuration in `src/env.ts`.
- Use existing UI libraries. Change theme tokens only through the theme builder and shadcn CLI. Inter is the default font; support light and dark without forcing either. NEVER HANDROLL UI FROM SCRATCH WE DONT HAVE TIME FOR THAT. Dashboard UI is a solved problem.
- No source comments, `any`, or safety-rule suppressions. Keep vendor lint exceptions scoped to exact files.
- No unit tests ever.
- Add integration or e2e behavior tests only when needed to cover behavior and data/code-flow integrity.
- Run `pnpm check` and `pnpm build` before handing back changes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
