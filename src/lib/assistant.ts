import { z } from "zod";

export const assistantIdSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[\w-]+$/);
export const assistantTitleSchema = z.string().trim().min(1).max(100);
export const assistantContentSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    parts: z.array(z.record(z.string(), z.unknown())).max(200),
    metadata: z.unknown().optional(),
  })
  .passthrough();
export const assistantMessageSchema = z
  .object({
    id: assistantIdSchema,
    parentId: assistantIdSchema.nullable(),
    format: z.literal("ai-sdk/v6"),
    content: assistantContentSchema,
  })
  .refine((message) => message.parentId !== message.id, "A message cannot be its own parent.");
export const assistantThreadSchema = z.object({
  id: assistantIdSchema,
  title: assistantTitleSchema,
  status: z.enum(["regular", "archived"]),
  headId: assistantIdSchema.nullable(),
  updatedAt: z.iso.datetime(),
});
export const assistantThreadPatchSchema = z.object({
  title: assistantTitleSchema.optional(),
  status: assistantThreadSchema.shape.status.optional(),
});
export const assistantMessageWriteSchema = z.object({
  threadId: assistantIdSchema,
  message: assistantMessageSchema,
  select: z.boolean(),
});
export const assistantBranchSchema = z.object({
  threadId: assistantIdSchema,
  headId: assistantIdSchema.nullable(),
});

export type AssistantThread = z.infer<typeof assistantThreadSchema>;
export type AssistantMessageWrite = z.infer<typeof assistantMessageWriteSchema>;
export type AssistantThreadPatch = z.infer<typeof assistantThreadPatchSchema>;
export type AssistantBranch = z.infer<typeof assistantBranchSchema>;

export function assistantTitle(text: string) {
  return text.trim().replace(/\s+/g, " ").slice(0, 100) || "New conversation";
}
