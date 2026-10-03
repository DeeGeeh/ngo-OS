"use client";

import { useReverification, useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { googleConnectionPath, googleScopes, type GoogleCapability } from "@/lib/google";

export function GoogleConnect({
  capability,
  connected,
}: {
  capability: GoogleCapability;
  connected: boolean;
}) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connect = useReverification(async () => {
    if (!user) return;
    const account = user.externalAccounts.find((item) => item.provider === "google");
    const params = {
      additionalScopes: [
        ...new Set([
          ...(account?.approvedScopes.split(/[ ,]+/).filter(Boolean) ?? []),
          ...googleScopes[capability],
        ]),
      ],
      redirectUrl: new URL(googleConnectionPath, window.location.origin).href,
    };
    const result = account
      ? await account.reauthorize(params)
      : await user.createExternalAccount({ ...params, strategy: "oauth_google" });
    const redirect = result.verification?.externalVerificationRedirectURL;
    if (redirect) window.location.assign(redirect.href);
    else {
      await user.reload();
      router.refresh();
    }
  });
  const onConnect = useCallback(() => {
    setPending(true);
    setError(null);
    void connect()
      .catch(() => {
        setError("Google could not connect. Try again or check the Google connection settings.");
      })
      .finally(() => setPending(false));
  }, [connect]);

  return (
    <div className="flex flex-col gap-3">
      <Button disabled={!isLoaded || !user || pending} onClick={onConnect}>
        {pending ? "Connecting…" : connected ? "Reconnect Google" : "Connect Google"}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}
    </div>
  );
}

export function GoogleAccountMenu() {
  return <UserButton />;
}

export function RefreshCalendar() {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);
  return (
    <Button variant="outline" onClick={refresh}>
      Refresh events
    </Button>
  );
}
