import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { CloudShader } from "@/components/ui/cloud-shader";

export default function CloudShaderHero() {
  return (
    <section className="relative min-h-svh w-full overflow-hidden bg-primary">
      <CloudShader className="absolute inset-0" />
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 pt-32 text-center md:pt-40">
        <h1 className="text-4xl font-bold tracking-tight text-primary-foreground drop-shadow-md md:text-6xl lg:text-7xl">
          NGO OS
        </h1>
        <p className="max-w-2xl text-base text-primary-foreground drop-shadow-sm md:text-lg">
          The NGO Operating System
        </p>
        <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
          Open dashboard
        </Link>
      </div>
    </section>
  );
}
