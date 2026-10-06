"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stageVh } from "@/lib/choreography";
import { stage } from "@/lib/scroll";
import { telemetry } from "@/lib/telemetry";
import { ScrubVideo } from "@/components/scrub/ScrubVideo";
import { Preloader } from "@/components/scrub/Preloader";
import { HeroBeat } from "@/components/beats/HeroBeat";
import { DebugOverlay } from "@/components/DebugOverlay";

/**
 * The single-page scroll experience: a fixed scrubbed video, one tall pinned stage whose
 * progress drives every beat, then normal-flow content that scrolls up over the video.
 */
export function Experience() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);

  // throttle preloader updates to whole percents
  const onProgress = useCallback((f: number) => {
    setProgress((prev) => (Math.floor(f * 100) !== Math.floor(prev * 100) ? f : prev));
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  const onDone = useCallback(() => setEntered(true), []);

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: stageRef.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => stage.set({ p: self.progress }),
      onRefresh: (self) => stage.set({ p: self.progress, stageTop: self.start, stageLength: self.end - self.start }),
    });
    // hook for scripts/verify-scrub.mjs
    if (process.env.NODE_ENV !== "production") Object.assign(window, { __cp: { stage, telemetry } });
    return () => st.kill();
  }, []);

  const vars = {
    "--stage-d": `${stageVh(false)}svh`,
    "--stage-m": `${stageVh(true)}svh`,
  } as CSSProperties;

  return (
    <>
      <Preloader progress={progress} ready={ready} onDone={onDone} />
      <ScrubVideo onProgress={onProgress} onReady={onReady} />

      <main id="main" className="relative z-10">
        <div ref={stageRef} style={vars} className="relative h-[var(--stage-m)] md:h-[var(--stage-d)]">
          <div className="sticky top-0 h-svh overflow-clip">
            <HeroBeat entered={entered} />
          </div>
        </div>
      </main>

      {process.env.NODE_ENV !== "production" && <DebugOverlay />}
    </>
  );
}
