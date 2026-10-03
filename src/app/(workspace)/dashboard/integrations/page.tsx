import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGoogleConnection, getUpcomingGoogleEvents } from "@/server/google/facade";

import { GoogleAccountMenu, GoogleConnect, RefreshCalendar } from "./_components/google-connect";

export const metadata: Metadata = { title: "Google integrations | TRES" };
const signInLink = { pathname: "/sign-in", query: { redirect_url: "/dashboard/integrations" } };
const loading = <p className="text-muted-foreground">Loading connections…</p>;

async function CalendarEvents() {
  const result = await getUpcomingGoogleEvents().then(
    (events) => ({ kind: "loaded", events }) as const,
    (error: unknown) =>
      ({
        kind: "error",
        message: error instanceof Error ? error.message : "Calendar could not load.",
      }) as const,
  );
  if (result.kind === "error")
    return (
      <Alert variant="destructive">
        <AlertTitle>{result.message}</AlertTitle>
      </Alert>
    );
  const events = result.events;
  if (!events.length)
    return <p className="text-muted-foreground">No upcoming events in the next 30 days.</p>;
  return (
    <ul className="divide-y">
      {events.map((event) => (
        <li key={event.id} className="flex flex-col gap-1 py-3">
          {event.url ? (
            <a
              href={event.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium hover:underline"
            >
              {event.title}
            </a>
          ) : (
            <span className="font-medium">{event.title}</span>
          )}
          <time dateTime={event.start} className="text-sm text-muted-foreground">
            {event.allDay
              ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(
                  new Date(event.start),
                )
              : new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: event.timeZone,
                }).format(new Date(event.start))}
            {event.allDay && " · All day"}
          </time>
          {event.location && (
            <span className="text-sm text-muted-foreground">{event.location}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

async function Connections() {
  const connection = await getGoogleConnection();
  if (connection.kind === "unavailable")
    return (
      <Alert>
        <AlertTitle>Configure Clerk to connect Google.</AlertTitle>
      </Alert>
    );
  if (connection.kind === "signed-out")
    return (
      <Link href={signInLink} className="text-primary underline">
        Sign in to connect Google
      </Link>
    );
  const calendarConnected = connection.kind === "connected" && connection.calendar;
  const filesConnected = connection.kind === "connected" && connection.files;
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground">
          {connection.kind === "connected" ? connection.email : "Connect your Google account"}
        </p>
        <GoogleAccountMenu />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Google Calendar</CardTitle>
            <CardDescription>See your upcoming events.</CardDescription>
            {calendarConnected && <Badge variant="secondary">Connected</Badge>}
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-5">
              <GoogleConnect capability="calendar" connected={calendarConnected} />
              {calendarConnected && (
                <>
                  <RefreshCalendar />
                  <Suspense fallback={loading}>
                    <CalendarEvents />
                  </Suspense>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Google Drive & Sheets</CardTitle>
            <CardDescription>Allow access to your private files and spreadsheets.</CardDescription>
            {filesConnected && <Badge variant="secondary">Connected</Badge>}
          </CardHeader>
          <CardContent>
            <GoogleConnect capability="files" connected={filesConnected} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function IntegrationsPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
        Back to workspace
      </Link>
      <h1 className="text-2xl font-semibold">Google integrations</h1>
      <Suspense fallback={loading}>
        <Connections />
      </Suspense>
    </main>
  );
}
