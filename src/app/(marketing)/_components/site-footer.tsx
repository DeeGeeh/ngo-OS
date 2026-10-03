import Image from "next/image";

import { GlassPanel } from "./glass-panel";

const sectionLinks: Record<string, string> = {
  Features: "#features",
  Integrations: "#integrations",
  Guides: "#how-it-works",
};

const columns = [
  { title: "Product", links: ["Features", "Integrations", "Pricing", "Changelog"] },
  { title: "Resources", links: ["Blog", "Docs", "Guides", "Support"] },
  { title: "Organization", links: ["About", "Contact", "Privacy", "Terms"] },
];

export function SiteFooter() {
  return (
    <footer id="blog" className="mx-auto max-w-6xl px-4 pb-6">
      <GlassPanel className="p-6 md:p-10">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Image src="/brand/svg/nest-horizontal-blue.svg" alt="nest" width={110} height={32} />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Your team&apos;s home base. Projects, volunteers and conversations in one workspace.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-foreground">{column.title}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href={sectionLinks[link] ?? "/"}
                      className="transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          &copy; 2026 nest. All rights reserved.
        </p>
      </GlassPanel>
    </footer>
  );
}
