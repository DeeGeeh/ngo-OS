"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Link2, MessageCircle, Users } from "lucide-react";
import { useCallback, useState, type ChangeEvent } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project, Workspace } from "@/lib/workspace";

import {
  createTelegramProjectInviteLinkAction,
  ensureProjectTelegramGroupAction,
  inviteTelegramProjectMembersAction,
  linkTelegramMemberAction,
  listTelegramProjectMembersAction,
  readTelegramProjectMessagesAction,
  sendTelegramProjectMessageAction,
  getTelegramStatusAction,
} from "../telegram-actions";

const telegramStatusKey = ["telegram-status"];

function formatInviteStatus(status: string) {
  return status === "already_member"
    ? "Already in group"
    : status === "invite_required"
      ? "Needs invite link"
      : status === "added"
        ? "Added"
        : "Could not add";
}

export function TelegramProjectControls({
  project,
  workspace,
}: {
  project: Project;
  workspace: Workspace;
}) {
  const [message, setMessage] = useState("");
  const [memberId, setMemberId] = useState(workspace.currentMemberId);
  const [username, setUsername] = useState("");
  const [sent, setSent] = useState(false);
  const status = useQuery({ queryKey: telegramStatusKey, queryFn: getTelegramStatusAction });
  const canOperate = Boolean(
    status.data?.configured &&
    status.data.authenticationConfigured &&
    status.data.organizerConnected,
  );
  const group = useMutation({ mutationFn: ensureProjectTelegramGroupAction });
  const invite = useMutation({ mutationFn: inviteTelegramProjectMembersAction });
  const link = useMutation({ mutationFn: createTelegramProjectInviteLinkAction });
  const telegramMember = useMutation({ mutationFn: linkTelegramMemberAction });
  const members = useMutation({ mutationFn: listTelegramProjectMembersAction });
  const messages = useMutation({ mutationFn: readTelegramProjectMessagesAction });
  const send = useMutation({
    mutationFn: sendTelegramProjectMessageAction,
    onSuccess: () => {
      setMessage("");
      setSent(true);
    },
    onError: () => setSent(false),
  });
  const error =
    group.error ??
    invite.error ??
    link.error ??
    telegramMember.error ??
    members.error ??
    messages.error ??
    send.error ??
    status.error;
  const createGroup = useCallback(
    () => group.mutate({ projectId: project.id }),
    [group, project.id],
  );
  const inviteAssignees = useCallback(
    () => invite.mutate({ projectId: project.id, memberIds: project.assigneeIds }),
    [invite, project.assigneeIds, project.id],
  );
  const createLink = useCallback(() => link.mutate({ projectId: project.id }), [link, project.id]);
  const sendMessage = useCallback(() => {
    setSent(false);
    send.mutate({ projectId: project.id, text: message });
  }, [message, project.id, send]);
  const changeMessage = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setMessage(event.target.value),
    [],
  );
  const changeUsername = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setUsername(event.target.value),
    [],
  );
  const selectMember = useCallback((value: string | null) => {
    if (value) setMemberId(value);
  }, []);
  const linkMember = useCallback(
    () => telegramMember.mutate({ memberId, username }),
    [memberId, telegramMember, username],
  );
  const readMembers = useCallback(
    () => members.mutate({ projectId: project.id }),
    [members, project.id],
  );
  const readMessages = useCallback(
    () => messages.mutate({ projectId: project.id }),
    [messages, project.id],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <MessageCircle className="size-5" />
            Telegram coordination
          </span>
        </CardTitle>
        <CardDescription>
          Create the project group, invite linked assignees, or send a message.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Telegram action failed</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={createGroup} disabled={!canOperate || group.isPending}>
              {group.isPending ? "Creating..." : "Create project group"}
            </Button>
            <Button
              variant="outline"
              onClick={inviteAssignees}
              disabled={!canOperate || invite.isPending || project.assigneeIds.length === 0}
            >
              <Users data-icon="inline-start" />
              {invite.isPending ? "Inviting..." : "Invite assignees"}
            </Button>
            <Button variant="outline" onClick={createLink} disabled={!canOperate || link.isPending}>
              <Link2 data-icon="inline-start" />
              {link.isPending ? "Creating link..." : "Create invite link"}
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`telegram-member-${project.id}`}>Link a project member</Label>
            <div className="flex flex-wrap gap-2">
              <Select value={memberId} onValueChange={selectMember}>
                <SelectTrigger id={`telegram-member-${project.id}`} className="min-w-40">
                  <SelectValue>
                    {workspace.members.find((member) => member.id === memberId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {workspace.members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={username}
                onChange={changeUsername}
                placeholder="@username"
                aria-label="Telegram username"
              />
              <Button
                variant="outline"
                onClick={linkMember}
                disabled={!canOperate || telegramMember.isPending || !username.trim()}
              >
                {telegramMember.isPending ? "Linking..." : "Link member"}
              </Button>
            </div>
            {telegramMember.data && (
              <p className="text-sm text-muted-foreground">
                Linked{" "}
                {telegramMember.data.displayName ??
                  telegramMember.data.telegramUsername ??
                  telegramMember.data.telegramUserId}
                .
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={readMembers}
              disabled={!canOperate || members.isPending}
            >
              {members.isPending ? "Reading members..." : "Read members"}
            </Button>
            <Button
              variant="outline"
              onClick={readMessages}
              disabled={!canOperate || messages.isPending}
            >
              {messages.isPending ? "Reading messages..." : "Read recent messages"}
            </Button>
          </div>
          {members.data && (
            <div className="flex flex-col gap-1 text-sm">
              {members.data.map((member) => (
                <span key={member.id}>
                  {member.name}
                  {member.username ? ` · @${member.username}` : ""}
                </span>
              ))}
            </div>
          )}
          {messages.data && (
            <div className="flex flex-col gap-2 text-sm">
              {messages.data.slice(0, 5).map((item) => (
                <p key={item.id}>
                  <strong>{item.senderName ?? "Telegram user"}</strong> · {item.text}
                </p>
              ))}
            </div>
          )}
          {group.data && (
            <p className="text-sm text-muted-foreground">Group ready as {group.data.title}.</p>
          )}
          {link.data && (
            <p className="text-sm break-all text-muted-foreground">
              Invite link:{" "}
              <a className="underline" href={link.data.link} target="_blank" rel="noreferrer">
                Open invite link
              </a>
            </p>
          )}
          {invite.data && (
            <div className="flex flex-col gap-1 text-sm">
              {invite.data.map((outcome) => {
                const member = workspace.members.find((item) => item.id === outcome.memberId);
                return (
                  <span key={outcome.memberId}>
                    {member?.name ?? outcome.memberId}: {formatInviteStatus(outcome.status)}
                    {outcome.reason ? ` · ${outcome.reason}` : ""}
                    {"inviteLink" in outcome && outcome.inviteLink && (
                      <>
                        {" · "}
                        <a
                          className="underline"
                          href={outcome.inviteLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open invite link
                        </a>
                      </>
                    )}
                  </span>
                );
              })}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor={`telegram-message-${project.id}`}>Project group message</Label>
            <div className="flex gap-2">
              <Input
                id={`telegram-message-${project.id}`}
                value={message}
                onChange={changeMessage}
                placeholder="Share an update with the project group"
                maxLength={4000}
              />
              <Button
                onClick={sendMessage}
                disabled={!canOperate || send.isPending || !message.trim()}
              >
                Send
              </Button>
            </div>
            {sent && <p className="text-sm text-muted-foreground">Message sent.</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
