"use client";

import { useState } from "react";
import { MoreHorizontal, Sparkles, RefreshCw, Play, ChevronRight, Plus, Video, Image as ImageIcon, Star } from "lucide-react";
import type { Angle, Persona, Creative } from "@/lib/project-data";
import { useSpotStore } from "@/lib/spot/store";
import {
  getConcepts,
  pickHeadlineSize,
  conceptHasWinner,
  conceptAggregateCpvl,
  type DerivedConcept,
} from "./persona-hierarchy";

/**
 * Angle card — second level in the Personas hierarchy:
 *   Persona → Angle → Concept (static OR video) → Size (per-format creative)
 *
 * The card surfaces every concept this angle has as a thumbnail tile;
 * clicking a tile expands its sizes inline with per-size metrics. Statics
 * surface CTR/CVR/CPVL; videos surface FFR/Hook/Hold rates.
 */

function ConceptThumb({
  hue,
  layout,
  kind,
}: {
  hue: number;
  layout: Angle["concept"]["layout"];
  kind: "static" | "video";
}) {
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 7,
        background: `repeating-linear-gradient(135deg, oklch(0.92 0.05 ${hue}) 0px 5px, oklch(0.82 0.07 ${(hue + 25) % 360}) 5px 10px)`,
        position: "relative",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {layout === "type-led" && (
        <div
          style={{
            position: "absolute",
            inset: "30% 22%",
            background: "#0A0A0A",
            borderRadius: 3,
          }}
        />
      )}
      {layout === "split" && (
        <div
          style={{
            position: "absolute",
            inset: "55% 0 0 0",
            background: "rgba(0,0,0,0.18)",
          }}
        />
      )}
      {layout === "floorplan" && (
        <div
          style={{
            position: "absolute",
            inset: 6,
            border: "1.5px solid rgba(0,0,0,0.45)",
            borderRadius: 3,
          }}
        />
      )}
      {kind === "video" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "6px solid transparent",
              borderBottom: "6px solid transparent",
              borderLeft: "9px solid #FFF",
              filter: "drop-shadow(0 0 3px rgba(0,0,0,0.55))",
            }}
          />
        </div>
      )}
    </div>
  );
}

function ConceptKindBadge({ kind }: { kind: "static" | "video" }) {
  const cfg =
    kind === "video"
      ? { bg: "#F4ECFF", fg: "#7C3AED", Icon: Video, label: "Video" }
      : { bg: "var(--bg-secondary)", fg: "var(--text-2)", Icon: ImageIcon, label: "Static" };
  const I = cfg.Icon;
  return (
    <span
      className="inline-flex items-center gap-1"
      style={{
        background: cfg.bg,
        color: cfg.fg,
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 6px",
        borderRadius: 4,
        letterSpacing: "0.3px",
        textTransform: "uppercase",
      }}
    >
      <I size={9} /> {cfg.label}
    </span>
  );
}

function MetricCell({
  label,
  value,
  good,
  fair,
  unit,
}: {
  label: string;
  value: number | null | undefined;
  good?: number;
  fair?: number;
  unit: "pct" | "currency" | "raw";
}) {
  const v = value;
  const formatted =
    v == null
      ? "—"
      : unit === "currency"
        ? `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v}`
        : unit === "pct"
          ? `${v.toFixed(label === "FFR" || label === "HOOK" || label === "HOLD" ? 0 : 1)}%`
          : `${v.toFixed(1)}`;
  const color =
    v == null || good == null
      ? "var(--text-1)"
      : v >= good
        ? "var(--ok-fg)"
        : fair != null && v >= fair
          ? "var(--text-1)"
          : "var(--err-fg)";
  return (
    <div className="text-center min-w-[44px]">
      <div className="uplabel" style={{ fontSize: 9 }}>
        {label}
      </div>
      <div className="tabular-nums" style={{ fontSize: 11.5, fontWeight: 600, color }}>
        {formatted}
      </div>
    </div>
  );
}

function SizeRow({ c, kind }: { c: Creative; kind: "static" | "video" }) {
  const draft = c.spend == null;
  const winnerBg =
    c.tag === "winner"
      ? "linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 60%)"
      : c.tag === "loser"
        ? "linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 60%)"
        : "#FFF";
  const winnerBorder =
    c.tag === "winner" ? "#BBF7D0" : c.tag === "loser" ? "#FECACA" : "var(--border-subtle)";
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-[6px] border"
      style={{ background: winnerBg, borderColor: winnerBorder }}
    >
      <div style={{ width: 86, flexShrink: 0 }}>
        <div className="text-[12px] font-semibold leading-tight">{c.format}</div>
        <div className="text-[10px] text-text-tertiary">{c.surface}</div>
      </div>
      {draft ? (
        <div className="flex-1 text-[11px] text-text-tertiary italic">
          Pending data · drafted, not yet launched
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-3">
          {kind === "video" ? (
            <>
              <MetricCell label="FFR" value={c.firstFrameRetention} good={70} fair={50} unit="pct" />
              <MetricCell label="HOOK" value={c.hookRate} good={40} fair={25} unit="pct" />
              <MetricCell label="HOLD" value={c.holdRate} good={25} fair={15} unit="pct" />
              <span className="h-4 w-px bg-border-subtle" />
            </>
          ) : null}
          <MetricCell label="CTR" value={c.ctr} good={1.5} fair={1.0} unit="pct" />
          <MetricCell label="CVR" value={c.cvr} good={20} fair={10} unit="pct" />
          <MetricCell label="CPL" value={c.cpl} unit="currency" />
          <MetricCell label="CPVL" value={c.cpvl} unit="currency" />
          {kind === "static" && <MetricCell label="CPQL" value={c.cpql} unit="currency" />}
        </div>
      )}
      {c.tag === "winner" && (
        <span
          className="inline-flex items-center gap-1 text-white uppercase"
          style={{
            background: "linear-gradient(135deg, #15803D 0%, #22C55E 100%)",
            fontSize: 9.5,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 4,
            letterSpacing: 0.4,
          }}
        >
          <Star size={8} strokeWidth={3} /> Winner
        </span>
      )}
      {c.tag === "loser" && (
        <span
          className="pill pill-err uppercase"
          style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4 }}
        >
          Loser
        </span>
      )}
      <button type="button" className="text-text-tertiary hover:text-text-primary p-1">
        <MoreHorizontal size={13} />
      </button>
    </div>
  );
}

function ConceptCard({
  concept,
  expanded,
  onToggle,
}: {
  concept: DerivedConcept;
  expanded: boolean;
  onToggle: () => void;
}) {
  const headline = pickHeadlineSize(concept);
  const winner = conceptHasWinner(concept);
  const cpvl = conceptAggregateCpvl(concept);

  return (
    <div
      className="rounded-[10px] overflow-hidden transition-shadow"
      style={{
        background: "#FFF",
        border: `1.5px solid ${expanded ? "#1A1A1A" : winner ? "#BBF7D0" : "var(--border-subtle)"}`,
        boxShadow: expanded ? "0 6px 18px rgba(0,0,0,0.06)" : "none",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
      >
        <ConceptThumb hue={concept.hue} layout={concept.layout} kind={concept.kind} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12.5px] font-semibold leading-tight truncate">
              {concept.name}
            </span>
            <ConceptKindBadge kind={concept.kind} />
            {winner && (
              <span
                className="inline-flex items-center gap-0.5 text-white"
                style={{
                  background: "linear-gradient(135deg, #15803D 0%, #22C55E 100%)",
                  fontSize: 9.5,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 4,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                <Star size={8} strokeWidth={3} /> Winner
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10.5px] text-text-tertiary">
            <span className="tabular-nums">
              {concept.sizes.length} size{concept.sizes.length === 1 ? "" : "s"}
            </span>
            {headline && headline.spend != null && cpvl != null && (
              <>
                <span>·</span>
                <span className="tabular-nums">CPVL ₹{cpvl.toLocaleString()}</span>
              </>
            )}
            {concept.kind === "video" && headline?.hookRate != null && (
              <>
                <span>·</span>
                <span className="tabular-nums">
                  hook {Math.round(headline.hookRate)}%
                </span>
              </>
            )}
            {concept.kind === "video" && headline?.firstFrameRetention != null && (
              <>
                <span>·</span>
                <span className="tabular-nums">
                  ffr {Math.round(headline.firstFrameRetention)}%
                </span>
              </>
            )}
          </div>
        </div>
        <ChevronRight
          size={14}
          className="text-text-tertiary flex-shrink-0"
          style={{
            transform: expanded ? "rotate(90deg)" : "rotate(0)",
            transition: "transform 160ms",
          }}
        />
      </button>

      {expanded && (
        <div
          className="px-3 pt-1 pb-3 space-y-1.5"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <div className="text-[10.5px] text-text-tertiary py-1.5">
            {concept.kind === "video"
              ? "Sizes share the same edit. Video metrics: FFR (frame-1 retention) → Hook (3s) → Hold (full)."
              : "Sizes share the same creative. Static metrics: CTR / CVR / CPVL."}
          </div>
          {concept.sizes.map((c) => (
            <SizeRow key={c.id} c={c} kind={concept.kind} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AngleCard({
  angle,
  persona,
  projectId,
  onAsk,
  onDraftCreatives,
}: {
  angle: Angle;
  persona: Persona;
  projectId: string;
  onAsk: (q: string) => void;
  /** Inline draft-creatives composer trigger — no modal. */
  onDraftCreatives?: (angleId: string) => void;
}) {
  const openGuided = useSpotStore((s) => s.openGuided);
  const concepts = getConcepts(angle);

  const [expandedConcept, setExpandedConcept] = useState<string | null>(() => {
    // Auto-expand the concept that has a winner so users land on data.
    const winnerConcept = concepts.find((c) => conceptHasWinner(c));
    return winnerConcept?.id ?? null;
  });

  const liveCreatives = angle.concept.creatives.filter((c) => c.spend != null);
  const totalSpend = liveCreatives.reduce((s, c) => s + (c.spend || 0), 0);
  const totalVerified = liveCreatives.reduce((s, c) => s + (c.verified || 0), 0);
  const aggCpvl = totalVerified ? Math.round(totalSpend / totalVerified) : null;

  return (
    <div className="card-base bg-white" style={{ overflow: "hidden" }}>
      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-border-subtle">
        <div className="flex items-center gap-2 mb-2">
          <span
            style={{
              background: "linear-gradient(135deg, #F4ECFF 0%, #FDF2FF 100%)",
              color: "#7C3AED",
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            {angle.name}
          </span>
          <span
            className={`pill ${angle.status === "live" ? "pill-ok" : "pill-warn"}`}
            style={{ fontSize: 10 }}
          >
            {angle.status === "live" ? "Live" : "Draft"}
          </span>
          {angle.status === "live" && (
            <span className="ml-auto text-[11px] tabular-nums text-text-secondary">
              ₹{(totalSpend / 1000).toFixed(0)}K spend · {totalVerified} verified
              {aggCpvl && ` · ₹${aggCpvl.toLocaleString()} CPVL`}
            </span>
          )}
        </div>
        <div
          className="grid gap-x-3 gap-y-1 text-[11.5px]"
          style={{ gridTemplateColumns: "auto 1fr auto 1fr" }}
        >
          <span className="uplabel" style={{ fontSize: 9.5 }}>
            Hook
          </span>
          <span className="text-text-primary">{angle.hook}</span>
          <span className="uplabel" style={{ fontSize: 9.5 }}>
            CTA
          </span>
          <span className="text-text-primary">{angle.cta}</span>
        </div>
      </div>

      {/* Concepts */}
      <div className="px-3.5 py-3">
        {concepts.length === 0 ? (
          <div className="flex items-center gap-3 py-1">
            <div className="text-[11.5px] text-text-tertiary italic flex-1">
              No concepts yet for this angle.
            </div>
            {onDraftCreatives && (
              <button
                type="button"
                onClick={() => onDraftCreatives(angle.id)}
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-button text-[11.5px] font-medium"
                style={{
                  background: "linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)",
                  color: "#FFF",
                }}
              >
                <Sparkles size={11} /> Draft concepts with Spot
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {concepts.map((c) => (
              <ConceptCard
                key={c.id}
                concept={c}
                expanded={expandedConcept === c.id}
                onToggle={() =>
                  setExpandedConcept((cur) => (cur === c.id ? null : c.id))
                }
              />
            ))}
            {onDraftCreatives && (
              <button
                type="button"
                onClick={() => onDraftCreatives(angle.id)}
                className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-[8px] text-[11.5px] text-text-secondary hover:text-text-primary"
                style={{
                  border: "1px dashed var(--border)",
                  background: "transparent",
                }}
              >
                <Plus size={11} /> Draft another concept with Spot
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3.5 py-2 border-t border-border-subtle bg-surface-page">
        <div className="flex gap-1.5">
          <button
            onClick={() => onAsk(`Edit angle "${angle.name}" for ${persona.name}`)}
            type="button"
            className="inline-flex items-center gap-1 h-6 px-2 rounded text-[10.5px] border border-border bg-white hover:border-border-hover"
          >
            <Sparkles size={10} /> Edit angle
          </button>
          <button
            onClick={() => onAsk(`Regenerate concept for "${angle.name}"`)}
            type="button"
            className="inline-flex items-center gap-1 h-6 px-2 rounded text-[10.5px] border border-border bg-white hover:border-border-hover"
          >
            <RefreshCw size={10} /> Regenerate concept
          </button>
        </div>
        <button
          onClick={() =>
            openGuided({
              kind: "launch-creative",
              projectId,
              personaId: persona.id,
              angleId: angle.id,
            })
          }
          type="button"
          className="apply-btn"
          style={{ background: "linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)" }}
        >
          <Play size={10} /> Launch new creative
        </button>
      </div>
    </div>
  );
}
