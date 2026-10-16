/**
 * Timestamps. Every time in the experience lives here; page heights live in lib/layout.ts.
 * Retime a frame by changing its `at` (seconds) — layout positions follow automatically.
 * See README → "How to retime a beat".
 *
 * Verified against the footage (assets/contact/*.jpg); see DECISIONS.md §Timestamps.
 */

export type Range = readonly [number, number];

export const VIDEO = {
  duration: 145.033,
  fps: 30,
  /**
   * In preference order; the first one canPlayType() accepts is downloaded. Codec strings
   * matter: a bare "video/mp4" can answer "maybe" in builds that can't decode H.264.
   */
  sources: {
    desktop: [
      { src: "/video/scrub.mp4", type: 'video/mp4; codecs="avc1.64001F"' },
      { src: "/video/scrub.webm", type: 'video/webm; codecs="vp9"' },
    ],
    mobile: [
      { src: "/video/scrub-m.mp4", type: 'video/mp4; codecs="avc1.64001E"' },
      { src: "/video/scrub-m.webm", type: 'video/webm; codecs="vp9"' },
    ],
  },
  poster: { desktop: "/video/poster.jpg", mobile: "/video/poster-m.jpg" },
} as const;

/** Scrub engine tuning */
export const SCRUB = {
  /** lerp factor per frame: current += (target - current) * LERP */
  lerp: 0.12,
  /** only seek when the smoothed time moved by at least this much (s) */
  minDelta: 1 / 60,
  /** ease progress into the last frame over this final fraction of the scroll */
  endEase: 0.03,
} as const;

/** Canvas fallback (iOS / USE_CANVAS_SEQUENCE). Must match scripts/frames.sh. */
export const SEQUENCE = {
  /**
   * Set true once `bash scripts/frames.sh sequence` has been run and public/frames/seq is
   * deployed (~3,500 WebP files). While false, auto mode never tries the canvas path.
   */
  deployed: process.env.NEXT_PUBLIC_SEQUENCE_DEPLOYED === "1",
  dir: "/frames/seq",
  fps: 24,
  width: 960,
  chunk: 96,
} as const;

export type SectionId = "hero" | "about" | "services" | "process" | "contact";

/**
 * Sections in page order and the stretch of footage each one sits over.
 * Contact has no range: it sits after the video and holds on the last frame.
 */
export const SECTIONS: { id: SectionId; label: string | null; rail: string; video: Range | null }[] = [
  // 0:00 glowing CP → 0:04 CP-shaped plan → 0:06–0:11 night exterior
  { id: "hero", label: null, rail: "Hero", video: [0, 12] },
  // 0:12 entrance → lobby "Welcome to Concept Plus" → "A unified ecosystem…" 0:22
  // → "Everything we do is built around one outcome" 0:31 → "Orchestrating what endures / We align" 0:38–0:45
  { id: "about", label: "01 / About", rail: "About", video: [12, 47] },
  // DEVELOPMENT 0:48 → SALES & MARKETING 0:58 → REAL ESTATE 1:05 → HOSPITALITY 1:16 → ART 1:31 → ACADEMY 1:43
  { id: "services", label: "02 / Services", rail: "Services", video: [47, 114] },
  // House of CP 1:54 → Lounge/Café/Academy/Gallery wall 2:00 → walk to the doorway 2:07–2:18 → courtyard 2:20–2:25
  { id: "process", label: "03 / How we work", rail: "Process", video: [114, VIDEO.duration] },
  { id: "contact", label: "04 / Contact", rail: "Contact", video: null },
];

/**
 * Frame anchors: the video time at which each glass frame's centre crosses the viewport
 * centre. Chosen so the frame is on screen while its sign / room is.
 */
export const FRAME_AT = {
  /** arrives (top edge enters) as the lobby appears, ~0:12 */
  about: 24,
  /** big "Our Services" heading, as About gives way to the Development hall */
  servicesHeading: 46,
  services: {
    development: 54, // DEVELOPMENT wall 0:48–0:56 (after the heading has passed)
    "sales-marketing": 61, // SALES & MARKETING 0:58–1:04
    "real-estate": 70, // REAL ESTATE 1:05–1:14
    hospitality: 82, // HOSPITALITY corridor 1:16–1:27
    art: 94, // ART 1:31–1:40
    academy: 107, // ACADEMY 1:43–1:53
  },
  /** "How we work" heading frame, over the House of CP wall */
  processIntro: 119,
  /** the four-step row, while the woman walks to the doorway */
  processSteps: 131,
} as const;

/** When each service's index entry is active (and its panel's sign is in view). */
export const SERVICE_TIMES = {
  development: { video: [47, 57.5], still: 54 },
  "sales-marketing": { video: [57.5, 64.5], still: 61 },
  "real-estate": { video: [64.5, 75.5], still: 70 },
  hospitality: { video: [75.5, 89.5], still: 82 },
  art: { video: [89.5, 101], still: 93 },
  academy: { video: [101, 114], still: 112 },
} as const satisfies Record<keyof typeof FRAME_AT.services, { video: Range; still: number }>;

export type ServiceSlug = keyof typeof SERVICE_TIMES;

/**
 * Floor plan (components/FloorPlan.tsx). `route` is drawn in the monogram's own viewBox
 * (0 0 430 465): along the C's bottom bar, up its spine, across its top, into the P's bowl,
 * round it, and out down the P's stem to the courtyard. The dot travels it across `walk`.
 */
export const FLOOR_PLAN = {
  route: "M236 268 L48 268 L48 48 L212 48 L212 122 L372 122 L372 322 L212 322 L212 445",
  /** seconds: dot waits at the door through the hero, reaches the courtyard as the walk ends */
  walk: [12, 140] as Range,
} as const;

/** Where you are, by film time (first entry whose `until` is ahead of t). */
export const PLACES: { until: number; name: string }[] = [
  { until: 12, name: "Entrance" },
  { until: 20, name: "Lobby" },
  { until: 37, name: "Gallery hall" },
  { until: 47, name: "We align" },
  { until: 57.5, name: "Development" },
  { until: 64.5, name: "Sales & Marketing" },
  { until: 75.5, name: "Real Estate" },
  { until: 89.5, name: "Hospitality" },
  { until: 101, name: "Art" },
  { until: 114, name: "Academy" },
  { until: 120, name: "House of CP" },
  { until: 127, name: "Formats" },
  { until: 139, name: "Gallery walk" },
  { until: Infinity, name: "Courtyard" },
];

export function placeAt(t: number): string {
  return PLACES.find((p) => t < p.until)!.name;
}

/** Hero sub-timeline, in fractions of the hero section's own scroll height. */
export const HERO = {
  /** wordmark scales 1 → 1.6 and fades */
  wordmark: [0, 0.55] as Range,
  wordmarkScale: 1.6,
  /** monogram resolves at centre (opacity 0→1, blur→sharp) */
  monogramIn: [0.25, 0.65] as Range,
  /** monogram shrinks into the nav slot */
  monogramToNav: [0.7, 1] as Range,
} as const;

/** Reduced-motion stills (scripts/frames.sh stills), by video time. */
export const STILLS: { from: number; src: string }[] = [
  { from: 0, src: VIDEO.poster.desktop },
  { from: 12, src: "/frames/about.jpg" },
  ...Object.entries(SERVICE_TIMES).map(([slug, s]) => ({ from: s.video[0], src: `/frames/${slug}.jpg` })),
  { from: 114, src: "/frames/process.jpg" },
  { from: 139, src: "/frames/contact.jpg" },
];

// ---------------------------------------------------------------------------

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Local progress (0–1) inside a range. */
export function within(v: number, [a, b]: Range): number {
  return clamp01((v - a) / (b - a));
}

/**
 * Video progress → video time. Linear, except the last SCRUB.endEase of the scroll,
 * which decelerates into the final frame with continuous velocity (no snap):
 * f(u) = u + u² − u³  (f(0)=0, f'(0)=1, f(1)=1, f'(1)=0).
 */
export function timeAt(p: number): number {
  const e = SCRUB.endEase;
  const x = clamp01(p);
  if (x <= 1 - e) return x * VIDEO.duration;
  const u = (x - (1 - e)) / e;
  const f = u + u * u - u * u * u;
  return (1 - e + e * f) * VIDEO.duration;
}

export function sectionAt(t: number): SectionId {
  for (const s of SECTIONS) if (s.video && t < s.video[1]) return s.id;
  return "contact";
}

export function serviceAt(t: number): ServiceSlug | null {
  for (const [slug, s] of Object.entries(SERVICE_TIMES)) if (t >= s.video[0] && t < s.video[1]) return slug as ServiceSlug;
  return null;
}

export function stillAt(t: number): string {
  let src = STILLS[0].src;
  for (const s of STILLS) if (t >= s.from) src = s.src;
  return src;
}
