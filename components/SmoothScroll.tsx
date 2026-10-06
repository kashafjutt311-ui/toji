"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stage, startLenis, stopLenis } from "@/lib/scroll";

/** Mounts Lenis once for the whole app and keeps ScrollTrigger in sync with it. */
export function SmoothScroll() {
  useEffect(() => {
    const lenis = startLenis();
    lenis?.on("scroll", (l: { velocity: number }) => {
      // velocity is read in rAF by the headline stretch; no need to notify
      stage.get().velocity = l.velocity;
    });
    document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => stopLenis();
  }, []);
  return null;
}
