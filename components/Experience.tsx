"use client";

import { useCallback, useEffect, useState } from "react";
import { bindScrollStore, restoreToSection, restoreToTime, scroll } from "@/lib/scroll";
import { timeAt } from "@/lib/choreography";
import { activeEngine } from "@/lib/scrub";
import { loading } from "@/lib/loading";
import { telemetry } from "@/lib/telemetry";
import { takeReturnTime } from "@/lib/return";
import { useReducedMotion } from "@/lib/hooks";
import { sectionVh } from "@/lib/layout";
import { ScrubVideo } from "@/components/scrub/ScrubVideo";
import { StillBackdrop } from "@/components/scrub/StillBackdrop";
import { Preloader } from "@/components/scrub/Preloader";
import { HeroOverlay } from "@/components/sections/HeroOverlay";
import { AboutSection } from "@/components/sections/AboutSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { Footer } from "@/components/Footer";
import { ProgressRail } from "@/components/ProgressRail";
import { FloorPlan } from "@/components/FloorPlan";
import { DebugOverlay } from "@/components/DebugOverlay";

/**
 * The home page: the walkthrough is a fixed background moving with document scroll;
 * glass frames scroll over it in normal flow. Section heights (lib/layout.ts) keep the
 * page-height-per-second constant, so scroll position ∝ video time throughout.
 */
export function Experience() {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);

  // load progress goes to an external store the Preloader subscribes to (lib/loading.ts),
  // so the download never re-renders this tree
  const onProgress = useCallback((f: number) => loading.set(f), []);
  const onReady = useCallback(() => setReady(true), []);
  const onLift = useCallback(() => setEntered(true), []);

  useEffect(() => {
    const unbind = bindScrollStore();
    // Back from a service page (or ?s=slug): jump to that frame's moment before the engine
    // starts, so the first frame shown is already the right one
    const t = takeReturnTime();
    const hash = window.location.hash.slice(1);
    if (t !== null) restoreToTime(t, () => activeEngine.current?.snap(t));
    // "/#process" from another page: same retry, then show that moment without fast-forwarding
    else if (hash && document.getElementById(hash))
      restoreToSection(hash, () => activeEngine.current?.snap(timeAt(scroll.get().p)));
    // test hook for scripts/verify-*.mjs: always in dev, opt-in with ?cp-test in production
    if (process.env.NODE_ENV !== "production" || window.location.search.includes("cp-test"))
      Object.assign(window, { __cp: { scroll, telemetry } });
    return unbind;
  }, []);

  return (
    <>
      {/* reduced motion: no video download; the curtain lifts as soon as fonts are in */}
      <Preloader instant={reduced === true} ready={reduced === true || ready} onLift={onLift} />
      {reduced === null ? null : reduced ? (
        <StillBackdrop />
      ) : (
        <ScrubVideo onProgress={onProgress} onReady={onReady} />
      )}

      <main id="main" className="relative z-20">
        <section id="hero" aria-labelledby="hero-title" className="relative" style={{ height: `${sectionVh("hero")}svh` }}>
          <HeroOverlay entered={entered} />
        </section>
        {STATIC_SECTIONS}
      </main>
      <FloorPlan visible={entered} />
      {STATIC_CHROME}
    </>
  );
}

// Hoisted elements keep the same identity across renders, so when `ready` / `entered`
// change React skips these subtrees instead of re-rendering the whole page (twice) while
// the curtain lifts — the biggest chunk of main-thread time on a throttled phone.
const STATIC_SECTIONS = (
  <>
    <AboutSection />
    <ServicesSection />
    <ProcessSection />
    <ContactSection />
  </>
);
const STATIC_CHROME = (
  <>
    <Footer />
    <ProgressRail />
    {process.env.NODE_ENV !== "production" && <DebugOverlay />}
  </>
);
