import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pt-20 text-center md:pt-28">
      <span className="rounded-full border border-primary-foreground/40 bg-primary-foreground/15 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur-md">
        Built for volunteer-run organizations
      </span>
      <h1 className="mt-6 max-w-4xl text-5xl font-bold tracking-tight text-primary-foreground drop-shadow-md md:text-7xl">
        Your team&apos;s home base.
      </h1>
      <p className="mt-6 max-w-2xl text-base text-primary-foreground drop-shadow-sm md:text-lg">
        nest brings projects, volunteers and every conversation into one workspace. Plan a project,
        find the right people, invite them on Telegram and keep the whole board in the loop. No more
        spreadsheets.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link href="/dashboard" className={buttonVariants({ variant: "secondary", size: "lg" })}>
          Open the workspace
          <ArrowRight data-icon="inline-end" />
        </Link>
        <a href="#how-it-works" className={buttonVariants({ variant: "outline", size: "lg" })}>
          See how it works
        </a>
      </div>
      <p className="mt-4 text-xs text-primary-foreground drop-shadow-md">
        Free for student organizations &middot; No credit card required
      </p>
      <div className="mt-14 w-full rounded-3xl border border-primary-foreground/40 bg-primary-foreground/20 p-2 shadow-2xl backdrop-blur-md md:mt-20 md:rounded-4xl md:p-3">
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
