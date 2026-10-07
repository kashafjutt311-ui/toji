/**
 * Scroll-FPS check in installed Google Chrome (GPU, H.264): wheel-scrolls the whole home
 * page with no per-tick page.evaluate (which itself steals frames), records rAF intervals.
 * Runs twice — glass as shipped, then with backdrop-filter disabled — to isolate the blur.
 *
 *   node scripts/fps.mjs [url] [--mobile]
 */
import { chromium } from "@playwright/test";

const url = (process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3000") + "/?cp-test";
const mobile = process.argv.includes("--mobile");

async function run(noBlur) {
  const browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--window-position=-2400,0"] });
  const ctx = await browser.newContext(
    mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } },
  );
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => { const el = document.getElementById("preloader"); return !el || getComputedStyle(el).display === "none"; }, null, { timeout: 120_000 });
  if (noBlur) await page.addStyleTag({ content: ".gf{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}" });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const s = (window.__f = []);
    let last = performance.now();
    const loop = (now) => { s.push(now - last); last = now; window.__raf = requestAnimationFrame(loop); };
    window.__raf = requestAnimationFrame(loop);
  });
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const step = 100;
  for (let y = 0; y < total; y += step) {
    if (mobile) await page.mouse.wheel(0, step); // touch emulation still scrolls on wheel
    else await page.mouse.wheel(0, step);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    cancelAnimationFrame(window.__raf);
    const f = window.__f.slice(5).sort((a, b) => a - b);
    const q = (k) => f[Math.min(f.length - 1, Math.floor(f.length * k))];
    const avg = f.reduce((a, b) => a + b, 0) / f.length;
    return { frames: f.length, avgFps: +(1000 / avg).toFixed(1), p50: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), p99: +q(0.99).toFixed(1), over33: f.filter((x) => x > 33.4).length };
  });
  await browser.close();
  return r;
}

console.log(mobile ? "mobile 390×844" : "desktop 1440×900", "— Google Chrome, GPU");
console.log("glass (shipped):    ", JSON.stringify(await run(false)));
console.log("backdrop-filter off:", JSON.stringify(await run(true)));
