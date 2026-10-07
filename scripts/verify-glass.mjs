/**
 * Acceptance checks for the glass-frame layout (change request §7). Runs in Edge
 * (Playwright's Chromium has no H.264).
 *
 *   npm run dev            (or: npm run build && npm start)
 *   node scripts/verify-glass.mjs [url] [--mobile] [--skip-fps]
 *
 * 1. Screenshots every section at its anchor time  → screenshots/glass-{d|m}-*.png
 * 2. Contrast: for each frame, hides its text, photographs the glass against the real
 *    footage, takes the 95th-percentile background luminance and computes paper-on-glass
 *    contrast. ≥ 4.5 passes.
 * 3. Scroll FPS: wheel-scrolls top → bottom, records rAF frame intervals.
 * 4. Service button → /services/[slug] → Back → lands on that frame.
 */
import { chromium } from "@playwright/test";
import { PNG } from "pngjs";
import fs from "node:fs";

const url = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const mobile = process.argv.includes("--mobile");
const skipFps = process.argv.includes("--skip-fps");
const tag = mobile ? "m" : "d";
fs.mkdirSync("screenshots", { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const ctx = await browser.newContext(
  mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } },
);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));

const ready = async () => {
  await page.waitForFunction(() => { const el = document.getElementById("preloader"); return !el || getComputedStyle(el).display === "none"; }, null, { timeout: 120_000 });
};
await page.goto(url + "/?cp-test", { waitUntil: "domcontentloaded" });
await ready();
// --tint=0.5 : try a different bright-tone tint (what-if for retuning FRAMES tones)
const tintArg = process.argv.find((a) => a.startsWith("--tint="));
if (tintArg) await page.addStyleTag({ content: `.gf[data-tone="bright"]{--tint:${tintArg.slice(7)}!important}` });
await page.waitForTimeout(1500);

/** scroll so the video sits at time t, wait for the lerp to land and entrances to finish */
async function at(t) {
  await page.evaluate((t) => window.__cp.scroll.scrollToTime(t, { immediate: true }), t);
  await page.waitForFunction((t) => Math.abs(window.__cp.telemetry.time - t) < 0.08, t, { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1300);
}

const PAPER = [242, 239, 233];
const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

async function contrastOf(handle) {
  // hide text + hairlines inside this frame only, photograph the bare glass
  await handle.evaluate((el) => el.classList.add("__measure"));
  await page.addStyleTag({ content: ".__measure, .__measure *{color:transparent!important;border-color:transparent!important;text-decoration-color:transparent!important} .__measure .bg-hairline,.__measure .bg-copper,.__measure a.btn>span:first-child{opacity:0!important} .__measure .btn{background:transparent!important}" });
  const buf = await handle.screenshot({ animations: "disabled" });
  await handle.evaluate((el) => el.classList.remove("__measure"));
  const png = PNG.sync.read(buf);
  const lums = [];
  // inset 6px to skip the 1px border, sample every 3rd pixel
  for (let y = 6; y < png.height - 6; y += 3)
    for (let x = 6; x < png.width - 6; x += 3) {
      const i = (y * png.width + x) * 4;
      lums.push(L([png.data[i], png.data[i + 1], png.data[i + 2]]));
    }
  lums.sort((a, b) => a - b);
  const p95 = lums[Math.floor(lums.length * 0.95)];
  const median = lums[lums.length >> 1];
  return { worst: +ratio(L(PAPER), p95).toFixed(2), typical: +ratio(L(PAPER), median).toFixed(2) };
}

const ANCHORS = await page.evaluate(() => {
  // mirror of FRAME_AT; read from the DOM order to stay in sync
  return null;
});
void ANCHORS;
const FRAME_AT = {
  about: 24,
  development: 52,
  "sales-marketing": 61,
  "real-estate": 70,
  hospitality: 82,
  art: 94,
  academy: 107,
  processIntro: 119,
  processSteps: 131,
};

const results = [];

// hero
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);
await page.screenshot({ path: `screenshots/glass-${tag}-00-hero.png` });

const targets = [
  ["01-about", FRAME_AT.about, "#about .gf"],
  ...Object.entries(FRAME_AT)
    .filter(([k]) => !["about", "processIntro", "processSteps"].includes(k))
    .map(([slug, t], i) => [`02-${i + 1}-${slug}`, t, `#service-${slug}`]),
  ["03-process-intro", FRAME_AT.processIntro, "#process > div .gf, #process > .gf"],
  ["03-process-steps", FRAME_AT.processSteps, "#process ol .gf"],
];

/** share of the viewport covered by glass (24×24 sample grid) */
const coverage = () =>
  page.evaluate(() => {
    let hit = 0;
    const n = 24;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const el = document.elementFromPoint(((i + 0.5) / n) * innerWidth, ((j + 0.5) / n) * innerHeight);
        if (el?.closest(".gf")) hit++;
      }
    return +((hit / (n * n)) * 100).toFixed(0);
  });
const covered = {};

for (const [name, t, sel] of targets) {
  await at(t);
  covered[name] = await coverage();
  await page.screenshot({ path: `screenshots/glass-${tag}-${name}.png` });
  const handles = await page.$$(sel);
  for (const [k, h] of handles.entries()) {
    const box = await h.boundingBox();
    if (!box || box.y + box.height < 0 || box.y > (mobile ? 844 : 900)) continue;
    const c = await contrastOf(h);
    const tone = await h.getAttribute("data-tone");
    results.push({ frame: handles.length > 1 ? `${name}#${k + 1}` : name, t, tone, ...c, pass: c.worst >= 4.5, widthPct: +((box.width / (mobile ? 390 : 1440)) * 100).toFixed(0) });
  }
}

// contact + footer
await page.evaluate(() => window.__cp.scroll.scrollToSection("contact", { immediate: true }));
await page.waitForTimeout(1800);
await page.screenshot({ path: `screenshots/glass-${tag}-04-contact.png` });
{
  const h = await page.$("#contact .gf");
  const c = await contrastOf(h);
  results.push({ frame: "04-contact", t: 145, tone: await h.getAttribute("data-tone"), ...c, pass: c.worst >= 4.5 });
}
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await page.waitForTimeout(1200);
await page.screenshot({ path: `screenshots/glass-${tag}-05-footer.png` });

// scroll FPS over the whole page, glass frames included
let fps = null;
if (!skipFps) {
  await page.evaluate(() => window.__cp.scroll.scrollToTime(0, { immediate: true }));
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const s = (window.__s = { f: [], jumps: 0, lastT: 0 });
    let last = performance.now();
    const loop = (now) => {
      s.f.push(now - last);
      last = now;
      // section-boundary jump check: displayed time never leaps > 0.6s between frames
      const t = window.__cp.telemetry.time;
      if (s.f.length > 2 && Math.abs(t - s.lastT) > 0.6) s.jumps++;
      s.lastT = t;
      s.raf = requestAnimationFrame(loop);
    };
    s.raf = requestAnimationFrame(loop);
  });
  for (let i = 0; i < 4000; i++) {
    if (mobile) await page.evaluate(() => window.scrollBy(0, 40));
    else await page.mouse.wheel(0, 80);
    await page.waitForTimeout(16);
    const done = await page.evaluate(() => window.scrollY + innerHeight >= document.documentElement.scrollHeight - 2);
    if (done) break;
  }
  fps = await page.evaluate(() => {
    cancelAnimationFrame(window.__s.raf);
    const f = window.__s.f.slice(5).sort((a, b) => a - b);
    const q = (k) => f[Math.min(f.length - 1, Math.floor(f.length * k))];
    const avg = f.reduce((a, b) => a + b, 0) / f.length;
    return {
      frames: f.length,
      avgFps: +(1000 / avg).toFixed(1),
      p50ms: +q(0.5).toFixed(1),
      p95ms: +q(0.95).toFixed(1),
      p99ms: +q(0.99).toFixed(1),
      over33ms: f.filter((x) => x > 33.4).length,
      timeJumps: window.__s.jumps,
    };
  });
}

// service button → page → Back
const nav = {};
{
  await at(FRAME_AT["real-estate"]);
  const btn = page.locator('#service-real-estate a[href="/services/real-estate"]');
  await btn.click();
  await page.waitForURL("**/services/real-estate", { timeout: 20_000 });
  await page.waitForTimeout(1200);
  nav.serviceTitle = await page.locator("#svc-title").innerText();
  await page.screenshot({ path: `screenshots/glass-${tag}-06-service-page.png` });
  await page.goBack();
  await page.waitForURL((u) => u.pathname === "/", { timeout: 20_000 }).catch(() => {});
  await ready();
  await page.waitForTimeout(1500);
  nav.backTime = await page.evaluate(() => +window.__cp.telemetry.time.toFixed(2));
  const box = await page.locator("#service-real-estate").boundingBox();
  nav.frameInView = !!box && box.y < (mobile ? 844 : 900) && box.y + box.height > 0;
  await page.screenshot({ path: `screenshots/glass-${tag}-07-back.png` });
}

// worst coverage anywhere: sweep the whole stage in 1s steps
let maxCoverage = 0;
for (let t = 0; t <= 145; t += 1) {
  await page.evaluate((t) => window.__cp.scroll.scrollToTime(t, { immediate: true }), t);
  await page.waitForTimeout(120);
  maxCoverage = Math.max(maxCoverage, await coverage());
}

console.log(JSON.stringify({ url, viewport: tag, contrast: results, coveragePct: covered, maxCoveragePct: maxCoverage, fps, nav, errors }, null, 2));
await browser.close();
