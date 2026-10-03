import type { Metadata } from "next";

import { demoCampaigns } from "@/lib/donations";

import { DonatePage } from "./_components/donate-page";

type DonateParams = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function resolveCampaign({ params, searchParams }: DonateParams) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const known = demoCampaigns.find((campaign) => campaign.slug === slug);
  const goal = Number(single(query.goal));
  return {
    slug,
    title: single(query.title) ?? known?.title ?? "Support TRES",
    description:
      single(query.about) ??
      known?.description ??
      "Every donation helps students in Tampere build, learn and start something new.",
    goal: Number.isFinite(goal) && goal > 0 ? goal : (known?.goal ?? 1000),
    raised: known?.raised ?? 0,
    donors: known?.donors ?? 0,
  };
}

export async function generateMetadata(props: DonateParams): Promise<Metadata> {
  const campaign = await resolveCampaign(props);
  return { title: `Donate · ${campaign.title}`, description: campaign.description };
}

export default async function DonateRoute(props: DonateParams) {
  const campaign = await resolveCampaign(props);
  return <DonatePage campaign={campaign} organizationName="TRES" />;
}
