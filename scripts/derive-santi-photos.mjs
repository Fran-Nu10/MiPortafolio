#!/usr/bin/env node
/**
 * Santi Nuca · provisional photographs for the world (Spec §10, §29 Q3). The originals are
 * Santi Nuca's and have to be requested; until then the world uses the photographs exactly as
 * his site shows them: each one is cut from the real page capture at its panel's edges (the
 * page's own rules), with nothing added. Same keys and fields as the originals will carry.
 *
 *   node scripts/derive-santi-photos.mjs           masters → media-src/santi, variants → public/media/santi,
 *                                                  geometry → src/data/santi-photos.ts
 *   node scripts/derive-santi-photos.mjs --check   exit 1 if the committed geometry differs
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "public/projects/santi-nuca");
const MASTERS = join(ROOT, "media-src/santi");
const OUT = "public/media/santi";
const DATA = join(ROOT, "src/data/santi-photos.ts");
const check = process.argv.includes("--check");

/** the six photographs, in the world's order, with the page each one is cut from */
const PHOTOS = [
  { n: 1, file: "santi-nuca-opening.png", page: "Apertura", x: [845, 1672], alt: "Retrato de apertura — fotografía de Santi Nuca", edges: ["left", "right"] },
  { n: 2, file: "santi-nuca-work-01.png", page: "Trabajo 01", x: [840, null], alt: "Trabajo 01 — fotografía de Santi Nuca", edges: ["left"] },
  // the diptych page: its right photograph (the left one carries the page's own numeral)
  { n: 3, file: "santi-nuca-work-02-diptych.png", page: "Trabajo 02", x: [850, 1672], alt: "Trabajo 02 — fotografía de Santi Nuca", edges: ["left", "right"] },
  { n: 4, file: "santi-nuca-work-03-detail.png", page: "Trabajo 03", x: [1692, null], alt: "Trabajo 03, detalle — fotografía de Santi Nuca", edges: ["left"] },
  { n: 5, file: "santi-nuca-work-04.png", page: "Trabajo 04", x: [1692, null], alt: "Trabajo 04 — fotografía de Santi Nuca", edges: ["left"] },
  { n: 6, file: "santi-nuca-work-05.png", page: "Trabajo 05", x: [1672, null], alt: "Trabajo 05 — fotografía de Santi Nuca", edges: ["left"] },
];
/** the reel frames the opening poster is cover-cropped into (Spec §06): the anchor of photo 1 */
const FRAMES = { desktop: [1094, 700], mobile: [358, 420] };
/** the site's header: the photographs start under it */
const HEADER_SEARCH = [30, 90];

async function load(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height, C: info.channels };
}
const lum = (im, x, y) => {
  const i = (y * im.W + x) * im.C;
  return (im.data[i] + im.data[i + 1] + im.data[i + 2]) / 3;
};
/** the strongest vertical edge within ±60 px of a guess (the page's rule / the panel's side) */
function vEdge(im, guess, y0, y1) {
  let best = guess;
  let e = -1;
  for (let x = Math.max(1, guess - 60); x < Math.min(im.W - 1, guess + 60); x++) {
    let s = 0;
    for (let y = y0; y < y1; y += 3) s += Math.abs(lum(im, x + 1, y) - lum(im, x - 1, y));
    if (s > e) {
      e = s;
      best = x;
    }
  }
  return best;
}
/** the header's bottom rule */
function hEdge(im, x0, x1) {
  let best = HEADER_SEARCH[0];
  let e = -1;
  for (let y = HEADER_SEARCH[0]; y < HEADER_SEARCH[1]; y++) {
    let s = 0;
    for (let x = x0; x < x1; x += 3) s += Math.abs(lum(im, x, y + 1) - lum(im, x, y - 1));
    if (s > e) {
      e = s;
      best = y;
    }
  }
  return best + 2;
}

export async function derive() {
  const out = [];
  let anchor = null;
  for (const p of PHOTOS) {
    const im = await load(join(SRC, p.file));
    const top = hEdge(im, 200, im.W - 200);
    let x0 = p.x[0];
    let x1 = p.x[1] ?? im.W;
    if (p.edges.includes("left")) x0 = vEdge(im, x0, top, im.H) + 1;
    if (p.edges.includes("right")) x1 = vEdge(im, x1, top, im.H);
    const box = { x: x0, y: top, w: x1 - x0, h: im.H - top };
    out.push({ ...p, box, master: p.file });
    if (p.n === 1) {
      const anchorIn = ([fw, fh]) => {
        const fa = fw / fh;
        const vis = im.W / im.H > fa ? { w: im.H * fa, h: im.H } : { w: im.W, h: im.W / fa };
        const ox = (im.W - vis.w) / 2;
        const oy = (im.H - vis.h) / 2;
        const r = (v) => Math.round(v * 10000) / 10000;
        return { x: r((box.x - ox) / vis.w), y: r((box.y - oy) / vis.h), w: r(box.w / vis.w), h: r(box.h / vis.h) };
      };
      anchor = { desktop: anchorIn(FRAMES.desktop), mobile: anchorIn(FRAMES.mobile) };
    }
  }
  return { photos: out, anchor };
}

/** variant paths as scripts/media.mjs names them; 1x = half the master (≤ 640 tall), 2x = double that */
const height1x = (h) => Math.min(640, Math.round(h / 2));
const variants = (n, w, h) => {
  const h1 = height1x(h);
  const w1 = Math.round((w * h1) / h);
  return {
    avif: { "1x": `/media/santi/photo-${n}-desktop@1x.avif`, "2x": `/media/santi/photo-${n}-desktop@2x.avif` },
    webp: { "1x": `/media/santi/photo-${n}-desktop@1x.webp`, "2x": `/media/santi/photo-${n}-desktop@2x.webp` },
    width: w1,
    height: h1,
  };
};

export function render({ photos, anchor }) {
  const row = (p) =>
    `  { n: ${p.n}, key: "santi.photo.${p.n}", page: "${p.page}", alt: "${p.alt}", files: ${JSON.stringify(variants(p.n, p.box.w, p.box.h))}, aspect: [${p.box.w}, ${p.box.h}] },`;
  return `// Generated by scripts/derive-santi-photos.mjs from the real site captures. Do not edit: run the script.
// Santi Nuca (Spec §10): the six photographs of the world as the site shows them (provisional
// until the originals arrive), and where the opening photograph sits in the reel poster.

import type { CutoutFiles, Rect01 } from "./types";

export interface SantiPhoto {
  n: number;
  key: string;
  /** the real page the photograph is cut from */
  page: string;
  alt: string;
  files: CutoutFiles;
  /** the cut's pixel size */
  aspect: [number, number];
}

export const SANTI_PHOTOS: SantiPhoto[] = [
${photos.map(row).join("\n")}
];

/** photo 1 inside the opening poster, per reel frame (Spec §07 anchorRect) */
export const SANTI_ANCHOR: { desktop: Rect01; mobile: Rect01 } = ${JSON.stringify(anchor)};
`;
}

const here = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === here) {
  const result = await derive();
  const text = render(result);
  if (check) {
    let current = "";
    try {
      current = readFileSync(DATA, "utf8").replace(/\r\n/g, "\n");
    } catch {
      // missing: differs
    }
    if (current !== text) {
      console.error("src/data/santi-photos.ts is out of date: run node scripts/derive-santi-photos.mjs");
      process.exit(1);
    }
    console.log("santi-photos: up to date");
  } else {
    mkdirSync(MASTERS, { recursive: true });
    for (const p of result.photos) {
      const master = join(MASTERS, `photo-${p.n}.png`);
      await sharp(join(SRC, p.file)).extract({ left: p.box.x, top: p.box.y, width: p.box.w, height: p.box.h }).png().toFile(master);
      const out = execFileSync(
        process.execPath,
        ["scripts/media.mjs", "cutout", "--key", `santi.photo.${p.n}`, "--tier", "desktop", "--in", master, "--out", `${OUT}/photo-${p.n}`, "--height", String(height1x(p.box.h))],
        { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      );
      const info = JSON.parse(out);
      console.log(`santi.photo.${p.n} (${p.page}): ${p.box.w}×${p.box.h} at (${p.box.x}, ${p.box.y}) → ${Object.entries(info.sizes).map(([k, v]) => `${k} ${Math.round(v / 1024)} KB`).join(" · ")}`);
    }
    writeFileSync(DATA, text);
    console.log(`santi-photos: ${DATA} (anchor ${JSON.stringify(result.anchor.desktop)})`);
  }
}
