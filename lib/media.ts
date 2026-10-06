"use client";

import { VIDEO } from "./choreography";

export const MOBILE_QUERY = "(max-width: 768px)";

export function isMobileViewport() {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;
}

/** Pick the one source this browser should download (mp4 first, webm if h264 is unsupported). */
export function pickSource(mobile: boolean): string {
  if (mobile) return VIDEO.sources.mobile[0].src;
  const probe = document.createElement("video");
  for (const s of VIDEO.sources.desktop) {
    if (probe.canPlayType(s.type)) return s.src;
  }
  return VIDEO.sources.desktop[0].src;
}

/**
 * Downloads the whole scrub file into a blob URL, reporting 0–1 progress.
 * Scrubbing from memory means every seek is local — no range requests, no stalls
 * when the user flings to the end. Falls back to the plain URL if streaming fails.
 */
export async function loadVideoBlob(
  src: string,
  onProgress: (f: number) => void,
  signal?: AbortSignal,
): Promise<string> {
  try {
    const res = await fetch(src, { signal });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    const total = Number(res.headers.get("content-length")) || 0;
    const reader = res.body.getReader();
    const chunks: BlobPart[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value as BlobPart);
      received += value.byteLength;
      if (total) onProgress(received / total);
    }
    onProgress(1);
    const type = src.endsWith(".webm") ? "video/webm" : "video/mp4";
    return URL.createObjectURL(new Blob(chunks, { type }));
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    onProgress(1);
    return src;
  }
}

export function once<K extends keyof HTMLMediaElementEventMap>(el: HTMLMediaElement, ev: K) {
  return new Promise<void>((resolve) => {
    // readyState already past the event?
    if (ev === "loadedmetadata" && el.readyState >= 1) return resolve();
    if (ev === "canplaythrough" && el.readyState >= 4) return resolve();
    el.addEventListener(ev, () => resolve(), { once: true });
  });
}
