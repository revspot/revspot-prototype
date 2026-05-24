"use client";

import {
  BarChart3,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  ArrowUpRight,
} from "lucide-react";
import type { ProjectDetail, Persona } from "@/lib/project-data";
import { SectionHeader } from "./shared/section-header";

/**
 * Dashboard tab — project-level analytics view. The trend visuals are
 * structural placeholders for now (replaced with real sparklines once
 * the time-series data lands); the at-a-glance counts, per-persona
 * ranking and Spot-surfaced insights are wired against real data.
 */
export function DashboardSection({
  project,
  onAsk,
}: {
  project: ProjectDetail;
  onAsk: (q: string) => void;
}) {
  const personaCount = project.personas.length;
  const creativeCount = project.personas.reduce(
    (n, p) => n + p.angles.reduce((m, a) => m + a.concept.creatives.length, 0),
    0,
  );
  const liveAngles = project.personas.reduce(
    (n, p) => n + p.angles.filter((a) => a.status === "live").length,
    0,
  );
  const liveCampaigns = project.mediaPlan.rows.filter(
    (r) => r.status === "live",
  ).length;

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={BarChart3}
        title="Dashboard"
        subtitle="how this project is doing — top of funnel down to verified leads"
        onAsk={() =>
          onAsk(
            "Summarize how this project is performing this week against goal",
          )
        }
        actions={
          <a
            href={`/projects/${project.id}/deep/dashboard`}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-button border border-border bg-white text-[11.5px] hover:border-border-hover"
          >
            <ArrowUpRight size={11} /> Deep dive
          </a>
        }
      />

      {/* At-a-glance cards */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}
      >
        <StatCard
          icon={<Target size={14} />}
          label="Verified leads"
          value={String(project.goal.achieved)}
          sub={
            project.goal.target > 0
              ? `of ${project.goal.target} goal`
              : "no goal set"
          }
        />
        <StatCard
          icon={<Users size={14} />}
          label="Personas"
          value={String(personaCount)}
          sub={`${liveAngles} angle${liveAngles === 1 ? "" : "s"} live`}
        />
        <StatCard
          icon={<TrendingUp size={14} />}
          label="Live campaigns"
          value={String(liveCampaigns)}
          sub={`${project.mediaPlan.rows.length} total`}
        />
        <StatCard
          icon={<BarChart3 size={14} />}
          label="Creatives"
          value={String(creativeCount)}
          sub="across all angles"
        />
      </div>

      {/* Trend row */}
      <div>
        <div className="uplabel mb-2" style={{ fontSize: 9.5 }}>
          Trends · last 7 days
        </div>
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}
        >
          <TrendCard
            label="Verified leads / day"
            value={String(project.goal.achieved)}
            sub={project.goal.target > 0 ? "vs goal pace" : "set a goal to track"}
          />
          <TrendCard label="CPVL trend" value="₹2.1K" sub="-12% week over week" />
          <TrendCard label="Spend" value="—" sub="weekly total" />
        </div>
      </div>

      {/* Persona ranking */}
      <div>
        <div className="uplabel mb-2" style={{ fontSize: 9.5 }}>
          Persona performance
        </div>
        <div className="card-base overflow-hidden">
          <div
            className="grid px-3.5 py-2 text-[10.5px] uppercase tracking-[0.4px] text-text-tertiary font-semibold"
            style={{
              gridTemplateColumns: "32px 1.5fr 0.7fr 0.7fr 0.7fr 1.5fr",
              background: "var(--bg-page)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <span>#</span>
            <span>Persona</span>
            <span className="text-right">Verified</span>
            <span className="text-right">CPVL</span>
            <span className="text-right">Share</span>
            <span>Winning angle</span>
          </div>
          {sortedPersonas(project).map((p, i) => (
            <PersonaRankRow key={p.id} rank={i + 1} persona={p} />
          ))}
          {project.personas.length === 0 && (
            <div className="px-3.5 py-6 text-center text-[12px] text-text-tertiary">
              No personas yet — add one on the Personas tab.
            </div>
          )}
        </div>
      </div>

      {/* Spot insights */}
      <div>
        <div className="uplabel mb-2" style={{ fontSize: 9.5 }}>
          Spot&apos;s read
        </div>
        <SpotInsightsCard project={project} onAsk={onAsk} />
      </div>
    </div>
  );
}

function sortedPersonas(project: ProjectDetail): Persona[] {
  return [...project.personas].sort((a, b) => {
    if (b.verifiedLeads !== a.verifiedLeads)
      return b.verifiedLeads - a.verifiedLeads;
    return b.share - a.share;
  });
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="card-base p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5 text-text-tertiary">
        {icon}
        <span className="uplabel" style={{ fontSize: 9.5 }}>
          {label}
        </span>
      </div>
      <div
        className="tabular-nums"
        style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}
      >
        {value}
      </div>
      <div className="text-[10.5px] text-text-tertiary mt-0.5">{sub}</div>
    </div>
  );
}

function TrendCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="card-base p-3.5">
      <div className="uplabel mb-1.5" style={{ fontSize: 9.5 }}>
        {label}
      </div>
      <div
        className="tabular-nums"
        style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.1 }}
      >
        {value}
      </div>
      <div className="text-[10.5px] text-text-tertiary mt-0.5">{sub}</div>
      <div
        className="mt-2.5"
        style={{
          height: 32,
          borderRadius: 6,
          background:
            "linear-gradient(180deg, rgba(124,58,237,0.12) 0%, rgba(192,38,211,0.06) 100%)",
          border: "1px dashed var(--border-subtle)",
        }}
      />
    </div>
  );
}

function PersonaRankRow({
  rank,
  persona,
}: {
  rank: number;
  persona: Persona;
}) {
  const winningAngle =
    persona.angles.find((a) =>
      a.concept.creatives.some((c) => c.tag === "winner"),
    ) ||
    persona.angles.find((a) => a.status === "live") ||
    persona.angles[0];

  return (
    <div
      className="grid items-center px-3.5 py-2.5 text-[12px]"
      style={{
        gridTemplateColumns: "32px 1.5fr 0.7fr 0.7fr 0.7fr 1.5fr",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <span className="tabular-nums text-text-tertiary">#{rank}</span>
      <span className="font-medium truncate">{persona.name}</span>
      <span className="text-right tabular-nums">{persona.verifiedLeads}</span>
      <span className="text-right tabular-nums">{persona.cpvl}</span>
      <span className="text-right tabular-nums">{persona.share}%</span>
      <span className="text-text-secondary truncate">
        {winningAngle?.name ?? "—"}
      </span>
    </div>
  );
}

function SpotInsightsCard({
  project,
  onAsk,
}: {
  project: ProjectDetail;
  onAsk: (q: string) => void;
}) {
  // Derive 1–2 insight strings from the project state. Lightweight,
  // human-readable, not a real Spot agent — but framed as if Spot wrote it.
  const insights: string[] = [];
  const liveCount = project.mediaPlan.rows.filter(
    (r) => r.status === "live",
  ).length;
  if (project.goal.target === 0) {
    insights.push(
      "Set a goal first — without a target, projected pace and gap-to-goal can't be calculated.",
    );
  } else if (project.goal.pace === "behind") {
    insights.push(
      `You're tracking behind goal — forecast is ${project.goal.forecast} of ${project.goal.target}. Open the goal popover for a plan-to-close-gap.`,
    );
  } else if (project.goal.pace === "ahead") {
    insights.push(
      `Ahead of pace by ${project.goal.paceDelta}. Consider raising the goal target or reallocating budget to a stretch persona.`,
    );
  }
  if (liveCount === 0 && project.mediaPlan.rows.length > 0) {
    insights.push(
      `${project.mediaPlan.rows.length} campaign${project.mediaPlan.rows.length === 1 ? "" : "s"} drafted, none live yet — deploy from the Campaigns tab.`,
    );
  }
  if (project.personas.length > 0 && project.personas.every((p) => p.angles.length <= 1)) {
    insights.push(
      "Most personas have only one angle — drafting a second angle per persona usually lifts CPVL within a week.",
    );
  }

  return (
    <div
      className="rounded-[10px] p-3.5"
      style={{
        background: "var(--spot-tint)",
        border: "1px solid var(--spot-stroke)",
      }}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="inline-flex items-center justify-center flex-shrink-0"
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background:
              "linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)",
            color: "#FFF",
          }}
        >
          <Sparkles size={13} />
        </span>
        <div className="flex-1 min-w-0">
          {insights.length > 0 ? (
            <ul className="space-y-1.5">
              {insights.map((line, i) => (
                <li
                  key={i}
                  className="text-[12px] text-text-secondary leading-[1.55]"
                >
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-[12px] text-text-secondary leading-[1.55]">
              Everything looks healthy. Ask me anything about this project.
            </div>
          )}
          <button
            type="button"
            onClick={() =>
              onAsk("Give me a week-over-week recap for this project")
            }
            className="mt-2.5 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-button bg-white text-[11.5px] hover:border-border-hover"
            style={{ border: "1px solid var(--border)" }}
          >
            <Sparkles size={11} /> Ask Spot for the full recap
          </button>
        </div>
      </div>
    </div>
  );
}
