import { LayoutDashboard } from "lucide-react";
import type { ComponentProps } from "react";

import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";

const dashboardLink = {
  label: "Dashboard",
  href: "/dashboard",
  icon: <LayoutDashboard />,
} satisfies ComponentProps<typeof SidebarLink>["link"];

export default function DashboardPage() {
  return (
    <main className="flex h-svh flex-col md:flex-row">
      <Sidebar>
        <SidebarBody>
          <SidebarLink link={dashboardLink} />
        </SidebarBody>
      </Sidebar>
    </main>
  );
}
