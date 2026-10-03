"use client";

import { CircleCheck, CreditCard, Heart, Lock, Smartphone, Users } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { donationPresets } from "@/lib/donations";
import { product } from "@/lib/organizations";
import { euro } from "@/lib/sponsors";

type Campaign = {
  slug: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  donors: number;
};

type Method = "Google Pay" | "Apple Pay" | "MobilePay" | "Card";

function PayButton({
  method,
  disabled,
  onPay,
  children,
}: {
  method: Method;
  disabled: boolean;
  onPay: (method: Method) => void;
  children: React.ReactNode;
}) {
  const pay = useCallback(() => onPay(method), [method, onPay]);
  return (
    <button
      type="button"
      onClick={pay}
      disabled={disabled}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function MethodButton({
  method,
  disabled,
  onPay,
  children,
}: {
  method: Method;
  disabled: boolean;
  onPay: (method: Method) => void;
  children: React.ReactNode;
}) {
  const pay = useCallback(() => onPay(method), [method, onPay]);
  return (
    <Button variant="outline" size="lg" disabled={disabled} onClick={pay}>
      {children}
    </Button>
  );
}

export function DonatePage({
  campaign,
  organizationName,
}: {
  campaign: Campaign;
  organizationName: string;
}) {
  const [frequency, setFrequency] = useState("once");
  const [preset, setPreset] = useState<string>("25");
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [paid, setPaid] = useState<{ method: Method; amount: number } | null>(null);
  const amount = custom ? Math.max(0, Math.round(Number(custom) || 0)) : Number(preset);
  const raised = campaign.raised + (paid?.amount ?? 0);
  const donors = campaign.donors + (paid ? 1 : 0);
  const percent = Math.min(100, Math.round((raised / campaign.goal) * 100));
  const selectedFrequency = useMemo(() => [frequency], [frequency]);
  const selectedPreset = useMemo(() => (custom ? [] : [preset]), [custom, preset]);

  const changeFrequency = useCallback((values: string[]) => {
    if (values[0]) setFrequency(values[0]);
  }, []);
  const changePreset = useCallback((values: string[]) => {
    if (values[0]) {
      setPreset(values[0]);
      setCustom("");
    }
  }, []);
  const changeCustom = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setCustom(event.target.value),
    [],
  );
  const changeName = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setName(event.target.value),
    [],
  );
  const pay = useCallback((method: Method) => setPaid({ method, amount }), [amount]);
  const again = useCallback(() => setPaid(null), []);

  return (
    <main className="min-h-svh bg-linear-to-b from-primary/15 via-background to-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <header className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              {organizationName.slice(0, 2)}
            </span>
            <span className="text-sm font-semibold">{organizationName}</span>
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            Secure donation
          </span>
        </header>

        <Card>
          <CardContent>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{campaign.title}</h1>
                <p className="text-sm text-muted-foreground">{campaign.description}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xl font-semibold tabular-nums">{euro.format(raised)}</span>
                  <span className="text-sm text-muted-foreground">
                    raised of {euro.format(campaign.goal)}
                  </span>
                </div>
                <Progress value={percent} />
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  {donors} people have given
                </span>
              </div>

              {paid ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border bg-muted/40 px-4 py-8 text-center">
                  <CircleCheck className="size-10 text-primary" />
                  <h2 className="text-lg font-semibold">
                    Thank you{name.trim() ? `, ${name.trim()}` : ""}!
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Your {frequency === "monthly" ? "monthly " : ""}donation of{" "}
                    {euro.format(paid.amount)} to {organizationName} went through with {paid.method}
                    . A receipt is on its way.
                  </p>
                  <Button variant="outline" onClick={again}>
                    <Heart data-icon="inline-start" />
                    Give again
                  </Button>
                </div>
              ) : (
                <FieldGroup>
                  <ToggleGroup
                    value={selectedFrequency}
                    onValueChange={changeFrequency}
                    aria-label="Donation frequency"
                    className="w-full"
                  >
                    <ToggleGroupItem value="once" className="flex-1">
                      One time
                    </ToggleGroupItem>
                    <ToggleGroupItem value="monthly" className="flex-1">
                      Monthly
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <ToggleGroup
                    value={selectedPreset}
                    onValueChange={changePreset}
                    aria-label="Donation amount"
                    className="grid w-full grid-cols-4"
                  >
                    {donationPresets.map((value) => (
                      <ToggleGroupItem key={value} value={String(value)}>
                        {euro.format(value)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <Field>
                    <FieldLabel htmlFor="donation-custom">Or enter an amount</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>€</InputGroupAddon>
                      <InputGroupInput
                        id="donation-custom"
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={custom}
                        onChange={changeCustom}
                        placeholder="Custom amount"
                      />
                    </InputGroup>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="donation-name">Your name (optional)</FieldLabel>
                    <Input
                      id="donation-name"
                      value={name}
                      onChange={changeName}
                      placeholder="Shown on the supporters list"
                    />
                  </Field>
                  <div className="flex flex-col gap-2">
                    <PayButton method="Google Pay" disabled={amount < 1} onPay={pay}>
                      <span className="flex size-5 items-center justify-center rounded-full bg-background">
                        <Image src="/integrations/google.svg" alt="" width={14} height={14} />
                      </span>
                      Pay {euro.format(amount)} with Google Pay
                    </PayButton>
                    <PayButton method="Apple Pay" disabled={amount < 1} onPay={pay}>
                      <Smartphone className="size-4" />
                      Pay with Apple Pay
                    </PayButton>
                    <div className="grid grid-cols-2 gap-2">
                      <MethodButton method="MobilePay" disabled={amount < 1} onPay={pay}>
                        MobilePay
                      </MethodButton>
                      <MethodButton method="Card" disabled={amount < 1} onPay={pay}>
                        <CreditCard data-icon="inline-start" />
                        Card
                      </MethodButton>
                    </div>
                  </div>
                </FieldGroup>
              )}
            </div>
          </CardContent>
        </Card>

        <footer className="flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
          <span>Demo page. No real payment is taken.</span>
          <span className="flex items-center gap-1.5">
            <Image src={product.markLight} alt="" width={512} height={355} className="h-3 w-auto" />
            Powered by {product.name}
          </span>
        </footer>
      </div>
    </main>
  );
}
