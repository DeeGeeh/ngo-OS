"use server";

import { auth } from "@clerk/nextjs/server";
import { deleteDashboard } from "@/server/data/facade";

export async function deleteDashboardAction(id: string) {
  const session = await auth();
  if (!session.isAuthenticated) throw new Error("Sign in to delete the dashboard.");
  await deleteDashboard(id);
}
