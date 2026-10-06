/**
 * THE timing config. Every timestamp and scroll range in the experience lives here so a
 * beat can be retimed without touching components. See README → "How to retime a beat".
 *
 * Units
 *   - video times are seconds into public/video/scrub.mp4 (identical to CPV14.mp4)
 *   - scroll ranges are progress p ∈ [0, 1] through the pinned stage
 *
 * Timestamps were verified against the footage (assets/contact/*.jpg contact sheets),
 * see DECISIONS.md §Timestamps for what differs from the original brief.
 */

export type Range = readonly [number, number];

export type BeatId = "hero" | "about" | "services" | "process" | "contact";

export interface Beat {
  id: BeatId;
  /** mono section label, e.g. "01 / ABOUT" (hero has none) */
  label: string | null;
  /** name on the progress rail */
  rail: string;
  /** scroll progress range of the pinned stage */
  scroll: Range;
  /** video time range played across `scroll` */
  video: Range;
  /**
   * Fraction of `scroll` over which `video` plays; the rest holds on video[1].
   * Used by Contact so the last frame freezes while the CTA rises.
   */
  videoSpan?: number;
}

export const VIDEO = {
  duration: 145.033,
  fps: 30,
  sources: {
    desktop: [
      { src: "/video/scrub.mp4", type: "video/mp4" },
      { src: "/video/scrub.webm", type: "video/webm" },
    ],
    mobile: [{ src: "/video/scrub-m.mp4", type: "video/mp4" }],
  },
  poster: { desktop: "/video/poster.jpg", mobile: "/video/poster-m.jpg" },
} as const;

/**
 * Stage length = SCROLL_PER_SECOND × duration (in vh).
 * 6.9 → ~1000vh desktop. Mobile is shorter so thumbs don't have to work as hard.
 */
export const SCROLL_PER_SECOND = 6.9;
export const SCROLL_PER_SECOND_MOBILE = 4.83; // ~700vh

/** Scrub engine tuning */
export const SCRUB = {
  /** lerp factor per frame: current += (target - current) * LERP */
  lerp: 0.12,
  /** only seek when the smoothed time moved by at least this much (s) */
  minDelta: 1 / 60,
} as const;

/** Canvas fallback (iOS / USE_CANVAS_SEQUENCE). Must match scripts/frames.sh. */
export const SEQUENCE = {
  dir: "/frames/seq",
  fps: 24,
  width: 960,
  chunk: 96,
} as const;

export const BEATS: readonly Beat[] = [
  {
    id: "hero",
    label: null,
    rail: "Hero",
    scroll: [0, 0.08],
    // 0:00 glowing CP → 0:04 CP-shaped plan → 0:06–0:11 night exterior
    video: [0, 12],
  },
  {
    id: "about",
    label: "01 / About",
    rail: "About",
    scroll: [0.08, 0.33],
    // 0:12 entrance → lobby "Welcome to Concept Plus" → "A unified ecosystem…" (0:22)
    // → "Everything we do is built around one outcome" (0:30) → "Orchestrating what endures / We align" (0:38–0:45)
    video: [12, 47],
  },
  {
    id: "services",
    label: "02 / Services",
    rail: "Services",
    scroll: [0.33, 0.78],
    // DEVELOPMENT 0:48 → SALES & MARKETING 0:58 → REAL ESTATE 1:05 → HOSPITALITY 1:16
    // → ART 1:31 → ACADEMY 1:43–1:53
    video: [47, 114],
  },
  {
    id: "process",
    label: "03 / Process",
    rail: "Process",
    scroll: [0.78, 0.94],
    // "House of CP — One house, many possibilities" 1:54 → Lounge/Café/Academy/Gallery wall 2:00
    // → woman walks toward the lit doorway 2:07–2:18
    video: [114, 139],
  },
  {
    id: "contact",
    label: "04 / Contact",
    rail: "Contact",
    scroll: [0.94, 1],
    // through the doorway into the courtyard; holds on the CONCEPT PLUS billboard (last frame)
    video: [139, 145],
    videoSpan: 0.7,
  },
] as const;

/** Services in camera order. `video` = when its panel is active; `still` = hero frame. */
export const SERVICE_TIMES = {
  development: { video: [47, 57.5], still: 54 },
  "sales-marketing": { video: [57.5, 64.5], still: 61 },
  "real-estate": { video: [64.5, 75.5], still: 70 },
  hospitality: { video: [75.5, 89.5], still: 82 },
  art: { video: [89.5, 101], still: 93 },
  academy: { video: [101, 114], still: 112 },
} as const satisfies Record<string, { video: Range; still: number }>;

export type ServiceSlug = keyof typeof SERVICE_TIMES;

/** Process steps reveal while the woman walks to the doorway. */
export const PROCESS_TIMES = {
  steps: [126.5, 130, 133.5, 136.5],
  /** hairline progress line draws across this range */
  line: [126.5, 138.5] as Range,
  /** doorway bloom (radial white → --glow overlay) */
  bloom: [134.5, 140.5] as Range,
} as const;

/** Hero sub-timeline, in fractions of the hero beat's scroll range. */
export const HERO = {
  /** wordmark scales 1 → 1.6 and fades */
  wordmark: [0, 0.55] as Range,
  wordmarkScale: 1.6,
  /** monogram resolves at centre (opacity 0→1, blur→sharp) */
  monogramIn: [0.25, 0.65] as Range,
  /** monogram shrinks into the nav slot */
  monogramToNav: [0.7, 1] as Range,
} as const;

/** Text choreography within any beat: exit during the last 15%. */
export const TEXT = { exitFrom: 0.85 } as const;

// ---------------------------------------------------------------------------
// Mapping helpers (pure; shared by the scrub engine, rail, debug overlay)
// ---------------------------------------------------------------------------

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function beatAt(p: number): Beat {
  for (const b of BEATS) if (p < b.scroll[1]) return b;
  return BEATS[BEATS.length - 1];
}

export function beatById(id: BeatId): Beat {
  return BEATS.find((b) => b.id === id)!;
}

/** Local progress (0–1) inside a range. */
export function within(p: number, [a, b]: Range): number {
  return clamp01((p - a) / (b - a));
}

/** Scroll progress → video time (piecewise-linear through the beats). */
export function timeAt(p: number): number {
  const b = beatAt(clamp01(p));
  const local = within(p, b.scroll) / (b.videoSpan ?? 1);
  return lerp(b.video[0], b.video[1], clamp01(local));
}

/** Video time → scroll progress (inverse of timeAt; first match wins). */
export function progressAt(t: number): number {
  for (const b of BEATS) {
    if (t <= b.video[1]) {
      const local = clamp01((t - b.video[0]) / (b.video[1] - b.video[0])) * (b.videoSpan ?? 1);
      return lerp(b.scroll[0], b.scroll[1], local);
    }
  }
  return 1;
}

/** Video range → scroll range. */
export function scrollRangeFor(video: Range): Range {
  return [progressAt(video[0]), progressAt(video[1])];
}

export function stageVh(mobile: boolean): number {
  return Math.round((mobile ? SCROLL_PER_SECOND_MOBILE : SCROLL_PER_SECOND) * VIDEO.duration);
}
