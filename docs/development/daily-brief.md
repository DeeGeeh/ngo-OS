# Daily brief

Render the server component from the overview page:

```tsx
import { DailyBrief } from "../_components/daily-brief";

<DailyBrief />
```

The component is a compact card: one short sentence and up to three optional action items. It reuses the installed TaskItem checklist. Handle with agent starts a saved conversation for supported board actions; human decisions remain plain text. Clicking a checkbox starts the agent for that item, rather than falsely marking work completed.

The component owns its Suspense boundary. Keep it in a server-rendered page or pass it as children to a client layout. Preview it at `/dashboard/brief`.

The server facade at `src/server/brief/facade.ts` collects board tasks/projects, recent team and ingested Telegram messages, workspace calendar events, connected Google Calendar events when available, Luma events, imported source inspections, and computed saved-dashboard results. It uses the existing OpenRouter connection and model. It never mutates tasks or projects.

SQLite stores one versioned brief per Helsinki date. Older verbose brief records are regenerated when read. A first visit generates a missing daily brief; later visits reuse it. Refresh brief requires Clerk authentication. Concurrent requests in the same server share a generation. Failed refreshes preserve the saved brief. Unavailable context is named in the result. File inspections are samples, and financial totals must come from computed dashboard results. Differently named events/projects remain uncertain matches.

## Nightly refresh

`vercel.json` schedules `/api/brief` at 00:00 UTC, which is 02:00 or 03:00 in Helsinki. Configure a random `CRON_SECRET` of at least 32 characters in the deployment environment. The endpoint requires `Authorization: Bearer <CRON_SECRET>` and otherwise returns 401. No deployment is performed by adding this configuration.

For a self-hosted demo, the component still generates the day's brief on the first visit. An external scheduler can call the same endpoint, but no machine-wide scheduler is installed. Nightly requests have no browser session, so connected personal Google Calendar reads are unavailable. Imported snapshots and workspace context remain accessible; the brief reports unavailable sources rather than claiming a complete sync.

The default workspace database is shared across the hackathon workspace, matching the existing board/data-library storage. This is not a multi-tenant brief store.
