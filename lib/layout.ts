/**
 * Page geometry. The document is laid out so that scroll position is proportional to
 * video time: VH_PER_SECOND of page height per second of footage, everywhere. Each
 * section's height is its footage span × VH_PER_SECOND, so the walk never speeds up or
 * stalls at a boundary; sections with less content than footage simply have more
 * transparent space.
 *
 * Frames are positioned from FRAME_AT (lib/choreography.ts): a frame anchored at time t
 * has its centre at  t × VH_PER_SECOND + 50vh  in document space, i.e. it crosses the
 * viewport centre exactly when the video reaches t.
 *
 * Units are `svh` so mobile browser chrome doesn't shift anything.
 */
import { FRAME_AT, SECTIONS, VIDEO, type SectionId, type ServiceSlug } from "./choreography";

/** Page height per second of video. 8.4 → hero (12 s) ≈ 100vh, a service ≈ 75–120vh. */
export const VH_PER_SECOND = 8.4;

/** Height of the hold region after the video ends (contact frame), before the footer. */
export const CONTACT_VH = 100;

export type Side = "left" | "right" | "center";
export type Tone = "dark" | "bright";

/**
 * Per-frame placement and glass tone. `bright` raises the tint where the footage behind
 * the frame is pale concrete / white gallery walls — set from measured contrast
 * (scripts/verify-glass.mjs), not by eye.
 */
export const FRAMES = {
  about: { side: "left" as Side, tone: "bright" as Tone },
  services: {
    development: { side: "right" as Side, tone: "bright" as Tone },
    "sales-marketing": { side: "left" as Side, tone: "bright" as Tone },
    "real-estate": { side: "right" as Side, tone: "bright" as Tone },
    // chandeliers: dark corridor but p95 highlights failed at the dark tint (3.6:1)
    hospitality: { side: "left" as Side, tone: "bright" as Tone },
    art: { side: "right" as Side, tone: "bright" as Tone },
    academy: { side: "left" as Side, tone: "bright" as Tone },
  } satisfies Record<ServiceSlug, { side: Side; tone: Tone }>,
  processIntro: { side: "left" as Side, tone: "bright" as Tone },
  processSteps: { side: "center" as Side, tone: "bright" as Tone },
  contact: { side: "center" as Side, tone: "bright" as Tone },
};

export const vhAt = (t: number) => t * VH_PER_SECOND;

export function sectionVh(id: SectionId): number {
  const s = SECTIONS.find((x) => x.id === id)!;
  if (!s.video) return CONTACT_VH;
  return (s.video[1] - s.video[0]) * VH_PER_SECOND;
}

export function sectionTopVh(id: SectionId): number {
  const s = SECTIONS.find((x) => x.id === id)!;
  return s.video ? vhAt(s.video[0]) : vhAt(VIDEO.duration);
}

/** CSS `top` (relative to its section) that centres a frame on the viewport at time t. */
export function frameTop(section: SectionId, t: number): string {
  return `${(vhAt(t) + 50 - sectionTopVh(section)).toFixed(2)}svh`;
}

export const anchorTop = {
  about: () => frameTop("about", FRAME_AT.about),
  service: (slug: ServiceSlug) => frameTop("services", FRAME_AT.services[slug]),
  processIntro: () => frameTop("process", FRAME_AT.processIntro),
  processSteps: () => frameTop("process", FRAME_AT.processSteps),
};

/** Total height of the video-mapped part of the page. */
export const VIDEO_SPAN_VH = vhAt(VIDEO.duration);
