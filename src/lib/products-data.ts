// "Products" are the long-lived memory layer. A product is the shared
// brain across every project, campaign, and persona that touches it:
// the brief, the USPs, the do-not-mention list, attached collateral,
// and an append-only edit history.
//
// In the Agentic OS, Spot reads from Products when it does persona
// research, drafts angles, or briefs the Creative Agent. Anything the
// user — or Spot — learns about a product gets written back here as
// a memory entry.

export type ProductMemoryEntry = {
  id: string;
  at: string; // ISO date, formatted on the client
  who: string; // "Spot" | a teammate name
  kind: "brief" | "usp" | "persona-link" | "creative-feedback" | "constraint";
  summary: string;
};

// Performance rolls up across every campaign tied to this product —
// these are the same shape ProjectItem used to carry. With Projects
// gone, Product *is* the unit you spend and report against.
export type ProductPerformance = {
  /** Window the numbers refer to. Display label only. */
  window: string;
  totalSpend: number;
  totalLeads: number;
  verifiedLeads: number;
  qualifiedLeads: number;
  avgCpl: number;
  costPerVerifiedLead: number;
  costPerQualifiedLead: number;
  verificationRate: number;
  qualificationRate: number;
  activeCampaigns: number;
  /** Health verdict Spot has called on the latest data. */
  health: "on-track" | "needs-attention" | "underperforming";
};

export type ProductSummary = {
  id: string;
  name: string;
  category: string;
  client: string;
  /** Short tagline / what the product *is*, in 1 line. */
  tagline: string;
  /** USPs — what makes it distinct. Spot leans on this when drafting copy. */
  usps: string[];
  /** Things never to claim — guarantees, legal, factual landmines. */
  avoid: string[];
  /** Linked personas, by id and name — soft references; personas live globally. */
  personas: { id: string; name: string }[];
  /** Attached collateral — brochures, decks, demo videos. */
  collateral: { name: string; kind: "pdf" | "deck" | "video"; size: string }[];
  /** Memory entries — chronological. Newest first when rendered. */
  memory: ProductMemoryEntry[];
  /** Coverage signal: how complete the memory is. 0..1. */
  readiness: number;
  /** Spend + leads rolled up from this product's campaigns. */
  performance: ProductPerformance;
  updatedAt: string;
};

export const PRODUCTS: ProductSummary[] = [
  {
    id: "prod-guyjus-jee",
    name: "Guyju's JEE Crack",
    category: "EdTech · Engineering Entrance Prep",
    client: "Guyju's",
    tagline: "Two-year JEE Mains + Advanced program for Class 11 students with live doubt-clearing and weekly mocks.",
    usps: [
      "Live cohort classes capped at 60 — every doubt answered in-class",
      "Weekly all-India mocks ranked against 1.2L+ JEE aspirants",
      "Personal study planner reviewed by an IIT-alum mentor",
      "Recordings available for 24 months · no time pressure",
    ],
    avoid: [
      "Don't promise specific ranks or guarantees",
      "Avoid comparisons to FIITJEE / Allen by name",
      "No 'best in India' superlatives — flagged by legal",
    ],
    personas: [
      { id: "pers-aspiring-engineer-parent", name: "The Aspiring Engineer Parent" },
      { id: "pers-self-studier", name: "The Self-Studier" },
      { id: "pers-coaching-hopper", name: "The Coaching Hopper" },
    ],
    collateral: [
      { name: "JEE Crack — Curriculum overview.pdf", kind: "pdf", size: "6.4 MB" },
      { name: "Mentor profiles deck.pdf", kind: "deck", size: "4.1 MB" },
      { name: "Demo class · Mechanics walkthrough.mp4", kind: "video", size: "118 MB" },
    ],
    memory: [
      {
        id: "m1",
        at: "2026-05-24",
        who: "Spot",
        kind: "creative-feedback",
        summary: "Mentor-led hook outperforms rank-focused hook by 31% on hold-rate. Rotated rank-focused to retargeting only.",
      },
      {
        id: "m2",
        at: "2026-05-20",
        who: "Ankit Purohit",
        kind: "constraint",
        summary: "Legal flagged 'guaranteed rank improvement' phrasing. Removed from approved copy list.",
      },
      {
        id: "m3",
        at: "2026-05-12",
        who: "Spot",
        kind: "persona-link",
        summary: "Linked 'The Coaching Hopper' persona — strong response on offline-to-online switch angle in tier-2 cities.",
      },
      {
        id: "m4",
        at: "2026-05-08",
        who: "Ankit Purohit",
        kind: "brief",
        summary: "Initial brief uploaded. USPs locked: live cohort, weekly mocks, IIT-alum mentors, 24-month access.",
      },
    ],
    readiness: 0.88,
    performance: {
      window: "Last 30 days",
      totalSpend: 642000,
      totalLeads: 1840,
      verifiedLeads: 612,
      qualifiedLeads: 248,
      avgCpl: 349,
      costPerVerifiedLead: 1049,
      costPerQualifiedLead: 2589,
      verificationRate: 33.3,
      qualificationRate: 13.5,
      activeCampaigns: 4,
      health: "on-track",
    },
    updatedAt: "2026-05-24",
  },
  {
    id: "prod-guyjus-neet",
    name: "Guyju's NEET Pro",
    category: "EdTech · Medical Entrance Prep",
    client: "Guyju's",
    tagline: "Two-year NEET prep with biology-first weekly mocks and one-on-one mentor sessions for Class 11/12.",
    usps: [
      "Biology-first curriculum — 60% of NEET marks come from one subject",
      "Bi-weekly 1:1 mentor sessions with an MBBS-alum",
      "AIIMS-grade mock papers · ranked all-India",
      "Performance dashboards parents can see weekly",
    ],
    avoid: [
      "Don't make medical-college admission claims",
      "Avoid Allen / Aakash comparisons",
    ],
    personas: [
      { id: "pers-aspiring-doctor-parent", name: "The Aspiring Doctor Parent" },
      { id: "pers-self-studier", name: "The Self-Studier" },
    ],
    collateral: [
      { name: "NEET Pro — Curriculum overview.pdf", kind: "pdf", size: "5.8 MB" },
      { name: "Sample mock — Biology.pdf", kind: "pdf", size: "2.3 MB" },
    ],
    memory: [
      {
        id: "m1",
        at: "2026-05-23",
        who: "Spot",
        kind: "creative-feedback",
        summary: "'Parents see weekly progress' hook is strongest opener — 2.1× CTR vs mentor-led. Locked as primary for cold cohorts.",
      },
      {
        id: "m2",
        at: "2026-05-15",
        who: "Spot",
        kind: "persona-link",
        summary: "Reused 'The Aspiring Parent' archetype — Doctor variant pulls 18% higher BOFU than Engineer.",
      },
    ],
    readiness: 0.74,
    performance: {
      window: "Last 30 days",
      totalSpend: 412000,
      totalLeads: 1240,
      verifiedLeads: 388,
      qualifiedLeads: 142,
      avgCpl: 332,
      costPerVerifiedLead: 1062,
      costPerQualifiedLead: 2901,
      verificationRate: 31.3,
      qualificationRate: 11.5,
      activeCampaigns: 2,
      health: "needs-attention",
    },
    updatedAt: "2026-05-23",
  },
  {
    id: "prod-guyjus-foundation",
    name: "Guyju's Foundation 9-10",
    category: "EdTech · K-12 Foundation",
    client: "Guyju's",
    tagline: "Class 9-10 foundation built for kids who want to clear JEE/NEET later — math + science with project labs.",
    usps: [
      "School-aligned (CBSE + ICSE) so it doesn't conflict with regular coursework",
      "Hands-on project labs every fortnight",
      "Builds early for JEE/NEET without burning out",
    ],
    avoid: [
      "Don't position as a school replacement",
      "Avoid 'pressure-free' framing — parents read it as unserious",
    ],
    personas: [
      { id: "pers-aspiring-engineer-parent", name: "The Aspiring Engineer Parent" },
    ],
    collateral: [
      { name: "Foundation 9-10 — Curriculum.pdf", kind: "pdf", size: "8.4 MB" },
    ],
    memory: [
      {
        id: "m1",
        at: "2026-05-18",
        who: "Ankit Purohit",
        kind: "brief",
        summary: "Brief uploaded. Awaiting persona research from Spot.",
      },
    ],
    readiness: 0.42,
    performance: {
      window: "Last 30 days",
      totalSpend: 233000,
      totalLeads: 696,
      verifiedLeads: 152,
      qualifiedLeads: 48,
      avgCpl: 335,
      costPerVerifiedLead: 1533,
      costPerQualifiedLead: 4854,
      verificationRate: 21.8,
      qualificationRate: 6.9,
      activeCampaigns: 2,
      health: "underperforming",
    },
    updatedAt: "2026-05-18",
  },
];

export function readinessLabel(r: number): { label: string; tone: "ok" | "warn" | "info" } {
  if (r >= 0.8) return { label: "Memory complete", tone: "ok" };
  if (r >= 0.6) return { label: "Mostly briefed", tone: "info" };
  return { label: "Needs more research", tone: "warn" };
}
