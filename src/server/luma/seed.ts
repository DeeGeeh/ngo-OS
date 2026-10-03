import {
  lumaCalendarSchema,
  type LumaApproval,
  type LumaEvent,
  type LumaGuest,
  type LumaInsight,
} from "@/lib/luma";

type GuestRow = readonly [string, LumaApproval, string, boolean?];

function emailFrom(name: string) {
  const local = name
    .toLowerCase()
    .replaceAll("ä", "a")
    .replaceAll("ö", "o")
    .replaceAll("å", "a")
    .replaceAll(" ", ".");
  return `${local}@gmail.com`;
}

function guests(
  prefix: string,
  rows: readonly GuestRow[],
  registeredStart: string,
  checkInStart: string | null,
): LumaGuest[] {
  const registeredMs = Date.parse(registeredStart);
  const checkInMs = checkInStart ? Date.parse(checkInStart) : null;
  const step = Math.min(18_000_000, Math.floor((14 * 86_400_000) / Math.max(rows.length, 1)));
  const checkInStep = Math.min(240_000, Math.floor(7_200_000 / Math.max(rows.length, 1)));
  return rows.map((row, index) => {
    const [name, approvalStatus, ticketName, checked] = row;
    return {
      apiId: `${prefix}-${index + 1}`,
      name,
      email: emailFrom(name),
      approvalStatus,
      ticketName,
      registeredAt: new Date(registeredMs + index * step).toISOString(),
      checkedInAt:
        checked && checkInMs !== null && approvalStatus === "approved"
          ? new Date(checkInMs + index * checkInStep).toISOString()
          : null,
    };
  });
}

function days(start: string, rows: readonly (readonly [number, number])[]): LumaInsight[] {
  const startMs = Date.parse(`${start}T00:00:00.000Z`);
  return rows.map(([views, registrations], index) => ({
    date: new Date(startMs + index * 86_400_000).toISOString().slice(0, 10),
    views,
    registrations,
  }));
}

function withSales(event: LumaEvent): LumaEvent {
  return {
    ...event,
    tickets: event.tickets.map((ticket) => ({
      ...ticket,
      sold: event.guests.filter(
        (guest) => guest.ticketName === ticket.name && guest.approvalStatus === "approved",
      ).length,
    })),
  };
}

const generalQuestions = [
  "University or company",
  "What do you want to build?",
  "Anything we should know about food?",
];

const firstNames = [
  "Aino",
  "Eetu",
  "Venla",
  "Lauri",
  "Ella",
  "Niko",
  "Sanni",
  "Juho",
  "Kerttu",
  "Ville",
  "Emma",
  "Antti",
  "Lotta",
  "Henri",
  "Iida",
  "Otto",
  "Nella",
  "Ilmari",
  "Pihla",
  "Samuel",
  "Ronja",
  "Valtteri",
  "Siiri",
  "Arttu",
  "Minea",
  "Topias",
  "Alisa",
  "Jesse",
  "Kaisla",
  "Miro",
];
const lastNames = [
  "Mattila",
  "Heinonen",
  "Karjalainen",
  "Hiltunen",
  "Lindholm",
  "Salo",
  "Kinnunen",
  "Tuominen",
  "Rinne",
  "Laitinen",
  "Seppälä",
  "Honkanen",
  "Vainio",
  "Hämäläinen",
  "Koivisto",
  "Lahtinen",
  "Jokinen",
  "Ahola",
  "Manninen",
  "Nurmi",
  "Ojala",
  "Kivelä",
  "Peltola",
  "Räsänen",
];

function crowd(count: number, offset: number, ticketName: string, checkedEvery = 0): GuestRow[] {
  return Array.from({ length: count }, (_, index) => {
    const position = offset + index;
    const name = `${firstNames[position % firstNames.length]} ${lastNames[(position * 7) % lastNames.length]}`;
    const checked = checkedEvery > 0 && index % checkedEvery !== 0;
    return [name, "approved", ticketName, checked] as const;
  });
}

const h4hGuests = guests(
  "gst-h4h",
  [
    ["Linnea Hakala", "approved", "General Admission", true],
    ["Eetu Salminen", "approved", "General Admission", true],
    ["Iida Kallio", "approved", "General Admission", true],
    ["Veera Laaksonen", "approved", "General Admission", true],
    ["Joonas Peltonen", "approved", "General Admission", true],
    ["Anni Heikkilä", "approved", "General Admission", true],
    ["Oskari Niemelä", "approved", "General Admission", false],
    ["Saara Leppänen", "approved", "General Admission", false],
    ["Aleksi Mäkelä", "approved", "Mentor", true],
    ["Pinja Rantanen", "approved", "General Admission", false],
    ["Tuomas Aalto", "approved", "General Admission", false],
    ["Emilia Virtanen", "approved", "Mentor", false],
    ["Rasmus Berg", "invited", "General Admission", false],
    ["Nea Korhonen", "declined", "General Admission", false],
    ["Viljami Lehtonen", "approved", "General Admission", true],
    ["Aava Saarinen", "approved", "General Admission", false],
    ...crowd(104, 0, "General Admission", 3),
  ],
  "2026-09-12T08:00:00.000Z",
  "2026-10-03T06:12:00.000Z",
);

const talkGuests = guests(
  "gst-talk",
  [
    ["Hanna Niemi", "approved", "General Admission"],
    ["Leo Koskinen", "pending_approval", "General Admission"],
    ["Siiri Ahonen", "pending_approval", "General Admission"],
    ["Eino Laine", "waitlist", "General Admission"],
    ["Olivia Berg", "approved", "General Admission"],
    ["Matias Virtanen", "invited", "General Admission"],
    ...crowd(68, 300, "General Admission"),
  ],
  "2026-10-01T10:00:00.000Z",
  null,
);

const lovableGuests = guests(
  "gst-lovable",
  [
    ["Aada Korhonen", "approved", "General Admission", true],
    ["Onni Saarinen", "approved", "General Admission", true],
    ["Mila Lehtinen", "approved", "General Admission", true],
    ["Elias Makinen", "approved", "General Admission", true],
    ["Helmi Nieminen", "approved", "General Admission", true],
    ["Oliver Berg", "approved", "General Admission", true],
    ["Sofia Chen", "approved", "General Admission", true],
    ["Mikko Rantanen", "declined", "General Admission", false],
    ...crowd(143, 600, "General Admission", 4),
  ],
  "2026-03-02T09:00:00.000Z",
  "2026-03-28T08:05:00.000Z",
);

const hackForHumanity: LumaEvent = {
  apiId: "evt-h4h-finland",
  name: "Hack for Humanity: Finland",
  slug: "h4h-finland",
  description:
    "One day of fast, hands-on building with a purpose. Hosted by TRES and AI Collective at Tampere University, Hervanta.",
  startAt: "2026-10-03T06:00:00.000Z",
  endAt: "2026-10-03T18:00:00.000Z",
  timezone: "Europe/Helsinki",
  visibility: "public",
  status: "published",
  location: "Campus Areena aula, Korkeakoulunkatu 7, Tampere",
  pageUrl: "https://luma.com/h4h-finland",
  requireApproval: false,
  questions: generalQuestions,
  tickets: [
    {
      apiId: "tkt-h4h-general",
      name: "General Admission",
      priceCents: 0,
      currency: "EUR",
      sold: 0,
      capacity: 180,
    },
    {
      apiId: "tkt-h4h-mentor",
      name: "Mentor",
      priceCents: 0,
      currency: "EUR",
      sold: 0,
      capacity: 20,
    },
  ],
  hosts: [
    { apiId: "host-miska", name: "Miska Lunnas", role: "creator", avatar: "/avatars/miska.jpg" },
    {
      apiId: "host-mikko",
      name: "Mikko Kuivalainen",
      role: "check-in",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      apiId: "host-aj",
      name: "AJ Green",
      role: "manager",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    },
    {
      apiId: "host-bambi",
      name: "Bambi Dang",
      role: "manager",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    },
    {
      apiId: "host-michael",
      name: "Michael Vonlanthen",
      role: "manager",
      avatar: "https://randomuser.me/api/portraits/men/46.jpg",
    },
  ],
  guests: h4hGuests,
  insights: days("2026-09-20", [
    [48, 4],
    [61, 6],
    [44, 3],
    [90, 8],
    [110, 7],
    [86, 5],
    [132, 9],
    [101, 6],
    [154, 11],
    [128, 8],
    [176, 12],
    [149, 7],
    [210, 14],
    [238, 9],
  ]),
  blasts: [
    {
      apiId: "blast-h4h-doors",
      subject: "Doors open at 9:00 at Campus Areena",
      preview: "Bring a laptop. Teams form at the start, and mentors will be walking the floor.",
      sentAt: "2026-10-02T15:00:00.000Z",
      recipients: 14,
    },
  ],
};

const pohinaTalk: LumaEvent = {
  apiId: "evt-pohinatalk",
  name: "PöhinäTalk",
  slug: "pohinatalk",
  description:
    "A TRES evening for people building in Tampere. Talks, questions, and time to meet the room.",
  startAt: "2026-10-16T14:00:00.000Z",
  endAt: "2026-10-16T16:30:00.000Z",
  timezone: "Europe/Helsinki",
  visibility: "public",
  status: "published",
  location: "Tampere University, Hervanta Campus",
  pageUrl: null,
  requireApproval: true,
  questions: ["What are you working on?", "University or company"],
  tickets: [
    {
      apiId: "tkt-talk-general",
      name: "General Admission",
      priceCents: 0,
      currency: "EUR",
      sold: 0,
      capacity: 80,
    },
  ],
  hosts: [
    { apiId: "host-talk-tres", name: "TRES", role: "creator", avatar: "/brand/tres-mark.png" },
    {
      apiId: "host-talk-miska",
      name: "Miska Lunnas",
      role: "manager",
      avatar: "/avatars/miska.jpg",
    },
  ],
  guests: talkGuests,
  insights: days("2026-09-27", [
    [12, 1],
    [18, 0],
    [22, 2],
    [15, 1],
    [30, 2],
    [26, 1],
    [34, 1],
  ]),
  blasts: [],
};

const lovable: LumaEvent = {
  apiId: "evt-lovable-2026",
  name: "Lovable Vibe-Coding Hackathon",
  slug: "xdxwh8rd",
  description:
    "TR3S x Lovable. Ten hours of building at Kampus Areena for developers, designers, and anyone curious.",
  startAt: "2026-03-28T08:00:00.000Z",
  endAt: "2026-03-28T18:00:00.000Z",
  timezone: "Europe/Helsinki",
  visibility: "public",
  status: "published",
  location: "Kampusareena, Korkeakoulunkatu 7, Tampere",
  pageUrl: "https://luma.com/xdxwh8rd",
  requireApproval: false,
  questions: generalQuestions,
  tickets: [
    {
      apiId: "tkt-lovable-general",
      name: "General Admission",
      priceCents: 0,
      currency: "EUR",
      sold: 0,
      capacity: 160,
    },
  ],
  hosts: [
    { apiId: "host-lovable-tres", name: "TRES", role: "creator", avatar: "/brand/tres-mark.png" },
  ],
  guests: lovableGuests,
  insights: days("2026-03-15", [
    [40, 3],
    [55, 5],
    [38, 2],
    [72, 6],
    [66, 4],
    [81, 7],
    [94, 8],
    [70, 3],
    [120, 11],
    [140, 9],
    [98, 4],
    [160, 12],
    [150, 6],
    [188, 8],
  ]),
  blasts: [
    {
      apiId: "blast-lovable-thanks",
      subject: "Thanks for building with us",
      preview: "Photos and the winning projects are in the TRES Drive folder.",
      sentAt: "2026-03-29T09:00:00.000Z",
      recipients: 7,
    },
  ],
};

const hacknight: LumaEvent = {
  apiId: "evt-hacknight",
  name: "Hacknight",
  slug: "hacknight",
  description: "A weeknight build session with the TRES community. Still a draft on the calendar.",
  startAt: "2026-10-23T15:00:00.000Z",
  endAt: "2026-10-23T19:00:00.000Z",
  timezone: "Europe/Helsinki",
  visibility: "private",
  status: "draft",
  location: "Location to be announced",
  pageUrl: null,
  requireApproval: true,
  questions: ["What do you want to work on?"],
  tickets: [
    {
      apiId: "tkt-hacknight-general",
      name: "General Admission",
      priceCents: 0,
      currency: "EUR",
      sold: 0,
      capacity: 40,
    },
  ],
  hosts: [
    { apiId: "host-hacknight-tres", name: "TRES", role: "creator", avatar: "/brand/tres-mark.png" },
  ],
  guests: [],
  insights: days("2026-10-01", [
    [4, 0],
    [6, 0],
    [3, 0],
  ]),
  blasts: [],
};

export const demoCalendar = lumaCalendarSchema.parse({
  apiId: "cal-tres",
  name: "TRES Calendar",
  slug: "tres",
  url: "https://luma.com/tres",
  timezone: "Europe/Helsinki",
  syncedAt: "2026-10-03T11:04:00.000Z",
  events: [hackForHumanity, pohinaTalk, lovable, hacknight].map(withSales),
});
