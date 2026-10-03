export const product = {
  name: "Nest",
  tagline: "The operating system for non-profits",
  markLight: "/brand/svg/nest-mark-blue.svg",
  markDark: "/brand/svg/nest-mark-white.svg",
};

export type Organization = {
  id: string;
  name: string;
  kind: string;
  location: string;
  initials: string;
  tone: string;
  logo?: string;
};

export const organizations = [
  {
    id: "tres",
    name: "TRES",
    kind: "Entrepreneurship society",
    location: "Tampere, Finland",
    initials: "TR",
    tone: "bg-sky-600 text-white",
    logo: "/brand/tres-mark.png",
  },
  {
    id: "aurora-aid",
    name: "Aurora Aid",
    kind: "Humanitarian relief",
    location: "Oulu, Finland",
    initials: "AA",
    tone: "bg-emerald-600 text-white",
  },
  {
    id: "green-roots",
    name: "Green Roots",
    kind: "Environmental network",
    location: "Turku, Finland",
    initials: "GR",
    tone: "bg-amber-600 text-white",
  },
] satisfies Organization[];

export const defaultOrganizationId = "tres";
