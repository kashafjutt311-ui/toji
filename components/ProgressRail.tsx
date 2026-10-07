"use client";

import { useRef, useState } from "react";
import { SECTIONS, sectionAt, timeAt, type SectionId } from "@/lib/choreography";
import { useScrollState } from "@/lib/hooks";
import { scroll } from "@/lib/scroll";

/** Thin rail at the right edge; ticks scroll to each section's top. Hidden on mobile. */
export function ProgressRail() {
  const [active, setActive] = useState<SectionId>("hero");
  const fill = useRef<HTMLSpanElement>(null);

  useScrollState(({ y, p, videoSpan }) => {
    const id = y >= videoSpan - 4 ? "contact" : sectionAt(timeAt(p));
    setActive((prev) => (prev === id ? prev : id));
    if (fill.current) fill.current.style.transform = `scaleY(${p})`;
  });

  return (
    <nav
      aria-label="Page sections"
      className="fixed right-[calc(var(--gutter)/2)] top-1/2 z-30 hidden -translate-y-1/2 md:block"
    >
      <span aria-hidden="true" className="absolute bottom-0 right-[5px] top-0 w-px bg-paper/20">
        <span ref={fill} className="absolute inset-0 origin-top bg-paper/60" style={{ transform: "scaleY(0)" }} />
      </span>
      <ol className="relative flex flex-col gap-7">
        {SECTIONS.map((s) => {
          const on = s.id === active;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => scroll.scrollToSection(s.id)}
                aria-current={on ? "location" : undefined}
                className="group flex items-center justify-end gap-3"
              >
                <span
                  className={`mono-label bg-ink/75 px-1.5 py-0.5 text-paper transition-opacity duration-300 ${
                    on ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                  }`}
                >
                  {s.rail}
                </span>
                <span
                  aria-hidden="true"
                  className={`block size-[11px] border transition-colors duration-300 ${
                    on ? "border-copper bg-copper" : "border-paper/70 bg-ink/40 group-hover:border-paper"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
