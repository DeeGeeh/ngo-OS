import { Bot, FolderOpen, Handshake, Send, SquareKanban, Users } from "lucide-react";

import { GlassPanel } from "./glass-panel";

const features = [
  {
    icon: SquareKanban,
    title: "Every project on one board",
    body: "Plan projects on a shared board with tasks, owners and deadlines, so nobody has to ask what is happening.",
  },
  {
    icon: Users,
    title: "Volunteer profiles",
    body: "Skills, interests, Telegram handles and LinkedIn in one place, so you know exactly who to ask.",
  },
  {
    icon: Bot,
    title: "An assistant that knows your team",
    body: "Ask who fits a role, draft an invite or summarize the week. It works from your shared context.",
  },
  {
    icon: Send,
    title: "Telegram outreach",
    body: "Invite and coordinate volunteers in the chats they already use. Useful messages are kept, stickers are not.",
  },
  {
    icon: FolderOpen,
    title: "Shared context",
    body: "Bring in Google Drive documents and email threads so the whole board works from the same facts.",
  },
  {
    icon: Handshake,
    title: "Contacts and follow-ups",
    body: "A lightweight CRM for partners, sponsors and venues, with follow-ups that do not slip through.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-28 px-4 pt-24">
      <GlassPanel className="p-6 md:p-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Product</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Everything your board juggles, in one nest
          </h2>
          <p className="mt-3 text-muted-foreground">
            Replace the spreadsheets, scattered group chats and lost documents with one workspace
            built around how volunteer teams actually run projects.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-background/70 p-5 shadow-sm backdrop-blur-md"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <feature.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </GlassPanel>
    </section>
  );
}
