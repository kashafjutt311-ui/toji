"use client";

import { useEffect, useRef, useState } from "react";
import { SEQUENCE, timeAt, VIDEO } from "@/lib/choreography";
import { scroll } from "@/lib/scroll";
import { isMobileViewport, loadVideoBlob, once, pickSource } from "@/lib/media";
import { useIsMobile } from "@/lib/hooks";
import {
  ScrubEngine,
  SequenceRenderer,
  VideoRenderer,
  canvasMode,
  isIOS,
  STUTTER_MS,
  type Renderer,
} from "@/lib/scrub";
import { telemetry } from "@/lib/telemetry";

interface Props {
  /** 0–1 load progress for the preloader */
  onProgress: (f: number) => void;
  /** first frame is on screen and the engine is bound to scroll */
  onReady: () => void;
}

/**
 * Fixed, full-viewport scrubbed video. Never calls play(): scroll progress → target time
 * → lerped current time → video.currentTime (or a canvas frame in sequence mode).
 */
export function ScrubVideo({ onProgress, onReady }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"video" | "canvas">("video");
  const mobile = useIsMobile();
  const cb = useRef({ onProgress, onReady });
  useEffect(() => {
    cb.current = { onProgress, onReady };
  });

  // the source is picked once per page load (rotating a phone doesn't re-download), so the
  // effect keys on "viewport known", not on the value
  const known = mobile !== null;
  useEffect(() => {
    if (!known) return;
    const mobile = isMobileViewport();
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    const ac = new AbortController();
    let engine: ScrubEngine | null = null;
    let stutterTimer = 0;
    const target = () => timeAt(scroll.get().p);
    const onFrame = (t: number) => {
      telemetry.time = t;
      telemetry.target = target();
    };

    const startCanvas = async (onP?: (f: number) => void): Promise<Renderer | null> => {
      try {
        const r = await SequenceRenderer.create(canvas, onP);
        setMode("canvas");
        telemetry.mode = "canvas";
        return r;
      } catch {
        return null; // no sequence deployed → stay on video
      }
    };

    (async () => {
      const m = canvasMode();
      // forced canvas (flag / ?canvas=1): skip the video download entirely
      if (m === "on") {
        const r = await startCanvas((f) => cb.current.onProgress(f));
        if (r && !ac.signal.aborted) {
          engine = new ScrubEngine(r, target, onFrame);
          engine.start();
          cb.current.onProgress(1);
          cb.current.onReady();
          return;
        }
      }

      const src = pickSource(mobile);
      telemetry.source = src;
      const blobUrl = await loadVideoBlob(src, (f) => cb.current.onProgress(f * 0.95), ac.signal);
      if (ac.signal.aborted) return;
      video.src = blobUrl;
      video.load();
      await once(video, "loadedmetadata");
      const renderer = new VideoRenderer(video);
      engine = new ScrubEngine(renderer, target, onFrame);
      engine.start();
      await once(video, "canplaythrough");
      if (ac.signal.aborted) return;
      cb.current.onProgress(1);
      telemetry.mode = "video";
      cb.current.onReady();

      // auto mode: watch real seek latency; iOS Safari often stalls on currentTime writes
      if (m === "auto") {
        stutterTimer = window.setInterval(async () => {
          const med = renderer.medianLatency();
          telemetry.latency = med;
          if (med === null) return;
          if (SEQUENCE.deployed && (med > STUTTER_MS || (isIOS() && med > STUTTER_MS * 0.6))) {
            window.clearInterval(stutterTimer);
            const r = await startCanvas();
            if (r && engine) {
              engine.setRenderer(r);
              engine.snap(target());
            }
          }
        }, 1500);
      }
    })().catch((e) => {
      if ((e as Error).name !== "AbortError") console.error("[scrub]", e);
    });

    return () => {
      ac.abort();
      window.clearInterval(stutterTimer);
      engine?.destroy();
      // the blob URL is kept for the session (lib/media.ts) so Back from a service page is instant
    };
  }, [known]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 bg-ink" aria-hidden="true">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        style={{ visibility: mode === "video" ? "visible" : "hidden" }}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        tabIndex={-1}
        poster={mobile === null ? undefined : mobile ? VIDEO.poster.mobile : VIDEO.poster.desktop}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ visibility: mode === "canvas" ? "visible" : "hidden" }}
      />
    </div>
  );
}
