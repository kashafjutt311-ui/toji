"use client";

import { useEffect } from "react";
import { startLenis, stopLenis } from "@/lib/scroll";

/** Mounts Lenis once for the whole app, after hydration (smoothing only; never traps scroll). */
export function SmoothScroll() {
  useEffect(() => {
    void startLenis();
    return () => stopLenis();
  }, []);
  return null;
}
