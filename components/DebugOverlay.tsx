"use client";

import { useEffect, useRef, useState } from "react";
import { sectionAt, serviceAt, timeAt } from "@/lib/choreography";
import { scroll } from "@/lib/scroll";
import { telemetry } from "@/lib/telemetry";

const fmt = (t: number) => {
  const m = Math.floor(t / 60);
  return `${m}:${(t - m * 60).toFixed(2).padStart(5, "0")}`;
};

/** Dev-only HUD, toggle with "D": scroll progress, video time, active beat, renderer. */
export function DebugOverlay() {
  const [on, setOn] = useState(false);
  const pre = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if (e.key === "d" || e.key === "D") setOn((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!on) return;
    let raf = 0;
    let last = performance.now();
    let fps = 60;
    const loop = (now: number) => {
      fps = fps * 0.9 + (1000 / Math.max(1, now - last)) * 0.1;
      last = now;
      const s = scroll.get();
      const t = timeAt(s.p);
      if (pre.current)
        pre.current.textContent = [
          `y        ${Math.round(s.y)} / ${Math.round(s.videoSpan)}px`,
          `p        ${s.p.toFixed(4)}   hero ${s.heroP.toFixed(2)}`,
          `section  ${s.y >= s.videoSpan - 4 ? "contact" : sectionAt(t)}${serviceAt(t) ? ` · ${serviceAt(t)}` : ""}`,
          `target   ${fmt(timeAt(s.p))}`,
          `video    ${fmt(telemetry.time)}`,
          `lag      ${(timeAt(s.p) - telemetry.time).toFixed(3)}s`,
          `mode     ${telemetry.mode}`,
          `seek     ${telemetry.latency === null ? "–" : telemetry.latency.toFixed(1) + "ms"} (median)`,
          `velocity ${s.velocity.toFixed(1)}`,
          `fps      ${fps.toFixed(0)}`,
          `src      ${telemetry.source.split("/").pop()}`,
        ].join("\n");
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  if (!on) return null;
  return (
    <pre
      ref={pre}
      data-testid="debug"
      className="pointer-events-none fixed bottom-4 left-4 z-[80] border border-hairline bg-ink/85 p-3 font-mono text-[11px] leading-[1.5] text-paper"
    />
  );
}
