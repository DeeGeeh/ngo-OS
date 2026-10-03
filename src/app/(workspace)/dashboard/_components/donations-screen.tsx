"use client";

import { Check, Copy, ExternalLink, HandCoins, Link2, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToday } from "@/hooks/use-today";
import { campaignPath, campaignSlug, demoCampaigns, type DonationCampaign } from "@/lib/donations";
import { euro } from "@/lib/sponsors";

async function copyLink(path: string, setCopied: (copied: boolean) => void) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  } catch {
    setCopied(false);
  }
}

function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    void copyLink(path, setCopied);
  }, [path]);
  return (
    <Button variant="outline" size="sm" onClick={copy}>
      {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

function CampaignCard({ campaign, fresh }: { campaign: DonationCampaign; fresh: boolean }) {
  const path = campaignPath(campaign);
  const percent = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            {campaign.title}
            {fresh && <Badge>New</Badge>}
          </span>
        </CardTitle>
        <CardDescription>{campaign.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xl font-semibold tabular-nums">
                {euro.format(campaign.raised)}
              </span>
              <span className="text-sm text-muted-foreground">of {euro.format(campaign.goal)}</span>
            </div>
            <Progress value={percent} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="size-3.5" />
                {campaign.donors} donors
              </span>
              <span>{percent}% funded</span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Link2 className="size-3.5 shrink-0" />
            <span className="truncate">/donate/{campaign.slug}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyLinkButton path={path} />
            <Link
              href={path}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <ExternalLink data-icon="inline-start" />
              Open page
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function buildCampaign(
  campaigns: DonationCampaign[],
  {
    title,
    description,
    goal,
    organizationName,
    today,
  }: { title: string; description: string; goal: string; organizationName: string; today: string },
): DonationCampaign | null {
  const name = title.trim();
  if (!name) return null;
  const base = campaignSlug(name);
  const slug = campaigns.some((campaign) => campaign.slug === base)
    ? `${base}-${campaigns.length + 1}`
    : base;
  return {
    slug,
    title: name,
    description:
      description.trim() || `Support ${organizationName} and help us make ${name} happen.`,
    goal: Math.max(50, Number(goal) || 0),
    raised: 0,
    donors: 0,
    createdAt: today,
  };
}

export function DonationsScreen({ organizationName }: { organizationName: string }) {
  const [campaigns, setCampaigns] = useState(demoCampaigns);
  const todayValue = useToday();
  const today = todayValue ?? "2026-10-03";
  const [created, setCreated] = useState(false);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("2000");
  const [description, setDescription] = useState("");
  const raised = campaigns.reduce((sum, campaign) => sum + campaign.raised, 0);
  const donors = campaigns.reduce((sum, campaign) => sum + campaign.donors, 0);

  const changeTitle = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setTitle(event.target.value),
    [],
  );
  const changeGoal = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setGoal(event.target.value),
    [],
  );
  const changeDescription = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => setDescription(event.target.value),
    [],
  );
  const create = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!title.trim()) return;
      const details = { title, description, goal, organizationName, today };
      setCampaigns((current) => {
        const campaign = buildCampaign(current, details);
        return campaign ? [campaign, ...current] : current;
      });
      setCreated(true);
      setTitle("");
      setDescription("");
    },
    [description, goal, organizationName, title, today],
  );

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
          <span className="text-sm text-muted-foreground">Raised through links</span>
          <span className="text-2xl font-semibold tabular-nums">{euro.format(raised)}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
          <span className="text-sm text-muted-foreground">Donors</span>
          <span className="text-2xl font-semibold tabular-nums">{donors}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
          <span className="text-sm text-muted-foreground">Active links</span>
          <span className="text-2xl font-semibold tabular-nums">{campaigns.length}</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:sticky xl:top-0 xl:self-start">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <HandCoins className="size-4 text-primary" />
                Create a donation link
              </span>
            </CardTitle>
            <CardDescription>
              Share it anywhere. People can give with Google Pay, Apple Pay, MobilePay or a card.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={create}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="donation-title">What are you raising for?</FieldLabel>
                  <Input
                    id="donation-title"
                    value={title}
                    onChange={changeTitle}
                    placeholder="Hacknight pizza fund"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="donation-goal">Goal (€)</FieldLabel>
                  <Input
                    id="donation-goal"
                    type="number"
                    min={50}
                    step={50}
                    value={goal}
                    onChange={changeGoal}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="donation-description">Message to donors</FieldLabel>
                  <Textarea
                    id="donation-description"
                    value={description}
                    onChange={changeDescription}
                    rows={3}
                    placeholder="Tell people what their money makes possible."
                  />
                  <FieldDescription>Shown at the top of the donation page.</FieldDescription>
                </Field>
                <Button type="submit" disabled={!title.trim()}>
                  <Plus data-icon="inline-start" />
                  Create link
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:col-span-2">
          {campaigns.map((campaign, index) => (
            <CampaignCard key={campaign.slug} campaign={campaign} fresh={created && index === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}
