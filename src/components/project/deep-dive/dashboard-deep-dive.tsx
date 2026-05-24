"use client";

import type { ProjectDetail, Persona } from "@/lib/project-data";

/**
 * Dashboard deep-dive — the project's at-a-glance metrics expanded with
 * per-persona ranking and a placeholder for trend charts (real charts
 * land in a follow-up pass; this view ships the structure + data).
 */
export function DashboardDeepDive({ project }: { project: ProjectDetail }) {
  return (
    <div className="space-y-4">
      <Header project={project} />
      <Trends project={project} />
      <PersonaRanking project={project} />
    </div>
  );
}

function Header({ project }: { project: ProjectDetail }) {
  const goal = project.goal;
  return (
    <div
      className="card-base p-4"
      style={{
        background:
          "linear-gradient(135deg, #FBF7FF 0%, #FFFDF6 60%, #FFFFFF 100%)",
      }}
    >
      <div className="uplabel mb-1" style={{ fontSize: 9.5, color: "#7C3AED" }}>
        Project pacing
      </div>
      <div className="text-[16px] font-semibold mb-0.5">
        {goal.target > 0
          ? goal.spotRead
          : "Set a goal to see Spot's projected pace and forecast."}
      </div>
      <div className="text-[11.5px] text-text-tertiary">
        {goal.target > 0
          ? `${goal.achieved} of ${goal.target} ${goal.kind} leads · day ${goal.daysElapsed} of ${goal.daysTotal}`
          : "—"}
      </div>
    </div>
  );
}

function Trends({ project }: { project: ProjectDetail }) {
  return (
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
          headline={String(project.goal.achieved)}
          sub="vs goal pace"
        />
        <TrendCard label="CPVL trend" headline="₹2.1K" sub="-12% vs last week" />
        <TrendCard label="Spend" headline="—" sub="weekly total" />
      </div>
    </div>
  );
}

function TrendCard({
  label,
  headline,
  sub,
}: {
  label: string;
  headline: string;
  sub: string;
}) {
  return (
    <div className="card-base p-4">
      <div className="uplabel mb-1.5" style={{ fontSize: 9.5 }}>
        {label}
      </div>
      <div
        className="tabular-nums"
        style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}
      >
        {headline}
      </div>
      <div className="text-[11px] text-text-tertiary mt-0.5">{sub}</div>
      <div
        className="mt-3"
        style={{
          height: 36,
          borderRadius: 6,
          background:
            "linear-gradient(180deg, rgba(124,58,237,0.12) 0%, rgba(192,38,211,0.08) 100%)",
          border: "1px dashed var(--border-subtle)",
        }}
      />
      <div className="text-[10px] text-text-tertiary mt-1.5">
        Real chart in next pass · structure shipped.
      </div>
    </div>
  );
}

function PersonaRanking({ project }: { project: ProjectDetail }) {
  // Sort personas by verified leads (descending). Ties broken by share.
  const ranked = [...project.personas].sort((a, b) => {
    if (b.verifiedLeads !== a.verifiedLeads) return b.verifiedLeads - a.verifiedLeads;
    return b.share - a.share;
  });
  return (
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
        {ranked.map((p, i) => (
          <PersonaRankRow key={p.id} rank={i + 1} persona={p} />
        ))}
      </div>
    </div>
  );
}

function PersonaRankRow({ rank, persona }: { rank: number; persona: Persona }) {
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
