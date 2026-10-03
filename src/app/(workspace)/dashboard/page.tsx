import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { getGoogleCalendarEvents } from "@/server/calendar/facade";
import { getLumaCalendar } from "@/server/luma/facade";
import { getWorkspace } from "@/server/workspace/facade";

import { WorkspaceProviders } from "./_components/providers";
import { WorkspaceApp } from "./_components/workspace-app";

export const metadata: Metadata = { title: "TR3S" };
const loading = <main className="flex h-svh items-center justify-center">TR3S</main>;

async function WorkspaceContent() {
  await connection();
  const [workspace, googleEvents, luma] = await Promise.all([
    getWorkspace(),
    getGoogleCalendarEvents(),
    getLumaCalendar(),
  ]);
  return (
    <WorkspaceApp initialWorkspace={workspace} googleEvents={googleEvents} initialLuma={luma} />
  );
}

export default function DashboardPage() {
  return (
    <WorkspaceProviders>
      <Suspense fallback={loading}>
        <WorkspaceContent />
      </Suspense>
    </WorkspaceProviders>
  );
}
