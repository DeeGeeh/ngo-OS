import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

const signInHref = { pathname: "/sign-in" };

const links = [
  { label: "Product", href: "#features" },
  { label: "Integrations", href: "#integrations" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Blog", href: "#blog" },
];

export function SiteNav() {
  return (
    <header className="sticky top-4 z-30 mx-auto w-full max-w-6xl px-4">
      <nav className="flex items-center justify-between rounded-full border border-primary-foreground/40 bg-background/50 py-2 pr-2 pl-5 shadow-lg backdrop-blur-xl">
        <Link href="/" aria-label="nest home">
          <Image
            src="/brand/svg/nest-horizontal-blue.svg"
            alt="nest"
            width={96}
            height={28}
            priority
          />
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-foreground/80 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href={signInHref} className={buttonVariants({ variant: "ghost" })}>
            Sign in
          </Link>
          <Link href="/dashboard" className={buttonVariants()}>
            Open nest
          </Link>
        </div>
      </nav>
    </header>
  );
}
