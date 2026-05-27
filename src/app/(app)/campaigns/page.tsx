"use client";

// Campaigns dashboard — read-only hierarchical view.
//
// Campaign → Ad Set → Ad. Each row expands the level below it. The
// platform never lets the user edit campaign / ad-set / ad settings:
// the only edit paths are
//   · Open in Meta — link out to the live entity
//   · Ask Spot — opens /spot pre-loaded with the edit intent
//
// This is by design — Spot owns the "make the change" loop. The
// platform owns the "see the data" loop.

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Search,
  Image as ImageIcon,
  Film,
  Layout,
  Pause,
  Play,
  CircleDot,
} from "lucide-react";
import { SpotMark } from "@/components/spot/spot-mark";
import { useSpotStore } from "@/lib/spot/store";
import { campaignHierarchy, type AdSetRowHier, type AdRow, type CampaignHier } from "@/lib/campaign-hierarchy";
import type { CampaignListItem, CampaignStatus } from "@/lib/campaign-data";

const STATUS_TONE: Record<CampaignStatus, { pill: string; label: string; Icon: typeof CircleDot }> = {
  enabled: { pill: "pill-ok", label: "Enabled", Icon: Play },
  paused: { pill: "pill-warn", label: "Paused", Icon: Pause },
  draft: { pill: "pill", label: "Draft", Icon: CircleDot },
};

const HEALTH_TONE: Record<CampaignListItem["health"], { label: string; pill: string }> = {
  "on-track": { label: "On track", pill: "pill-ok" },
  "needs-attention": { label: "Needs attention", pill: "pill-warn" },
  underperforming: { label: "Underperforming", pill: "pill-err" },
};

function inr(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n >= 1000000 ? 1 : 2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

export default function CampaignsPage() {
  const askSpot = useSpotStore((s) => s.askSpot);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CampaignStatus>("all");

  const toggle = (id: string) =>
    setExpanded((m) => ({ ...m, [id]: !m[id] }));

  const filtered = useMemo(() => {
    return campaignHierarchy.filter((h) => {
      if (statusFilter !== "all" && h.campaign.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        h.campaign.name.toLowerCase().includes(q) ||
        h.campaign.client.toLowerCase().includes(q)
      );
    });
  }, [query, statusFilter]);

  const totalSpend = filtered.reduce((s, h) => s + h.campaign.spend, 0);
  const totalLeads = filtered.reduce((s, h) => s + h.campaign.leads, 0);
  const liveCount = filtered.filter((h) => h.campaign.status === "enabled").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-meta text-text-secondary mb-1">Growth · Live spend</div>
          <h1 className="text-page-title text-text-primary">Campaigns</h1>
          <p className="text-meta text-text-secondary mt-1 max-w-[640px]">
            Performance across every Meta and Google campaign. Read-only on Revspot — Spot owns the edits, or
            link out to Meta to make changes manually.
          </p>
        </div>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => askSpot("Diagnose this week across all campaigns — where should I act?")}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-button border border-border bg-white hover:border-border-hover text-[12.5px] font-medium"
          >
            <SpotMark size={13} />
            Diagnose with Spot
          </button>
        </div>
      </div>

      {/* Roll-up strip */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <Stat label="Live campaigns" value={liveCount} />
        <Stat label="Total spend (30d)" value={inr(totalSpend)} />
        <Stat label="Total leads (30d)" value={totalLeads.toLocaleString("en-IN")} />
        <Stat
          label="Avg CPL"
          value={totalLeads > 0 ? inr(Math.round(totalSpend / totalLeads)) : "—"}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-[320px]">
          <Search size={13} strokeWidth={1.8} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns…"
            className="w-full h-8 pl-7 pr-3 rounded-button border border-border bg-white text-[12.5px] placeholder:text-text-tertiary focus:outline-none focus:border-text-primary"
          />
        </div>
        <div className="inline-flex items-center gap-0.5 bg-surface-secondary p-0.5 rounded-button">
          {(["all", "enabled", "paused", "draft"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`h-7 px-2.5 rounded-[5px] text-[11.5px] font-medium transition-colors ${
                statusFilter === s ? "bg-white text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {s === "all" ? "All" : STATUS_TONE[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-card overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_120px_110px_110px_110px_140px_240px] gap-3 px-4 py-2.5 border-b border-border bg-surface-page text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
          <div>Name</div>
          <div className="text-right">Spend</div>
          <div className="text-right">Leads</div>
          <div className="text-right">CPL</div>
          <div className="text-right">CTR</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] text-text-tertiary">
            No campaigns match your filters.
          </div>
        ) : (
          filtered.map((h) => (
            <CampaignRow
              key={h.campaign.id}
              hier={h}
              expanded={!!expanded[h.campaign.id]}
              onToggle={() => toggle(h.campaign.id)}
              isAdsetExpanded={(id) => !!expanded[id]}
              onToggleAdset={(id) => toggle(id)}
              askSpot={askSpot}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Rows ───────────────────────────────────────────────────── */

function CampaignRow({
  hier,
  expanded,
  onToggle,
  isAdsetExpanded,
  onToggleAdset,
  askSpot,
}: {
  hier: CampaignHier;
  expanded: boolean;
  onToggle: () => void;
  isAdsetExpanded: (id: string) => boolean;
  onToggleAdset: (id: string) => void;
  askSpot: (q: string) => void;
}) {
  const c = hier.campaign;
  const StatusIcon = STATUS_TONE[c.status].Icon;
  const health = HEALTH_TONE[c.health];

  return (
    <>
      {/* Campaign row */}
      <div className="grid grid-cols-[1fr_120px_110px_110px_110px_140px_240px] gap-3 px-4 py-3 border-b border-border-subtle items-center hover-row">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onToggle}
            className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded text-text-secondary hover:bg-surface-secondary"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-text-primary truncate">{c.name}</div>
            <div className="text-[11px] text-text-tertiary truncate">
              {c.client} · {c.type} · {hier.adsets.length} ad set{hier.adsets.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
        <div className="text-right text-[13px] text-text-primary tabular">{inr(c.spend)}</div>
        <div className="text-right text-[13px] text-text-primary tabular">{c.leads.toLocaleString("en-IN")}</div>
        <div className="text-right text-[13px] text-text-primary tabular">{inr(c.cpl)}</div>
        <div className="text-right text-[13px] text-text-primary tabular">{c.ctr}%</div>
        <div className="flex items-center gap-1 flex-wrap">
          <span className={`pill ${STATUS_TONE[c.status].pill} inline-flex items-center gap-1`}>
            <StatusIcon size={9} strokeWidth={2} />
            {STATUS_TONE[c.status].label}
          </span>
          <span className={`pill ${health.pill}`} style={{ fontSize: 10 }}>
            {health.label}
          </span>
        </div>
        <ActionCell
          metaUrl={hier.metaUrl}
          onAskSpot={() =>
            askSpot(`Edit campaign "${c.name}" — what change should I propose, and apply it on Meta?`)
          }
        />
      </div>

      {/* Ad sets — only when campaign is expanded */}
      {expanded &&
        hier.adsets.map((a) => (
          <AdSetSubRow
            key={a.id}
            adset={a}
            expanded={isAdsetExpanded(a.id)}
            onToggle={() => onToggleAdset(a.id)}
            askSpot={askSpot}
          />
        ))}
    </>
  );
}

function AdSetSubRow({
  adset,
  expanded,
  onToggle,
  askSpot,
}: {
  adset: AdSetRowHier;
  expanded: boolean;
  onToggle: () => void;
  askSpot: (q: string) => void;
}) {
  const StatusIcon = STATUS_TONE[adset.status].Icon;
  return (
    <>
      <div className="grid grid-cols-[1fr_120px_110px_110px_110px_140px_240px] gap-3 px-4 py-2.5 border-b border-border-subtle items-center hover-row bg-[#FAFAFA]">
        <div className="flex items-center gap-2 min-w-0 pl-7">
          <button
            type="button"
            onClick={onToggle}
            className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded text-text-secondary hover:bg-surface-secondary"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium text-text-primary truncate">{adset.name}</div>
            <div className="text-[11px] text-text-tertiary">
              Ad set · {adset.ads.length} ad{adset.ads.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
        <div className="text-right text-[12.5px] text-text-primary tabular">{inr(adset.spend)}</div>
        <div className="text-right text-[12.5px] text-text-primary tabular">{adset.leads.toLocaleString("en-IN")}</div>
        <div className="text-right text-[12.5px] text-text-primary tabular">{inr(adset.cpl)}</div>
        <div className="text-right text-[12.5px] text-text-primary tabular">{adset.ctr}%</div>
        <div>
          <span className={`pill ${STATUS_TONE[adset.status].pill} inline-flex items-center gap-1`}>
            <StatusIcon size={9} strokeWidth={2} />
            {STATUS_TONE[adset.status].label}
          </span>
        </div>
        <ActionCell
          metaUrl={adset.metaUrl}
          onAskSpot={() =>
            askSpot(`Adjust ad set "${adset.name}" — audience, schedule, or bid. Apply on Meta when ready.`)
          }
        />
      </div>

      {expanded &&
        adset.ads.map((ad) => <AdSubRow key={ad.id} ad={ad} askSpot={askSpot} />)}
    </>
  );
}

const KIND_ICON: Record<AdRow["kind"], typeof ImageIcon> = {
  image: ImageIcon,
  video: Film,
  carousel: Layout,
};

function AdSubRow({ ad, askSpot }: { ad: AdRow; askSpot: (q: string) => void }) {
  const StatusIcon = STATUS_TONE[ad.status].Icon;
  const KindIcon = KIND_ICON[ad.kind];
  return (
    <div className="grid grid-cols-[1fr_120px_110px_110px_110px_140px_240px] gap-3 px-4 py-2 border-b border-border-subtle items-center hover-row bg-white">
      <div className="flex items-center gap-2 min-w-0 pl-14">
        <KindIcon size={11} strokeWidth={1.6} className="text-text-tertiary flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-[12px] text-text-primary truncate">
            {ad.name}
            <span className="ml-1.5 text-[10.5px] text-text-tertiary">· {ad.format}</span>
          </div>
        </div>
      </div>
      <div className="text-right text-[12px] text-text-primary tabular">{inr(ad.spend)}</div>
      <div className="text-right text-[12px] text-text-primary tabular">{ad.leads.toLocaleString("en-IN")}</div>
      <div className="text-right text-[12px] text-text-primary tabular">{inr(ad.cpl)}</div>
      <div className="text-right text-[12px] text-text-primary tabular">{ad.ctr}%</div>
      <div>
        <span className={`pill ${STATUS_TONE[ad.status].pill} inline-flex items-center gap-1`} style={{ fontSize: 10 }}>
          <StatusIcon size={8} strokeWidth={2} />
          {STATUS_TONE[ad.status].label}
        </span>
      </div>
      <ActionCell
        metaUrl={ad.metaUrl}
        onAskSpot={() =>
          askSpot(`Swap creative or copy on ad "${ad.name}". Propose the change and apply on Meta.`)
        }
        compact
      />
    </div>
  );
}

/* ─── Action cell ────────────────────────────────────────────── */

function ActionCell({
  metaUrl,
  onAskSpot,
  compact,
}: {
  metaUrl: string;
  onAskSpot: () => void;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onAskSpot}
        className={`inline-flex items-center gap-1 rounded-button bg-[#111] text-[#FAFAF8] hover:bg-black font-medium ${
          compact ? "h-6 px-2 text-[10.5px]" : "h-7 px-2.5 text-[11.5px]"
        }`}
      >
        <Sparkles size={compact ? 9 : 11} strokeWidth={2} />
        Ask Spot to edit
      </button>
      <a
        href={metaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 rounded-button border border-border bg-white hover:border-border-hover text-text-secondary hover:text-text-primary ${
          compact ? "h-6 px-2 text-[10.5px]" : "h-7 px-2.5 text-[11.5px]"
        }`}
      >
        Open in Meta
        <ArrowUpRight size={compact ? 9 : 11} strokeWidth={1.8} />
      </a>
    </div>
  );
}

/* ─── Stat ───────────────────────────────────────────────────── */

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-border rounded-card p-3">
      <div className="text-[11.5px] text-text-tertiary mb-1">{label}</div>
      <div className="text-stat-md text-text-primary tabular">{value}</div>
    </div>
  );
}
