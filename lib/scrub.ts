"use client";

/**
 * Video-scrub engine. Framework-agnostic: give it a target-time getter and a renderer.
 *
 *   rAF:  current += (target - current) * LERP
 *         if |current - lastWritten| > MIN_DELTA → renderer.seek(current)
 *
 * Two renderers:
 *   - VideoRenderer: writes video.currentTime (never calls play()). Skips writes while a
 *     seek is in flight so seeks never queue up behind each other.
 *   - SequenceRenderer: draws a pre-extracted WebP frame onto a <canvas>; frames are
 *     fetched lazily in chunks around the playhead (iOS fallback / USE_CANVAS_SEQUENCE).
 */
import { SCRUB, SEQUENCE } from "./choreography";

export interface Renderer {
  seek(t: number): void;
  /** true while the renderer can't accept a new seek yet */
  busy(): boolean;
  destroy(): void;
}

/** The live engine, so a programmatic jump (Back-restore) can snap instead of lerping. */
export const activeEngine: { current: ScrubEngine | null } = { current: null };

export class ScrubEngine {
  private current = 0;
  private written = -1;
  private raf = 0;
  private running = false;

  constructor(
    private renderer: Renderer,
    private target: () => number,
    private onFrame?: (current: number) => void,
  ) {}

  start(initial = this.target()) {
    activeEngine.current = this;
    this.current = initial;
    this.renderer.seek(initial);
    this.written = initial;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      const t = this.target();
      this.current += (t - this.current) * SCRUB.lerp;
      if (Math.abs(t - this.current) < 1e-4) this.current = t;
      if (Math.abs(this.current - this.written) > SCRUB.minDelta && !this.renderer.busy()) {
        this.renderer.seek(this.current);
        this.written = this.current;
      }
      this.onFrame?.(this.current);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  /** Jump without easing (e.g. after programmatic navigation). */
  snap(t: number) {
    this.current = t;
    this.renderer.seek(t);
    this.written = t;
  }

  get time() {
    return this.current;
  }

  setRenderer(r: Renderer) {
    this.renderer.destroy();
    this.renderer = r;
    this.written = -1;
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    if (activeEngine.current === this) activeEngine.current = null;
    this.stop();
    this.renderer.destroy();
  }
}

// ---------------------------------------------------------------------------

export class VideoRenderer implements Renderer {
  private seeking = false;
  private seekStart = 0;
  /** rolling seek latencies (ms) for stutter detection */
  readonly latencies: number[] = [];
  private hasRVFC: boolean;
  private record(ms: number) {
    this.latencies.push(ms);
    if (this.latencies.length > 30) this.latencies.shift();
  }
  private onSeeked = () => {
    this.seeking = false;
    if (!this.hasRVFC) this.record(performance.now() - this.seekStart);
  };
  // NOTE: without rVFC (old Safari) every seek is recorded; jumps are rare enough there.

  constructor(readonly video: HTMLVideoElement) {
    video.addEventListener("seeked", this.onSeeked);
    this.hasRVFC = "requestVideoFrameCallback" in video;
  }

  private lastT = 0;

  seek(t: number) {
    const max = (this.video.duration || 0) - 0.001;
    this.seeking = true;
    const start = (this.seekStart = performance.now());
    // only ordinary scrub steps count toward stutter detection; a deliberate jump of
    // many seconds (rail click, Back-restore) is legitimately slower and says nothing
    const small = Math.abs(t - this.lastT) < 0.5;
    this.lastT = t;
    this.video.currentTime = Math.max(0, Math.min(t, max > 0 ? max : t));
    // latency until the sought frame is actually composited — what the user perceives
    if (this.hasRVFC && small) this.video.requestVideoFrameCallback((now) => this.record(now - start));
  }

  busy() {
    // guard against a lost 'seeked' event wedging the engine
    if (this.seeking && performance.now() - this.seekStart > 250) this.seeking = false;
    return this.seeking;
  }

  /** median seek latency in ms, or null with too few samples */
  medianLatency(): number | null {
    if (this.latencies.length < 8) return null;
    const s = [...this.latencies].sort((a, b) => a - b);
    return s[s.length >> 1];
  }

  destroy() {
    this.video.removeEventListener("seeked", this.onSeeked);
  }
}

// ---------------------------------------------------------------------------

interface SequenceManifest {
  fps: number;
  width: number;
  count: number;
  chunk: number;
}

export class SequenceRenderer implements Renderer {
  private frames: (HTMLImageElement | null)[] = [];
  private loadedChunks = new Set<number>();
  private manifest!: SequenceManifest;
  private ctx: CanvasRenderingContext2D;
  private lastDrawn = -1;
  private want = 0;

  private constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
  }

  static async create(canvas: HTMLCanvasElement, onProgress?: (f: number) => void) {
    const r = new SequenceRenderer(canvas);
    r.manifest = await fetch(`${SEQUENCE.dir}/manifest.json`).then((res) => res.json());
    r.frames = new Array(r.manifest.count).fill(null);
    // first chunk must be ready before reveal; the rest stream in around the playhead
    await r.loadChunk(0, onProgress);
    r.resize();
    window.addEventListener("resize", r.resize);
    return r;
  }

  private src(i: number) {
    return `${SEQUENCE.dir}/${String(i).padStart(5, "0")}.webp`;
  }

  private loadChunk(c: number, onProgress?: (f: number) => void): Promise<void> {
    const { chunk, count } = this.manifest;
    if (this.loadedChunks.has(c) || c < 0 || c * chunk >= count) return Promise.resolve();
    this.loadedChunks.add(c);
    const jobs: Promise<void>[] = [];
    let done = 0;
    const end = Math.min(count, (c + 1) * chunk);
    for (let i = c * chunk; i < end; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = this.src(i);
      jobs.push(
        img
          .decode()
          .catch(() => {})
          .then(() => {
            this.frames[i] = img;
            onProgress?.(++done / (end - c * chunk));
            if (i === this.want) this.draw(i);
          }),
      );
    }
    return Promise.all(jobs).then(() => {});
  }

  private resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.round(this.canvas.clientHeight * dpr);
    this.lastDrawn = -1;
    this.draw(this.want);
  };

  private draw(i: number) {
    // nearest loaded frame so fast scrolls never show black
    let j = i;
    for (let d = 0; d < this.manifest.chunk && !this.frames[j]; d++) {
      j = this.frames[i - d] ? i - d : i + d;
    }
    const img = this.frames[j];
    if (!img || j === this.lastDrawn) return;
    const { width: cw, height: ch } = this.canvas;
    // object-fit: cover
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    this.lastDrawn = j;
  }

  seek(t: number) {
    const { fps, count, chunk } = this.manifest;
    const i = Math.max(0, Math.min(count - 1, Math.round(t * fps)));
    this.want = i;
    const c = Math.floor(i / chunk);
    void this.loadChunk(c);
    void this.loadChunk(c + 1);
    void this.loadChunk(c - 1);
    this.draw(i);
  }

  busy() {
    return false;
  }

  destroy() {
    window.removeEventListener("resize", this.resize);
    this.frames = [];
  }
}

// ---------------------------------------------------------------------------

/** iPhone/iPad Safari, including iPadOS reporting as Mac. */
export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * USE_CANVAS_SEQUENCE: build-time env flag, or ?canvas=1 / ?canvas=0 in the URL for testing.
 * "auto" (default) = video first, switch to canvas if seeks stutter.
 */
export function canvasMode(): "on" | "off" | "auto" {
  if (typeof window !== "undefined") {
    const q = new URLSearchParams(window.location.search).get("canvas");
    if (q === "1") return "on";
    if (q === "0") return "off";
  }
  const env = process.env.NEXT_PUBLIC_USE_CANVAS_SEQUENCE;
  if (env === "1" || env === "true") return "on";
  if (env === "0" || env === "false") return "off";
  return "auto";
}

/** Seeks slower than this (median, ms) count as stutter → switch to the canvas path. */
export const STUTTER_MS = 90;
