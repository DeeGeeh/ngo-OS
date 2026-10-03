import type { ReactNode } from "react";

import { WorkspaceProviders } from "./_components/providers";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <WorkspaceProviders>{children}</WorkspaceProviders>;
}
