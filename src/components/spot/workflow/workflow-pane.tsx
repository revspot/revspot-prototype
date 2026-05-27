"use client";

// Right-pane canvas for the launch workflow. **Read-only** — every
// approval action lives in the left chat (via the step-cta part). This
// pane just shows what Spot is working on.

import { PanelRightClose, X, Users, Package, ChartPie, Sparkles, Megaphone, Layout as LayoutIcon, PartyPopper, CheckCircle2, Check, Wifi, WifiOff, Cog, ChevronRight, Pencil, Search, ShieldAlert, TrendingUp, Layers as LayersIcon, Trophy, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useSpotStore } from "@/lib/spot/store";
import {
  STEP_LABELS,
  VISIBLE_STEPS,
  LAUNCH_PERSONAS,
  SAMPLE_ANGLES,
  SAMPLE_FORMS,
  SAMPLE_STRUCTURE,
  generateChannelPlans,
  type WorkflowStep,
  type LaunchWorkflow,
  type ChannelPlan,
} from "@/lib/spot/workflow";
import { SpotMark } from "@/components/spot/spot-mark";
import { PRODUCTS } from "@/lib/products-data";

const STEP_ICONS: Record<WorkflowStep, typeof Users> = {
  "deep-research": Search,
  "product-setup": Package,
  kickoff: Sparkles,
  personas: Users,
  "media-plan": ChartPie,
  angles: Sparkles,
  forms: LayoutIcon,
  campaigns: Megaphone,
  done: PartyPopper,
};

function inr(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n >= 1000000 ? 1 : 2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

// Stagger animation used to reveal canvas content card-by-card once
// an agent finishes its work. Slightly slower than the chat fadeUp so
// the right pane feels like it's *filling in*.
const canvasStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18, delayChildren: 0.05 } },
};
const canvasReveal: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

export function WorkflowPane() {
  const workflow = useSpotStore((s) => s.workflow);
  const toggleCanvas = useSpotStore((s) => s.toggleCanvas);
  const exitWorkflow = useSpotStore((s) => s.exitWorkflow);
  const gotoStep = useSpotStore((s) => s.gotoStep);

  if (!workflow) return null;
  const Icon = STEP_ICONS[workflow.step];
  const currentIdx = VISIBLE_STEPS.indexOf(workflow.step);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header — workflow title + canvas controls */}
      <div className="border-b border-border-subtle bg-surface-page">
        <div className="px-5 py-3 flex items-center gap-3">
          <Icon size={15} strokeWidth={1.6} className="text-text-primary" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-text-tertiary leading-tight">
              Launching · {workflow.productName}
            </div>
            <div className="text-section-header text-text-primary leading-tight">
              {STEP_LABELS[workflow.step]}
            </div>
          </div>
          <button
            type="button"
            onClick={toggleCanvas}
            title="Minimize canvas — chat stays full-width; workflow state is preserved."
            className="inline-flex items-center justify-center h-7 w-7 rounded-button text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
          >
            <PanelRightClose size={14} strokeWidth={1.6} />
          </button>
          <button
            type="button"
            onClick={exitWorkflow}
            title="Close workflow — abandons progress and returns to Spot."
            className="inline-flex items-center justify-center h-7 w-7 rounded-button text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
          >
            <X size={14} strokeWidth={1.6} />
          </button>
        </div>
        {workflow.step !== "deep-research" && workflow.step !== "product-setup" && workflow.step !== "done" && (
          <div className="px-5 pb-3 flex items-center gap-1.5 overflow-x-auto">
            {VISIBLE_STEPS.map((s, i) => {
              const done = i < currentIdx;
              const active = i === currentIdx;
              const Ico = STEP_ICONS[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => (done ? gotoStep(s) : undefined)}
                  disabled={!done}
                  className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-[10.5px] font-medium whitespace-nowrap transition-colors ${
                    active
                      ? "bg-[#111] text-[#FAFAF8]"
                      : done
                        ? "bg-white border border-border text-text-primary hover:border-border-hover cursor-pointer"
                        : "bg-surface-secondary text-text-tertiary"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 size={10} strokeWidth={2} />
                  ) : (
                    <Ico size={10} strokeWidth={1.8} />
                  )}
                  {STEP_LABELS[s]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Body — read-only display */}
      <div className="flex-1 overflow-y-auto">
        <StepBody workflow={workflow} />
      </div>
    </div>
  );
}

/* ─── Step body router ───────────────────────────────────────── */

function StepBody({ workflow }: { workflow: LaunchWorkflow }) {
  switch (workflow.step) {
    case "deep-research":
      return <DeepResearchStep workflow={workflow} />;
    case "product-setup":
      return <ProductSetupStep />;
    case "kickoff":
      return <KickoffStep workflow={workflow} />;
    case "personas":
      return <PersonasStep />;
    case "media-plan":
      return <MediaPlanStep />;
    case "angles":
      return <CreativesStep />;
    case "forms":
      return <FormsStep />;
    case "campaigns":
      return <CampaignsStep />;
    case "done":
      return <DoneStep workflow={workflow} />;
  }
}

function StepHeader({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-section-header text-text-primary">{title}</h2>
      <p className="text-meta text-text-secondary mt-1">{blurb}</p>
    </div>
  );
}

/* ─── Deep research ──────────────────────────────────────────── */

const RESEARCH_TASKS = [
  { label: "Crawling brand site · /about, /curriculum, /pricing", status: "done" as const },
  { label: "Pulling category keyword landscape", status: "done" as const },
  { label: "Indexing category review sites + parent forums", status: "running" as const },
  { label: "Computing audience overlap from Revspot graph", status: "queued" as const },
  { label: "Synthesising USPs and avoid list", status: "queued" as const },
];

function DeepResearchStep({ workflow }: { workflow: LaunchWorkflow }) {
  return (
    <div className="px-5 py-5">
      <StepHeader
        title={`Researching ${workflow.productName}`}
        blurb={`Spot didn't have this product on file. The Deep Research Agent is pulling everything it can from public sources and the Revspot audience graph. Memory will auto-populate.`}
      />

      <div className="bg-white border border-border rounded-card p-4">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border-subtle">
          <div className="w-7 h-7 rounded-full bg-[#FAF8F2] border border-[#E8E3D5] flex items-center justify-center flex-shrink-0">
            <Cog
              size={13}
              strokeWidth={1.8}
              className="text-text-secondary animate-spin"
              style={{ animationDuration: "2s" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-medium text-text-primary">Deep Research Agent</div>
            <div className="text-[11px] text-text-tertiary">Running · ~3s</div>
          </div>
        </div>

        <ul className="space-y-2">
          {RESEARCH_TASKS.map((t, i) => {
            const Icon =
              t.status === "done" ? CheckCircle2 : t.status === "running" ? Cog : Search;
            const colorClass =
              t.status === "done"
                ? "text-[#15803D]"
                : t.status === "running"
                  ? "text-text-secondary"
                  : "text-text-tertiary";
            return (
              <li key={i} className="flex items-center gap-2.5 text-[12.5px]">
                <Icon
                  size={11}
                  strokeWidth={1.8}
                  className={`${colorClass} flex-shrink-0 ${t.status === "running" ? "animate-spin" : ""}`}
                  style={t.status === "running" ? { animationDuration: "2s" } : undefined}
                />
                <span className={t.status === "queued" ? "text-text-tertiary" : "text-text-primary"}>
                  {t.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-[#FAF8F2] border border-[#E8E3D5] rounded-card p-3 mt-4 flex items-start gap-2.5">
        <SpotMark size={16} />
        <div className="text-[12px] text-text-secondary leading-relaxed">
          Once research lands, I'll commit a memory entry — same structure as any product
          you'd configure manually. You can edit any field in chat afterwards.
        </div>
      </div>
    </div>
  );
}

/* ─── Product setup ──────────────────────────────────────────── */

function ProductSetupStep() {
  return (
    <div className="px-5 py-5">
      <StepHeader
        title="Set up product memory"
        blurb="Tell me about the product in chat — I'll structure it on the right. Or paste a URL / upload a brochure and I'll do the research."
      />
      <div className="bg-white border border-border rounded-card p-4 space-y-3 opacity-60">
        <div>
          <div className="label-section mb-1">Product name</div>
          <div className="text-[13px] text-text-tertiary italic">Waiting on chat…</div>
        </div>
        <div>
          <div className="label-section mb-1">USPs</div>
          <div className="text-[13px] text-text-tertiary italic">Waiting on chat…</div>
        </div>
        <div>
          <div className="label-section mb-1">Do not mention</div>
          <div className="text-[13px] text-text-tertiary italic">Waiting on chat…</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Kickoff — display product memory ───────────────────────── */

function KickoffStep({ workflow }: { workflow: LaunchWorkflow }) {
  const product = PRODUCTS.find((p) => p.id === workflow.productId);
  // If we ran deep research instead of resolving an existing product,
  // render the freshly-researched memory in the same shape.
  const researched = workflow.researchedMemory;

  // Show a shimmer skeleton until the Memory Reader tool-call finishes.
  if (!workflow.kickoffReady) {
    return <KickoffSkeleton productName={workflow.productName} />;
  }

  return (
    <div className="px-5 py-5">
      <StepHeader
        title={`What I know about ${workflow.productName}`}
        blurb={
          researched
            ? "Freshly researched memory — feel free to edit any field in chat. I'll use this to brief every downstream agent."
            : "The memory I'll brief every downstream agent with. Approve from chat when ready."
        }
      />

      {researched && !product ? (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-card p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="pill pill-info" style={{ fontSize: 10 }}>
                <Sparkles size={9} strokeWidth={2} />
                Spot-researched
              </span>
              <span className="text-[11px] text-text-tertiary">just now</span>
            </div>
            <div className="text-card-title text-text-primary mt-1.5">{workflow.productName}</div>
            <p className="text-[13px] text-text-secondary leading-relaxed mt-1">{researched.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-card p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 size={11} strokeWidth={1.8} className="text-[#15803D]" />
                <span className="label-section">USPs to lead with</span>
              </div>
              <ul className="space-y-1.5">
                {researched.usps.map((u, i) => (
                  <li key={i} className="text-[12.5px] text-text-primary flex gap-2 leading-snug">
                    <span className="text-text-tertiary">·</span>
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-border rounded-card p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <ShieldAlert size={11} strokeWidth={1.8} className="text-[#92400E]" />
                <span className="label-section">Do not mention</span>
              </div>
              <ul className="space-y-1.5">
                {researched.avoid.map((a, i) => (
                  <li key={i} className="text-[12.5px] text-text-primary flex gap-2 leading-snug">
                    <span className="text-text-tertiary">·</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white border border-border rounded-card p-4">
            <div className="label-section mb-2">Sources I checked</div>
            <ul className="space-y-1">
              {researched.sources.map((s, i) => (
                <li key={i} className="text-[12px] text-text-secondary flex items-center gap-2 leading-snug">
                  <CheckCircle2 size={10} strokeWidth={1.8} className="text-[#15803D] flex-shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#FAF8F2] border border-[#E8E3D5] rounded-card p-3 flex items-start gap-2.5">
            <SpotMark size={16} />
            <div className="text-[12px] text-text-secondary leading-relaxed">
              <span className="text-text-primary font-medium">No past campaign data yet.</span>{" "}
              I'll plan a conservative experiment campaign at the next step — small budget,
              one campaign per persona — and let the data inform scale-up.
            </div>
          </div>
        </div>
      ) : product ? (
        // Cards stagger in one by one after the loader so the page
        // doesn't slam in all at once. Each motion.div reveals at a
        // small offset; matches the agentic "filling in as I find it"
        // feel.
        <motion.div
          variants={canvasStagger}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {/* Tagline + readiness */}
          <motion.div variants={canvasReveal} className="bg-white border border-border rounded-card p-4">
            <div className="text-[11px] text-text-tertiary mb-1">{product.client} · {product.category}</div>
            <div className="text-card-title text-text-primary mb-1">{product.name}</div>
            <p className="text-[13px] text-text-secondary leading-relaxed">{product.tagline}</p>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border-subtle">
              <Stat label="Readiness" value={`${Math.round(product.readiness * 100)}%`} />
              <Stat label="Personas" value={product.personas.length.toString()} />
              <Stat label="Memory entries" value={product.memory.length.toString()} />
              <Stat label="Active campaigns" value={product.performance.activeCampaigns.toString()} />
            </div>
          </motion.div>

          {/* USPs + Avoid */}
          <motion.div variants={canvasReveal} className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-card p-4">
              <div className="label-section mb-2">USPs to lead with</div>
              <ul className="space-y-1.5">
                {product.usps.map((u, i) => (
                  <li key={i} className="text-[12.5px] text-text-primary flex gap-2 leading-snug">
                    <span className="text-text-tertiary">·</span>
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-border rounded-card p-4">
              <div className="label-section mb-2">Do not mention</div>
              <ul className="space-y-1.5">
                {product.avoid.map((a, i) => (
                  <li key={i} className="text-[12.5px] text-text-primary flex gap-2 leading-snug">
                    <span className="text-text-tertiary">·</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Linked personas */}
          <motion.div variants={canvasReveal} className="bg-white border border-border rounded-card p-4">
            <div className="label-section mb-2">Linked personas</div>
            <div className="flex flex-wrap gap-1.5">
              {product.personas.map((p) => (
                <span key={p.id} className="pill">{p.name}</span>
              ))}
            </div>
          </motion.div>

          {/* Recent memory */}
          <motion.div variants={canvasReveal} className="bg-white border border-border rounded-card p-4">
            <div className="label-section mb-2.5">Most recent memory</div>
            <ol className="space-y-2.5">
              {product.memory.slice(0, 3).map((e) => (
                <li key={e.id} className="flex gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#111] mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-[12.5px] text-text-primary leading-snug">{e.summary}</div>
                    <div className="text-[11px] text-text-tertiary mt-0.5">{e.at} · {e.who}</div>
                  </div>
                </li>
              ))}
            </ol>
          </motion.div>
        </motion.div>
      ) : (
        <div className="bg-white border border-border rounded-card p-4 text-[12.5px] text-text-tertiary italic">
          No product memory found — start fresh in chat.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1">
      <div className="text-[10.5px] text-text-tertiary uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-[16px] font-semibold text-text-primary tabular">{value}</div>
    </div>
  );
}

/**
 * Loading-state shimmer shown on the kickoff canvas while the
 * Memory Reader agent "fetches" the product file. Matches the
 * structure of the real KickoffStep so the layout doesn't jump on
 * reveal. Uses the .skeleton utility from globals.css for the shimmer.
 */
function KickoffSkeleton({ productName }: { productName: string }) {
  return (
    <div className="px-5 py-5">
      <div className="mb-5 flex items-center gap-2">
        <Cog
          size={13}
          strokeWidth={1.8}
          className="text-text-secondary animate-spin"
          style={{ animationDuration: "2s" }}
        />
        <span className="text-[12px] text-text-secondary">
          Loading <span className="text-text-primary font-medium">{productName}</span> from memory…
        </span>
      </div>

      <div className="space-y-4">
        {/* Hero card */}
        <div className="bg-white border border-border rounded-card p-4 space-y-2.5">
          <div className="skeleton h-3 w-32 rounded" />
          <div className="skeleton h-5 w-1/2 rounded" />
          <div className="skeleton h-3 w-3/4 rounded" />
          <div className="flex gap-3 pt-3 border-t border-border-subtle">
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </div>
        </div>

        {/* USPs + Avoid */}
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white border border-border rounded-card p-4 space-y-2">
              <div className="skeleton h-2.5 w-20 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-11/12 rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          ))}
        </div>

        {/* Personas pills */}
        <div className="bg-white border border-border rounded-card p-4">
          <div className="skeleton h-2.5 w-24 rounded mb-2.5" />
          <div className="flex gap-1.5">
            <div className="skeleton h-4 w-28 rounded-full" />
            <div className="skeleton h-4 w-24 rounded-full" />
            <div className="skeleton h-4 w-20 rounded-full" />
          </div>
        </div>

        {/* Memory timeline */}
        <div className="bg-white border border-border rounded-card p-4 space-y-2.5">
          <div className="skeleton h-2.5 w-28 rounded" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <div className="skeleton w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="skeleton h-3 w-11/12 rounded" />
                <div className="skeleton h-2.5 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className="flex-1 space-y-1">
      <div className="skeleton h-2.5 w-14 rounded" />
      <div className="skeleton h-5 w-12 rounded" />
    </div>
  );
}

/* ─── Personas — recommended (combined existing + new) ──────── */

// Insight chip iconography
const INSIGHT_ICON: Record<"trophy" | "trending" | "layers", typeof Trophy> = {
  trophy: Trophy,
  trending: TrendingUp,
  layers: LayersIcon,
};

function PersonasStep() {
  const approvals = useSpotStore((s) => s.workflow!.approvals);
  const toggle = useSpotStore((s) => s.toggleWorkflowApproval);
  const selectedCount = approvals.personaIds.length;

  return (
    <div className="px-5 py-5 fadeUp">
      <StepHeader
        title="Personas Spot recommends"
        blurb={`${LAUNCH_PERSONAS.length} candidates — based on past performance and audience overlap. Tap any card to include in this run. New personas are written to your global library on approval.`}
      />

      {/* Selection summary */}
      <div className="bg-white border border-border rounded-card px-4 py-2.5 mb-4 flex items-center gap-2">
        <CheckCircle2
          size={13}
          strokeWidth={2}
          className={selectedCount > 0 ? "text-[#15803D]" : "text-text-tertiary"}
        />
        <span className="text-[12.5px] text-text-primary">
          <span className="tabular font-medium">{selectedCount}</span>
          <span className="text-text-secondary"> of {LAUNCH_PERSONAS.length} selected</span>
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => {
            const allIds = LAUNCH_PERSONAS.map((p) => p.id);
            const allSelected = allIds.every((id) => approvals.personaIds.includes(id));
            if (allSelected) {
              // Deselect every persona
              allIds.forEach((id) => toggle("personaIds", id));
            } else {
              // Add the missing ones
              allIds.forEach((id) => {
                if (!approvals.personaIds.includes(id)) toggle("personaIds", id);
              });
            }
          }}
          className="text-[11.5px] text-text-secondary hover:text-text-primary"
        >
          {LAUNCH_PERSONAS.every((p) => approvals.personaIds.includes(p.id))
            ? "Deselect all"
            : "Select all"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {LAUNCH_PERSONAS.map((p) => {
          const checked = approvals.personaIds.includes(p.id);
          return (
            <PersonaCard
              key={p.id}
              persona={p}
              selected={checked}
              onToggle={() => toggle("personaIds", p.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function PersonaCard({
  persona,
  selected,
  onToggle,
}: {
  persona: (typeof LAUNCH_PERSONAS)[number];
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`relative bg-white border-2 rounded-card overflow-hidden cursor-pointer transition-all ${
        selected
          ? "border-[#111] shadow-card-hover"
          : "border-border hover:border-text-tertiary"
      }`}
      onClick={onToggle}
      role="button"
      aria-pressed={selected}
    >
      {/* Tinted strip across the top, colored by persona hue */}
      <div
        className={`h-14 relative transition-opacity ${selected ? "" : "opacity-70"}`}
        style={{
          background: `linear-gradient(135deg, hsl(${persona.hue} 70% 92%) 0%, hsl(${persona.hue} 55% 78%) 100%)`,
        }}
      >
        {/* Avatar disc */}
        <div
          className="absolute -bottom-5 left-3.5 w-10 h-10 rounded-full flex items-center justify-center text-[12.5px] font-semibold text-white shadow-card-hover"
          style={{
            background: `linear-gradient(135deg, hsl(${persona.hue} 65% 45%) 0%, hsl(${persona.hue} 55% 30%) 100%)`,
          }}
        >
          {persona.avatarLetters}
        </div>
        {/* Origin pill */}
        <div className="absolute top-2 right-2">
          {persona.origin === "new" ? (
            <span className="pill pill-info inline-flex items-center gap-1" style={{ fontSize: 9.5 }}>
              <Sparkles size={9} strokeWidth={2} />
              New
            </span>
          ) : (
            <span className="pill" style={{ fontSize: 9.5 }}>
              From library
            </span>
          )}
        </div>
        {/* Selection checkbox — bordered, always visible. Sits over the
            colored strip so it reads as a discoverable control rather
            than a faint dot. */}
        <div
          className={`absolute top-2 left-2 w-5 h-5 rounded-[5px] border-2 flex items-center justify-center transition-colors ${
            selected
              ? "bg-[#111] border-[#111]"
              : "bg-white border-text-tertiary/50 group-hover:border-text-primary"
          }`}
        >
          {selected && <Check size={12} strokeWidth={3} className="text-white" />}
        </div>
      </div>

      {/* Body */}
      <div className="px-3.5 pt-7 pb-3.5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="text-[13px] font-medium text-text-primary leading-tight">
            {persona.name}
          </div>
        </div>
        <p className="text-[12px] text-text-secondary leading-snug mb-2.5">{persona.rationale}</p>

        {/* Insight chips — data-driven flavour from past memory */}
        <div className="flex flex-wrap gap-1 mb-3">
          {persona.insights.map((ins, i) => {
            const Ico = INSIGHT_ICON[ins.icon];
            const cls =
              ins.tone === "strong" ? "pill-ok" : ins.tone === "warn" ? "pill-warn" : "pill-info";
            return (
              <span key={i} className={`pill ${cls} inline-flex items-center gap-1`} style={{ fontSize: 10 }}>
                <Ico size={9} strokeWidth={2} />
                {ins.label}
              </span>
            );
          })}
        </div>

        {/* View link */}
        <a
          href="/personas"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[11px] text-text-tertiary hover:text-text-primary"
        >
          View persona
          <ExternalLink size={9} strokeWidth={1.6} />
        </a>
      </div>
    </div>
  );
}

/* ─── Media plan ─────────────────────────────────────────────── */

const CHANNEL_TINT: Record<ChannelPlan["iconKey"], string> = {
  meta: "#1877F2",
  google: "#4285F4",
  whatsapp: "#25D366",
  voice: "#A855F7",
  linkedin: "#0A66C2",
  email: "#F59E0B",
};

function MediaPlanStep() {
  const wf = useSpotStore((s) => s.workflow)!;
  const plans = generateChannelPlans(wf.budget?.amountInr || 0, false);
  const totalBudget = wf.budget?.amountInr || 0;

  return (
    <div className="px-5 py-5">
      <StepHeader
        title="Media plan · channel × ad type"
        blurb={
          totalBudget > 0
            ? `${inr(totalBudget)} over ${wf.budget?.days || 7} days · here's how I'd split it.`
            : "No budget set yet — running as an experiment baseline. Tell me a weekly cap in chat to re-split."
        }
      />

      <div className="space-y-3">
        {plans.map((c) => (
          <div key={c.channel} className="bg-white border border-border rounded-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-button flex items-center justify-center flex-shrink-0"
                style={{ background: `${CHANNEL_TINT[c.iconKey]}15`, color: CHANNEL_TINT[c.iconKey] }}
              >
                <Megaphone size={13} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-text-primary">{c.channel}</div>
                <div className="text-[11.5px] text-text-tertiary truncate">{c.rationale}</div>
              </div>
              <span className="pill" style={{ fontSize: 10.5 }}>{Math.round(c.share * 100)}%</span>
              {totalBudget > 0 && (
                <span className="text-[12px] tabular text-text-primary font-medium ml-1">
                  {inr(Math.round(c.share * totalBudget))}
                </span>
              )}
            </div>
            <div className="divide-y divide-border-subtle">
              {c.adTypes.map((ad) => (
                <div key={ad.name} className="px-4 py-2.5 flex items-start gap-2.5">
                  <div className="w-1 self-stretch rounded-full bg-border-subtle flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className="text-[12.5px] font-medium text-text-primary">{ad.name}</span>
                      <span className="text-[11px] text-text-tertiary">
                        · {ad.personas.join(", ")}
                      </span>
                    </div>
                    <div className="text-[12px] text-text-secondary leading-snug">{ad.description}</div>
                  </div>
                  <div className="flex-shrink-0">
                    {ad.availability === "available" && (
                      <span className="pill pill-ok inline-flex items-center gap-1" style={{ fontSize: 10 }}>
                        <Wifi size={9} strokeWidth={2} />
                        Available
                      </span>
                    )}
                    {ad.availability === "needs-connection" && (
                      <span className="pill pill-warn inline-flex items-center gap-1" style={{ fontSize: 10 }}>
                        <WifiOff size={9} strokeWidth={2} />
                        Needs connection
                      </span>
                    )}
                    {ad.availability === "coming-soon" && (
                      <span className="pill" style={{ fontSize: 10 }}>Soon</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Creatives — image-rich, agents-at-work ────────────────── */

const CREATIVE_SIZES: { format: "1:1" | "4:5" | "9:16" | "16:9"; label: string; w: number; h: number; channel: "Meta" | "Google" | "Both" }[] = [
  { format: "1:1", label: "Square · feed", w: 80, h: 80, channel: "Meta" },
  { format: "4:5", label: "Portrait · feed", w: 64, h: 80, channel: "Meta" },
  { format: "9:16", label: "Reel / Story", w: 45, h: 80, channel: "Meta" },
  { format: "16:9", label: "Landscape · Google", w: 96, h: 54, channel: "Google" },
];

function CreativesStep() {
  return (
    <div className="px-5 py-5">
      <StepHeader
        title="Creatives in production"
        blurb="Hero concepts are ready. Resized variants attach to each campaign in the background — agents at work below."
      />

      {/* Agent activity strip */}
      <div className="bg-[#FAF8F2] border border-[#E8E3D5] rounded-card p-3 mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Cog size={11} strokeWidth={1.8} className="text-text-secondary animate-spin" style={{ animationDuration: "3s" }} />
          <span className="text-[11.5px] font-medium text-text-primary">Creative Agent · running</span>
        </div>
        <ul className="space-y-1 text-[11.5px] text-text-secondary leading-snug pl-5">
          <li>· Resizing hero static into 4 ad-size variants for Meta</li>
          <li>· Generating 16:9 landscape from portrait reel for Google PMax</li>
          <li>· Attaching variants to ad sets · 3 of 12 done</li>
        </ul>
      </div>

      {/* Per-persona creative galleries */}
      <div className="space-y-4">
        {SAMPLE_ANGLES.map((pack) => (
          <div key={pack.personaId} className="bg-white border border-border rounded-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border-subtle flex items-center gap-2">
              <Users size={12} strokeWidth={1.6} className="text-text-tertiary" />
              <span className="text-[12.5px] font-medium text-text-primary">{pack.personaName}</span>
              <span className="text-[11px] text-text-tertiary">· {pack.angles.length * CREATIVE_SIZES.length} assets generating</span>
            </div>
            <div className="p-4 space-y-3">
              {pack.angles.map((a, ai) => (
                <div key={a.id}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[12px] font-medium text-text-primary truncate">{a.hook}</span>
                    <span className="pill" style={{ fontSize: 9.5 }}>{a.format}</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {CREATIVE_SIZES.map((sz, si) => (
                      <CreativeTile
                        key={sz.format}
                        size={sz}
                        ready={ai === 0 || si < 2}
                        hue={(ai * 80 + si * 25) % 360}
                        hook={a.hook}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreativeTile({
  size,
  ready,
  hue,
  hook,
}: {
  size: { format: string; label: string; w: number; h: number; channel: string };
  ready: boolean;
  hue: number;
  hook: string;
}) {
  return (
    <div
      title={`${hook} · ${size.format} · ${size.channel}`}
      className="relative flex-shrink-0 rounded-[6px] border border-border overflow-hidden"
      style={{
        width: size.w + 30,
        height: size.h + 30,
        background: ready
          ? `linear-gradient(135deg, hsl(${hue} 65% 88%) 0%, hsl(${hue} 55% 72%) 100%)`
          : "#F5F5F5",
      }}
    >
      {ready ? (
        <>
          <div className="absolute top-1 left-1 text-[8.5px] font-medium text-text-primary bg-white/85 px-1 rounded-sm">
            {size.format}
          </div>
          <div className="absolute top-1 right-1 text-[8.5px] font-medium text-text-secondary bg-white/85 px-1 rounded-sm">
            {size.channel === "Both" ? "M+G" : size.channel === "Meta" ? "M" : "G"}
          </div>
          {/* Faux hero composition — a tinted block + light "headline" lines */}
          <div className="absolute inset-2 mt-5 flex flex-col justify-end gap-0.5">
            <div className="h-1 rounded-full bg-white/65 w-3/4" />
            <div className="h-1 rounded-full bg-white/55 w-1/2" />
            <div className="h-1.5 rounded-sm bg-text-primary/80 w-1/3 mt-1" />
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <Cog size={11} strokeWidth={1.6} className="text-text-tertiary animate-spin" style={{ animationDuration: "2s" }} />
          <span className="text-[9px] text-text-tertiary">{size.format}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Forms & landing pages — preview-rich ────────────────── */

function FormsStep() {
  return (
    <div className="px-5 py-5">
      <StepHeader
        title="Forms & landing pages"
        blurb="Lead forms · landing pages · click-to-WhatsApp scripts. Hover any tile for the preview."
      />

      {/* Generation indicator */}
      <div className="bg-[#FAF8F2] border border-[#E8E3D5] rounded-card p-3 mb-4">
        <div className="flex items-center gap-1.5 mb-1">
          <Cog size={11} strokeWidth={1.8} className="text-text-secondary animate-spin" style={{ animationDuration: "3s" }} />
          <span className="text-[11.5px] font-medium text-text-primary">Forms Agent · running</span>
        </div>
        <span className="text-[11.5px] text-text-secondary">Building forms-per-persona · 3 of 5 ready · 2 pending review</span>
      </div>

      {/* Asset grid */}
      <div className="grid grid-cols-2 gap-3">
        {SAMPLE_FORMS.map((f) => (
          <FormPreviewCard key={f.id} form={f} />
        ))}
      </div>
    </div>
  );
}

function FormPreviewCard({ form }: { form: typeof SAMPLE_FORMS[number] }) {
  const isLanding = form.kind === "landing-page";
  const statusPill =
    form.status === "ready" ? "pill-ok" : form.status === "needs-review" ? "pill-warn" : "pill";
  const statusLabel =
    form.status === "ready" ? "Ready" : form.status === "needs-review" ? "Needs review" : "Drafted";

  return (
    <div className="bg-white border border-border rounded-card overflow-hidden">
      {/* Preview canvas — schematic, not a real screenshot */}
      <div
        className="relative aspect-[16/9] border-b border-border-subtle"
        style={{
          background: "linear-gradient(135deg, #FAFAFA 0%, #F0F0F0 100%)",
        }}
      >
        {isLanding ? <LandingPageMock title={form.name} /> : <LeadFormMock title={form.name} />}
        <span
          className={`pill ${statusPill} absolute top-1.5 right-1.5`}
          style={{ fontSize: 10 }}
        >
          {statusLabel}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <div className="text-[12.5px] font-medium text-text-primary truncate">{form.name}</div>
        <div className="text-[11px] text-text-tertiary mt-0.5 flex items-center justify-between">
          <span>{isLanding ? "Landing page" : "Lead form"} · {form.personaName}</span>
          <button
            type="button"
            className="inline-flex items-center gap-0.5 text-text-secondary hover:text-text-primary"
          >
            <Pencil size={10} strokeWidth={1.6} />
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}

function LandingPageMock({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 p-3 flex flex-col">
      <div className="h-2 w-12 rounded-full bg-text-primary/30 mb-2" />
      <div className="h-2.5 w-3/4 rounded-full bg-text-primary/80 mb-1" />
      <div className="h-2 w-1/2 rounded-full bg-text-secondary/50 mb-2" />
      <div className="flex-1 grid grid-cols-3 gap-1">
        <div className="rounded-sm bg-white/70 border border-border-subtle" />
        <div className="rounded-sm bg-white/70 border border-border-subtle" />
        <div className="rounded-sm bg-white/70 border border-border-subtle" />
      </div>
      <div className="mt-2 h-3.5 w-20 rounded bg-text-primary self-start" />
      <span className="sr-only">{title}</span>
    </div>
  );
}

function LeadFormMock({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 p-3 flex flex-col">
      <div className="h-2.5 w-1/2 rounded-full bg-text-primary/80 mb-2" />
      <div className="space-y-1.5 flex-1">
        <div className="h-3 rounded-sm bg-white/80 border border-border-subtle" />
        <div className="h-3 rounded-sm bg-white/80 border border-border-subtle" />
        <div className="h-3 rounded-sm bg-white/80 border border-border-subtle w-3/4" />
      </div>
      <div className="mt-2 h-3.5 w-16 rounded bg-text-primary self-start" />
      <span className="sr-only">{title}</span>
    </div>
  );
}

/* ─── Campaigns ───────────────────────────────────────────── */

function CampaignsStep() {
  const totalAdsets = SAMPLE_STRUCTURE.reduce((s, c) => s + c.adsets.length, 0);
  const totalAds = SAMPLE_STRUCTURE.reduce(
    (s, c) => s + c.adsets.reduce((ss, a) => ss + a.adsCount, 0),
    0,
  );

  return (
    <div className="px-5 py-5">
      <StepHeader
        title="Draft campaign structure · ready to deploy"
        blurb="3 campaigns · 6 ad sets · 17 ads, mapped to the approved personas. Approve in chat — I push to Meta + Google."
      />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <MiniStat label="Campaigns" value={SAMPLE_STRUCTURE.length} />
        <MiniStat label="Ad sets" value={totalAdsets} />
        <MiniStat label="Ads" value={totalAds} />
      </div>

      <div className="space-y-3">
        {SAMPLE_STRUCTURE.map((c) => (
          <div key={c.id} className="bg-white border border-border rounded-card overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-border-subtle bg-surface-page flex items-center gap-2">
              <Megaphone size={11} strokeWidth={1.6} className="text-text-tertiary" />
              <span className="text-[13px] font-medium text-text-primary">{c.name}</span>
              <span className="flex-1" />
              <span className="pill" style={{ fontSize: 10 }}>{c.channel}</span>
              <span className="text-[11.5px] tabular text-text-secondary">{inr(c.budgetInr)}</span>
            </div>
            <div className="divide-y divide-border-subtle">
              {c.adsets.map((a) => (
                <div key={a.id} className="px-3.5 py-2 flex items-center gap-2 text-[12px]">
                  <ChevronRight size={11} className="text-text-tertiary ml-4" />
                  <span className="text-text-primary">{a.name}</span>
                  <span className="text-text-tertiary">· {a.personaName}</span>
                  <span className="flex-1" />
                  <span className="text-text-tertiary">{a.adsCount} ads</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-border rounded-card p-3">
      <div className="text-[10.5px] text-text-tertiary uppercase tracking-wider">{label}</div>
      <div className="text-stat-md text-text-primary tabular">{value}</div>
    </div>
  );
}

/* ─── Done ────────────────────────────────────────────────── */

function DoneStep({ workflow }: { workflow: LaunchWorkflow }) {
  const exit = useSpotStore((s) => s.exitWorkflow);
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8">
      <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center mb-3">
        <PartyPopper size={20} strokeWidth={1.6} className="text-[#15803D]" />
      </div>
      <h2 className="text-section-header text-text-primary">Launch complete</h2>
      <p className="text-meta text-text-secondary mt-1.5 max-w-[360px]">
        Campaigns are live for {workflow.productName}. Track them on /campaigns — Spot will keep watching and flag anything off.
      </p>
      <button
        type="button"
        onClick={exit}
        className="mt-5 inline-flex items-center gap-1.5 h-9 px-4 rounded-button bg-[#111] text-[#FAFAF8] hover:bg-black text-[12.5px] font-medium"
      >
        Close workflow
      </button>
    </div>
  );
}
