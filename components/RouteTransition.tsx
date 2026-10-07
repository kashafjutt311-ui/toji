"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { getLenis } from "@/lib/scroll";

const DUR = 400;
const EASE = "cubic-bezier(.7,0,.2,1)";

/**
 * Copper wipe between routes. A capture-phase click listener (runs before next/link's own
 * handler) catches same-origin navigations to a *different pathname*, covers the screen,
 * then navigates; when the new pathname commits the wipe lifts off the top.
 * Same-page hash links and modified clicks pass straight through.
 * Web Animations API (no GSAP) because this ships on every page.
 */
export function RouteTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const wipe = useRef<HTMLDivElement>(null);
  const covering = useRef(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      e.preventDefault(); // next/link sees defaultPrevented and stands down
      covering.current = true;
      const anim = wipe.current!.animate([{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)" }], {
        duration: DUR,
        easing: EASE,
        fill: "forwards",
      });
      anim.onfinish = () => router.push(url.pathname + url.search + url.hash, { scroll: false });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // new route committed: reset scroll (unless "/" restores its own), then lift the wipe
  useEffect(() => {
    if (!covering.current) return;
    covering.current = false;
    if (pathname !== "/") {
      getLenis()?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
    }
    wipe.current!.animate([{ clipPath: "inset(0% 0 0 0)" }, { clipPath: "inset(0 0 100% 0)" }], {
      duration: DUR,
      easing: EASE,
      delay: 50,
      fill: "forwards",
    });
  }, [pathname]);

  return <div ref={wipe} className="route-wipe" aria-hidden="true" />;
}
