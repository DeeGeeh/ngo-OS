"use client";

import {
  ArrowRight,
  CalendarClock,
  FolderOpen,
  GripVertical,
  Mail,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToday } from "@/hooks/use-today";
import {
  demoSponsors,
  euro,
  sponsorStages,
  type Sponsor,
  type SponsorStage,
  type SponsorTier,
} from "@/lib/sponsors";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/lib/workspace";

import { MemberAvatar } from "./work-cards";

const seasonGoal = 20000;
const stageItems = sponsorStages.map((stage) => ({ value: stage.id, label: stage.label }));
const tierItems = [
  { value: "Main partner", label: "Main partner" },
  { value: "Partner", label: "Partner" },
  { value: "Supporter", label: "Supporter" },
];
const stageAccent: Record<SponsorStage, string> = {
  prospect: "bg-muted-foreground/40",
  contacted: "bg-chart-4",
  negotiating: "bg-chart-2",
  committed: "bg-primary",
};
const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function formatDate(date: string) {
  return shortDate.format(new Date(`${date}T12:00:00Z`));
}

function isStage(value: string): value is SponsorStage {
  return sponsorStages.some((stage) => stage.id === value);
}

function isTier(value: string): value is SponsorTier {
  return tierItems.some((tier) => tier.value === value);
}

function StageSelect({
  sponsor,
  onMove,
}: {
  sponsor: Sponsor;
  onMove: (id: string, stage: SponsorStage) => void;
}) {
  const change = useCallback(
    (value: string | null) => {
      if (value && isStage(value)) onMove(sponsor.id, value);
    },
    [onMove, sponsor.id],
  );
  return (
    <Select items={stageItems} value={sponsor.stage} onValueChange={change}>
      <SelectTrigger size="sm" className="w-36" aria-label={`Stage for ${sponsor.company}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {stageItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function SponsorRow({
  sponsor,
  workspace,
  today,
  onOpen,
  onMove,
  onDragStart,
}: {
  sponsor: Sponsor;
  workspace: Workspace;
  today: string | null;
  onOpen: (id: string) => void;
  onMove: (id: string, stage: SponsorStage) => void;
  onDragStart: (id: string) => void;
}) {
  const owner = workspace.members.find((member) => member.id === sponsor.ownerId);
  const open = useCallback(() => onOpen(sponsor.id), [onOpen, sponsor.id]);
  const startDrag = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", sponsor.id);
      onDragStart(sponsor.id);
    },
    [onDragStart, sponsor.id],
  );
  const overdue = today !== null && sponsor.stage !== "committed" && sponsor.nextDate < today;
  return (
    <div
      draggable
      onDragStart={startDrag}
      className="group grid grid-cols-1 items-center gap-3 border-t px-3 py-3 first:border-t-0 hover:bg-muted/40 md:grid-cols-12"
    >
      <button
        type="button"
        onClick={open}
        className="flex min-w-0 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring md:col-span-4"
      >
        <GripVertical className="hidden size-4 shrink-0 cursor-grab text-muted-foreground/50 group-hover:text-muted-foreground md:block" />
        <Avatar size="default">
          <AvatarFallback>{sponsor.initials}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{sponsor.company}</span>
          <span className="truncate text-xs text-muted-foreground">
            {sponsor.contact} · {sponsor.contactRole}
          </span>
        </span>
      </button>
      <div className="flex items-center gap-2 md:col-span-2">
        <span className="text-sm font-semibold tabular-nums">{euro.format(sponsor.amount)}</span>
        <Badge variant="outline">{sponsor.tier}</Badge>
      </div>
      <div className="flex min-w-0 flex-col md:col-span-3">
        <span className="truncate text-sm">{sponsor.nextStep}</span>
        <span
          className={cn(
            "flex items-center gap-1 text-xs",
            overdue ? "font-medium text-destructive" : "text-muted-foreground",
          )}
        >
          <CalendarClock className="size-3.5" />
          {overdue ? "Overdue · " : ""}
          {formatDate(sponsor.nextDate)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 md:col-span-3 md:justify-end">
        {owner && <MemberAvatar member={owner} />}
        <StageSelect sponsor={sponsor} onMove={onMove} />
      </div>
    </div>
  );
}

function StageGroup({
  stage,
  sponsors,
  dragging,
  onDropSponsor,
  children,
}: {
  stage: (typeof sponsorStages)[number];
  sponsors: Sponsor[];
  dragging: boolean;
  onDropSponsor: (stage: SponsorStage) => void;
  children: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  const total = sponsors.reduce((sum, sponsor) => sum + sponsor.amount, 0);
  const dragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (!dragging) return;
      event.preventDefault();
      setOver(true);
    },
    [dragging],
  );
  const dragLeave = useCallback(() => setOver(false), []);
  const drop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setOver(false);
      onDropSponsor(stage.id);
    },
    [onDropSponsor, stage.id],
  );
  return (
    <section aria-label={stage.label}>
      <div
        onDragOver={dragOver}
        onDragLeave={dragLeave}
        onDrop={drop}
        className={cn(
          "overflow-hidden rounded-xl border bg-card transition-colors",
          over && "border-primary bg-primary/5",
        )}
      >
        <header className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2.5">
          <span className={cn("size-2 rounded-full", stageAccent[stage.id])} aria-hidden="true" />
          <h3 className="text-sm font-semibold">{stage.label}</h3>
          <span className="text-xs text-muted-foreground tabular-nums">{sponsors.length}</span>
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {euro.format(total)}
            {stage.id !== "committed" && ` · ${Math.round(stage.probability * 100)}% likely`}
          </span>
        </header>
        {sponsors.length > 0 ? (
          children
        ) : (
          <p className="px-4 py-5 text-center text-sm text-muted-foreground">
            {dragging ? "Drop here to move" : "Nobody at this stage yet"}
          </p>
        )}
      </div>
    </section>
  );
}

function SponsorDetail({
  sponsor,
  workspace,
  onMove,
  onLog,
}: {
  sponsor: Sponsor;
  workspace: Workspace;
  onMove: (id: string, stage: SponsorStage) => void;
  onLog: (id: string, text: string) => void;
}) {
  const [note, setNote] = useState("");
  const owner = workspace.members.find((member) => member.id === sponsor.ownerId);
  const stageIndex = sponsorStages.findIndex((stage) => stage.id === sponsor.stage);
  const nextStage = sponsorStages[stageIndex + 1];
  const advance = useCallback(() => {
    if (nextStage) onMove(sponsor.id, nextStage.id);
  }, [nextStage, onMove, sponsor.id]);
  const changeNote = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value),
    [],
  );
  const log = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!note.trim()) return;
      onLog(sponsor.id, note.trim());
      setNote("");
    },
    [note, onLog, sponsor.id],
  );
  return (
    <div className="flex flex-col gap-6 px-4 pb-6">
      <ol className="flex items-center gap-1" aria-label="Pipeline stage">
        {sponsorStages.map((stage, index) => (
          <li key={stage.id} className="flex flex-1 flex-col gap-1.5">
            <span
              className={cn(
                "h-1.5 rounded-full",
                index <= stageIndex ? stageAccent[sponsor.stage] : "bg-muted",
              )}
            />
            <span
              className={cn(
                "text-xs",
                index === stageIndex ? "font-medium" : "text-muted-foreground",
              )}
            >
              {stage.label}
            </span>
          </li>
        ))}
      </ol>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Amount</p>
          <p className="text-lg font-semibold tabular-nums">{euro.format(sponsor.amount)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Tier</p>
          <p className="text-lg font-semibold">{sponsor.tier}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <span className="flex items-center gap-2">
          <UserRound className="size-4 text-muted-foreground" />
          {sponsor.contact} · {sponsor.contactRole}
        </span>
        <a
          href={`mailto:${sponsor.email}`}
          className="flex items-center gap-2 text-primary underline-offset-4 hover:underline"
        >
          <Mail className="size-4" />
          {sponsor.email}
        </a>
        {owner && (
          <span className="flex items-center gap-2">
            <MemberAvatar member={owner} />
            Owned by {owner.name}
          </span>
        )}
        {sponsor.projects.length > 0 && (
          <span className="flex flex-wrap items-center gap-1.5">
            {sponsor.projects.map((project) => (
              <Badge key={project} variant="secondary">
                <FolderOpen data-icon="inline-start" />
                {project}
              </Badge>
            ))}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
        <p className="text-xs font-medium text-muted-foreground">Next step</p>
        <p className="text-sm">{sponsor.nextStep}</p>
        <p className="text-xs text-muted-foreground">Due {formatDate(sponsor.nextDate)}</p>
        {nextStage && (
          <Button size="sm" onClick={advance} className="mt-1 self-start">
            Move to {nextStage.label}
            <ArrowRight data-icon="inline-end" />
          </Button>
        )}
      </div>
      <form onSubmit={log} className="flex flex-col gap-2">
        <FieldLabel htmlFor="sponsor-note">Log a touch</FieldLabel>
        <Textarea
          id="sponsor-note"
          value={note}
          onChange={changeNote}
          placeholder="What happened? For example: called them, they confirm the budget on Friday"
          rows={3}
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="self-end"
          disabled={!note.trim()}
        >
          Add to timeline
        </Button>
      </form>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">Activity</p>
        <ol className="flex flex-col gap-3 border-l pl-4">
          {sponsor.activity.map((item) => (
            <li key={`${item.date}-${item.text}`} className="relative flex flex-col">
              <span
                className="absolute top-1.5 -left-5 size-2 rounded-full bg-primary"
                aria-hidden="true"
              />
              <span className="text-sm">{item.text}</span>
              <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function AddSponsorForm({
  workspace,
  onAdd,
}: {
  workspace: Workspace;
  onAdd: (sponsor: Sponsor) => void;
}) {
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [amount, setAmount] = useState("1000");
  const [tier, setTier] = useState<SponsorTier>("Partner");
  const [stage, setStage] = useState<SponsorStage>("prospect");
  const today = useToday() ?? "2026-10-03";
  const changeCompany = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setCompany(event.target.value),
    [],
  );
  const changeContact = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setContact(event.target.value),
    [],
  );
  const changeAmount = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setAmount(event.target.value),
    [],
  );
  const changeTier = useCallback((value: string | null) => {
    if (value && isTier(value)) setTier(value);
  }, []);
  const changeStage = useCallback((value: string | null) => {
    if (value && isStage(value)) setStage(value);
  }, []);
  const submit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const name = company.trim();
      if (!name) return;
      onAdd({
        id: `${name.toLowerCase().replaceAll(/\s+/g, "-")}-${Date.now()}`,
        company: name,
        initials: name
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        contact: contact.trim() || "Not yet known",
        contactRole: contact.trim() ? "Contact" : "Find the right person",
        email: "",
        amount: Math.max(0, Number(amount) || 0),
        tier,
        stage,
        ownerId: workspace.currentMemberId,
        nextStep: "Send the first email",
        nextDate: today,
        lastTouch: today,
        projects: [],
        activity: [{ date: today, text: "Added to the pipeline" }],
      });
    },
    [amount, company, contact, onAdd, stage, tier, today, workspace.currentMemberId],
  );
  return (
    <form onSubmit={submit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="sponsor-company">Company</FieldLabel>
          <Input id="sponsor-company" value={company} onChange={changeCompany} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="sponsor-contact">Contact person</FieldLabel>
          <Input id="sponsor-contact" value={contact} onChange={changeContact} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="sponsor-amount">Amount (€)</FieldLabel>
            <Input
              id="sponsor-amount"
              type="number"
              min={0}
              step={100}
              value={amount}
              onChange={changeAmount}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sponsor-tier">Tier</FieldLabel>
            <Select items={tierItems} value={tier} onValueChange={changeTier}>
              <SelectTrigger id="sponsor-tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {tierItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="sponsor-stage">Stage</FieldLabel>
          <Select items={stageItems} value={stage} onValueChange={changeStage}>
            <SelectTrigger id="sponsor-stage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {stageItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Button type="submit" disabled={!company.trim()}>
          Add sponsor
        </Button>
      </FieldGroup>
    </form>
  );
}

export function SponsorsScreen({ workspace }: { workspace: Workspace }) {
  const [sponsors, setSponsors] = useState(demoSponsors);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const today = useToday();
  const selected = sponsors.find((sponsor) => sponsor.id === selectedId);
  const visible = useMemo(
    () =>
      sponsors.filter(
        (sponsor) =>
          (filter !== "mine" || sponsor.ownerId === workspace.currentMemberId) &&
          `${sponsor.company} ${sponsor.contact}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [filter, search, sponsors, workspace.currentMemberId],
  );
  const groups = useMemo(
    () =>
      sponsorStages.toReversed().map((stage) => ({
        stage,
        sponsors: visible.filter((sponsor) => sponsor.stage === stage.id),
      })),
    [visible],
  );
  const committed = sponsors
    .filter((sponsor) => sponsor.stage === "committed")
    .reduce((sum, sponsor) => sum + sponsor.amount, 0);
  const weighted = sponsors.reduce(
    (sum, sponsor) =>
      sum +
      sponsor.amount *
        (sponsorStages.find((stage) => stage.id === sponsor.stage)?.probability ?? 0),
    0,
  );
  const followUps = sponsors.filter(
    (sponsor) => sponsor.stage !== "committed" && today !== null && sponsor.nextDate <= today,
  ).length;

  const move = useCallback((id: string, stage: SponsorStage) => {
    const label = sponsorStages.find((item) => item.id === stage)?.label ?? stage;
    setSponsors((current) =>
      current.map((sponsor) =>
        sponsor.id === id && sponsor.stage !== stage
          ? {
              ...sponsor,
              stage,
              activity: [
                { date: new Date().toISOString().slice(0, 10), text: `Moved to ${label}` },
                ...sponsor.activity,
              ],
            }
          : sponsor,
      ),
    );
  }, []);
  const log = useCallback((id: string, text: string) => {
    setSponsors((current) =>
      current.map((sponsor) =>
        sponsor.id === id
          ? {
              ...sponsor,
              activity: [
                { date: new Date().toISOString().slice(0, 10), text },
                ...sponsor.activity,
              ],
            }
          : sponsor,
      ),
    );
  }, []);
  const add = useCallback((sponsor: Sponsor) => {
    setSponsors((current) => [...current, sponsor]);
    setAdding(false);
    setSelectedId(sponsor.id);
  }, []);
  const dropInto = useCallback(
    (stage: SponsorStage) => {
      if (draggingId) move(draggingId, stage);
      setDraggingId(null);
    },
    [draggingId, move],
  );
  const endDrag = useCallback(() => setDraggingId(null), []);
  const detailOpenChanged = useCallback((open: boolean) => {
    if (!open) setSelectedId(null);
  }, []);
  const openAdd = useCallback(() => setAdding(true), []);
  const selectedFilter = useMemo(() => [filter], [filter]);
  const changeFilter = useCallback((values: string[]) => {
    if (values[0]) setFilter(values[0]);
  }, []);
  const changeSearch = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value),
    [],
  );

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8" onDragEnd={endDrag}>
      <div className="grid gap-3 lg:grid-cols-4">
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-muted-foreground">Committed this season</span>
            <span className="text-xs text-muted-foreground">Goal {euro.format(seasonGoal)}</span>
          </div>
          <span className="text-3xl font-semibold tracking-tight tabular-nums">
            {euro.format(committed)}
          </span>
          <Progress value={Math.min(100, Math.round((committed / seasonGoal) * 100))} />
        </div>
        <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
          <span className="text-sm text-muted-foreground">Weighted pipeline</span>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {euro.format(Math.round(weighted))}
          </span>
          <span className="text-xs text-muted-foreground">Amount × chance at each stage</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
          <span className="text-sm text-muted-foreground">Follow-ups due</span>
          <span
            className={cn(
              "text-2xl font-semibold tracking-tight tabular-nums",
              followUps > 0 && "text-destructive",
            )}
          >
            {followUps}
          </span>
          <span className="text-xs text-muted-foreground">Next steps due today or earlier</span>
        </div>
      </div>

      <div className="flex overflow-hidden rounded-xl border" aria-label="Pipeline funnel">
        {sponsorStages.map((stage) => {
          const inStage = sponsors.filter((sponsor) => sponsor.stage === stage.id);
          return (
            <div
              key={stage.id}
              className="flex flex-1 flex-col gap-1 border-l px-4 py-3 first:border-l-0"
            >
              <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className={cn("size-2 rounded-full", stageAccent[stage.id])} />
                {stage.label}
              </span>
              <span className="text-lg font-semibold tabular-nums">{inStage.length}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {euro.format(inStage.reduce((sum, sponsor) => sum + sponsor.amount, 0))}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          value={selectedFilter}
          onValueChange={changeFilter}
          aria-label="Sponsor filter"
        >
          <ToggleGroupItem value="all">All sponsors</ToggleGroupItem>
          <ToggleGroupItem value="mine">Owned by me</ToggleGroupItem>
        </ToggleGroup>
        <div className="flex items-center gap-2">
          <InputGroup className="max-w-64">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={changeSearch}
              placeholder="Search sponsors"
              aria-label="Search sponsors"
            />
          </InputGroup>
          <Button onClick={openAdd}>
            <Plus data-icon="inline-start" />
            Add sponsor
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {groups.map(({ stage, sponsors: inStage }) => {
          return (
            <StageGroup
              key={stage.id}
              stage={stage}
              sponsors={inStage}
              dragging={draggingId !== null}
              onDropSponsor={dropInto}
            >
              {inStage.map((sponsor) => (
                <SponsorRow
                  key={sponsor.id}
                  sponsor={sponsor}
                  workspace={workspace}
                  today={today}
                  onOpen={setSelectedId}
                  onMove={move}
                  onDragStart={setDraggingId}
                />
              ))}
            </StageGroup>
          );
        })}
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={detailOpenChanged}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.company}</SheetTitle>
                <SheetDescription>
                  Last touch {formatDate(selected.lastTouch)} ·{" "}
                  <a
                    href={`mailto:${selected.email}`}
                    className={buttonVariants({ variant: "link", size: "sm" })}
                  >
                    Email
                  </a>
                </SheetDescription>
              </SheetHeader>
              <SponsorDetail sponsor={selected} workspace={workspace} onMove={move} onLog={log} />
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a sponsor</DialogTitle>
          </DialogHeader>
          <AddSponsorForm workspace={workspace} onAdd={add} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
