"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useCallback, useState, type FormEvent } from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import {
  userSettingsSchema,
  workspaceQueryKey,
  type UserSettings,
  type Workspace,
} from "@/lib/workspace";

import { updateUserSettingsAction } from "../actions";

function MockConnection({ provider }: { provider: "Claude" | "ChatGPT" }) {
  const [connected, setConnected] = useState(false);
  const toggle = useCallback(() => setConnected((value) => !value), []);

  return (
    <Button type="button" variant="outline" size="sm" onClick={toggle} aria-pressed={connected}>
      <span data-icon="inline-start" aria-hidden="true">
        {provider === "Claude" ? (
          <Image src="/brands/claude.svg" alt="" width={16} height={16} />
        ) : (
          <>
            <Image
              src="/brands/chatgpt.svg"
              alt=""
              width={16}
              height={16}
              className="dark:hidden"
            />
            <Image
              src="/brands/chatgpt-white.svg"
              alt=""
              width={16}
              height={16}
              className="hidden dark:block"
            />
          </>
        )}
      </span>
      {connected ? `Disconnect ${provider}` : `Connect ${provider}`}
    </Button>
  );
}

export function UserSettingsForm({ settings }: { settings: UserSettings }) {
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: (form: FormData) =>
      updateUserSettingsAction(userSettingsSchema.parse(Object.fromEntries(form))),
    onSuccess: (savedMember) => {
      queryClient.setQueryData<Workspace>(
        workspaceQueryKey,
        (workspace) =>
          workspace && {
            ...workspace,
            members: workspace.members.map((member) =>
              member.id === savedMember.id ? savedMember : member,
            ),
          },
      );
    },
  });
  const { mutate } = save;
  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      mutate(new FormData(event.currentTarget));
    },
    [mutate],
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <FieldGroup>
        <FieldGroup className="flex-row">
          <Field>
            <FieldLabel htmlFor="settings-first-name">First name</FieldLabel>
            <Input
              id="settings-first-name"
              name="firstName"
              autoComplete="given-name"
              defaultValue={settings.firstName}
              required
              maxLength={100}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="settings-last-name">Last name</FieldLabel>
            <Input
              id="settings-last-name"
              name="lastName"
              autoComplete="family-name"
              defaultValue={settings.lastName}
              maxLength={100}
            />
          </Field>
        </FieldGroup>
        <Field>
          <FieldLabel htmlFor="settings-email">Email</FieldLabel>
          <Input
            id="settings-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={settings.email}
            maxLength={254}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="settings-telegram">Telegram handle</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="settings-telegram"
              name="telegramHandle"
              placeholder="@..."
              defaultValue={settings.telegramHandle}
              maxLength={33}
              pattern="@[a-zA-Z][a-zA-Z0-9_]{4,31}"
              title="Enter a Telegram handle like @username."
              autoCapitalize="none"
              spellCheck={false}
            />
            <InputGroupAddon>
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className="text-primary"
              >
                <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.9 7.7-2 9.4c-.2.7-.6.9-1.2.6l-3-2.3-1.4 1.3c-.2.2-.4.4-.8.4l.3-3.1 5.7-5.2c.3-.2-.1-.4-.5-.2L8 13.1l-3-1c-.7-.2-.7-.7.2-1l11.9-4.6c.6-.2 1 .2.8 1.2Z" />
              </svg>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </FieldGroup>
      <Separator />
      <FieldSet>
        <FieldLegend variant="label">AI connections</FieldLegend>
        <div className="flex justify-center gap-3">
          <MockConnection provider="Claude" />
          <MockConnection provider="ChatGPT" />
        </div>
      </FieldSet>
      {save.error && (
        <Alert variant="destructive">
          <AlertTitle>Could not save settings. Please check your details and try again.</AlertTitle>
        </Alert>
      )}
      <Field orientation="horizontal" className="justify-end">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving..." : "Save changes"}
        </Button>
      </Field>
    </form>
  );
}
