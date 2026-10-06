"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Monogram } from "@/components/brand/Monogram";
import { lockScroll } from "@/lib/scroll";

interface Props {
  /** 0–1, real load progress (video bytes) */
  progress: number;
  /** video ready (canplaythrough) — fonts are awaited here */
  ready: boolean;
  /** called once the curtain has lifted */
  onDone: () => void;
}

/**
 * Black curtain: CP monogram stroke draws in with load progress, mono % counter, then lifts.
 * Server-rendered so it covers first paint; hidden via <noscript> when JS is off.
 */
export function Preloader({ progress, ready, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const shown = useRef({ v: 0 });
  const done = useRef(false);

  // path has pathLength=1, so dashoffset 1 → 0 draws the whole outline
  const paint = useCallback(() => {
    const v = shown.current.v;
    if (counter.current) counter.current.textContent = String(Math.round(v * 100)).padStart(3, "0");
    svg.current?.querySelector("path")?.setAttribute("stroke-dashoffset", String(1 - v));
  }, []);

  // lock scroll while the curtain is down
  useEffect(() => {
    lockScroll(true);
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    return () => lockScroll(false);
  }, []);

  // ease the visible number toward real progress (never jumps, never goes backwards)
  useEffect(() => {
    const tw = gsap.to(shown.current, {
      v: Math.max(shown.current.v, progress),
      duration: 0.6,
      ease: "power2.out",
      onUpdate: paint,
    });
    return () => void tw.kill();
  }, [progress, paint]);

  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    let tl: gsap.core.Timeline | null = null;
    document.fonts.ready.then(() => {
      const path = svg.current!.querySelector("path")!;
      tl = gsap
        .timeline({
          onComplete: () => {
            lockScroll(false);
            onDone();
          },
        })
        .to(shown.current, { v: 1, duration: 0.4, ease: "power2.out", onUpdate: paint })
        .to(path, { attr: { "fill-opacity": 1 }, duration: 0.5, ease: "power2.out" })
        .to(root.current, { yPercent: -100, duration: 0.9, ease: "expo.inOut" }, "+=0.15")
        .set(root.current, { display: "none" });
    });
    return () => void tl?.kill();
  }, [ready, onDone, paint]);

  return (
    <div
      ref={root}
      id="preloader"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink text-paper"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <Monogram
        ref={svg}
        className="w-[min(28vw,140px)] overflow-visible text-paper"
        aria-hidden="true"
        // initial state is in the server HTML so the first paint is an undrawn outline
        pathProps={{
          pathLength: 1,
          stroke: "var(--copper)",
          strokeWidth: 3,
          vectorEffect: "non-scaling-stroke",
          strokeDasharray: 1,
          strokeDashoffset: 1,
          fillOpacity: 0,
        }}
      />
      <div className="mono-label absolute bottom-[var(--gutter)] left-[var(--gutter)] right-[var(--gutter)] flex justify-between text-concrete-500">
        <span>Concept Plus</span>
        <span>
          <span ref={counter} className="text-paper tabular-nums">
            000
          </span>
          %
        </span>
      </div>
      <noscript>
        <style>{`#preloader{display:none!important}`}</style>
      </noscript>
    </div>
  );
}
