"use client";

import { useActionState } from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { importGoogleSourceAction } from "../actions";

const initialState = { kind: "idle" } as const;

export function GoogleSourceForm() {
  const [state, action, pending] = useActionState(importGoogleSourceAction, initialState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <Label htmlFor="google-source-url">Google Sheet or Drive CSV URL</Label>
      <Input
        id="google-source-url"
        name="url"
        type="url"
        required
        maxLength={2000}
        placeholder="Paste a Google file link"
      />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Importing…" : "Import file"}
      </Button>
      {state.kind === "success" && <output className="text-sm">Imported {state.name}</output>}
      {state.kind === "error" && (
        <Alert variant="destructive">
          <AlertTitle>{state.message}</AlertTitle>
        </Alert>
      )}
    </form>
  );
}
