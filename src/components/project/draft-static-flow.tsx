"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  X,
  Check,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import type { Angle, Creative, Persona } from "@/lib/project-data";
import { mutateRuntimeProject } from "@/lib/project-data";
import { SpotMark } from "@/components/spot/spot-mark";

/**
 * Inline three-step "Draft Static with Spot" flow. Sits below the angle
 * row that triggered it. No modal, no portal — keeps the user anchored
 * in the persona workspace.
 *
 * Step 1 — Pick a layout direction (Hero shot, Lifestyle split,
 *           Type-led, Floorplan) + optional free-text steer.
 * Step 2 — Stream per-size generation. Each size flips from a shimmer
 *           placeholder to a real (hue-gradient) thumbnail as Spot
 *           "finishes" rendering it.
 * Step 3 — Final preview + "Save to angle" CTA. Saving pushes three
 *           sized creatives into the angle's static concept.
 */

const LAYOUT_OPTIONS: Array<{
  key: Angle["concept"]["layout"];
  label: string;
  sub: string;
}> = [
  { key: "hero", label: "Hero shot", sub: "Single image, brand-led" },
  { key: "split", label: "Lifestyle split", sub: "Place + people, paired" },
  { key: "type-led", label: "Type-led", sub: "Bold copy, minimal visual" },
  { key: "floorplan", label: "Floorplan", sub: "Layout-forward proof" },
];

type GenStage =
  | { phase: "pick" }
  | {
      phase: "generating";
      layout: Angle["concept"]["layout"];
      prompt: string;
      sizesDone: number;
    }
  | {
      phase: "ready";
      layout: Angle["concept"]["layout"];
      prompt: string;
      drafts: Creative[];
    };

const SIZE_PLAN: Array<{
  format: Creative["format"];
  surface: string;
  delayMs: number;
}> = [
  { format: "1:1", surface: "Meta Feed", delayMs: 1100 },
  { format: "4:5", surface: "Meta Feed", delayMs: 1300 },
  { format: "9:16", surface: "Meta Stories", delayMs: 1200 },
];

export function DraftStaticFlow({
  projectId,
  persona,
  angle,
  onClose,
}: {
  projectId: string;
  persona: Persona;
  angle: Angle;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<GenStage>({ phase: "pick" });
  const [text, setText] = useState("");

  // Drive the per-size generation timing. When all sizes are done,
  // transition to the "ready" review stage.
  useEffect(() => {
    if (stage.phase !== "generating") return;
    if (stage.sizesDone >= SIZE_PLAN.length) {
      // Build the final draft set.
      const baseId = `${angle.id}-static-${Date.now().toString(36)}`;
      const drafts: Creative[] = SIZE_PLAN.map((plan, i) => {
        const id = `${baseId}-${i}`;
        const placeholderHue =
          (id.split("").reduce((s, c) => s + c.charCodeAt(0), 0) * 47) % 360;
        return {
          id,
          format: plan.format,
          surface: plan.surface,
          platform: "Meta",
          kind: "image",
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
          assetSource: "generated",
          placeholderHue,
        };
      });
      setStage({
        phase: "ready",
        layout: stage.layout,
        prompt: stage.prompt,
        drafts,
      });
      return;
    }
    const t = setTimeout(() => {
      setStage((cur) =>
        cur.phase === "generating"
          ? { ...cur, sizesDone: cur.sizesDone + 1 }
          : cur,
      );
    }, SIZE_PLAN[stage.sizesDone].delayMs);
    return () => clearTimeout(t);
  }, [stage, angle.id]);

  const startGenerate = (layout: Angle["concept"]["layout"]) => {
    setStage({
      phase: "generating",
      layout,
      prompt: text.trim(),
      sizesDone: 0,
    });
  };

  const save = () => {
    if (stage.phase !== "ready") return;
    mutateRuntimeProject(projectId, (p) => {
      const persona2 = p.personas.find((pp) => pp.id === persona.id);
      const a = persona2?.angles.find((aa) => aa.id === angle.id);
      if (!a) return;
      // Apply the chosen layout to the concept (so the canvas thumbnails
      // pick it up) and append the new sized creatives.
      a.concept.layout = stage.layout;
      a.concept.creatives.push(...stage.drafts);
      if (a.status === "draft" && a.concept.creatives.length > 0) {
        a.status = "live";
      }
    });
    onClose();
  };

  return (
    <div
      className="rounded-[12px] fadeUp"
      style={{
        background: "var(--spot-tint)",
        border: "1px solid var(--spot-stroke)",
        padding: 14,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-2.5 mb-3">
        <span
          className="inline-flex items-center justify-center flex-shrink-0"
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: "linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)",
            color: "#FFF",
          }}
        >
          <SpotMark size={13} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-semibold leading-tight">
            Draft static concept for {angle.name}
          </div>
          <div className="text-[10.5px] text-text-tertiary mt-0.5">
            {stage.phase === "pick"
              ? "Pick a layout direction · 3 sizes will be drafted (1:1, 4:5, 9:16)"
              : stage.phase === "generating"
                ? "Spot is rendering each size — hang on for ~4s"
                : "Review and save to add this concept to the angle"}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center h-6 w-6 rounded-button text-text-tertiary hover:text-text-secondary hover:bg-white"
          title="Cancel"
        >
          <X size={12} />
        </button>
      </div>

      {/* Body — varies by stage */}
      {stage.phase === "pick" && (
        <PickLayoutStep
          text={text}
          onTextChange={setText}
          onStart={startGenerate}
          onCancel={onClose}
        />
      )}
      {stage.phase === "generating" && (
        <GeneratingStep
          layout={stage.layout}
          sizesDone={stage.sizesDone}
          angle={angle}
        />
      )}
      {stage.phase === "ready" && (
        <ReadyStep
          drafts={stage.drafts}
          layout={stage.layout}
          angle={angle}
          persona={persona}
          onSave={save}
          onRedo={() => setStage({ phase: "pick" })}
        />
      )}
    </div>
  );
}

// ─── Step 1: layout picker ──────────────────────────────────────────────

function PickLayoutStep({
  text,
  onTextChange,
  onStart,
  onCancel,
}: {
  text: string;
  onTextChange: (v: string) => void;
  onStart: (layout: Angle["concept"]["layout"]) => void;
  onCancel: () => void;
}) {
  const [layout, setLayout] = useState<Angle["concept"]["layout"]>("hero");
  return (
    <div>
      <div className="uplabel mb-2" style={{ fontSize: 9.5 }}>
        1. Pick a layout
      </div>
      <div
        className="grid gap-2 mb-3"
        style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}
      >
        {LAYOUT_OPTIONS.map((opt) => {
          const active = layout === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setLayout(opt.key)}
              className="text-left p-2.5 rounded-[8px] transition-colors"
              style={{
                background: active ? "#1A1A1A" : "#FFF",
                color: active ? "#FFF" : "var(--text-1)",
                border: `1.5px solid ${active ? "#1A1A1A" : "var(--border)"}`,
              }}
            >
              <LayoutThumb layout={opt.key} active={active} />
              <div className="text-[11.5px] font-semibold leading-tight mt-2">
                {opt.label}
              </div>
              <div
                className="text-[10px] mt-0.5"
                style={{
                  color: active ? "rgba(255,255,255,0.7)" : "var(--text-tertiary)",
                }}
              >
                {opt.sub}
              </div>
            </button>
          );
        })}
      </div>

      <div className="uplabel mb-2" style={{ fontSize: 9.5 }}>
        2. Optional steer
      </div>
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        rows={2}
        placeholder="Anything specific? e.g. 'lead with the sky-clubhouse view at dusk'"
        className="w-full outline-none rounded-[8px] px-3 py-2 text-[12.5px] resize-y"
        style={{ border: "1px solid var(--border)", background: "#FFF" }}
      />

      <div className="flex items-center justify-between gap-2 mt-3">
        <span className="text-[10.5px] text-text-tertiary">
          Need video? Use <strong>Upload concept</strong> — Spot only generates static.
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center h-7 px-2.5 rounded-button border border-border bg-white text-[11.5px] text-text-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onStart(layout)}
            className="apply-btn"
            style={{
              background:
                "linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)",
              height: 28,
              fontSize: 12,
              padding: "0 12px",
            }}
          >
            <Sparkles size={11} /> Draft 3 sizes
          </button>
        </div>
      </div>
    </div>
  );
}

function LayoutThumb({
  layout,
  active,
}: {
  layout: Angle["concept"]["layout"];
  active: boolean;
}) {
  // Schematic representation of each layout so the user gets a tactile
  // sense of what they're picking.
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        borderRadius: 5,
        background: active
          ? "rgba(255,255,255,0.08)"
          : "var(--bg-page)",
        border: `1px solid ${active ? "rgba(255,255,255,0.2)" : "var(--border-subtle)"}`,
        position: "relative",
      }}
    >
      {layout === "hero" && (
        <div
          style={{
            position: "absolute",
            inset: "20% 18%",
            background: active ? "rgba(255,255,255,0.3)" : "var(--text-2)",
            opacity: 0.6,
            borderRadius: 3,
          }}
        />
      )}
      {layout === "split" && (
        <>
          <div
            style={{
              position: "absolute",
              top: "12%",
              left: "12%",
              right: "12%",
              height: "38%",
              background: active ? "rgba(255,255,255,0.35)" : "var(--text-2)",
              opacity: 0.55,
              borderRadius: 3,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "12%",
              left: "12%",
              right: "12%",
              height: "38%",
              background: active ? "rgba(255,255,255,0.2)" : "var(--text-2)",
              opacity: 0.35,
              borderRadius: 3,
            }}
          />
        </>
      )}
      {layout === "type-led" && (
        <div
          style={{
            position: "absolute",
            inset: "32% 18%",
            background: active ? "rgba(255,255,255,0.55)" : "var(--text-1)",
            opacity: 0.85,
            borderRadius: 2,
          }}
        />
      )}
      {layout === "floorplan" && (
        <>
          <div
            style={{
              position: "absolute",
              inset: "15%",
              border: `1px solid ${active ? "rgba(255,255,255,0.55)" : "var(--text-2)"}`,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "15%",
              bottom: "15%",
              left: "47%",
              width: 1,
              background: active ? "rgba(255,255,255,0.4)" : "var(--text-2)",
              opacity: 0.55,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "15%",
              right: "15%",
              top: "47%",
              height: 1,
              background: active ? "rgba(255,255,255,0.4)" : "var(--text-2)",
              opacity: 0.55,
            }}
          />
        </>
      )}
    </div>
  );
}

// ─── Step 2: generating ─────────────────────────────────────────────────

function GeneratingStep({
  layout,
  sizesDone,
  angle,
}: {
  layout: Angle["concept"]["layout"];
  sizesDone: number;
  angle: Angle;
}) {
  // Steps that finish *before* per-size rendering starts.
  const prelude = [
    { id: "ctx", label: "Reading angle context", sub: angle.name },
    { id: "layout", label: "Locking layout", sub: layout },
  ];
  const totalSteps = prelude.length + SIZE_PLAN.length;
  // sizesDone counts only the per-size completions. Combined progress:
  // prelude lines tick once we begin (i.e. always done by the time the
  // user sees this step).
  const completed = prelude.length + sizesDone;

  return (
    <div
      className="rounded-[8px] bg-white p-3"
      style={{ border: "1px solid var(--border-subtle)" }}
    >
      <div className="text-[11.5px] font-semibold mb-2 flex items-center gap-2">
        <Sparkles size={11} style={{ color: "#7C3AED" }} />
        Spot is rendering · {completed} of {totalSteps}
      </div>
      <ul className="space-y-1.5 mb-3">
        {prelude.map((p) => (
          <LogRow key={p.id} done label={p.label} sub={p.sub} />
        ))}
        {SIZE_PLAN.map((plan, i) => (
          <LogRow
            key={plan.format}
            done={i < sizesDone}
            active={i === sizesDone}
            label={`Rendering ${plan.format}`}
            sub={plan.surface}
          />
        ))}
      </ul>

      {/* Preview thumbnails fill in as each size completes */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}
      >
        {SIZE_PLAN.map((plan, i) => (
          <SizePreviewSlot
            key={plan.format}
            format={plan.format}
            layout={layout}
            angle={angle}
            done={i < sizesDone}
            active={i === sizesDone}
            hue={hashHue(`${angle.id}-${plan.format}`)}
          />
        ))}
      </div>
    </div>
  );
}

function LogRow({
  done,
  active,
  label,
  sub,
}: {
  done?: boolean;
  active?: boolean;
  label: string;
  sub?: string;
}) {
  return (
    <li className="flex items-start gap-2 text-[11.5px] leading-[1.4]">
      <span className="flex-shrink-0 mt-0.5" style={{ width: 12, height: 12 }}>
        {done && <Check size={11} style={{ color: "var(--ok-fg)" }} />}
        {active && (
          <Loader2 size={11} className="animate-spin" style={{ color: "#7C3AED" }} />
        )}
        {!done && !active && (
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--border)",
              margin: 3,
            }}
          />
        )}
      </span>
      <span className={!done && !active ? "text-text-tertiary" : ""}>
        {label}
        {sub && (
          <span className="text-text-tertiary ml-1.5">· {sub}</span>
        )}
      </span>
    </li>
  );
}

function SizePreviewSlot({
  format,
  layout,
  angle,
  done,
  active,
  hue,
}: {
  format: Creative["format"];
  layout: Angle["concept"]["layout"];
  angle: Angle;
  done: boolean;
  active: boolean;
  hue: number;
}) {
  const aspect = aspectFor(format);
  if (done) {
    return (
      <div className="space-y-1.5">
        <GeneratedThumb hue={hue} layout={layout} aspect={aspect} hook={angle.hook} />
        <div className="text-[10px] text-text-tertiary leading-tight">
          <span className="font-semibold">{format}</span> — done
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <div
        style={{
          aspectRatio: aspect,
          borderRadius: 6,
          background: active
            ? "linear-gradient(110deg, #F3F0FA 8%, #E9E1F8 18%, #F3F0FA 33%)"
            : "var(--bg-page)",
          backgroundSize: active ? "200% 100%" : undefined,
          animation: active ? "shimmer 1.4s linear infinite" : undefined,
          border: `1px ${active ? "solid" : "dashed"} ${active ? "var(--spot-stroke)" : "var(--border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-tertiary)",
        }}
      >
        {active ? (
          <Loader2 size={16} className="animate-spin" style={{ color: "#7C3AED" }} />
        ) : (
          <ImageIcon size={14} />
        )}
      </div>
      <div className="text-[10px] text-text-tertiary leading-tight">
        <span className="font-semibold">{format}</span> —{" "}
        {active ? "rendering…" : "queued"}
      </div>
      <style jsx>{`
        @keyframes shimmer {
          from {
            background-position: 100% 0;
          }
          to {
            background-position: -100% 0;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Step 3: ready / review ────────────────────────────────────────────

function ReadyStep({
  drafts,
  layout,
  angle,
  persona,
  onSave,
  onRedo,
}: {
  drafts: Creative[];
  layout: Angle["concept"]["layout"];
  angle: Angle;
  persona: Persona;
  onSave: () => void;
  onRedo: () => void;
}) {
  return (
    <div
      className="rounded-[8px] bg-white p-3"
      style={{ border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-start gap-2 mb-2.5">
        <span
          className="inline-flex items-center justify-center flex-shrink-0"
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: "var(--ok-fg, #15803D)",
            color: "#FFF",
          }}
        >
          <Check size={12} strokeWidth={3} />
        </span>
        <div className="flex-1">
          <div className="text-[12px] font-semibold leading-tight">
            3 sizes drafted
          </div>
          <div className="text-[10.5px] text-text-tertiary">
            For {persona.name} · {angle.name} · {layout} layout
          </div>
        </div>
      </div>

      <div
        className="grid gap-2 mb-3"
        style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}
      >
        {drafts.map((c) => (
          <div key={c.id} className="space-y-1.5">
            <GeneratedThumb
              hue={c.placeholderHue ?? 240}
              layout={layout}
              aspect={aspectFor(c.format)}
              hook={angle.hook}
            />
            <div className="text-[10px] leading-tight">
              <span className="font-semibold">{c.format}</span>
              <span className="text-text-tertiary"> · {c.surface}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onRedo}
          className="inline-flex items-center h-7 px-2.5 rounded-button border border-border bg-white text-[11.5px] text-text-secondary"
        >
          Try a different layout
        </button>
        <button
          type="button"
          onClick={onSave}
          className="apply-btn"
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)",
            height: 28,
            fontSize: 12,
            padding: "0 12px",
          }}
        >
          <Check size={11} /> Save to angle
        </button>
      </div>
    </div>
  );
}

// ─── Shared preview thumb ──────────────────────────────────────────────

function GeneratedThumb({
  hue,
  layout,
  aspect,
  hook,
}: {
  hue: number;
  layout: Angle["concept"]["layout"];
  aspect: string;
  hook: string;
}) {
  return (
    <div
      style={{
        aspectRatio: aspect,
        borderRadius: 6,
        background: `linear-gradient(135deg, oklch(0.78 0.10 ${hue}) 0%, oklch(0.62 0.13 ${(hue + 35) % 360}) 100%)`,
        position: "relative",
        overflow: "hidden",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "12%",
          border: "1px solid rgba(255,255,255,0.45)",
          borderRadius: 4,
        }}
      />
      {layout === "type-led" && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "32% 14%",
            background: "rgba(0,0,0,0.72)",
            borderRadius: 3,
          }}
        />
      )}
      {layout === "split" && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "52%",
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.18)",
          }}
        />
      )}
      {layout === "floorplan" && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "20%",
            border: "1px solid rgba(255,255,255,0.55)",
            borderRadius: 3,
          }}
        />
      )}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "60% 14% 12% 14%",
          background: "rgba(0,0,0,0.55)",
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFF",
          fontSize: 9,
          fontWeight: 600,
          padding: "3px 6px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {hook.slice(0, 40)}
      </div>
    </div>
  );
}

function aspectFor(format: Creative["format"]): string {
  switch (format) {
    case "1:1":
      return "1 / 1";
    case "4:5":
      return "4 / 5";
    case "9:16":
      return "9 / 16";
    case "16:9":
      return "16 / 9";
  }
}

function hashHue(s: string): number {
  return (s.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) * 47) % 360;
}
