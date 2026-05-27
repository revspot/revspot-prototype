import type { SpotMessage } from "./types";

// Spot launch workflow — types + mock content per step.
//
// The workflow has a fixed step sequence. The right-pane on /spot renders
// the step's UI; the left-pane chat narrates each phase. The user
// approves at each step, which seeds a Spot message and advances state.
//
// Steps:
//   1. product-setup  — new product memory (only when no existing product)
//   2. kickoff        — Spot greets, summarises what it knows about the product
//   3. personas       — pull existing personas, recommend new ones, approve
//   4. budget         — user inputs first-week budget
//   4b. media-plan    — Spot generates a plan across channels, approve
//   5. angles         — Spot drafts angles per persona, user approves
//   6. forms          — landing page + lead forms readiness, approve
//   7. campaigns      — campaign-set-ad structure ready to deploy

export type WorkflowStep =
  | "deep-research" // Spot doesn't know the product yet; auto-researches.
  | "product-setup"
  | "kickoff"
  | "personas"
  | "media-plan"
  | "angles"
  | "forms"
  | "campaigns"
  | "done";

export const STEP_ORDER: WorkflowStep[] = [
  "deep-research",
  "product-setup",
  "kickoff",
  "personas",
  "media-plan",
  "angles",
  "forms",
  "campaigns",
  "done",
];

/** Labels used in the step indicator at the top of the workspace pane. */
export const STEP_LABELS: Record<WorkflowStep, string> = {
  "deep-research": "Deep research",
  "product-setup": "Product memory",
  kickoff: "Kickoff",
  personas: "Personas",
  "media-plan": "Media plan",
  angles: "Creatives",
  forms: "Forms & pages",
  campaigns: "Campaign structure",
  done: "Live",
};

/** Steps that show in the visible step rail. */
export const VISIBLE_STEPS: WorkflowStep[] = [
  "kickoff",
  "personas",
  "media-plan",
  "angles",
  "forms",
  "campaigns",
];

export type WorkflowBudget = {
  amountInr: number;
  days: number;
};

export type WorkflowApprovals = {
  personaIds: string[];
  angleIds: string[];
  formIds: string[];
};

/** Memory Spot synthesises on the fly during deep research. */
export type ResearchedMemory = {
  tagline: string;
  usps: string[];
  avoid: string[];
  sources: string[];
};

export type LaunchWorkflow = {
  kind: "launch-campaign";
  step: WorkflowStep;
  /** The product this launch is for. null while in deep-research / product-setup. */
  productId: string | null;
  productName: string;
  budget: WorkflowBudget | null;
  approvals: WorkflowApprovals;
  /** Stamped when workflow started — used for "started X ago" labels. */
  startedAt: number;
  /** Memory Spot researched live (only set when productId is null). */
  researchedMemory: ResearchedMemory | null;
  /**
   * Whether the kickoff canvas has finished its "Memory Reader" loader.
   * Defaults to false at the start of `startLaunchFlow`; flips to true
   * after the fake API delay so the canvas reveals the content.
   */
  kickoffReady: boolean;
};

export const EMPTY_APPROVALS: WorkflowApprovals = {
  personaIds: [],
  angleIds: [],
  formIds: [],
};

export function nextStep(step: WorkflowStep): WorkflowStep {
  const i = STEP_ORDER.indexOf(step);
  if (i < 0 || i >= STEP_ORDER.length - 1) return "done";
  return STEP_ORDER[i + 1];
}

/* ─── Mock content per step ───────────────────────────────────── */

export type RecommendedPersona = {
  id: string;
  name: string;
  rationale: string;
  /** Where this persona has worked before. */
  evidence: string;
  selected: boolean;
};

export const SAMPLE_EXISTING_PERSONAS = [
  { id: "pers-aspiring-engineer-parent", name: "The Aspiring Engineer Parent", note: "Strong winner on JEE Crack last quarter" },
  { id: "pers-aspiring-doctor-parent", name: "The Aspiring Doctor Parent", note: "Biology-first hook hits hard on NEET cohort" },
  { id: "pers-self-studier", name: "The Self-Studier", note: "Cheap leads from tier-2/3 cities, lower BOFU" },
];

export const SAMPLE_RECOMMENDED_PERSONAS: RecommendedPersona[] = [
  {
    id: "rec-investor",
    name: "The Plot-Investor",
    rationale: "Tier-2 city HNI with no immediate move plan — buys for appreciation.",
    evidence: "Spot saw 18% lift on similar Bangalore N. corridor product",
    selected: true,
  },
  {
    id: "rec-second-home",
    name: "The Second-Home Buyer",
    rationale: "Mumbai/Pune buyer looking for a Bangalore second home.",
    evidence: "Cross-product fit: Yelahanka + Banerghatta show overlap",
    selected: false,
  },
];

/**
 * The user-facing list of "personas Spot recommends for this launch".
 * Combines existing personas (already in the library) with net-new
 * proposals. From the user's POV they're all just "recommended" — the
 * platform takes care of writing the new ones to the library on
 * approval.
 */
export type LaunchPersona = {
  id: string;
  name: string;
  rationale: string;
  /** Already in the global personas library vs. proposed by Spot for this run. */
  origin: "existing" | "new";
};

/** Insight derived from past memory — colour matches the tone of the lift. */
export type PersonaInsight = {
  icon: "trophy" | "trending" | "layers";
  label: string;
  /** Mild = info pill, strong = ok pill, warn = warn pill. */
  tone: "strong" | "mild" | "warn";
};

export const LAUNCH_PERSONAS: (LaunchPersona & {
  insights: PersonaInsight[];
  hue: number;
  avatarLetters: string;
})[] = [
  {
    id: "pers-aspiring-engineer-parent",
    name: "The Aspiring Engineer Parent",
    rationale: "Mentor-led hook held strongest on Class 11 parent cohort last quarter.",
    origin: "existing",
    hue: 215,
    avatarLetters: "EP",
    insights: [
      { icon: "trophy", label: "Best CPL · ₹312 on JEE Crack", tone: "strong" },
      { icon: "trending", label: "BOFU 2.1× workspace avg", tone: "strong" },
      { icon: "layers", label: "Spans 2 products", tone: "mild" },
    ],
  },
  {
    id: "pers-self-studier",
    name: "The Self-Studier",
    rationale: "Tier-2/3 cities. Doubt-clearing hook works; quality lower but volume high.",
    origin: "existing",
    hue: 40,
    avatarLetters: "SS",
    insights: [
      { icon: "trending", label: "Lowest CPL · ₹186", tone: "strong" },
      { icon: "trending", label: "BOFU 0.6× avg", tone: "warn" },
      { icon: "layers", label: "Spans 2 products", tone: "mild" },
    ],
  },
  {
    id: "pers-coaching-hopper",
    name: "The Coaching Hopper",
    rationale: "Class 11/12 students switching from offline coaching — high intent, premium AOV.",
    origin: "existing",
    hue: 290,
    avatarLetters: "CH",
    insights: [
      { icon: "trophy", label: "Highest AOV · ₹68K", tone: "strong" },
      { icon: "trending", label: "+22% CTR on Reels", tone: "strong" },
      { icon: "layers", label: "Retargeting layer", tone: "mild" },
    ],
  },
  {
    id: "rec-school-counsellor",
    name: "The School Counsellor Referral",
    rationale: "CBSE counsellors who push 8–9 kids to the program a year.",
    origin: "new",
    hue: 145,
    avatarLetters: "SC",
    insights: [
      { icon: "trending", label: "+22% lift on NEET Pro last qtr", tone: "strong" },
      { icon: "layers", label: "First test on JEE Crack", tone: "mild" },
    ],
  },
];

// Each channel can carry several *ad types* (lead form, click-to-WA,
// landing page, etc). The plan is now per-channel × per-ad-type, with
// a per-ad-type availability flag — e.g. click-to-WhatsApp is unavailable
// when the WhatsApp account isn't connected.
export type AdTypeAvailability = "available" | "needs-connection" | "coming-soon";

export type ChannelPlan = {
  channel: "Meta Ads" | "Google Ads" | "WhatsApp Agent" | "Voice AI · Outreach" | "LinkedIn Ads" | "Email & RCS";
  iconKey: "meta" | "google" | "whatsapp" | "voice" | "linkedin" | "email";
  share: number; // share of total budget
  rationale: string;
  adTypes: {
    name: string;
    description: string;
    personas: string[]; // persona names targeted
    availability: AdTypeAvailability;
    /** Human readable budget within this channel. */
    budgetShare: number; // share of channel budget
  }[];
};

export function generateChannelPlans(
  budget: number,
  whatsAppConnected: boolean = false,
): ChannelPlan[] {
  return [
    {
      channel: "Meta Ads",
      iconKey: "meta",
      share: 0.55,
      rationale: "Strongest BOFU on parent personas. Three ad-type variants split across cohorts.",
      adTypes: [
        {
          name: "Lead form ads",
          description: "Native Meta lead form · pre-filled name + phone, instant-WhatsApp follow-up via Voice Agent.",
          personas: ["Engineer Parent", "Doctor Parent"],
          availability: "available",
          budgetShare: 0.5,
        },
        {
          name: "Click-to-WhatsApp",
          description: whatsAppConnected
            ? "Tap → WhatsApp Business · counsellor flow handled by WhatsApp Agent."
            : "Tap → WhatsApp Business · needs WhatsApp Business account connected.",
          personas: ["Engineer Parent", "Self-Studier"],
          availability: whatsAppConnected ? "available" : "needs-connection",
          budgetShare: 0.3,
        },
        {
          name: "Landing page",
          description: "Tap → branded landing page with demo-class booking + curriculum preview.",
          personas: ["Engineer Parent", "Coaching Hopper"],
          availability: "available",
          budgetShare: 0.2,
        },
      ],
    },
    {
      channel: "Google Ads",
      iconKey: "google",
      share: 0.22,
      rationale: "Captures high-intent search — 'JEE coaching online', competitor brand bidding (Allen, Aakash).",
      adTypes: [
        {
          name: "Search · category + brand",
          description: "Brand defense + 'JEE online coaching' queries · landing page CTA.",
          personas: ["Engineer Parent", "Coaching Hopper"],
          availability: "available",
          budgetShare: 0.6,
        },
        {
          name: "Performance Max",
          description: "Asset-fed PMax across Search, YouTube, Discovery, Gmail.",
          personas: ["Engineer Parent", "Self-Studier"],
          availability: "available",
          budgetShare: 0.4,
        },
      ],
    },
    {
      channel: "Voice AI · Outreach",
      iconKey: "voice",
      share: 0.1,
      rationale: "Outbound calls on warm leads · parent cohort works best for high-touch follow-up.",
      adTypes: [
        {
          name: "Voice outbound · parents",
          description: "Calls placed by Voice AI agent on enriched parent contacts from Revspot graph.",
          personas: ["Engineer Parent", "Doctor Parent"],
          availability: "available",
          budgetShare: 1,
        },
      ],
    },
    {
      channel: "WhatsApp Agent",
      iconKey: "whatsapp",
      share: 0.08,
      rationale: "Post-lead-fill nurture sequence; also picks up Click-to-WA conversations from Meta.",
      adTypes: [
        {
          name: "Nurture sequence",
          description: whatsAppConnected
            ? "Multi-turn qualification + demo-class booking via WhatsApp Agent."
            : "Multi-turn qualification — needs WhatsApp Business connected.",
          personas: ["Engineer Parent", "Doctor Parent", "Self-Studier"],
          availability: whatsAppConnected ? "available" : "needs-connection",
          budgetShare: 1,
        },
      ],
    },
    {
      channel: "LinkedIn Ads",
      iconKey: "linkedin",
      share: 0.05,
      rationale: "Engineer-parent lookalike — fathers of Class 9–12 students. Lower volume, premium CPL.",
      adTypes: [
        {
          name: "Sponsored content · lookalike",
          description: "LinkedIn lookalike on engineering managers / staff engineers in tier-1 cities.",
          personas: ["Engineer Parent"],
          availability: "available",
          budgetShare: 1,
        },
      ],
    },
  ];
}

export type AnglePack = {
  personaId: string;
  personaName: string;
  angles: {
    id: string;
    hook: string;
    cta: string;
    format: "Static" | "Reel" | "Carousel";
  }[];
};

export const SAMPLE_ANGLES: AnglePack[] = [
  {
    personaId: "pers-aspiring-engineer-parent",
    personaName: "The Aspiring Engineer Parent",
    angles: [
      { id: "ang-aep-1", hook: "Watch your kid solve a JEE problem this week", cta: "Book demo class", format: "Reel" },
      { id: "ang-aep-2", hook: "IIT-alum mentors · class size capped at 60", cta: "See sample class", format: "Static" },
      { id: "ang-aep-3", hook: "Parent dashboard — see weekly mock rankings", cta: "Try it free for a week", format: "Carousel" },
    ],
  },
  {
    personaId: "pers-self-studier",
    personaName: "The Self-Studier",
    angles: [
      { id: "ang-ss-1", hook: "Doubt-clearing in 15 minutes · live", cta: "Join the next class", format: "Reel" },
      { id: "ang-ss-2", hook: "Recordings stay live for 24 months", cta: "See library tour", format: "Static" },
      { id: "ang-ss-3", hook: "Rank against 1.2L+ JEE aspirants", cta: "Take a free mock", format: "Static" },
    ],
  },
  {
    personaId: "pers-coaching-hopper",
    personaName: "The Coaching Hopper",
    angles: [
      { id: "ang-ch-1", hook: "Switching from offline coaching mid-year? Here's how", cta: "Book a 1:1 call", format: "Static" },
      { id: "ang-ch-2", hook: "Mentor 1:1 every fortnight — actually heard", cta: "Meet the mentors", format: "Carousel" },
    ],
  },
];

export type FormAsset = {
  id: string;
  name: string;
  kind: "lead-form" | "landing-page";
  status: "drafted" | "ready" | "needs-review";
  personaId: string;
  personaName: string;
};

export const SAMPLE_FORMS: FormAsset[] = [
  { id: "form-aep-1", name: "Engineer Parent · demo class form", kind: "lead-form", status: "ready", personaId: "pers-aspiring-engineer-parent", personaName: "Engineer Parent" },
  { id: "form-aep-2", name: "Engineer Parent · curriculum landing", kind: "landing-page", status: "drafted", personaId: "pers-aspiring-engineer-parent", personaName: "Engineer Parent" },
  { id: "form-ss-1", name: "Self-Studier · free-mock opt-in", kind: "lead-form", status: "ready", personaId: "pers-self-studier", personaName: "Self-Studier" },
  { id: "form-ss-2", name: "Self-Studier · library tour landing", kind: "landing-page", status: "needs-review", personaId: "pers-self-studier", personaName: "Self-Studier" },
  { id: "form-ch-1", name: "Coaching Hopper · 1:1 call landing", kind: "landing-page", status: "ready", personaId: "pers-coaching-hopper", personaName: "Coaching Hopper" },
];

export type CampaignStructure = {
  id: string;
  name: string;
  channel: "Meta" | "Google";
  budgetInr: number;
  adsets: {
    id: string;
    name: string;
    personaName: string;
    adsCount: number;
  }[];
};

export const SAMPLE_STRUCTURE: CampaignStructure[] = [
  {
    id: "draft-c1",
    name: "JEE Crack · Cold · Meta",
    channel: "Meta",
    budgetInr: 250000,
    adsets: [
      { id: "ds-1", name: "Engineer Parent · 36-48 · tier-1 metros", personaName: "Engineer Parent", adsCount: 3 },
      { id: "ds-2", name: "Self-Studier · 16-19 · tier-2/3 India", personaName: "Self-Studier", adsCount: 3 },
      { id: "ds-3", name: "Coaching Hopper · 16-18 · Kota + Hyderabad", personaName: "Coaching Hopper", adsCount: 2 },
    ],
  },
  {
    id: "draft-c2",
    name: "JEE Crack · Search · Google",
    channel: "Google",
    budgetInr: 120000,
    adsets: [
      { id: "ds-4", name: "Brand + 'JEE online coaching' queries", personaName: "Mixed", adsCount: 4 },
      { id: "ds-5", name: "Competitor brand · Allen/Aakash queries", personaName: "Mixed", adsCount: 4 },
    ],
  },
  {
    id: "draft-c3",
    name: "JEE Crack · Lookalike · Meta",
    channel: "Meta",
    budgetInr: 80000,
    adsets: [
      { id: "ds-6", name: "1% Lookalike — top demo-class attendees 30d", personaName: "Engineer Parent", adsCount: 2 },
    ],
  },
];

/* ─── Tool-call narration ──────────────────────────────────────
 *
 * Each step transition fires a fake "agent dispatch" — Spot says
 * "Calling Persona Researcher…" with a spinner before the next
 * step's content lands. Makes the platform feel like there's a team
 * of agents being spawned, which is the actual product mental model.
 */

export type StepToolCall = {
  agent: string;
  detail: string;
  /** ms to keep the spinner running before the next step's intro lands. */
  delayMs: number;
};

export const STEP_TOOL_CALL: Partial<Record<WorkflowStep, StepToolCall>> = {
  personas: {
    agent: "personas.lookup",
    detail: "scanning library + cross-product audience graph…",
    delayMs: 3800,
  },
  "media-plan": {
    agent: "media.plan",
    detail: "splitting baseline budget across channels by persona payoff…",
    delayMs: 4200,
  },
  angles: {
    agent: "creative.brief",
    detail: "drafting 3 angles per persona + queueing the asset generator…",
    delayMs: 4500,
  },
  forms: {
    agent: "forms.draft",
    detail: "generating per-persona lead forms + landing-page mocks…",
    delayMs: 3800,
  },
  campaigns: {
    agent: "campaigns.compile",
    detail: "compiling campaign → ad-set → ad tree on Meta and Google…",
    delayMs: 4200,
  },
  done: {
    agent: "deploy.push",
    detail: "pushing to Meta and Google ad accounts…",
    delayMs: 4800,
  },
};

/* ─── Step intro chat messages ──────────────────────────────────
 *
 * Each step entry appends a Spot message into the chat. The message
 * narrates what's happening on the right pane *and* carries the
 * inline step-cta button — actions live in the chat, not the canvas.
 */

export function stepIntroMessage(
  step: WorkflowStep,
  w: LaunchWorkflow,
): SpotMessage | null {
  switch (step) {
    case "personas":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: "Here's the mix I'd run. Three from your library that already win on this product, plus one net-new worth testing. Tick the ones you want me to use.",
          },
          {
            type: "step-cta",
            label: "Approve & continue",
            helper: "I'll save the new persona to your library and start the media plan.",
            refineHint: "or describe a different cohort",
          },
        ],
      };
    case "media-plan":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: "Plan's on the right — split per channel with ad types and persona targeting. **Click-to-WhatsApp** is greyed out (needs a WhatsApp Business account). No budget set yet, so I'm running this as a baseline experiment.",
          },
          {
            type: "step-cta",
            label: "Approve plan, start creatives",
            helper: "Creative Agent briefs itself once you approve.",
            refineHint: "or type a weekly budget · e.g. \"₹4L/week\"",
          },
        ],
      };
    case "angles":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: "Creatives are spinning up — you'll see the hero asset first, then resized variants attach to each campaign.",
          },
          {
            type: "step-cta",
            label: "Looks good, build forms",
            helper: "I'll spin up landing pages + lead forms next.",
          },
        ],
      };
    case "forms":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: "Lead forms + landing pages + click-to-WhatsApp scripts ready. Hover any tile to preview.",
          },
          {
            type: "step-cta",
            label: "Approve & finalize structure",
            helper: "Last step — the campaign → ad set → ad tree.",
          },
        ],
      };
    case "campaigns":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: "3 campaigns, mapped to your approved personas. Once I deploy, edits go through me — Revspot stays read-only on Meta + Google.",
          },
          {
            type: "step-cta",
            label: "Deploy to Meta + Google",
            helper: "I'll push live and mirror data on /campaigns within a few minutes.",
          },
        ],
      };
    case "done":
      return {
        role: "spot",
        parts: [
          { type: "headline", text: `${w.productName} is live.`, verdict: "ok" },
          {
            type: "text",
            text: "Track it on **Campaigns**. I'll watch for drift and surface fixes here.",
          },
        ],
      };
    default:
      return null;
  }
}
