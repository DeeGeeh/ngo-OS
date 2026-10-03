"use client";

import { Building2, Moon, Palette, Plug, Sun, Users } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useMemo, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { organizations, product } from "@/lib/organizations";
import type { Workspace } from "@/lib/workspace";

import { UserSettingsForm } from "./user-settings";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

function SettingsCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: typeof Users;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Icon className="size-4 text-muted-foreground" />
            {title}
          </span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function SettingsScreen({
  workspace,
  organizationId,
}: {
  workspace: Workspace;
  organizationId: string;
}) {
  const { theme, setTheme } = useTheme();
  const organization = organizations.find((item) => item.id === organizationId);
  const currentMember = workspace.members.find((member) => member.id === workspace.currentMemberId);
  const selectedTheme = useMemo(() => [theme ?? "light"], [theme]);
  const changeTheme = useCallback(
    (values: string[]) => {
      const value = values[0];
      if (value) setTheme(value);
    },
    [setTheme],
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Workspace preferences for this organization.
        </p>
      </div>

      {currentMember?.settings && (
        <SettingsCard title="Profile" description="Your details and AI connections." icon={Users}>
          <UserSettingsForm
            key={JSON.stringify(currentMember.settings)}
            settings={currentMember.settings}
          />
        </SettingsCard>
      )}

      <SettingsCard
        title="Organization"
        description="The non-profit this workspace belongs to."
        icon={Building2}
      >
        <Row label="Name">{organization?.name ?? "—"}</Row>
        <Separator />
        <Row label="Type">{organization?.kind ?? "—"}</Row>
        <Separator />
        <Row label="Location">{organization?.location ?? "—"}</Row>
        <Separator />
        <Row label="Members">{workspace.members.length}</Row>
      </SettingsCard>

      <SettingsCard
        title="Appearance"
        description="Light and dark both supported; pick what suits the room."
        icon={Palette}
      >
        <ToggleGroup value={selectedTheme} onValueChange={changeTheme} aria-label="Color theme">
          <ToggleGroupItem value="light">
            <Sun data-icon="inline-start" />
            Light
          </ToggleGroupItem>
          <ToggleGroupItem value="dark">
            <Moon data-icon="inline-start" />
            Dark
          </ToggleGroupItem>
        </ToggleGroup>
      </SettingsCard>

      <SettingsCard
        title="Connections"
        description="Services this workspace reads from."
        icon={Plug}
      >
        <Row label="Luma">
          <Badge variant="secondary">Event calendar</Badge>
        </Row>
        <Separator />
        <Row label="Google Calendar">
          <Badge variant="outline">Read-only feed</Badge>
        </Row>
      </SettingsCard>

      <p className="text-center text-xs text-muted-foreground">
        {organization?.name ?? "This organization"} runs on {product.name}.
      </p>
    </div>
  );
}
