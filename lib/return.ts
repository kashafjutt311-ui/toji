"use client";

/**
 * Back-navigation restore: when a service button is used we remember which frame it came
 * from; when "/" mounts again (browser Back, or the service page's "All services" link
 * with ?s=slug) we jump straight to that frame's moment in the walk.
 */
import { FRAME_AT, type ServiceSlug } from "./choreography";

const KEY = "cp:return";
const MAX_AGE = 30 * 60 * 1000;

export function rememberService(slug: ServiceSlug) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ slug, at: Date.now() }));
  } catch {}
}

/** Video time to restore to, or null. Consumes the stored value and the ?s= param. */
export function takeReturnTime(): number | null {
  let slug: string | null = null;
  const url = new URL(window.location.href);
  if (url.searchParams.get("s")) {
    slug = url.searchParams.get("s");
    url.searchParams.delete("s");
    url.searchParams.delete("from");
    history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  }
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!slug && raw) {
      const v = JSON.parse(raw) as { slug: string; at: number };
      if (Date.now() - v.at < MAX_AGE) slug = v.slug;
    }
  } catch {}
  if (slug && slug in FRAME_AT.services) return FRAME_AT.services[slug as ServiceSlug];
  return null;
}
