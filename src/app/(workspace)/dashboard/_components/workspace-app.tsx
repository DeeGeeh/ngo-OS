"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Folder,
  LayoutDashboard,
  MessageSquare,
  Moon,
  PanelRight,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import type { AssistantThread } from "@/lib/assistant";
import { workspaceQueryKey, type Workspace, type WorkStatus } from "@/lib/workspace";

import { getWorkspaceAction } from "../actions";
import { AgentPage } from "./agent-page";
import { AssistantPanel } from "./assistant-panel";
import { AssistantProvider } from "./assistant-runtime";
import { Conversation } from "./conversation";
import { ProjectDetail } from "./project-detail";
import { WorkBoard } from "./work-board";
import { WorkEditor } from "./work-editor";
import { WorkspaceChat } from "./workspace-chat";

type View =
  | { kind: "board" }
  | { kind: "project"; id: string }
  | { kind: "chat" }
  | { kind: "people" }
  | { kind: "agent" };
type Creation = { kind: "task" | "project"; status: WorkStatus; projectId?: string };
const boardView: View = { kind: "board" };
const chatView: View = { kind: "chat" };
const peopleView: View = { kind: "people" };
const agentView: View = { kind: "agent" };
const enter = { opacity: 0 };
const visible = { opacity: 1 };

export function WorkspaceApp({
  initialWorkspace,
  initialThreads,
}: {
  initialWorkspace: Workspace;
  initialThreads: AssistantThread[];
}) {
  const { data: workspace, error } = useQuery({
    queryKey: workspaceQueryKey,
    queryFn: getWorkspaceAction,
    initialData: initialWorkspace,
  });
  const [workspaceView, setView] = useState<View>(boardView);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const screenName = searchParams.get("view");
  const view =
    screenName === "agent"
      ? agentView
      : screenName === "chat"
        ? chatView
        : screenName === "people"
          ? peopleView
          : workspaceView;
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
  const title =
    screen === "board"
      ? "Workspace"
      : screen === "chat"
        ? "Chat"
        : screen === "agent"
          ? "Agent"
          : "People";
  const conversation = useMemo(
    () => (task ? { kind: "task" as const, id: task.id } : undefined),
    [task],
  );

  const openTask = useCallback((id: string) => setTaskId(id), []);
  const openProject = useCallback((id: string) => setView({ kind: "project", id }), []);
  const create = useCallback(
    (status: WorkStatus = "todo") => setCreation({ kind: "task", status }),
    [],
  );
  const createProjectTask = useCallback(
    (id: string) => setCreation({ kind: "task", status: "todo", projectId: id }),
    [],
  );
  const closeCreation = useCallback(() => setCreation(null), []);
  const returnToBoard = useCallback(() => setView(boardView), []);
  const closeTask = useCallback(() => setTaskId(null), []);
  const taskOpenChanged = useCallback((open: boolean) => {
    if (!open) setTaskId(null);
  }, []);
  const creationOpenChanged = useCallback((open: boolean) => {
    if (!open) setCreation(null);
  }, []);
  const switchScreen = useCallback(
    (values: string[]) => {
      const value = values[0];
      if (value === "board" || value === "chat" || value === "people" || value === "agent") {
        setView(boardView);
        const params = new URLSearchParams(searchParams.toString());
        params.set("view", value);
        window.history.pushState(null, "", `${pathname}?${params.toString()}`);
      }
    },
    [pathname, searchParams],
  );
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
  const createNew = useCallback(() => create(), [create]);
  const selectedScreen = useMemo(() => [screen], [screen]);
  const selectedKind = useMemo(() => (creation ? [creation.kind] : []), [creation]);

  return (
    <AssistantProvider initialThreads={initialThreads}>
      <Sidebar animate={false}>
        <div className="flex h-dvh flex-col overflow-hidden bg-background md:flex-row">
          <div className="shrink-0 md:border-r">
            <SidebarBody className="md:w-48!">
              <div className="flex h-full flex-col gap-8">
                <div className="px-2 pt-3 text-3xl font-bold tracking-tighter">
                  TRES<span className="text-primary">.</span>
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
                    <ToggleGroupItem value="agent" className="justify-start">
                      <Sparkles data-icon="inline-start" />
                      Agent
                    </ToggleGroupItem>
                  </ToggleGroup>
                </nav>
                <div className="mt-auto flex items-center gap-3 px-2 pb-3">
                  <Avatar>
                    <AvatarFallback>{currentMember?.name.slice(0, 1) ?? "T"}</AvatarFallback>
                  </Avatar>
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
                {screen !== "agent" && (
                  <Button
                    variant={assistantOpen ? "secondary" : "ghost"}
                    size="icon"
                    aria-label={assistantOpen ? "Hide assistant" : "Show assistant"}
                    aria-pressed={assistantOpen}
                    onClick={toggleAssistant}
                  >
                    <PanelRight />
                  </Button>
                )}
                {screen !== "agent" && (
                  <Button onClick={createNew} aria-label="New task or project">
                    <Plus data-icon="inline-start" />
                    <span className="hidden sm:inline">New</span>
                  </Button>
                )}
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
                  className="h-full overflow-auto"
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
                  {view.kind === "agent" && <AgentPage />}
                  {view.kind === "people" && (
                    <div className="grid gap-5 p-6 sm:grid-cols-2 lg:p-8 xl:grid-cols-3">
                      {workspace.members.map((member) => (
                        <Card key={member.id}>
                          <CardHeader>
                            <div className="mb-2">
                              <Avatar size="lg">
                                <AvatarFallback>
                                  {member.name
                                    .split(" ")
                                    .map((part) => part[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
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
              {assistantOpen && !isMobile && screen !== "agent" && (
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
        <Sheet
          open={isMobile && assistantOpen && screen !== "agent"}
          onOpenChange={setAssistantOpen}
        >
          <SheetContent side="right" className="w-full!" showCloseButton={false}>
            <SheetHeader className="sr-only">
              <SheetTitle>Assistant</SheetTitle>
            </SheetHeader>
            <AssistantPanel onClose={toggleAssistant} />
          </SheetContent>
        </Sheet>
        <Dialog open={Boolean(task)} onOpenChange={taskOpenChanged}>
          <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{task?.title ?? "Task"}</DialogTitle>
            </DialogHeader>
            {task && conversation && (
              <div className="grid gap-8 md:grid-cols-2">
                <WorkEditor
                  key={task.id}
                  kind="task"
                  task={task}
                  workspace={workspace}
                  onSaved={closeTask}
                />
                <section className="flex min-h-96 flex-col gap-4" aria-label="Task discussion">
                  <h2 className="flex items-center gap-2 font-semibold">
                    <MessageSquare className="size-4" />
                    Discussion
                  </h2>
                  <Conversation workspace={workspace} conversation={conversation} />
                </section>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={Boolean(creation)} onOpenChange={creationOpenChanged}>
          <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-lg">
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
