# Concept Plus

A scroll-driven walkthrough: the 2:25 film of the Concept Plus house is a fixed background
that moves forward as you scroll, and the content scrolls over it in simple glass frames.

Next.js 16 (App Router) · TypeScript · Tailwind 4 · GSAP · Lenis.

## Run

```bash
npm install
npm run dev            # http://localhost:3000   (press D for the debug overlay)
npm run build && npm start
```

The source film (`assets/source/CPV14.mp4`) is not in git. Put it there before re-encoding.

## Scripts

| Command | What it does |
|---|---|
| `bash scripts/encode.sh` | Re-encodes the film into `public/video/` (`scrub.mp4`, `scrub.webm`, `scrub-m.mp4`, `scrub-m.webm`, posters). Settings and sizes go to `public/video/ENCODE_LOG.txt`. |
| `bash scripts/frames.sh stills` | Extracts the service-page stills and reduced-motion stills into `public/frames/`. |
| `bash scripts/frames.sh sequence` | Extracts the WebP frame sequence for the canvas fallback (large, not committed). |
| `node scripts/verify-glass.mjs [--mobile]` | Acceptance checks: section screenshots, contrast of every glass frame against the real footage, coverage, scroll FPS, service button → page → Back. Needs a running server. |
| `node scripts/fps.mjs [--mobile]` | Scroll FPS in Google Chrome, with and without `backdrop-filter`. |
| `node scripts/profile-load.mjs` | Throttled (4× CPU) mobile load in Edge: long tasks, TBT, top functions. |
| `bash scripts/lighthouse.sh` | Lighthouse ×3 per page in Chrome, keeps the median in `lighthouse/`. |

The verify scripts drive the page through `window.__cp`, which exists in dev builds and in
production only when the URL has `?cp-test`.

## How the scroll maps to the film

`progress = scrollY / top of #contact`, so the film plays across everything above the
Contact section, which then holds on the last frame while the footer scrolls up. The page is
built at a constant **`VH_PER_SECOND`** of height per second of footage (`lib/layout.ts`), so
the walk moves at the same speed everywhere and never jumps at a section boundary. The last
3% of the scroll eases into the final frame (`SCRUB.endEase`).

## How to retime a beat

Everything time-related lives in two files; components never hold timestamps.

- **`lib/choreography.ts`** (seconds into the film)
  - `SECTIONS`: which stretch of footage each section sits over. Section heights follow.
  - `FRAME_AT`: the moment each glass frame's centre crosses the middle of the screen.
    To make Hospitality's frame arrive later, raise `FRAME_AT.services.hospitality`.
  - `SERVICE_TIMES`: when each service is "active" in the index list (and its still).
  - `HERO`: the wordmark/monogram sub-timeline, as fractions of the hero's height.
- **`lib/layout.ts`** (page geometry)
  - `VH_PER_SECOND`: overall walking speed. Higher = more scrolling per second of film.
  - `CONTACT_VH`: how long the last frame holds before the footer.
  - `FRAMES`: which side each frame sits on, and its glass tone (`bright` = stronger tint
    for pale footage). After changing a time or a tone, re-run
    `node scripts/verify-glass.mjs` and check every frame still passes 4.5:1.

Use the debug overlay (`D` in dev) to read the current film time while scrolling, then
copy the number into `FRAME_AT`.

See `DECISIONS.md` for what was decided and why.
