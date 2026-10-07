"use client";

/**
 * Scroll plumbing shared by every client component:
 *   - one Lenis instance (smoothing only — native scroll, keyboard and find-in-page keep working),
 *     loaded lazily after hydration on its own rAF so it never sits on the critical path
 *   - a tiny pub/sub store for document scroll → video progress, read in rAF callbacks
 *     without React re-renders
 *
 * progress = scrollY / videoSpan, clamped 0–1, where videoSpan is the top of the contact
 * section (everything after it holds on the last frame).
 *
 * No GSAP import here on purpose: this module is used on every page, GSAP only on "/".
 */
import type Lenis from "lenis";
import { clamp01, VIDEO } from "./choreography";

let lenis: Lenis | null = null;
let locked = false;
let cancelled = false;

export async function startLenis(): Promise<Lenis | null> {
  if (lenis || typeof window === "undefined") return lenis;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  cancelled = false;
  const { default: LenisCtor } = await import("lenis");
  if (cancelled || lenis) return lenis;
  lenis = new LenisCtor({ lerp: 0.1, smoothWheel: true, syncTouch: false, autoRaf: true });
  if (locked) lenis.stop();
  return lenis;
}

export function stopLenis() {
  cancelled = true;
  lenis?.destroy();
  lenis = null;
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

export function lockScroll(lock: boolean) {
  locked = lock;
  if (lenis && lock) lenis.stop();
  else if (lenis) lenis.start();
  document.documentElement.style.overflow = lock ? "hidden" : "";
}

// ---------------------------------------------------------------------------
// Scroll store
// ---------------------------------------------------------------------------

export interface ScrollState {
  y: number;
  /** video progress 0–1 */
  p: number;
  /** hero-local progress 0–1 */
  heroP: number;
  /** Lenis velocity (px/frame), 0 when Lenis is off */
  velocity: number;
  /** px of scroll that map onto the video (top of #contact) */
  videoSpan: number;
  /** px height of the hero section */
  heroSpan: number;
}

type Listener = (s: ScrollState) => void;

const state: ScrollState = { y: 0, p: 0, heroP: 0, velocity: 0, videoSpan: 1, heroSpan: 1 };
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l(state));
}

export const scroll = {
  get: () => state,
  subscribe(l: Listener) {
    listeners.add(l);
    l(state);
    return () => void listeners.delete(l);
  },
  /** Re-measure section geometry (call on resize / layout change). */
  measure() {
    const contact = document.getElementById("contact");
    const hero = document.getElementById("hero");
    state.videoSpan = Math.max(1, contact ? contact.offsetTop : document.documentElement.scrollHeight - innerHeight);
    state.heroSpan = Math.max(1, hero ? hero.offsetHeight : innerHeight);
    scroll.update(window.scrollY);
  },
  update(y: number, velocity = state.velocity) {
    state.y = y;
    state.velocity = velocity;
    state.p = clamp01(y / state.videoSpan);
    state.heroP = clamp01(y / state.heroSpan);
    emit();
  },
  /** Document Y at which the video shows time t. */
  yForTime(t: number) {
    return (t / VIDEO.duration) * state.videoSpan;
  },
  scrollToTime(t: number, opts?: { immediate?: boolean; duration?: number }) {
    scrollToY(scroll.yForTime(t), opts);
  },
  scrollToSection(id: string, opts?: { immediate?: boolean; duration?: number }) {
    const el = document.getElementById(id);
    if (el) scrollToY(el.offsetTop, opts);
  },
};

/**
 * Jump to video time t once the page is tall enough to hold it. On Back, Next reveals "/"
 * while the shorter service page may still set the document height for a frame or two,
 * and an early scrollTo gets clamped — so retry for up to ~1s until it sticks.
 */
export function restoreToTime(t: number, onLanded?: () => void) {
  let tries = 0;
  const attempt = () => {
    scroll.measure();
    const y = scroll.yForTime(t);
    const fits = document.documentElement.scrollHeight - innerHeight >= y - 1;
    if (fits) scrollToY(y, { immediate: true });
    if (fits && Math.abs(window.scrollY - y) < 2) {
      scroll.update(window.scrollY);
      onLanded?.();
    } else if (++tries < 60) requestAnimationFrame(attempt);
  };
  attempt();
}

/** Wire scroll events (Lenis when on, native otherwise) into the store. Returns cleanup. */
export function bindScrollStore(): () => void {
  // Lenis moves the real window scroll, so native scroll events cover both cases and
  // the store works before Lenis has loaded (and when it never does: reduced motion)
  const onScroll = () => scroll.update(window.scrollY, lenis?.velocity ?? 0);
  const onResize = () => scroll.measure();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  const ro = new ResizeObserver(onResize);
  ro.observe(document.body);
  scroll.measure();
  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    ro.disconnect();
  };
}
