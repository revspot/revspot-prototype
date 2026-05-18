"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
  projectsForWorkspace,
  projectRollup,
  type ProjectDetail,
} from "@/lib/project-data";
import { useCurrentScope } from "@/lib/workspace-store";

function HealthPill({
  health,
}: {
  health: "on-track" | "needs-attention" | "underperforming";
}) {
  const map = {
    "on-track": { label: "On track", cls: "pill-ok" },
    "needs-attention": { label: "Attention", cls: "pill-warn" },
    underperforming: { label: "Low", cls: "pill-err" },
  } as const;
  const c = map[health];
  return (
    <span className={`pill ${c.cls}`} style={{ fontSize: 11 }}>
      {c.label}
    </span>
  );
}

function fmtRupees(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

function lakhsFromDisplay(label: string | number | undefined | null): number {
  if (label === undefined || label === null) return 0;
  const m = String(label).match(/([0-9]+(\.[0-9]+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

function GoalPill({ goal }: { goal: ProjectDetail["goal"] }) {
  const pct = Math.min(100, Math.round((goal.achieved / goal.target) * 100));
  const paceCls =
    goal.pace === "ahead" ? "pill-ok" : goal.pace === "on-pace" ? "pill-info" : "pill-err";
  return (
    <div className="flex items-baseline gap-1.5 justify-end">
      <span className="text-[12.5px] tabular-nums font-medium text-text-primary">
        {goal.achieved}
      </span>
      <span className="text-[10.5px] text-text-tertiary tabular-nums">/ {goal.target}</span>
      <span
        className={`pill ${paceCls}`}
        style={{ fontSize: 9.5, padding: "1px 5px", letterSpacing: 0.3, fontWeight: 700 }}
      >
        {pct}%
      </span>
    </div>
  );
}

export function ProjectPerformanceTable() {
  const router = useRouter();
  const scope = useCurrentScope();
  const projects = projectsForWorkspace(scope.kind === "all" ? undefined : scope.id);

  if (projects.length === 0) {
    return (
      <div className="bg-white border border-border rounded-card p-10 text-center">
        <div className="text-section-header text-text-primary mb-1">No projects yet</div>
        <div className="text-meta text-text-tertiary mb-3">
          Create your first project to see performance here.
        </div>
        <Link
          href="/projects"
          className="text-[13px] font-medium text-text-secondary hover:text-text-primary inline-flex items-center gap-1"
        >
          Go to Projects
          <ArrowRight size={13} strokeWidth={1.5} />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-card">
      <div className="px-6 py-5 border-b border-border-subtle">
        <h2 className="text-section-header text-text-primary">Project performance</h2>
        <div className="text-meta text-text-tertiary mt-0.5">
          Click any project to open it.
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left px-6 py-3 text-[12px] font-medium text-text-tertiary uppercase tracking-[0.5px]">
                Project
              </th>
              <th className="text-right px-3 py-3 text-[12px] font-medium text-text-tertiary uppercase tracking-[0.5px]">
                Spend
              </th>
              <th className="text-right px-3 py-3 text-[12px] font-medium text-text-tertiary uppercase tracking-[0.5px]">
                Leads
              </th>
              <th className="text-right px-3 py-3 text-[12px] font-medium text-text-tertiary uppercase tracking-[0.5px]">
                Verified
              </th>
              <th className="text-right px-3 py-3 text-[12px] font-medium text-text-tertiary uppercase tracking-[0.5px]">
                Qualified
              </th>
              <th className="text-right px-3 py-3 text-[12px] font-medium text-text-tertiary uppercase tracking-[0.5px]">
                Goal
              </th>
              <th className="text-center px-6 py-3 text-[12px] font-medium text-text-tertiary uppercase tracking-[0.5px]">
                Health
              </th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {projects.map((p, i) => {
              const r = projectRollup(p.id)!;
              const spendRupees = lakhsFromDisplay(r.spend) * 100000;
              const cpl = r.totalLeads ? spendRupees / r.totalLeads : null;
              const cpvl = r.verifiedLeads ? spendRupees / r.verifiedLeads : null;
              const cpql = r.qualifiedLeads ? spendRupees / r.qualifiedLeads : null;
              return (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  className={`hover:bg-surface-page transition-colors duration-150 cursor-pointer ${
                    i % 2 === 0 ? "bg-white" : "bg-surface-page/50"
                  }`}
                >
                  <td className="px-6 py-3 max-w-[280px]">
                    <div className="text-[13px] text-text-primary font-medium truncate">
                      {p.name.split(" · ")[0]}
                    </div>
                    <div className="text-[11px] text-text-tertiary truncate">
                      {p.category}
                      {p.micromarket ? ` · ${p.micromarket.split(" · ")[0]}` : ""}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    <div className="text-[13px] text-text-primary font-medium">{r.spend}</div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    <div className="text-[13px] text-text-primary">
                      {r.totalLeads.toLocaleString()}
                    </div>
                    <div className="text-[10.5px] text-text-tertiary">
                      {cpl ? `${fmtRupees(cpl)} CPL` : "—"}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    <div className="text-[13px] text-text-primary">
                      {r.verifiedLeads.toLocaleString()}
                    </div>
                    <div className="text-[10.5px] text-text-tertiary">
                      {r.verifRate !== null
                        ? `${r.verifRate.toFixed(1)}% · ${cpvl ? fmtRupees(cpvl) : "—"} CPVL`
                        : "—"}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    <div className="text-[13px] text-text-primary">
                      {r.qualifiedLeads.toLocaleString()}
                    </div>
                    <div className="text-[10.5px] text-text-tertiary">
                      {r.qualRate !== null
                        ? `${r.qualRate.toFixed(1)}% · ${cpql ? fmtRupees(cpql) : "—"} CPQL`
                        : "—"}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <GoalPill goal={r.goal} />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <HealthPill health={p.health} />
                  </td>
                  <td className="px-2 py-3 text-right">
                    <ChevronRight size={14} className="text-text-tertiary" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-border-subtle">
        <Link
          href="/projects"
          className="text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors duration-150 inline-flex items-center gap-1"
        >
          View all projects
          <ArrowRight size={13} strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  );
}
