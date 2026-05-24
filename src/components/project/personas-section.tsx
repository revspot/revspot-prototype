"use client";

import { useRef, useState } from "react";
import { Users, Plus } from "lucide-react";
import type { ProjectDetail, Creative } from "@/lib/project-data";
import { mutateRuntimeProject } from "@/lib/project-data";
import { SectionHeader } from "./shared/section-header";
import { PersonaCard } from "./persona-card";
import { InlineSpotComposer, type StreamItem } from "./inline-spot-composer";

/**
 * Personas tab — every persona on the project, expanded with the full
 * Angle → Concept (static / video) → Sizes hierarchy.
 *
 * The two Spot composers (new persona at the top, new angles inside each
 * persona card) live inline on this page so the user never leaves to a
 * modal. The legacy CreativesFlow / guided flow modals are no longer
 * used from here.
 */

const SAMPLE_PERSONAS = [
  {
    name: "The Senior Tech Lead",
    role: "VP Engineering · 40s · Pune East",
    age: 41,
    want: "A future-proof family home with a strong school zone",
    pain: "Long commutes from Hinjewadi cut into family time",
    usp: "8 min to top international schools · branded developer",
  },
  {
    name: "The NRI Investor",
    role: "Senior Manager · 45 · Dubai → India",
    age: 45,
    want: "Branded second home with rental yield + occasional family use",
    pain: "Hard to trust remote management while abroad",
    usp: "RERA-cleared + managed rental program + builder warranty",
  },
  {
    name: "The Pune Returnee",
    role: "Product Director · 38 · returning from Bangalore",
    age: 38,
    want: "Familiar luxury, walkable to schools and amenities",
    pain: "Pune options feel under-amenitized compared to BLR",
    usp: "Sky-clubhouse + lowest density + smart-home spec",
  },
];

export function PersonasSection({
  project,
  onAsk,
}: {
  project: ProjectDetail;
  onAsk: (q: string) => void;
}) {
  // Inline new-persona composer state
  const [newPersonaOpen, setNewPersonaOpen] = useState(false);
  const [newPersonaStream, setNewPersonaStream] = useState<StreamItem[] | null>(null);
  const newPersonaPersist = useRef<((i: number) => void) | null>(null);

  // Inline draft-creatives composer state (one at a time, keyed by angleId)
  const [draftFor, setDraftFor] = useState<string | null>(null);
  const [draftStream, setDraftStream] = useState<StreamItem[] | null>(null);
  const draftPersist = useRef<((i: number) => void) | null>(null);

  const startNewPersona = (userPrompt: string) => {
    const usedNames = new Set(project.personas.map((p) => p.name));
    const candidates = SAMPLE_PERSONAS.filter((p) => !usedNames.has(p.name));
    const pick = userPrompt
      ? {
          name:
            userPrompt.length > 32
              ? userPrompt.slice(0, 32) + "…"
              : userPrompt,
          role: "Drafted from your prompt",
          age: 40,
          want: userPrompt,
          pain: "(Spot will refine after you review)",
          usp: "(Spot will refine after you review)",
        }
      : candidates[0] || SAMPLE_PERSONAS[0];

    const items: StreamItem[] = [
      { id: "p", label: `Drafting "${pick.name}"`, indent: 0 },
      { id: "p-role", label: "Role + age", sub: pick.role, indent: 1 },
      { id: "p-want", label: "Want", sub: pick.want, indent: 1 },
      { id: "p-pain", label: "Pain point", sub: pick.pain, indent: 1 },
      { id: "p-usp", label: "USP that resonates", sub: pick.usp, indent: 1 },
    ];
    setNewPersonaStream(items);

    newPersonaPersist.current = (i) => {
      // Only persist after the last item ticks done (i === items.length - 1).
      if (i !== items.length - 1) return;
      mutateRuntimeProject(project.id, (p) => {
        const id = `persona-${Date.now().toString(36)}`;
        p.personas.push({
          id,
          name: pick.name,
          age: pick.age,
          role: pick.role,
          share: 0,
          approved: false,
          draft: true,
          oneLiner: pick.want,
          want: pick.want,
          painPoint: pick.pain,
          usp: pick.usp,
          demographics: [],
          motivations: [],
          objections: [],
          channels: ["Meta", "Google"],
          verifiedLeads: 0,
          cpvl: "—",
          angles: [],
        });
      });
    };
  };

  const closeNewPersona = () => {
    setNewPersonaOpen(false);
    setNewPersonaStream(null);
    newPersonaPersist.current = null;
  };

  // Build sized-creative placeholders for a freshly drafted concept.
  const seedSizes = (
    kind: "static" | "video",
    angleId: string,
  ): Creative[] => {
    if (kind === "video") {
      return [
        {
          id: `cr-${angleId}-v-916`,
          format: "9:16",
          surface: "Meta Reels",
          platform: "Meta",
          kind: "video",
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
        },
        {
          id: `cr-${angleId}-v-11`,
          format: "1:1",
          surface: "Meta Feed",
          platform: "Meta",
          kind: "video",
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
        },
      ];
    }
    return [
      {
        id: `cr-${angleId}-s-11`,
        format: "1:1",
        surface: "Meta Feed",
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
      },
      {
        id: `cr-${angleId}-s-45`,
        format: "4:5",
        surface: "Meta Feed",
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
      },
      {
        id: `cr-${angleId}-s-916`,
        format: "9:16",
        surface: "Meta Stories",
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
      },
    ];
  };

  const startDraftCreatives = (angleId: string) => {
    setDraftFor(angleId);

    // Find the angle so we can name it in the log.
    let angleName = "this angle";
    project.personas.forEach((p) => {
      p.angles.forEach((a) => {
        if (a.id === angleId) angleName = a.name;
      });
    });

    const items: StreamItem[] = [
      { id: "s", label: `Drafting concepts for ${angleName}`, indent: 0 },
      { id: "s-static", label: "Static concept · 3 sizes", sub: "1:1 · 4:5 · 9:16", indent: 1 },
      { id: "s-video", label: "Video concept · 2 sizes", sub: "9:16 · 1:1", indent: 1 },
    ];
    setDraftStream(items);

    draftPersist.current = (i) => {
      mutateRuntimeProject(project.id, (p) => {
        for (const persona of p.personas) {
          const angle = persona.angles.find((a) => a.id === angleId);
          if (!angle) continue;
          if (i === 1) {
            // Static concept done — push static sizes.
            angle.concept.creatives.push(...seedSizes("static", angleId));
          } else if (i === 2) {
            // Video concept done — push video sizes.
            angle.concept.creatives.push(...seedSizes("video", angleId));
            // Flip angle to live so the new concepts surface.
            if (angle.status === "draft") angle.status = "live";
          }
          break;
        }
      });
    };
  };

  const closeDraftCreatives = () => {
    setDraftFor(null);
    setDraftStream(null);
    draftPersist.current = null;
  };

  return (
    <div>
      <SectionHeader
        icon={Users}
        title="Personas"
        subtitle="Who we're selling to · each persona's angles, concepts, and sizes"
        onAsk={() => onAsk("Audit personas — who's converting, who isn't?")}
        actions={
          !newPersonaOpen ? (
            <button
              type="button"
              onClick={() => setNewPersonaOpen(true)}
              className="apply-btn"
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)",
              }}
            >
              <Plus size={11} /> New persona with Spot
            </button>
          ) : null
        }
      />

      {/* Inline new-persona composer */}
      {newPersonaOpen && (
        <div className="mb-3">
          <InlineSpotComposer
            prompt="Draft a new persona for this project"
            placeholder="Describe a persona in a sentence (e.g. 'NRI families in their 40s shopping for a second home with rental yield')…"
            primaryLabel="Draft from prompt"
            secondaryLabel="Just draft 1"
            onStart={startNewPersona}
            onCancel={closeNewPersona}
            streamItems={newPersonaStream ?? undefined}
            streamHeader="Drafting persona"
            onItemComplete={(i) => newPersonaPersist.current?.(i)}
            onDone={closeNewPersona}
          />
        </div>
      )}

      <div className="space-y-3">
        {project.personas.map((p) => (
          <div key={p.id}>
            <PersonaCard
              persona={p}
              projectId={project.id}
              onAsk={onAsk}
              onDraftCreatives={startDraftCreatives}
            />
            {/* Inline draft-creatives composer sits below the persona whose
                angle was clicked. */}
            {draftFor &&
              p.angles.some((a) => a.id === draftFor) && (
                <div className="mt-3">
                  <InlineSpotComposer
                    prompt="Drafting creative concepts"
                    placeholder=""
                    primaryLabel="Draft"
                    onStart={() => {}}
                    onCancel={closeDraftCreatives}
                    streamItems={draftStream ?? undefined}
                    streamHeader="Spot is drafting concepts"
                    onItemComplete={(i) => draftPersist.current?.(i)}
                    onDone={closeDraftCreatives}
                  />
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
