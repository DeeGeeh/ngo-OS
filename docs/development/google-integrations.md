# Google integrations

Open `/dashboard/integrations` directly. Sign in with Clerk, then connect Calendar or Drive & Sheets. Each button requests only that service's permissions. Existing Google sign-in accounts reauthorize to add those permissions.

Calendar shows up to 30 events from the primary calendar over the next 30 days, including recurring occurrences and all-day events. Use Refresh events to fetch again. Drive & Sheets accepts a private Google Sheet sharing URL or a Drive CSV URL and imports it into the shared data library.

Clerk owns account linking, OAuth redirects, credential storage, and token refresh. Every server read retrieves the current user's token through Clerk. Tokens never go to the browser or the workspace database. Private file sources record the importing Clerk user so another user's account cannot refresh them. Accepted file snapshots are shared workspace data. Calendar events remain personal.

## Setup

The development Clerk app `ngo-os` uses a custom Google Web application OAuth client in project `ngo-os-hackathon-20261003`. Calendar, Sheets, and Drive APIs are enabled. Its authorized callback is `https://proper-falcon-9128.clerk.accounts.dev/v1/oauth_callback`. The client credentials are configured in Clerk, not in the repository.

The OAuth audience is External / Testing, with `diar.ghaderi@gmail.com` allowed as a test user. Add other demo accounts in Google Cloud → Google Auth Platform → Audience before they connect. Clerk keys remain in `.env.local`.

Read-only permissions are `calendar.events.readonly`, `spreadsheets.readonly`, and `drive.readonly`. The backend also accepts broader permissions that cover these scopes. Manage or remove linked accounts through Clerk's user menu.

## Validation

The signed-out page and signed-in connection controls were checked in an isolated local preview. A real Google account approved `calendar.events.readonly`, and six upcoming events rendered from the Calendar API. The same account approved Drive & Sheets read-only access, and both connected states remained present after reauthorization. Private file imports require an approved account and a user-provided file URL.
