"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  CalendarDays,
  ChevronsUpDown,
  Folder,
  HandCoins,
  Handshake,
  House,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessageSquare,
  Moon,
  PanelRight,
  Settings,
  Bot,
  Sun,
  Ticket,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";

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
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import type { AssistantThread } from "@/lib/assistant";
import { dataLibraryQueryKey, dataLibrarySchema, type DataLibrary } from "@/lib/data";
import { lumaCalendarItems, type CalendarItem } from "@/lib/calendar";
import { lumaQueryKey, type LumaCalendar } from "@/lib/luma";
import { defaultOrganizationId, organizations } from "@/lib/organizations";
import { cn } from "@/lib/utils";
import { workspaceQueryKey, type Member, type Workspace, type WorkStatus } from "@/lib/workspace";

import { getLumaCalendarAction, getWorkspaceAction } from "../actions";
import { AssistantPanel } from "./assistant-panel";
import { AssistantProvider } from "./assistant-runtime";
import { AgentPage } from "./agent-page";
import { CalendarScreen } from "./calendar-screen";
import { DonationsScreen } from "./donations-screen";
import { EventsScreen } from "./events-screen";
import { HomeScreen } from "./home-screen";
import { OrgSwitcher } from "./org-switcher";
import { PeopleScreen } from "./people-screen";
import { ProjectDetail } from "./project-detail";
import { SettingsScreen } from "./settings-screen";
import { SponsorsScreen } from "./sponsors-screen";
import { CreateWorkMenu, WorkBoard } from "./work-board";
import { TaskDetail } from "./task-detail";
import { TelegramConnection } from "./telegram-connection";
import { MemberAvatar } from "./work-cards";
import { WorkEditor } from "./work-editor";
import { WorkspaceChat } from "./workspace-chat";

const screenTitles = {
  home: "Dashboard",
  board: "Board",
  sponsors: "Sponsors",
  donations: "Donations",
  chat: "Chat",
  people: "People",
  calendar: "Calendar",
  events: "Events",
  settings: "Settings",
  agent: "Agent",
} as const;
const screenSubtitles = {
  home: "What is happening across the organization today",
  board: "Projects and tasks across the organization",
  sponsors: "Sponsor pipeline, contacts, and follow-ups",
  donations: "Donation links and what they have raised",
  chat: "Channels, project threads, and direct messages",
  people: "Members, roles, and what they are working on",
  calendar: "Everything scheduled, in one place",
  events: "Public events and registrations",
  settings: "Workspace preferences",
  agent: "Saved conversations and workspace assistance",
} as const;
type Creation = { kind: "task" | "project"; status: WorkStatus; projectId?: string };
type Screen = keyof typeof screenTitles;
function isScreen(value: string | null): value is Screen {
  return value !== null && Object.hasOwn(screenTitles, value);
}
type NavItem = { id: Screen; label: string; icon: LucideIcon };
const enter = { opacity: 0 };
const visible = { opacity: 1 };
const homeNavItem = { id: "home", label: "Dashboard", icon: House } satisfies NavItem;
const initialUnread: Record<string, number> = { ideas: 1 };
const navItems = [
  { id: "board", label: "Board", icon: LayoutDashboard },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "sponsors", label: "Sponsors", icon: Handshake },
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
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
            item.id === "chat"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "bg-sidebar-accent",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function AgentNavButton({ active, onSelect }: { active: boolean; onSelect: (id: Screen) => void }) {
  const select = useCallback(() => onSelect("agent"), [onSelect]);
  return (
    <button
      type="button"
      onClick={select}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 overflow-hidden rounded-lg border px-2.5 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary/40 bg-primary text-primary-foreground shadow-sm"
          : "border-primary/20 bg-linear-to-r from-primary/10 via-chart-3/10 to-primary/5 text-sidebar-foreground hover:border-primary/40",
      )}
    >
      <Bot aria-hidden="true" className={cn("size-4", !active && "text-primary")} />
      <span className="flex-1 text-left">Ask the agent</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-xs",
          active ? "bg-primary-foreground/20" : "bg-primary/10 text-primary",
        )}
      >
        AI
      </span>
    </button>
  );
}

function DonationsShortcut({ active, onOpen }: { active: boolean; onOpen: (id: Screen) => void }) {
  const open = useCallback(() => onOpen("donations"), [onOpen]);
  return (
    <button
      type="button"
      onClick={open}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col gap-1 rounded-xl border p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-sidebar-primary/40 bg-sidebar-accent"
          : "border-sidebar-border bg-sidebar hover:bg-sidebar-accent/50",
      )}
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <HandCoins className="size-4 text-sidebar-primary" />
        Donations
      </span>
      <span className="text-xs text-muted-foreground">Create a link people can give through.</span>
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
          <DropdownMenuItem onClick={onSettings}>
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
  overviewBrief,
  initialThreads,
  initialDataLibrary,
  googleEvents,
  initialLuma,
  children,
}: {
  initialWorkspace: Workspace;
  overviewBrief: ReactNode;
  initialThreads: AssistantThread[];
  initialDataLibrary: DataLibrary;
  googleEvents: CalendarItem[];
  initialLuma: LumaCalendar;
  children: ReactNode;
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
  const { data: dataLibrary } = useQuery({
    queryKey: dataLibraryQueryKey,
    queryFn: async (): Promise<DataLibrary> => {
      const response = await fetch("/api/data/sources");
      if (!response.ok) throw new Error(await response.text());
      return dataLibrarySchema.parse(await response.json());
    },
    initialData: initialDataLibrary,
  });
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const isWorkspaceHome = pathname === "/dashboard";
  const screenName = searchParams.get("view");
  const selectedScreen: Screen = isScreen(screenName) ? screenName : "home";
  const [projectId, setProjectId] = useState<string | null>(null);
  const [unread, setUnread] = useState(initialUnread);
  const [chatChannel, setChatChannel] = useState<string | undefined>(undefined);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [creation, setCreation] = useState<Creation | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState(defaultOrganizationId);
  const isMobile = useIsMobile();
  const { resolvedTheme, setTheme } = useTheme();
  const task = workspace.tasks.find((item) => item.id === taskId);
  const project = workspace.projects.find((item) => item.id === projectId);
  const currentMember = workspace.members.find((member) => member.id === workspace.currentMemberId);
  const organization = organizations.find((item) => item.id === organizationId) ?? organizations[0];
  const unreadTotal = Object.values(unread).reduce((sum, count) => sum + count, 0);
  const screen = isWorkspaceHome ? selectedScreen : null;
  const currentDashboard = dataLibrary.dashboards.find(
    (item) => pathname === `/dashboard/data/${encodeURIComponent(item.id)}`,
  );
  const title = screen
    ? screenTitles[screen]
    : pathname === "/dashboard/integrations"
      ? "Connections"
      : "Dashboard";
  const subtitle = screen ? screenSubtitles[screen] : currentDashboard?.title;
  const navCounts = useMemo(
    (): Partial<Record<Screen, number>> => ({
      board: workspace.tasks.filter((item) => item.status !== "done").length,
      chat: unreadTotal,
      events: luma.events.length,
    }),
    [workspace.tasks, unreadTotal, luma.events.length],
  );

  const openTask = useCallback((id: string) => setTaskId(id), []);
  const openProject = useCallback((id: string) => setProjectId(id), []);
  const projectOpenChanged = useCallback((open: boolean) => {
    if (!open) setProjectId(null);
  }, []);
  const markRead = useCallback((channelId: string) => {
    setUnread((current) => {
      if (!current[channelId]) return current;
      const next = { ...current };
      delete next[channelId];
      return next;
    });
  }, []);
  const promptSent = useCallback(() => setPendingPrompt(null), []);
  const create = useCallback((status: WorkStatus, kind: "task" | "project") => {
    setCreation({ kind, status });
  }, []);
  const createProjectTask = useCallback(
    (id: string) => setCreation({ kind: "task", status: "todo", projectId: id }),
    [],
  );
  const closeCreation = useCallback(() => setCreation(null), []);
  const taskOpenChanged = useCallback((open: boolean) => {
    if (!open) setTaskId(null);
  }, []);
  const creationOpenChanged = useCallback((open: boolean) => {
    if (!open) setCreation(null);
  }, []);
  const switchScreen = useCallback(
    (value: Screen) => {
      setChatChannel(undefined);
      const params = new URLSearchParams(isWorkspaceHome ? searchParams.toString() : "");
      params.set("view", value);
      const href = `/dashboard?${params.toString()}` as const;
      if (isWorkspaceHome) window.history.pushState(null, "", href);
      else router.push(href);
    },
    [isWorkspaceHome, router, searchParams],
  );
  const openSettings = useCallback(() => switchScreen("settings"), [switchScreen]);
  const openChannel = useCallback(
    (channelId: string) => {
      switchScreen("chat");
      setChatChannel(channelId);
    },
    [switchScreen],
  );
  const ask = useCallback(
    (prompt: string) => {
      setPendingPrompt(prompt);
      switchScreen("agent");
    },
    [switchScreen],
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
  const openTelegram = useCallback(() => setTelegramOpen(true), []);
  const selectedKind = useMemo(() => (creation ? [creation.kind] : []), [creation]);

  return (
    <AssistantProvider initialThreads={initialThreads}>
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
                  <NavButton
                    item={homeNavItem}
                    active={screen === "home"}
                    onSelect={switchScreen}
                  />
                  <AgentNavButton active={screen === "agent"} onSelect={switchScreen} />
                  <Separator className="my-2" />
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
                {dataLibrary.dashboards.length > 0 && (
                  <div className="flex flex-col gap-2 px-2">
                    <p className="text-xs font-medium text-muted-foreground">Dashboards</p>
                    {dataLibrary.dashboards.map((dashboard) => (
                      <Link
                        key={dashboard.id}
                        href={`/dashboard/data/${encodeURIComponent(dashboard.id)}`}
                        aria-current={
                          pathname === `/dashboard/data/${encodeURIComponent(dashboard.id)}`
                            ? "page"
                            : undefined
                        }
                        className="truncate text-sm text-muted-foreground hover:text-foreground"
                      >
                        {dashboard.title}
                      </Link>
                    ))}
                  </div>
                )}
                <div className="mt-auto flex flex-col gap-2">
                  <DonationsShortcut active={screen === "donations"} onOpen={switchScreen} />
                  <UserMenu member={currentMember} onSettings={openSettings} />
                </div>
              </div>
            </SidebarBody>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <header className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-3.5 lg:px-8">
              <div className="flex min-w-0 flex-col">
                <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
                {subtitle && (
                  <p className="hidden truncate text-xs text-muted-foreground sm:block">
                    {subtitle}
                  </p>
                )}
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
                  variant={screen === "settings" ? "secondary" : "ghost"}
                  size="icon"
                  aria-label="Settings"
                  onClick={openSettings}
                >
                  <Settings />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open Telegram connection"
                  onClick={openTelegram}
                >
                  <MessageCircle />
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
                  key={isWorkspaceHome ? selectedScreen : pathname}
                  initial={enter}
                  animate={visible}
                  className={cn(
                    "h-full",
                    screen === "calendar" || screen === "agent" || screen === "chat"
                      ? "overflow-hidden"
                      : "overflow-auto",
                  )}
                >
                  {isWorkspaceHome ? (
                    <>
                      {screen === "home" && (
                        <HomeScreen
                          brief={overviewBrief}
                          workspace={workspace}
                          luma={luma}
                          unread={unread}
                          onAsk={ask}
                          onOpenChannel={openChannel}
                          onTask={openTask}
                          onProject={openProject}
                        />
                      )}
                      {screen === "board" && (
                        <WorkBoard
                          workspace={workspace}
                          onTask={openTask}
                          onProject={openProject}
                          onCreate={create}
                        />
                      )}
                      {screen === "chat" && (
                        <WorkspaceChat
                          key={chatChannel ?? "chat"}
                          workspace={workspace}
                          initialChannelId={chatChannel}
                          unread={unread}
                          onRead={markRead}
                        />
                      )}
                      {screen === "agent" && (
                        <AgentPage prompt={pendingPrompt} onPromptSent={promptSent} />
                      )}
                      {screen === "sponsors" && <SponsorsScreen workspace={workspace} />}
                      {screen === "donations" && (
                        <DonationsScreen organizationName={organization?.name ?? "TRES"} />
                      )}
                      {screen === "calendar" && (
                        <CalendarScreen
                          workspace={workspace}
                          googleEvents={googleEvents}
                          lumaEvents={lumaItems}
                        />
                      )}
                      {screen === "events" && <EventsScreen calendar={luma} />}
                      {screen === "people" && <PeopleScreen workspace={workspace} />}
                      {screen === "settings" && (
                        <SettingsScreen workspace={workspace} organizationId={organizationId} />
                      )}
                    </>
                  ) : (
                    children
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
        <Dialog open={Boolean(project)} onOpenChange={projectOpenChanged}>
          <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-6xl">
            <div className="sr-only">
              <DialogHeader>
                <DialogTitle>{project?.title ?? "Project"}</DialogTitle>
              </DialogHeader>
            </div>
            {project && (
              <ProjectDetail
                key={project.id}
                project={project}
                workspace={workspace}
                onTask={openTask}
                onNewTask={createProjectTask}
              />
            )}
          </DialogContent>
        </Dialog>
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
        <TelegramConnection open={telegramOpen} onOpenChange={setTelegramOpen} />
      </Sidebar>
    </AssistantProvider>
  );
}
