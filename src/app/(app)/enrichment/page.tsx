"use client";

// Enrichment — the data layer that turns raw leads into qualified
// records. In the Agentic OS this is the substrate Spot uses to (a)
// score incoming leads BOFU and (b) feed lookalike audiences TOFU.
//
// This is a placeholder surface — wired into nav, has the right shape,
// uses real-feeling mock data so the page tells a complete story.

import { Database, ArrowUpRight, Plus, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { SpotMark } from "@/components/spot/spot-mark";
import { useSpotStore } from "@/lib/spot/store";

type RunStatus = "complete" | "running" | "failed";

type EnrichmentRun = {
  id: string;
  source: string;
  records: number;
  enriched: number;
  status: RunStatus;
  at: string;
  duration: string;
};

const RUNS: EnrichmentRun[] = [
  { id: "r1", source: "Banerghatta — Meta lead form", records: 1240, enriched: 1186, status: "complete", at: "2026-05-26 · 18:42", duration: "4m 12s" },
  { id: "r2", source: "Yelahanka — Google lead form", records: 842, enriched: 780, status: "complete", at: "2026-05-26 · 12:18", duration: "2m 48s" },
  { id: "r3", source: "NRI Outreach — WhatsApp respondents", records: 318, enriched: 312, status: "running", at: "2026-05-27 · 09:04", duration: "—" },
  { id: "r4", source: "Whitefield — Meta lead form", records: 462, enriched: 0, status: "failed", at: "2026-05-25 · 22:11", duration: "0m 22s" },
];

const PROVIDERS = [
  { name: "Truecaller", coverage: "98% phone match", status: "connected" },
  { name: "LinkedIn Sales Nav", coverage: "62% professional match", status: "connected" },
  { name: "Surepass", coverage: "PAN, RERA, Aadhaar verify", status: "connected" },
  { name: "Apollo", coverage: "Email verification", status: "needs-attention" },
];

const ENRICHMENT_FIELDS = [
  "Verified phone number",
  "Verified email (deliverable)",
  "Profession (LinkedIn-matched)",
  "Income band",
  "Residence-current location",
  "NRI status & country",
  "PAN / RERA match",
  "Past property purchase signal",
];

const TONE: Record<RunStatus, { pill: string; label: string; icon: typeof CheckCircle2 }> = {
  complete: { pill: "pill-ok", label: "Complete", icon: CheckCircle2 },
  running: { pill: "pill-info", label: "Running", icon: RefreshCw },
  failed: { pill: "pill-err", label: "Failed", icon: AlertCircle },
};

export default function EnrichmentPage() {
  const askSpot = useSpotStore((s) => s.askSpot);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-meta text-text-secondary mb-1">Data · Lead intelligence</div>
          <h1 className="text-page-title text-text-primary">Enrichment</h1>
          <p className="text-meta text-text-secondary mt-1 max-w-[640px]">
            Every raw lead gets enriched the moment it lands. Spot uses the enriched record to qualify BOFU and to build
            lookalikes TOFU.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => askSpot("Run a fresh enrichment pass across all my live campaigns.")}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-button border border-border bg-white hover:border-border-hover text-[12.5px] font-medium"
          >
            <SpotMark size={13} />
            Run with Spot
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-button bg-[#111] text-[#FAFAF8] hover:bg-black text-[12.5px] font-medium"
          >
            <Plus size={14} strokeWidth={2} />
            New run
          </button>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <Stat label="Records enriched (30d)" value="14,238" />
        <Stat label="Avg match rate" value="92%" />
        <Stat label="Verified phone hits" value="11,408" />
        <Stat label="NRI flagged" value="318" />
      </div>

      {/* Recent runs */}
      <div className="bg-white border border-border rounded-card overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
          <div className="label-section">Recent runs</div>
          <span className="text-[11px] text-text-tertiary">Showing 4 of 28</span>
        </div>
        <div className="divide-y divide-border-subtle">
          {RUNS.map((r) => {
            const t = TONE[r.status];
            const Icon = t.icon;
            return (
              <div key={r.id} className="px-4 py-3 hover-row flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 rounded-button bg-surface-secondary flex items-center justify-center">
                    <Database size={13} strokeWidth={1.5} className="text-text-secondary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-text-primary truncate">{r.source}</div>
                  <div className="text-[11.5px] text-text-tertiary mt-0.5">{r.at} · {r.duration}</div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] text-text-primary tabular">
                    {r.enriched.toLocaleString()} / {r.records.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-text-tertiary">enriched</div>
                </div>
                <span className={`pill ${t.pill}`}>
                  <Icon size={10} strokeWidth={2} />
                  {t.label}
                </span>
                <button className="text-text-tertiary hover:text-text-primary">
                  <ArrowUpRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Fields enriched */}
        <div className="bg-white border border-border rounded-card p-4">
          <div className="label-section mb-3">Fields we enrich</div>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
            {ENRICHMENT_FIELDS.map((f) => (
              <div key={f} className="flex items-center gap-1.5 text-[12.5px] text-text-primary">
                <CheckCircle2 size={11} strokeWidth={1.6} className="text-[#15803D] flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Providers */}
        <div className="bg-white border border-border rounded-card p-4">
          <div className="label-section mb-3">Data providers</div>
          <div className="space-y-2">
            {PROVIDERS.map((p) => (
              <div key={p.name} className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-text-primary">{p.name}</div>
                  <div className="text-[11.5px] text-text-tertiary">{p.coverage}</div>
                </div>
                <span className={`pill ${p.status === "connected" ? "pill-ok" : "pill-warn"}`}>
                  {p.status === "connected" ? "Connected" : "Action needed"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spot prompt */}
      <div className="bg-[#FAF8F2] border border-[#E8E3D5] rounded-card p-4 flex items-center gap-3 mt-5">
        <SpotMark size={20} />
        <div className="flex-1">
          <div className="text-[13px] font-medium text-text-primary">Build a lookalike from your top BOFU leads?</div>
          <div className="text-[12px] text-text-secondary mt-0.5">
            I'll pull leads who converted in the last 30 days, build a verified phone-match audience, and push it to Meta + Google.
          </div>
        </div>
        <button
          type="button"
          onClick={() => askSpot("Build a lookalike audience from my top BOFU leads in the last 30 days.")}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-button bg-[#111] text-[#FAFAF8] hover:bg-black text-[12px] font-medium"
        >
          <Sparkles size={12} strokeWidth={2} />
          Build with Spot
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-border rounded-card p-3">
      <div className="text-[11.5px] text-text-tertiary mb-1">{label}</div>
      <div className="text-stat-md text-text-primary tabular">{value}</div>
    </div>
  );
}
