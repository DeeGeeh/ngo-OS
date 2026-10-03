import { CalendarPlus, Send, UserSearch } from "lucide-react";

import { GlassPanel } from "./glass-panel";

const steps = [
  {
    icon: CalendarPlus,
    title: "Create a project",
    body: "Start a project or import it from Luma. Add the roles you need filled and the tasks to get there.",
  },
  {
    icon: UserSearch,
    title: "Find the right volunteers",
    body: "The assistant suggests people based on their skills, interests and past projects.",
  },
  {
    icon: Send,
    title: "Invite and coordinate",
    body: "Send invites on Telegram and track who said yes. Relevant replies flow back into the workspace.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-28 px-4 pt-16">
      <GlassPanel className="p-6 md:p-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">How it works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            From idea to a fully staffed project
          </h2>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-border bg-background/70 p-5 shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <step.icon className="size-6 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </GlassPanel>
    </section>
  );
}
