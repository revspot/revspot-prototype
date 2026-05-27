// Mock content for the three "diagnostic" Spot workflows that sit
// alongside the launch-campaign flow:
//
//   1. Scale with Spot   — analyse what's winning, propose scale plays
//   2. Optimize Campaigns — find losers, root-cause, propose fixes
//   3. Test New Angles   — audit creatives, synthesise insight, propose
//                          new angles + an A/B test plan
//
// Each flow's canvas shows panels of structured analysis; the chat
// narrates and carries the approval CTAs. The data here is what Spot
// "found" — in a real product it'd come back from agent calls; here
// it's static + plausible.
//
// All copy is Guyju's-themed (EdTech) so the demo holds together.

import type { SpotMessage } from "./types";

/* ────────────────────────────────────────────────────────────────
 * SCALE WITH SPOT
 *
 * Tells the user: "here's what's working, here's how we scale it
 * without breaking it." Each strategy is concrete + has a projected
 * impact range. Spot is opinionated about which to ship first.
 * ──────────────────────────────────────────────────────────────── */

export type ScaleWinner = {
  id: string;
  /** Subject — usually persona × angle or ad-set name. */
  label: string;
  /** Channel + product context. */
  context: string;
  metrics: { label: string; value: string; delta?: string; deltaTone?: "good" | "bad" }[];
  /** Why Spot thinks it's winning. */
  why: string;
  /** Headroom — high / medium / low → controls how aggressive scaling can be. */
  headroom: "high" | "medium" | "low";
  /** Audience saturation (0-100). Higher = closer to ceiling. */
  saturation: number;
};

export type ScaleStrategy = {
  id: string;
  title: string;
  /** One-liner shown under the title. */
  blurb: string;
  /** Detailed reasoning. */
  rationale: string;
  /** Projected impact range. */
  projectedImpact: string;
  /** Honest risk / tradeoff. */
  risk: string;
  /** Confidence level. */
  confidence: "high" | "medium" | "low";
  /** Spot's recommendation strength. */
  pickFirst?: boolean;
};

export type ScaleImpactRow = {
  label: string;
  current: string;
  projected: string;
  delta: string;
  /** "good" / "bad" — drives colour. */
  tone: "good" | "bad" | "neutral";
};

export const SCALE_WINNERS: ScaleWinner[] = [
  {
    id: "win-1",
    label: "Engineer Parent × Mentor-led hook",
    context: "Meta · Scaling bucket · last 30 days",
    metrics: [
      { label: "Spend", value: "₹2.1L" },
      { label: "Leads", value: "612" },
      { label: "CPL", value: "₹343", delta: "↓ 22%", deltaTone: "good" },
      { label: "CPQL", value: "₹2,150", delta: "↓ 14%", deltaTone: "good" },
      { label: "Qual rate", value: "16.4%", delta: "↑ 4.8pts", deltaTone: "good" },
    ],
    why: "Mentor-led framing addresses the parent's actual pain (trust in delivery), not the kid's. Doubt-clearing payoff resonates and the 60-student cap reads as scarce. Lookalike audiences from this cohort show similar early signal.",
    headroom: "high",
    saturation: 28,
  },
  {
    id: "win-2",
    label: "Self-Studier × Doubt-clearing reel",
    context: "Meta · Scaling bucket · last 30 days",
    metrics: [
      { label: "Spend", value: "₹1.3L" },
      { label: "Leads", value: "548" },
      { label: "CPL", value: "₹237", delta: "↓ 31%", deltaTone: "good" },
      { label: "CPQL", value: "₹2,890", delta: "↑ 6%", deltaTone: "bad" },
      { label: "Qual rate", value: "8.2%", delta: "↓ 1.1pts", deltaTone: "bad" },
    ],
    why: "Cheapest cohort to acquire but quality drops on the BOFU funnel. Volume play — useful for top-of-funnel breadth, not a primary BOFU lever.",
    headroom: "medium",
    saturation: 52,
  },
  {
    id: "win-3",
    label: "JEE Crack · Google Search · Brand defense",
    context: "Google · last 30 days",
    metrics: [
      { label: "Spend", value: "₹38K" },
      { label: "Leads", value: "82" },
      { label: "CPL", value: "₹463" },
      { label: "Qual rate", value: "24%", delta: "↑ 2pts", deltaTone: "good" },
      { label: "Ad strength", value: "Excellent" },
    ],
    why: "Brand queries are near-100% intent — defending these is non-negotiable. Currently underspending vs. category — there's room to push.",
    headroom: "high",
    saturation: 18,
  },
];

export const SCALE_STRATEGIES: ScaleStrategy[] = [
  {
    id: "strat-1",
    title: "Lift budget on winners — controlled 50% rollout",
    blurb: "+50% spend on the top 2 ad sets, staggered over 3 days.",
    rationale:
      "Both top ad sets are under 30% audience saturation — significant headroom. Stagger lets the algorithm re-learn without resetting bid history. We protect CPL by capping each lift step at 20% delta.",
    projectedImpact: "+ ₹1.4L → ₹1.7L weekly spend · + 280–340 leads · CPL drift +5–10%",
    risk: "Algorithm re-learning could spike CPL for ~48 hrs before settling. Mitigated by staggered rollout.",
    confidence: "high",
    pickFirst: true,
  },
  {
    id: "strat-2",
    title: "Geo expansion — tier-2 cities (Indore, Lucknow, Coimbatore)",
    blurb: "Replicate the winning Engineer Parent ad set into 3 new metros.",
    rationale:
      "Engineer Parent winner is concentrated in Hyderabad / Pune / Bangalore. Revspot's audience graph shows Indore, Lucknow and Coimbatore have similar JEE-aspirant density with lower CPM. The framing should travel cleanly.",
    projectedImpact: "+ ₹85K weekly spend · + 220–280 leads · CPL likely 8–15% lower than tier-1",
    risk: "Tier-2 quality (qual rate) may be lower — track CPQL closely after 7 days.",
    confidence: "high",
  },
  {
    id: "strat-3",
    title: "Audience lookalike — 1% LAL on qualified leads",
    blurb: "Build a 1% lookalike from the 248 qualified-leads cohort.",
    rationale:
      "Cohort size now passes Meta's 1,000-seed minimum (248 qualified + 612 verified). LAL on qualified is sharper than the existing LAL on visitors. Expect a quality lift, not necessarily volume.",
    projectedImpact: "+ 80–120 leads · CPL slightly higher · qual rate +3–5pts",
    risk: "Smaller addressable pool — best as a complement to budget lift, not standalone scaling.",
    confidence: "medium",
  },
  {
    id: "strat-4",
    title: "New placement — extend winners to Stories + Reels Discover",
    blurb: "Push the top 2 Reels into Stories + Reels Discover placements.",
    rationale:
      "Currently running on Feed + Reels feed only. Stories has shown +18% CTR for video Reels in EdTech accounts in Revspot's benchmark set. Reels Discover adds incremental low-CPM reach.",
    projectedImpact: "+ ₹40K weekly spend · + 110–150 leads · CPM 12–18% lower",
    risk: "Stories audience skews younger (students) — qualification may dip slightly.",
    confidence: "medium",
  },
];

export const SCALE_IMPACT: ScaleImpactRow[] = [
  { label: "Weekly spend", current: "₹6.8L", projected: "₹9.4L", delta: "+ 38%", tone: "neutral" },
  { label: "Weekly leads", current: "1,840", projected: "2,440–2,560", delta: "+ 33–39%", tone: "good" },
  { label: "Avg CPL", current: "₹349", projected: "₹360–375", delta: "+ 3–7%", tone: "bad" },
  { label: "Qualified leads", current: "248", projected: "340–380", delta: "+ 37–53%", tone: "good" },
  { label: "Avg CPQL", current: "₹2,589", projected: "₹2,470–2,650", delta: "± 2%", tone: "good" },
  { label: "Payback", current: "—", projected: "14–18 days", delta: "first qualified at scale", tone: "neutral" },
];

/* ────────────────────────────────────────────────────────────────
 * OPTIMIZE CAMPAIGNS
 *
 * "Find the losers · diagnose why · propose the fix." The killer
 * panel here is root-cause: not just "CPL went up" but *why* —
 * creative fatigue, negative sentiment surge, competitor pricing,
 * etc.
 * ──────────────────────────────────────────────────────────────── */

export type ProblemCampaign = {
  id: string;
  name: string;
  context: string;
  /** "recent-decay" = was good, just broke. "chronic" = never worked. */
  kind: "recent-decay" | "chronic";
  severity: "high" | "medium" | "low";
  metrics: { label: string; value: string; delta?: string; deltaTone?: "good" | "bad" }[];
  headline: string;
};

export type RootCause = {
  id: string;
  /** Top-line issue. */
  issue: string;
  /** Category — drives the icon. */
  category: "creative-fatigue" | "negative-sentiment" | "audience-saturation" | "competitor" | "attribution" | "pricing" | "landing-page";
  /** Specific evidence Spot found. */
  evidence: string[];
  confidence: "high" | "medium" | "low";
  /** Which problem campaign this root cause belongs to. */
  problemId: string;
};

export type FixPlan = {
  id: string;
  /** Short, imperative — "Rotate creative", "Pause and replace…" */
  action: string;
  detail: string;
  /** Which root cause this fix addresses. */
  addressesRootCauseId: string;
  /** Effort: small / medium / large. */
  effort: "small" | "medium" | "large";
  /** Projected impact. */
  projectedImpact: string;
  pickFirst?: boolean;
};

export const PROBLEM_CAMPAIGNS: ProblemCampaign[] = [
  {
    id: "prob-1",
    name: "NEET Pro · TOFU · Parents-see-progress hook",
    context: "Meta · Lead Gen · launched 32 days ago",
    kind: "recent-decay",
    severity: "high",
    metrics: [
      { label: "Spend", value: "₹2.96L", delta: "↑ 18%", deltaTone: "bad" },
      { label: "Leads", value: "484", delta: "↑ 4%", deltaTone: "good" },
      { label: "CPL", value: "₹612", delta: "↑ 13%", deltaTone: "bad" },
      { label: "Qual rate", value: "9.5%", delta: "↓ 3.6pts", deltaTone: "bad" },
    ],
    headline:
      "CPL up 13% in 14 days · qualification rate falling · was working at ₹468 CPL for the first 18 days.",
  },
  {
    id: "prob-2",
    name: "Foundation 9-10 · TOFU · Lab-bench hook",
    context: "Meta · Lead Gen · launched 64 days ago",
    kind: "chronic",
    severity: "medium",
    metrics: [
      { label: "Spend", value: "₹1.88L" },
      { label: "Leads", value: "286" },
      { label: "CPL", value: "₹657", delta: "vs. ₹420 target", deltaTone: "bad" },
      { label: "Qual rate", value: "6.6%", delta: "vs. ~12% peer avg", deltaTone: "bad" },
    ],
    headline:
      "Never hit target CPL since launch · qualification rate stuck below product average. Likely positioning issue, not media.",
  },
];

export const ROOT_CAUSES: RootCause[] = [
  // Problem 1 — recent decay on NEET TOFU
  {
    id: "rc-1",
    problemId: "prob-1",
    issue: "Creative fatigue · top Reel hit frequency 5.2× · CTR dropped 38%",
    category: "creative-fatigue",
    evidence: [
      "Top Reel ('Parents see weekly progress') was carrying 62% of impressions when launched. CTR was 2.4% on Day 1 → 1.49% by Day 21.",
      "Frequency on Class-11 parent cohort climbed to 5.2× — well past the 3.5× our benchmarks show as fatigue floor.",
      "Reach plateaued at 76% of total audience pool size on Day 19. We're now spending against an exhausted audience.",
    ],
    confidence: "high",
  },
  {
    id: "rc-2",
    problemId: "prob-1",
    issue: "Negative sentiment surge · 14 negative comments in 3 days",
    category: "negative-sentiment",
    evidence: [
      "14 negative comments between May 16-19 on the lead Reel — pattern: viewers calling out 'parent surveillance' framing.",
      "Comment sentiment dropped from +0.78 (May 1) to −0.18 (May 22). Two comments got 40+ likes — visible at first scroll.",
      "Comments are skewing the algo against us: Meta's relevance score on this ad dropped from 8/10 → 5/10.",
    ],
    confidence: "high",
  },
  {
    id: "rc-3",
    problemId: "prob-1",
    issue: "Competitor pricing pressure · Allen dropped NEET pricing ~₹6K",
    category: "competitor",
    evidence: [
      "Click-through to /pricing dropped 41% starting May 12 — same day Allen's offer ad started running heavily in the same metros.",
      "Allen's Discover ad copy uses 'Pay-on-result' framing — direct attack on our 'No outcome guarantees' positioning.",
      "Our landing-page bounce rate on /neet/pricing went 22% → 38% over the same window.",
    ],
    confidence: "medium",
  },
  // Problem 2 — chronic Foundation underperformance
  {
    id: "rc-4",
    problemId: "prob-2",
    issue: "Hook mismatch · Lab-bench framing reads as 'unserious' to JEE-prep parents",
    category: "creative-fatigue",
    evidence: [
      "Parents commenting 'is this play-school?' on the Lab-bench creative — pattern across 8 of the top 12 comment threads.",
      "Audience segment that engages: parents of 14-year-olds (target). Audience that *clicks through*: parents of 16+ (out of fit). Mismatch.",
      "Past learning we missed: 'Avoid pressure-free framing — parents read it as unserious.' Currently in product memory but not reflected in creative brief.",
    ],
    confidence: "high",
  },
  {
    id: "rc-5",
    problemId: "prob-2",
    issue: "Landing page CTA buried · 'Book demo' below the fold on mobile",
    category: "landing-page",
    evidence: [
      "Mobile heatmap: 71% of visitors don't scroll past the curriculum overview. CTA sits at the 2.4× scroll depth.",
      "Bounce rate on Foundation pricing page = 64% (vs. JEE Crack equivalent at 38%).",
      "Average session = 24s on mobile. Not enough time to reach the CTA in current layout.",
    ],
    confidence: "high",
  },
];

export const FIX_PLANS: FixPlan[] = [
  // Fixes for Problem 1 (NEET TOFU decay)
  {
    id: "fix-1",
    addressesRootCauseId: "rc-1",
    action: "Pause the fatigued Reel · push 2 fresh angles into rotation",
    detail:
      "Pause 'Parents see weekly progress' immediately. Brief Creative Agent on 2 net-new hooks (mentor-led + biology-first) — drafts ready in 2 hrs.",
    effort: "small",
    projectedImpact: "CPL → ₹495–540 within 7 days · qual rate recovers to ~11.5%",
    pickFirst: true,
  },
  {
    id: "fix-2",
    addressesRootCauseId: "rc-2",
    action: "Re-frame · replace 'parents see' with 'your kid tracks their own progress'",
    detail:
      "Swap framing to autonomy-supportive language. Same Reel format, different VO + caption. Removes the surveillance read that triggered negative comments.",
    effort: "small",
    projectedImpact: "Sentiment back to +0.4 within 10 days · relevance score 5 → 7+",
  },
  {
    id: "fix-3",
    addressesRootCauseId: "rc-3",
    action: "Counter-position · launch '14-day money-back' offer card",
    detail:
      "Allen's 'Pay-on-result' is the framing to counter. Lead with refund risk reversal instead. Doesn't undercut their offer — sidesteps it.",
    effort: "medium",
    projectedImpact: "Pricing-page bounce 38% → 28% · click-through to checkout +14%",
  },
  // Fixes for Problem 2 (Foundation chronic)
  {
    id: "fix-4",
    addressesRootCauseId: "rc-4",
    action: "Rewrite creative brief · drop lab-bench, lead with 'CBSE-aligned · zero school conflict'",
    detail:
      "Pull the Foundation creative brief, fold in the 'Avoid pressure-free framing' constraint from memory. Brief Creative Agent on serious-school-aligned hooks instead.",
    effort: "medium",
    projectedImpact: "CPL → ₹510 within 14 days · qual rate to 9-10%",
    pickFirst: true,
  },
  {
    id: "fix-5",
    addressesRootCauseId: "rc-5",
    action: "Move CTA above the fold on /foundation/pricing",
    detail:
      "Rewrite the mobile pricing page — sticky 'Book demo' CTA, condensed curriculum to 3 cards, pricing card first. Spec'd in 1 day, build in 2.",
    effort: "medium",
    projectedImpact: "Mobile bounce 64% → ~45% · session → 38s · demo-form fills +60%",
  },
];

/* ────────────────────────────────────────────────────────────────
 * TEST NEW ANGLES
 *
 * Audits current creative against performance, synthesises *why*
 * winners win, then proposes new angles that build on the insight.
 * Ends with an A/B test plan.
 * ──────────────────────────────────────────────────────────────── */

export type AngleAuditEntry = {
  id: string;
  hook: string;
  /** Persona the angle targets. */
  personaName: string;
  /** Channel. */
  channel: "Meta" | "Google";
  format: "Static" | "Reel" | "Carousel" | "Search";
  metrics: { label: string; value: string; tone?: "good" | "bad" }[];
  /** Why Spot thinks it's winning / losing. */
  insight: string;
  /** "winner" / "loser" / "unproven". */
  verdict: "winner" | "loser" | "unproven";
};

export type AngleSynthesis = {
  /** What's working. */
  working: string[];
  /** What's not. */
  notWorking: string[];
  /** Hypothesis for new angles. */
  hypothesis: string;
  /** Constraint Spot is honouring (from product memory). */
  constraint?: string;
};

export type ProposedAngle = {
  id: string;
  hook: string;
  cta: string;
  format: "Static" | "Reel" | "Carousel";
  personaName: string;
  /** Which winning insight this builds on. */
  buildsOn: string;
  /** Confidence in the angle. */
  confidence: "high" | "medium" | "low";
  /** Hue for placeholder gradient. */
  hue: number;
};

export type AngleTestPlan = {
  /** Where the test runs. */
  testAdSet: string;
  /** % of cohort traffic allocated to the test. */
  trafficSplit: number;
  /** Daily budget. */
  dailyBudget: string;
  /** Primary success metric. */
  successMetric: string;
  /** Test runtime. */
  runtime: string;
  /** What we expect to see. */
  expectation: string;
  /** Significance threshold. */
  significance: string;
};

export const ANGLE_AUDIT: AngleAuditEntry[] = [
  // WINNERS
  {
    id: "aa-1",
    hook: "Mentor-led classes · capped at 60 students",
    personaName: "Engineer Parent",
    channel: "Meta",
    format: "Static",
    metrics: [
      { label: "CTR", value: "2.81%", tone: "good" },
      { label: "CPL", value: "₹312", tone: "good" },
      { label: "Qual rate", value: "16.8%", tone: "good" },
      { label: "Hold rate", value: "—" },
    ],
    insight:
      "Specificity ('60', 'mentor-led') over abstract ('small batch'). Concrete numbers signal credibility — parents register the cap as scarce + intentional.",
    verdict: "winner",
  },
  {
    id: "aa-2",
    hook: "Doubt-clearing in 15 minutes · live",
    personaName: "Self-Studier",
    channel: "Meta",
    format: "Reel",
    metrics: [
      { label: "CTR", value: "3.42%", tone: "good" },
      { label: "CPL", value: "₹186", tone: "good" },
      { label: "Hold rate", value: "62%", tone: "good" },
      { label: "Qual rate", value: "8.1%", tone: "bad" },
    ],
    insight:
      "Pain-point hook ('doubt-clearing') + immediate gratification ('15 min'). Brings volume; qualification is lower because intent skews top-of-funnel.",
    verdict: "winner",
  },
  {
    id: "aa-3",
    hook: "24-month replay · no time pressure",
    personaName: "Self-Studier",
    channel: "Meta",
    format: "Static",
    metrics: [
      { label: "CTR", value: "1.94%", tone: "good" },
      { label: "CPL", value: "₹248" },
      { label: "Qual rate", value: "11.2%", tone: "good" },
    ],
    insight: "Autonomy framing — student-owned pace. Higher qual rate than the volume-play reel; works on the more deliberate cohort.",
    verdict: "winner",
  },
  // LOSERS
  {
    id: "aa-4",
    hook: "All-India ranked mocks every week",
    personaName: "Engineer Parent",
    channel: "Meta",
    format: "Reel",
    metrics: [
      { label: "CTR", value: "0.92%", tone: "bad" },
      { label: "CPL", value: "₹612", tone: "bad" },
      { label: "Hold rate", value: "21%", tone: "bad" },
    ],
    insight:
      "Anxiety-framing — parents read 'ranked against 1.2L+' as pressure, not relief. 6 of the top 9 comments express stress. Inverse of what 'mentor-led' triggers.",
    verdict: "loser",
  },
  {
    id: "aa-5",
    hook: "Crack JEE — guaranteed strategy",
    personaName: "Engineer Parent",
    channel: "Meta",
    format: "Static",
    metrics: [
      { label: "CTR", value: "1.18%" },
      { label: "CPL", value: "₹584", tone: "bad" },
      { label: "Qual rate", value: "3.4%", tone: "bad" },
    ],
    insight:
      "Reads as bait. The 'guaranteed' frame triggers skepticism — engineer-parents are precisely the cohort least likely to believe outcome guarantees. Flagged in product memory.",
    verdict: "loser",
  },
  // UNPROVEN
  {
    id: "aa-6",
    hook: "Watch a sample class for free",
    personaName: "Coaching Hopper",
    channel: "Meta",
    format: "Reel",
    metrics: [
      { label: "Spend", value: "₹14K" },
      { label: "Leads", value: "32" },
      { label: "CPL", value: "₹438" },
    ],
    insight: "Launched 6 days ago. Not enough data to call yet — early signal is positive (CPL trending below target).",
    verdict: "unproven",
  },
];

export const ANGLE_SYNTHESIS: AngleSynthesis = {
  working: [
    "Specificity beats abstraction · '60-student cap' wins, 'small batch' doesn't",
    "Autonomy-supportive framing · 'student-owned pace', 'kid tracks progress'",
    "Pain-relief over outcome-promise · 'doubt-clearing in 15 min' over 'crack JEE'",
    "Authority signals · 'IIT-alum mentors' adds trust without sounding boastful",
  ],
  notWorking: [
    "Anxiety / pressure framing · ranking, competing, 'against 1.2L+ aspirants'",
    "Outcome guarantees · triggers skepticism, flagged in memory anyway",
    "Comparison to competitors by name · 'better than Allen' — feels insecure",
    "Surveillance framing on parents · 'parents see' read as helicopter-parenting",
  ],
  hypothesis:
    "Lean into 'your kid's own journey' — specific, autonomy-supportive, pain-relieving. Pair with concrete credibility signals (numbers, alumni). Drop ranking + outcome-guarantee framing entirely.",
  constraint:
    "From memory · don't promise specific ranks / outcomes (legal flagged) and avoid name-checking competitors.",
};

export const PROPOSED_ANGLES: ProposedAngle[] = [
  {
    id: "pa-1",
    hook: "Your kid's own progress graph · updated every Friday",
    cta: "See a sample dashboard",
    format: "Reel",
    personaName: "Engineer Parent",
    buildsOn: "Specificity + autonomy framing",
    confidence: "high",
    hue: 215,
  },
  {
    id: "pa-2",
    hook: "Mentor 1:1 every fortnight · finally heard, not just taught",
    cta: "Meet the mentors",
    format: "Carousel",
    personaName: "Engineer Parent",
    buildsOn: "Authority + autonomy (heard, not lectured)",
    confidence: "high",
    hue: 32,
  },
  {
    id: "pa-3",
    hook: "Stuck on a doubt at 11pm? Live mentor on call.",
    cta: "Try a free doubt-clearing session",
    format: "Reel",
    personaName: "Self-Studier",
    buildsOn: "Pain-relief framing + specificity (11pm)",
    confidence: "high",
    hue: 145,
  },
  {
    id: "pa-4",
    hook: "Recordings stay live for 24 months · pause life, not learning",
    cta: "Tour the library",
    format: "Static",
    personaName: "Self-Studier",
    buildsOn: "Autonomy-supportive · pain-relief (life conflicts)",
    confidence: "medium",
    hue: 290,
  },
  {
    id: "pa-5",
    hook: "Switching coaching mid-year? Bring your old syllabus — we cover the gap.",
    cta: "Book a 1:1 transition call",
    format: "Static",
    personaName: "Coaching Hopper",
    buildsOn: "Pain-relief + specific scenario (mid-year switch)",
    confidence: "medium",
    hue: 12,
  },
  {
    id: "pa-6",
    hook: "Class size: 60 · screen size: yours · stakes: the same.",
    cta: "Watch a class",
    format: "Reel",
    personaName: "Engineer Parent",
    buildsOn: "Specificity + reframing (online = serious)",
    confidence: "medium",
    hue: 180,
  },
];

export const ANGLE_TEST_PLAN: AngleTestPlan = {
  testAdSet: "Engineer Parent · Class 11/12 parents · tier-1 metros",
  trafficSplit: 30,
  dailyBudget: "₹4,000/day",
  successMetric: "CPL ≤ ₹360 with qual rate ≥ 14% over a 7-day window",
  runtime: "10 days · early-stop guard if frequency > 4×",
  expectation:
    "Top 2 of the 6 angles should clear the threshold. Spot will pause the rest after the 7-day mark and roll the winners into the Scaling bucket.",
  significance:
    "We'll need ≥ 180 leads per angle for a directional read · the 10-day window + traffic split is sized to hit that on the top 2.",
};

/* ────────────────────────────────────────────────────────────────
 * Intro messages — one per step for each new flow. Pattern matches
 * the existing stepIntroMessage() in workflow.ts.
 * ──────────────────────────────────────────────────────────────── */

export function extendedIntroMessage(
  step: string,
  productName: string,
): SpotMessage | null {
  switch (step) {
    /* ─── Scale ─── */
    case "scale-analyze":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: `Pulled the last 30 days for **${productName}**. Three things are clearly winning — right pane has the breakdown plus the headroom estimate per winner.`,
          },
          {
            type: "step-cta",
            label: "Show me how to scale them",
            helper: "I'll propose 4 plays — pick the ones to ship.",
          },
        ],
      };
    case "scale-strategies":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: "Four strategies on the right. I'd pick the budget lift first — it's the highest-confidence play and we've got 70% headroom on the two top ad sets. Lookalike and Stories placement are good complements once the lift is stable.",
          },
          {
            type: "step-cta",
            label: "Approve picks — preview impact",
            helper: "I'll project leads, spend, CPL over the next 30 days.",
            refineHint: "or tell me which strategies to drop",
          },
        ],
      };
    case "scale-impact":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: "Here's what the picked strategies project. CPL drifts up slightly (+3-7%), but qualified-lead volume jumps 37–53%. CPQL stays roughly flat — that's the read we want before pushing more budget.",
          },
          {
            type: "step-cta",
            label: "Looks good — deploy",
            helper: "I'll stage the budget lifts and launch the LAL audience.",
            refineHint: "or tell me to be more conservative",
          },
        ],
      };
    case "scale-deploy":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: "Final review — every change I'll make is on the right. I'll stagger the budget lifts over 3 days, launch the LAL on Day 2, and add the new placements on Day 4.",
          },
          {
            type: "step-cta",
            label: "Ship it",
            helper: "Changes go live on Meta and Google immediately.",
          },
        ],
      };

    /* ─── Optimize ─── */
    case "opt-diagnose":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: `Two campaigns flagged across **${productName}**. One was working and just broke; the other has never hit target. Different stories, different fixes — right pane shows both.`,
          },
          {
            type: "step-cta",
            label: "Drill into the root cause",
            helper: "I'll show what I found per campaign.",
          },
        ],
      };
    case "opt-root-cause":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: "Three things going wrong on NEET TOFU at the same time — creative fatigue, a negative-comment spike on the Reel, and Allen dropping their NEET price last week. The Foundation chronic issue is simpler: hook mismatch + a buried CTA on mobile.",
          },
          {
            type: "step-cta",
            label: "Show me the fix plan",
            helper: "I'll propose one fix per root cause.",
          },
        ],
      };
    case "opt-fix-plan":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: "Five fixes total — three for NEET, two for Foundation. I'd ship the creative rotation first (smallest effort, biggest immediate effect) and the Foundation creative-brief rewrite second. Counter-positioning on Allen's price drop is the slow burn — worth doing but not urgent.",
          },
          {
            type: "step-cta",
            label: "Approve picks — preview deploy",
            helper: "I'll show the exact changes before applying.",
            refineHint: "or tell me which fixes to drop",
          },
        ],
      };
    case "opt-deploy":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: "Final review on the right. Once you ship, the fatigued Reel pauses immediately, the new creative briefs go to Creative Agent in parallel, and the Foundation pricing page goes into the next dev sprint.",
          },
          {
            type: "step-cta",
            label: "Ship the fixes",
            helper: "I'll watch CPL daily and flag if anything regresses.",
          },
        ],
      };

    /* ─── Test new angles ─── */
    case "ang-audit":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: `Audited every creative running on **${productName}** in the last 30 days. Three clear winners, two clear losers, one too early to call. Right pane has the breakdown with the insight per angle.`,
          },
          {
            type: "step-cta",
            label: "What's the pattern?",
            helper: "I'll synthesise what's making winners win.",
          },
        ],
      };
    case "ang-insights":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: "Pattern's pretty clean — specificity + autonomy framing wins, anxiety + outcome-guarantee framing loses. The hypothesis I'm building from: 'your kid's own journey' beats 'beat the competition'. Memory's constraint (no rank promises, no name-checking competitors) reinforces it.",
          },
          {
            type: "step-cta",
            label: "Generate new angles",
            helper: "I'll draft 6 — each tied to a specific winning insight.",
          },
        ],
      };
    case "ang-generate":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: "Six new angles drafted on the right. Each one is grounded in a specific insight from the audit — hover any card to see which winner it builds on. I'd ship 4 of these into the A/B test; the other 2 are second-priority.",
          },
          {
            type: "step-cta",
            label: "Approve angles — plan the test",
            helper: "I'll set up the A/B test next.",
            refineHint: "or tell me which to swap",
          },
        ],
      };
    case "ang-test-plan":
      return {
        role: "spot",
        parts: [
          {
            type: "text",
            text: "A/B plan on the right. We'll run the test on the Engineer Parent scaling ad set (highest volume, fastest data), 30% traffic split, ~₹4K/day. Sized to give us a directional read on the top 2 angles in 10 days.",
          },
          {
            type: "step-cta",
            label: "Launch the test",
            helper: "I'll push the angles to Meta and watch.",
          },
        ],
      };

    /* ─── Shared done ─── */
    case "done":
      return {
        role: "spot",
        parts: [
          { type: "headline", text: `Done · live on ${productName}.`, verdict: "ok" },
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

/* ────────────────────────────────────────────────────────────────
 * Step ordering + labels for the three new flows.
 * ──────────────────────────────────────────────────────────────── */

export const SCALE_STEPS = [
  "scale-analyze",
  "scale-strategies",
  "scale-impact",
  "scale-deploy",
  "done",
] as const;

export const OPTIMIZE_STEPS = [
  "opt-diagnose",
  "opt-root-cause",
  "opt-fix-plan",
  "opt-deploy",
  "done",
] as const;

export const ANGLES_STEPS = [
  "ang-audit",
  "ang-insights",
  "ang-generate",
  "ang-test-plan",
  "done",
] as const;

export const EXTENDED_STEP_LABELS: Record<string, string> = {
  "scale-analyze": "Winners",
  "scale-strategies": "Strategies",
  "scale-impact": "Impact",
  "scale-deploy": "Deploy",
  "opt-diagnose": "Diagnose",
  "opt-root-cause": "Root cause",
  "opt-fix-plan": "Fix plan",
  "opt-deploy": "Deploy",
  "ang-audit": "Audit",
  "ang-insights": "Insights",
  "ang-generate": "New angles",
  "ang-test-plan": "Test plan",
};

/** Tool-call narration for each step transition in the new flows. */
export const EXTENDED_TOOL_CALLS: Record<
  string,
  { agent: string; detail: string; delayMs: number }
> = {
  "scale-analyze": {
    agent: "performance.scan",
    detail: "scanning 30d performance · ranking winners by lift × headroom…",
    delayMs: 3400,
  },
  "scale-strategies": {
    agent: "scale.plan",
    detail: "building scale plays · budget lift · LAL · geo · placement…",
    delayMs: 3800,
  },
  "scale-impact": {
    agent: "forecast.run",
    detail: "projecting leads / CPL / CPQL on selected plays…",
    delayMs: 3200,
  },
  "scale-deploy": {
    agent: "deploy.push",
    detail: "staging budget lifts · launching LAL · adding placements…",
    delayMs: 3800,
  },

  "opt-diagnose": {
    agent: "campaigns.scan",
    detail: "scanning underperformers · splitting recent decay vs chronic…",
    delayMs: 3400,
  },
  "opt-root-cause": {
    agent: "root-cause.analyze",
    detail: "creative-fatigue + sentiment + competitor + landing checks…",
    delayMs: 4200,
  },
  "opt-fix-plan": {
    agent: "fixes.draft",
    detail: "drafting one fix per root cause · ranking by effort × impact…",
    delayMs: 3400,
  },
  "opt-deploy": {
    agent: "deploy.push",
    detail: "pausing fatigued ads · queueing rewrites · staging changes…",
    delayMs: 3600,
  },

  "ang-audit": {
    agent: "creative.audit",
    detail: "auditing 30d creative · ranking winners + losers + unproven…",
    delayMs: 3400,
  },
  "ang-insights": {
    agent: "insight.synthesize",
    detail: "synthesising what wins vs what loses · checking memory constraints…",
    delayMs: 3200,
  },
  "ang-generate": {
    agent: "creative.brief",
    detail: "drafting 6 angles · grounding each in a winning insight…",
    delayMs: 4200,
  },
  "ang-test-plan": {
    agent: "ab-test.plan",
    detail: "sizing the test · picking the host ad set · setting guardrails…",
    delayMs: 3000,
  },
};
