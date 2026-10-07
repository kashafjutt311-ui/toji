"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { scroll, type ScrollState } from "./scroll";

/** matchMedia as external store; `null` on the server and during hydration. */
export function useMediaQuery(query: string): boolean | null {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", notify);
      return () => mql.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => null,
  );
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
export const useIsMobile = () => useMediaQuery("(max-width: 768px)");
export const useFinePointer = () => useMediaQuery("(hover: hover) and (pointer: fine)");

/** Subscribe to scroll/video progress without re-rendering. */
export function useScrollState(cb: (s: ScrollState) => void) {
  const ref = useRef(cb);
  useEffect(() => {
    ref.current = cb;
  });
  useEffect(() => scroll.subscribe((s) => ref.current(s)), []);
}
