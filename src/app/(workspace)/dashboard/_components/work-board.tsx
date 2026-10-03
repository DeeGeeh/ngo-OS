"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useCallback, useMemo, useState, type ChangeEvent } from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Column,
  type CardData,
  type ColumnData,
  type ColumnStatus,
  type DragState,
} from "@/components/ui/kanban";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { workspaceQueryKey, type Workspace, type WorkStatus } from "@/lib/workspace";

import { updateProjectAction, updateTaskAction } from "../actions";
import styles from "./work-board.module.css";
import { ProjectCard, TaskCard } from "./work-cards";

const boardColumns = [
  { id: "todo", title: "To do", workStatus: "todo" },
  { id: "in-progress", title: "In progress", workStatus: "doing" },
  { id: "done", title: "Done", workStatus: "done" },
] satisfies { id: ColumnStatus; title: string; workStatus: WorkStatus }[];
const columnStatuses = { todo: "todo", "in-progress": "doing", done: "done" } satisfies Record<
  ColumnStatus,
  WorkStatus
>;

type WorkBoardProps = {
  workspace: Workspace;
  onTask: (id: string) => void;
  onProject: (id: string) => void;
  onCreate: (status?: WorkStatus) => void;
};

export function WorkBoard({ workspace, onTask, onProject, onCreate }: WorkBoardProps) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dragState, setDragState] = useState<DragState>(null);
  const queryClient = useQueryClient();
  const items = useMemo(
    () =>
      [
        ...workspace.projects.map((project) => ({
          ...project,
          id: `project-${project.id}`,
          entityId: project.id,
          kind: "project" as const,
        })),
        ...workspace.tasks.map((task) => ({
          ...task,
          id: `task-${task.id}`,
          entityId: task.id,
          kind: "task" as const,
        })),
      ].filter(
        (item) =>
          (filter !== "mine" || item.assigneeIds.includes(workspace.currentMemberId)) &&
          item.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [workspace, filter, search],
  );
  const columns: ColumnData[] = useMemo(
    () =>
      boardColumns.map((column) => ({
        id: column.id,
        title: column.title,
        status: column.id,
        cards: items
          .filter((item) => item.status === column.workStatus)
          .map((item) => ({ id: item.id, title: item.title, kind: item.kind })),
      })),
    [items],
  );
  const move = useMutation({
    mutationFn: async ({ cardId, status }: { cardId: string; status: WorkStatus }) => {
      const item = items.find((candidate) => candidate.id === cardId);
      if (!item) throw new Error("Work item not found");
      const input = { id: item.entityId, status };
      return item.kind === "project"
        ? await updateProjectAction(input)
        : await updateTaskAction(input);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: workspaceQueryKey }),
  });

  const { mutate: moveCard } = move;
  const drop = useCallback(
    (cardId: string, fromColumn: ColumnStatus, toColumn: ColumnStatus) => {
      setDragState(null);
      if (fromColumn !== toColumn) moveCard({ cardId, status: columnStatuses[toColumn] });
    },
    [moveCard],
  );

  const openCard = useCallback(
    (card: CardData) => {
      const item = items.find((candidate) => candidate.id === card.id);
      if (item?.kind === "project") onProject(item.entityId);
      if (item?.kind === "task") onTask(item.entityId);
    },
    [items, onProject, onTask],
  );

  const renderCard = useCallback(
    (card: CardData) => {
      const item = items.find((candidate) => candidate.id === card.id);
      const task =
        item?.kind === "task"
          ? workspace.tasks.find((entity) => entity.id === item.entityId)
          : undefined;
      const project =
        item?.kind === "project"
          ? workspace.projects.find((entity) => entity.id === item.entityId)
          : undefined;
      return (
        <>
          {task && <TaskCard task={task} workspace={workspace} />}
          {project && <ProjectCard project={project} workspace={workspace} />}
        </>
      );
    },
    [items, workspace],
  );

  const addCard = useCallback(
    (columnId: ColumnStatus) => {
      onCreate(columnStatuses[columnId]);
    },
    [onCreate],
  );
  const selectedFilter = useMemo(() => [filter], [filter]);
  const changeFilter = useCallback((values: string[]) => {
    if (values[0]) setFilter(values[0]);
  }, []);
  const changeSearch = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value),
    [],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ToggleGroup value={selectedFilter} onValueChange={changeFilter} aria-label="Board filter">
          <ToggleGroupItem value="all">All work</ToggleGroupItem>
          <ToggleGroupItem value="mine">Assigned to me</ToggleGroupItem>
        </ToggleGroup>
        <InputGroup className="max-w-64">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            onChange={changeSearch}
            aria-label="Search work"
            placeholder="Search"
          />
        </InputGroup>
      </div>
      {move.error && (
        <Alert variant="destructive">
          <AlertTitle>{move.error.message}</AlertTitle>
        </Alert>
      )}
      <div className={`${styles.viewport} min-h-0 flex-1 overflow-auto`}>
        <div className="grid min-h-full min-w-160 grid-cols-3 gap-6 pt-1 pb-12">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              onDrop={drop}
              dragState={dragState}
              setDragState={setDragState}
              onCardClick={openCard}
              renderCard={renderCard}
              onAddCard={addCard}
              disabled={move.isPending}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
