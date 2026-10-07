# Decisions

Running log of calls made without asking, per the brief. Newest phase at the bottom.

## Phase 1 — scaffold, assets, timing

### Environment
- **Node 24 LTS, ffmpeg 9.0.2, Git 2.55** installed via winget (none were present).
- **Next.js 16.4** (create-next-app latest) with its defaults kept: `cacheComponents` + `partialPrefetching` on.
  Consequences: page `params` is a Promise; URL-dependent content resolves after navigation unless a link
  prefetches with `prefetch={true}` / `router.prefetch()` — used for the service-panel prefetch.
- Project lives in `OneDrive\concept-plus` because that is the workspace. **Recommend moving it out of
  OneDrive** (or pausing sync) — OneDrive syncing `node_modules/` and `.next/` is slow and can cause
  `EPERM` file-lock errors during builds.
- Source video copied to `assets/source/CPV14.mp4` (from `OneDrive\CPV14-720p30-intra-light.mp4`).
  It is git-ignored (97 MB).

### Timestamps (verified against footage — the video is the source of truth)
Contact sheets: `assets/contact/contact-sheet.jpg` (1/5 s) and `s_*.jpg` (1/2 s).

| Brief said | Footage shows | Used |
|---|---|---|
| 0:00–0:12 black void + glowing model | 0:00–0:03 glowing **CP monogram**, 0:04 CP-shaped plan, 0:06–0:11 night exterior | Hero 0–12 s ✓ |
| Lobby "Welcome to Concept Plus" ~0:12 | Entrance 0:12, lobby + CP panel 0:14–0:19 | About starts 12 s ✓ |
| "Orchestrating what endures / We align" | 0:38–0:45, preceded by "A unified ecosystem…" (0:22) and "Everything we do is built around one outcome…" (0:31) | About 12–47 s |
| Services 0:48–2:00 | DEVELOPMENT 0:48 → **SALES & MARKETING 0:58** → REAL ESTATE 1:05 → HOSPITALITY 1:16 → **ART 1:31** → (CP with brushes 1:40) → ACADEMY 1:43–1:53 | Services 47–114 s |
| "House of CP — One house, many possibilities" | 1:54–1:58 | Opens Process |
| Café/Academy/Gallery wall | 2:00–2:06 (Lounge / Café / Academy / Gallery) | Process |
| Woman walks to lit doorway, video ends there | Walk 2:07–2:18; **video continues** through the doorway into a courtyard with a CONCEPT PLUS billboard (2:20–2:25) | Process 114–139 s, Contact 139–145 s, freeze on the billboard |

All ranges live in `lib/choreography.ts`.

### Services
- The video signs six disciplines: **Development, Sales & Marketing, Real Estate, Hospitality, Art, Academy**.
  There is no "Media" sign; "Gallery" and "Café" appear only as *formats* of the house at 2:00.
  → **Six** service pages using the video's names (slugs `development`, `sales-marketing`, `real-estate`,
  `hospitality`, `art`, `academy`). This also makes the brief's own "06 disciplines" counter true.
- Promises are the lines on the walls (e.g. "Transforming intent into built reality.").

### Copy
- Wall text in the video is used verbatim where it exists (About paragraphs @0:40, outcome line @0:31,
  Academy wall @1:44, "One house, many possibilities" @1:55) and marked `// source: video @m:ss`.
- Everything else is placeholder marked `// TODO(copy)`.

### Logo
- No `public/brand/logo.svg` was supplied. Traced from the frame at **0:02.5** (clean, head-on gold outline
  on black) with `scripts/vectorise-logo.mjs` (threshold → region fill → potrace). Not redrawn.
  The knockout where the P crosses the C comes from the outline itself. Replace with the official vector
  when available — the SVG says so in a comment.

### Encoding
- **All-intra could not meet the 40 MB budget.** Measured full-length all-intra H.264: 100 MB (1280/crf24),
  77 MB (1280/crf28), 59 MB (960/crf26); 960/crf28 extrapolates to ~50 MB. The footage is grainy CG and
  intra-only coding spends the bits on grain; a denoise pass (hqdn3d) saved <10%.
- **Chosen: GOP 10, no B-frames** (`-g 10 -keyint_min 10 -bf 0 -sc_threshold 0`), 1280 w, crf 27–28 → ~30 MB,
  visually identical to the source at 100% crop (`scratchpad` comparison). A seek decodes ≤ 9 extra frames;
  because the page loads the whole file into a blob URL first, there are no network range requests on seek,
  and the decode cost is a few ms. `INTRA=1 bash scripts/encode.sh` reproduces the original all-intra spec.
- Mobile: 720 w, GOP 10, crf 28 → ~10 MB (all-intra was ~28 MB, over the 15 MB budget).
- Exact settings that won are logged in `public/video/ENCODE_LOG.txt`.
- The video is **fetched into a blob** with a streamed progress count (the preloader's % is real bytes),
  then attached to `<video>`. Gate = blob complete + `loadedmetadata` + `canplaythrough` + `document.fonts.ready`.
- Service stills are extracted at the native **1280 w**, not 1920 w: the master is 720p, so upscaling
  would add bytes, not detail.

## Change request — forward-moving background with glass frames

Replaces the pinned stage / per-beat overlays. Removed: `components/beats/*`, the pinned
stage, per-beat text timelines, the vignette "gate" and velocity letter-stretch (they belonged
to the pinned design).

### Scroll → film
- Real document scroll. `progress = scrollY / (top of #contact)`; the film plays across
  everything above Contact, which holds on the last frame. This is the brief's
  `scrollY / (docHeight − vh)` with the footer excluded, so the footer never scrubs the film.
- **Constant walking speed:** every section is `footage seconds × VH_PER_SECOND` tall
  (8.4 svh/s, `lib/layout.ts`), so page-height-per-second is identical everywhere. No
  section boundary can make the film speed up or stall; sections with less content than
  footage simply have more transparent space. Frames are positioned *inside* their section
  at the moment they should be centred (`FRAME_AT`).
- End ease: last 3% of progress uses `f(u) = u + u² − u³` (matches slope at the join, zero
  slope at the end), so the film decelerates into the final frame.
- Mobile uses the same svh-per-second, so total scroll length is comparable to desktop.

### Sections vs footage (verified on the contact sheets)
| Section | Footage | Frames centred at |
|---|---|---|
| Hero | 0:00–0:12 | — |
| About | 0:12–0:47 | 0:24 (top edge arrives with the lobby, ~0:12) |
| Services | 0:47–1:54 | Development 0:52 · Sales & Marketing 1:01 · Real Estate 1:10 · Hospitality 1:22 · Art 1:34 · Academy 1:47 |
| How we work | 1:54–2:25 | heading 1:59 (House of CP) · four steps 2:11 (woman walks to the door) |
| Contact | holds on 2:25 | — |
How We Work runs to the end of the film (through the doorway into the courtyard) so the
last stretch of footage still has page height under it; Contact then holds the final frame.

### Services
Still **six, named from the signage**: Development, Sales & Marketing, Real Estate,
Hospitality, Art, Academy. The change request lists "Media" and "Gallery"; neither is a
service sign in the film (see Phase 1 §Services).

### Glass
- As specified: `rgba(14,14,14,.38)`, `blur(18px) saturate(120%)`, 1px `rgba(255,255,255,.18)`,
  square corners, no shadow; mobile 10px blur / .5 tint; `.72` solid fallback without
  `backdrop-filter`; text frames ≤ 520px and ≤ 45vw; no nested blur.
- **Tint for pale footage is .58, not .5, and every frame uses it.** Measured with
  `verify-glass.mjs` (95th-percentile background luminance behind each frame, paper text):
  at .5, 4 desktop frames (Sales & Marketing 4.11, steps 3–4 4.36/4.29, Contact 4.15) and
  5 mobile frames (About 4.10, Development 4.33, Academy 4.25, step 2 3.68, Contact 4.37)
  fall below 4.5:1. Even Hospitality, a dark corridor, fails at .38 because of the
  chandeliers (3.6:1). At .58 the minimum is 5.23:1 desktop and 4.73:1 mobile.
  Re-test any retimed frame with `node scripts/verify-glass.mjs --tint=0.5`.
- Entrance: IntersectionObserver flips `data-state`; CSS does the 800ms 48px rise and the
  70ms child stagger. `will-change` is set only during the transition. No blur-in.
- Counter-parallax 0.96× is applied to frame *content* only; the glass stays at 1×.

### Video sources
- Added **`scrub-m.webm`** (VP9, 720w, 11 MB). Both desktop and mobile now pick the first
  source `canPlayType()` accepts, using codec strings (`avc1.64001F` / `avc1.64001E` /
  `vp9`). Before, mobile always took the mp4 and a browser without H.264 got no video.

### Performance work
- Mobile home Lighthouse was 59 (TBT 1,160 ms). Two fixes:
  1. `Experience` holds `ready`/`entered` state, and every section was re-rendered twice
     while the curtain lifted. Static sections are now hoisted elements (stable identity),
     so React skips them.
  2. The video download kept ~180 chunk buffers in an array until the end, then copied them
     into a Blob, which triggered a ~200 ms major GC. It now counts bytes in a
     `TransformStream` and lets `Response.blob()` assemble the file.
  Result: Edge at 4× CPU, TBT ≈ 287 → 136 ms; curtain lifts 6.1 → 4.5 s; Lighthouse mobile
  home 59 → 71.
- `backdrop-filter` measured in Google Chrome (GPU, headed): desktop avg 54.9 fps with glass
  vs 56.8 without; mobile 58.0 vs 56.7. Median frame 16.7 ms either way; the occasional
  slow frame happens with blur off too. Blur is not the bottleneck.

### Measurement notes
- Test machine: 2-core i5-5200U with the owner's Chrome and Edge open (~80% CPU). Lighthouse
  runs vary by up to ±10 points; `scripts/lighthouse.sh` keeps the median of 3.
- Lighthouse cannot attach to Edge here, so it runs in installed Google Chrome.
- The verify scripts need `window.__cp`; in production it exists only with `?cp-test`.
