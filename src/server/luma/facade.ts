import "server-only";

import { randomUUID } from "node:crypto";

import {
  addLumaGuestSchema,
  createLumaEventSchema,
  lumaCalendarSchema,
  sendLumaBlastSchema,
  updateLumaGuestSchema,
  type AddLumaGuest,
  type CreateLumaEvent,
  type LumaCalendar,
  type LumaEvent,
  type SendLumaBlast,
  type UpdateLumaGuest,
} from "@/lib/luma";

import { withLuma } from "./store";

function eventById(calendar: LumaCalendar, eventApiId: string) {
  const event = calendar.events.find((item) => item.apiId === eventApiId);
  if (!event) throw new Error("That event is not on the TRES calendar.");
  return event;
}

function recount(event: LumaEvent) {
  for (const ticket of event.tickets) {
    ticket.sold = event.guests.filter(
      (guest) => guest.ticketName === ticket.name && guest.approvalStatus === "approved",
    ).length;
  }
}

function touch(calendar: LumaCalendar) {
  calendar.syncedAt = new Date().toISOString();
}

function slugify(name: string) {
  const slug = name
    .toLowerCase()
    .replaceAll("ä", "a")
    .replaceAll("ö", "o")
    .replaceAll("å", "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug.length > 0 ? slug : "event";
}

function uniqueSlug(calendar: LumaCalendar, name: string) {
  const base = slugify(name);
  if (!calendar.events.some((event) => event.slug === base)) return base;
  return `${base}-${randomUUID().slice(0, 4)}`;
}

export async function getLumaCalendar(): Promise<LumaCalendar> {
  return withLuma((calendar) => calendar, false);
}

export async function createLumaEvent(input: CreateLumaEvent): Promise<LumaCalendar> {
  const data = createLumaEventSchema.parse(input);
  return withLuma((calendar) => {
    const start = new Date(data.startAt);
    const slug = uniqueSlug(calendar, data.name);
    const event: LumaEvent = {
      apiId: `evt-${randomUUID()}`,
      name: data.name,
      slug,
      description: "",
      startAt: start.toISOString(),
      endAt: new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      timezone: "Europe/Helsinki",
      visibility: data.visibility,
      status: "published",
      location: data.location,
      pageUrl: null,
      requireApproval: false,
      questions: ["University or company", "What do you want to build?"],
      tickets: [
        {
          apiId: `tkt-${randomUUID()}`,
          name: "General Admission",
          priceCents: 0,
          currency: "EUR",
          sold: 0,
          capacity: 80,
        },
      ],
      hosts: [{ apiId: `host-${randomUUID()}`, name: "TRES", role: "creator" }],
      guests: [],
      insights: [],
      blasts: [],
    };
    calendar.events.push(event);
    touch(calendar);
    return lumaCalendarSchema.parse(calendar);
  });
}

export async function addLumaGuest(input: AddLumaGuest): Promise<LumaCalendar> {
  const data = addLumaGuestSchema.parse(input);
  return withLuma((calendar) => {
    const event = eventById(calendar, data.eventApiId);
    const ticket = event.tickets.find((item) => item.name === data.ticketName);
    if (!ticket) throw new Error("Choose a ticket from this event.");
    if (event.guests.some((guest) => guest.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error("That guest is already on the list.");
    }
    const approvalStatus = event.requireApproval ? "pending_approval" : "approved";
    if (approvalStatus === "approved" && ticket.sold >= ticket.capacity) {
      throw new Error("That ticket is full.");
    }
    event.guests.push({
      apiId: `gst-${randomUUID()}`,
      name: data.name,
      email: data.email,
      approvalStatus,
      ticketName: ticket.name,
      registeredAt: new Date().toISOString(),
      checkedInAt: null,
    });
    recount(event);
    touch(calendar);
    return calendar;
  });
}

export async function updateLumaGuest(input: UpdateLumaGuest): Promise<LumaCalendar> {
  const data = updateLumaGuestSchema.parse(input);
  return withLuma((calendar) => {
    const event = eventById(calendar, data.eventApiId);
    const guest = event.guests.find((item) => item.apiId === data.guestApiId);
    if (!guest) throw new Error("That guest is not on this event.");
    if (data.approvalStatus) {
      if (data.approvalStatus === "approved" && guest.approvalStatus !== "approved") {
        const ticket = event.tickets.find((item) => item.name === guest.ticketName);
        if (ticket && ticket.sold >= ticket.capacity) throw new Error("That ticket is full.");
      }
      guest.approvalStatus = data.approvalStatus;
      if (data.approvalStatus !== "approved") guest.checkedInAt = null;
    }
    if (data.checkIn) {
      if (guest.approvalStatus !== "approved") {
        throw new Error("Only guests who are going can be checked in.");
      }
      guest.checkedInAt = new Date().toISOString();
    }
    recount(event);
    touch(calendar);
    return calendar;
  });
}

export async function sendLumaBlast(input: SendLumaBlast): Promise<LumaCalendar> {
  const data = sendLumaBlastSchema.parse(input);
  return withLuma((calendar) => {
    const event = eventById(calendar, data.eventApiId);
    const recipients = event.guests.filter((guest) => guest.approvalStatus === "approved").length;
    event.blasts.unshift({
      apiId: `blast-${randomUUID()}`,
      subject: data.subject,
      preview: data.body,
      sentAt: new Date().toISOString(),
      recipients,
    });
    touch(calendar);
    return calendar;
  });
}
