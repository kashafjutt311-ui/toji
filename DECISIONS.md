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
