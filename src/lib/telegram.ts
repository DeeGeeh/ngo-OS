import { z } from "zod";

const memberIdSchema = z.string().min(1).max(100);
const projectIdSchema = z.string().min(1).max(100);

export const telegramLoginStartSchema = z.object({
  phoneNumber: z.string().trim().min(5).max(32),
});

export const telegramLoginCompleteSchema = z.object({
  code: z.string().trim().max(12).optional(),
  password: z.string().max(256).optional(),
});

export const telegramLinkMemberSchema = z.object({
  memberId: memberIdSchema,
  username: z.string().trim().min(1).max(64).optional(),
  phoneNumber: z.string().trim().min(5).max(32).optional(),
});

export const telegramProjectSchema = z.object({
  projectId: projectIdSchema,
});

export const telegramInviteMembersSchema = z.object({
  projectId: projectIdSchema,
  memberIds: z
    .array(memberIdSchema)
    .min(1)
    .max(50)
    .transform((ids) => [...new Set(ids)]),
});

export const telegramSendMessageSchema = z.object({
  projectId: projectIdSchema,
  text: z.string().trim().min(1).max(4000),
});

export type TelegramLoginStart = z.infer<typeof telegramLoginStartSchema>;
export type TelegramLoginComplete = z.infer<typeof telegramLoginCompleteSchema>;
export type TelegramLinkMember = z.infer<typeof telegramLinkMemberSchema>;
export type TelegramProject = z.infer<typeof telegramProjectSchema>;
export type TelegramInviteMembers = z.infer<typeof telegramInviteMembersSchema>;
export type TelegramSendMessage = z.infer<typeof telegramSendMessageSchema>;

export type TelegramConnectionStatus = {
  configured: boolean;
  authenticationConfigured: boolean;
  organizerConnected: boolean;
  organizerUsername: string | null;
  mainGroupConfigured: boolean;
  loginPending: boolean;
  loginPhase: "idle" | "code" | "password";
};

export type TelegramInviteOutcome = {
  memberId: string;
  status: "added" | "already_member" | "invite_required" | "failed";
  reason?: string;
  inviteLink?: string;
};

export type TelegramProjectMember = {
  id: string;
  name: string;
  username: string | null;
};

export type TelegramProjectMessage = {
  id: string;
  senderId: string | null;
  senderName: string | null;
  text: string;
  createdAt: string;
};
