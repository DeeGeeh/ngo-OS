import type { LumaEvent } from "@/lib/luma";
import type { Workspace } from "@/lib/workspace";

export const eventColors = ["chart-1", "chart-3", "chart-4", "primary", "destructive"] as const;
export type EventColor = (typeof eventColors)[number];

export const eventColorLabels: Record<EventColor, string> = {
  "chart-1": "Blue",
  "chart-3": "Navy",
  "chart-4": "Steel",
  primary: "Brand",
  destructive: "Red",
};

export const calendarCategories = ["Meeting", "Project", "Task", "Reminder"] as const;
export type CalendarCategory = (typeof calendarCategories)[number];

export const calendarTags = [
  "Important",
  "Urgent",
  "Team",
  "Google Calendar",
  "Workspace",
  "Luma",
] as const;

export const calendarViews = ["month", "week", "day", "list"] as const;
export type CalendarView = (typeof calendarViews)[number];

export type CalendarSource = "google" | "workspace" | "local" | "luma";

export type CalendarItem = {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  color: EventColor;
  category: string;
  attendees: string[];
  tags: string[];
  source: CalendarSource;
  locked: boolean;
};

export function isEventColor(value: string): value is EventColor {
  return eventColors.some((color) => color === value);
}

export function isCalendarCategory(value: string): value is CalendarCategory {
  return calendarCategories.some((category) => category === value);
}

export function isCalendarView(value: string): value is CalendarView {
  return calendarViews.some((view) => view === value);
}

const timeOptions = { hour: "2-digit", minute: "2-digit" } as const;
const monthTitleOptions = { month: "long", year: "numeric" } as const;
const weekTitleOptions = { month: "short", day: "numeric" } as const;
const dayTitleOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
} as const;
const listDateOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
} as const;
const weekdayOptions = { weekday: "short" } as const;
const weekdayNarrowOptions = { weekday: "narrow" } as const;
const monthDayOptions = { month: "short", day: "numeric" } as const;

export function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", timeOptions);
}

export function formatMonthTitle(date: Date) {
  return date.toLocaleDateString("en-US", monthTitleOptions);
}

export function formatWeekTitle(date: Date) {
  return `Week of ${date.toLocaleDateString("en-US", weekTitleOptions)}`;
}

export function formatDayTitle(date: Date) {
  return date.toLocaleDateString("en-US", dayTitleOptions);
}

export function formatListDate(date: Date) {
  return date.toLocaleDateString("en-US", listDateOptions);
}

export function formatWeekday(date: Date, narrow: boolean) {
  return date.toLocaleDateString("en-US", narrow ? weekdayNarrowOptions : weekdayOptions);
}

export function formatMonthDay(date: Date) {
  return date.toLocaleDateString("en-US", monthDayOptions);
}

export function formatDuration(start: Date, end: Date) {
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours > 0 && rest > 0) return `${hours}h ${rest}m`;
  if (hours > 0) return `${hours}h`;
  return `${rest}m`;
}

export function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function toDateTimeLocal(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function monthGrid(current: Date) {
  const first = new Date(current.getFullYear(), current.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function weekDays(current: Date) {
  const start = new Date(current);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export const dayHours = Array.from({ length: 24 }, (_, hour) => hour);
export const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function hourFromId(id: string) {
  let total = 0;
  for (const char of id) total += char.charCodeAt(0);
  return 9 + (total % 7);
}

function rangeOnDate(isoDate: string, hour: number, durationHours: number) {
  const parts = isoDate.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!year || !month || !day) return null;
  const start = new Date(year, month - 1, day, hour, 0, 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + durationHours);
  return { startTime: start.toISOString(), endTime: end.toISOString() };
}

export function workspaceCalendarItems(workspace: Workspace): CalendarItem[] {
  const names = new Map(workspace.members.map((member) => [member.id, member.name]));
  const items: CalendarItem[] = [];

  for (const project of workspace.projects) {
    if (!project.dueDate) continue;
    const range = rangeOnDate(project.dueDate, 17, 3);
    if (!range) continue;
    items.push({
      id: `project:${project.id}`,
      title: project.title,
      description: project.location
        ? `${project.description} ${project.location}`
        : project.description,
      ...range,
      color: "chart-1",
      category: "Project",
      attendees: project.assigneeIds.flatMap((id) => {
        const name = names.get(id);
        return name ? [name] : [];
      }),
      tags: project.status === "doing" ? ["Workspace", "Important"] : ["Workspace"],
      source: "workspace",
      locked: false,
    });
  }

  for (const task of workspace.tasks) {
    if (!task.dueDate) continue;
    const range = rangeOnDate(task.dueDate, hourFromId(task.id), 1);
    if (!range) continue;
    items.push({
      id: `task:${task.id}`,
      title: task.title,
      description: task.description,
      ...range,
      color: "chart-3",
      category: "Task",
      attendees: task.assigneeIds.flatMap((id) => {
        const name = names.get(id);
        return name ? [name] : [];
      }),
      tags: task.status === "doing" ? ["Workspace", "Important"] : ["Workspace"],
      source: "workspace",
      locked: false,
    });
  }

  return items;
}

export function lumaCalendarItems(events: readonly LumaEvent[]): CalendarItem[] {
  return events.map((event) => {
    const link = event.pageUrl ?? `https://luma.com/${event.slug}`;
    const description = [event.description, event.location, link]
      .filter((part) => part.length > 0)
      .join("\n");
    return {
      id: `luma:${event.apiId}`,
      title: event.name,
      description,
      startTime: event.startAt,
      endTime: event.endAt,
      color: "chart-4" as const,
      category: "Project",
      attendees: event.hosts.map((host) => host.name),
      tags: event.status === "draft" ? ["Luma"] : ["Luma", "Important"],
      source: "luma" as const,
      locked: true,
    };
  });
}
