import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export function ClosingCta() {
  return (
    <section className="mx-auto max-w-4xl px-4 pt-24 pb-20 text-center">
      <h2 className="text-3xl font-bold tracking-tight text-primary-foreground drop-shadow-md md:text-5xl">
        Give your board one place to work
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-primary-foreground drop-shadow-sm">
        Set up your first project in minutes and invite your team when you are ready.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/dashboard" className={buttonVariants({ variant: "secondary", size: "lg" })}>
          Open the workspace
        </Link>
        <a href="#blog" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Book a demo
        </a>
      </div>
    </section>
  );
}
