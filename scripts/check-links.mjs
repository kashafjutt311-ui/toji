/**
 * Link check: visits every page, collects every <a href>, and verifies
 *   - internal pages answer 200 (and unknown slugs 404)
 *   - "/#section" targets exist on the home page
 *   - header / menu / footer section links actually land on their section
 * External, mailto and placeholder ("#") links are listed for review.
 *
 *   node scripts/check-links.mjs [base-url]
 */
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const ready = () =>
  page.waitForFunction(() => { const el = document.getElementById("preloader"); return !el || getComputedStyle(el).display === "none"; }, null, { timeout: 120_000 });

const pages = ["/", "/services/development", "/services/sales-marketing", "/services/real-estate", "/services/hospitality", "/services/art", "/services/academy"];
const links = new Map(); // href -> Set(found on)
for (const p of pages) {
  await page.goto(base + p, { waitUntil: "domcontentloaded" });
  if (p === "/") await ready();
  else await page.waitForTimeout(800);
  const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
  for (const h of hrefs) {
    if (!links.has(h)) links.set(h, new Set());
    links.get(h).add(p);
  }
}

const homeIds = await (async () => {
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  return page.$$eval("[id]", (els) => els.map((e) => e.id));
})();

const problems = [];
const review = [];
const ok = [];
for (const [href, from] of [...links].sort()) {
  const where = [...from].join(", ");
  if (href.startsWith("mailto:") || /^https?:\/\//.test(href)) {
    review.push(`${href}   (on ${where})`);
    continue;
  }
  if (href === "#" || href === "") {
    problems.push(`placeholder link "${href}"   (on ${where})`);
    continue;
  }
  const [path, hash] = href.split("#");
  if (path) {
    const res = await page.request.get(base + path);
    if (res.status() !== 200) problems.push(`${href} -> HTTP ${res.status()}   (on ${where})`);
  }
  if (hash && (path === "/" || path === "")) {
    if (!homeIds.includes(hash)) problems.push(`${href} -> no element #${hash} on /   (on ${where})`);
  }
  ok.push(href);
}
const notFound = await page.request.get(base + "/services/does-not-exist");

// click tests: header links (home), footer links (home), header links from a service page
const clicks = [];
async function landed(id) {
  await page.waitForTimeout(2600);
  return page.evaluate((id) => {
    const el = document.getElementById(id);
    return el ? Math.round(el.getBoundingClientRect().top) : null;
  }, id);
}
await page.goto(base + "/", { waitUntil: "domcontentloaded" });
await ready();
for (const id of ["about", "services", "process", "contact", "hero"]) {
  // the header hides on scroll-down; a small scroll up brings it back, as for a user
  await page.mouse.wheel(0, -120);
  await page.waitForTimeout(700);
  await page.locator(`header nav[aria-label="Primary"] a[href="/#${id}"]`).click();
  const top = await landed(id);
  clicks.push(`header  /#${id.padEnd(8)} section top at ${top}px ${Math.abs(top) <= 2 ? "✓" : "✗"}`);
}
for (const id of ["hero", "about", "services"]) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(800);
  await page.locator(`footer a[href="/#${id}"]`).click();
  const top = await landed(id);
  clicks.push(`footer  /#${id.padEnd(8)} section top at ${top}px ${Math.abs(top) <= 2 ? "✓" : "✗"}`);
}
await page.goto(base + "/services/art", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
await page.locator('header nav[aria-label="Primary"] a[href="/#process"]').click();
await page.waitForURL((u) => u.pathname === "/", { timeout: 20_000 });
await ready();
const top = await landed("process");
clicks.push(`service page header -> /#process   url=${new URL(page.url()).pathname}${new URL(page.url()).hash}  section top at ${top}px ${top !== null && Math.abs(top) <= 2 ? "✓" : "✗"}`);
// menu overlay link
await page.mouse.wheel(0, -120);
await page.waitForTimeout(700);
await page.getByRole("button", { name: "Menu" }).click();
await page.waitForTimeout(900);
await page.locator('#menu a[href="/#about"]').click();
const mtop = await landed("about");
clicks.push(`menu    /#about    section top at ${mtop}px ${Math.abs(mtop) <= 2 ? "✓" : "✗"}`);

console.log(`checked ${links.size} distinct links on ${pages.length} pages; unknown slug -> HTTP ${notFound.status()}`);
console.log("\nOK:", ok.join("  "));
console.log("\nclick tests:\n  " + clicks.join("\n  "));
console.log("\nto review (external / mailto):\n  " + (review.join("\n  ") || "none"));
console.log("\nPROBLEMS:\n  " + (problems.join("\n  ") || "none"));
await browser.close();
