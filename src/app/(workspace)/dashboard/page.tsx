import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense, ViewTransition } from "react";

import { listAssistantThreads } from "@/server/assistant/facade";
import { Loader } from "@/components/ui/loader";
import { getWorkspace } from "@/server/workspace/facade";
import { getDataLibrary } from "@/server/data/facade";
import { getGoogleCalendarEvents } from "@/server/calendar/facade";
import { getLumaCalendar } from "@/server/luma/facade";

import { WorkspaceApp } from "./_components/workspace-app";
import "./_components/workspace-loading.css";

export const metadata: Metadata = { title: "TR3S" };
const loading = (
  <ViewTransition enter="workspace-fade" exit="workspace-fade" default="none">
    <main
      data-workspace-loading
      className="flex h-svh items-center justify-center bg-background text-primary"
    >
      <Loader size={64} aria-label="Loading workspace" />
    </main>
  </ViewTransition>
);

async function WorkspaceContent() {
  await connection();
  const [workspace, initialThreads, dataLibrary, googleEvents, initialLuma] = await Promise.all([
    getWorkspace(),
    listAssistantThreads(),
    getDataLibrary(),
    getGoogleCalendarEvents(),
    getLumaCalendar(),
  ]);
  return (
    <WorkspaceApp
      initialWorkspace={workspace}
      initialThreads={initialThreads}
      initialDataLibrary={dataLibrary}
      googleEvents={googleEvents}
      initialLuma={initialLuma}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={loading}>
      <ViewTransition enter="workspace-fade" default="none">
        <WorkspaceContent />
      </ViewTransition>
    </Suspense>
  );
}
