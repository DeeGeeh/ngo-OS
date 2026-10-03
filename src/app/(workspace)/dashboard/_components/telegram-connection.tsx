"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MessageCircle } from "lucide-react";
import { useCallback, useState, type ChangeEvent } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  completeTelegramLoginAction,
  getTelegramStatusAction,
  startTelegramLoginAction,
} from "../telegram-actions";

const telegramStatusKey = ["telegram-status"];
const doneButton = <Button />;

export function TelegramConnection({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const status = useQuery({ queryKey: telegramStatusKey, queryFn: getTelegramStatusAction });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [started, setStarted] = useState(false);
  const [reconnect, setReconnect] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const start = useMutation({
    mutationFn: startTelegramLoginAction,
    onSuccess: () => {
      setStarted(true);
      setRestarting(false);
      setRequiresPassword(false);
      setCode("");
      setPassword("");
      void queryClient.invalidateQueries({ queryKey: telegramStatusKey });
    },
  });
  const complete = useMutation({
    mutationFn: completeTelegramLoginAction,
    onSuccess: (result) => {
      setRequiresPassword(result.requiresPassword === true);
      if (result.requiresPassword !== true) {
        setCode("");
        setPassword("");
        setStarted(false);
        setReconnect(false);
        void queryClient.invalidateQueries({ queryKey: telegramStatusKey });
      }
    },
  });
  const connected = status.data?.organizerConnected;
  const showConnected = connected && !reconnect && !status.data?.loginPending;
  const organizerName = status.data?.organizerUsername
    ? `@${status.data.organizerUsername}`
    : "Telegram account";
  const passwordPhase = requiresPassword || status.data?.loginPhase === "password";
  const canStart = status.data?.configured && status.data.authenticationConfigured;
  const error = start.error ?? complete.error ?? status.error;
  const submitStart = useCallback(() => {
    start.mutate({ phoneNumber });
  }, [phoneNumber, start]);
  const submitComplete = useCallback(() => {
    complete.mutate({ code: code || undefined, password: password || undefined });
  }, [code, complete, password]);
  const changePhone = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setPhoneNumber(event.target.value),
    [],
  );
  const changeCode = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setCode(event.target.value),
    [],
  );
  const changePassword = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value),
    [],
  );
  const beginReconnect = useCallback(() => setReconnect(true), []);
  const beginRestart = useCallback(() => setRestarting(true), []);
  const changeOpen = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setReconnect(false);
        setRestarting(false);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Telegram</DialogTitle>
          <DialogDescription>
            {showConnected
              ? "Your account is ready to manage project groups."
              : "Connect your account to create groups and manage members."}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Telegram connection failed</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        {!status.isLoading && !canStart && (
          <Alert>
            <AlertTitle>Telegram is unavailable</AlertTitle>
            <AlertDescription>
              Configure Telegram on the server before connecting an account.
            </AlertDescription>
          </Alert>
        )}
        {showConnected ? (
          <>
            <Card size="sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarFallback>
                      <MessageCircle />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <CardTitle>
                      <span className="block truncate">{organizerName}</span>
                    </CardTitle>
                    <CardDescription>Organizer account</CardDescription>
                  </div>
                  <Badge variant="secondary">
                    <Check data-icon="inline-start" />
                    Connected
                  </Badge>
                </div>
              </CardHeader>
            </Card>
            <DialogFooter>
              <Button variant="ghost" onClick={beginReconnect}>
                Reconnect
              </Button>
              <DialogClose render={doneButton}>Done</DialogClose>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            {!started && !status.data?.loginPending ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="telegram-phone">Phone number</Label>
                <Input
                  id="telegram-phone"
                  value={phoneNumber}
                  onChange={changePhone}
                  placeholder="+358..."
                  autoComplete="tel"
                />
                <Button
                  onClick={submitStart}
                  disabled={!canStart || start.isPending || !phoneNumber.trim()}
                >
                  {start.isPending ? "Sending code..." : "Send login code"}
                </Button>
              </div>
            ) : restarting ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="telegram-restart-phone">Phone number</Label>
                <Input
                  id="telegram-restart-phone"
                  value={phoneNumber}
                  onChange={changePhone}
                  placeholder="+358..."
                  autoComplete="tel"
                />
                <Button
                  onClick={submitStart}
                  disabled={!canStart || start.isPending || !phoneNumber.trim()}
                >
                  {start.isPending ? "Sending code..." : "Restart login code"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {!passwordPhase && (
                  <>
                    <Label htmlFor="telegram-code">Telegram code</Label>
                    <Input
                      id="telegram-code"
                      value={code}
                      onChange={changeCode}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                  </>
                )}
                {passwordPhase && (
                  <p className="text-sm text-muted-foreground">
                    Telegram requires your two-step verification password.
                  </p>
                )}
                {passwordPhase && (
                  <>
                    <Label htmlFor="telegram-password">Two-step verification password</Label>
                    <Input
                      id="telegram-password"
                      type="password"
                      value={password}
                      onChange={changePassword}
                      autoComplete="current-password"
                    />
                  </>
                )}
                <Button
                  onClick={submitComplete}
                  disabled={
                    !canStart ||
                    complete.isPending ||
                    (!passwordPhase && !code.trim()) ||
                    (passwordPhase && !password)
                  }
                >
                  {complete.isPending ? "Connecting..." : "Connect organizer account"}
                </Button>
                <Button variant="ghost" onClick={beginRestart}>
                  Restart login with a new code
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
