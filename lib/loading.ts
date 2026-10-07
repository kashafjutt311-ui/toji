"use client";

import { useSyncExternalStore } from "react";

/**
 * Load progress (0–1) for the preloader. Kept outside React state on purpose: if it lived
 * in <Experience>, every percent of the video download would re-render the whole page.
 */
let value = 0;
const listeners = new Set<() => void>();

export const loading = {
  set(v: number) {
    // whole percents only; never backwards
    const next = Math.max(value, Math.floor(v * 100) / 100);
    if (next === value) return;
    value = next;
    listeners.forEach((l) => l());
  },
  reset() {
    value = 0;
  },
};

export function useLoadProgress(): number {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
    () => value,
    () => 0,
  );
}
