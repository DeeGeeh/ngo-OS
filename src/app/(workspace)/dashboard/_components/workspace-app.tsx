"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ChevronsUpDown,
  Folder,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  PanelRight,
  Settings,
  Sun,
  Ticket,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { useCallback, useMemo, useState } from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { lumaCalendarItems, type CalendarItem } from "@/lib/calendar";
import { lumaQueryKey, type LumaCalendar } from "@/lib/luma";
import { defaultOrganizationId, product } from "@/lib/organizations";
import { cn } from "@/lib/utils";
import { workspaceQueryKey, type Member, type Workspace, type WorkStatus } from "@/lib/workspace";

import { getLumaCalendarAction, getWorkspaceAction } from "../actions";
import { AssistantPanel, AssistantProvider } from "./assistant-panel";
import { CalendarScreen } from "./calendar-screen";
import { EventsScreen } from "./events-screen";
import { OrgSwitcher } from "./org-switcher";
import { PeopleScreen } from "./people-screen";
import { ProjectDetail } from "./project-detail";
import { SettingsScreen } from "./settings-screen";
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
  | { kind: "events" }
  | { kind: "settings" };
const screenTitles = {
  board: "Board",
  chat: "Chat",
  people: "People",
  calendar: "Calendar",
  events: "Events",
  settings: "Settings",
} as const;
const screenSubtitles = {
  board: "Projects and tasks across the organization",
  chat: "Channels, project threads, and direct messages",
  people: "Members, roles, and what they are working on",
  calendar: "Everything scheduled, in one place",
  events: "Public events and registrations",
  settings: "Workspace preferences",
} as const;
type Creation = { kind: "task" | "project"; status: WorkStatus; projectId?: string };
type Screen = keyof typeof screenTitles;
type NavItem = { id: Screen; label: string; icon: LucideIcon };
const initialView: View = { kind: "board" };
const enter = { opacity: 0 };
const visible = { opacity: 1 };
const navItems = [
  { id: "board", label: "Board", icon: LayoutDashboard },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "events", label: "Events", icon: Ticket },
  { id: "people", label: "People", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
] satisfies NavItem[];

function NavButton({
  item,
  active,
  count,
  onSelect,
}: {
  item: NavItem;
  active: boolean;
  count?: number;
  onSelect: (id: Screen) => void;
}) {
  const select = useCallback(() => onSelect(item.id), [onSelect, item.id]);
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={select}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
      )}
    >
      <Icon className={cn("size-4 shrink-0", active && "text-sidebar-primary")} />
      <span className="flex-1 text-left">{item.label}</span>
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-sidebar-accent px-1.5 py-0.5 text-xs font-medium tabular-nums">
          {count}
        </span>
      )}
    </button>
  );
}

const userMenuButton = (
  <button
    type="button"
    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring"
    aria-label="Open account menu"
  />
);

function ProductMark() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Image
        src={product.markLight}
        alt=""
        width={512}
        height={355}
        unoptimized
        className="h-4 w-auto dark:hidden"
      />
      <Image
        src={product.markDark}
        alt=""
        width={512}
        height={355}
        unoptimized
        className="hidden h-4 w-auto dark:block"
      />
      <span>
        Powered by <span className="font-semibold text-foreground">{product.name}</span>
      </span>
    </Link>
  );
}

function UserMenu({ member, onSettings }: { member?: Member; onSettings: () => void }) {
  if (!member) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={userMenuButton}
        aria-label={`Signed in as ${member.name}. Open account menu`}
      >
        <MemberAvatar member={member} size="default" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm leading-tight font-medium">{member.name}</span>
          <span className="truncate text-xs leading-tight text-muted-foreground">
            {member.role}
          </span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserRound />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSettings}>
            <Settings />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
  const [organizationId, setOrganizationId] = useState(defaultOrganizationId);
  const isMobile = useIsMobile();
  const { resolvedTheme, setTheme } = useTheme();
  const task = workspace.tasks.find((item) => item.id === taskId);
  const project =
    view.kind === "project" ? workspace.projects.find((item) => item.id === view.id) : undefined;
  const currentMember = workspace.members.find((member) => member.id === workspace.currentMemberId);
  const screen = view.kind === "project" ? "board" : view.kind;
  const title = screenTitles[screen];
  const subtitle = screenSubtitles[screen];
  const navCounts = useMemo(
    () => ({
      board: workspace.tasks.filter((item) => item.status !== "done").length,
      chat: undefined,
      calendar: undefined,
      events: luma.events.length,
      people: workspace.members.length,
      settings: undefined,
    }),
    [workspace.tasks, workspace.members.length, luma.events.length],
  );

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
  const switchScreen = useCallback((value: Screen) => setView({ kind: value }), []);
  const openSettings = useCallback(() => setView({ kind: "settings" }), []);
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
  const selectedKind = useMemo(() => (creation ? [creation.kind] : []), [creation]);

  return (
    <AssistantProvider>
      <Sidebar animate={false}>
        <div className="flex h-dvh flex-col overflow-hidden bg-background md:flex-row">
          <div className="shrink-0 md:border-r">
            <SidebarBody className="md:w-60!">
              <div className="flex h-full flex-col gap-4">
                <OrgSwitcher
                  organizationId={organizationId}
                  onSelect={setOrganizationId}
                  onSettings={openSettings}
                />
                <nav aria-label="Main navigation" className="flex flex-col gap-1">
                  <p className="px-2 pt-1 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Workspace
                  </p>
                  {navItems.map((item) => (
                    <NavButton
                      key={item.id}
                      item={item}
                      active={screen === item.id}
                      count={navCounts[item.id]}
                      onSelect={switchScreen}
                    />
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-2">
                  <UserMenu member={currentMember} onSettings={openSettings} />
                  <ProductMark />
                </div>
              </div>
            </SidebarBody>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <header className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-3.5 lg:px-8">
              <div className="flex min-w-0 flex-col">
                <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle color theme"
                  onClick={toggleTheme}
                >
                  {resolvedTheme === "dark" ? <Sun /> : <Moon />}
                </Button>
                <Button
                  variant={view.kind === "settings" ? "secondary" : "ghost"}
                  size="icon"
                  aria-label="Settings"
                  onClick={openSettings}
                >
                  <Settings />
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
                <div className="ml-1">
                  <CreateWorkMenu
                    onCreate={create}
                    appearance="labeled"
                    label="New task or project"
                  />
                </div>
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
                  {view.kind === "people" && <PeopleScreen workspace={workspace} />}
                  {view.kind === "settings" && (
                    <SettingsScreen workspace={workspace} organizationId={organizationId} />
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
