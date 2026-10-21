#!/usr/bin/env node
/**
 * The journey's length, measured (docs/25): the document height of `/` and the height of each of
 * its sections, in viewport heights, once every scene has built (pins sized). Reproducible: run it
 * against a production build (`npm run build && npx next start -p 3200`).
 *
 *   node scripts/measure-journey.mjs [base=http://localhost:3200] [--json out.json]
 *
 * Viewports: the Playwright reference set plus 430 (Spec §27), and 1440 under reduced motion.
 */
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const base = args.find((a) => /^https?:/.test(a)) ?? "http://localhost:3200";
const jsonAt = args.indexOf("--json");
const out = jsonAt >= 0 ? args[jsonAt + 1] : null;

const VIEWPORTS = [
  { name: "xl-1440", width: 1440, height: 900 },
  { name: "lg-1366", width: 1366, height: 768 },
  { name: "md-820", width: 820, height: 1180, mobile: true },
  { name: "sm-430", width: 430, height: 932, mobile: true },
  { name: "sm-390", width: 390, height: 844, mobile: true },
  { name: "sm-320", width: 320, height: 568, mobile: true },
  { name: "rm-1440", width: 1440, height: 900, rm: true },
];

const browser = await chromium.launch();
const results = [];
for (const v of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    isMobile: !!v.mobile,
    hasTouch: !!v.mobile,
    reducedMotion: v.rm ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector("main")?.hasAttribute("data-started"));
  // lazy scenes build as they come near: walk the page once so every pin has its length
  const total0 = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total0 + v.height * 4; y += v.height) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await page.waitForTimeout(60);
  }
  await page.waitForFunction(() => !document.querySelector("[data-scene-root]:not([data-scene-built])"), null, { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const vh = window.innerHeight;
    const main = document.getElementById("contenido");
    const rows = [];
    for (const el of Array.from(main?.children ?? [])) {
      const box = el.getBoundingClientRect();
      if (box.height < 1) continue;
      const sec = el.getAttribute("data-section") ?? el.querySelector("[data-section]")?.getAttribute("data-section") ?? el.tagName.toLowerCase();
      const name = el.classList.contains("proof") ? `${sec}·proof` : sec;
      rows.push({ name, vh: +(box.height / vh).toFixed(2) });
    }
    return { docVh: +(document.documentElement.scrollHeight / vh).toFixed(2), docPx: document.documentElement.scrollHeight, rows };
  });
  results.push({ viewport: v.name, ...r });
  console.log(`\n${v.name}: ${r.docVh} vh (${r.docPx} px)`);
  for (const row of r.rows) console.log(`  ${row.name.padEnd(24)} ${row.vh.toFixed(2).padStart(6)} vh`);
  await ctx.close();
}
await browser.close();
if (out) writeFileSync(out, JSON.stringify({ base, at: new Date().toISOString(), results }, null, 1));
