"use client";

import { Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useId, useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldTitle } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const settingsButton = <Button variant="ghost" size="icon-sm" aria-label="Open settings" />;

export function SettingsDialog() {
  const { resolvedTheme, setTheme } = useTheme();
  const appearanceId = useId();
  const selectedTheme = useMemo(() => [resolvedTheme ?? "light"], [resolvedTheme]);
  const changeTheme = useCallback(
    (values: string[]) => {
      const value = values[0];
      if (value === "light" || value === "dark") setTheme(value);
    },
    [setTheme],
  );

  return (
    <Dialog>
      <DialogTrigger render={settingsButton}>
        <Settings />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldTitle id={appearanceId} className="flex-1">
              Appearance
            </FieldTitle>
            <ToggleGroup
              variant="outline"
              value={selectedTheme}
              onValueChange={changeTheme}
              aria-labelledby={appearanceId}
            >
              <ToggleGroupItem value="light">
                <Sun data-icon="inline-start" />
                Light
              </ToggleGroupItem>
              <ToggleGroupItem value="dark">
                <Moon data-icon="inline-start" />
                Dark
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  );
}
