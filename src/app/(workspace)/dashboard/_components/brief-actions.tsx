"use client";

import { useAui, useAuiState } from "@assistant-ui/react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskItem } from "@/components/ui/task-list";
import type { DailyBrief } from "@/lib/brief";

export function BriefActions({ brief }: { brief: DailyBrief }) {
  const aui = useAui();
  const router = useRouter();
  const running = useAuiState((state) => state.thread.isRunning);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handle = useCallback(
    async (index?: number) => {
      const actions =
        index === undefined
          ? brief.actions.filter((action) => action.canHandle)
          : brief.actions.slice(index, index + 1);
      if (actions.length === 0) return;
      setStarting(true);
      setError(null);
      try {
        const { remoteId } = await aui.threadListItem.initialize();
        aui.thread.append({
          role: "user",
          content: [
            {
              type: "text",
              text: `Handle these actions from today's brief (${brief.date}):\n${actions.map((action) => action.instruction).join("\n")}\nRead current workspace context first. Only create or update board tasks/projects explicitly requested above. Avoid duplicates and don't guess uncertain event/project matches. Ask if clarification is necessary. Do not send messages, invite people, or change external services. Confirm actual tool results briefly.`,
            },
          ],
        });
        router.push(`/dashboard?view=agent&thread=${encodeURIComponent(remoteId)}`);
      } catch {
        setError("The agent could not start. Try again.");
      } finally {
        setStarting(false);
      }
    },
    [aui, brief, router],
  );
  const handleAll = useCallback(() => {
    void handle();
  }, [handle]);
  const canHandle = brief.actions.some((action) => action.canHandle);
  return (
    <div className="grid gap-2">
      <p className="text-xs font-medium text-muted-foreground">Action items</p>
      <ul className="grid gap-1">
        {brief.actions.map((action, index) => (
          <li key={action.title}>
            {action.canHandle ? (
              <AgentAction
                title={action.title}
                index={index}
                onHandle={handle}
                disabled={starting || running}
              />
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">{action.title}</p>
            )}
          </li>
        ))}
      </ul>
      {canHandle && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAll}
          disabled={starting || running}
        >
          {starting ? "Opening agent…" : "Handle with agent"}
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function AgentAction({
  title,
  index,
  onHandle,
  disabled,
}: {
  title: string;
  index: number;
  onHandle: (index: number) => Promise<void>;
  disabled: boolean;
}) {
  const handle = useCallback(() => {
    void onHandle(index);
  }, [index, onHandle]);
  return (
    <TaskItem
      label={title}
      size="sm"
      checked={false}
      onCheckedChange={handle}
      disabled={disabled}
      aria-label={`Ask agent to ${title}`}
    />
  );
}
