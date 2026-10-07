"use client";

import { useEffect, useRef } from "react";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";

/**
 * Small paper dot that follows the pointer and grows to 64px with "View" over anything
 * marked data-cursor="view" (service buttons). Fine pointers only; off for reduced motion.
 */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const dot = useRef<HTMLDivElement>(null);
  const enabled = fine === true && reduced === false;

  useEffect(() => {
    if (!enabled) return;
    const el = dot.current!;
    let x = -100,
      y = -100,
      cx = x,
      cy = y,
      raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const view = (e.target as Element | null)?.closest?.('[data-cursor="view"]');
      el.dataset.view = view ? "true" : "false";
      el.style.opacity = "1";
    };
    const leave = () => (el.style.opacity = "0");
    const loop = () => {
      cx += (x - cx) * 0.25;
      cy += (y - cy) * 0.25;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div ref={dot} aria-hidden="true" className="cursor pointer-events-none fixed left-0 top-0 z-[70] opacity-0" data-view="false">
      <span className="cursor-dot">
        <span className="cursor-label mono-label">View</span>
      </span>
    </div>
  );
}
