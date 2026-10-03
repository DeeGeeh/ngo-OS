import { z } from "zod";

export const lumaQueryKey = ["luma"] as const;

export const lumaVisibilities = ["public", "private"] as const;
export const lumaEventStatuses = ["published", "draft"] as const;
export const lumaApprovals = [
  "approved",
  "pending_approval",
  "waitlist",
  "declined",
  "invited",
] as const;
export const lumaHostRoles = ["creator", "manager", "check-in"] as const;

export const lumaVisibilitySchema = z.enum(lumaVisibilities);
export const lumaEventStatusSchema = z.enum(lumaEventStatuses);
export const lumaApprovalSchema = z.enum(lumaApprovals);
export const lumaHostRoleSchema = z.enum(lumaHostRoles);

export const lumaGuestSchema = z.object({
  apiId: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  approvalStatus: lumaApprovalSchema,
  ticketName: z.string().min(1),
  registeredAt: z.iso.datetime(),
  checkedInAt: z.iso.datetime().nullable(),
});

export const lumaTicketSchema = z.object({
  apiId: z.string().min(1),
  name: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  currency: z.literal("EUR"),
  sold: z.number().int().nonnegative(),
  capacity: z.number().int().positive(),
});

export const lumaHostSchema = z.object({
  apiId: z.string().min(1),
  name: z.string().min(1),
  role: lumaHostRoleSchema,
});

export const lumaInsightSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  views: z.number().int().nonnegative(),
  registrations: z.number().int().nonnegative(),
});
export type LumaInsight = z.infer<typeof lumaInsightSchema>;

export const lumaBlastSchema = z.object({
  apiId: z.string().min(1),
  subject: z.string().min(1),
  preview: z.string().min(1),
  sentAt: z.iso.datetime(),
  recipients: z.number().int().nonnegative(),
});

export const lumaQuestionSchema = z.string().min(1).max(200);

export const lumaEventSchema = z.object({
  apiId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string(),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
  timezone: z.literal("Europe/Helsinki"),
  visibility: lumaVisibilitySchema,
  status: lumaEventStatusSchema,
  location: z.string().min(1),
  pageUrl: z.url().nullable(),
  requireApproval: z.boolean(),
  questions: z.array(lumaQuestionSchema),
  tickets: z.array(lumaTicketSchema).min(1),
  hosts: z.array(lumaHostSchema).min(1),
  guests: z.array(lumaGuestSchema),
  insights: z.array(lumaInsightSchema),
  blasts: z.array(lumaBlastSchema),
});

export const lumaCalendarSchema = z.object({
  apiId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  url: z.url(),
  timezone: z.literal("Europe/Helsinki"),
  syncedAt: z.iso.datetime(),
  events: z.array(lumaEventSchema),
});

export const createLumaEventSchema = z.object({
  name: z.string().trim().min(1).max(120),
  startAt: z.iso.datetime(),
  location: z.string().trim().min(1).max(160),
  visibility: lumaVisibilitySchema,
});

export const addLumaGuestSchema = z.object({
  eventApiId: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  email: z.email(),
  ticketName: z.string().min(1),
});

export const updateLumaGuestSchema = z.object({
  eventApiId: z.string().min(1),
  guestApiId: z.string().min(1),
  approvalStatus: lumaApprovalSchema.optional(),
  checkIn: z.boolean().optional(),
});

export const sendLumaBlastSchema = z.object({
  eventApiId: z.string().min(1),
  subject: z.string().trim().min(1).max(140),
  body: z.string().trim().min(1).max(2000),
});

export type LumaVisibility = z.infer<typeof lumaVisibilitySchema>;
export type LumaApproval = z.infer<typeof lumaApprovalSchema>;
export type LumaGuest = z.infer<typeof lumaGuestSchema>;
export type LumaEvent = z.infer<typeof lumaEventSchema>;
export type LumaCalendar = z.infer<typeof lumaCalendarSchema>;
export type CreateLumaEvent = z.infer<typeof createLumaEventSchema>;
export type AddLumaGuest = z.infer<typeof addLumaGuestSchema>;
export type UpdateLumaGuest = z.infer<typeof updateLumaGuestSchema>;
export type SendLumaBlast = z.infer<typeof sendLumaBlastSchema>;

export const approvalLabels: Record<LumaApproval, string> = {
  approved: "Going",
  pending_approval: "Pending",
  waitlist: "Waitlist",
  declined: "Not going",
  invited: "Invited",
};

export const hostRoleLabels = {
  creator: "Creator",
  manager: "Host",
  "check-in": "Check-in",
} as const;

const helsinkiWhen = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Helsinki",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const helsinkiDay = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Helsinki",
  day: "numeric",
  month: "short",
});

export function formatLumaWhen(iso: string) {
  return helsinkiWhen.format(new Date(iso));
}

export function formatLumaDay(iso: string) {
  return helsinkiDay.format(new Date(iso));
}

export function formatTicketPrice(cents: number) {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function lumaPath(slug: string) {
  return `luma.com/${slug}`;
}
