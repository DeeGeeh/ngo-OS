"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
  CalendarDays,
  Folder,
  LayoutDashboard,
  MessageSquare,
  Moon,
  PanelRight,
  Ticket,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { useCallback, useMemo, useState } from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { lumaCalendarItems, type CalendarItem } from "@/lib/calendar";
import { lumaQueryKey, type LumaCalendar } from "@/lib/luma";
import { cn } from "@/lib/utils";
import { workspaceQueryKey, type Workspace, type WorkStatus } from "@/lib/workspace";

import { getLumaCalendarAction, getWorkspaceAction } from "../actions";
import { AssistantPanel, AssistantProvider } from "./assistant-panel";
import { CalendarScreen } from "./calendar-screen";
import { EventsScreen } from "./events-screen";
import { ProjectDetail } from "./project-detail";
import { CreateWorkMenu, WorkBoard } from "./work-board";
import { TaskDetail } from "./task-detail";
import { MemberAvatar } from "./work-cards";
import { WorkEditor } from "./work-editor";
import { WorkspaceChat } from "./workspace-chat";

type View =
  | { kind: "board" }
  | { kind: "project"; id: string }
  | { kind: "chat" }
  | { kind: "people" }
  | { kind: "calendar" }
  | { kind: "events" };
const screenTitles = {
  board: "Workspace",
  chat: "Chat",
  people: "People",
  calendar: "Calendar",
  events: "Events",
} as const;
type Creation = { kind: "task" | "project"; status: WorkStatus; projectId?: string };
const initialView: View = { kind: "board" };
const enter = { opacity: 0 };
const visible = { opacity: 1 };

export function WorkspaceApp({
  initialWorkspace,
  googleEvents,
  initialLuma,
}: {
  initialWorkspace: Workspace;
  googleEvents: CalendarItem[];
  initialLuma: LumaCalendar;
}) {
  const { data: workspace, error } = useQuery({
    queryKey: workspaceQueryKey,
    queryFn: getWorkspaceAction,
    initialData: initialWorkspace,
  });
  const { data: luma } = useQuery({
    queryKey: lumaQueryKey,
    queryFn: getLumaCalendarAction,
    initialData: initialLuma,
  });
  const lumaItems = useMemo(() => lumaCalendarItems(luma.events), [luma.events]);
  const [view, setView] = useState<View>(initialView);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [creation, setCreation] = useState<Creation | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const isMobile = useIsMobile();
  const { resolvedTheme, setTheme } = useTheme();
  const task = workspace.tasks.find((item) => item.id === taskId);
  const project =
    view.kind === "project" ? workspace.projects.find((item) => item.id === view.id) : undefined;
  const currentMember = workspace.members.find((member) => member.id === workspace.currentMemberId);
  const screen = view.kind === "project" ? "board" : view.kind;
  const title = screenTitles[screen];

  const openTask = useCallback((id: string) => setTaskId(id), []);
  const openProject = useCallback((id: string) => setView({ kind: "project", id }), []);
  const create = useCallback((status: WorkStatus, kind: "task" | "project") => {
    setCreation({ kind, status });
  }, []);
  const createProjectTask = useCallback(
    (id: string) => setCreation({ kind: "task", status: "todo", projectId: id }),
    [],
  );
  const closeCreation = useCallback(() => setCreation(null), []);
  const returnToBoard = useCallback(() => setView(initialView), []);
  const taskOpenChanged = useCallback((open: boolean) => {
    if (!open) setTaskId(null);
  }, []);
  const creationOpenChanged = useCallback((open: boolean) => {
    if (!open) setCreation(null);
  }, []);
  const switchScreen = useCallback((values: string[]) => {
    const value = values[0];
    if (
      value === "board" ||
      value === "chat" ||
      value === "people" ||
      value === "calendar" ||
      value === "events"
    ) {
      setView({ kind: value });
    }
  }, []);
  const switchCreationKind = useCallback(
    (values: string[]) => {
      const value = values[0];
      if (creation && (value === "task" || value === "project"))
        setCreation({ ...creation, kind: value });
    },
    [creation],
  );
  const toggleTheme = useCallback(
    () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
    [resolvedTheme, setTheme],
  );
  const toggleAssistant = useCallback(() => setAssistantOpen((open) => !open), []);
  const selectedScreen = useMemo(() => [screen], [screen]);
  const selectedKind = useMemo(() => (creation ? [creation.kind] : []), [creation]);

  return (
    <AssistantProvider>
      <Sidebar animate={false}>
        <div className="flex h-dvh flex-col overflow-hidden bg-background md:flex-row">
          <div className="shrink-0 md:border-r">
            <SidebarBody className="md:w-48!">
              <div className="flex h-full flex-col gap-8">
                <div className="flex items-center gap-2 px-2 pt-3">
                  <Image
                    src="/brand/svg/nest-mark-blue.svg"
                    alt=""
                    width={512}
                    height={355}
                    unoptimized
                    className="h-8 w-auto dark:hidden"
                  />
                  <Image
                    src="/brand/svg/nest-mark-white.svg"
                    alt=""
                    width={512}
                    height={355}
                    unoptimized
                    className="hidden h-8 w-auto dark:block"
                  />
                  <div className="text-2xl font-bold tracking-tighter">
                    TRES<span className="text-primary">.</span>
                  </div>
                </div>
                <nav aria-label="Main navigation">
                  <ToggleGroup
                    orientation="vertical"
                    value={selectedScreen}
                    onValueChange={switchScreen}
                    className="w-full"
                  >
                    <ToggleGroupItem value="board" className="justify-start">
                      <LayoutDashboard data-icon="inline-start" />
                      Board
                    </ToggleGroupItem>
                    <ToggleGroupItem value="chat" className="justify-start">
                      <MessageSquare data-icon="inline-start" />
                      Chat
                    </ToggleGroupItem>
                    <ToggleGroupItem value="people" className="justify-start">
                      <Users data-icon="inline-start" />
                      People
                    </ToggleGroupItem>
                    <ToggleGroupItem value="calendar" className="justify-start">
                      <CalendarDays data-icon="inline-start" />
                      Calendar
                    </ToggleGroupItem>
                    <ToggleGroupItem value="events" className="justify-start">
                      <Ticket data-icon="inline-start" />
                      Events
                    </ToggleGroupItem>
                  </ToggleGroup>
                </nav>
                <div className="mt-auto flex items-center gap-3 px-2 pb-3">
                  {currentMember && <MemberAvatar member={currentMember} size="default" />}
                  <span className="truncate text-sm font-medium">
                    {currentMember?.name ?? "TRES"}
                  </span>
                </div>
              </div>
            </SidebarBody>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <header className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-5 lg:px-8">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle color theme"
                  onClick={toggleTheme}
                >
                  <Moon />
                </Button>
                <Button
                  variant={assistantOpen ? "secondary" : "ghost"}
                  size="icon"
                  aria-label={assistantOpen ? "Hide assistant" : "Show assistant"}
                  aria-pressed={assistantOpen}
                  onClick={toggleAssistant}
                >
                  <PanelRight />
                </Button>
                <CreateWorkMenu
                  onCreate={create}
                  appearance="labeled"
                  label="New task or project"
                />
              </div>
            </header>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>{error.message}</AlertTitle>
              </Alert>
            )}
            <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
              <ResizablePanel id="workspace" defaultSize="72%" minSize="35%">
                <motion.main
                  key={view.kind === "project" ? view.id : view.kind}
                  initial={enter}
                  animate={visible}
                  className={cn(
                    "h-full",
                    view.kind === "calendar" ? "overflow-hidden" : "overflow-auto",
                  )}
                >
                  {view.kind === "board" && (
                    <WorkBoard
                      workspace={workspace}
                      onTask={openTask}
                      onProject={openProject}
                      onCreate={create}
                    />
                  )}
                  {project && (
                    <ProjectDetail
                      project={project}
                      workspace={workspace}
                      onBack={returnToBoard}
                      onTask={openTask}
                      onNewTask={createProjectTask}
                    />
                  )}
                  {view.kind === "chat" && <WorkspaceChat workspace={workspace} />}
                  {view.kind === "calendar" && (
                    <CalendarScreen
                      workspace={workspace}
                      googleEvents={googleEvents}
                      lumaEvents={lumaItems}
                    />
                  )}
                  {view.kind === "events" && <EventsScreen calendar={luma} />}
                  {view.kind === "people" && (
                    <div className="grid gap-5 p-6 sm:grid-cols-2 lg:p-8 xl:grid-cols-3">
                      {workspace.members.map((member) => (
                        <Card key={member.id}>
                          <CardHeader>
                            <div className="mb-2">
                              <MemberAvatar member={member} size="lg" />
                            </div>
                            <CardTitle>{member.name}</CardTitle>
                            <CardDescription>{member.role}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-wrap gap-2">
                                {member.skills.map((skill) => (
                                  <Badge key={skill} variant="outline">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {
                                  workspace.tasks.filter(
                                    (item) =>
                                      item.assigneeIds.includes(member.id) &&
                                      item.status !== "done",
                                  ).length
                                }{" "}
                                open tasks
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </motion.main>
              </ResizablePanel>
              {assistantOpen && !isMobile && (
                <>
                  <ResizableHandle withHandle />
                  <ResizablePanel id="assistant" defaultSize="28%" minSize="280px" maxSize="50%">
                    <aside className="h-full">
                      <AssistantPanel />
                    </aside>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </div>
        </div>
        <Sheet open={isMobile && assistantOpen} onOpenChange={setAssistantOpen}>
          <SheetContent side="right" className="w-full!" showCloseButton={false}>
            <SheetHeader className="sr-only">
              <SheetTitle>Assistant</SheetTitle>
            </SheetHeader>
            <AssistantPanel onClose={toggleAssistant} />
          </SheetContent>
        </Sheet>
        <Dialog open={Boolean(task)} onOpenChange={taskOpenChanged}>
          <DialogContent className="max-h-dvh overflow-hidden sm:max-w-5xl">
            <div className="sr-only">
              <DialogHeader>
                <DialogTitle>{task?.title ?? "Task"}</DialogTitle>
              </DialogHeader>
            </div>
            {task && <TaskDetail key={task.id} task={task} workspace={workspace} />}
          </DialogContent>
        </Dialog>
        <Dialog open={Boolean(creation)} onOpenChange={creationOpenChanged}>
          <DialogContent
            className={cn(
              "max-h-dvh overflow-y-auto",
              creation?.kind === "project" ? "sm:max-w-3xl" : "sm:max-w-lg",
            )}
          >
            <DialogHeader>
              <DialogTitle>New {creation?.kind === "project" ? "project" : "task"}</DialogTitle>
            </DialogHeader>
            {creation && (
              <>
                <ToggleGroup
                  value={selectedKind}
                  onValueChange={switchCreationKind}
                  aria-label="Work type"
                >
                  <ToggleGroupItem value="task">
                    <LayoutDashboard data-icon="inline-start" />
                    Task
                  </ToggleGroupItem>
                  <ToggleGroupItem value="project">
                    <Folder data-icon="inline-start" />
                    Project
                  </ToggleGroupItem>
                </ToggleGroup>
                {creation.kind === "task" ? (
                  <WorkEditor
                    key="task"
                    kind="task"
                    status={creation.status}
                    workspace={workspace}
                    projectId={creation.projectId}
                    onSaved={closeCreation}
                  />
                ) : (
                  <WorkEditor
                    key="project"
                    kind="project"
                    status={creation.status}
                    workspace={workspace}
                    onSaved={closeCreation}
                  />
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </Sidebar>
    </AssistantProvider>
  );
}
