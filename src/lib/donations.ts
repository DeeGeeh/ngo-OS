export type DonationCampaign = {
  slug: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  donors: number;
  createdAt: string;
};

export const demoCampaigns: DonationCampaign[] = [
  {
    slug: "hack-for-humanity",
    title: "Hack for Humanity 2027",
    description:
      "Help us bring 200 students together to build tools for local non-profits. Every euro goes to food, venue and travel grants.",
    goal: 5000,
    raised: 3240,
    donors: 86,
    createdAt: "2026-09-14",
  },
  {
    slug: "startup-world",
    title: "Startup World student tickets",
    description:
      "Help us bring 50 students to Startup World Tampere. Your donation covers tickets, travel and food.",
    goal: 1500,
    raised: 640,
    donors: 23,
    createdAt: "2026-09-30",
  },
  {
    slug: "student-grants",
    title: "Student founder micro-grants",
    description: "Small grants of 250 euros that help student teams build their first prototype.",
    goal: 10000,
    raised: 7150,
    donors: 142,
    createdAt: "2026-08-21",
  },
];

export const donationPresets = [10, 25, 50, 100] as const;

export function campaignSlug(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .trim()
    .replaceAll(/\s+/g, "-")
    .slice(0, 48);
  return base || "donate";
}

export function campaignPath(
  campaign: Pick<DonationCampaign, "slug" | "title" | "goal" | "description">,
): `/donate/${string}` {
  const params = new URLSearchParams({
    title: campaign.title,
    goal: String(campaign.goal),
    about: campaign.description,
  });
  return `/donate/${campaign.slug}?${params.toString()}`;
}
