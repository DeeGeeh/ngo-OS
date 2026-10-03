"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshBriefAction } from "../brief/actions";

const initialState = { error: null };

export function BriefRefresh() {
  const [state, action, pending] = useActionState(refreshBriefAction, initialState);
  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={pending}
        aria-label="Refresh brief"
        title="Refresh brief"
      >
        <RefreshCw />
        <span className="sr-only">{pending ? "Refreshing…" : "Refresh brief"}</span>
      </Button>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
