"use client";

import { useState } from "react";
import { stillAt, timeAt } from "@/lib/choreography";
import { useScrollState } from "@/lib/hooks";

/**
 * prefers-reduced-motion: no scrub. A still from the footage sits behind each section and
 * crossfades (300ms) when the section changes.
 */
export function StillBackdrop() {
  const [layers, setLayers] = useState<{ a: string; b: string; top: "a" | "b" }>({
    a: stillAt(0),
    b: stillAt(0),
    top: "a",
  });

  useScrollState(({ p }) => {
    const src = stillAt(timeAt(p));
    setLayers((l) => {
      const current = l.top === "a" ? l.a : l.b;
      if (src === current) return l;
      return l.top === "a" ? { ...l, b: src, top: "b" } : { ...l, a: src, top: "a" };
    });
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-0 bg-ink" aria-hidden="true">
      {(["a", "b"] as const).map((k) => (
        // eslint-disable-next-line @next/next/no-img-element -- full-bleed decorative still, swapped on scroll
        <img
          key={k}
          src={layers[k]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          style={{ opacity: layers.top === k ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
