import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

const links = [
  { label: "Product", href: "#features" },
  { label: "Integrations", href: "#integrations" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Blog", href: "#blog" },
];

export function SiteNav() {
  return (
    <header className="mx-auto w-full max-w-7xl px-4 md:px-8">
      <nav className="flex items-center justify-between py-4">
        <Link href="/" aria-label="nest home">
          <Image
            src="/brand/svg/nest-horizontal-white.svg"
            alt="nest"
            width={104}
            height={25}
            priority
          />
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-primary-foreground/90 drop-shadow-sm md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-primary-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>
        <Link href="/dashboard" className={buttonVariants()}>
          Open nest
        </Link>
      </nav>
    </header>
  );
}
