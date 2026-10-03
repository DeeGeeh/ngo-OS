import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { listAssistantThreads } from "@/server/assistant/facade";
import { getWorkspace } from "@/server/workspace/facade";

import { WorkspaceProviders } from "./_components/providers";
import { WorkspaceApp } from "./_components/workspace-app";

export const metadata: Metadata = { title: "TR3S" };
const loading = <main className="flex h-svh items-center justify-center">TR3S</main>;

async function WorkspaceContent() {
  await connection();
  const [workspace, initialThreads] = await Promise.all([getWorkspace(), listAssistantThreads()]);
  return <WorkspaceApp initialWorkspace={workspace} initialThreads={initialThreads} />;
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
