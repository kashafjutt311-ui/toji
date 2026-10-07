/**
 * Phase-2 check: loads the site in Edge (Playwright's Chromium has no H.264), waits for the
 * preloader, wheel-scrolls through the stage like a user, and reports scrub smoothness:
 *   - rAF frame intervals (jank)
 *   - median / p95 seek→present latency (requestVideoFrameCallback)
 *   - lag between target time and displayed time
 * Screenshots land in screenshots/.
 *
 *   npm run dev   (in another terminal)
 *   node scripts/verify-scrub.mjs [url] [--mobile] [--canvas]
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";

const url = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const mobile = process.argv.includes("--mobile");
const canvas = process.argv.includes("--canvas");
const out = "screenshots";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext(
  mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } },
);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

const tag = mobile ? "m" : "d";
const t0 = Date.now();
await page.goto(url + "/?cp-test" + (canvas ? "&canvas=1" : ""), { waitUntil: "domcontentloaded" });
await page.screenshot({ path: `${out}/${tag}-00-preloader.png` });
await page.waitForFunction(() => { const el = document.getElementById("preloader"); return !el || getComputedStyle(el).display === "none"; }, null, { timeout: 120_000 });
const loadMs = Date.now() - t0;
await page.waitForTimeout(1600); // intro letters
await page.screenshot({ path: `${out}/${tag}-01-hero.png` });

// frame-time + lag sampler
await page.evaluate(() => {
  const s = (window.__s = { frames: [], lag: [] });
  let last = performance.now();
  const loop = (now) => {
    s.frames.push(now - last);
    last = now;
    const { telemetry } = window.__cp;
    s.lag.push(Math.abs(telemetry.target - telemetry.time));
    s.raf = requestAnimationFrame(loop);
  };
  s.raf = requestAnimationFrame(loop);
});

// scroll the whole stage with wheel ticks (~ a brisk trackpad)
const shots = [0.04, 0.06, 0.2, 0.31, 0.4, 0.55, 0.7, 0.85, 0.93, 0.99];
let shot = 0;
for (let i = 0; i < 2000; i++) {
  if (mobile) await page.evaluate(() => window.scrollBy(0, 40));
  else await page.mouse.wheel(0, 60);
  await page.waitForTimeout(16);
  const p = await page.evaluate(() => window.__cp.scroll.get().p);
  if (shot < shots.length && p >= shots[shot]) {
    await page.waitForTimeout(900); // let lerp settle
    const t = await page.evaluate(() => window.__cp.telemetry.time.toFixed(1));
    await page.screenshot({ path: `${out}/${tag}-p${String(Math.round(shots[shot] * 100)).padStart(2, "0")}-t${t}.png` });
    shot++;
  }
  if (p >= 0.999) break;
}

const stats = await page.evaluate(() => {
  cancelAnimationFrame(window.__s.raf);
  const q = (arr, k) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(s.length * k))];
  };
  const f = window.__s.frames.slice(5);
  const { telemetry } = window.__cp;
  return {
    mode: telemetry.mode,
    source: telemetry.source,
    frames: f.length,
    frameP50: q(f, 0.5).toFixed(1),
    frameP95: q(f, 0.95).toFixed(1),
    jankFrames: f.filter((x) => x > 50).length,
    seekMedianMs: telemetry.latency?.toFixed(1) ?? "n/a",
    lagP50: q(window.__s.lag, 0.5).toFixed(3),
    lagP95: q(window.__s.lag, 0.95).toFixed(3),
  };
});

console.log(JSON.stringify({ url, viewport: tag, loadMs, ...stats, errors }, null, 2));
await browser.close();
