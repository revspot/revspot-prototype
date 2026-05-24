"use client";

import { useRef, useState } from "react";
import { Check, RefreshCw, Sparkles, ChevronDown, Plus } from "lucide-react";
import type { Persona } from "@/lib/project-data";
import { SpotMark } from "@/components/spot/spot-mark";
import { RichText } from "@/components/spot/rich-text";
import { AngleCard } from "./angle-card";
import { InlineSpotComposer, type StreamItem } from "./inline-spot-composer";
import { mutateRuntimeProject } from "@/lib/project-data";

const MAX_ANGLES_VISIBLE = 3;

function PersonaAvatar({ id }: { id: string }) {
  const hue = (id.split("").reduce((s, c) => s + c.charCodeAt(0), 0) * 47) % 360;
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 8,
        background: `linear-gradient(135deg, oklch(0.88 0.06 ${hue}) 0%, oklch(0.72 0.09 ${(hue + 50) % 360}) 100%)`,
        position: "relative",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 38 38" width={38} height={38} style={{ position: "absolute", inset: 0 }}>
        <circle cx="19" cy="14" r="4.5" fill="rgba(0,0,0,0.35)" />
        <path d="M9 32c0-6 5-9 10-9s10 3 10 9z" fill="rgba(0,0,0,0.35)" />
      </svg>
    </div>
  );
}

function PersonaField({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warn" | "ok" | "neutral";
}) {
  const dot =
    tone === "warn" ? "#DC2626" : tone === "ok" ? "#15803D" : "#9B9B9B";
  return (
    <div className="px-4 py-3 border-r border-border-subtle last:border-r-0">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
        <span className="uplabel" style={{ fontSize: 10 }}>
          {label}
        </span>
      </div>
      <div className="text-[12.5px] leading-[1.45]">{value}</div>
    </div>
  );
}

// Possible angle names Spot pretends to draft when the user starts an
// inline angle-with-Spot composer. Picked deterministically so the
// streaming log reads like real work.
const SAMPLE_ANGLE_TEMPLATES = [
  {
    name: "Lifestyle Upgrade",
    hook: "Branded interiors that grow with your family",
    cta: "Book a 15-min tour",
  },
  {
    name: "School-Zone Story",
    hook: "Top-rated schools, 8 minutes door-to-door",
    cta: "See site & schools",
  },
  {
    name: "Future-Proof Investment",
    hook: "Lowest density in micromarket · resale guarantee",
    cta: "Get the pricing sheet",
  },
  {
    name: "Family Future",
    hook: "A home that holds three generations",
    cta: "Talk to a senior advisor",
  },
];

export function PersonaCard({
  persona,
  projectId,
  onAsk,
  onDraftCreatives,
}: {
  persona: Persona;
  projectId: string;
  onAsk: (q: string) => void;
  /**
   * Inline-trigger to draft creative concepts for a specific angle. Called
   * by the AngleCard's "Draft concepts with Spot" affordance.
   */
  onDraftCreatives?: (angleId: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);

  // Inline "+ Add angle with Spot" composer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [streamItems, setStreamItems] = useState<StreamItem[] | null>(null);
  /**
   * Set when streaming starts; called once per stream-item completing so
   * the angle persists at the right moment (i.e., when the angle's header
   * line ticks done, not when one of its concept sub-lines does).
   */
  const persistOnStream = useRef<((i: number) => void) | null>(null);

  const visibleAngles = showAll ? persona.angles : persona.angles.slice(0, MAX_ANGLES_VISIBLE);
  const hiddenCount = persona.angles.length - visibleAngles.length;
  const liveCount = persona.angles.filter((a) => a.status === "live").length;
  const creativesCount = persona.angles.reduce(
    (s, a) => s + a.concept.creatives.length,
    0,
  );

  const startAngleDraft = (userPrompt: string) => {
    // Pick angle templates Spot will pretend to draft. If the user typed
    // a prompt, we stream two angles seeded from it; if they hit "Just
    // draft 2", we pick the first two unused templates.
    const usedNames = new Set(persona.angles.map((a) => a.name));
    const fresh = SAMPLE_ANGLE_TEMPLATES.filter((t) => !usedNames.has(t.name));
    const picks = (
      userPrompt
        ? [
            {
              name: userPrompt.length > 40 ? userPrompt.slice(0, 40) + "…" : userPrompt,
              hook: userPrompt,
              cta: "Book a 15-min tour",
            },
            fresh[0] ?? SAMPLE_ANGLE_TEMPLATES[0],
          ]
        : fresh.slice(0, 2)
    ).filter(Boolean);

    const items: StreamItem[] = [];
    picks.forEach((p, i) => {
      items.push({ id: `a${i}`, label: p.name, indent: 0 });
      items.push({
        id: `a${i}-static`,
        label: "Static concept · 3 sizes",
        sub: "1:1 · 4:5 · 9:16",
        indent: 1,
      });
      items.push({
        id: `a${i}-video`,
        label: "Video concept · 2 sizes",
        sub: "9:16 reel · 1:1 feed",
        indent: 1,
      });
    });

    setStreamItems(items);

    // Each angle generates 3 stream items (angle header → static → video).
    // Persist on the *video* line — last of the three — so the angle lands
    // with both concepts already seeded. That matches what the log just
    // claimed to draft.
    persistOnStream.current = (i) => {
      const angleIdx = Math.floor(i / 3);
      const isVideoLine = i % 3 === 2;
      if (!isVideoLine || !picks[angleIdx]) return;
      const tpl = picks[angleIdx]!;
      mutateRuntimeProject(projectId, (p) => {
        const persona2 = p.personas.find((pp) => pp.id === persona.id);
        if (!persona2) return;
        const angleSlug = tpl.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 24);
        const angleId = `${persona.id}-${angleSlug}-${Date.now().toString(36)}`;
        const hue = Math.floor(Math.random() * 360);
        // Seed sized creatives for both concepts so the new angle is
        // immediately useful when the user expands it.
        const staticSizes: Array<{
          id: string;
          format: "1:1" | "4:5" | "9:16";
          surface: string;
        }> = [
          { id: `${angleId}-s11`, format: "1:1", surface: "Meta Feed" },
          { id: `${angleId}-s45`, format: "4:5", surface: "Meta Feed" },
          { id: `${angleId}-s916`, format: "9:16", surface: "Meta Stories" },
        ];
        const videoSizes: Array<{
          id: string;
          format: "9:16" | "1:1";
          surface: string;
        }> = [
          { id: `${angleId}-v916`, format: "9:16", surface: "Meta Reels" },
          { id: `${angleId}-v11`, format: "1:1", surface: "Meta Feed" },
        ];
        persona2.angles.push({
          id: angleId,
          name: tpl.name,
          status: "draft",
          hook: tpl.hook,
          cta: tpl.cta,
          concept: {
            hue,
            layout: "hero",
            creatives: [
              ...staticSizes.map((s) => ({
                id: s.id,
                format: s.format,
                surface: s.surface,
                platform: "Meta" as const,
                kind: "image" as const,
                spend: null,
                impressions: null,
                leads: null,
                verified: null,
                qualified: null,
                ctr: null,
                cvr: null,
                cpl: null,
                cpvl: null,
                cpql: null,
              })),
              ...videoSizes.map((s) => ({
                id: s.id,
                format: s.format,
                surface: s.surface,
                platform: "Meta" as const,
                kind: "video" as const,
                spend: null,
                impressions: null,
                leads: null,
                verified: null,
                qualified: null,
                ctr: null,
                cvr: null,
                cpl: null,
                cpvl: null,
                cpql: null,
              })),
            ],
          },
        });
      });
    };
  };

  const handleItemComplete = (i: number) => {
    persistOnStream.current?.(i);
  };

  const closeComposer = () => {
    setComposerOpen(false);
    setStreamItems(null);
  };

  return (
    <div
      className="card-base"
      style={{
        borderColor: persona.draft ? "#C9A86A" : undefined,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3.5 px-5 py-4">
        <PersonaAvatar id={persona.id} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[16px] font-semibold leading-tight">{persona.name}</h3>
            <span className="text-[12.5px] text-text-secondary">, {persona.age}</span>
            {persona.draft ? (
              <span
                className="pill"
                style={{ background: "#FFF8E1", color: "#8A6300", fontSize: 10.5 }}
              >
                Draft persona
              </span>
            ) : (
              <span className="pill pill-ok" style={{ fontSize: 10.5 }}>
                <Check size={10} /> Approved
              </span>
            )}
          </div>
          <div className="text-[12px] text-text-tertiary mt-0.5">{persona.role}</div>
        </div>
        {!persona.draft && (
          <div className="text-right flex-shrink-0">
            <div className="text-[13px] tabular-nums font-semibold">
              {persona.verifiedLeads} verified
            </div>
            <div className="text-[11px] text-text-tertiary tabular-nums">
              CPVL {persona.cpvl} · {persona.share}% mix
            </div>
          </div>
        )}
      </div>

      {/* Want / Pain / USP triplet */}
      <div className="grid border-t border-border-subtle" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <PersonaField label="Want" value={persona.want} />
        <PersonaField label="Pain point" value={persona.painPoint} tone="warn" />
        <PersonaField label="USP that resonates" value={persona.usp} tone="ok" />
      </div>

      {persona.spotNote && (
        <div
          className="px-5 py-3 flex items-start gap-2"
          style={{
            background: "var(--spot-tint)",
            borderTop: "1px solid var(--spot-stroke)",
            borderBottom: "1px solid var(--spot-stroke)",
          }}
        >
          <SpotMark size={14} />
          <div className="text-[11.5px] leading-[1.5] italic text-text-secondary">
            <RichText text={persona.spotNote} />
          </div>
        </div>
      )}

      {/* Angles & creatives */}
      <div className="px-5 py-4 bg-surface-page border-t border-border-subtle">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={12} style={{ color: "#7C3AED" }} />
          <span className="uplabel" style={{ fontSize: 10 }}>
            Angles · {persona.angles.length} · {liveCount} live · {creativesCount} creatives
          </span>
          <span className="text-[10.5px] text-text-tertiary italic ml-1">
            Pain + USP stay fixed · Hook · CTA · concept change per test
          </span>
        </div>

        <div className="space-y-2.5">
          {visibleAngles.map((angle) => (
            <AngleCard
              key={angle.id}
              angle={angle}
              persona={persona}
              projectId={projectId}
              onAsk={onAsk}
              onDraftCreatives={onDraftCreatives}
            />
          ))}
        </div>

        {/* Inline composer for new angle */}
        {composerOpen && (
          <div className="mt-3">
            <InlineSpotComposer
              prompt={`Draft new angles for ${persona.name}`}
              placeholder="Describe an angle in a sentence (e.g. 'NRI second home buyers comparing rental yield')…"
              primaryLabel="Draft from prompt"
              secondaryLabel="Just draft 2"
              onStart={(userPrompt) => startAngleDraft(userPrompt)}
              onCancel={closeComposer}
              streamItems={streamItems ?? undefined}
              streamHeader={`Drafting angles for ${persona.name}`}
              onItemComplete={handleItemComplete}
              onDone={closeComposer}
            />
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          {hiddenCount > 0 ? (
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-1 text-[11.5px] text-text-secondary hover:text-text-primary"
              type="button"
            >
              <ChevronDown size={12} /> Show {hiddenCount} more
            </button>
          ) : (
            <span />
          )}
          {!composerOpen && (
            <button
              onClick={() => setComposerOpen(true)}
              className="apply-btn"
              style={{
                height: 26,
                fontSize: 11,
                background: "linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)",
              }}
              type="button"
            >
              <Plus size={11} /> Add angle with Spot
            </button>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border-subtle">
        <div className="flex gap-1.5">
          <button
            onClick={() => onAsk(`Edit persona: ${persona.name}`)}
            type="button"
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-button border border-border bg-white hover:border-border-hover hover:bg-surface-page text-[11.5px]"
          >
            <SpotMark size={11} /> Edit with Spot
          </button>
          <button
            onClick={() => onAsk(`Refresh ${persona.name} from latest leads`)}
            type="button"
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-button border border-border bg-white hover:border-border-hover hover:bg-surface-page text-[11.5px]"
          >
            <RefreshCw size={11} /> Refresh
          </button>
        </div>
        {persona.draft && (
          <button
            onClick={() => onAsk(`Approve persona ${persona.name}`)}
            type="button"
            className="apply-btn"
          >
            <Check size={11} /> Approve &amp; pilot
          </button>
        )}
      </div>
    </div>
  );
}
