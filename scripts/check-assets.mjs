#!/usr/bin/env node
/**
 * Asset contract checker (Spec §22). Runs before every build (`prebuild`).
 *
 * Always fails on:
 *  - a malformed contract (duplicate key, missing aspect, poster pointing at an unknown key)
 *  - a `final`/`derived` contract whose files do not exist or exceed the size budget (Spec §18)
 *  - a TravelSuite360 contract marked usable without `privacyChecked: true` (Spec §23)
 *  - a referenced asset key (projects, site) that is not in the registry (Spec §21 rule 6)
 *
 * Launch-blocking slots that still resolve to a placeholder:
 *  - warn by default (development, preview builds)
 *  - fail with `--launch`, or automatically on a Vercel production build (VERCEL_ENV=production)
 *
 * Loads the TypeScript data files through Node's type stripping (Node ≥ 22.18).
 */
import { existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);

const { ASSETS } = await load("src/data/assets.ts");
const { PROJECTS } = await load("src/data/projects.ts");
const { SITE } = await load("src/data/site.ts");

const strict = process.argv.includes("--launch") || process.env.VERCEL_ENV === "production";

/** compressed-size budgets per kind (Spec §18), bytes — desktop / mobile */
const KB = 1024;
const MB = 1024 * KB;
const BUDGET = {
  still: { desktop: 250 * KB, mobile: 150 * KB },
  cutout: { desktop: 250 * KB, mobile: 150 * KB },
  loop: { desktop: 1.5 * MB, mobile: 0.8 * MB },
  proof: { desktop: 3 * MB, mobile: 1.5 * MB },
  clip: { desktop: 2.5 * MB, mobile: 1.5 * MB },
  og: { desktop: 300 * KB, mobile: 300 * KB },
};
const HERO_BUDGET = { desktop: 180 * KB, mobile: 110 * KB };
/** the reel posters are still raw captures until Phase 12 encodes them (served via next/image) */
const RAW_CAPTURE = /^\/projects\//;

const errors = [];
const warnings = [];
const isTs = (key) => key.startsWith("ts.") || key === "og.ts";
const usable = (c) => c.status !== "placeholder" && !!c.files?.desktop && (!isTs(c.key) || c.privacyChecked === true);

const keys = new Set();
for (const c of ASSETS) {
  if (keys.has(c.key)) errors.push(`${c.key}: duplicate key`);
  keys.add(c.key);
  if (!c.aspect?.desktop || c.aspect.desktop.length !== 2) errors.push(`${c.key}: missing desktop aspect`);
  if (typeof c.alt !== "string") errors.push(`${c.key}: alt must be a string ("" for decorative)`);
}

for (const c of ASSETS) {
  if (c.poster && !keys.has(c.poster)) errors.push(`${c.key}: poster "${c.poster}" is not in the registry`);
  if (isTs(c.key) && c.status !== "placeholder" && c.privacyChecked !== true)
    errors.push(`${c.key}: TravelSuite360 media needs privacyChecked: true (Spec §23 checklist, two reviewers)`);
  if (c.key.startsWith("santi.") && c.alt && !c.alt.endsWith("fotografía de Santi Nuca"))
    errors.push(`${c.key}: Santi Nuca alt text must end with "fotografía de Santi Nuca"`);

  if (c.status === "placeholder") continue;
  if (!c.files?.desktop) {
    errors.push(`${c.key}: status "${c.status}" but no desktop files`);
    continue;
  }
  for (const tier of ["desktop", "mobile"]) {
    const f = c.files[tier];
    if (!f) continue;
    const paths = "src" in f ? [f.src] : "sources" in f ? f.sources.map((s) => s.src) : [f.avif["1x"], f.avif["2x"], f.webp["1x"], f.webp["2x"]];
    for (const p of paths) {
      const abs = join(ROOT, "public", p);
      if (!existsSync(abs)) {
        errors.push(`${c.key} (${tier}): file not found ${p}`);
        continue;
      }
      const size = statSync(abs).size;
      const budget = (c.key === "franco.hero" ? HERO_BUDGET : BUDGET[c.kind])?.[tier];
      if (!budget || size <= budget) continue;
      const msg = `${c.key} (${tier}): ${p} is ${Math.round(size / KB)} KB, budget ${Math.round(budget / KB)} KB`;
      // raw captures are optimized by next/image at request time; Phase 12 encodes them
      if (RAW_CAPTURE.test(p) && c.kind === "still") warnings.push(`${msg} (raw capture, served through next/image)`);
      else errors.push(msg);
    }
  }
  if (c.kind === "proof" || c.kind === "loop" || c.kind === "clip") {
    if (!c.poster) errors.push(`${c.key}: video contracts need a poster (first frame)`);
  }
}

// every key the content references exists (Spec §21 rule 6)
const referenced = [
  SITE.meta.ogImage,
  "franco.hero",
  "franco.bust",
  "franco.atWork",
  "moments.human",
  ...PROJECTS.flatMap((p) => [p.reel.poster, p.reel.loop, p.screen.poster, p.screen.object, p.proof.media, p.meta.ogImage].filter(Boolean)),
];
for (const k of referenced) if (!keys.has(k)) errors.push(`referenced asset key "${k}" is not in the registry`);

const blockers = ASSETS.filter((c) => c.blocksLaunch && !usable(c));
const counts = ASSETS.reduce((acc, c) => ((acc[usable(c) ? c.status : "placeholder"] = (acc[usable(c) ? c.status : "placeholder"] ?? 0) + 1), acc), {});

console.log(
  `check-assets: ${ASSETS.length} contracts · ${counts.final ?? 0} final · ${counts.derived ?? 0} derived · ${counts.placeholder ?? 0} placeholder`,
);
for (const w of warnings) console.warn(`  warn  ${w}`);
if (blockers.length) {
  const list = blockers.map((c) => c.key).join(", ");
  if (strict) errors.push(`launch-blocking slots still on placeholder: ${list}`);
  else console.warn(`  warn  launch-blocking placeholders (a production launch build will fail): ${list}`);
}
if (errors.length) {
  for (const e of errors) console.error(`  error ${e}`);
  console.error(`check-assets: ${errors.length} error(s)${strict ? " (launch mode)" : ""}`);
  process.exit(1);
}
console.log(`check-assets: ok${strict ? " (launch mode)" : ""}`);
