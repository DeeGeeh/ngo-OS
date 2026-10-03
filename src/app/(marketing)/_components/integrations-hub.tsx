"use client";

import { SiClaude, SiGoogle, SiTelegram } from "@icons-pack/react-simple-icons";
import { Sparkle, SquareTerminal } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

import { AnimatedBeam } from "@/components/ui/animated-beam";

function Node({
  ref,
  label,
  children,
}: {
  ref: React.Ref<HTMLDivElement>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="z-10 flex flex-col items-center gap-2">
      <div
        ref={ref}
        className="flex size-14 items-center justify-center rounded-full border border-border bg-background shadow-lg md:size-16"
      >
        {children}
      </div>
      <span className="text-xs font-medium text-foreground/80">{label}</span>
    </div>
  );
}

export function IntegrationsHub() {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const lumaRef = useRef<HTMLDivElement>(null);
  const googleRef = useRef<HTMLDivElement>(null);
  const telegramRef = useRef<HTMLDivElement>(null);
  const claudeRef = useRef<HTMLDivElement>(null);
  const codexRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex w-full max-w-3xl items-center justify-between gap-6 px-2 py-6 md:px-10"
    >
      <div className="flex flex-col gap-10 md:gap-12">
        <Node ref={lumaRef} label="Luma">
          <Sparkle className="size-7 text-foreground" />
        </Node>
        <Node ref={googleRef} label="Google">
          <SiGoogle color="default" className="size-7" />
        </Node>
        <Node ref={telegramRef} label="Telegram">
          <SiTelegram color="default" className="size-7" />
        </Node>
      </div>
      <div className="z-10 flex flex-col items-center gap-2">
        <div
          ref={centerRef}
          className="flex size-24 items-center justify-center rounded-full border border-border bg-background p-4 shadow-2xl md:size-28"
        >
          <Image src="/brand/svg/nest-mark-blue.svg" alt="nest" width={72} height={72} />
        </div>
        <span className="text-sm font-semibold text-foreground">nest</span>
      </div>
      <div className="flex flex-col gap-16 md:gap-20">
        <Node ref={claudeRef} label="Claude">
          <SiClaude color="default" className="size-7" />
        </Node>
        <Node ref={codexRef} label="Codex">
          <SquareTerminal className="size-7 text-foreground" />
        </Node>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={lumaRef}
        toRef={centerRef}
        curvature={-60}
        endYOffset={-10}
      />
      <AnimatedBeam containerRef={containerRef} fromRef={googleRef} toRef={centerRef} delay={0.6} />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={telegramRef}
        toRef={centerRef}
        curvature={60}
        endYOffset={10}
        delay={1.2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={claudeRef}
        toRef={centerRef}
        curvature={-40}
        endYOffset={-10}
        reverse
        delay={0.3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={codexRef}
        toRef={centerRef}
        curvature={40}
        endYOffset={10}
        reverse
        delay={0.9}
      />
    </div>
  );
}
