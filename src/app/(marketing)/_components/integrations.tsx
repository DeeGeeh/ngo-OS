import { GlassPanel } from "./glass-panel";
import { IntegrationsHub } from "./integrations-hub";

export function Integrations() {
  return (
    <section id="integrations" className="mx-auto max-w-6xl scroll-mt-28 px-4 pt-16">
      <GlassPanel className="p-6 md:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-primary">Integrations</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Connects to the tools your team already uses
          </h2>
          <p className="mt-3 text-muted-foreground">
            Sync projects from Luma, pull documents and email from Google, reach volunteers on
            Telegram, and bring nest&apos;s context into Claude and Codex.
          </p>
        </div>
        <div className="mt-10">
          <IntegrationsHub />
        </div>
      </GlassPanel>
    </section>
  );
}
