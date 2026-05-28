// Diagnostic Spot workflows — Scale · Optimize · Test New Angles.
//
// The mental model is "Claude does the heavy lifting, the human approves
// once". So each workflow has only THREE steps, not four-or-more:
//
//   1. clarify  — Spot asks 2-3 quick questions to lock the brief,
//                 user verifies. On the right pane, a Brief card fills
//                 in as questions get answered.
//   2. plan     — Spot autonomously runs the analysis (memory.read +
//                 personas.fetch + creative.audit + competitor.scan +
//                 plan.build, all in parallel) and presents ONE plan
//                 with a time-phased structure (Week 1 / Week 2 / Week
//                 3, what Spot will do, what it'll observe, the
//                 decision points and guardrails). User approves once.
//   3. live     — Plan is running. Canvas shows the active phase, the
//                 timeline, and recommendations Spot has surfaced for
//                 human approval (those also feed the dashboard).
//
// This file holds:
//   · Clarifying questions per workflow kind
//   · Time-phased plan templates per workflow kind
//   · Pending recommendations Spot surfaces during live execution
//   · Step ordering + labels + tool-call narration + intro messages
//
// All copy is Guyju's-themed (EdTech) so the demo holds together.

import type { SpotMessage } from "./types";

/* ────────────────────────────────────────────────────────────────
 * SHARED TYPES
 * ──────────────────────────────────────────────────────────────── */

export type ClarifyOption = {
  /** Stable id used in answers map. */
  value: string;
  /** Display label on the chip. */
  label: string;
  /** Optional one-liner for context (shown on hover or under chip). */
  hint?: string;
};

export type ClarifyQuestion = {
  /** Stable id used as the key in the answers map. */
  id: string;
  /** The question Spot is asking. */
  question: string;
  /** Tight one-liner under the question explaining the why. */
  why?: string;
  /** Quick-pick options. */
  options: ClarifyOption[];
  /** Pre-selected option id. */
  defaultValue: string;
  /** Allow a free-text override after a chip is selected. */
  allowFreeText?: boolean;
};

export type PlanInsight = {
  /** Short headline — what Spot found. */
  title: string;
  /** Evidence behind the insight. */
  detail: string;
  /** Tone drives the colour. */
  tone: "good" | "warn" | "neutral";
};

export type PlanPhase = {
  id: string;
  /** "Week 1" / "Weeks 1-2" etc. */
  week: string;
  /** Date label — Spot computes from "today". */
  dates: string;
  /** Phase title. */
  title: string;
  /** Bullet list of what Spot will actually do this phase. */
  actions: string[];
  /** What Spot watches during this phase to inform the next decision. */
  observes: string[];
  /** When Spot will make a call. Null on the final phase. */
  decisionAt?: string;
  /** Decision tree branches — "if X, do Y". */
  decisionRule?: string;
};

export type WorkflowPlan = {
  /** One-line statement of the goal Spot is chasing. */
  goal: string;
  /** 3-4 insights from the analysis Spot just ran. */
  insights: PlanInsight[];
  /** 3 phases over 2-3 weeks. */
  phases: PlanPhase[];
  /** Automatic safety rules Spot enforces without asking. */
  guardrails: string[];
  /** When + how Spot will report progress back to the user. */
  reportingCadence: string;
};

export type PendingRecommendation = {
  id: string;
  /** Which workflow this came from. */
  sourceKind: "scale" | "optimize" | "test-angles" | "launch-campaign";
  sourceProduct: string;
  /** When Spot surfaced it — humanised. */
  surfacedAt: string;
  /** Imperative ("Pause X", "Lift budget on Y"). */
  title: string;
  /** One-liner detail. */
  detail: string;
  /** Evidence Spot is using to justify the rec. */
  evidence: string[];
  /** Projected impact if approved. */
  projectedImpact: string;
  /** Urgency — drives the dashboard sort + colour. */
  urgency: "high" | "medium" | "low";
};

/* ────────────────────────────────────────────────────────────────
 * CLARIFYING QUESTIONS
 *
 * Three questions per workflow kind — enough to constrain Spot's plan
 * meaningfully without overwhelming the user. Each question pre-picks
 * the default Spot would have chosen anyway (so the fastest path is
 * "scroll, confirm, go").
 * ──────────────────────────────────────────────────────────────── */

export const SCALE_QUESTIONS: ClarifyQuestion[] = [
  {
    id: "goal",
    question: "What's the primary goal of scaling?",
    why: "Determines whether I optimise for volume, cost, or audience expansion.",
    options: [
      { value: "more-leads", label: "More leads · same quality", hint: "Scale volume on what's already winning" },
      { value: "lower-cpl", label: "Lower CPL at current volume", hint: "Efficiency before expansion" },
      { value: "expand-personas", label: "Expand to new personas", hint: "Open new audience layers" },
      { value: "geo-expand", label: "Expand to new geographies", hint: "Replicate winners in new metros" },
    ],
    defaultValue: "more-leads",
  },
  {
    id: "budget",
    question: "Weekly budget headroom?",
    why: "Caps how aggressive the staged lifts can be.",
    options: [
      { value: "2L", label: "Up to ₹2L / week" },
      { value: "4L", label: "₹2–4L / week" },
      { value: "8L", label: "₹4–8L / week" },
      { value: "open", label: "No fixed ceiling" },
    ],
    defaultValue: "4L",
  },
  {
    id: "guardrails",
    question: "Any constraints I should respect?",
    why: "Things I won't touch even if the data suggests I should.",
    options: [
      { value: "none", label: "No constraints" },
      { value: "preserve", label: "Don't touch current best performers" },
      { value: "conservative", label: "Move slowly · max 25% lift per week" },
      { value: "weekends", label: "No deploys on weekends" },
    ],
    defaultValue: "preserve",
  },
];

export const OPTIMIZE_QUESTIONS: ClarifyQuestion[] = [
  {
    id: "priority",
    question: "What's the priority?",
    why: "Determines what I fix first when multiple issues compete.",
    options: [
      { value: "cpl", label: "Bring CPL down", hint: "Pause fatigued creative · counter-position on pricing" },
      { value: "quality", label: "Improve lead quality", hint: "Refine targeting · fix qualification rate" },
      { value: "fix-decay", label: "Stop the recent decay", hint: "Restore what was working two weeks ago" },
      { value: "everything", label: "Fix all of it · I'll pick" },
    ],
    defaultValue: "fix-decay",
  },
  {
    id: "scope",
    question: "Which campaigns are in scope?",
    why: "I can scope this to recent decay only, or include chronic losers too.",
    options: [
      { value: "decay", label: "Recent decay only" },
      { value: "chronic", label: "Chronic losers only" },
      { value: "both", label: "Both — full sweep" },
    ],
    defaultValue: "both",
  },
  {
    id: "autonomy",
    question: "How autonomous should I be?",
    why: "Some fixes are reversible (creative rotation); some aren't (landing page rebuild).",
    options: [
      { value: "ship-small", label: "Auto-ship small · ask before big", hint: "Recommended" },
      { value: "ask-everything", label: "Ask before every change" },
      { value: "ship-all", label: "Ship everything · within guardrails" },
    ],
    defaultValue: "ship-small",
  },
];

export const ANGLES_QUESTIONS: ClarifyQuestion[] = [
  {
    id: "focus",
    question: "Which persona should I focus angles on?",
    why: "Different personas need different framing — better to pick than spray.",
    options: [
      { value: "engineer-parent", label: "The Aspiring Engineer Parent" },
      { value: "self-studier", label: "The Self-Studier" },
      { value: "coaching-hopper", label: "The Coaching Hopper" },
      { value: "all", label: "All three · cross-cutting test" },
    ],
    defaultValue: "engineer-parent",
  },
  {
    id: "format",
    question: "Which creative formats?",
    why: "Drives what I'll brief the Creative Agent on.",
    options: [
      { value: "video", label: "Video / Reels only" },
      { value: "static", label: "Static + Carousel only" },
      { value: "mixed", label: "Mix · video + static" },
    ],
    defaultValue: "mixed",
  },
  {
    id: "test-spend",
    question: "How much weekly spend on the A/B test?",
    why: "Determines how fast we'll get a directional read.",
    options: [
      { value: "low", label: "₹20K / week", hint: "Slower · 14-day signal" },
      { value: "med", label: "₹40K / week", hint: "Recommended · 10-day signal" },
      { value: "high", label: "₹80K / week", hint: "Fast · 7-day signal" },
    ],
    defaultValue: "med",
  },
];

/** Convenience lookup. */
export function clarifyQuestionsFor(
  kind: "scale" | "optimize" | "test-angles",
): ClarifyQuestion[] {
  if (kind === "scale") return SCALE_QUESTIONS;
  if (kind === "optimize") return OPTIMIZE_QUESTIONS;
  return ANGLES_QUESTIONS;
}

/** Render a captured answer (for the verification card). */
export function answerLabel(
  kind: "scale" | "optimize" | "test-angles",
  questionId: string,
  value: string,
): string {
  const q = clarifyQuestionsFor(kind).find((q) => q.id === questionId);
  return q?.options.find((o) => o.value === value)?.label ?? value;
}

/* ────────────────────────────────────────────────────────────────
 * TIME-PHASED PLANS
 *
 * One plan per workflow kind. The "element of time" the user asked for
 * is the explicit Week 1 / Week 2 / Week 3 structure — Spot doesn't
 * just say "ship the fix", it commits to a watching window and a
 * decision date.
 *
 * Dates are illustrative — in a real product Spot would compute them
 * relative to "today" (workflow.startedAt).
 * ──────────────────────────────────────────────────────────────── */

export const SCALE_PLAN: WorkflowPlan = {
  goal:
    "Grow qualified-lead volume 35–45% over 3 weeks while keeping CPL drift under 10%.",
  insights: [
    {
      title: "Two winning ad sets have real headroom",
      detail:
        "Engineer Parent × Mentor-led hook and Self-Studier × Doubt-clearing reel are sitting at 28% and 52% saturation respectively — significant room before reach plateaus.",
      tone: "good",
    },
    {
      title: "1% LAL seed cohort just crossed the threshold",
      detail:
        "Qualified-lead cohort hit 248 (Meta needs 1k seed; our verified+qualified pool is 860). Sharper LAL than the one currently running on visitors.",
      tone: "good",
    },
    {
      title: "Brand Search is severely underspent",
      detail:
        "₹38K against ₹98K total Google spend — defending brand queries at ~100% intent, but we're losing ~31% of branded impressions to category bidders.",
      tone: "warn",
    },
    {
      title: "Stories placement untouched on winning Reels",
      detail:
        "Top 2 Reels run on Feed only. Workspace benchmarks show +18% CTR on Stories for video-led EdTech creative.",
      tone: "neutral",
    },
  ],
  phases: [
    {
      id: "p1",
      week: "Week 1",
      dates: "May 28 – Jun 3",
      title: "Stage 1 lift · build the LAL seed",
      actions: [
        "Lift budget +25% on Engineer Parent × Mentor-led hook (staggered over 3 days)",
        "Lift budget +25% on Self-Studier × Doubt-clearing reel",
        "Brief the LAL audience from the 860-strong verified+qualified cohort",
        "Open Brand Search defense budget cap by 2.4× (₹38K → ₹92K)",
      ],
      observes: [
        "CPL drift on lifted ad sets · expecting ≤ 8%",
        "Frequency on the top Reel · cap at 4×",
        "Brand Search impression share recovery",
      ],
      decisionAt: "Day 4 · Jun 1",
      decisionRule:
        "If CPL drift ≤ 8% on both ad sets → fire Stage 2. If drift 8–12% → hold one more day. If > 12% → auto-pause that ad set.",
    },
    {
      id: "p2",
      week: "Week 2",
      dates: "Jun 4 – Jun 10",
      title: "Decide · launch LAL · expand placements",
      actions: [
        "If Stage 1 holds, fire Stage 2 lift (+25% more, compounds to +50% total)",
        "Launch the new 1% LAL audience inside the Scaling bucket",
        "Open Stories + Reels Discover placements on the top 2 winning Reels",
        "Continue Brand Search defense at the new budget cap",
      ],
      observes: [
        "LAL audience CPL vs. core (target: within 15%)",
        "Stories placement CTR vs. Feed",
        "Qualified-lead trajectory (the actual goal, not CPL)",
      ],
      decisionAt: "Day 11 · Jun 8",
      decisionRule:
        "If qualified-lead delta ≥ +25% vs baseline → green-light Week 3 geo expansion. Else hold + audit before expanding.",
    },
    {
      id: "p3",
      week: "Week 3",
      dates: "Jun 11 – Jun 17",
      title: "Scale winners · prune losers · expand geo",
      actions: [
        "Geo expand the winning Engineer Parent ad set to Indore + Lucknow + Coimbatore",
        "Pause any placement still underperforming benchmark after 10 days",
        "Move the LAL audience into its own scaling bucket if it's pulling ≥ 80% of core CPL",
        "Post final report-back to the dashboard · I'll write the learnings to product memory",
      ],
      observes: [
        "Tier-2 CPL vs. tier-1 baseline (expect 8–15% lower)",
        "End-of-window CPQL · the actual scaling KPI",
        "Whether the LAL is sharper than visitor LAL we used to run",
      ],
    },
  ],
  guardrails: [
    "If CPL drift exceeds 15% on any lift stage, auto-pause that stage and ping you immediately",
    "If frequency hits 4.5× on a winning ad, rotate creative without waiting for permission",
    "If qualified-lead rate drops more than 3 points, pause the affected ad set",
    "Never push more than one major change on a weekend",
  ],
  reportingCadence:
    "I'll drop a short check-in on your dashboard every Monday morning, plus a flag the moment any guardrail fires. End of Week 3 I'll write a learnings entry into product memory.",
};

export const OPTIMIZE_PLAN: WorkflowPlan = {
  goal:
    "Restore NEET TOFU CPL from ₹612 back to the ₹468 it was at three weeks ago · fix Foundation chronic underperformance in parallel.",
  insights: [
    {
      title: "Top NEET Reel is fatigued · 5.2× frequency",
      detail:
        "CTR fell from 2.4% → 1.49% over 21 days. Reach plateaued at 76% of pool size on Day 19. We're spending against an exhausted audience.",
      tone: "warn",
    },
    {
      title: "Negative sentiment spike on Day 18",
      detail:
        "14 negative comments in 3 days flagged the 'Parents see weekly progress' hook as 'surveillance framing'. Sentiment dropped from +0.78 → −0.18. Meta's relevance score on the ad dropped 8 → 5.",
      tone: "warn",
    },
    {
      title: "Allen launched ₹6K NEET price drop on May 12",
      detail:
        "Our /pricing click-through dropped 41% same day. Their 'Pay-on-result' framing is a direct attack on our 'No outcome guarantees' positioning — needs a counter.",
      tone: "warn",
    },
    {
      title: "Foundation is a positioning issue, not a media issue",
      detail:
        "Lab-bench hook reads as 'play-school' to JEE-prep parents. Memory already has the constraint ('Avoid pressure-free framing') — Creative Agent missed it on the brief.",
      tone: "neutral",
    },
  ],
  phases: [
    {
      id: "p1",
      week: "Week 1",
      dates: "May 28 – Jun 3",
      title: "Ship the small fixes · rewrite the Foundation brief",
      actions: [
        "Pause the fatigued 'Parents see weekly progress' Reel immediately",
        "Brief Creative Agent on 2 new NEET hooks: mentor-led + biology-first",
        "Re-frame: replace 'parents see' with 'your kid tracks their own progress'",
        "Rewrite the Foundation creative brief · enforce the memory constraint",
      ],
      observes: [
        "NEET TOFU CPL trajectory · expect recovery to ₹520-540 by Day 6",
        "Comment sentiment on the new Reels (target: back above +0.4)",
        "New Foundation creative briefs · approved by the QA Agent",
      ],
      decisionAt: "Day 5 · Jun 2",
      decisionRule:
        "If sentiment recovers and CPL trending down → continue Week 2. If sentiment stays negative → escalate, pull all NEET TOFU spend pending creative review.",
    },
    {
      id: "p2",
      week: "Week 2",
      dates: "Jun 4 – Jun 10",
      title: "Counter-position on price · rebuild Foundation page",
      actions: [
        "Launch the '14-day money-back' offer card on NEET pricing page",
        "Push 4 new Foundation creatives based on the rewritten brief",
        "Ticket the Foundation landing-page rebuild · sticky mobile CTA above the fold",
        "Run a side-by-side A/B on NEET hook framing (autonomy vs. trust)",
      ],
      observes: [
        "NEET /pricing bounce rate · expect 38% → ~28%",
        "Foundation CPL drift (chronic issue · expect 8-15% improvement)",
        "Mobile session length on the new Foundation page",
      ],
      decisionAt: "Day 10 · Jun 7",
      decisionRule:
        "If NEET CPL ≤ ₹510 and Foundation CPL trending down → declare both recovered, move into watch mode. Else triage what's still broken.",
    },
    {
      id: "p3",
      week: "Week 3",
      dates: "Jun 11 – Jun 17",
      title: "Watch mode · write learnings to memory",
      actions: [
        "Hold all changes · just watch trajectories",
        "If recovery holds, freeze new creative + new positioning into the locked brief",
        "Write 3 learnings to product memory: creative fatigue threshold, counter-positioning template, Foundation positioning constraint",
        "Schedule auto-flag for next decay event · 14-day rolling check on frequency + sentiment",
      ],
      observes: [
        "Whether CPL stays in band without new interventions",
        "Whether the Foundation positioning fix actually moved qual rate",
        "Allen's pricing — does our counter-position close the gap?",
      ],
    },
  ],
  guardrails: [
    "If NEET CPL spikes above ₹700 on any single day, pause TOFU spend until I diagnose",
    "If a new creative gets 3+ negative comments in 24 hours, auto-pause it pending review",
    "If Allen drops price again, escalate immediately rather than reacting alone",
    "No landing-page changes ship to prod without your sign-off — only briefs and tickets",
  ],
  reportingCadence:
    "Daily CPL ping on the dashboard for the first 5 days, then weekly. Any guardrail fire = immediate notification. End of Week 3 = full retro entry into product memory.",
};

export const ANGLES_PLAN: WorkflowPlan = {
  goal:
    "Identify 2 new winning angles for Engineer Parent that beat the current best (CPL ₹312, qual rate 16.8%) — without losing the wins we already have.",
  insights: [
    {
      title: "Winners share a pattern: specificity + autonomy",
      detail:
        "'Mentor-led · capped at 60' and '24-month replay · no time pressure' both lean specific + student-owned. Abstract or pressure framings lost.",
      tone: "good",
    },
    {
      title: "Losers share a pattern too: anxiety + outcome promises",
      detail:
        "'All-India ranked mocks weekly' and 'Crack JEE — guaranteed strategy' both lost on CTR and CPL. Comment data shows parents read them as pressure.",
      tone: "warn",
    },
    {
      title: "Memory constraint must guide generation",
      detail:
        "Product memory flags: no rank promises (legal), no name-checking competitors. The hypothesis we're testing respects both.",
      tone: "neutral",
    },
    {
      title: "Engineer Parent ad set is the right host",
      detail:
        "Highest volume of the three personas → fastest signal. 30% traffic split gives us ~180 leads per angle in 10 days — directionally significant on the top 2.",
      tone: "good",
    },
  ],
  phases: [
    {
      id: "p1",
      week: "Week 1",
      dates: "May 28 – Jun 3",
      title: "Launch the 6-angle A/B test",
      actions: [
        "Push 6 new angles into the Engineer Parent scaling ad set · ₹40K/week budget",
        "30% traffic split to the test · 70% continues on current winners",
        "Run a 7-day early-stop guard · pause any angle with CTR < 0.8% or freq > 4×",
        "Daily watchlist: CPL per angle, hold-rate, comment sentiment",
      ],
      observes: [
        "Which 2-3 angles clear the CPL ≤ ₹360 threshold",
        "Whether qual rate stays ≥ 14% on the leading angles",
        "Comment sentiment on each angle — early signal for memory updates",
      ],
      decisionAt: "Day 7 · Jun 4",
      decisionRule:
        "If 2+ angles clear threshold → continue Week 2 with those. If only 1 clears → extend test with that one + 2 fresh variants. If 0 clear → pull, audit, restart with new hypothesis.",
    },
    {
      id: "p2",
      week: "Week 2",
      dates: "Jun 4 – Jun 10",
      title: "Lock winners · prune losers",
      actions: [
        "Pause all angles that didn't clear threshold (typically 3-4 of the 6)",
        "Double traffic share on the top 2 angles (60% of test budget each)",
        "Brief Resize Agent on the variants needed for full deployment",
        "Run a sentiment audit on the comment sections weekly",
      ],
      observes: [
        "CPL trajectory of the winners as they scale",
        "Whether they hold qual rate when budget shifts toward them",
        "How they're performing across the full audience (not just the test cohort)",
      ],
      decisionAt: "Day 11 · Jun 8",
      decisionRule:
        "If winners hold CPL ≤ ₹360 under doubled share → move them into the main Scaling bucket. Else they were narrow wins; iterate.",
    },
    {
      id: "p3",
      week: "Week 3",
      dates: "Jun 11 – Jun 17",
      title: "Promote winners to the main rotation · write learnings",
      actions: [
        "Move winning angles out of the test and into the primary Scaling bucket",
        "Retire the angles they displaced (the previous winners get demoted to retargeting)",
        "Write the angle-pattern insight to product memory (specificity + autonomy)",
        "Brief next angle generation cycle using the validated pattern",
      ],
      observes: [
        "Final lift in qualified-lead volume from the new winners",
        "Whether the demoted-but-not-paused old winners still hold in retargeting",
        "What the pattern says about the next testing cycle",
      ],
    },
  ],
  guardrails: [
    "Any angle that gets 5+ negative comments in 48 hours gets auto-paused pending review",
    "If overall ad-set CPL drifts > 12% during the test, throttle test budget",
    "Never let the test eat more than 30% of the host ad set's traffic",
    "All new copy passes through the 'avoid' list from product memory before going live",
  ],
  reportingCadence:
    "Mid-test check-in on the dashboard at Day 4. Full result + winner declaration at Day 10. Learnings update to memory on Day 14.",
};

export function planFor(kind: "scale" | "optimize" | "test-angles"): WorkflowPlan {
  if (kind === "scale") return SCALE_PLAN;
  if (kind === "optimize") return OPTIMIZE_PLAN;
  return ANGLES_PLAN;
}

/* ────────────────────────────────────────────────────────────────
 * RECOMMENDATIONS FED TO THE DASHBOARD
 *
 * These are the things Spot has surfaced from active plans that need
 * a human approval. The dashboard renders a feed; clicking Approve
 * dismisses + pretends to deploy. Each recommendation carries enough
 * evidence that the user can decide in 5 seconds.
 * ──────────────────────────────────────────────────────────────── */

export const PENDING_RECOMMENDATIONS: PendingRecommendation[] = [
  {
    id: "rec-1",
    sourceKind: "optimize",
    sourceProduct: "Guyju's NEET Pro",
    surfacedAt: "12 min ago",
    title: "Pause 'Parents see weekly progress' Reel",
    detail:
      "Frequency hit 5.2× this morning · CTR is now below the threshold I set on Day 1. Negative comments are stacking on top.",
    evidence: [
      "Frequency 5.2× (cap: 4×)",
      "CTR fell to 1.42% (Day 1: 2.4%)",
      "5 new negative comments in last 18 hrs",
    ],
    projectedImpact: "CPL recovers to ₹530-545 within 48 hrs · sentiment back above zero in 10 days",
    urgency: "high",
  },
  {
    id: "rec-2",
    sourceKind: "scale",
    sourceProduct: "Guyju's JEE Crack",
    surfacedAt: "2 hr ago",
    title: "Fire Stage 2 budget lift on Engineer Parent",
    detail:
      "Stage 1 held — CPL drift is +6.4%, well under the 8% threshold. Ready to compound to +50% total lift.",
    evidence: [
      "Stage 1 CPL drift: +6.4% (limit: 8%)",
      "Frequency on top creative: 3.1× (under cap)",
      "Qualified-lead rate stable at 14.2%",
    ],
    projectedImpact: "+ ₹85K weekly spend · + 140-170 weekly leads · CPL drifts to +9-11% total",
    urgency: "medium",
  },
  {
    id: "rec-3",
    sourceKind: "test-angles",
    sourceProduct: "Guyju's JEE Crack",
    surfacedAt: "4 hr ago",
    title: "Promote 2 winning angles to Scaling bucket",
    detail:
      "'Your kid tracks their own progress' and 'Live mentor at 11pm' both cleared the threshold with room. Day 7 early-stop fired.",
    evidence: [
      "Angle 1 CPL: ₹298 (target: ≤ ₹360)",
      "Angle 2 CPL: ₹324",
      "Both holding qual rate ≥ 15.8%",
    ],
    projectedImpact: "Replaces 2 demoted angles · lifts portfolio CPL by ~6%",
    urgency: "medium",
  },
  {
    id: "rec-4",
    sourceKind: "optimize",
    sourceProduct: "Guyju's Foundation 9-10",
    surfacedAt: "yesterday",
    title: "Ticket the Foundation pricing page rebuild",
    detail:
      "Mobile CTA is below the fold · 71% of visitors don't reach it. Spec is ready · just needs 2 days of dev.",
    evidence: [
      "Mobile bounce rate: 64%",
      "Avg session: 24s on mobile",
      "Heatmap shows CTA at 2.4× scroll depth",
    ],
    projectedImpact: "Mobile bounce 64% → ~45% · demo form fills +60%",
    urgency: "low",
  },
];

/* ────────────────────────────────────────────────────────────────
 * INTRO MESSAGES + TOOL CALLS
 *
 * The new 3-step model maps to:
 *   clarify  → tool-call: "spot.brief"     (fast, just confirms)
 *   plan     → tool-calls: 5 parallel agents (memory, personas,
 *              creative.audit, competitor.scan, plan.build)
 *   live     → tool-call: "deploy.push"
 * ──────────────────────────────────────────────────────────────── */

export function extendedIntroMessage(
  step: string,
  productName: string,
  kind: "scale" | "optimize" | "test-angles" = "scale",
): SpotMessage | null {
  switch (step) {
    /* ─── clarify (per kind) ───────────────────────────────────── */
    case "scale-clarify":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: `Quick context before I run the full analysis on **${productName}**. Three questions on the right — I've pre-picked sensible defaults, so confirm or change.`,
          },
          {
            type: "step-cta",
            label: "Confirm · run analysis",
            helper: "I'll work for 30-40 seconds, then present a single plan to approve.",
            refineHint: "or change the picks on the right",
          },
        ],
      };
    case "opt-clarify":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: `Quick context before I dig in on **${productName}**. Three questions on the right.`,
          },
          {
            type: "step-cta",
            label: "Confirm · run diagnostic",
            helper: "I'll sweep campaigns, find root causes, and build a 3-week fix plan.",
            refineHint: "or change the picks on the right",
          },
        ],
      };
    case "ang-clarify":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: `Quick context before I audit creatives on **${productName}**. Three questions on the right — these constrain what I'll generate.`,
          },
          {
            type: "step-cta",
            label: "Confirm · run creative audit",
            helper: "I'll audit, synthesise the pattern, and propose new angles in one pass.",
            refineHint: "or change the picks on the right",
          },
        ],
      };

    /* ─── plan ────────────────────────────────────────────────── */
    case "scale-plan":
    case "opt-plan":
    case "ang-plan": {
      const intro =
        kind === "scale"
          ? "Plan's ready · 3 phases over 3 weeks. The actions for Week 1 are concrete; the later phases adapt based on what I observe. Guardrails are listed at the bottom — I enforce them without asking."
          : kind === "optimize"
            ? "Plan's ready · 3 phases over 3 weeks. Week 1 ships the small reversible fixes. Week 2 is the bigger swings. Week 3 is watch-mode + writing learnings to memory."
            : "Plan's ready · 3 phases over ~17 days. Week 1 launches the 6-angle test. Week 2 prunes and doubles down. Week 3 promotes winners + writes the pattern to memory.";
      return {
        role: "spot",
        parts: [
          { type: "text", text: intro },
          {
            type: "step-cta",
            label: "Approve plan · kick off Week 1",
            helper:
              "Once approved, I'll execute Week 1 today and ping your dashboard at every decision point.",
            refineHint: "or tell me what to change before I start",
          },
        ],
      };
    }

    /* ─── live ────────────────────────────────────────────────── */
    case "scale-live":
    case "opt-live":
    case "ang-live":
      return {
        role: "spot",
        parts: [
          {
            type: "headline",
            text: `Plan live for ${productName}.`,
            verdict: "ok",
          },
          {
            type: "text",
            text: "Week 1 actions are running. You'll see me ping your dashboard at the next decision date with what to approve. Anything I need *before* that, I'll surface here.",
          },
        ],
      };

    /* ─── done (terminal, shared) ─────────────────────────────── */
    case "done":
      return {
        role: "spot",
        parts: [
          { type: "headline", text: `${productName} · plan complete.`, verdict: "ok" },
          {
            type: "text",
            text: "Final report's on your dashboard · learnings written to memory · next observation cycle queued.",
          },
        ],
      };

    default:
      return null;
  }
}

/* ────────────────────────────────────────────────────────────────
 * STEP ORDERING + LABELS + TOOL CALLS
 * ──────────────────────────────────────────────────────────────── */

export const SCALE_STEPS = ["scale-clarify", "scale-plan", "scale-live", "done"] as const;
export const OPTIMIZE_STEPS = ["opt-clarify", "opt-plan", "opt-live", "done"] as const;
export const ANGLES_STEPS = ["ang-clarify", "ang-plan", "ang-live", "done"] as const;

export const EXTENDED_STEP_LABELS: Record<string, string> = {
  "scale-clarify": "Setup",
  "scale-plan": "Plan",
  "scale-live": "Running",
  "opt-clarify": "Setup",
  "opt-plan": "Plan",
  "opt-live": "Running",
  "ang-clarify": "Setup",
  "ang-plan": "Plan",
  "ang-live": "Running",
};

/**
 * Tool-call narration per step transition. The clarify → plan
 * transition is the heavy one — it shows 5 parallel agents running.
 * (Only one tool-call is rendered at a time per the chat protocol,
 * but the detail string lists them so it reads as parallel work.)
 */
export const EXTENDED_TOOL_CALLS: Record<
  string,
  { agent: string; detail: string; delayMs: number }
> = {
  // Clarify → first step's brief acknowledgement.
  "scale-clarify": {
    agent: "spot.brief",
    detail: "loading product memory · setting up clarifying questions…",
    delayMs: 2600,
  },
  "opt-clarify": {
    agent: "spot.brief",
    detail: "loading product memory · setting up clarifying questions…",
    delayMs: 2600,
  },
  "ang-clarify": {
    agent: "spot.brief",
    detail: "loading product memory · setting up clarifying questions…",
    delayMs: 2600,
  },
  // Plan — the big one. 5 parallel agents in the detail line.
  "scale-plan": {
    agent: "spot.plan",
    detail:
      "memory.read · personas.fetch · creative.audit · audience.headroom · plan.build — running in parallel…",
    delayMs: 5800,
  },
  "opt-plan": {
    agent: "spot.plan",
    detail:
      "memory.read · campaigns.scan · root-cause.analyze · competitor.scan · plan.build — running in parallel…",
    delayMs: 5800,
  },
  "ang-plan": {
    agent: "spot.plan",
    detail:
      "memory.read · creative.audit · pattern.synthesize · creative.brief · plan.build — running in parallel…",
    delayMs: 5800,
  },
  // Live — quick deploy ack.
  "scale-live": {
    agent: "deploy.push",
    detail: "staging Week 1 actions · setting watchers · queueing dashboard pings…",
    delayMs: 3400,
  },
  "opt-live": {
    agent: "deploy.push",
    detail: "pausing fatigued ad · briefing rewrites · queueing watchers…",
    delayMs: 3400,
  },
  "ang-live": {
    agent: "deploy.push",
    detail: "pushing 6 angles to Meta · setting traffic split · arming early-stop guard…",
    delayMs: 3400,
  },
};
