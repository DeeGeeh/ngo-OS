import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense, ViewTransition } from "react";

import { listAssistantThreads } from "@/server/assistant/facade";
import { Loader } from "@/components/ui/loader";
import { getGoogleCalendarEvents } from "@/server/calendar/facade";
import { getLumaCalendar } from "@/server/luma/facade";
import { getWorkspace } from "@/server/workspace/facade";

import { WorkspaceProviders } from "./_components/providers";
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
  const [workspace, googleEvents, luma, initialThreads] = await Promise.all([
    getWorkspace(),
    getGoogleCalendarEvents(),
    getLumaCalendar(),
    listAssistantThreads(),
  ]);
  return (
    <WorkspaceApp
      initialWorkspace={workspace}
      googleEvents={googleEvents}
      initialLuma={luma}
      initialThreads={initialThreads}
    />
  );
}

export default function DashboardPage() {
  return (
    <WorkspaceProviders>
      <Suspense fallback={loading}>
        <ViewTransition enter="workspace-fade" default="none">
          <WorkspaceContent />
        </ViewTransition>
      </Suspense>
    </WorkspaceProviders>
  );
}
