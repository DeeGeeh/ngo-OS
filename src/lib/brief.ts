import { z } from "zod";

const briefActionSchema = z.object({
  title: z.string().min(1).max(70),
  instruction: z.string().min(1).max(300),
  canHandle: z.boolean(),
  sources: z.array(z.string().min(1).max(160)).min(1).max(3),
});

export const briefContentSchema = z.object({
  summary: z.string().min(1).max(180),
  actions: z.array(briefActionSchema).max(3),
});

export const dailyBriefSchema = briefContentSchema.extend({
  version: z.literal(2),
  date: z.iso.date(),
  generatedAt: z.iso.datetime(),
  unavailableSources: z.array(z.string()),
});
export type DailyBrief = z.infer<typeof dailyBriefSchema>;
export type BriefRefreshState = { error: string | null };
