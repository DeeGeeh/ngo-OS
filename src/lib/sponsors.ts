export const sponsorStages = [
  { id: "prospect", label: "Prospect", probability: 0.1 },
  { id: "contacted", label: "Contacted", probability: 0.3 },
  { id: "negotiating", label: "Negotiating", probability: 0.6 },
  { id: "committed", label: "Committed", probability: 1 },
] as const;

export type SponsorStage = (typeof sponsorStages)[number]["id"];
export type SponsorTier = "Main partner" | "Partner" | "Supporter";

export type SponsorActivity = { date: string; text: string };

export type Sponsor = {
  id: string;
  company: string;
  initials: string;
  contact: string;
  contactRole: string;
  email: string;
  amount: number;
  tier: SponsorTier;
  stage: SponsorStage;
  ownerId: string;
  nextStep: string;
  nextDate: string;
  lastTouch: string;
  projects: string[];
  activity: SponsorActivity[];
};

export const demoSponsors: Sponsor[] = [
  {
    id: "lovable",
    company: "Lovable",
    initials: "LV",
    contact: "Sara Lind",
    contactRole: "Community partnerships",
    email: "sara@lovable.example",
    amount: 3000,
    tier: "Main partner",
    stage: "committed",
    ownerId: "diar",
    nextStep: "Send the invoice and logo guidelines",
    nextDate: "2026-10-06",
    lastTouch: "2026-10-02",
    projects: ["Campus Builders"],
    activity: [
      { date: "2026-10-02", text: "Signed the partnership agreement" },
      { date: "2026-09-24", text: "Call about prizes and API credits" },
      { date: "2026-09-15", text: "First intro after the spring hackathon" },
    ],
  },
  {
    id: "tampere-foundation",
    company: "Tampere University Foundation",
    initials: "TU",
    contact: "Johanna Aalto",
    contactRole: "Grants coordinator",
    email: "johanna.aalto@tuni.example",
    amount: 4000,
    tier: "Main partner",
    stage: "committed",
    ownerId: "elias",
    nextStep: "Share the autumn event report",
    nextDate: "2026-10-20",
    lastTouch: "2026-09-29",
    projects: ["Founder Night", "Campus Builders"],
    activity: [
      { date: "2026-09-29", text: "Grant approved for the autumn season" },
      { date: "2026-09-10", text: "Application submitted" },
    ],
  },
  {
    id: "business-tampere",
    company: "Business Tampere",
    initials: "BT",
    contact: "Mikael Ström",
    contactRole: "Startup services",
    email: "mikael@businesstampere.example",
    amount: 5000,
    tier: "Main partner",
    stage: "negotiating",
    ownerId: "elias",
    nextStep: "Agree the logo placement for Founder Night",
    nextDate: "2026-10-08",
    lastTouch: "2026-10-01",
    projects: ["Founder Night"],
    activity: [
      { date: "2026-10-01", text: "Sent the partnership deck" },
      { date: "2026-09-26", text: "Coffee meeting at Platform6" },
    ],
  },
  {
    id: "reaktor",
    company: "Reaktor",
    initials: "RE",
    contact: "Ilona Heikkinen",
    contactRole: "Employer branding",
    email: "ilona@reaktor.example",
    amount: 2500,
    tier: "Partner",
    stage: "negotiating",
    ownerId: "aino",
    nextStep: "Confirm two mentors for Campus Builders",
    nextDate: "2026-10-12",
    lastTouch: "2026-09-30",
    projects: ["Campus Builders"],
    activity: [
      { date: "2026-09-30", text: "Interested in mentoring, not only money" },
      { date: "2026-09-18", text: "Intro from a TRES alumnus" },
    ],
  },
  {
    id: "tek",
    company: "TEK",
    initials: "TK",
    contact: "Petra Lehto",
    contactRole: "Student relations",
    email: "petra.lehto@tek.example",
    amount: 1500,
    tier: "Supporter",
    stage: "contacted",
    ownerId: "elias",
    nextStep: "Follow up about drinks for the sauna pitch night",
    nextDate: "2026-10-07",
    lastTouch: "2026-10-03",
    projects: [],
    activity: [{ date: "2026-10-03", text: "Asked about sponsoring the sauna pitch night" }],
  },
  {
    id: "sitra",
    company: "Sitra",
    initials: "SI",
    contact: "Antti Rautio",
    contactRole: "Programme lead",
    email: "antti.rautio@sitra.example",
    amount: 6000,
    tier: "Main partner",
    stage: "contacted",
    ownerId: "diar",
    nextStep: "Book an intro call",
    nextDate: "2026-10-03",
    lastTouch: "2026-09-27",
    projects: [],
    activity: [{ date: "2026-09-27", text: "Emailed about the spring impact programme" }],
  },
  {
    id: "futurice",
    company: "Futurice",
    initials: "FU",
    contact: "Not yet known",
    contactRole: "Find the right person",
    email: "hello@futurice.example",
    amount: 2000,
    tier: "Partner",
    stage: "prospect",
    ownerId: "noora",
    nextStep: "Find a contact through LinkedIn",
    nextDate: "2026-10-01",
    lastTouch: "2026-09-20",
    projects: ["Founder Night"],
    activity: [{ date: "2026-09-20", text: "Added to the pipeline" }],
  },
  {
    id: "vincit",
    company: "Vincit",
    initials: "VI",
    contact: "Not yet known",
    contactRole: "Find the right person",
    email: "info@vincit.example",
    amount: 1000,
    tier: "Supporter",
    stage: "prospect",
    ownerId: "leo",
    nextStep: "Ask alumni for an intro",
    nextDate: "2026-10-18",
    lastTouch: "2026-09-22",
    projects: [],
    activity: [{ date: "2026-09-22", text: "Added to the pipeline" }],
  },
];

export const euro = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
