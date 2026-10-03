"use client";

import { MotionConfig, type Transition } from "motion/react";
import type { ReactNode } from "react";

const transition = { type: "spring", duration: 0.2, bounce: 0 } satisfies Transition;

export function WorkspaceProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={transition}>
      {children}
    </MotionConfig>
  );
}
