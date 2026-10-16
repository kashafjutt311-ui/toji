"use client";

import { useEffect, useRef, useState } from "react";
import { LOGO_PATH, LOGO_VIEWBOX } from "@/components/brand/logo-path";
import { FLOOR_PLAN, placeAt, timeAt } from "@/lib/choreography";
import { scroll } from "@/lib/scroll";
import { telemetry } from "@/lib/telemetry";
import { useIsMobile } from "@/lib/hooks";

/**
 * "You are here" map. The house is CP-shaped (the film shows it from above at 0:04), so the
 * plan is the traced monogram with the walking route drawn through the C, then the P, out
 * through the foot of the P into the courtyard. The dot follows the film's own playhead
 * (the smoothed time the scrub engine shows), so it moves exactly with the picture.
 */
export function FloorPlan({ visible }: { visible: boolean }) {
  // open by default on desktop, closed on phones, until the visitor toggles it
  const isMobile = useIsMobile();
  const [choice, setChoice] = useState<boolean | null>(null);
  const open = choice ?? isMobile === false;
  const [place, setPlace] = useState(() => placeAt(0));
  const [hidden, setHidden] = useState(false);
  const route = useRef<SVGPathElement>(null);
  const trail = useRef<SVGPathElement>(null);
  const dot = useRef<SVGGElement>(null);

  useEffect(() => {
    let raf = 0;
    let lastPlace = "";
    let lastHidden = false;
    const len = route.current!.getTotalLength();
    trail.current!.style.strokeDasharray = `${len}`;
    const loop = () => {
      const s = scroll.get();
      const t = telemetry.mode === "loading" ? timeAt(s.p) : telemetry.time;
      const [a, b] = FLOOR_PLAN.walk;
      const u = Math.min(1, Math.max(0, (t - a) / (b - a)));
      const pt = route.current!.getPointAtLength(u * len);
      dot.current!.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      trail.current!.style.strokeDashoffset = `${(len * (1 - u)).toFixed(1)}`;
      const p = placeAt(t);
      if (p !== lastPlace) setPlace((lastPlace = p));
      // step aside once the footer comes up
      const h = s.y > s.videoSpan + window.innerHeight * 0.5;
      if (h !== lastHidden) setHidden((lastHidden = h));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const show = visible && !hidden;

  return (
    <aside
      aria-label="Floor plan"
      className={`fixed bottom-[var(--gutter)] right-[calc(var(--gutter)+28px)] z-30 w-[184px] overflow-hidden rounded-[14px] border border-hairline bg-[rgba(14,14,14,0.62)] text-paper backdrop-blur-[14px] transition-[opacity,translate] duration-700 ease-[var(--ease-out)] max-md:right-[var(--gutter)] max-md:w-[156px] ${
        show ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <div
        id="floor-plan-body"
        className={`grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out)] ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-3 pt-5">
            <svg viewBox={LOGO_VIEWBOX} className="mx-auto block w-full max-w-[124px]" role="img" aria-label={`Floor plan of the house. You are in: ${place}.`}>
              <path d={LOGO_PATH} fillRule="evenodd" fill="#8C8A85" fillOpacity={0.55} />
              {/* the whole route, dashed; then the part already walked, solid copper */}
              <path
                ref={route}
                d={FLOOR_PLAN.route}
                fill="none"
                stroke="var(--copper)"
                strokeOpacity={0.55}
                strokeWidth={9}
                strokeDasharray="14 16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                ref={trail}
                d={FLOOR_PLAN.route}
                fill="none"
                stroke="var(--copper)"
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <g ref={dot}>
                <circle r={30} fill="var(--glow)" opacity={0.25} className="animate-pulse" />
                <circle r={17} fill="var(--glow)" stroke="var(--ink)" strokeWidth={4} />
              </g>
            </svg>
            <p className="mono-label mt-3 text-center text-[10px] text-paper/60 md:text-[10px]">You are here</p>
            <p className="mono-label truncate text-center text-copper" aria-hidden="true">
              {place}
            </p>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setChoice(!open)}
        aria-expanded={open}
        aria-controls="floor-plan-body"
        className="mono-label flex w-full items-center justify-center gap-2 border-t border-hairline px-4 py-3 text-paper/90 transition-colors hover:text-paper"
      >
        Floor plan
        <svg viewBox="0 0 12 12" className={`size-3 transition-transform duration-500 ${open ? "" : "rotate-180"}`} aria-hidden="true">
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
    </aside>
  );
}
