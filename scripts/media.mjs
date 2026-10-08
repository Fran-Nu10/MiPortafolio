#!/usr/bin/env node
/**
 * Media pipeline (Spec §17, §22) — sharp only, no other dependency.
 *
 *   node scripts/media.mjs grain [--out public/media/site/grain.png] [--seed 360]
 *     The 256×256 grain tile for the opening (Spec §03 hero stack): deterministic 1-bit noise
 *     (mulberry32), ≤ 8 KB. Its contract is `site.grain`.
 *
 *   node scripts/media.mjs cutout --key franco.hero --tier desktop --in media-src/franco-hero.png
 *                                 --out public/media/franco/hero --height 1100 [--public public]
 *     Alpha cutout variants from a master: AVIF q50 + WebP q78 at 1x and 2x (2x = 2 × --height),
 *     metadata stripped, plus a 16 px LQIP (base64 WebP). Prints the contract fragment to paste into
 *     `src/data/assets.ts` (files + lqip), then flip the contract's `status` to "final".
 *
 * Masters live outside the repo (asset delivery folder) or in the git-ignored `media-src/`.
 */
import { mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const command = args[0];
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

/** deterministic PRNG (Spec §08 uses the same one for the TS reveal) */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function grain() {
  const out = resolve(opt("out", "public/media/site/grain.png"));
  const seed = Number(opt("seed", "360"));
  const size = 256;
  const rand = mulberry32(seed);
  // sparse 1-bit noise: compresses under 8 KB and reads as fine grain at opacity .06 / screen
  const px = Buffer.alloc(size * size);
  for (let i = 0; i < px.length; i++) px[i] = rand() < 0.28 ? 255 : 0;
  mkdirSync(dirname(out), { recursive: true });
  await sharp(px, { raw: { width: size, height: size, channels: 1 } })
    .png({ palette: true, colours: 2, bitdepth: 1, compressionLevel: 9, effort: 10 })
    .toFile(out);
  const bytes = statSync(out).size;
  console.log(JSON.stringify({ key: "site.grain", file: out, width: size, height: size, bytes }, null, 2));
  if (bytes > 8 * 1024) {
    console.error(`grain: ${bytes} bytes exceeds the 8 KB budget`);
    process.exit(1);
  }
}

async function cutout() {
  const key = opt("key");
  const tier = opt("tier", "desktop");
  const input = opt("in");
  const outBase = opt("out");
  const height = Number(opt("height", "1100"));
  if (!key || !input || !outBase) {
    console.error("usage: media.mjs cutout --key <asset key> --tier desktop|mobile --in <master> --out <public path base> [--height 1100]");
    process.exit(2);
  }
  const master = sharp(input, { failOn: "error" });
  const meta = await master.metadata();
  if (!meta.hasAlpha) console.warn(`cutout: ${input} has no alpha channel — a cutout needs transparency`);
  if ((meta.height ?? 0) < height * 2) console.warn(`cutout: master is ${meta.height}px tall; 2x needs ${height * 2}px`);

  const abs = resolve(outBase);
  mkdirSync(dirname(abs), { recursive: true });
  // the web root the `src` paths are relative to (tests point it at a temp folder)
  const publicRoot = resolve(opt("public", "public"));
  const toPublic = (p) => p.slice(publicRoot.length).replace(/\\/g, "/");

  const files = { avif: {}, webp: {} };
  let width = 0;
  for (const [density, h] of [["1x", height], ["2x", height * 2]]) {
    const resized = sharp(input).resize({ height: h, withoutEnlargement: true });
    const avif = `${abs}-${tier}@${density}.avif`;
    const webp = `${abs}-${tier}@${density}.webp`;
    const info = await resized.clone().avif({ quality: 50, effort: 6 }).toFile(avif);
    await resized.clone().webp({ quality: 78, alphaQuality: 90, effort: 6 }).toFile(webp);
    if (density === "1x") width = info.width;
    files.avif[density] = toPublic(avif);
    files.webp[density] = toPublic(webp);
  }
  const lqipBuf = await sharp(input).resize({ width: 16 }).webp({ quality: 40 }).toBuffer();
  const lqip = `data:image/webp;base64,${lqipBuf.toString("base64")}`;
  const sizes = Object.fromEntries(
    ["1x", "2x"].flatMap((d) => [
      [`avif@${d}`, statSync(publicRoot + files.avif[d]).size],
      [`webp@${d}`, statSync(publicRoot + files.webp[d]).size],
    ]),
  );
  console.log(JSON.stringify({ key, tier, files: { [tier]: { ...files, width, height } }, lqip, lqipBytes: lqip.length, sizes }, null, 2));
  if (lqip.length > 1024) console.warn(`cutout: LQIP is ${lqip.length} bytes (budget < 1 KB)`);
}

if (command === "grain") await grain();
else if (command === "cutout") await cutout();
else {
  console.error("usage: node scripts/media.mjs grain | cutout --key … --in … --out …");
  process.exit(2);
}
