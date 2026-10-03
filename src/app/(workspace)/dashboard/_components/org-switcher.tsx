"use client";

import { Building2, Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { organizations, type Organization } from "@/lib/organizations";
import { cn } from "@/lib/utils";

const switcherButton = (
  <button
    type="button"
    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring"
    aria-label="Switch organization"
  />
);

function OrgMark({ organization, className }: { organization: Organization; className?: string }) {
  if (organization.logo) {
    return (
      <Image
        src={organization.logo}
        alt=""
        width={256}
        height={256}
        className={cn("size-7 shrink-0 rounded-md", className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold",
        organization.tone,
        className,
      )}
    >
      {organization.initials}
    </span>
  );
}

function OrgOption({
  organization,
  active,
  onSelect,
}: {
  organization: Organization;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const select = useCallback(() => onSelect(organization.id), [onSelect, organization.id]);
  return (
    <DropdownMenuItem onClick={select}>
      <OrgMark organization={organization} className="size-6" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{organization.name}</span>
        <span className="truncate text-xs text-muted-foreground">{organization.kind}</span>
      </span>
      {active && <Check className="size-4 shrink-0" />}
    </DropdownMenuItem>
  );
}

export function OrgSwitcher({
  organizationId,
  onSelect,
  onSettings,
}: {
  organizationId: string;
  onSelect: (id: string) => void;
  onSettings: () => void;
}) {
  const active = organizations.find((item) => item.id === organizationId) ?? organizations[0];
  if (!active) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={switcherButton}
        aria-label={`Organization: ${active.name}. Switch organization`}
      >
        <OrgMark organization={active} className="size-9 rounded-lg" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm leading-tight font-semibold">{active.name}</span>
          <span className="truncate text-xs leading-tight text-muted-foreground">
            {active.kind}
          </span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuGroup>
          {organizations.map((organization) => (
            <OrgOption
              key={organization.id}
              organization={organization}
              active={organization.id === active.id}
              onSelect={onSelect}
            />
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onSettings}>
            <Settings />
            Organization settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Plus />
            New organization
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Building2 />
            Browse all
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
