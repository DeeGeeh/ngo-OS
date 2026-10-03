# NGO OS smoke test

Date: 3 October 2026
Commit: bfc6f2e
Target: http://localhost:3000

Testing uses a copied local demo database at /tmp/ngo-os-smoke-20261003.db. No production data or external messages are part of this test.

## Summary

Five confirmed findings: two high severity and three medium severity.

| Check | Result |
| --- | --- |
| Latest main | bfc6f2e, clean checkout before testing |
| pnpm check | Passed, including 22 integration tests |
| pnpm build | Passed |
| Next.js compilation issues | None across all routes |
| Task creation and status changes | Persisted after reload |
| Profile edit | Persisted after reload |
| Team chat message | Persisted after reload |
| Assistant chat | Returned SMOKE_OK without using tools |
| Calendar, Events, People, account menu | Rendered and opened |
| Google integration without login | Redirected to sign-in |
| Invalid assistant payload | 400 |
| Missing data dashboard | 404 |

The initial check failure came from Next.js rewriting tsconfig.json for isolated build folders. Restoring the original configuration and rerunning passed. No app source fixes were made.

The Telegram webhook returned 500 in this environment. No live Telegram login, invitations, messages, Google authorization, or external-source writes were tested. The unsigned Google connection flow was verified through the sign-in page only.

The development server is left at http://localhost:3000 with .next-smoke output and /tmp/ngo-os-smoke-20261003.db. The temporary local production server used port 3100 and was stopped. The original demo database contains no smoke-test task or profile edits.

## Findings

### ISSUE-001: Calendar events disappear after refresh

Severity: high. Category: functional. Reproduced in development and the local production build.

1. Open Dashboard → Calendar → New event. [Form](screenshots/issue-001-step-1.png).
2. Enter a title and click Create. The event appears on 3 October. [Created event](screenshots/issue-001-step-2.png).
3. Reload /dashboard and open Calendar again. The event is gone. [Result](screenshots/issue-001-result-calendar.png).

Expected: created events survive a page reload. Actual: the new event disappears.

[Production reproduction video](videos/issue-001-production.webm).

Production evidence: [form](screenshots/issue-001-production-step-1.png), [created event](screenshots/issue-001-production-step-2.png), [after reload](screenshots/issue-001-production-result.png).


### ISSUE-002: Organization switcher crashes the workspace

Severity: high. Category: functional. Reproduced twice, in dark and light mode.

1. Open the dashboard. [Before](screenshots/issue-002-step-1.png).
2. Click Switch organization in the top left.
3. The workspace becomes "This page couldn’t load" instead of showing organizations. [Result](screenshots/issue-002-result.png).

Next.js reports: "Base UI: MenuGroupContext is missing. Menu group parts must be used within <Menu.Group> or <Menu.RadioGroup>." The runtime stack points to DropdownMenuLabel, dropdown-menu.tsx:78, called from OrgSwitcher, org-switcher.tsx:90.

[Reproduction video](videos/issue-002.webm). Also confirmed in the local production build: [production crash](screenshots/production-org-crash.png).

### ISSUE-003: Dark mode reload causes a hydration mismatch

Severity: medium. Category: console. Reproduced on multiple reloads in an extension-free browser.

1. Open Settings and choose Dark. [Dark settings](screenshots/issue-003-step-1.png).
2. Reload /dashboard?view=settings. [After reload](screenshots/issue-003-result.png).
3. Open the Next.js issues badge. The theme icon differs between server and client, Moon versus Sun. [Error](screenshots/issue-003-error.png).

The page recovers, but React regenerates the mismatched tree. Next.js points to workspace-app.tsx:396. [Runtime diagnostics](runtime-errors.jsonl).

[Reproduction video](videos/issue-003.webm).

### ISSUE-004: Mobile chat leaves almost no space for message history

Severity: medium. Category: responsive layout.

Open /dashboard?view=chat at a 390 × 844 viewport. The full channel and people list sits above the chat. The selected channel header appears near the bottom; only a sliver of message history remains, and the send button extends below the viewport. Scrolling the page did not reveal a usable conversation. Reproduced before and after opening and closing mobile navigation.

[Initial mobile layout](screenshots/mobile-chat.png). [After scrolling](screenshots/mobile-chat-final.png). No video is needed for this on-load layout issue. Desktop layout is a workaround. This layout also reproduces in the local production build: [production mobile layout](screenshots/production-mobile-chat.png).

### ISSUE-005: Mobile message history has no keyboard focus target

Severity: medium. Category: accessibility.

At 390 × 844 on Chat, the message-history scroll region has no focusable content and is not itself focusable. Keyboard users cannot focus it to scroll its contents. Axe reports scrollable-region-focusable as serious. This automated finding reproduced in both development and the local production build.

[Mobile screenshot](screenshots/production-mobile-chat.png). [Development audit](a11y-mobile-chat.json). [Production audit](a11y-production-mobile-chat.json). No video is needed for this static accessibility finding.
