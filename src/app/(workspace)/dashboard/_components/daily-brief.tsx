import { Suspense } from "react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDailyBrief } from "@/server/brief/facade";
import { BriefRefresh } from "./brief-refresh";
import { BriefActions } from "./brief-actions";

const loading = (
  <CardContent>
    <p className="text-sm text-muted-foreground">Preparing your brief…</p>
  </CardContent>
);

async function BriefContent() {
  const brief = await getDailyBrief().catch(() => null);
  if (!brief)
    return (
      <CardContent>
        <p role="alert" className="text-sm text-muted-foreground">
          Brief unavailable. Try refreshing.
        </p>
      </CardContent>
    );
  return (
    <CardContent>
      <div className="grid gap-4">
        <p className="text-sm leading-relaxed">{brief.summary}</p>
        {brief.actions.length > 0 && <BriefActions brief={brief} />}
      </div>
    </CardContent>
  );
}

export function DailyBrief() {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Today's brief</CardTitle>
        <CardAction>
          <BriefRefresh />
        </CardAction>
      </CardHeader>
      <Suspense fallback={loading}>
        <BriefContent />
      </Suspense>
    </Card>
  );
}
