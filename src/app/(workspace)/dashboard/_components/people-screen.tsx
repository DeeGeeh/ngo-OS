"use client";

import { CircleCheck, ListTodo } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Member, Workspace } from "@/lib/workspace";

import { MemberAvatar } from "./work-cards";

function PersonCard({ member, workspace }: { member: Member; workspace: Workspace }) {
  const assigned = workspace.tasks.filter((task) => task.assigneeIds.includes(member.id));
  const done = assigned.filter((task) => task.status === "done").length;
  const open = assigned.length - done;
  const percent = assigned.length === 0 ? 0 : Math.round((done / assigned.length) * 100);
  const isCurrent = member.id === workspace.currentMemberId;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <MemberAvatar member={member} size="lg" />
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-2 truncate font-medium">
              {member.name}
              {isCurrent && (
                <Badge variant="secondary" className="shrink-0">
                  You
                </Badge>
              )}
            </span>
            <span className="truncate text-sm text-muted-foreground">{member.role}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            {member.skills.map((skill) => (
              <Badge key={skill} variant="outline">
                {skill}
              </Badge>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ListTodo className="size-3.5" />
                {open} open
              </span>
              <span className="flex items-center gap-1">
                <CircleCheck className="size-3.5" />
                {done} done
              </span>
            </div>
            <Progress value={percent} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PeopleSection({
  title,
  description,
  members,
  workspace,
}: {
  title: string;
  description: string;
  members: Member[];
  workspace: Workspace;
}) {
  if (members.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">
          {title} <span className="text-muted-foreground">{members.length}</span>
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <PersonCard key={member.id} member={member} workspace={workspace} />
        ))}
      </div>
    </section>
  );
}

export function PeopleScreen({ workspace }: { workspace: Workspace }) {
  const team = useMemo(
    () => workspace.members.filter((member) => member.role !== "Volunteer"),
    [workspace.members],
  );
  const volunteers = useMemo(
    () => workspace.members.filter((member) => member.role === "Volunteer"),
    [workspace.members],
  );
  return (
    <div className="flex flex-col gap-10 p-6 lg:p-8">
      <PeopleSection
        title="Team"
        description="The board and the people leading projects."
        members={team}
        workspace={workspace}
      />
      <PeopleSection
        title="Volunteers"
        description="People helping out across events and projects."
        members={volunteers}
        workspace={workspace}
      />
    </div>
  );
}
