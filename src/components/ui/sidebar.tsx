"use client";

import { Menu } from "lucide-react";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ComponentProps,
  type Dispatch,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
  type SetStateAction,
} from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  animate: boolean;
  isMobile: boolean;
};

type SidebarProps = {
  children: ReactNode;
  animate?: boolean;
} & ({ open?: never; setOpen?: never } | Pick<SidebarContextValue, "open" | "setOpen">);

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);
const expandedSidebar = { width: 300 };
const collapsedSidebar = { width: 60 };
const visibleLabel = { display: "inline-block", opacity: 1 };
const hiddenLabel = { display: "none", opacity: 0 };
const instantTransition = { duration: 0 };
const menuButton = <Button variant="ghost" size="icon" aria-label="Open navigation" />;

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({
  children,
  open: controlledOpen,
  setOpen: controlledSetOpen,
  animate = true,
}: SidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isMobile = useIsMobile();
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledSetOpen ?? setInternalOpen;
  const value = useMemo(
    () => ({ open, setOpen, animate, isMobile }),
    [open, setOpen, animate, isMobile],
  );

  return (
    <SidebarContext value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </SidebarContext>
  );
}

export const Sidebar = SidebarProvider;

export function SidebarBody({
  children,
  className,
  ...props
}: Omit<ComponentProps<typeof motion.div>, "children"> & { children: ReactNode }) {
  return (
    <>
      <DesktopSidebar className={className} {...props}>
        {children}
      </DesktopSidebar>
      <MobileSidebar className={className}>{children}</MobileSidebar>
    </>
  );
}

export function DesktopSidebar({
  className,
  children,
  onMouseEnter,
  onMouseLeave,
  onFocusCapture,
  onBlurCapture,
  ...props
}: ComponentProps<typeof motion.div>) {
  const { open, setOpen, animate } = useSidebar();
  const reducedMotion = useReducedMotion();
  const enter = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      setOpen(true);
      onMouseEnter?.(event);
    },
    [setOpen, onMouseEnter],
  );
  const leave = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.currentTarget.ownerDocument.activeElement)) {
        setOpen(false);
      }
      onMouseLeave?.(event);
    },
    [setOpen, onMouseLeave],
  );
  const focus = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      setOpen(true);
      onFocusCapture?.(event);
    },
    [setOpen, onFocusCapture],
  );
  const blur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (
        !(
          event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)
        ) &&
        !event.currentTarget.matches(":hover")
      ) {
        setOpen(false);
      }
      onBlurCapture?.(event);
    },
    [setOpen, onBlurCapture],
  );

  return (
    <motion.div
      {...props}
      className={cn(
        "hidden h-full w-75 shrink-0 flex-col bg-sidebar p-3 text-sidebar-foreground md:flex",
        className,
      )}
      initial={false}
      animate={animate && !open ? collapsedSidebar : expandedSidebar}
      transition={!animate || reducedMotion ? instantTransition : undefined}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocusCapture={focus}
      onBlurCapture={blur}
    >
      {children}
    </motion.div>
  );
}

export function MobileSidebar({ className, children, ...props }: ComponentProps<"div">) {
  const { open, setOpen, isMobile } = useSidebar();

  return (
    <Sheet open={isMobile && open} onOpenChange={setOpen}>
      <div
        {...props}
        className="flex h-10 w-full items-center justify-end bg-background px-4 md:hidden"
      >
        <SheetTrigger render={menuButton}>
          <Menu />
        </SheetTrigger>
      </div>
      <SheetContent
        side="left"
        className={cn(
          "gap-4 bg-sidebar p-3 text-sidebar-foreground data-[side=left]:w-full data-[side=left]:sm:max-w-none motion-reduce:transition-none",
          className,
        )}
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}

export function SidebarLink({
  link,
  className,
  onClick,
  ...props
}: Omit<ComponentProps<typeof Link>, "href" | "children"> & {
  link: {
    label: string;
    href: ComponentProps<typeof Link>["href"];
    icon: ReactNode;
  };
}) {
  const { open, setOpen, animate, isMobile } = useSidebar();
  const click = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (isMobile && !event.defaultPrevented) {
        setOpen(false);
      }
    },
    [isMobile, setOpen, onClick],
  );

  return (
    <Link
      {...props}
      href={link.href}
      aria-label={props["aria-label"] ?? link.label}
      className={cn(
        "flex items-center gap-2 rounded-sm py-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      onClick={click}
    >
      {link.icon}
      <motion.span
        initial={false}
        animate={open || !animate || isMobile ? visibleLabel : hiddenLabel}
        className="inline-block text-sm whitespace-nowrap"
      >
        {link.label}
      </motion.span>
    </Link>
  );
}
