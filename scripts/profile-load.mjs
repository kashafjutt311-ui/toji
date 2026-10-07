/**
 * Mobile load profile in Edge (real H.264 — Playwright's Chromium can't decode the scrub
 * mp4). 390×844, 4× CPU throttle (Lighthouse's mobile factor), no network throttle.
 * Reports long tasks / TBT from the Long Tasks API and the top functions by self-time
 * inside long tasks, with their callers.
 *
 *   node scripts/profile-load.mjs [url] [--chromium]
 */
import { chromium } from "@playwright/test";

const url = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3000/";
const channel = process.argv.includes("--chromium") ? undefined : "msedge";
const browser = await chromium.launch({ channel, headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__lt = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push([e.startTime, e.duration]))).observe({ type: "longtask", buffered: true });
});
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await cdp.send("Profiler.enable");
await cdp.send("Profiler.setSamplingInterval", { interval: 250 });
await cdp.send("Profiler.start");
const t0 = Date.now();
await page.goto(url, { waitUntil: "load" });
await page
  .waitForFunction(() => { const el = document.getElementById("preloader"); return !el || getComputedStyle(el).display === "none"; }, null, { timeout: 60_000 })
  .catch(() => console.log("preloader never lifted"));
const lifted = Date.now() - t0;
await page.waitForTimeout(4000);
const { profile } = await cdp.send("Profiler.stop");
const { lt, fcp } = await page.evaluate(() => ({
  lt: window.__lt,
  fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0,
}));

const tbt = lt.filter(([s]) => s >= fcp).reduce((a, [, d]) => a + Math.max(0, d - 50), 0);
console.log(`channel=${channel ?? "chromium"} FCP=${fcp.toFixed(0)}ms curtain-lifted=${lifted}ms long-tasks=${lt.length} TBT≈${tbt.toFixed(0)}ms`);
console.log("long tasks (start@dur):", lt.map(([s, d]) => `${s.toFixed(0)}@${d.toFixed(0)}`).join(" "));

// aggregate samples by function (self time), with three callers for context
const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
const parent = new Map();
for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
const self = new Map();
profile.samples.forEach((id, i) => {
  const n = nodes.get(id);
  const f = n.callFrame;
  if (["(idle)", "(program)", "(garbage collector)"].includes(f.functionName)) {
    const k = f.functionName;
    self.set(k, (self.get(k) ?? 0) + profile.timeDeltas[i] / 1000);
    return;
  }
  // leaf + 3 callers
  const st = [];
  let x = id;
  while (x && st.length < 4) {
    const cf = nodes.get(x).callFrame;
    st.push(`${cf.functionName || "(anon)"}@${cf.url.split("/").pop()}:${cf.lineNumber}:${cf.columnNumber}`);
    x = parent.get(x);
  }
  const k = st.join(" < ");
  self.set(k, (self.get(k) ?? 0) + profile.timeDeltas[i] / 1000);
});
console.log("\ntop self-time:");
for (const [k, ms] of [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 22)) console.log(ms.toFixed(0).padStart(6), "ms ", k);
await browser.close();
