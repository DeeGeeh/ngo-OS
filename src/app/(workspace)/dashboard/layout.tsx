import { connection } from "next/server";
import { Suspense, ViewTransition, type ReactNode } from "react";

import { listAssistantThreads } from "@/server/assistant/facade";
import { Loader } from "@/components/ui/loader";
import { getWorkspace } from "@/server/workspace/facade";
import { getDataLibrary } from "@/server/data/facade";
import { getGoogleCalendarEvents } from "@/server/calendar/facade";
import { getLumaCalendar } from "@/server/luma/facade";

import { DailyBrief } from "./_components/daily-brief";
import { WorkspaceApp } from "./_components/workspace-app";
import { WorkspaceProviders } from "./_components/providers";
import "./_components/workspace-loading.css";

const overviewBrief = <DailyBrief />;

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

async function WorkspaceContent({ children }: { children: ReactNode }) {
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
      overviewBrief={overviewBrief}
      initialWorkspace={workspace}
      initialThreads={initialThreads}
      initialDataLibrary={dataLibrary}
      googleEvents={googleEvents}
      initialLuma={initialLuma}
    >
      {children}
    </WorkspaceApp>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProviders>
      <Suspense fallback={loading}>
        <ViewTransition enter="workspace-fade" default="none">
          <WorkspaceContent>{children}</WorkspaceContent>
        </ViewTransition>
      </Suspense>
    </WorkspaceProviders>
  );
}
