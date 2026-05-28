"use client";

// Consolidated launch flow — three step canvases that follow the
// kickoff/memory step. The big design move: the **plan** is a written
// document, not a card-grid. Users see what Spot will DO each day for
// the next 2 weeks, not previews of artifacts.
//
//   1. launch-plan      — Plan document. First asks the user to set a
//                         goal OR run an experiment campaign. Then
//                         renders a day-by-day plan.
//   2. launch-building  — Async work. Spot orbit loader with cycling
//                         status. User can navigate away.
//   3. launch-review    — When Spot's done, the canvas surfaces all
//                         generated assets for final approval.

import {
  CheckCircle2,
  Image as ImageIcon,
  Layout,
  Megaphone,
  Mic,
  Users,
  Sparkles,
  Phone,
  Wifi,
  FileText,
  Smartphone,
  Layers,
  Target,
  Beaker,
  ArrowRight,
  Calendar,
  Eye,
  Zap,
  ShieldCheck,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useState } from "react";
import { useSpotStore } from "@/lib/spot/store";
import { SpotMark } from "@/components/spot/spot-mark";
import { SpotLoader, SpotFullscreen } from "@/components/spot/spot-loader";
import type { LaunchWorkflow } from "@/lib/spot/workflow";

const canvasStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const canvasReveal: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

/* ════════════════════════════════════════════════════════════════
 * Day-by-day plan content
 *
 * Two paths the user can pick at the top of the plan step:
 *   · Experiment campaign · 2 weeks — Spot runs a learning campaign
 *     to figure out what works (best for new products).
 *   · Set a goal — user gives a specific target and Spot plans
 *     around hitting it.
 *
 * The plan content below is the EXPERIMENT path. The goal path
 * shows the same day-by-day structure but reframed around the
 * user's target (e.g., "Day 1-3 · ramp to ₹500 CPL").
 * ═══════════════════════════════════════════════════════════════ */

type PlanDay = {
  /** "Day 1", "Day 2-3", "Day 4", etc. */
  range: string;
  /** Date label · computed off "today" in a real product. */
  date: string;
  /** Phase title. */
  title: string;
  /** Concrete actions Spot will take this day. */
  actions: string[];
  /** What Spot will be watching. */
  watching: string[];
  /** Optional decision rule if Spot will make a call this day. */
  decision?: string;
  /** Optional tag — used for the spine dot colour. */
  tone?: "launch" | "observe" | "decide" | "scale" | "report";
};

const EXPERIMENT_PLAN: PlanDay[] = [
  {
    range: "Day 1",
    date: "Today",
    title: "Launch the experiment",
    tone: "launch",
    actions: [
      "Push 3 distinct angles into Meta · Lead Gen, ₹3,000/day each",
      "Open one Google Search bucket on brand + 'category online coaching' keywords",
      "Spin up the demo-class landing page · mobile-first, sticky CTA",
      "Arm the watchers: CPL, frequency cap, comment sentiment",
    ],
    watching: ["First-day CPL signal", "CTR per angle", "Landing page bounce rate"],
  },
  {
    range: "Day 2-3",
    date: "Tomorrow → Day 3",
    title: "Hold and observe",
    tone: "observe",
    actions: [
      "No changes. Let the algo learn for 48 hours.",
      "Spot reviews early signals every 6 hours but doesn't act.",
    ],
    watching: [
      "Which angle has the lowest CPL · early signal only",
      "Are any comments turning negative?",
      "Frequency creeping up on any single creative?",
    ],
  },
  {
    range: "Day 4",
    date: "Day 4",
    title: "First decision · prune the obvious loser",
    tone: "decide",
    actions: [
      "Pause the worst-performing angle (CTR < 1% after 2 days)",
      "Shift its budget to the leader",
      "If all 3 angles holding · split budget 50/30/20 by performance",
    ],
    watching: ["Whether the leader's CPL drifts after budget shift"],
    decision:
      "If leader's CPL stayed in band over 48 hrs → continue. Else hold the shift.",
  },
  {
    range: "Day 5-7",
    date: "Day 5 → 7",
    title: "Cohort expansion",
    tone: "scale",
    actions: [
      "Launch a 1% lookalike audience seeded on Day 1-4 qualified leads",
      "Brief 2 net-new angles informed by what worked in Days 1-4",
      "Add Stories placement to the winning angle",
    ],
    watching: [
      "LAL CPL vs. core (target: within 15%)",
      "Stories CTR vs. Feed CTR on the same creative",
    ],
  },
  {
    range: "Day 8-10",
    date: "Day 8 → 10",
    title: "Hold the line · measure quality",
    tone: "observe",
    actions: [
      "No major changes. Let the LAL and Stories test mature.",
      "Spot triggers Voice AI agent (Sherpa) on qualified leads as they come in",
      "Begin tracking qualified-to-enrolment conversion · 7-day window",
    ],
    watching: [
      "Qualification rate per source",
      "Voice agent connect + qual rate",
      "Any guardrail breach (frequency > 4×, sentiment dip)",
    ],
  },
  {
    range: "Day 11",
    date: "Day 11",
    title: "Second decision · double down or pivot",
    tone: "decide",
    actions: [
      "If overall CPL ≤ ₹400 and qual rate ≥ 12% → lift budget +50% on winners",
      "Else: pull the 2 weakest angles · brief 2 fresh ones for Days 12-14",
    ],
    watching: ["What the doubled budget does to the algo's learning"],
    decision: "Hit the threshold? Scale. Miss it? Iterate on creative.",
  },
  {
    range: "Day 12-14",
    date: "Day 12 → 14",
    title: "Closeout · learnings to memory",
    tone: "report",
    actions: [
      "Run the final 3 days at scaled budget (or with new creative if pivoted)",
      "Spot writes a Learnings entry to product memory · what won, what didn't, why",
      "Compile a Day-14 report on the dashboard: CPL trajectory, qual rate, CPQL",
    ],
    watching: [
      "End-of-window CPQL vs. baseline target",
      "Which insights to seed into the next experiment cycle",
    ],
  },
];

/* ════════════════════════════════════════════════════════════════
 * LaunchPlanStep — document-style plan
 *
 * Two phases:
 *   A. Path picker (only on first render). User chooses
 *      "Run experiment campaign" or "Set my own goal".
 *   B. The actual day-by-day plan document.
 *
 * Chat carries the single "Approve plan" CTA after the path is set.
 * ═══════════════════════════════════════════════════════════════ */

type PlanPath = "experiment" | "goal";

export function LaunchPlanStep({ workflow }: { workflow: LaunchWorkflow }) {
  // Default to experiment for new products (no productId) — Spot
  // suggests "let me run a 2-week experiment to figure out what
  // works". For existing products you could default to "goal" but
  // we keep the experiment path as the inviting default.
  const [path, setPath] = useState<PlanPath | null>(null);
  // Goal-path state — captured by the inline form.
  const [goal, setGoal] = useState({
    weeklyBudget: "4L",
    targetCpl: "400",
    targetLeads: "1,800",
    timeframe: "14 days",
  });

  return (
    <motion.div
      className="px-5 py-6 max-w-[760px] mx-auto"
      initial="hidden"
      animate="show"
      variants={canvasStagger}
    >
      {/* Document header */}
      <motion.div variants={canvasReveal} className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10.5px] uppercase tracking-wider text-text-tertiary font-semibold">
            Plan · {workflow.productName}
          </span>
          <span className="text-[10.5px] text-text-tertiary">·</span>
          <span className="text-[10.5px] text-text-tertiary">14 days · approve once</span>
        </div>
        <h2 className="text-[22px] font-semibold text-text-primary leading-tight">
          Here's what I'd do for the next two weeks.
        </h2>
        <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">
          A written, day-by-day plan. I'll execute it autonomously and report
          decisions on your dashboard. Approve to start Day 1 today.
        </p>
      </motion.div>

      {/* Step A · path picker */}
      {!path && (
        <motion.div variants={canvasReveal} className="mb-5">
          <div className="bg-[#FAF8F2] border border-[#E8E3D5] rounded-card p-4">
            <div className="flex items-start gap-2.5 mb-3">
              <SpotMark size={18} />
              <div className="flex-1 min-w-0">
                <div className="text-[10.5px] uppercase tracking-wider text-text-tertiary font-semibold mb-0.5">
                  How should I plan this?
                </div>
                <div className="text-[13.5px] text-text-primary leading-relaxed">
                  This is a brand-new product, so I'd suggest a 2-week experiment
                  to figure out what actually works. If you have a specific goal in
                  mind, I can plan around that instead.
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <PathOption
                title="Run an experiment campaign"
                blurb="Spot decides what to test. Best for new products with no past data."
                icon={Beaker}
                pickFirst
                onClick={() => setPath("experiment")}
              />
              <PathOption
                title="Set my own goal"
                blurb="Give me a target CPL / lead volume / timeframe and I'll plan to hit it."
                icon={Target}
                onClick={() => setPath("goal")}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Step B · goal form (when path === "goal") */}
      {path === "goal" && (
        <motion.div variants={canvasReveal} className="mb-5">
          <div className="bg-white border border-border rounded-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10.5px] uppercase tracking-wider text-text-tertiary font-semibold">
                Your goal · I'll plan around it
              </div>
              <button
                type="button"
                onClick={() => setPath(null)}
                className="text-[11px] text-text-tertiary hover:text-text-primary"
              >
                ← Back to options
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <GoalField
                label="Weekly budget"
                value={goal.weeklyBudget}
                prefix="₹"
                onChange={(v) => setGoal({ ...goal, weeklyBudget: v })}
              />
              <GoalField
                label="Target CPL"
                value={goal.targetCpl}
                prefix="₹"
                onChange={(v) => setGoal({ ...goal, targetCpl: v })}
              />
              <GoalField
                label="Target leads in window"
                value={goal.targetLeads}
                onChange={(v) => setGoal({ ...goal, targetLeads: v })}
              />
              <GoalField
                label="Timeframe"
                value={goal.timeframe}
                onChange={(v) => setGoal({ ...goal, timeframe: v })}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* The plan document itself · shown after a path is chosen */}
      {path && (
        <>
          <motion.div variants={canvasReveal} className="mb-4">
            <div className="bg-white border border-border rounded-card p-4 flex items-start gap-3">
              {path === "experiment" ? (
                <Beaker size={18} strokeWidth={1.6} className="text-text-secondary flex-shrink-0 mt-0.5" />
              ) : (
                <Target size={18} strokeWidth={1.6} className="text-text-secondary flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[10.5px] uppercase tracking-wider text-text-tertiary font-semibold mb-0.5">
                  Mission
                </div>
                <div className="text-[13.5px] font-medium text-text-primary leading-relaxed">
                  {path === "experiment" ? (
                    <>
                      Run a 14-day learning campaign on {workflow.productName}. Test 3
                      angles + 1 net-new persona + 2 channels. I'll prune losers and
                      double down on winners as data comes in. End state: a Learnings
                      entry in memory that powers the next launch.
                    </>
                  ) : (
                    <>
                      Hit <span className="font-semibold">{goal.targetLeads} leads at ₹{goal.targetCpl} CPL</span>{" "}
                      in {goal.timeframe} on {workflow.productName} at ₹{goal.weeklyBudget}/week.
                      I'll plan the budget split, creative rotation, and decision points to
                      stay in that band.
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* The day-by-day timeline */}
          <motion.div variants={canvasReveal}>
            <div className="flex items-center gap-1.5 mb-3 px-1">
              <Calendar size={12} strokeWidth={1.7} className="text-text-secondary" />
              <span className="text-[10.5px] uppercase tracking-wider text-text-tertiary font-semibold">
                Day-by-day · what I'll do
              </span>
            </div>
            <ol className="space-y-3 relative">
              {EXPERIMENT_PLAN.map((day, i) => (
                <PlanDayCard
                  key={i}
                  day={day}
                  index={i}
                  total={EXPERIMENT_PLAN.length}
                />
              ))}
            </ol>
          </motion.div>

          {/* Guardrails strip */}
          <motion.div
            variants={canvasReveal}
            className="bg-[#FAF8F2] border border-[#E8E3D5] rounded-card p-3 mt-4 flex items-start gap-2.5"
          >
            <ShieldCheck size={14} strokeWidth={1.7} className="text-[#15803D] flex-shrink-0 mt-0.5" />
            <div className="text-[12px] text-text-secondary leading-relaxed">
              <span className="text-text-primary font-medium">Automatic guardrails:</span>{" "}
              I'll pause any creative that hits frequency 4.5× or gets 3+ negative
              comments. CPL drift &gt; 20% triggers an auto-pause + ping. Nothing
              ships to a landing page without QA Agent sign-off.
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

function PathOption({
  title,
  blurb,
  icon: Icon,
  pickFirst,
  onClick,
}: {
  title: string;
  blurb: string;
  icon: typeof Target;
  pickFirst?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white rounded-card p-3.5 border border-border hover:border-text-primary hover:shadow-card-hover transition-all relative group"
    >
      {pickFirst && (
        <span
          className="absolute top-2 right-2 text-[9.5px] uppercase tracking-wider font-semibold text-[#15803D]"
          title="Spot's recommendation"
        >
          Recommended
        </span>
      )}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-card bg-surface-page flex items-center justify-center flex-shrink-0">
          <Icon size={13} strokeWidth={1.7} className="text-text-secondary" />
        </div>
        <span className="text-[13px] font-semibold text-text-primary">{title}</span>
      </div>
      <div className="text-[11.5px] text-text-secondary leading-snug">{blurb}</div>
      <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-text-tertiary group-hover:text-text-primary">
        Pick this <ArrowRight size={10} strokeWidth={1.8} />
      </div>
    </button>
  );
}

function GoalField({
  label,
  value,
  prefix,
  onChange,
}: {
  label: string;
  value: string;
  prefix?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-wider text-text-tertiary font-semibold block mb-1">
        {label}
      </span>
      <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-input border border-border bg-white focus-within:border-text-primary transition-colors">
        {prefix && <span className="text-[12.5px] text-text-tertiary">{prefix}</span>}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 outline-none text-[13px] text-text-primary tabular bg-transparent"
        />
      </span>
    </label>
  );
}

function PlanDayCard({
  day,
  index,
  total,
}: {
  day: PlanDay;
  index: number;
  total: number;
}) {
  const dotColor =
    day.tone === "launch"
      ? "bg-[#111]"
      : day.tone === "decide"
        ? "bg-[#92400E]"
        : day.tone === "scale"
          ? "bg-[#15803D]"
          : day.tone === "report"
            ? "bg-[#1D4ED8]"
            : "bg-text-tertiary";
  return (
    <li className="flex gap-3">
      {/* Spine dot + connecting line */}
      <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        {index < total - 1 && <div className="w-px flex-1 bg-border-subtle mt-1" />}
      </div>
      <div className="flex-1 min-w-0 pb-1">
        <div className="bg-white border border-border rounded-card p-4">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[10.5px] uppercase tracking-wider text-text-tertiary font-semibold">
                {day.range}
              </span>
              <span className="text-[10.5px] text-text-tertiary">· {day.date}</span>
            </div>
          </div>
          <div className="text-[14px] font-semibold text-text-primary leading-tight mb-2.5">
            {day.title}
          </div>

          {/* What I'll do */}
          <div className="mb-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={10} strokeWidth={1.8} className="text-text-secondary" />
              <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
                What I'll do
              </span>
            </div>
            <ul className="space-y-1">
              {day.actions.map((a, i) => (
                <li
                  key={i}
                  className="text-[12.5px] text-text-primary leading-relaxed flex gap-1.5"
                >
                  <ChevronRight
                    size={10}
                    strokeWidth={1.8}
                    className="text-text-tertiary flex-shrink-0 mt-1"
                  />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What I'll watch */}
          {day.watching.length > 0 && (
            <div className="pt-2.5 border-t border-border-subtle">
              <div className="flex items-center gap-1.5 mb-1">
                <Eye size={10} strokeWidth={1.8} className="text-text-secondary" />
                <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
                  What I'll watch
                </span>
              </div>
              <ul className="space-y-0.5">
                {day.watching.map((w, i) => (
                  <li
                    key={i}
                    className="text-[11.5px] text-text-secondary leading-relaxed flex gap-1.5"
                  >
                    <span className="text-text-tertiary">·</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Decision */}
          {day.decision && (
            <div className="pt-2.5 mt-2.5 border-t border-border-subtle bg-surface-page -mx-4 -mb-4 px-4 pb-3 rounded-b-card">
              <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-1 mt-1.5">
                Decision rule
              </div>
              <div className="text-[12px] text-text-primary leading-relaxed italic">
                {day.decision}
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

/* ════════════════════════════════════════════════════════════════
 * LaunchBuildingStep · Spot orbit + cycling plan-progress labels
 * ═══════════════════════════════════════════════════════════════ */

const PLAN_PROGRESS_MESSAGES = [
  "Spinning up Creative Agent · drafting Day-1 angles…",
  "Briefing Resize Agent on the variant matrix…",
  "Building the demo-class landing page · mobile-first…",
  "Composing the Day-1 lead form…",
  "Compiling the Meta + Google campaign tree…",
  "Provisioning Sherpa (Voice + WA) on the inbound pool…",
  "Setting up the watchers · CPL · sentiment · frequency…",
  "Queueing Day-1 deploy to ad accounts…",
];

export function LaunchBuildingStep({ workflow }: { workflow: LaunchWorkflow }) {
  return (
    <div className="h-full flex items-center justify-center px-5 py-8">
      <SpotFullscreen
        title={`Working on the plan · ${workflow.productName}`}
        messages={PLAN_PROGRESS_MESSAGES}
        size={72}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
 * LaunchReviewStep · everything Spot built, for final approval
 * ═══════════════════════════════════════════════════════════════ */

const PROPOSED_CREATIVES_REVIEW = [
  { id: "c1", hook: "Mentor-led classes · capped at 60 students", persona: "Engineer Parent", format: "Reel", hue: 215 },
  { id: "c2", hook: "Your kid's own progress · updated every Friday", persona: "Engineer Parent", format: "Static", hue: 28 },
  { id: "c3", hook: "Doubt-clearing in 15 minutes · live", persona: "Self-Studier", format: "Reel", hue: 145 },
  { id: "c4", hook: "24-month replay · no time pressure", persona: "Self-Studier", format: "Carousel", hue: 290 },
  { id: "c5", hook: "Mentor 1:1 every fortnight · finally heard", persona: "Coaching Hopper", format: "Static", hue: 12 },
  { id: "c6", hook: "Switching mid-year? We cover the gap", persona: "Coaching Hopper", format: "Reel", hue: 180 },
];

const PROPOSED_PAGES_REVIEW = [
  { id: "lp1", title: "Demo class booking · Engineer Parent", persona: "Engineer Parent", sections: 6 },
  { id: "lp2", title: "Free-mock landing · Self-Studier", persona: "Self-Studier", sections: 5 },
  { id: "lp3", title: "1:1 call landing · Coaching Hopper", persona: "Coaching Hopper", sections: 4 },
];

const SAMPLE_FORMS_COUNT = 2;

export function LaunchReviewStep({ workflow }: { workflow: LaunchWorkflow }) {
  return (
    <motion.div
      className="px-5 py-6 max-w-[820px] mx-auto"
      initial="hidden"
      animate="show"
      variants={canvasStagger}
    >
      <motion.div variants={canvasReveal} className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0]">
            <span className="inline-flex w-1.5 h-1.5 rounded-full bg-[#15803D]" />
            <span className="text-[10.5px] uppercase tracking-wider text-[#15803D] font-semibold">
              Build complete · ready to deploy
            </span>
          </span>
          <span className="text-[11px] text-text-tertiary">{workflow.productName}</span>
        </div>

        <div className="bg-white border border-border rounded-card p-4">
          <div className="grid grid-cols-5 gap-3">
            <ReviewStat label="Creatives" value="18" sub="12 statics + 6 reels" />
            <ReviewStat label="Resized variants" value="72" sub="4 sizes per angle" />
            <ReviewStat label="Landing pages" value="3" sub="mobile-first" />
            <ReviewStat label="Lead forms" value={`${SAMPLE_FORMS_COUNT}`} sub="+ WhatsApp scripts" />
            <ReviewStat label="Campaigns" value="3" sub="Meta + Google" />
          </div>
        </div>
      </motion.div>

      <motion.div variants={canvasReveal} className="mb-4">
        <ReviewSectionHeader
          icon={ImageIcon}
          title="Generated creatives"
          count={`${PROPOSED_CREATIVES_REVIEW.length} angles · 18 assets total`}
          subtitle="Each angle resized into 4 formats. QA Agent reviewed all 72."
        />
        <div className="grid grid-cols-3 gap-2.5">
          {PROPOSED_CREATIVES_REVIEW.map((c) => {
            const Icon = c.format === "Reel" ? Layers : c.format === "Carousel" ? Layout : ImageIcon;
            return (
              <div
                key={c.id}
                className="bg-white border border-border rounded-card overflow-hidden"
              >
                <div
                  className="relative aspect-[4/3] w-full"
                  style={{
                    background: `linear-gradient(135deg, hsl(${c.hue} 60% 90%), hsl(${c.hue} 50% 70%))`,
                  }}
                >
                  <div className="absolute top-2 left-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/85 backdrop-blur-sm">
                    <Icon size={10} strokeWidth={1.7} />
                  </div>
                  <div className="absolute top-2 right-2 text-[9.5px] font-medium text-text-secondary bg-white/85 px-1.5 rounded-sm">
                    {c.format}
                  </div>
                  <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 text-[9.5px] font-medium bg-white/90 px-1.5 py-0.5 rounded-sm">
                    <CheckCircle2 size={9} strokeWidth={2} className="text-[#15803D]" />
                    <span>QA passed</span>
                  </div>
                </div>
                <div className="p-2.5">
                  <div className="text-[11.5px] font-medium text-text-primary leading-snug line-clamp-2 min-h-[2.6em]">
                    {c.hook}
                  </div>
                  <div className="text-[10.5px] text-text-tertiary mt-1">{c.persona}</div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={canvasReveal} className="mb-4">
        <ReviewSectionHeader
          icon={Smartphone}
          title="Landing pages"
          count={`${PROPOSED_PAGES_REVIEW.length} pages · mobile + desktop`}
          subtitle="Mobile-first, sticky CTA above the fold, brand-aligned typography."
        />
        <div className="grid grid-cols-3 gap-2.5">
          {PROPOSED_PAGES_REVIEW.map((p, i) => (
            <div
              key={p.id}
              className="bg-white border border-border rounded-card p-3 flex items-start gap-3"
            >
              <div className="w-14 h-24 rounded-[6px] bg-gradient-to-b from-[#FAF8F2] to-white border border-border-subtle flex-shrink-0 relative overflow-hidden">
                <div className="absolute top-1.5 left-1.5 right-1.5 h-1.5 rounded-full bg-text-tertiary/20" />
                <div className="absolute top-4 left-1.5 right-1.5 space-y-1">
                  <div className="h-1 rounded-full bg-text-tertiary/15 w-3/4" />
                  <div className="h-1 rounded-full bg-text-tertiary/15 w-full" />
                  <div className="h-1 rounded-full bg-text-tertiary/15 w-2/3" />
                </div>
                <div
                  className="absolute bottom-1.5 left-1.5 right-1.5 h-2 rounded-[2px]"
                  style={{
                    background: i === 0 ? "#1877F2" : i === 1 ? "#15803D" : "#F5A623",
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-text-primary leading-tight mb-0.5">
                  {p.title}
                </div>
                <div className="text-[10.5px] text-text-tertiary mb-2">
                  {p.sections} sections · {p.persona}
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 h-6 px-1.5 rounded-button text-[10.5px] text-text-tertiary hover:text-text-primary"
                >
                  <ArrowUpRight size={9} strokeWidth={1.8} />
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={canvasReveal} className="grid grid-cols-3 gap-2.5 mb-4">
        <ReviewBucket icon={FileText} title="Lead forms" count={`${SAMPLE_FORMS_COUNT}`} subtitle="Meta + WhatsApp" />
        <ReviewBucket icon={Megaphone} title="Campaign tree" count="3" subtitle="Meta + Google · 23 ads total" />
        <ReviewBucket icon={Mic} title="Voice agent" count="Sherpa" subtitle="Voice + WA · provisioned" />
      </motion.div>

      <motion.div
        variants={canvasReveal}
        className="bg-[#FAF8F2] border border-[#E8E3D5] rounded-card p-4 flex items-start gap-3"
      >
        <Target size={16} strokeWidth={1.7} className="text-text-secondary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-[10.5px] uppercase tracking-wider text-text-tertiary mb-1 font-semibold">
            Deploying will
          </div>
          <ul className="space-y-1 text-[12px] text-text-primary leading-relaxed">
            <li className="flex gap-1.5">
              <CheckCircle2 size={11} strokeWidth={2} className="text-[#15803D] flex-shrink-0 mt-0.5" />
              <span>Push 3 campaigns live on Meta + Google · Day-1 budget per the plan</span>
            </li>
            <li className="flex gap-1.5">
              <CheckCircle2 size={11} strokeWidth={2} className="text-[#15803D] flex-shrink-0 mt-0.5" />
              <span>
                Publish 3 landing pages at guyjus.com/
                {workflow.productName.toLowerCase().replace(/[^a-z]+/g, "-")}
              </span>
            </li>
            <li className="flex gap-1.5">
              <CheckCircle2 size={11} strokeWidth={2} className="text-[#15803D] flex-shrink-0 mt-0.5" />
              <span>Activate Sherpa (Voice + WhatsApp) on inbound leads</span>
            </li>
            <li className="flex gap-1.5">
              <CheckCircle2 size={11} strokeWidth={2} className="text-[#15803D] flex-shrink-0 mt-0.5" />
              <span>Start the watchers · I'll surface every decision on your dashboard</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReviewStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-0.5">
        {label}
      </div>
      <div className="text-[18px] font-semibold text-text-primary tabular leading-none">
        {value}
      </div>
      <div className="text-[10px] text-text-tertiary mt-1">{sub}</div>
    </div>
  );
}

function ReviewSectionHeader({
  icon: Icon,
  title,
  count,
  subtitle,
}: {
  icon: typeof Users;
  title: string;
  count: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F0FDF4] text-[#15803D]">
        <Icon size={13} strokeWidth={1.7} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-text-primary">{title}</span>
          <span className="text-[11px] text-text-tertiary">{count}</span>
        </div>
        <div className="text-[11px] text-text-tertiary mt-0.5">{subtitle}</div>
      </div>
    </div>
  );
}

function ReviewBucket({
  icon: Icon,
  title,
  count,
  subtitle,
}: {
  icon: typeof Users;
  title: string;
  count: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white border border-border rounded-card p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} strokeWidth={1.7} className="text-text-secondary" />
        <div className="text-[11.5px] font-medium text-text-secondary">{title}</div>
        <span className="ml-auto pill pill-ok" style={{ fontSize: 9.5 }}>
          Ready
        </span>
      </div>
      <div className="text-[20px] font-semibold text-text-primary tabular leading-none mb-1">
        {count}
      </div>
      <div className="text-[10.5px] text-text-tertiary">{subtitle}</div>
    </div>
  );
}
