import { connection } from "next/server";
import { Suspense } from "react";

import { getDashboard } from "@/server/data/facade";

import { DataDashboard } from "../../_components/data-dashboard";

const loading = (
  <main className="flex min-h-svh items-center justify-center">Loading dashboard</main>
);

async function DashboardContent({ id }: { id: string }) {
  await connection();
  const view = await getDashboard(id, { refresh: "due" });
  return <DataDashboard initialData={view} />;
}

export default async function DataDashboardPage({ params }: PageProps<"/dashboard/data/[id]">) {
  const { id } = await params;
  return (
    <Suspense fallback={loading}>
      <DashboardContent id={id} />
    </Suspense>
  );
}
