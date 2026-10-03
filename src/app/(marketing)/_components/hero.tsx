import { ArrowUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pt-16 text-center md:pt-24">
      <h1>
        <Image
          src="/brand/svg/nest-stacked-white.svg"
          alt="nest"
          width={383}
          height={416}
          priority
          className="h-auto w-40 drop-shadow-lg md:w-52"
        />
      </h1>
      <p className="mt-5 text-2xl font-bold tracking-tight text-primary-foreground drop-shadow-md md:text-4xl">
        Your team&apos;s home base.
      </p>
      <p className="mt-4 max-w-xl text-base text-primary-foreground drop-shadow-md md:text-lg">
        Projects, volunteers and every conversation in one workspace. Plan a project, find the right
        people and invite them on Telegram.
      </p>
      <div className="relative isolate mt-10 w-full max-w-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-8 -inset-y-12 -z-10 rounded-full bg-radial from-accent via-accent/30 to-transparent to-70% opacity-80 md:-inset-x-20 md:-inset-y-16"
        />
        <Link
          href="/dashboard?view=agent"
          aria-label="How can I help you? Open the agent"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "group h-16 w-full justify-between gap-4 rounded-full border-border bg-card px-5 pr-2 shadow-xl transition-shadow hover:shadow-2xl focus-visible:ring-offset-4 focus-visible:ring-offset-primary md:h-18 md:pl-7 md:pr-3 dark:bg-card",
          )}
        >
          <span className="text-base font-normal text-muted-foreground md:text-lg">
            How can I help you?
          </span>
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none"
          >
            <ArrowUp data-icon="inline-end" />
          </span>
        </Link>
      </div>
      <div className="mt-16 w-full rounded-3xl border border-primary-foreground/40 bg-primary-foreground/20 p-2 shadow-2xl backdrop-blur-md md:mt-20 md:rounded-4xl md:p-3">
        <Image
          src="/landing/dashboard.png"
          alt="The nest workspace board with projects and tasks"
          width={2160}
          height={1290}
          priority
          className="w-full rounded-2xl border border-border shadow-lg md:rounded-3xl"
        />
      </div>
    </section>
  );
}
