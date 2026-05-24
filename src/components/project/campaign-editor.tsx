"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Copy,
  MapPin,
  Plus,
  Settings,
  Trash2,
  Layers,
  Play,
  Sparkles,
} from "lucide-react";
import type { MediaRow, MediaAdSet, MediaAd, ProjectDetail } from "@/lib/project-data";
import { mutateRuntimeProject } from "@/lib/project-data";

/**
 * Shared editor body — used by both campaign-editor shells (full-tab swap
 * and split-view). The shell handles back-navigation and outer layout;
 * this component owns the form sections themselves.
 *
 * Sections, top to bottom:
 *  · Identity   — name · objective (read-only, set when launched) · budget · bid strategy
 *  · Ad sets    — expandable cards; each shows audience · locations · age · gender ·
 *                 placements · detailed targeting + an "Advanced config" expansion
 *  · Ads        — list of ad assets per ad set (read-only here; managed in Personas)
 */
export function CampaignEditor({
  project,
  campaignId,
  onBack,
  variant,
}: {
  project: ProjectDetail;
  campaignId: string;
  /**
   * Back to the list. Wired only in the full-tab-swap shell — split view
   * doesn't show a back button since the list is always visible on the left.
   */
  onBack?: () => void;
  /** Tells the editor which shell it's inside, for spacing tweaks. */
  variant: "full" | "split";
}) {
  const campaign = project.mediaPlan.rows.find((r) => r.id === campaignId);

  if (!campaign) {
    return (
      <div className="card-base p-6 text-center text-[12.5px] text-text-tertiary">
        Campaign not found.
      </div>
    );
  }

  return (
    <div className="space-y-3" style={{ paddingTop: variant === "full" ? 4 : 0 }}>
      {variant === "full" && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[12px] text-text-secondary hover:text-text-primary mb-2"
        >
          <ArrowLeft size={13} /> Back to campaigns
        </button>
      )}

      <CampaignIdentitySection projectId={project.id} campaign={campaign} />
      <CampaignAdSetsSection projectId={project.id} campaign={campaign} />
      <CampaignAdsSection campaign={campaign} />
    </div>
  );
}

// ─── Identity section ───────────────────────────────────────────────────

function CampaignIdentitySection({
  projectId,
  campaign,
}: {
  projectId: string;
  campaign: MediaRow;
}) {
  const updateName = (next: string) => {
    mutateRuntimeProject(projectId, (p) => {
      const c = p.mediaPlan.rows.find((r) => r.id === campaign.id);
      if (c) c.campaign = next;
    });
  };
  const updateBudget = (next: number) => {
    mutateRuntimeProject(projectId, (p) => {
      const c = p.mediaPlan.rows.find((r) => r.id === campaign.id);
      if (c) c.budgetDaily = Math.max(0, Math.round(next));
    });
  };

  const [bidStrategy, setBidStrategy] = useState<"highest-volume" | "cost-cap">(
    "highest-volume",
  );
  const [pacing, setPacing] = useState<"daily" | "lifetime">("daily");

  return (
    <div className="card-base p-4">
      <SectionLabel
        title="Identity"
        sub="Name · objective · budget · bid"
      />

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Labeled label="Campaign name">
          <input
            type="text"
            defaultValue={campaign.campaign}
            onBlur={(e) => updateName(e.target.value)}
            className="w-full outline-none rounded-[8px] border border-border px-3 py-2 text-[13px]"
          />
        </Labeled>
        <Labeled label="Objective">
          <div
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] text-[12.5px]"
            style={{
              border: "1px solid var(--border)",
              background: "var(--bg-page)",
              color: "var(--text-2)",
            }}
          >
            Leads
            <span className="text-[10px] text-text-tertiary ml-1">
              · set when launched, cannot be changed
            </span>
          </div>
        </Labeled>
        <Labeled label="Daily budget (₹)">
          <input
            type="number"
            defaultValue={campaign.budgetDaily}
            onBlur={(e) => updateBudget(Number(e.target.value))}
            className="w-full outline-none rounded-[8px] border border-border px-3 py-2 text-[13px] tabular-nums"
          />
        </Labeled>
        <Labeled label="Pacing">
          <SegmentedControl
            value={pacing}
            options={[
              { value: "daily", label: "Daily" },
              { value: "lifetime", label: "Lifetime" },
            ]}
            onChange={(v) => setPacing(v as typeof pacing)}
          />
        </Labeled>
      </div>

      <Labeled label="Bid strategy">
        <div className="grid gap-2 mt-1" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <BidTile
            active={bidStrategy === "highest-volume"}
            onClick={() => setBidStrategy("highest-volume")}
            label="Highest volume"
            sub="Get the most leads within your budget"
          />
          <BidTile
            active={bidStrategy === "cost-cap"}
            onClick={() => setBidStrategy("cost-cap")}
            label="Cost per result goal"
            sub="Set a target CPL"
          />
        </div>
      </Labeled>

      {campaign.status === "live" && (
        <div
          className="mt-3 rounded-[8px] p-2.5 text-[11.5px] text-text-secondary leading-[1.5]"
          style={{ background: "var(--info-bg)", border: "1px solid var(--info-fg)" }}
        >
          <strong>Live campaign.</strong> Changes here stage as proposed edits and
          deploy on the next sync.
        </div>
      )}
    </div>
  );
}

function BidTile({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left p-3 rounded-[8px] transition-colors"
      style={{
        background: active ? "#1A1A1A" : "#FFF",
        color: active ? "#FFF" : "var(--text-1)",
        border: `1px solid ${active ? "#1A1A1A" : "var(--border)"}`,
      }}
    >
      <div className="text-[12.5px] font-semibold mb-0.5">{label}</div>
      <div
        className="text-[10.5px]"
        style={{ color: active ? "rgba(255,255,255,0.7)" : "var(--text-tertiary)" }}
      >
        {sub}
      </div>
    </button>
  );
}

// ─── Ad sets section ────────────────────────────────────────────────────

function CampaignAdSetsSection({
  projectId,
  campaign,
}: {
  projectId: string;
  campaign: MediaRow;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(
    campaign.adSets[0]?.id ?? null,
  );

  const addAdSet = () => {
    mutateRuntimeProject(projectId, (p) => {
      const c = p.mediaPlan.rows.find((r) => r.id === campaign.id);
      if (!c) return;
      const id = `as-${Date.now().toString(36)}`;
      c.adSets.push({
        id,
        name: `New ad set ${c.adSets.length + 1}`,
        audience: "Custom audience",
        optimization: "Leads",
        budgetDaily: Math.round(c.budgetDaily / Math.max(1, c.adSets.length + 1)),
        expLeads: 0,
        expVerified: 0,
        cpvl: null,
        status: "draft",
        spotChange: null,
        ads: [],
      });
    });
    // expand the newly added one on next render
  };

  return (
    <div className="card-base p-4">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel
          title={`Ad sets · ${campaign.adSets.length}`}
          sub="Per-persona / per-audience targeting"
          inline
        />
        <button
          type="button"
          onClick={addAdSet}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-button border border-border bg-white text-[11.5px] hover:border-border-hover"
        >
          <Plus size={11} /> Add ad set
        </button>
      </div>

      {campaign.adSets.length === 0 ? (
        <div
          className="rounded-[8px] py-5 text-center text-[12px] text-text-tertiary"
          style={{ background: "var(--bg-page)", border: "1px dashed var(--border)" }}
        >
          No ad sets yet. Add one to target a specific persona or audience.
        </div>
      ) : (
        <div className="space-y-2">
          {campaign.adSets.map((adSet) => (
            <AdSetCard
              key={adSet.id}
              projectId={projectId}
              campaignId={campaign.id}
              adSet={adSet}
              expanded={expandedId === adSet.id}
              onToggle={() =>
                setExpandedId((cur) => (cur === adSet.id ? null : adSet.id))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AdSetCard({
  projectId,
  campaignId,
  adSet,
  expanded,
  onToggle,
}: {
  projectId: string;
  campaignId: string;
  adSet: MediaAdSet;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [age, setAge] = useState<[number, number]>([28, 46]);
  const [gender, setGender] = useState<"all" | "male" | "female">("all");

  const removeAdSet = (e: React.MouseEvent) => {
    e.stopPropagation();
    mutateRuntimeProject(projectId, (p) => {
      const c = p.mediaPlan.rows.find((r) => r.id === campaignId);
      if (!c) return;
      c.adSets = c.adSets.filter((a) => a.id !== adSet.id);
    });
  };

  const updateAdSetName = (next: string) => {
    mutateRuntimeProject(projectId, (p) => {
      const c = p.mediaPlan.rows.find((r) => r.id === campaignId);
      const a = c?.adSets.find((x) => x.id === adSet.id);
      if (a) a.name = next;
    });
  };

  const updateAdSetBudget = (next: number) => {
    mutateRuntimeProject(projectId, (p) => {
      const c = p.mediaPlan.rows.find((r) => r.id === campaignId);
      const a = c?.adSets.find((x) => x.id === adSet.id);
      if (a) a.budgetDaily = Math.max(0, Math.round(next));
    });
  };

  return (
    <div
      className="rounded-[10px]"
      style={{
        background: "#FFF",
        border: `1.5px solid ${expanded ? "#1A1A1A" : "var(--border-subtle)"}`,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left"
      >
        <ChevronRight
          size={14}
          className="text-text-tertiary flex-shrink-0"
          style={{
            transform: expanded ? "rotate(90deg)" : "rotate(0)",
            transition: "transform 160ms",
          }}
        />
        <div className="flex-1 min-w-0">
          <input
            type="text"
            defaultValue={adSet.name}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => updateAdSetName(e.target.value)}
            className="w-full outline-none border-none bg-transparent text-[12.5px] font-semibold leading-tight"
          />
          <div className="text-[10.5px] text-text-tertiary mt-0.5">
            {adSet.audience} · ₹{adSet.budgetDaily.toLocaleString()}/day · {adSet.ads.length}{" "}
            ad{adSet.ads.length === 1 ? "" : "s"}
          </div>
        </div>
        <span
          className={`pill ${
            adSet.status === "live" ? "pill-ok" : adSet.status === "paused" ? "pill-warn" : ""
          }`}
          style={{
            fontSize: 9.5,
            background:
              adSet.status === "draft" ? "var(--bg-secondary)" : undefined,
            color: adSet.status === "draft" ? "var(--text-2)" : undefined,
          }}
        >
          {adSet.status}
        </span>
        <button
          type="button"
          onClick={removeAdSet}
          className="inline-flex items-center justify-center h-6 w-6 rounded-button text-text-tertiary hover:text-text-secondary"
          title="Delete ad set"
        >
          <Trash2 size={12} />
        </button>
      </button>

      {expanded && (
        <div
          className="px-3.5 pt-1 pb-3.5"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Labeled label="Audience">
              <input
                type="text"
                defaultValue={adSet.audience}
                className="w-full outline-none rounded-[8px] border border-border px-3 py-2 text-[12.5px]"
              />
            </Labeled>
            <Labeled label="Daily budget (₹)">
              <input
                type="number"
                defaultValue={adSet.budgetDaily}
                onBlur={(e) => updateAdSetBudget(Number(e.target.value))}
                className="w-full outline-none rounded-[8px] border border-border px-3 py-2 text-[12.5px] tabular-nums"
              />
            </Labeled>
          </div>

          {/* Locations summary (placeholder map slot) */}
          <Labeled label="Locations">
            <div
              className="rounded-[8px] p-3 flex items-center gap-3"
              style={{ border: "1px solid var(--border)", background: "var(--bg-page)" }}
            >
              <MapPin size={14} className="text-text-tertiary flex-shrink-0" />
              <div className="flex-1 text-[12px] text-text-secondary">
                Bangalore +5 km · Marathahalli +2 km
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 h-6 px-2 rounded text-[11px] border border-border bg-white"
              >
                Edit
              </button>
            </div>
          </Labeled>

          {/* Age + gender */}
          <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Labeled label="Age range">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={age[0]}
                  onChange={(e) => setAge([Number(e.target.value), age[1]])}
                  className="w-20 outline-none rounded-[8px] border border-border px-2.5 py-2 text-[12.5px] tabular-nums"
                />
                <span className="text-text-tertiary">to</span>
                <input
                  type="number"
                  value={age[1]}
                  onChange={(e) => setAge([age[0], Number(e.target.value)])}
                  className="w-20 outline-none rounded-[8px] border border-border px-2.5 py-2 text-[12.5px] tabular-nums"
                />
              </div>
            </Labeled>
            <Labeled label="Gender">
              <SegmentedControl
                value={gender}
                options={[
                  { value: "all", label: "All" },
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
                onChange={(v) => setGender(v as typeof gender)}
              />
            </Labeled>
          </div>

          {/* Detailed targeting (chips) */}
          <Labeled label="Detailed targeting">
            <div className="flex flex-wrap gap-1.5">
              {["Real estate investing", "Wealth management", "First-time buyer", "Interior design"].map(
                (t) => (
                  <span
                    key={t}
                    className="pill"
                    style={{
                      fontSize: 11,
                      background: "var(--bg-secondary)",
                      color: "var(--text-1)",
                    }}
                  >
                    {t}
                  </span>
                ),
              )}
              <button
                type="button"
                className="inline-flex items-center gap-1 h-6 px-2 rounded text-[10.5px] border border-dashed border-border bg-white text-text-secondary"
              >
                <Plus size={10} /> Browse interests & behaviors
              </button>
            </div>
          </Labeled>

          {/* Placements summary */}
          <Labeled label="Placements">
            <div
              className="rounded-[8px] p-2.5"
              style={{ background: "var(--bg-page)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="text-[11.5px] text-text-secondary leading-[1.5]">
                <span className="font-medium">Meta:</span> Feed · Stories · Reels · Video feeds.{" "}
                <span className="font-medium ml-2">Instagram:</span> Feed · Reels · Stories · Explore.
              </div>
            </div>
          </Labeled>

          {/* Advanced config — inline expansion */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] text-text-secondary hover:text-text-primary"
          >
            <Settings size={11} />
            {showAdvanced ? "Hide advanced config" : "Advanced config"}
            <ChevronDown
              size={11}
              style={{
                transform: showAdvanced ? "rotate(180deg)" : "rotate(0)",
                transition: "transform 160ms",
              }}
            />
          </button>

          {showAdvanced && (
            <div
              className="mt-2 rounded-[8px] p-3"
              style={{
                background: "var(--bg-page)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <Labeled label="Start time">
                  <input
                    type="datetime-local"
                    className="w-full outline-none rounded-[8px] border border-border px-2.5 py-1.5 text-[12px]"
                  />
                </Labeled>
                <Labeled label="End time (optional)">
                  <input
                    type="datetime-local"
                    className="w-full outline-none rounded-[8px] border border-border px-2.5 py-1.5 text-[12px]"
                  />
                </Labeled>
              </div>
              <div className="grid gap-3 mt-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <Labeled label="Attribution window">
                  <SegmentedControl
                    value="7d"
                    options={[
                      { value: "1d", label: "1d" },
                      { value: "7d", label: "7d" },
                      { value: "28d", label: "28d" },
                    ]}
                    onChange={() => {}}
                  />
                </Labeled>
                <Labeled label="Event">
                  <SegmentedControl
                    value="click"
                    options={[
                      { value: "click", label: "Click through" },
                      { value: "view", label: "View through" },
                    ]}
                    onChange={() => {}}
                  />
                </Labeled>
              </div>
              <div className="grid gap-3 mt-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <Labeled label="Max impressions per person">
                  <input
                    type="number"
                    defaultValue={3}
                    className="w-full outline-none rounded-[8px] border border-border px-2.5 py-1.5 text-[12px] tabular-nums"
                  />
                </Labeled>
                <Labeled label="Per interval (days)">
                  <input
                    type="number"
                    defaultValue={7}
                    className="w-full outline-none rounded-[8px] border border-border px-2.5 py-1.5 text-[12px] tabular-nums"
                  />
                </Labeled>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Ads section ────────────────────────────────────────────────────────

function CampaignAdsSection({ campaign }: { campaign: MediaRow }) {
  const allAds: { adSetName: string; ad: MediaAd }[] = campaign.adSets.flatMap((s) =>
    s.ads.map((ad) => ({ adSetName: s.name, ad })),
  );

  return (
    <div className="card-base p-4">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel
          title={`Ads · ${allAds.length}`}
          sub="Creative assets attached to each ad set"
          inline
        />
        <div className="text-[11px] text-text-tertiary inline-flex items-center gap-1.5">
          <Sparkles size={11} style={{ color: "#7C3AED" }} /> Ads draft from the
          Personas tab; they attach here once approved.
        </div>
      </div>

      {allAds.length === 0 ? (
        <div
          className="rounded-[8px] py-5 text-center text-[12px] text-text-tertiary"
          style={{ background: "var(--bg-page)", border: "1px dashed var(--border)" }}
        >
          No ads attached. Draft creative concepts on the Personas tab and assign
          them here.
        </div>
      ) : (
        <div className="space-y-1.5">
          {allAds.map(({ adSetName, ad }) => (
            <div
              key={ad.id}
              className="flex items-center gap-3 px-3 py-2 rounded-[6px]"
              style={{
                background: ad.tag === "winner" ? "#F0FDF4" : "#FFF",
                border: `1px solid ${ad.tag === "winner" ? "#BBF7D0" : "var(--border-subtle)"}`,
              }}
            >
              <Layers size={13} className="text-text-tertiary" />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium truncate">{ad.name}</div>
                <div className="text-[10.5px] text-text-tertiary">
                  {adSetName} · {ad.status}
                </div>
              </div>
              {ad.spend != null && (
                <div className="text-[10.5px] text-text-tertiary tabular-nums">
                  ₹{(ad.spend / 1000).toFixed(1)}K · {ad.leads} leads
                </div>
              )}
              {ad.tag === "winner" && (
                <span
                  className="text-white uppercase"
                  style={{
                    background: "linear-gradient(135deg, #15803D 0%, #22C55E 100%)",
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    letterSpacing: 0.3,
                  }}
                >
                  Winner
                </span>
              )}
              <button
                type="button"
                className="inline-flex items-center justify-center h-6 w-6 rounded-button text-text-tertiary hover:text-text-secondary"
              >
                <Copy size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tiny primitives ────────────────────────────────────────────────────

function SectionLabel({
  title,
  sub,
  inline,
}: {
  title: string;
  sub?: string;
  inline?: boolean;
}) {
  return (
    <div className={inline ? "flex items-center gap-2" : "mb-3"}>
      <div className="text-[13px] font-semibold leading-tight">{title}</div>
      {sub && (
        <div
          className={`text-[11px] text-text-tertiary ${inline ? "" : "mt-0.5"}`}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-2 first:mt-0">
      <div
        className="uplabel mb-1.5"
        style={{ fontSize: 9.5, color: "var(--text-tertiary)", letterSpacing: "0.4px" }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-[8px] overflow-hidden"
      style={{ border: "1px solid var(--border)", background: "#FFF" }}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="h-8 px-3 text-[11.5px] font-medium transition-colors"
            style={{
              background: active ? "#1A1A1A" : "transparent",
              color: active ? "#FFF" : "var(--text-2)",
              borderLeft: i > 0 ? "1px solid var(--border)" : "none",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// Exported play icon already exists, just re-export under shorthand for
// shells that want to launch from here. (Currently the launch action lives
// on the campaign list row; left as a utility.)
export { Play as LaunchIcon };
