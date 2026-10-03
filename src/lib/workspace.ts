import { z } from "zod";

export const statusSchema = z.enum(["todo", "doing", "done"]);
export type WorkStatus = z.infer<typeof statusSchema>;
export const workStatuses = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "In progress" },
  { id: "done", label: "Done" },
] satisfies { id: WorkStatus; label: string }[];

const idSchema = z.string().min(1).max(100);
const titleSchema = z.string().trim().min(1).max(160);
const assigneesSchema = z.array(idSchema).max(20);
const dueDateSchema = z.iso.date().nullable();

export const memberSchema = z.object({
  id: idSchema,
  name: z.string(),
  role: z.string(),
  skills: z.array(z.string()),
});
export const taskSchema = z.object({
  id: idSchema,
  title: titleSchema,
  description: z.string(),
  status: statusSchema,
  projectId: idSchema.nullable(),
  assigneeIds: assigneesSchema,
  dueDate: dueDateSchema,
});
export const projectSchema = z.object({
  id: idSchema,
  title: titleSchema,
  description: z.string(),
  status: statusSchema,
  assigneeIds: assigneesSchema,
  dueDate: dueDateSchema,
  location: z.string(),
});
export const channelSchema = z.discriminatedUnion("kind", [
  z.object({ id: idSchema, name: z.string(), kind: z.literal("general") }),
  z.object({ id: idSchema, name: z.string(), kind: z.literal("project"), projectId: idSchema }),
]);
export const conversationSchema = z.object({
  kind: z.enum(["channel", "task"]),
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
export const updateTaskSchema = createTaskSchema.partial().extend({ id: idSchema });
export const createProjectSchema = projectSchema
  .omit({ id: true })
  .extend({ description: z.string().max(5000), location: z.string().max(200) });
export const updateProjectSchema = createProjectSchema.partial().extend({ id: idSchema });
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
export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type SendMessage = z.infer<typeof sendMessageSchema>;

export const workspaceQueryKey = ["workspace"];
