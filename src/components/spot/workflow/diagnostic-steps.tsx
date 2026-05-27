"use client";

// Canvas components for the three diagnostic Spot workflows:
//
//   · Scale          — analyse winners, propose scale plays, project
//                      impact, deploy.
//   · Optimize       — find problem campaigns, drill into root cause,
//                      propose fixes, deploy.
//   · Test Angles    — audit creatives (winners / losers / unproven),
//                      synthesise insights, generate new angles,
//                      schedule the A/B test.
//
// All three share the same DiagnosticWorkflow shape, so the dispatcher
// is a single component (`DiagnosticStep`) that switches on the active
// step name. Each panel is read-only — approval lives in the chat (the
// step-cta in stepIntroMessage).

import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Film,
  ImageIcon,
  Layout,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Users,
  Zap,
  Search as SearchIcon,
  Activity,
  PartyPopper,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useSpotStore } from "@/lib/spot/store";
import { SpotMark } from "@/components/spot/spot-mark";
import type { DiagnosticWorkflow } from "@/lib/spot/workflow";
import {
  SCALE_WINNERS,
  SCALE_STRATEGIES,
  SCALE_IMPACT,
  PROBLEM_CAMPAIGNS,
  ROOT_CAUSES,
  FIX_PLANS,
  ANGLE_AUDIT,
  ANGLE_SYNTHESIS,
  PROPOSED_ANGLES,
  ANGLE_TEST_PLAN,
} from "@/lib/spot/extended-flows";

// Slow card-by-card reveal — matches the launch flow's canvas stagger.
const canvasStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.05 } },
};
const canvasReveal: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

/* ─── Dispatcher ────────────────────────────────────────────────── */

export function DiagnosticStep({ workflow }: { workflow: DiagnosticWorkflow }) {
  switch (workflow.step) {
    case "scale-analyze":
      return <ScaleAnalyzeStep workflow={workflow} />;
    case "scale-strategies":
      return <ScaleStrategiesStep />;
    case "scale-impact":
      return <ScaleImpactStep />;
    case "scale-deploy":
      return <ScaleDeployStep workflow={workflow} />;

    case "opt-diagnose":
      return <OptDiagnoseStep />;
    case "opt-root-cause":
      return <OptRootCauseStep />;
    case "opt-fix-plan":
      return <OptFixPlanStep />;
    case "opt-deploy":
      return <OptDeployStep workflow={workflow} />;

    case "ang-audit":
      return <AngAuditStep />;
    case "ang-insights":
      return <AngInsightsStep />;
    case "ang-generate":
      return <AngGenerateStep />;
    case "ang-test-plan":
      return <AngTestPlanStep />;

    case "done":
      return <DiagnosticDoneStep workflow={workflow} />;

    default:
      return null;
  }
}

/* ─── Shared bits ─────────────────────────────────────────────── */

function StepHeader({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-section-header text-text-primary">{title}</h2>
      <p className="text-meta text-text-secondary mt-1 max-w-[640px]">{blurb}</p>
    </div>
  );
}

function ToneCellDelta({ delta, tone }: { delta: string; tone?: "good" | "bad" }) {
  const color =
    tone === "good" ? "text-[#15803D]" : tone === "bad" ? "text-[#B91C1C]" : "text-text-tertiary";
  return <span className={`text-[10.5px] tabular ${color}`}>{delta}</span>;
}

function MetricChip({
  label,
  value,
  delta,
  deltaTone,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "good" | "bad";
}) {
  return (
    <div className="bg-surface-page border border-border-subtle rounded-input px-2.5 py-1.5">
      <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-0.5">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[13px] font-medium text-text-primary tabular">{value}</span>
        {delta && <ToneCellDelta delta={delta} tone={deltaTone} />}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
 * SCALE WITH SPOT
 * ═══════════════════════════════════════════════════════════════ */

function ScaleAnalyzeStep({ workflow }: { workflow: DiagnosticWorkflow }) {
  if (!workflow.ready) {
    return (
      <div className="px-5 py-5">
        <div className="skeleton h-7 w-64 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-border rounded-card p-4">
              <div className="skeleton h-5 w-2/3 rounded mb-3" />
              <div className="grid grid-cols-5 gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="skeleton h-12 rounded" />
                ))}
              </div>
              <div className="skeleton h-4 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <motion.div
      className="px-5 py-5"
      initial="hidden"
      animate="show"
      variants={canvasStagger}
    >
      <motion.div variants={canvasReveal}>
        <StepHeader
          title="What's winning"
          blurb="Three clear wins · ranked by lift × headroom. The why matters more than the numbers — that's where the scale strategy comes from."
        />
      </motion.div>

      <div className="space-y-3">
        {SCALE_WINNERS.map((w, i) => (
          <motion.div
            key={w.id}
            variants={canvasReveal}
            className="bg-white border border-border rounded-card p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#15803D]/10 text-[#15803D] text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <div className="text-card-title text-text-primary">{w.label}</div>
                </div>
                <div className="text-[11.5px] text-text-tertiary ml-7">{w.context}</div>
              </div>
              <HeadroomChip headroom={w.headroom} saturation={w.saturation} />
            </div>

            <div className="grid grid-cols-5 gap-2 mb-3">
              {w.metrics.map((m) => (
                <MetricChip
                  key={m.label}
                  label={m.label}
                  value={m.value}
                  delta={m.delta}
                  deltaTone={m.deltaTone}
                />
              ))}
            </div>

            <div className="text-[12.5px] text-text-secondary leading-relaxed flex gap-2">
              <Sparkles size={12} strokeWidth={1.6} className="text-text-tertiary flex-shrink-0 mt-0.5" />
              <span>{w.why}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function HeadroomChip({
  headroom,
  saturation,
}: {
  headroom: "high" | "medium" | "low";
  saturation: number;
}) {
  const tone =
    headroom === "high" ? "pill-ok" : headroom === "medium" ? "pill-info" : "pill-warn";
  const label =
    headroom === "high" ? "High headroom" : headroom === "medium" ? "Some headroom" : "Saturated";
  return (
    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      <span className={`pill ${tone}`}>{label}</span>
      <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary tabular">
        <span>{saturation}% saturated</span>
        <div className="w-16 h-1 rounded-full bg-surface-secondary overflow-hidden">
          <div
            className={`h-full ${headroom === "high" ? "bg-[#15803D]" : headroom === "medium" ? "bg-[#3B82F6]" : "bg-[#F5A623]"}`}
            style={{ width: `${saturation}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ScaleStrategiesStep() {
  const selectedIds = useSpotStore((s) =>
    s.workflow && s.workflow.kind !== "launch-campaign" ? s.workflow.selectedIds : [],
  );
  const togglePick = useSpotStore((s) => s.toggleDiagnosticPick);
  // Pre-select "pick first" strategies on initial render of the step.
  // This mirrors the personas-preselect behaviour from launch.
  if (selectedIds.length === 0) {
    SCALE_STRATEGIES.filter((s) => s.pickFirst).forEach((s) => togglePick(s.id));
  }

  return (
    <motion.div className="px-5 py-5" initial="hidden" animate="show" variants={canvasStagger}>
      <motion.div variants={canvasReveal}>
        <StepHeader
          title="Scale strategies"
          blurb="Four plays · ranked by confidence × impact. Spot's recommendation is highlighted. Pick what to ship — combinations are encouraged."
        />
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {SCALE_STRATEGIES.map((s) => {
          const isSelected = selectedIds.includes(s.id);
          return (
            <motion.button
              key={s.id}
              type="button"
              variants={canvasReveal}
              onClick={() => togglePick(s.id)}
              className={`text-left bg-white rounded-card p-4 transition-all duration-150 ${
                isSelected
                  ? "border-2 border-text-primary shadow-card-hover"
                  : "border border-border hover:border-border-hover"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-[13px] font-semibold text-text-primary leading-tight">
                  {s.title}
                </div>
                <SelectIndicator selected={isSelected} />
              </div>
              <div className="text-[12px] text-text-secondary mb-3">{s.blurb}</div>

              <div className="text-[11.5px] text-text-primary leading-relaxed mb-2.5">
                {s.rationale}
              </div>

              <div className="space-y-1.5 pt-2.5 border-t border-border-subtle">
                <KeyValueRow icon={TrendingUp} label="Impact" value={s.projectedImpact} tone="good" />
                <KeyValueRow icon={AlertTriangle} label="Risk" value={s.risk} tone="warn" />
              </div>

              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border-subtle">
                <span className="text-[10.5px] text-text-tertiary">
                  Confidence · {s.confidence}
                </span>
                {s.pickFirst && (
                  <span className="inline-flex items-center gap-1 text-[10.5px] text-text-primary font-medium">
                    <Sparkles size={9} strokeWidth={2} />
                    Spot recommends shipping first
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function KeyValueRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  tone?: "good" | "warn";
}) {
  const iconColor = tone === "good" ? "text-[#15803D]" : tone === "warn" ? "text-[#92400E]" : "text-text-tertiary";
  return (
    <div className="flex items-start gap-1.5 text-[11.5px]">
      <Icon size={11} strokeWidth={1.7} className={`${iconColor} flex-shrink-0 mt-0.5`} />
      <span className="text-text-tertiary">{label}:</span>
      <span className="text-text-primary flex-1">{value}</span>
    </div>
  );
}

function SelectIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0 transition-all ${
        selected
          ? "bg-text-primary text-[#FAFAF8]"
          : "border-2 border-border bg-white"
      }`}
    >
      {selected && (
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path
            d="M1.5 4.5L3.5 6.5L7.5 2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

function ScaleImpactStep() {
  return (
    <motion.div className="px-5 py-5" initial="hidden" animate="show" variants={canvasStagger}>
      <motion.div variants={canvasReveal}>
        <StepHeader
          title="Projected impact · next 30 days"
          blurb="Range estimates · weighted by historical accuracy of similar moves on this workspace. Tracking band assumes the staged rollout I'll deploy at the next step."
        />
      </motion.div>

      <motion.div
        variants={canvasReveal}
        className="bg-white border border-border rounded-card overflow-hidden"
      >
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1.1fr] gap-3 px-4 py-2.5 border-b border-border bg-surface-page text-[10.5px] font-medium uppercase tracking-wider text-text-tertiary">
          <div>Metric</div>
          <div className="text-right">Current</div>
          <div className="text-right">Projected</div>
          <div className="text-right">Δ</div>
        </div>
        {SCALE_IMPACT.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1.4fr_1fr_1fr_1.1fr] gap-3 px-4 py-3 border-b border-border-subtle items-center last:border-0"
          >
            <div className="text-[13px] text-text-primary">{row.label}</div>
            <div className="text-right text-[13px] text-text-secondary tabular">{row.current}</div>
            <div className="text-right text-[13px] text-text-primary tabular font-medium">
              {row.projected}
            </div>
            <div
              className={`text-right text-[12.5px] tabular ${
                row.tone === "good"
                  ? "text-[#15803D]"
                  : row.tone === "bad"
                    ? "text-[#B91C1C]"
                    : "text-text-secondary"
              }`}
            >
              {row.delta}
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div
        variants={canvasReveal}
        className="bg-[#FAF8F2] border border-[#E8E3D5] rounded-card p-3 mt-4 flex items-start gap-2.5"
      >
        <SpotMark size={16} />
        <div className="text-[12px] text-text-secondary leading-relaxed">
          <span className="text-text-primary font-medium">My read:</span> CPL drifts up a little
          (+3-7%) because we're spending into a wider audience — but qualified-lead volume jumps
          37-53%, and CPQL stays flat. That's the trade we want. If CPL drift exceeds 12% on Day 5,
          I'll auto-throttle the budget lift.
        </div>
      </motion.div>
    </motion.div>
  );
}

function ScaleDeployStep({ workflow }: { workflow: DiagnosticWorkflow }) {
  const selectedIds = workflow.selectedIds.length > 0
    ? workflow.selectedIds
    : SCALE_STRATEGIES.filter((s) => s.pickFirst).map((s) => s.id);
  const picked = SCALE_STRATEGIES.filter((s) => selectedIds.includes(s.id));

  return (
    <motion.div className="px-5 py-5" initial="hidden" animate="show" variants={canvasStagger}>
      <motion.div variants={canvasReveal}>
        <StepHeader
          title="Ready to ship"
          blurb="Final review · the staged rollout below + the changes I'll make on each ad account."
        />
      </motion.div>

      <motion.div variants={canvasReveal} className="space-y-2.5">
        <Timeline
          steps={[
            {
              when: "Day 0 · today",
              title: "Stage 1 budget lift · +25% on top 2 ad sets",
              detail: "Engineer Parent + Self-Studier. Watch CPL for 48 hrs.",
              icon: Zap,
            },
            ...(picked.some((p) => p.id === "strat-3")
              ? [{
                  when: "Day 2",
                  title: "Launch 1% LAL audience",
                  detail: "Seed: 248 qualified-lead cohort. New ad set in Scaling bucket.",
                  icon: Target,
                }]
              : []),
            {
              when: "Day 3",
              title: "Stage 2 budget lift · +25% (compounds to +50% total)",
              detail: "Only if Stage 1 CPL drift ≤ 8%. Else hold.",
              icon: TrendingUp,
            },
            ...(picked.some((p) => p.id === "strat-4")
              ? [{
                  when: "Day 4",
                  title: "Add Stories + Reels Discover placements",
                  detail: "Same creative · just opens up placement.",
                  icon: Activity,
                }]
              : []),
            ...(picked.some((p) => p.id === "strat-2")
              ? [{
                  when: "Day 7",
                  title: "Geo expand to Indore, Lucknow, Coimbatore",
                  detail: "After 7d of stable Stage 1 — only fire if CPL stays in band.",
                  icon: Target,
                }]
              : []),
          ]}
        />
      </motion.div>

      <motion.div
        variants={canvasReveal}
        className="bg-[#FAF8F2] border border-[#E8E3D5] rounded-card p-3 mt-4 flex items-start gap-2.5"
      >
        <SpotMark size={16} />
        <div className="text-[12px] text-text-secondary leading-relaxed">
          <span className="text-text-primary font-medium">Guardrails:</span> if CPL exceeds +12% drift
          on any stage, I pause that stage automatically and ping you. If frequency hits 4.5× on a
          winning ad, I'll rotate creative without waiting for permission. Both behaviours can be
          tuned later.
        </div>
      </motion.div>
    </motion.div>
  );
}

function Timeline({
  steps,
}: {
  steps: { when: string; title: string; detail: string; icon: typeof Zap }[];
}) {
  return (
    <div className="bg-white border border-border rounded-card p-4">
      <ol className="space-y-3 relative">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={i} className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <div className="w-6 h-6 rounded-full bg-[#111] text-[#FAFAF8] flex items-center justify-center flex-shrink-0">
                  <Icon size={12} strokeWidth={1.7} />
                </div>
                {i < steps.length - 1 && <div className="w-px flex-1 bg-border-subtle mt-1" />}
              </div>
              <div className="flex-1 pb-1">
                <div className="text-[10.5px] text-text-tertiary uppercase tracking-wider mb-0.5">
                  {s.when}
                </div>
                <div className="text-[13px] font-medium text-text-primary mb-0.5">{s.title}</div>
                <div className="text-[11.5px] text-text-secondary leading-relaxed">{s.detail}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
 * OPTIMIZE CAMPAIGNS
 * ═══════════════════════════════════════════════════════════════ */

function OptDiagnoseStep() {
  const ready = useSpotStore((s) =>
    s.workflow && s.workflow.kind !== "launch-campaign" ? s.workflow.ready : true,
  );
  const focusedId = useSpotStore((s) =>
    s.workflow && s.workflow.kind !== "launch-campaign" ? s.workflow.focusedProblemId : null,
  );
  const focusProblem = useSpotStore((s) => s.focusProblem);

  if (!ready) {
    return (
      <div className="px-5 py-5">
        <div className="skeleton h-7 w-72 rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-border rounded-card p-4">
              <div className="skeleton h-5 w-3/4 rounded mb-3" />
              <div className="skeleton h-4 w-full rounded mb-2" />
              <div className="skeleton h-4 w-2/3 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  // Auto-focus the first problem if nothing focused yet.
  if (!focusedId && PROBLEM_CAMPAIGNS.length > 0) {
    focusProblem(PROBLEM_CAMPAIGNS[0].id);
  }

  const recent = PROBLEM_CAMPAIGNS.filter((p) => p.kind === "recent-decay");
  const chronic = PROBLEM_CAMPAIGNS.filter((p) => p.kind === "chronic");

  return (
    <motion.div className="px-5 py-5" initial="hidden" animate="show" variants={canvasStagger}>
      <motion.div variants={canvasReveal}>
        <StepHeader
          title="Where it's bleeding"
          blurb="Two campaigns flagged · the patterns are different. Recent decay = something changed. Chronic = it's never worked. Different fixes."
        />
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <ProblemColumn
          title="Recent decay"
          subtitle="Was working — just broke"
          icon={TrendingDown}
          tone="bad"
          problems={recent}
          focusedId={focusedId}
          onFocus={focusProblem}
        />
        <ProblemColumn
          title="Chronic underperformers"
          subtitle="Never hit target since launch"
          icon={AlertTriangle}
          tone="warn"
          problems={chronic}
          focusedId={focusedId}
          onFocus={focusProblem}
        />
      </div>
    </motion.div>
  );
}

function ProblemColumn({
  title,
  subtitle,
  icon: Icon,
  tone,
  problems,
  focusedId,
  onFocus,
}: {
  title: string;
  subtitle: string;
  icon: typeof TrendingDown;
  tone: "bad" | "warn";
  problems: typeof PROBLEM_CAMPAIGNS;
  focusedId: string | null;
  onFocus: (id: string) => void;
}) {
  const iconColor = tone === "bad" ? "text-[#B91C1C]" : "text-[#92400E]";
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} strokeWidth={1.7} className={iconColor} />
        <div className="text-[12.5px] font-medium text-text-primary">{title}</div>
        <div className="text-[11px] text-text-tertiary">· {subtitle}</div>
      </div>
      <div className="space-y-2.5">
        {problems.map((p) => {
          const focused = focusedId === p.id;
          return (
            <motion.button
              key={p.id}
              variants={canvasReveal}
              type="button"
              onClick={() => onFocus(p.id)}
              className={`w-full text-left bg-white rounded-card p-3.5 transition-all ${
                focused
                  ? "border-2 border-text-primary shadow-card-hover"
                  : "border border-border hover:border-border-hover"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="text-[12.5px] font-semibold text-text-primary leading-tight">
                  {p.name}
                </div>
                <span
                  className={`pill ${
                    p.severity === "high" ? "pill-err" : p.severity === "medium" ? "pill-warn" : "pill"
                  }`}
                >
                  {p.severity}
                </span>
              </div>
              <div className="text-[11px] text-text-tertiary mb-2.5">{p.context}</div>

              <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                {p.metrics.map((m) => (
                  <MetricChip
                    key={m.label}
                    label={m.label}
                    value={m.value}
                    delta={m.delta}
                    deltaTone={m.deltaTone}
                  />
                ))}
              </div>

              <div className="text-[12px] text-text-secondary leading-relaxed">{p.headline}</div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

const ROOT_CAUSE_ICON: Record<string, typeof ShieldAlert> = {
  "creative-fatigue": Activity,
  "negative-sentiment": MessageSquare,
  "audience-saturation": Users,
  competitor: Target,
  attribution: SearchIcon,
  pricing: TrendingDown,
  "landing-page": Layout,
};

function OptRootCauseStep() {
  return (
    <motion.div className="px-5 py-5" initial="hidden" animate="show" variants={canvasStagger}>
      <motion.div variants={canvasReveal}>
        <StepHeader
          title="Why it's happening"
          blurb="Spot's root-cause analysis · evidence per cause, ranked by confidence. Multiple causes can compound — fixes target each independently."
        />
      </motion.div>

      <div className="space-y-3">
        {PROBLEM_CAMPAIGNS.map((problem) => {
          const causes = ROOT_CAUSES.filter((rc) => rc.problemId === problem.id);
          return (
            <motion.div
              key={problem.id}
              variants={canvasReveal}
              className="bg-white border border-border rounded-card overflow-hidden"
            >
              <div className="px-4 py-2.5 border-b border-border-subtle bg-surface-page">
                <div className="text-[12.5px] font-semibold text-text-primary">{problem.name}</div>
                <div className="text-[10.5px] text-text-tertiary mt-0.5">
                  {causes.length} root cause{causes.length === 1 ? "" : "s"} identified
                </div>
              </div>
              <div className="divide-y divide-border-subtle">
                {causes.map((rc) => {
                  const Icon = ROOT_CAUSE_ICON[rc.category] ?? ShieldAlert;
                  return (
                    <div key={rc.id} className="px-4 py-3">
                      <div className="flex items-start gap-2.5 mb-2">
                        <div className="w-7 h-7 rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0">
                          <Icon size={13} strokeWidth={1.6} className="text-text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-text-primary leading-tight">
                            {rc.issue}
                          </div>
                          <div className="text-[10.5px] text-text-tertiary mt-0.5">
                            Confidence · {rc.confidence}
                          </div>
                        </div>
                      </div>
                      <ul className="space-y-1 ml-9">
                        {rc.evidence.map((ev, i) => (
                          <li
                            key={i}
                            className="text-[11.5px] text-text-secondary leading-relaxed flex gap-2"
                          >
                            <span className="text-text-tertiary">·</span>
                            <span>{ev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function OptFixPlanStep() {
  const selectedIds = useSpotStore((s) =>
    s.workflow && s.workflow.kind !== "launch-campaign" ? s.workflow.selectedIds : [],
  );
  const togglePick = useSpotStore((s) => s.toggleDiagnosticPick);
  if (selectedIds.length === 0) {
    FIX_PLANS.filter((f) => f.pickFirst).forEach((f) => togglePick(f.id));
  }

  return (
    <motion.div className="px-5 py-5" initial="hidden" animate="show" variants={canvasStagger}>
      <motion.div variants={canvasReveal}>
        <StepHeader
          title="Fix plan"
          blurb="One fix per root cause · ranked by effort × impact. Pick the ones to ship. Effort tags help triage what gets shipped today vs. queued."
        />
      </motion.div>

      <div className="space-y-2.5">
        {FIX_PLANS.map((fix) => {
          const rc = ROOT_CAUSES.find((r) => r.id === fix.addressesRootCauseId);
          const problem = rc ? PROBLEM_CAMPAIGNS.find((p) => p.id === rc.problemId) : null;
          const isSelected = selectedIds.includes(fix.id);
          return (
            <motion.button
              key={fix.id}
              variants={canvasReveal}
              type="button"
              onClick={() => togglePick(fix.id)}
              className={`w-full text-left bg-white rounded-card p-4 transition-all ${
                isSelected
                  ? "border-2 border-text-primary shadow-card-hover"
                  : "border border-border hover:border-border-hover"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[10.5px] text-text-tertiary mb-0.5">
                    {problem?.name} · addresses: {rc?.issue.split(" · ")[0]}
                  </div>
                  <div className="text-[13.5px] font-semibold text-text-primary leading-tight">
                    {fix.action}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <SelectIndicator selected={isSelected} />
                  <EffortChip effort={fix.effort} />
                </div>
              </div>
              <div className="text-[12px] text-text-secondary leading-relaxed mb-2">{fix.detail}</div>
              <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px]">
                <span className="text-text-tertiary">Projected:</span>
                <span className="text-[#15803D] font-medium text-right">{fix.projectedImpact}</span>
              </div>
              {fix.pickFirst && (
                <div className="mt-2 text-[10.5px] text-text-primary font-medium inline-flex items-center gap-1">
                  <Sparkles size={9} strokeWidth={2} />
                  Spot recommends shipping first
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function EffortChip({ effort }: { effort: "small" | "medium" | "large" }) {
  const tone =
    effort === "small" ? "pill-ok" : effort === "medium" ? "pill-info" : "pill-warn";
  return <span className={`pill ${tone}`}>{effort} effort</span>;
}

function OptDeployStep({ workflow }: { workflow: DiagnosticWorkflow }) {
  const selectedIds = workflow.selectedIds.length > 0
    ? workflow.selectedIds
    : FIX_PLANS.filter((f) => f.pickFirst).map((f) => f.id);
  const picked = FIX_PLANS.filter((f) => selectedIds.includes(f.id));
  const smallFixes = picked.filter((f) => f.effort === "small");
  const mediumFixes = picked.filter((f) => f.effort === "medium");
  const largeFixes = picked.filter((f) => f.effort === "large");

  return (
    <motion.div className="px-5 py-5" initial="hidden" animate="show" variants={canvasStagger}>
      <motion.div variants={canvasReveal}>
        <StepHeader
          title="Ready to ship"
          blurb={`${picked.length} fix${picked.length === 1 ? "" : "es"} queued · grouped by effort. Small fixes ship immediately. Medium go into the next day. Large get a dev ticket.`}
        />
      </motion.div>

      <motion.div variants={canvasReveal} className="space-y-3">
        {smallFixes.length > 0 && (
          <FixGroup
            title="Ship now · small fixes"
            subtitle="Goes live in the next ~5 minutes"
            tone="ok"
            fixes={smallFixes}
          />
        )}
        {mediumFixes.length > 0 && (
          <FixGroup
            title="Ship today · medium fixes"
            subtitle="Drafts ready within an hour, live by EOD"
            tone="info"
            fixes={mediumFixes}
          />
        )}
        {largeFixes.length > 0 && (
          <FixGroup
            title="Ticket up · larger fixes"
            subtitle="Goes into the next dev sprint with Spot's spec attached"
            tone="warn"
            fixes={largeFixes}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

function FixGroup({
  title,
  subtitle,
  tone,
  fixes,
}: {
  title: string;
  subtitle: string;
  tone: "ok" | "info" | "warn";
  fixes: typeof FIX_PLANS;
}) {
  const dotColor = tone === "ok" ? "bg-[#22C55E]" : tone === "info" ? "bg-[#3B82F6]" : "bg-[#F5A623]";
  return (
    <div className="bg-white border border-border rounded-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border-subtle bg-surface-page flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <div className="text-[12.5px] font-semibold text-text-primary">{title}</div>
        <div className="text-[10.5px] text-text-tertiary">· {subtitle}</div>
      </div>
      <div className="divide-y divide-border-subtle">
        {fixes.map((fix) => (
          <div key={fix.id} className="px-4 py-3">
            <div className="text-[13px] font-medium text-text-primary mb-1">{fix.action}</div>
            <div className="text-[12px] text-text-secondary leading-relaxed">{fix.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
 * TEST NEW ANGLES
 * ═══════════════════════════════════════════════════════════════ */

function AngAuditStep() {
  const ready = useSpotStore((s) =>
    s.workflow && s.workflow.kind !== "launch-campaign" ? s.workflow.ready : true,
  );
  if (!ready) {
    return (
      <div className="px-5 py-5">
        <div className="skeleton h-7 w-56 rounded mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-border rounded-card p-3.5">
              <div className="skeleton h-4 w-full rounded mb-2" />
              <div className="skeleton h-12 w-full rounded mb-2" />
              <div className="skeleton h-4 w-2/3 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  const winners = ANGLE_AUDIT.filter((a) => a.verdict === "winner");
  const losers = ANGLE_AUDIT.filter((a) => a.verdict === "loser");
  const unproven = ANGLE_AUDIT.filter((a) => a.verdict === "unproven");

  return (
    <motion.div className="px-5 py-5" initial="hidden" animate="show" variants={canvasStagger}>
      <motion.div variants={canvasReveal}>
        <StepHeader
          title="Creative audit"
          blurb="Every angle Spot ran in the last 30 days · ranked into winners, losers, unproven. The insight per angle is the bridge to what we generate next."
        />
      </motion.div>

      <div className="space-y-4">
        <AngleSection
          title="Winners"
          subtitle="What we're doubling down on"
          icon={TrendingUp}
          tone="good"
          angles={winners}
        />
        <AngleSection
          title="Losers"
          subtitle="What we're stopping — and learning from"
          icon={TrendingDown}
          tone="bad"
          angles={losers}
        />
        <AngleSection
          title="Unproven"
          subtitle="Too early — keeping these in for now"
          icon={Activity}
          tone="neutral"
          angles={unproven}
        />
      </div>
    </motion.div>
  );
}

function AngleSection({
  title,
  subtitle,
  icon: Icon,
  tone,
  angles,
}: {
  title: string;
  subtitle: string;
  icon: typeof TrendingUp;
  tone: "good" | "bad" | "neutral";
  angles: typeof ANGLE_AUDIT;
}) {
  const iconColor =
    tone === "good" ? "text-[#15803D]" : tone === "bad" ? "text-[#B91C1C]" : "text-text-secondary";
  return (
    <motion.div variants={canvasReveal}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} strokeWidth={1.7} className={iconColor} />
        <div className="text-[12.5px] font-semibold text-text-primary">{title}</div>
        <div className="text-[11px] text-text-tertiary">· {subtitle}</div>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {angles.map((a) => (
          <div
            key={a.id}
            className="bg-white border border-border rounded-card p-3.5 flex flex-col gap-2"
          >
            <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
              <span>{a.personaName}</span>
              <span>·</span>
              <span>{a.format}</span>
              <span className="ml-auto">{a.channel}</span>
            </div>
            <div className="text-[12.5px] font-medium text-text-primary leading-snug">{a.hook}</div>
            <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-border-subtle">
              {a.metrics.map((m) => (
                <div key={m.label} className="text-[10.5px]">
                  <span className="text-text-tertiary">{m.label}: </span>
                  <span
                    className={`tabular ${
                      m.tone === "good"
                        ? "text-[#15803D]"
                        : m.tone === "bad"
                          ? "text-[#B91C1C]"
                          : "text-text-primary"
                    }`}
                  >
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-text-secondary leading-relaxed flex gap-1.5 pt-1">
              <Eye size={9} strokeWidth={1.6} className="text-text-tertiary flex-shrink-0 mt-0.5" />
              <span className="italic">{a.insight}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function AngInsightsStep() {
  return (
    <motion.div className="px-5 py-5" initial="hidden" animate="show" variants={canvasStagger}>
      <motion.div variants={canvasReveal}>
        <StepHeader
          title="The pattern"
          blurb="What's making winners win, what's killing losers. Pulled together into one hypothesis we can generate against."
        />
      </motion.div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <motion.div
          variants={canvasReveal}
          className="bg-white border border-border rounded-card p-4"
        >
          <div className="flex items-center gap-1.5 mb-2.5">
            <CheckCircle2 size={13} strokeWidth={1.7} className="text-[#15803D]" />
            <div className="label-section">What's working</div>
          </div>
          <ul className="space-y-2">
            {ANGLE_SYNTHESIS.working.map((w, i) => (
              <li key={i} className="text-[12.5px] text-text-primary leading-relaxed flex gap-2">
                <span className="text-[#15803D] mt-0.5">+</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div
          variants={canvasReveal}
          className="bg-white border border-border rounded-card p-4"
        >
          <div className="flex items-center gap-1.5 mb-2.5">
            <ShieldAlert size={13} strokeWidth={1.7} className="text-[#B91C1C]" />
            <div className="label-section">What isn't</div>
          </div>
          <ul className="space-y-2">
            {ANGLE_SYNTHESIS.notWorking.map((w, i) => (
              <li key={i} className="text-[12.5px] text-text-primary leading-relaxed flex gap-2">
                <span className="text-[#B91C1C] mt-0.5">−</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <motion.div
        variants={canvasReveal}
        className="bg-[#FAF8F2] border border-[#E8E3D5] rounded-card p-4"
      >
        <div className="flex items-start gap-2.5 mb-2">
          <SpotMark size={18} />
          <div className="flex-1">
            <div className="text-[11.5px] text-text-tertiary uppercase tracking-wider mb-1">
              Hypothesis for the next batch
            </div>
            <div className="text-[14px] text-text-primary leading-relaxed font-medium">
              {ANGLE_SYNTHESIS.hypothesis}
            </div>
          </div>
        </div>
        {ANGLE_SYNTHESIS.constraint && (
          <div className="text-[11.5px] text-text-secondary leading-relaxed flex gap-2 pt-2.5 mt-2 border-t border-[#E8E3D5]">
            <ShieldAlert size={11} strokeWidth={1.7} className="text-[#92400E] flex-shrink-0 mt-0.5" />
            <span>{ANGLE_SYNTHESIS.constraint}</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function AngGenerateStep() {
  const selectedIds = useSpotStore((s) =>
    s.workflow && s.workflow.kind !== "launch-campaign" ? s.workflow.selectedIds : [],
  );
  const togglePick = useSpotStore((s) => s.toggleDiagnosticPick);
  // Pre-select the 4 high-confidence angles.
  if (selectedIds.length === 0) {
    PROPOSED_ANGLES.filter((a) => a.confidence === "high").forEach((a) => togglePick(a.id));
  }
  return (
    <motion.div className="px-5 py-5" initial="hidden" animate="show" variants={canvasStagger}>
      <motion.div variants={canvasReveal}>
        <StepHeader
          title="New angles · drafted"
          blurb="Six angles · each tied to a winning insight. Pick the ones to ship into the A/B test. I've pre-selected the four with the strongest grounding."
        />
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {PROPOSED_ANGLES.map((a) => {
          const isSelected = selectedIds.includes(a.id);
          return (
            <motion.button
              key={a.id}
              variants={canvasReveal}
              type="button"
              onClick={() => togglePick(a.id)}
              className={`text-left bg-white rounded-card overflow-hidden transition-all ${
                isSelected
                  ? "border-2 border-text-primary shadow-card-hover"
                  : "border border-border hover:border-border-hover"
              }`}
            >
              {/* Visual placeholder — gradient using the angle's hue */}
              <div
                className="relative aspect-[16/8] w-full"
                style={{
                  background: `linear-gradient(135deg, hsl(${a.hue} 60% 92%) 0%, hsl(${a.hue} 50% 78%) 100%)`,
                }}
              >
                <div className="absolute top-2.5 left-2.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/85 backdrop-blur-sm">
                  <FormatIcon format={a.format} />
                </div>
                <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1">
                  <span className="text-[10px] font-medium text-text-secondary bg-white/85 px-1.5 py-0.5 rounded-sm">
                    {a.format}
                  </span>
                  <span className="text-[10px] font-medium text-text-secondary bg-white/85 px-1.5 py-0.5 rounded-sm">
                    {a.personaName}
                  </span>
                </div>
                <div className="absolute bottom-2.5 left-2.5">
                  <SelectIndicator selected={isSelected} />
                </div>
              </div>
              <div className="p-3.5">
                <div className="text-[10.5px] text-text-tertiary uppercase tracking-wider mb-1">
                  Hook
                </div>
                <div className="text-[13px] font-medium text-text-primary leading-snug mb-2">
                  {a.hook}
                </div>
                <div className="text-[11.5px] text-text-secondary mb-2.5">
                  <span className="text-text-tertiary">CTA:</span> {a.cta}
                </div>
                <div className="pt-2 border-t border-border-subtle text-[11px] flex items-center justify-between">
                  <span className="text-text-secondary">
                    <span className="text-text-tertiary">Builds on:</span> {a.buildsOn}
                  </span>
                  <span
                    className={`pill ${a.confidence === "high" ? "pill-ok" : a.confidence === "medium" ? "pill-info" : "pill-warn"}`}
                  >
                    {a.confidence}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function FormatIcon({ format }: { format: "Static" | "Reel" | "Carousel" }) {
  const Icon = format === "Reel" ? Film : format === "Carousel" ? Layout : ImageIcon;
  return <Icon size={11} strokeWidth={1.7} className="text-text-secondary" />;
}

function AngTestPlanStep() {
  const tp = ANGLE_TEST_PLAN;
  return (
    <motion.div className="px-5 py-5" initial="hidden" animate="show" variants={canvasStagger}>
      <motion.div variants={canvasReveal}>
        <StepHeader
          title="A/B test plan"
          blurb="Where the test runs, how much traffic, what we're watching, when we call it. Spot will auto-pause if guardrails trip."
        />
      </motion.div>

      <motion.div
        variants={canvasReveal}
        className="bg-white border border-border rounded-card overflow-hidden mb-3"
      >
        <div className="grid grid-cols-2 divide-x divide-border-subtle">
          <PlanCell label="Host ad set" value={tp.testAdSet} />
          <PlanCell label="Traffic split" value={`${tp.trafficSplit}% of cohort`} />
          <PlanCell label="Budget" value={tp.dailyBudget} />
          <PlanCell label="Runtime" value={tp.runtime} />
        </div>
      </motion.div>

      <motion.div
        variants={canvasReveal}
        className="bg-white border border-border rounded-card p-4 mb-3"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Target size={13} strokeWidth={1.7} className="text-text-secondary" />
          <div className="label-section">Success metric</div>
        </div>
        <div className="text-[13px] text-text-primary leading-relaxed">{tp.successMetric}</div>
      </motion.div>

      <motion.div
        variants={canvasReveal}
        className="bg-white border border-border rounded-card p-4 mb-3"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Activity size={13} strokeWidth={1.7} className="text-text-secondary" />
          <div className="label-section">What I expect</div>
        </div>
        <div className="text-[13px] text-text-primary leading-relaxed mb-2">{tp.expectation}</div>
        <div className="text-[11.5px] text-text-secondary leading-relaxed pt-2 border-t border-border-subtle">
          <span className="text-text-tertiary">Significance:</span> {tp.significance}
        </div>
      </motion.div>

      <motion.div
        variants={canvasReveal}
        className="bg-[#FAF8F2] border border-[#E8E3D5] rounded-card p-3 flex items-start gap-2.5"
      >
        <SpotMark size={16} />
        <div className="text-[12px] text-text-secondary leading-relaxed">
          <span className="text-text-primary font-medium">After 10 days:</span> I'll pause the losers,
          roll the winners into the Scaling bucket on the existing campaign, and write the
          observations back to product memory so the next angle generation builds on them.
        </div>
      </motion.div>
    </motion.div>
  );
}

function PlanCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[10.5px] text-text-tertiary uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[13px] text-text-primary leading-snug">{value}</div>
    </div>
  );
}

/* ═══ Shared diagnostic Done step ════════════════════════════════ */

function DiagnosticDoneStep({ workflow }: { workflow: DiagnosticWorkflow }) {
  const label =
    workflow.kind === "scale"
      ? "Scaling moves are live."
      : workflow.kind === "optimize"
        ? "Fixes shipped."
        : "Test running.";
  const detail =
    workflow.kind === "scale"
      ? "Stage 1 lift is live · Stage 2 fires Day 3 if guardrails hold. I'll watch CPL and CPQL daily and flag drift."
      : workflow.kind === "optimize"
        ? "Small fixes are live · medium fixes drafted · large fixes ticketed. I'll watch the affected campaigns for recovery."
        : "Six angles split-testing on the Engineer Parent scaling ad set. Calling it in 10 days · I'll report back here.";

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-[#15803D]/10 flex items-center justify-center mb-4">
        <PartyPopper size={20} strokeWidth={1.6} className="text-[#15803D]" />
      </div>
      <div className="text-section-header text-text-primary mb-2">{label}</div>
      <p className="text-meta text-text-secondary max-w-[440px] leading-relaxed mb-4">{detail}</p>
      <a
        href="/campaigns"
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-button border border-border bg-white hover:border-border-hover text-[12.5px] font-medium"
      >
        See on Campaigns
        <ArrowUpRight size={11} strokeWidth={1.8} />
      </a>
    </div>
  );
}
