import "server-only";

import { env } from "@/env";
import { lumaCalendarItems, type CalendarItem } from "@/lib/calendar";
import { getLumaCalendar } from "@/server/luma/facade";

const demoGoogleCalendar = [
  {
    id: "google:hack-debrief",
    title: "Hack for Humanity debrief",
    description: "What shipped, who to follow up with, and what the board should decide next.",
    startTime: "2026-10-04T11:00:00+03:00",
    endTime: "2026-10-04T12:30:00+03:00",
    attendees: ["Diar", "Aino Laine"],
    tags: ["Google Calendar", "Team"],
  },
  {
    id: "google:board-sync",
    title: "Board sync",
    description: "Weekly board check-in. Agenda lives with the open board task.",
    startTime: "2026-10-06T17:00:00+03:00",
    endTime: "2026-10-06T18:00:00+03:00",
    attendees: ["Diar", "Aino Laine", "Elias Koski"],
    tags: ["Google Calendar", "Important"],
  },
  {
    id: "google:platform6",
    title: "Platform6 walkthrough",
    description: "Confirm the room, capacity, and access before Founder Night.",
    startTime: "2026-10-09T14:00:00+03:00",
    endTime: "2026-10-09T15:00:00+03:00",
    attendees: ["Elias Koski"],
    tags: ["Google Calendar"],
  },
  {
    id: "google:office-hours",
    title: "Volunteer office hours",
    description: "Open hour for members who want a project or a role.",
    startTime: "2026-10-10T12:00:00+03:00",
    endTime: "2026-10-10T13:00:00+03:00",
    attendees: ["Aino Laine"],
    tags: ["Google Calendar", "Team"],
  },
  {
    id: "google:member-coffee",
    title: "New member coffee",
    description: "Meet people who joined after the hackathon and point them at a project.",
    startTime: "2026-10-14T10:00:00+03:00",
    endTime: "2026-10-14T11:00:00+03:00",
    attendees: ["Aino Laine", "Noora Niemi"],
    tags: ["Google Calendar"],
  },
  {
    id: "google:founder-rehearsal",
    title: "Founder Night rehearsal",
    description: "Run the evening timings at Platform6 before the public night.",
    startTime: "2026-10-21T18:00:00+03:00",
    endTime: "2026-10-21T20:30:00+03:00",
    attendees: ["Elias Koski", "Aino Laine", "Noora Niemi"],
    tags: ["Google Calendar", "Important", "Team"],
  },
  {
    id: "google:campus-planning",
    title: "Campus Builders planning",
    description: "Lock the session format, room, and mentor list.",
    startTime: "2026-10-28T15:00:00+03:00",
    endTime: "2026-10-28T16:30:00+03:00",
    attendees: ["Diar", "Leo Virtanen"],
    tags: ["Google Calendar", "Team"],
  },
  {
    id: "google:stockholm",
    title: "Stockholm excursion planning",
    description: "Dates, headcount, and who is hosting the visit.",
    startTime: "2026-10-30T09:00:00+03:00",
    endTime: "2026-10-30T10:00:00+03:00",
    attendees: ["Elias Koski", "Noora Niemi"],
    tags: ["Google Calendar"],
  },
] as const;

function googleItem(event: (typeof demoGoogleCalendar)[number]): CalendarItem {
  return {
    ...event,
    attendees: [...event.attendees],
    tags: [...event.tags],
    color: "primary",
    category: "Meeting",
    source: "google",
    locked: true,
  };
}

function unfold(ics: string) {
  return ics.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function unescapeIcs(value: string) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function field(block: string, name: string) {
  const line = block
    .split("\n")
    .find((entry) => entry.startsWith(`${name}:`) || entry.startsWith(`${name};`));
  if (!line) return "";
  const separator = line.indexOf(":");
  if (separator < 0) return "";
  return unescapeIcs(line.slice(separator + 1).trim());
}

function parseIcsDate(value: string) {
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4] ?? "0");
  const minute = Number(match[5] ?? "0");
  const second = Number(match[6] ?? "0");
  if (match[7] === "Z") return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return new Date(year, month - 1, day, hour, minute, second);
}

function parseIcs(text: string): CalendarItem[] {
  if (text.length > 2_000_000) return [];
  const blocks = unfold(text).split("BEGIN:VEVENT").slice(1);
  const events: CalendarItem[] = [];
  for (const block of blocks) {
    if (events.length >= 200) break;
    const summary = field(block, "SUMMARY");
    const start = parseIcsDate(field(block, "DTSTART"));
    const end = parseIcsDate(field(block, "DTEND"));
    if (!summary || !start) continue;
    const finish =
      end && end.getTime() > start.getTime() ? end : new Date(start.getTime() + 60 * 60 * 1000);
    const uid = field(block, "UID") || `${summary}-${start.toISOString()}`;
    events.push({
      id: `google:${uid}`,
      title: summary,
      description: field(block, "DESCRIPTION"),
      startTime: start.toISOString(),
      endTime: finish.toISOString(),
      color: "primary",
      category: "Meeting",
      attendees: [],
      tags: ["Google Calendar"],
      source: "google",
      locked: true,
    });
  }
  return events;
}

async function fetchIcs(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) return [];
    return parseIcs(await response.text());
  } catch {
    return [];
  }
}

export async function getLumaCalendarEvents(): Promise<CalendarItem[]> {
  const calendar = await getLumaCalendar();
  return lumaCalendarItems(calendar.events);
}

export async function getGoogleCalendarEvents(): Promise<CalendarItem[]> {
  const curated = demoGoogleCalendar.map(googleItem);
  const live = env.GOOGLE_CALENDAR_ICS_URL ? await fetchIcs(env.GOOGLE_CALENDAR_ICS_URL) : [];
  const seen = new Set(curated.map((event) => `${event.title}|${event.startTime}`));
  const merged = [...curated];
  for (const event of live) {
    const key = `${event.title}|${event.startTime}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(event);
  }
  return merged;
}
