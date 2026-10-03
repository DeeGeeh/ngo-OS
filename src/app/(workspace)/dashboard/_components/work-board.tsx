"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Flag, Folder, LayoutDashboard, Plus, Search } from "lucide-react";
import { useCallback, useMemo, useState, type ChangeEvent } from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Column,
  type CardData,
  type ColumnData,
  type ColumnStatus,
  type DragState,
} from "@/components/ui/kanban";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  priorities,
  priorityMeta,
  workspaceQueryKey,
  type Priority,
  type Workspace,
  type WorkStatus,
} from "@/lib/workspace";

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

type CreateWork = (status: WorkStatus, kind: "task" | "project") => void;
type BoardItem = { kind: "task" | "project"; dueDate: string | null; priority?: Priority };

function sortRank(item: BoardItem) {
  return item.priority ? priorityMeta[item.priority].rank : -1;
}

const priorityFilterItems = [
  { value: "any", label: "Any priority" },
  ...priorities.map((priority) => ({ value: priority.id, label: priority.label })),
];

export function CreateWorkMenu({
  status = "todo",
  onCreate,
  appearance = "icon",
  label,
}: {
  status?: WorkStatus;
  onCreate: CreateWork;
  appearance?: "icon" | "labeled";
  label: string;
}) {
  const addTask = useCallback(() => onCreate(status, "task"), [onCreate, status]);
  const addProject = useCallback(() => onCreate(status, "project"), [onCreate, status]);
  const trigger =
    appearance === "labeled" ? (
      <DropdownMenuTrigger variant="default" aria-label={label}>
        <Plus data-icon="inline-start" />
        <span className="hidden sm:inline">New</span>
      </DropdownMenuTrigger>
    ) : (
      <DropdownMenuTrigger variant="ghost" size="icon" aria-label={label}>
        <Plus />
      </DropdownMenuTrigger>
    );
  return (
    <DropdownMenu>
      {trigger}
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={addTask}>
            <LayoutDashboard />
            Task
          </DropdownMenuItem>
          <DropdownMenuItem onClick={addProject}>
            <Folder />
            Project
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type WorkBoardProps = {
  workspace: Workspace;
  onTask: (id: string) => void;
  onProject: (id: string) => void;
  onCreate: CreateWork;
};

export function WorkBoard({ workspace, onTask, onProject, onCreate }: WorkBoardProps) {
  const [filter, setFilter] = useState("all");
  const [priority, setPriority] = useState<Priority | "any">("any");
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
          (priority === "any" || ("priority" in item && item.priority === priority)) &&
          item.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [workspace, filter, search, priority],
  );
  const columns: ColumnData[] = useMemo(
    () =>
      boardColumns.map((column) => ({
        id: column.id,
        title: column.title,
        status: column.id,
        cards: items
          .filter((item) => item.status === column.workStatus)
          .toSorted((left, right) => {
            if (left.kind !== right.kind) return left.kind === "project" ? -1 : 1;
            const byPriority = sortRank(left) - sortRank(right);
            if (byPriority !== 0) return byPriority;
            return (left.dueDate ?? "9999").localeCompare(right.dueDate ?? "9999");
          })
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

  const renderAdd = useCallback(
    (columnId: ColumnStatus) => (
      <CreateWorkMenu
        status={columnStatuses[columnId]}
        onCreate={onCreate}
        label={`Add to ${boardColumns.find((column) => column.id === columnId)?.title ?? "column"}`}
      />
    ),
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
  const changePriority = useCallback((value: Priority | "any" | null) => {
    if (value) setPriority(value);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ToggleGroup value={selectedFilter} onValueChange={changeFilter} aria-label="Board filter">
          <ToggleGroupItem value="all">All work</ToggleGroupItem>
          <ToggleGroupItem value="mine">Assigned to me</ToggleGroupItem>
        </ToggleGroup>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
          <Select items={priorityFilterItems} value={priority} onValueChange={changePriority}>
            <SelectTrigger className="w-44" aria-label="Filter by priority">
              <Flag data-icon="inline-start" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {priorityFilterItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <InputGroup className="w-64">
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
              renderAdd={renderAdd}
              disabled={move.isPending}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
