import type { Angle, Creative } from "@/lib/project-data";

/**
 * Derived "concept" — a creative idea inside an angle. The schema today
 * stores `angle.concept.creatives` as a flat list of sized creatives; we
 * group them here so the UI can present the Persona → Angle → Concept →
 * Sizes hierarchy the product asks for without a destructive schema
 * migration.
 *
 * Statics (image + carousel) and videos are *always* separate concepts,
 * matching the user's stated mental model.
 */
export type DerivedConcept = {
  /** Stable id derived from the angle + concept kind. */
  id: string;
  /** Display name — defaults to angle name with a kind suffix. */
  name: string;
  /** "static" covers image + carousel; "video" is its own track. */
  kind: "static" | "video";
  hue: number;
  layout: Angle["concept"]["layout"];
  /** Every sized creative that belongs to this concept. */
  sizes: Creative[];
};

/**
 * Group an angle's creatives into concepts. Always returns at least one
 * concept per kind that has at least one creative. Empty angles get an
 * empty array (the caller decides what to render).
 */
export function getConcepts(angle: Angle): DerivedConcept[] {
  const buckets: Record<"static" | "video", Creative[]> = {
    static: [],
    video: [],
  };
  angle.concept.creatives.forEach((c) => {
    if (c.kind === "video") buckets.video.push(c);
    else buckets.static.push(c);
  });

  const out: DerivedConcept[] = [];
  if (buckets.static.length > 0) {
    out.push({
      id: `${angle.id}-static`,
      name: angle.name,
      kind: "static",
      hue: angle.concept.hue,
      layout: angle.concept.layout,
      sizes: buckets.static,
    });
  }
  if (buckets.video.length > 0) {
    out.push({
      id: `${angle.id}-video`,
      name: angle.name,
      kind: "video",
      hue: angle.concept.hue,
      layout: angle.concept.layout,
      sizes: buckets.video,
    });
  }
  return out;
}

/**
 * Pick the "best" size in a concept to surface at the concept-tile level.
 * Preference order: explicit winner tag → lowest CPVL → highest CTR (static)
 * or highest hook rate (video) → first size with any metrics → first size.
 */
export function pickHeadlineSize(concept: DerivedConcept): Creative | null {
  if (concept.sizes.length === 0) return null;
  const winner = concept.sizes.find((s) => s.tag === "winner");
  if (winner) return winner;

  const sized = concept.sizes.filter((s) => s.cpvl != null);
  if (sized.length > 0) {
    return sized.reduce((best, s) => (s.cpvl! < best.cpvl! ? s : best));
  }

  if (concept.kind === "video") {
    const withHook = concept.sizes.filter((s) => s.hookRate != null);
    if (withHook.length > 0) {
      return withHook.reduce((best, s) =>
        (s.hookRate ?? 0) > (best.hookRate ?? 0) ? s : best,
      );
    }
  } else {
    const withCtr = concept.sizes.filter((s) => s.ctr != null);
    if (withCtr.length > 0) {
      return withCtr.reduce((best, s) =>
        (s.ctr ?? 0) > (best.ctr ?? 0) ? s : best,
      );
    }
  }

  return concept.sizes[0] ?? null;
}

export function conceptHasWinner(concept: DerivedConcept): boolean {
  return concept.sizes.some((s) => s.tag === "winner");
}

export function conceptTotalSpend(concept: DerivedConcept): number {
  return concept.sizes.reduce((s, c) => s + (c.spend || 0), 0);
}

export function conceptTotalVerified(concept: DerivedConcept): number {
  return concept.sizes.reduce((s, c) => s + (c.verified || 0), 0);
}

/** Aggregate CPVL across sizes — null when nothing's verified yet. */
export function conceptAggregateCpvl(concept: DerivedConcept): number | null {
  const spend = conceptTotalSpend(concept);
  const verified = conceptTotalVerified(concept);
  return verified > 0 ? Math.round(spend / verified) : null;
}
