import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

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
      <Link href="/dashboard" className={buttonVariants({ size: "lg", className: "mt-8" })}>
        Open the workspace
        <ArrowRight data-icon="inline-end" />
      </Link>
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
