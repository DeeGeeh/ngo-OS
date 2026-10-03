"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Grid3x3,
  List,
  Plus,
  Search,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  calendarCategories,
  calendarTags,
  dayHours,
  dayKey,
  eventColorLabels,
  eventColors,
  formatDayTitle,
  formatDuration,
  formatListDate,
  formatMonthDay,
  formatMonthTitle,
  formatTime,
  formatWeekday,
  formatWeekTitle,
  isCalendarCategory,
  isCalendarView,
  isEventColor,
  isSameDay,
  monthGrid,
  toDateTimeLocal,
  weekDays,
  weekdayLabels,
  workspaceCalendarItems,
  type CalendarItem,
  type CalendarView,
  type EventColor,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/lib/workspace";

type CalendarEvent = Omit<CalendarItem, "startTime" | "endTime"> & {
  startTime: Date;
  endTime: Date;
};

const noEvents: CalendarEvent[] = [];
const categoryItems = calendarCategories.map((value) => ({ value, label: value }));
const colorItems = eventColors.map((value) => ({ value, label: eventColorLabels[value] }));

function allowDrop(event: DragEvent<HTMLElement>) {
  event.preventDefault();
}

function dialogCopy(mode: "create" | "edit" | null, source: CalendarEvent["source"] | null) {
  if (source === "google") {
    return {
      title: "Google Calendar",
      description: "This event is synced from Google Calendar.",
    };
  }
  if (source === "luma") {
    return {
      title: "Luma",
      description: "This project is on the TRES Luma calendar.",
    };
  }
  if (mode === "create") {
    return { title: "Create event", description: "Add an event to the calendar." };
  }
  return { title: "Event details", description: "Update the event, or drag it to another day." };
}

function viewTitle(view: CalendarView, date: Date) {
  if (view === "month") return formatMonthTitle(date);
  if (view === "week") return formatWeekTitle(date);
  if (view === "day") return formatDayTitle(date);
  return "All events";
}

function Swatch({ color }: { color: EventColor }) {
  return (
    <span
      className={cn(
        "size-2.5 shrink-0 rounded-full",
        color === "chart-1" && "bg-chart-1",
        color === "chart-3" && "bg-chart-3",
        color === "chart-4" && "bg-chart-4",
        color === "primary" && "bg-primary",
        color === "destructive" && "bg-destructive",
      )}
    />
  );
}

function EventChip({
  item,
  variant,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  item: CalendarEvent;
  variant: "compact" | "default" | "detailed";
  onOpen: (item: CalendarEvent) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}) {
  const open = useCallback(() => onOpen(item), [item, onOpen]);
  const dragStart = useCallback(
    (event: DragEvent<HTMLButtonElement>) => {
      if (item.locked) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.effectAllowed = "move";
      onDragStart(item.id);
    },
    [item.id, item.locked, onDragStart],
  );

  return (
    <button
      type="button"
      draggable={!item.locked}
      onDragStart={dragStart}
      onDragEnd={onDragEnd}
      onClick={open}
      className={cn(
        "flex w-full flex-col gap-1 border-l-4 text-left",
        item.locked ? "cursor-pointer" : "cursor-grab",
        variant === "compact" && "rounded px-1.5 py-0.5 text-xs font-medium",
        variant === "default" && "rounded px-2 py-1 text-xs font-medium",
        variant === "detailed" && "rounded-lg p-3",
        item.color === "chart-1" && "border-chart-1 bg-chart-1/15 text-foreground",
        item.color === "chart-3" && "border-chart-3 bg-chart-3/20 text-foreground",
        item.color === "chart-4" && "border-chart-4 bg-chart-4/20 text-foreground",
        item.color === "primary" && "border-primary bg-primary/15 text-primary",
        item.color === "destructive" && "border-destructive bg-destructive/15 text-destructive",
      )}
    >
      <span className={cn("font-medium", variant !== "detailed" && "truncate")}>{item.title}</span>
      {variant === "detailed" ? (
        <>
          {item.description ? (
            <span className="line-clamp-2 text-sm text-muted-foreground">{item.description}</span>
          ) : null}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock />
            {formatTime(item.startTime)} – {formatTime(item.endTime)}
            <span>({formatDuration(item.startTime, item.endTime)})</span>
          </span>
          <span className="flex flex-wrap gap-1">
            {item.source === "google" ? <Badge variant="secondary">Google Calendar</Badge> : null}
            {item.source === "luma" ? <Badge variant="secondary">Luma</Badge> : null}
            {item.category ? <Badge variant="outline">{item.category}</Badge> : null}
          </span>
        </>
      ) : null}
    </button>
  );
}

function DayCell({
  day,
  inMonth,
  today,
  items,
  onOpen,
  onOpenDay,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  day: Date;
  inMonth: boolean;
  today: boolean;
  items: CalendarEvent[];
  onOpen: (item: CalendarEvent) => void;
  onOpenDay: (day: Date) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (day: Date) => void;
}) {
  const drop = useCallback(() => onDrop(day), [day, onDrop]);
  const openDay = useCallback(() => onOpenDay(day), [day, onOpenDay]);
  const visible = items.slice(0, 3);
  const extra = items.length - visible.length;

  return (
    <div
      className={cn("flex min-h-0 flex-col gap-1 border-r border-b p-1", !inMonth && "bg-muted/40")}
      onDragOver={allowDrop}
      onDrop={drop}
    >
      <button
        type="button"
        onClick={openDay}
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-xs",
          today && "bg-primary font-semibold text-primary-foreground",
        )}
      >
        {day.getDate()}
      </button>
      <div className="flex min-h-0 flex-col gap-1 overflow-hidden">
        {visible.map((item) => (
          <EventChip
            key={item.id}
            item={item}
            variant="compact"
            onOpen={onOpen}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        {extra > 0 ? (
          <button
            type="button"
            onClick={openDay}
            className="text-left text-xs text-muted-foreground"
          >
            +{extra} more
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MonthView({
  currentDate,
  today,
  byDay,
  onOpen,
  onOpenDay,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  currentDate: Date;
  today: Date;
  byDay: Map<string, CalendarEvent[]>;
  onOpen: (item: CalendarEvent) => void;
  onOpenDay: (day: Date) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (day: Date) => void;
}) {
  const days = useMemo(() => monthGrid(currentDate), [currentDate]);
  const month = currentDate.getMonth();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="grid shrink-0 grid-cols-7 border-b">
        {weekdayLabels.map((label) => (
          <div key={label} className="p-2 text-center text-xs font-medium text-muted-foreground">
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.slice(0, 1)}</span>
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
        {days.map((day) => (
          <DayCell
            key={dayKey(day)}
            day={day}
            inMonth={day.getMonth() === month}
            today={isSameDay(day, today)}
            items={byDay.get(dayKey(day)) ?? noEvents}
            onOpen={onOpen}
            onOpenDay={onOpenDay}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
          />
        ))}
      </div>
    </div>
  );
}

function WeekCell({
  day,
  hour,
  items,
  onOpen,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  day: Date;
  hour: number;
  items: CalendarEvent[];
  onOpen: (item: CalendarEvent) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (day: Date, hour: number) => void;
}) {
  const drop = useCallback(() => onDrop(day, hour), [day, hour, onDrop]);
  return (
    <div
      className="flex min-h-12 flex-col gap-1 border-r border-b p-0.5"
      onDragOver={allowDrop}
      onDrop={drop}
    >
      {items.map((item) => (
        <EventChip
          key={item.id}
          item={item}
          variant="default"
          onOpen={onOpen}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  );
}

function WeekHour({
  hour,
  days,
  bySlot,
  onOpen,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  hour: number;
  days: Date[];
  bySlot: Map<string, CalendarEvent[]>;
  onOpen: (item: CalendarEvent) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (day: Date, hour: number) => void;
}) {
  return (
    <>
      <div className="border-r border-b p-1 text-xs text-muted-foreground">
        {String(hour).padStart(2, "0")}:00
      </div>
      {days.map((day) => (
        <WeekCell
          key={`${dayKey(day)}-${hour}`}
          day={day}
          hour={hour}
          items={bySlot.get(`${dayKey(day)}-${hour}`) ?? noEvents}
          onOpen={onOpen}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDrop={onDrop}
        />
      ))}
    </>
  );
}

function WeekView({
  currentDate,
  bySlot,
  onOpen,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  currentDate: Date;
  bySlot: Map<string, CalendarEvent[]>;
  onOpen: (item: CalendarEvent) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (day: Date, hour: number) => void;
}) {
  const days = useMemo(() => weekDays(currentDate), [currentDate]);
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="grid shrink-0 grid-cols-8 border-b">
        <div className="border-r p-2 text-center text-xs font-medium text-muted-foreground">
          Time
        </div>
        {days.map((day) => (
          <div
            key={dayKey(day)}
            className="border-r p-2 text-center text-xs font-medium last:border-r-0"
          >
            <div className="hidden sm:block">{formatWeekday(day, false)}</div>
            <div className="sm:hidden">{formatWeekday(day, true)}</div>
            <div className="text-xs text-muted-foreground">{formatMonthDay(day)}</div>
          </div>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid grid-cols-8">
          {dayHours.map((hour) => (
            <WeekHour
              key={hour}
              hour={hour}
              days={days}
              bySlot={bySlot}
              onOpen={onOpen}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayHour({
  day,
  hour,
  items,
  onOpen,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  day: Date;
  hour: number;
  items: CalendarEvent[];
  onOpen: (item: CalendarEvent) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (day: Date, hour: number) => void;
}) {
  const drop = useCallback(() => onDrop(day, hour), [day, hour, onDrop]);
  return (
    <div className="flex border-b last:border-b-0" onDragOver={allowDrop} onDrop={drop}>
      <div className="w-14 shrink-0 border-r p-2 text-xs text-muted-foreground sm:w-20">
        {String(hour).padStart(2, "0")}:00
      </div>
      <div className="flex min-h-16 flex-1 flex-col gap-2 p-2">
        {items.map((item) => (
          <EventChip
            key={item.id}
            item={item}
            variant="detailed"
            onOpen={onOpen}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
}

function DayView({
  currentDate,
  bySlot,
  onOpen,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  currentDate: Date;
  bySlot: Map<string, CalendarEvent[]>;
  onOpen: (item: CalendarEvent) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (day: Date, hour: number) => void;
}) {
  const key = dayKey(currentDate);
  return (
    <div className="h-full min-h-0 overflow-auto rounded-xl bg-card ring-1 ring-foreground/10">
      {dayHours.map((hour) => (
        <DayHour
          key={hour}
          day={currentDate}
          hour={hour}
          items={bySlot.get(`${key}-${hour}`) ?? noEvents}
          onOpen={onOpen}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDrop={onDrop}
        />
      ))}
    </div>
  );
}

function ListRow({ item, onOpen }: { item: CalendarEvent; onOpen: (item: CalendarEvent) => void }) {
  const open = useCallback(() => onOpen(item), [item, onOpen]);
  return (
    <button
      type="button"
      onClick={open}
      className="flex w-full gap-3 rounded-lg bg-card p-3 text-left ring-1 ring-foreground/10"
    >
      <Swatch color={item.color} />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex flex-wrap items-start justify-between gap-2">
          <span className="font-medium">{item.title}</span>
          <span className="flex flex-wrap gap-1">
            {item.source === "google" ? <Badge variant="secondary">Google Calendar</Badge> : null}
            {item.source === "luma" ? <Badge variant="secondary">Luma</Badge> : null}
            {item.category ? <Badge variant="outline">{item.category}</Badge> : null}
          </span>
        </span>
        {item.description ? (
          <span className="line-clamp-2 text-sm text-muted-foreground">{item.description}</span>
        ) : null}
        <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Clock />
          {formatTime(item.startTime)} – {formatTime(item.endTime)}
          {item.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </span>
      </span>
    </button>
  );
}

function ListView({
  groups,
  onOpen,
}: {
  groups: { date: string; items: CalendarEvent[] }[];
  onOpen: (item: CalendarEvent) => void;
}) {
  if (groups.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-card ring-1 ring-foreground/10">
        <p className="text-sm text-muted-foreground">No events found</p>
      </div>
    );
  }
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-auto">
      {groups.map((group) => (
        <section key={group.date} className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">{group.date}</h3>
          <div className="flex flex-col gap-2">
            {group.items.map((item) => (
              <ListRow key={item.id} item={item} onOpen={onOpen} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function FilterCheckbox({
  id,
  label,
  checked,
  onToggle,
  swatch,
}: {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (id: string, checked: boolean) => void;
  swatch?: EventColor;
}) {
  const change = useCallback((next: boolean) => onToggle(id, next), [id, onToggle]);
  return (
    <DropdownMenuCheckboxItem checked={checked} onCheckedChange={change}>
      {swatch ? <Swatch color={swatch} /> : null}
      {label}
    </DropdownMenuCheckboxItem>
  );
}

function FilterMenu({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger variant="outline" size="sm">
        <Filter data-icon="inline-start" />
        {label}
        {count > 0 ? <Badge variant="secondary">{count}</Badge> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Filter by {label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {children}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FilterChip({
  id,
  label,
  onRemove,
  swatch,
}: {
  id: string;
  label: string;
  onRemove: (id: string) => void;
  swatch?: EventColor;
}) {
  const remove = useCallback(() => onRemove(id), [id, onRemove]);
  return (
    <Badge variant="secondary">
      {swatch ? <Swatch color={swatch} /> : null}
      {label}
      <button type="button" onClick={remove} aria-label={`Remove ${label} filter`}>
        <X />
      </button>
    </Badge>
  );
}

function TagButton({
  tag,
  selected,
  disabled,
  onToggle,
}: {
  tag: string;
  selected: boolean;
  disabled: boolean;
  onToggle: (tag: string) => void;
}) {
  const toggle = useCallback(() => onToggle(tag), [onToggle, tag]);
  return (
    <Button
      type="button"
      size="xs"
      variant={selected ? "default" : "outline"}
      disabled={disabled}
      onClick={toggle}
    >
      {tag}
    </Button>
  );
}

function blankEvent(day: Date): CalendarEvent {
  const start = new Date(day);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(11, 0, 0, 0);
  return {
    id: "",
    title: "",
    description: "",
    startTime: start,
    endTime: end,
    color: "chart-4",
    category: "Meeting",
    attendees: [],
    tags: [],
    source: "local",
    locked: false,
  };
}

export function CalendarScreen({
  workspace,
  googleEvents,
  lumaEvents,
}: {
  workspace: Workspace;
  googleEvents: CalendarItem[];
  lumaEvents: CalendarItem[];
}) {
  const [today] = useState(() => new Date());
  const [currentDate, setCurrentDate] = useState(today);
  const [view, setView] = useState<CalendarView>("month");
  const [draft, setDraft] = useState<CalendarEvent | null>(null);
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [created, setCreated] = useState<CalendarEvent[]>([]);
  const [edits, setEdits] = useState<CalendarEvent[]>([]);
  const [deleted, setDeleted] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedColors, setSelectedColors] = useState<EventColor[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const draggedId = useRef<string | null>(null);

  const remote = useMemo(() => {
    const incoming = [...googleEvents, ...lumaEvents, ...workspaceCalendarItems(workspace)];
    return incoming.flatMap((item) => {
      const startTime = new Date(item.startTime);
      const endTime = new Date(item.endTime);
      if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) return [];
      return [{ ...item, startTime, endTime }];
    });
  }, [googleEvents, lumaEvents, workspace]);

  const events = useMemo(() => {
    const removed = new Set(deleted);
    const edited = new Map(edits.map((item) => [item.id, item]));
    const base = remote.flatMap((item) => {
      if (removed.has(item.id)) return [];
      return [edited.get(item.id) ?? item];
    });
    return [...base, ...created.filter((item) => !removed.has(item.id))];
  }, [remote, edits, deleted, created]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((item) => {
      if (query) {
        const haystack = [
          item.title,
          item.description,
          item.category,
          ...item.tags,
          ...item.attendees,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (selectedColors.length > 0 && !selectedColors.includes(item.color)) return false;
      if (selectedTags.length > 0 && !item.tags.some((tag) => selectedTags.includes(tag)))
        return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(item.category))
        return false;
      return true;
    });
  }, [events, search, selectedColors, selectedTags, selectedCategories]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const item of filtered) {
      const key = dayKey(item.startTime);
      const list = map.get(key);
      if (list) list.push(item);
      else map.set(key, [item]);
    }
    return map;
  }, [filtered]);

  const bySlot = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const item of filtered) {
      const key = `${dayKey(item.startTime)}-${item.startTime.getHours()}`;
      const list = map.get(key);
      if (list) list.push(item);
      else map.set(key, [item]);
    }
    return map;
  }, [filtered]);

  const groups = useMemo(() => {
    const sorted = filtered.toSorted(
      (left, right) => left.startTime.getTime() - right.startTime.getTime(),
    );
    const next: { date: string; items: CalendarEvent[] }[] = [];
    for (const item of sorted) {
      const date = formatListDate(item.startTime);
      const last = next[next.length - 1];
      if (last?.date === date) last.items.push(item);
      else next.push({ date, items: [item] });
    }
    return next;
  }, [filtered]);

  const googleCount = useMemo(
    () => filtered.filter((item) => item.source === "google").length,
    [filtered],
  );
  const lumaCount = useMemo(
    () => filtered.filter((item) => item.source === "luma").length,
    [filtered],
  );
  const hasFilters =
    selectedColors.length > 0 || selectedTags.length > 0 || selectedCategories.length > 0;
  const selectedView = useMemo(() => [view], [view]);
  const dialogText = dialogCopy(mode, draft?.source ?? null);
  const canSave = Boolean(
    draft &&
    !draft.locked &&
    draft.title.trim() &&
    draft.endTime.getTime() > draft.startTime.getTime(),
  );

  const commit = useCallback((next: CalendarEvent) => {
    if (next.locked) return;
    if (next.source === "local") {
      setCreated((prev) => prev.map((item) => (item.id === next.id ? next : item)));
      return;
    }
    setEdits((prev) => [...prev.filter((item) => item.id !== next.id), next]);
  }, []);

  const go = useCallback(
    (direction: "prev" | "next") => {
      setCurrentDate((prev) => {
        const next = new Date(prev);
        const amount = direction === "next" ? 1 : -1;
        if (view === "month") next.setMonth(prev.getMonth() + amount);
        else if (view === "week") next.setDate(prev.getDate() + amount * 7);
        else if (view === "day") next.setDate(prev.getDate() + amount);
        return next;
      });
    },
    [view],
  );
  const goPrev = useCallback(() => go("prev"), [go]);
  const goNext = useCallback(() => go("next"), [go]);
  const goToday = useCallback(() => setCurrentDate(new Date()), []);
  const changeView = useCallback((values: string[]) => {
    const next = values[0];
    if (next && isCalendarView(next)) setView(next);
  }, []);
  const openCreate = useCallback(() => {
    setDraft(blankEvent(currentDate));
    setMode("create");
  }, [currentDate]);
  const openEvent = useCallback((item: CalendarEvent) => {
    setDraft({ ...item, tags: [...item.tags], attendees: [...item.attendees] });
    setMode("edit");
  }, []);
  const openDay = useCallback((day: Date) => {
    setCurrentDate(day);
    setView("day");
  }, []);
  const closeDialog = useCallback(() => {
    setDraft(null);
    setMode(null);
  }, []);
  const dialogChange = useCallback((open: boolean) => {
    if (!open) {
      setDraft(null);
      setMode(null);
    }
  }, []);
  const dragStart = useCallback((id: string) => {
    draggedId.current = id;
  }, []);
  const dragEnd = useCallback(() => {
    draggedId.current = null;
  }, []);
  const dropOnDay = useCallback(
    (date: Date) => {
      const id = draggedId.current;
      if (!id) return;
      const current = events.find((item) => item.id === id);
      if (!current || current.locked) return;
      const duration = current.endTime.getTime() - current.startTime.getTime();
      const start = new Date(date);
      start.setHours(current.startTime.getHours(), current.startTime.getMinutes(), 0, 0);
      commit({ ...current, startTime: start, endTime: new Date(start.getTime() + duration) });
    },
    [commit, events],
  );
  const dropOnHour = useCallback(
    (date: Date, hour: number) => {
      const id = draggedId.current;
      if (!id) return;
      const current = events.find((item) => item.id === id);
      if (!current || current.locked) return;
      const duration = current.endTime.getTime() - current.startTime.getTime();
      const start = new Date(date);
      start.setHours(hour, 0, 0, 0);
      commit({ ...current, startTime: start, endTime: new Date(start.getTime() + duration) });
    },
    [commit, events],
  );
  const changeSearch = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  }, []);
  const clearSearch = useCallback(() => setSearch(""), []);
  const toggleColor = useCallback((id: string, checked: boolean) => {
    if (!isEventColor(id)) return;
    setSelectedColors((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((color) => color !== id);
    });
  }, []);
  const toggleTagFilter = useCallback((id: string, checked: boolean) => {
    setSelectedTags((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((tag) => tag !== id);
    });
  }, []);
  const toggleCategory = useCallback((id: string, checked: boolean) => {
    setSelectedCategories((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((category) => category !== id);
    });
  }, []);
  const removeColor = useCallback((id: string) => {
    setSelectedColors((prev) => prev.filter((color) => color !== id));
  }, []);
  const removeTag = useCallback((id: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== id));
  }, []);
  const removeCategory = useCallback((id: string) => {
    setSelectedCategories((prev) => prev.filter((category) => category !== id));
  }, []);
  const clearFilters = useCallback(() => {
    setSelectedColors([]);
    setSelectedTags([]);
    setSelectedCategories([]);
    setSearch("");
  }, []);
  const changeTitle = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDraft((prev) => (prev ? { ...prev, title: value } : prev));
  }, []);
  const changeDescription = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setDraft((prev) => (prev ? { ...prev, description: value } : prev));
  }, []);
  const changeStart = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const date = new Date(event.target.value);
    if (Number.isNaN(date.getTime())) return;
    setDraft((prev) => (prev ? { ...prev, startTime: date } : prev));
  }, []);
  const changeEnd = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const date = new Date(event.target.value);
    if (Number.isNaN(date.getTime())) return;
    setDraft((prev) => (prev ? { ...prev, endTime: date } : prev));
  }, []);
  const changeCategoryField = useCallback((value: string | null) => {
    if (!value || !isCalendarCategory(value)) return;
    setDraft((prev) => (prev ? { ...prev, category: value } : prev));
  }, []);
  const changeColorField = useCallback((value: string | null) => {
    if (!value || !isEventColor(value)) return;
    setDraft((prev) => (prev ? { ...prev, color: value } : prev));
  }, []);
  const toggleTag = useCallback((tag: string) => {
    setDraft((prev) => {
      if (!prev || prev.locked) return prev;
      const tags = prev.tags.includes(tag)
        ? prev.tags.filter((item) => item !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags };
    });
  }, []);
  const save = useCallback(() => {
    if (!draft || draft.locked || !draft.title.trim()) return;
    if (draft.endTime.getTime() <= draft.startTime.getTime()) return;
    const next = { ...draft, title: draft.title.trim() };
    if (mode === "create") {
      setCreated((prev) => [...prev, { ...next, id: `local:${crypto.randomUUID()}` }]);
    } else if (next.source === "local") {
      setCreated((prev) => prev.map((item) => (item.id === next.id ? next : item)));
    } else {
      setEdits((prev) => [...prev.filter((item) => item.id !== next.id), next]);
    }
    setDraft(null);
    setMode(null);
  }, [draft, mode]);
  const remove = useCallback(() => {
    if (!draft || draft.locked || mode !== "edit") return;
    if (draft.source === "local") {
      setCreated((prev) => prev.filter((item) => item.id !== draft.id));
    } else {
      setDeleted((prev) => (prev.includes(draft.id) ? prev : [...prev, draft.id]));
    }
    setDraft(null);
    setMode(null);
  }, [draft, mode]);
  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      save();
    },
    [save],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <h2 className="text-xl font-semibold tracking-tight">{viewTitle(view, currentDate)}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goPrev} aria-label="Previous">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goNext} aria-label="Next">
              <ChevronRight />
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ToggleGroup value={selectedView} onValueChange={changeView} aria-label="Calendar view">
            <ToggleGroupItem value="month" aria-label="Month">
              <CalendarDays data-icon="inline-start" />
              <span className="hidden sm:inline">Month</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="Week">
              <Grid3x3 data-icon="inline-start" />
              <span className="hidden sm:inline">Week</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="day" aria-label="Day">
              <Clock data-icon="inline-start" />
              <span className="hidden sm:inline">Day</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List">
              <List data-icon="inline-start" />
              <span className="hidden sm:inline">List</span>
            </ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />
            New event
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <InputGroup className="lg:max-w-80">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            onChange={changeSearch}
            placeholder="Search events"
            aria-label="Search events"
          />
          {search ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={clearSearch}>
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
        <div className="flex flex-wrap items-center gap-2">
          <FilterMenu label="Colors" count={selectedColors.length}>
            {eventColors.map((color) => (
              <FilterCheckbox
                key={color}
                id={color}
                label={eventColorLabels[color]}
                checked={selectedColors.includes(color)}
                onToggle={toggleColor}
                swatch={color}
              />
            ))}
          </FilterMenu>
          <FilterMenu label="Tags" count={selectedTags.length}>
            {calendarTags.map((tag) => (
              <FilterCheckbox
                key={tag}
                id={tag}
                label={tag}
                checked={selectedTags.includes(tag)}
                onToggle={toggleTagFilter}
              />
            ))}
          </FilterMenu>
          <FilterMenu label="Categories" count={selectedCategories.length}>
            {calendarCategories.map((category) => (
              <FilterCheckbox
                key={category}
                id={category}
                label={category}
                checked={selectedCategories.includes(category)}
                onToggle={toggleCategory}
              />
            ))}
          </FilterMenu>
          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X data-icon="inline-start" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Swatch color="primary" />
          Google Calendar
          <span className="tabular-nums">{googleCount}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Swatch color="chart-4" />
          Luma
          <span className="tabular-nums">{lumaCount}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Swatch color="chart-1" />
          Projects
        </span>
        <span className="flex items-center gap-1.5">
          <Swatch color="chart-3" />
          Tasks
        </span>
      </div>

      {hasFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          {selectedColors.map((color) => (
            <FilterChip
              key={color}
              id={color}
              label={eventColorLabels[color]}
              swatch={color}
              onRemove={removeColor}
            />
          ))}
          {selectedTags.map((tag) => (
            <FilterChip key={tag} id={tag} label={tag} onRemove={removeTag} />
          ))}
          {selectedCategories.map((category) => (
            <FilterChip key={category} id={category} label={category} onRemove={removeCategory} />
          ))}
        </div>
      ) : null}

      <div className="min-h-0 flex-1">
        {view === "month" ? (
          <MonthView
            currentDate={currentDate}
            today={today}
            byDay={byDay}
            onOpen={openEvent}
            onOpenDay={openDay}
            onDragStart={dragStart}
            onDragEnd={dragEnd}
            onDrop={dropOnDay}
          />
        ) : null}
        {view === "week" ? (
          <WeekView
            currentDate={currentDate}
            bySlot={bySlot}
            onOpen={openEvent}
            onDragStart={dragStart}
            onDragEnd={dragEnd}
            onDrop={dropOnHour}
          />
        ) : null}
        {view === "day" ? (
          <DayView
            currentDate={currentDate}
            bySlot={bySlot}
            onOpen={openEvent}
            onDragStart={dragStart}
            onDragEnd={dragEnd}
            onDrop={dropOnHour}
          />
        ) : null}
        {view === "list" ? <ListView groups={groups} onOpen={openEvent} /> : null}
      </div>

      <Dialog open={draft !== null} onOpenChange={dialogChange}>
        <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogText.title}</DialogTitle>
            <DialogDescription>{dialogText.description}</DialogDescription>
          </DialogHeader>
          {draft ? (
            <form onSubmit={submit} className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="event-title">Title</FieldLabel>
                  <Input
                    id="event-title"
                    value={draft.title}
                    onChange={changeTitle}
                    placeholder="Event title"
                    disabled={draft.locked}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="event-description">Description</FieldLabel>
                  <Textarea
                    id="event-description"
                    value={draft.description}
                    onChange={changeDescription}
                    placeholder="Details"
                    rows={3}
                    disabled={draft.locked}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="event-start">Start</FieldLabel>
                  <Input
                    id="event-start"
                    type="datetime-local"
                    value={toDateTimeLocal(draft.startTime)}
                    onChange={changeStart}
                    disabled={draft.locked}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="event-end">End</FieldLabel>
                  <Input
                    id="event-end"
                    type="datetime-local"
                    value={toDateTimeLocal(draft.endTime)}
                    onChange={changeEnd}
                    disabled={draft.locked}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="event-category">Category</FieldLabel>
                  <Select
                    items={categoryItems}
                    value={draft.category}
                    onValueChange={changeCategoryField}
                    disabled={draft.locked}
                  >
                    <SelectTrigger id="event-category" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {categoryItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="event-color">Color</FieldLabel>
                  <Select
                    items={colorItems}
                    value={draft.color}
                    onValueChange={changeColorField}
                    disabled={draft.locked}
                  >
                    <SelectTrigger id="event-color" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {eventColors.map((color) => (
                          <SelectItem key={color} value={color}>
                            <Swatch color={color} />
                            {eventColorLabels[color]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Tags</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {calendarTags.map((tag) => (
                      <TagButton
                        key={tag}
                        tag={tag}
                        selected={draft.tags.includes(tag)}
                        disabled={draft.locked}
                        onToggle={toggleTag}
                      />
                    ))}
                  </div>
                </Field>
                {draft.attendees.length > 0 ? (
                  <Field>
                    <FieldLabel>People</FieldLabel>
                    <p className="text-sm text-muted-foreground">{draft.attendees.join(", ")}</p>
                  </Field>
                ) : null}
              </FieldGroup>
              <DialogFooter className="sm:justify-between">
                {mode === "edit" && !draft.locked ? (
                  <Button type="button" variant="destructive" onClick={remove}>
                    Delete
                  </Button>
                ) : (
                  <span />
                )}
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    {draft.locked ? "Close" : "Cancel"}
                  </Button>
                  {draft.locked ? null : (
                    <Button type="submit" disabled={!canSave}>
                      {mode === "create" ? "Create" : "Save"}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
