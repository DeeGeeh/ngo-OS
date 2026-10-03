import "server-only";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { auth as googleAuth, calendar as googleCalendar } from "googleapis/build/src/apis/calendar";
import { cache } from "react";

import { env } from "@/env";
import { hasGoogleAccess, type GoogleCapability } from "@/lib/google";

const calendarWindowDays = 30;
const calendarEventLimit = 30;

const getGoogleAccount = cache(async () => {
  if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !env.CLERK_SECRET_KEY) {
    return { kind: "unavailable" } as const;
  }
  const session = await auth();
  if (!session.isAuthenticated) return { kind: "signed-out" } as const;
  const client = await clerkClient();
  const user = await client.users.getUser(session.userId);
  const account = user.externalAccounts.find(
    (item) => item.provider === "google" && item.verification?.status === "verified",
  );
  if (!account) return { kind: "disconnected" } as const;
  return { kind: "connected", userId: session.userId, account } as const;
});

export async function getGoogleConnection() {
  const result = await getGoogleAccount();
  if (result.kind !== "connected") return result;
  const scopes = result.account.approvedScopes.split(/[ ,]+/);
  return {
    kind: "connected" as const,
    email: result.account.emailAddress,
    calendar: hasGoogleAccess(scopes, "calendar"),
    files: hasGoogleAccess(scopes, "files"),
  };
}

export const getGoogleAccessToken = cache(async (capability: GoogleCapability) => {
  const result = await getGoogleAccount();
  if (result.kind !== "connected") throw new Error("Connect your Google account first.");
  const client = await clerkClient();
  const response = await client.users.getUserOauthAccessToken(result.userId, "google");
  const token = response.data.find((item) => item.externalAccountId === result.account.id);
  if (!token?.token || !hasGoogleAccess(token.scopes ?? [], capability)) {
    throw new Error("Reconnect Google to allow access to this service.");
  }
  return token.token;
});

export async function getUpcomingGoogleEvents() {
  const connection = await getGoogleConnection();
  if (connection.kind !== "connected" || !connection.calendar) return [];
  try {
    const token = await getGoogleAccessToken("calendar");
    const oauth = new googleAuth.OAuth2();
    oauth.setCredentials({ access_token: token });
    const calendar = googleCalendar({ version: "v3", auth: oauth });
    const now = new Date();
    const until = new Date(now);
    until.setDate(until.getDate() + calendarWindowDays);
    const response = await calendar.events.list(
      {
        calendarId: "primary",
        timeMin: now.toISOString(),
        timeMax: until.toISOString(),
        maxResults: calendarEventLimit,
        singleEvents: true,
        orderBy: "startTime",
      },
      { timeout: 10000 },
    );
    return (response.data.items ?? []).flatMap((event) => {
      const start = event.start?.dateTime ?? event.start?.date;
      if (!event.id || !start || event.status === "cancelled") return [];
      return [
        {
          id: event.id,
          title: event.summary || "Untitled event",
          start,
          allDay: !event.start?.dateTime,
          timeZone: event.start?.timeZone ?? response.data.timeZone ?? "UTC",
          location: event.location ?? null,
          url:
            event.htmlLink?.startsWith("https://www.google.com/calendar/") ||
            event.htmlLink?.startsWith("https://calendar.google.com/")
              ? event.htmlLink
              : null,
        },
      ];
    });
  } catch {
    throw new Error(
      "Calendar could not load. Reconnect Google and check that the Calendar API is enabled.",
    );
  }
}
