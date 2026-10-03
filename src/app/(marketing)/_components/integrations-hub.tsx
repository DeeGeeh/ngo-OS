"use client";

import { Sparkle } from "lucide-react";
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
    <div className="z-10 flex w-16 flex-col items-center gap-2">
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

function Logo({ name, label }: { name: string; label: string }) {
  return <Image src={`/integrations/${name}.svg`} alt={label} width={28} height={28} />;
}

export function IntegrationsHub() {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const lumaRef = useRef<HTMLDivElement>(null);
  const googleRef = useRef<HTMLDivElement>(null);
  const telegramRef = useRef<HTMLDivElement>(null);
  const claudeRef = useRef<HTMLDivElement>(null);
  const codexRef = useRef<HTMLDivElement>(null);
  const chatgptRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex w-full max-w-3xl items-center justify-between px-2 py-4 md:px-12"
    >
      <div className="flex flex-col gap-8 md:gap-10">
        <Node ref={lumaRef} label="Luma">
          <Sparkle className="size-7 text-foreground" />
        </Node>
        <Node ref={googleRef} label="Google">
          <Logo name="google" label="Google" />
        </Node>
        <Node ref={telegramRef} label="Telegram">
          <Logo name="telegram" label="Telegram" />
        </Node>
      </div>
      <div
        ref={centerRef}
        className="z-10 flex size-24 items-center justify-center rounded-full border-4 border-background bg-primary p-4 shadow-2xl md:size-32 md:p-6"
      >
        <Image src="/brand/svg/nest-mark-white.svg" alt="nest" width={512} height={355} />
      </div>
      <div className="flex flex-col gap-8 md:gap-10">
        <Node ref={claudeRef} label="Claude">
          <Logo name="claude" label="Claude" />
        </Node>
        <Node ref={codexRef} label="Codex">
          <Logo name="codex" label="Codex" />
        </Node>
        <Node ref={chatgptRef} label="ChatGPT">
          <Logo name="chatgpt" label="ChatGPT" />
        </Node>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={lumaRef}
        toRef={centerRef}
        curvature={-50}
      />
      <AnimatedBeam containerRef={containerRef} fromRef={googleRef} toRef={centerRef} delay={0.5} />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={telegramRef}
        toRef={centerRef}
        curvature={50}
        delay={1}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={claudeRef}
        toRef={centerRef}
        curvature={-50}
        reverse
        delay={0.25}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={codexRef}
        toRef={centerRef}
        reverse
        delay={0.75}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={chatgptRef}
        toRef={centerRef}
        curvature={50}
        reverse
        delay={1.25}
      />
    </div>
  );
}
