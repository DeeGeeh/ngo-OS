"use client";

import { ChevronsUpDown } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const organizations = [
  { id: "tres", name: "TRES", detail: "Tampere Entrepreneurship Society" },
  { id: "ai-collective", name: "AI Collective", detail: "Hack for Humanity partner" },
] as const;

type OrganizationId = (typeof organizations)[number]["id"];

const organizationTrigger = <Button variant="ghost" className="w-full justify-between" />;

export function OrgSwitcher() {
  const [organizationId, setOrganizationId] = useState<OrganizationId>("tres");
  const organization = organizations.find((item) => item.id === organizationId) ?? organizations[0];
  const selectOrganization = useCallback((value: unknown) => {
    const next = organizations.find((item) => item.id === value);
    if (next) setOrganizationId(next.id);
  }, []);

  return (
    <div className="min-w-0 flex-1">
      <DropdownMenu>
        <DropdownMenuTrigger render={organizationTrigger}>
          <span className="flex min-w-0 items-baseline text-base font-bold tracking-tighter">
            <span className="truncate">{organization.name}</span>
            <span className="text-primary">.</span>
          </span>
          <ChevronsUpDown data-icon="inline-end" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={organizationId} onValueChange={selectOrganization}>
              {organizations.map((item) => (
                <DropdownMenuRadioItem key={item.id} value={item.id} closeOnClick>
                  <span className="flex min-w-0 flex-col">
                    <span>{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.detail}</span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
