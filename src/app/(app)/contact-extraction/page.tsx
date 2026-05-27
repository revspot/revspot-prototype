"use client";

// Contact Extraction — the inverse of Enrichment. Where Enrichment
// thickens leads you already have, Extraction is how Spot finds new
// contacts: pulling validated phone-and-name pairs out of public
// sources, sites, listings, and Revspot's own audience graph.
//
// These extracted contacts become the raw fuel for Outreach (Voice +
// WhatsApp outbound) — they are NOT served paid ads.

import { ScanLine, ArrowUpRight, Plus, CheckCircle2, AlertCircle, Sparkles, Globe } from "lucide-react";
import { SpotMark } from "@/components/spot/spot-mark";
import { useSpotStore } from "@/lib/spot/store";

type RunStatus = "complete" | "running" | "queued";

type ExtractionJob = {
  id: string;
  source: string;
  type: "site" | "directory" | "audience" | "search";
  contacts: number;
  validated: number;
  status: RunStatus;
  at: string;
};

const JOBS: ExtractionJob[] = [
  { id: "j1", source: "99acres — South Bangalore 3BHK sellers", type: "directory", contacts: 412, validated: 386, status: "complete", at: "2026-05-26 · 16:20" },
  { id: "j2", source: "MagicBricks — North Bangalore villa enquiries", type: "directory", contacts: 284, validated: 261, status: "complete", at: "2026-05-25 · 11:08" },
  { id: "j3", source: "Revspot · Returning NRI graph", type: "audience", contacts: 1820, validated: 1612, status: "complete", at: "2026-05-24 · 09:40" },
  { id: "j4", source: "Search · “Bangalore NRI buying agent” authors", type: "search", contacts: 86, validated: 0, status: "running", at: "2026-05-27 · 09:10" },
  { id: "j5", source: "Site · linkedin company alumni · Wipro", type: "site", contacts: 0, validated: 0, status: "queued", at: "Queued" },
];

const TONE: Record<RunStatus, { pill: string; label: string; icon: typeof CheckCircle2 }> = {
  complete: { pill: "pill-ok", label: "Complete", icon: CheckCircle2 },
  running: { pill: "pill-info", label: "Running", icon: ScanLine },
  queued: { pill: "pill", label: "Queued", icon: AlertCircle },
};

export default function ContactExtractionPage() {
  const askSpot = useSpotStore((s) => s.askSpot);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-meta text-text-secondary mb-1">Data · New contact discovery</div>
          <h1 className="text-page-title text-text-primary">Contact Extraction</h1>
          <p className="text-meta text-text-secondary mt-1 max-w-[680px]">
            Spot pulls validated phone-and-name pairs from public sources, listings, and Revspot's audience graph. These
            feed Outreach (Voice + WhatsApp outbound) — they are not used for paid ads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => askSpot("Extract contacts that match my best-performing persona for Banerghatta.")}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-button border border-border bg-white hover:border-border-hover text-[12.5px] font-medium"
          >
            <SpotMark size={13} />
            Extract with Spot
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-button bg-[#111] text-[#FAFAF8] hover:bg-black text-[12.5px] font-medium"
          >
            <Plus size={14} strokeWidth={2} />
            New job
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <Stat label="Contacts (30d)" value="3,418" />
        <Stat label="Validated" value="3,054" />
        <Stat label="Pushed to Outreach" value="2,210" />
        <Stat label="Avg validation rate" value="89%" />
      </div>

      {/* Jobs */}
      <div className="bg-white border border-border rounded-card overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
          <div className="label-section">Extraction jobs</div>
          <span className="text-[11px] text-text-tertiary">Showing 5 of 18</span>
        </div>
        <div className="divide-y divide-border-subtle">
          {JOBS.map((j) => {
            const t = TONE[j.status];
            const Icon = t.icon;
            return (
              <div key={j.id} className="px-4 py-3 hover-row flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 rounded-button bg-surface-secondary flex items-center justify-center">
                    {j.type === "audience" ? <SpotMark size={13} /> : <Globe size={13} strokeWidth={1.5} className="text-text-secondary" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-text-primary truncate">{j.source}</div>
                  <div className="text-[11.5px] text-text-tertiary mt-0.5 uppercase tracking-wider">{j.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] text-text-primary tabular">
                    {j.contacts.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-text-tertiary">{j.validated.toLocaleString()} validated</div>
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

      {/* Sources we extract from */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-card p-4">
          <div className="label-section mb-3">Sources we extract from</div>
          <ul className="space-y-1.5 text-[13px] text-text-primary">
            <li className="flex gap-2"><span className="text-text-tertiary">·</span>Public listings (99acres, MagicBricks, NoBroker)</li>
            <li className="flex gap-2"><span className="text-text-tertiary">·</span>Site/page scraping with consent rules</li>
            <li className="flex gap-2"><span className="text-text-tertiary">·</span>Revspot Audience graph (cross-workspace)</li>
            <li className="flex gap-2"><span className="text-text-tertiary">·</span>Search-result authors & directory members</li>
            <li className="flex gap-2"><span className="text-text-tertiary">·</span>Uploaded CSVs (with phone column)</li>
          </ul>
        </div>
        <div className="bg-white border border-border rounded-card p-4">
          <div className="label-section mb-3">What "validated" means</div>
          <ul className="space-y-1.5 text-[13px] text-text-primary">
            <li className="flex gap-2"><CheckCircle2 size={12} strokeWidth={1.6} className="text-[#15803D] mt-0.5 flex-shrink-0" />Phone number active on a major Indian carrier</li>
            <li className="flex gap-2"><CheckCircle2 size={12} strokeWidth={1.6} className="text-[#15803D] mt-0.5 flex-shrink-0" />Name-to-number match via Truecaller</li>
            <li className="flex gap-2"><CheckCircle2 size={12} strokeWidth={1.6} className="text-[#15803D] mt-0.5 flex-shrink-0" />Not on DND for transactional categories</li>
            <li className="flex gap-2"><CheckCircle2 size={12} strokeWidth={1.6} className="text-[#15803D] mt-0.5 flex-shrink-0" />Geo plausibility (city/state matches source)</li>
          </ul>
        </div>
      </div>

      {/* Spot prompt */}
      <div className="bg-[#FAF8F2] border border-[#E8E3D5] rounded-card p-4 flex items-center gap-3 mt-5">
        <SpotMark size={20} />
        <div className="flex-1">
          <div className="text-[13px] font-medium text-text-primary">Push validated NRI contacts to Outreach?</div>
          <div className="text-[12px] text-text-secondary mt-0.5">
            1,612 validated contacts from the Returning NRI graph are ready. I can draft a WhatsApp script and call sequence next.
          </div>
        </div>
        <button
          type="button"
          onClick={() => askSpot("Push validated NRI contacts to Outreach and draft a WhatsApp + Voice sequence.")}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-button bg-[#111] text-[#FAFAF8] hover:bg-black text-[12px] font-medium"
        >
          <Sparkles size={12} strokeWidth={2} />
          Push with Spot
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
