"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { ExternalLink, Globe, Lock, MapPin, Plus, Ticket, type LucideIcon } from "lucide-react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  approvalLabels,
  formatLumaDateLong,
  formatLumaDayNumber,
  formatLumaMonth,
  formatLumaTime,
  formatLumaTimeRange,
  formatLumaWhen,
  formatTicketPrice,
  hostRoleLabels,
  lumaPath,
  lumaQueryKey,
  type AddLumaGuest,
  type CreateLumaEvent,
  type LumaCalendar,
  type LumaEvent,
  type LumaGuest,
  type LumaVisibility,
  type SendLumaBlast,
  type UpdateLumaGuest,
} from "@/lib/luma";

import {
  addLumaGuestAction,
  createLumaEventAction,
  sendLumaBlastAction,
  updateLumaGuestAction,
} from "../actions";

const visibilityItems = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
] as const;

function orderedEvents(events: readonly LumaEvent[]) {
  const now = Date.now();
  const upcoming = events
    .filter((event) => Date.parse(event.endAt) >= now)
    .toSorted((a, b) => a.startAt.localeCompare(b.startAt));
  const past = events
    .filter((event) => Date.parse(event.endAt) < now)
    .toSorted((a, b) => b.startAt.localeCompare(a.startAt));
  return [...upcoming, ...past];
}

function failureMessage(error: unknown) {
  return error instanceof Error ? error.message : "Luma could not save that.";
}

function DateChip({ iso, large = false }: { iso: string; large?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-lg border bg-card",
        large ? "size-12" : "size-10",
      )}
    >
      <span className="text-xs leading-none font-medium text-muted-foreground">
        {formatLumaMonth(iso)}
      </span>
      <span
        className={cn("leading-tight font-semibold tabular-nums", large ? "text-lg" : "text-sm")}
      >
        {formatLumaDayNumber(iso)}
      </span>
    </span>
  );
}

function InfoRow({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-card"
      >
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold">{title}</span>
        {subtitle && <span className="truncate text-sm text-muted-foreground">{subtitle}</span>}
      </span>
    </div>
  );
}

function EventCover({ event }: { event: LumaEvent }) {
  return (
    <div className="relative flex aspect-video w-full items-end overflow-hidden rounded-xl bg-gradient-to-br from-primary via-chart-1 to-chart-3 p-5">
      <span
        aria-hidden="true"
        className="absolute -top-16 -right-10 size-56 rounded-full bg-primary-foreground/10"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-20 -left-12 size-56 rounded-full bg-primary-foreground/10"
      />
      <div className="relative flex flex-col gap-1">
        <span className="text-xs font-medium tracking-wide text-primary-foreground/80 uppercase">
          {formatLumaDateLong(event.startAt)}
        </span>
        <span className="text-2xl leading-tight font-bold text-primary-foreground">
          {event.name}
        </span>
      </div>
    </div>
  );
}

function EventHero({
  event,
  going,
  pending,
}: {
  event: LumaEvent;
  going: number;
  pending: number;
}) {
  const capacity = event.tickets.reduce((total, ticket) => total + ticket.capacity, 0);
  const filled = capacity === 0 ? 0 : Math.round((going / capacity) * 100);
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="flex flex-col gap-5">
        <EventCover event={event} />
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Hosted by
          </p>
          <div className="flex flex-col gap-2.5">
            {event.hosts.map((host) => (
              <div key={host.apiId} className="flex items-center gap-2.5">
                <Avatar size="sm">
                  <AvatarFallback>
                    {host.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{host.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {hostRoleLabels[host.role]}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={event.status === "published" ? "secondary" : "outline"}>
              {event.status === "published" ? "Published" : "Draft"}
            </Badge>
            <Badge variant="outline">
              {event.visibility === "public" ? (
                <Globe data-icon="inline-start" />
              ) : (
                <Lock data-icon="inline-start" />
              )}
              {event.visibility === "public" ? "Public" : "Private"}
            </Badge>
            {event.requireApproval && <Badge variant="outline">Approval required</Badge>}
          </div>
          <h2 className="text-3xl leading-tight font-bold tracking-tight">{event.name}</h2>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <DateChip iso={event.startAt} large />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">
                {formatLumaDateLong(event.startAt)}
              </span>
              <span className="truncate text-sm text-muted-foreground">
                {formatLumaTimeRange(event.startAt, event.endAt)}
              </span>
            </span>
          </div>
          <InfoRow icon={MapPin} title={event.location} subtitle={event.timezone} />
        </div>

        <Card>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-semibold tabular-nums">{going}</span>
                  <span className="text-xs text-muted-foreground">Going</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-semibold tabular-nums">{pending}</span>
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-semibold tabular-nums">{capacity}</span>
                  <span className="text-xs text-muted-foreground">Capacity</span>
                </div>
              </div>
              {capacity > 0 && <Progress value={filled} />}
              <div className="flex flex-col gap-2">
                {event.tickets.map((ticket) => (
                  <div
                    key={ticket.apiId}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Ticket className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{ticket.name}</span>
                    </span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      {ticket.sold}/{ticket.capacity} · {formatTicketPrice(ticket.priceCents)}
                    </span>
                  </div>
                ))}
              </div>
              {event.pageUrl && (
                <a
                  href={event.pageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "outline" })}
                >
                  <ExternalLink data-icon="inline-start" />
                  Open on Luma
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {event.description && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              About event
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EventPick({
  event,
  selected,
  onSelect,
}: {
  event: LumaEvent;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const select = useCallback(() => onSelect(event.apiId), [event.apiId, onSelect]);
  const going = event.guests.filter((guest) => guest.approvalStatus === "approved").length;
  return (
    <button
      type="button"
      onClick={select}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary bg-accent" : "border-transparent hover:bg-muted",
      )}
    >
      <DateChip iso={event.startAt} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{event.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {formatLumaTime(event.startAt)} · {going} going
        </span>
      </span>
      {event.status === "draft" && <Badge variant="outline">Draft</Badge>}
    </button>
  );
}

function GuestActions({
  eventApiId,
  guest,
  pending,
  onUpdate,
}: {
  eventApiId: string;
  guest: LumaGuest;
  pending: boolean;
  onUpdate: (input: UpdateLumaGuest) => void;
}) {
  const approve = useCallback(() => {
    onUpdate({ eventApiId, guestApiId: guest.apiId, approvalStatus: "approved" });
  }, [eventApiId, guest.apiId, onUpdate]);
  const decline = useCallback(() => {
    onUpdate({ eventApiId, guestApiId: guest.apiId, approvalStatus: "declined" });
  }, [eventApiId, guest.apiId, onUpdate]);
  const checkIn = useCallback(() => {
    onUpdate({ eventApiId, guestApiId: guest.apiId, checkIn: true });
  }, [eventApiId, guest.apiId, onUpdate]);
  const waiting = guest.approvalStatus !== "approved" && guest.approvalStatus !== "declined";
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {waiting ? (
        <Button size="sm" onClick={approve} disabled={pending}>
          Approve
        </Button>
      ) : null}
      {waiting ? (
        <Button size="sm" variant="outline" onClick={decline} disabled={pending}>
          Decline
        </Button>
      ) : null}
      {guest.approvalStatus === "approved" && !guest.checkedInAt ? (
        <Button size="sm" variant="outline" onClick={checkIn} disabled={pending}>
          Check in
        </Button>
      ) : null}
      {guest.checkedInAt ? <Badge variant="secondary">Checked in</Badge> : null}
    </div>
  );
}

function CreateEventDialog({
  open,
  pending,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: CreateLumaEvent) => void;
}) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [location, setLocation] = useState("");
  const [visibility, setVisibility] = useState<LumaVisibility>("public");
  const changeName = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  }, []);
  const changeStart = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setStart(event.target.value);
  }, []);
  const changeLocation = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setLocation(event.target.value);
  }, []);
  const changeVisibility = useCallback((value: unknown) => {
    if (value === "public" || value === "private") setVisibility(value);
  }, []);
  const close = useCallback(
    (next: boolean) => {
      if (!next) {
        setName("");
        setStart("");
        setLocation("");
        setVisibility("public");
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );
  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const parsed = new Date(start);
      if (Number.isNaN(parsed.getTime())) return;
      onCreate({
        name,
        startAt: parsed.toISOString(),
        location,
        visibility,
      });
    },
    [location, name, onCreate, start, visibility],
  );

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create event</DialogTitle>
          <DialogDescription>
            Publish it on the TRES Luma calendar. It runs for three hours with free general
            admission.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="luma-name">Name</FieldLabel>
              <Input id="luma-name" value={name} onChange={changeName} required maxLength={120} />
            </Field>
            <Field>
              <FieldLabel htmlFor="luma-start">Starts</FieldLabel>
              <Input
                id="luma-start"
                type="datetime-local"
                value={start}
                onChange={changeStart}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="luma-location">Location</FieldLabel>
              <Input
                id="luma-location"
                value={location}
                onChange={changeLocation}
                required
                maxLength={160}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="luma-visibility">Visibility</FieldLabel>
              <Select items={visibilityItems} value={visibility} onValueChange={changeVisibility}>
                <SelectTrigger id="luma-visibility" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {visibilityItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              Publish on Luma
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddGuestForm({
  event,
  pending,
  onAdd,
}: {
  event: LumaEvent;
  pending: boolean;
  onAdd: (input: Omit<AddLumaGuest, "eventApiId">) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [ticketName, setTicketName] = useState(event.tickets[0]?.name ?? "");
  const tickets = useMemo(
    () => event.tickets.map((ticket) => ({ value: ticket.name, label: ticket.name })),
    [event.tickets],
  );
  const changeName = useCallback((input: ChangeEvent<HTMLInputElement>) => {
    setName(input.target.value);
  }, []);
  const changeEmail = useCallback((input: ChangeEvent<HTMLInputElement>) => {
    setEmail(input.target.value);
  }, []);
  const changeTicket = useCallback((value: unknown) => {
    if (typeof value === "string") setTicketName(value);
  }, []);
  const submit = useCallback(
    (formEvent: FormEvent<HTMLFormElement>) => {
      formEvent.preventDefault();
      onAdd({ name, email, ticketName });
      setName("");
      setEmail("");
    },
    [email, name, onAdd, ticketName],
  );
  return (
    <form onSubmit={submit}>
      <FieldGroup className="sm:grid sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="guest-name">Guest</FieldLabel>
          <Input id="guest-name" value={name} onChange={changeName} required maxLength={80} />
        </Field>
        <Field>
          <FieldLabel htmlFor="guest-email">Email</FieldLabel>
          <Input id="guest-email" type="email" value={email} onChange={changeEmail} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="guest-ticket">Ticket</FieldLabel>
          <Select items={tickets} value={ticketName} onValueChange={changeTicket}>
            <SelectTrigger id="guest-ticket" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {tickets.map((ticket) => (
                  <SelectItem key={ticket.value} value={ticket.value}>
                    {ticket.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel className="sr-only" htmlFor="guest-add">
            Add guest
          </FieldLabel>
          <Button id="guest-add" type="submit" disabled={pending}>
            Add guest
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

function BlastForm({
  pending,
  onSend,
}: {
  pending: boolean;
  onSend: (input: Omit<SendLumaBlast, "eventApiId">) => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const changeSubject = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSubject(event.target.value);
  }, []);
  const changeBody = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setBody(event.target.value);
  }, []);
  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSend({ subject, body });
      setSubject("");
      setBody("");
    },
    [body, onSend, subject],
  );
  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="blast-subject">Subject</FieldLabel>
          <Input
            id="blast-subject"
            value={subject}
            onChange={changeSubject}
            required
            maxLength={140}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="blast-body">Message</FieldLabel>
          <Textarea
            id="blast-body"
            value={body}
            onChange={changeBody}
            required
            maxLength={2000}
            rows={4}
          />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending}>
        Send to guests who are going
      </Button>
    </form>
  );
}

export function EventsScreen({ calendar }: { calendar: LumaCalendar }) {
  const queryClient = useQueryClient();
  const events = useMemo(() => orderedEvents(calendar.events), [calendar.events]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const selected = events.find((event) => event.apiId === selectedId) ?? events[0];
  const remember = useCallback(
    (next: LumaCalendar) => {
      queryClient.setQueryData(lumaQueryKey, next);
      setProblem(null);
    },
    [queryClient],
  );
  const fail = useCallback((error: unknown) => {
    setProblem(failureMessage(error));
  }, []);
  const create = useMutation({
    mutationFn: createLumaEventAction,
    onSuccess: (next) => {
      const known = new Set(calendar.events.map((event) => event.apiId));
      const added = next.events.find((event) => !known.has(event.apiId));
      remember(next);
      if (added) setSelectedId(added.apiId);
      setCreating(false);
    },
    onError: fail,
  });
  const addGuest = useMutation({
    mutationFn: addLumaGuestAction,
    onSuccess: remember,
    onError: fail,
  });
  const updateGuest = useMutation({
    mutationFn: updateLumaGuestAction,
    onSuccess: remember,
    onError: fail,
  });
  const blast = useMutation({
    mutationFn: sendLumaBlastAction,
    onSuccess: remember,
    onError: fail,
  });
  const pending =
    create.isPending || addGuest.isPending || updateGuest.isPending || blast.isPending;
  const openCreate = useCallback(() => setCreating(true), []);
  const createOpenChanged = useCallback((open: boolean) => setCreating(open), []);
  const publish = useCallback((input: CreateLumaEvent) => create.mutate(input), [create]);
  const add = useCallback(
    (input: Omit<AddLumaGuest, "eventApiId">) => {
      if (!selected) return;
      addGuest.mutate({ ...input, eventApiId: selected.apiId });
    },
    [addGuest, selected],
  );
  const update = useCallback((input: UpdateLumaGuest) => updateGuest.mutate(input), [updateGuest]);
  const send = useCallback(
    (input: Omit<SendLumaBlast, "eventApiId">) => {
      if (!selected) return;
      blast.mutate({ ...input, eventApiId: selected.apiId });
    },
    [blast, selected],
  );
  const going = selected?.guests.filter((guest) => guest.approvalStatus === "approved").length ?? 0;
  const pendingGuests =
    selected?.guests.filter((guest) => guest.approvalStatus === "pending_approval").length ?? 0;

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-3"
          >
            <Ticket className="size-5 text-primary-foreground" />
          </span>
          <div className="flex flex-col">
            <p className="font-semibold">{calendar.name}</p>
            <a
              href={calendar.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {lumaPath(calendar.slug)}
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus data-icon="inline-start" />
          Create event
        </Button>
      </div>
      {problem ? (
        <Alert variant="destructive">
          <AlertTitle>{problem}</AlertTitle>
        </Alert>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-4">
        <nav aria-label="Luma events" className="flex flex-col gap-1 self-start lg:sticky lg:top-0">
          <p className="px-2.5 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {events.length} {events.length === 1 ? "event" : "events"}
          </p>
          {events.map((event) => (
            <EventPick
              key={event.apiId}
              event={event}
              selected={event.apiId === selected?.apiId}
              onSelect={setSelectedId}
            />
          ))}
        </nav>
        {selected ? (
          <div className="flex min-w-0 flex-col gap-8 lg:col-span-3">
            <EventHero event={selected} going={going} pending={pendingGuests} />
            <Tabs defaultValue="guests">
              <TabsList>
                <TabsTrigger value="guests">Guests</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>
              <TabsContent value="guests">
                <div className="flex flex-col gap-5">
                  <AddGuestForm
                    key={selected.apiId}
                    event={selected}
                    pending={pending}
                    onAdd={add}
                  />
                  {selected.guests.length === 0 ? (
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>No guests yet</EmptyTitle>
                        <EmptyDescription>
                          Add someone and they show up on this event.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Guest</TableHead>
                          <TableHead>Ticket</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.guests.map((guest) => (
                          <TableRow key={guest.apiId}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{guest.name}</span>
                                <span className="text-muted-foreground">{guest.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>{guest.ticketName}</TableCell>
                            <TableCell>{approvalLabels[guest.approvalStatus]}</TableCell>
                            <TableCell>
                              <GuestActions
                                eventApiId={selected.apiId}
                                guest={guest}
                                pending={pending}
                                onUpdate={update}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="messages">
                <div className="flex flex-col gap-5">
                  <BlastForm key={selected.apiId} pending={pending} onSend={send} />
                  {selected.blasts.length === 0 ? (
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>No messages sent</EmptyTitle>
                        <EmptyDescription>Messages go to guests who are going.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {selected.blasts.map((item) => (
                        <Card key={item.apiId}>
                          <CardHeader>
                            <CardTitle>{item.subject}</CardTitle>
                            <CardDescription>
                              {formatLumaWhen(item.sentAt)} · {item.recipients} recipients
                            </CardDescription>
                          </CardHeader>
                          <CardContent>{item.preview}</CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No events on this calendar</EmptyTitle>
              <EmptyDescription>Create one and it is published to Luma.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
      <CreateEventDialog
        open={creating}
        pending={create.isPending}
        onOpenChange={createOpenChanged}
        onCreate={publish}
      />
    </div>
  );
}
