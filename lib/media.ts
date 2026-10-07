"use client";

import { VIDEO } from "./choreography";

export const MOBILE_QUERY = "(max-width: 768px)";

export function isMobileViewport() {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;
}

/** Pick the one source this browser should download (mp4 first, webm if h264 is unsupported). */
export function pickSource(mobile: boolean): string {
  const list = mobile ? VIDEO.sources.mobile : VIDEO.sources.desktop;
  const probe = document.createElement("video");
  for (const s of list) {
    if (probe.canPlayType(s.type)) return s.src;
  }
  return list[0].src;
}

/**
 * Downloads the whole scrub file into a blob URL, reporting 0–1 progress.
 * Scrubbing from memory means every seek is local — no range requests, no stalls
 * when the user flings to the end. Falls back to the plain URL if streaming fails.
 */
const blobCache = new Map<string, string>();

export async function loadVideoBlob(
  src: string,
  onProgress: (f: number) => void,
  signal?: AbortSignal,
): Promise<string> {
  // one download per session: client-side navigations back to "/" reuse the blob
  const hit = blobCache.get(src);
  if (hit) {
    onProgress(1);
    return hit;
  }
  try {
    const res = await fetch(src, { signal });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    const total = Number(res.headers.get("content-length")) || 0;
    let received = 0;
    // count bytes in flight and let the browser assemble the blob: holding every chunk in
    // a JS array until the end promoted ~11 MB to old space and cost a ~200 ms major GC
    const counted = res.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, ctrl) {
          received += chunk.byteLength;
          if (total) onProgress(received / total);
          ctrl.enqueue(chunk);
        },
      }),
    );
    const type = src.endsWith(".webm") ? "video/webm" : "video/mp4";
    const blob = await new Response(counted, { headers: { "content-type": type } }).blob();
    onProgress(1);
    const url = URL.createObjectURL(blob);
    blobCache.set(src, url);
    return url;
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
