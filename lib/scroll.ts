"use client";

/**
 * Scroll plumbing shared by every client component:
 *   - one Lenis instance driven by GSAP's ticker (so Lenis, ScrollTrigger and our
 *     timelines all advance on the same frame)
 *   - a tiny pub/sub store for stage progress p ∈ [0,1] and Lenis velocity, read in rAF
 *     callbacks without React re-renders
 */
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let tick: ((time: number) => void) | null = null;

export function startLenis(): Lenis | null {
  if (lenis || typeof window === "undefined") return lenis;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  lenis = new Lenis({
    // smooth only — native scrollbar, keyboard and find-in-page keep working; nothing is trapped
    lerp: 0.1,
    smoothWheel: true,
    syncTouch: false,
    autoRaf: false,
  });
  lenis.on("scroll", ScrollTrigger.update);
  tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function stopLenis() {
  if (tick) gsap.ticker.remove(tick);
  lenis?.destroy();
  lenis = null;
  tick = null;
}

export const getLenis = () => lenis;

/** Smooth-scroll to an absolute Y (falls back to native when Lenis is off). */
export function scrollToY(y: number, opts: { immediate?: boolean; duration?: number } = {}) {
  if (lenis) {
    lenis.scrollTo(y, { immediate: opts.immediate, duration: opts.duration ?? 1.6, force: true });
  } else {
    window.scrollTo({ top: y, behavior: opts.immediate ? "instant" : "smooth" });
  }
}

export function lockScroll(locked: boolean) {
  if (lenis && locked) lenis.stop();
  else if (lenis) lenis.start();
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

// ---------------------------------------------------------------------------
// Stage store
// ---------------------------------------------------------------------------

export interface StageState {
  /** stage progress 0–1 */
  p: number;
  /** Lenis velocity (px/frame), 0 when Lenis is off */
  velocity: number;
  /** pixel offset of the stage top and its scrollable length; used for scroll-to-progress */
  stageTop: number;
  stageLength: number;
}

type Listener = (s: StageState) => void;

const state: StageState = { p: 0, velocity: 0, stageTop: 0, stageLength: 1 };
const listeners = new Set<Listener>();

export const stage = {
  get: () => state,
  set(patch: Partial<StageState>) {
    Object.assign(state, patch);
    listeners.forEach((l) => l(state));
  },
  subscribe(l: Listener) {
    listeners.add(l);
    l(state);
    return () => void listeners.delete(l);
  },
  /** Y position for a given stage progress. */
  yFor(p: number) {
    return state.stageTop + p * state.stageLength;
  },
  scrollToProgress(p: number, opts?: { immediate?: boolean; duration?: number }) {
    scrollToY(stage.yFor(p), opts);
  },
};
