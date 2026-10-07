"use client";

/**
 * Shared motion for glass frames, one observer + one scroll listener for all of them:
 *   - entrance: IntersectionObserver flips `data-state` from "pending" → "in" once; CSS does
 *     the 800ms rise + 70ms inner stagger. `will-change` is set only while animating.
 *   - counter-parallax: the frame's *content* (not the glass) is offset by 4% of its distance
 *     from viewport centre, so content moves at ~0.96× while the glass stays crisp at 1×.
 */
import { scroll } from "./scroll";

const PARALLAX = 0.04;

type Entry = { frame: HTMLElement; content: HTMLElement | null; visible: boolean };
const entries = new Map<HTMLElement, Entry>();
let io: IntersectionObserver | null = null;
let unsub: (() => void) | null = null;

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function ensure() {
  if (io) return;
  io = new IntersectionObserver(
    (list) => {
      for (const e of list) {
        const entry = entries.get(e.target as HTMLElement);
        if (!entry) continue;
        entry.visible = e.isIntersecting;
        if (e.isIntersecting && entry.frame.dataset.state === "pending") enter(entry.frame);
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0 },
  );
  unsub = scroll.subscribe(applyParallax);
}

function enter(frame: HTMLElement) {
  frame.style.willChange = "transform, opacity";
  frame.dataset.state = "in";
  const done = (ev: TransitionEvent) => {
    if (ev.target !== frame) return;
    frame.style.willChange = "";
    frame.removeEventListener("transitionend", done);
  };
  frame.addEventListener("transitionend", done);
}

function applyParallax() {
  if (reduced()) return;
  const mid = window.innerHeight / 2;
  for (const e of entries.values()) {
    if (!e.visible || !e.content) continue;
    const r = e.frame.getBoundingClientRect();
    const d = r.top + r.height / 2 - mid;
    e.content.style.transform = `translate3d(0, ${(-d * PARALLAX).toFixed(2)}px, 0)`;
  }
}

export function registerFrame(frame: HTMLElement, content: HTMLElement | null, animate: boolean) {
  ensure();
  if (animate && !reduced()) {
    // only hide if it's below the fold; frames already on screen at mount just appear
    const r = frame.getBoundingClientRect();
    frame.dataset.state = r.top < window.innerHeight * 0.88 && r.bottom > 0 ? "in" : "pending";
  } else {
    frame.dataset.state = "in";
  }
  entries.set(frame, { frame, content, visible: false });
  io!.observe(frame);
  return () => {
    io?.unobserve(frame);
    entries.delete(frame);
    if (!entries.size) {
      io?.disconnect();
      io = null;
      unsub?.();
      unsub = null;
    }
  };
}
