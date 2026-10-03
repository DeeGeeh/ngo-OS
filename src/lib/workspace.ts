import { z } from "zod";

export const statusSchema = z.enum(["todo", "doing", "done"]);
export type WorkStatus = z.infer<typeof statusSchema>;
export const workStatuses = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "In progress" },
  { id: "done", label: "Done" },
] satisfies { id: WorkStatus; label: string }[];

export const projectFormatSchema = z.enum(["in-person", "online"]);
export type ProjectFormat = z.infer<typeof projectFormatSchema>;
export const projectFormats = [
  { id: "in-person", label: "In person" },
  { id: "online", label: "Online" },
] satisfies { id: ProjectFormat; label: string }[];
const capacitySchema = z.number().int().min(1).max(10000).nullable();

export const prioritySchema = z.enum(["urgent", "high", "normal", "low"]);
export type Priority = z.infer<typeof prioritySchema>;
export const priorities = [
  { id: "urgent", label: "Urgent" },
  { id: "high", label: "High" },
  { id: "normal", label: "Normal" },
  { id: "low", label: "Low" },
] satisfies { id: Priority; label: string }[];
export const workTags = [
  "Outreach",
  "Venue",
  "Design",
  "Speakers",
  "Volunteers",
  "Campus",
  "Board",
] as const;
const tagSchema = z.enum(workTags);
const tagsSchema = z.array(tagSchema).max(6);
const portraits = {
  diar: "/avatars/diar.svg",
  aino: "/avatars/aino.svg",
  elias: "/avatars/elias.svg",
  noora: "/avatars/noora.svg",
  leo: "/avatars/leo.svg",
} as const;

const idSchema = z.string().min(1).max(100);
const titleSchema = z.string().trim().min(1).max(160);
const assigneesSchema = z.array(idSchema).max(20);
const dueDateSchema = z.iso.date().nullable();

export const memberSchema = z.object({
  id: idSchema,
  name: z.string(),
  role: z.string(),
  skills: z.array(z.string()),
  avatar: z.string().max(200).default(""),
});
export const taskSchema = z.object({
  id: idSchema,
  title: titleSchema,
  description: z.string(),
  status: statusSchema,
  projectId: idSchema.nullable(),
  assigneeIds: assigneesSchema,
  dueDate: dueDateSchema,
  priority: prioritySchema.default("normal"),
  tags: tagsSchema.default([]),
});
export const projectSchema = z.object({
  id: idSchema,
  title: titleSchema,
  description: z.string(),
  status: statusSchema,
  assigneeIds: assigneesSchema,
  dueDate: dueDateSchema,
  location: z.string(),
  capacity: capacitySchema.default(null),
  format: projectFormatSchema.default("in-person"),
});
export const channelSchema = z.discriminatedUnion("kind", [
  z.object({ id: idSchema, name: z.string(), kind: z.literal("general") }),
  z.object({ id: idSchema, name: z.string(), kind: z.literal("project"), projectId: idSchema }),
]);
export const conversationSchema = z.object({
  kind: z.enum(["channel", "task", "direct"]),
  id: idSchema,
});
export const messageSchema = z.object({
  id: idSchema,
  conversation: conversationSchema,
  authorId: idSchema,
  text: z.string(),
  createdAt: z.iso.datetime(),
});
export const workspaceSchema = z.object({
  currentMemberId: idSchema,
  members: z.array(memberSchema),
  tasks: z.array(taskSchema),
  projects: z.array(projectSchema),
  channels: z.array(channelSchema),
  messages: z.array(messageSchema),
});
export const createTaskSchema = taskSchema
  .omit({ id: true })
  .extend({ description: z.string().max(5000) });
export const updateTaskSchema = z.object({
  id: idSchema,
  title: titleSchema.optional(),
  description: z.string().max(5000).optional(),
  status: statusSchema.optional(),
  projectId: idSchema.nullable().optional(),
  assigneeIds: assigneesSchema.optional(),
  dueDate: dueDateSchema.optional(),
  priority: prioritySchema.optional(),
  tags: tagsSchema.optional(),
});
export const createProjectSchema = projectSchema.omit({ id: true }).extend({
  description: z.string().max(5000),
  location: z.string().max(200),
});
export const updateProjectSchema = z.object({
  id: idSchema,
  title: titleSchema.optional(),
  description: z.string().max(5000).optional(),
  status: statusSchema.optional(),
  assigneeIds: assigneesSchema.optional(),
  dueDate: dueDateSchema.optional(),
  location: z.string().max(200).optional(),
  capacity: capacitySchema.optional(),
  format: projectFormatSchema.optional(),
});
export const sendMessageSchema = z.object({
  conversation: conversationSchema,
  text: z.string().trim().min(1).max(4000),
});

export type Member = z.infer<typeof memberSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Channel = z.infer<typeof channelSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type Message = z.infer<typeof messageSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type CreateTask = z.input<typeof createTaskSchema>;
export type WorkTag = (typeof workTags)[number];

export function memberPortrait(member: { id: string; avatar: string }) {
  if (member.avatar) return member.avatar;
  return member.id in portraits ? portraits[member.id as keyof typeof portraits] : "";
}
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type CreateProject = z.input<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type SendMessage = z.infer<typeof sendMessageSchema>;

export const workspaceQueryKey = ["workspace"];
