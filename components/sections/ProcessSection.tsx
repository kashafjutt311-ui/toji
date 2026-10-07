"use client";

import { useEffect, useRef } from "react";
import { GlassFrame } from "@/components/GlassFrame";
import { PROCESS } from "@/data/copy";
import { anchorTop, FRAMES, sectionVh } from "@/lib/layout";

/**
 * 03 / How we work — a heading frame over the House of CP wall, then four step frames in a
 * row (stacked on mobile) while the woman walks to the doorway. A hairline draws through
 * the row as the steps arrive.
 */
export function ProcessSection() {
  const row = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = row.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      el.dataset.drawn = "true";
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.drawn = "true";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="process" aria-labelledby="process-title" className="relative" style={{ height: `${sectionVh("process")}svh` }}>
      <GlassFrame label="03 / How we work" side={FRAMES.processIntro.side} tone={FRAMES.processIntro.tone} top={anchorTop.processIntro()}>
        <h2 id="process-title" className="gf-item display text-[clamp(2.25rem,3.6vw,3.5rem)] leading-[0.92]">
          How we work
        </h2>
        <div className="gf-item my-6 h-px bg-hairline" aria-hidden="true" />
        <p className="gf-item serif-italic text-[clamp(1.35rem,1.8vw,1.65rem)] leading-tight">{PROCESS.title}</p>
      </GlassFrame>

      <div
        className="absolute inset-x-4 -translate-y-1/2 md:inset-x-[var(--gutter)] lg:left-1/2 lg:right-auto lg:w-[min(1180px,88vw)] lg:-translate-x-1/2"
        style={{ top: anchorTop.processSteps() }}
      >
        {/* mobile: steps spaced ~28svh apart so they pass one or two at a time and the
            footage is never covered; desktop: one row */}
        <ol ref={row} className="process-row relative grid gap-[28svh] md:grid-cols-4 md:gap-4" data-drawn="false">
          {/* connecting hairline: horizontal across the tops on desktop, vertical on mobile */}
          <span aria-hidden="true" className="process-line pointer-events-none absolute bg-copper" />
          {PROCESS.steps.map((s, i) => (
            <li key={s.title} className="relative">
              <GlassFrame size="step" tone={FRAMES.processSteps.tone} delay={i * 140}>
                <p className="gf-item mono-label text-paper/90">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="gf-item display mt-4 text-[7.4vw] leading-none md:text-[clamp(1.1rem,1.45vw,1.75rem)]">{s.title}</h3>
                <p className="gf-item mt-3 text-[15px] leading-relaxed text-paper/90">{s.body}</p>
              </GlassFrame>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
