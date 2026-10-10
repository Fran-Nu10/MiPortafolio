#!/usr/bin/env node
/**
 * Rayo Smash · layer cutouts derived from the real hero captures (Spec §09 material table,
 * docs/06 "derivables de la captura"). Nothing is drawn: every pixel comes from
 * `public/projects/prospector/prospector-hero-exploded.png` (the hero, six bands over the
 * demo's #0a0a0f background) and `…-scroll.png` (the same hero scrolled, where the upper
 * patty is clean — in the hero capture the demo's own "CAPA POR CAPA" title crosses it).
 *
 *   node scripts/derive-rayo-layers.mjs           masters → media-src/rayo, variants → public/media/rayo,
 *                                                 geometry → src/data/rayo-layers.ts
 *   node scripts/derive-rayo-layers.mjs --check   exit 1 if the committed geometry differs
 *
 * The key is the distance from the background colour (soft edge 6 → 22/255). The bottom bun
 * is cropped by the capture's own fold: its last rows fade out instead of ending in a hard
 * line. Final cutouts from the demo's original PNGs replace these (same keys, same geometry
 * fields) without touching the world.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HERO = join(ROOT, "public/projects/prospector/prospector-hero-exploded.png");
const SCROLL = join(ROOT, "public/projects/prospector/prospector-hero-exploded-scroll.png");
const MASTERS = join(ROOT, "media-src/rayo");
const OUT = "public/media/rayo";
const DATA = join(ROOT, "src/data/rayo-layers.ts");
const check = process.argv.includes("--check");

/** the demo's background */
const BG = [10, 10, 15];
/** the burger column in the captures (x) and the header's bottom (y) */
const COLUMN = [880, 1640];
const HEADER = 70;
/** top → bottom, as the real Clásica stacks (doble medallón: two patties) */
const LAYERS = ["topBun", "bacon", "patty", "onion", "patty2", "bottomBun"];
/** reel frames the poster is cover-cropped into (Spec §06), for the anchor rect */
const FRAMES = { desktop: [1094, 580], mobile: [358, 420] };
/** rows that fade at the capture's fold (bottom bun) */
const FADE_ROWS = 28;

const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

async function load(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height, C: info.channels };
}
const alphaAt = (im, x, y) => {
  const i = (y * im.W + x) * im.C;
  const d = Math.max(Math.abs(im.data[i] - BG[0]), Math.abs(im.data[i + 1] - BG[1]), Math.abs(im.data[i + 2] - BG[2]));
  return smooth((d - 6) / 16);
};
/** the demo's white title over the hero: not part of any ingredient */
const isText = (im, x, y) => {
  const i = (y * im.W + x) * im.C;
  const r = im.data[i];
  const g = im.data[i + 1];
  const b = im.data[i + 2];
  return Math.min(r, g, b) > 150 && Math.max(r, g, b) - Math.min(r, g, b) < 40;
};
const solid = (im, x, y) => alphaAt(im, x, y) > 0.5 && !isText(im, x, y);

/** horizontal bands of opaque rows inside the column */
function bands(im, minRows = 20) {
  const out = [];
  let start = -1;
  for (let y = HEADER; y < im.H; y++) {
    let n = 0;
    for (let x = COLUMN[0]; x < COLUMN[1]; x++) if (solid(im, x, y)) n++;
    const on = n > 6;
    if (on && start < 0) start = y;
    if (!on && start >= 0) {
      if (y - start > minRows) out.push([start, y - 1]);
      start = -1;
    }
  }
  if (start >= 0 && im.H - start > minRows) out.push([start, im.H - 1]);
  return out;
}
function bbox(im, [y0, y1]) {
  let x0 = im.W;
  let x1 = 0;
  for (let y = y0; y <= y1; y++)
    for (let x = COLUMN[0]; x < COLUMN[1]; x++)
      if (solid(im, x, y)) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
      }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
function centroid(im, b) {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let y = b.y; y < b.y + b.h; y++)
    for (let x = b.x; x < b.x + b.w; x++)
      if (solid(im, x, y)) {
        sx += x;
        sy += y;
        n++;
      }
  return { x: sx / n, y: sy / n };
}
/** RGBA crop of `b` with the keyed alpha (and the fold fade when asked) */
function cutout(im, b, fade = false) {
  const out = Buffer.alloc(b.w * b.h * 4);
  for (let y = 0; y < b.h; y++) {
    const fy = fade ? smooth((b.h - 1 - y) / FADE_ROWS) : 1;
    for (let x = 0; x < b.w; x++) {
      const i = ((b.y + y) * im.W + b.x + x) * im.C;
      const o = (y * b.w + x) * 4;
      out[o] = im.data[i];
      out[o + 1] = im.data[i + 1];
      out[o + 2] = im.data[i + 2];
      out[o + 3] = Math.round(alphaAt(im, b.x + x, b.y + y) * fy * 255);
    }
  }
  return { data: out, w: b.w, h: b.h };
}

export async function derive() {
  const hero = await load(HERO);
  const scroll = await load(SCROLL);
  const heroBands = bands(hero);
  if (heroBands.length !== 6) throw new Error(`hero: expected 6 bands, found ${heroBands.length}`);
  // the bottom bun ends at the capture's fold: the fold's own rows are not the bun
  heroBands[5][1] -= 3;
  const hb = heroBands.map((b) => bbox(hero, b));
  const sb = bands(scroll).map((b) => bbox(scroll, b));
  if (sb.length < 3) throw new Error(`scroll: expected ≥ 3 bands, found ${sb.length}`);

  // the upper patty: the scroll capture's (bacon, patty, onion, …) second band, brought to
  // the hero's scale by the onion's width (the same photographs at two zoom levels)
  const scale = hb[3].w / sb[2].w;
  const pattyMaster = await sharp(Buffer.from(cutout(scroll, sb[1]).data), { raw: { width: sb[1].w, height: sb[1].h, channels: 4 } })
    .resize({ width: Math.round(sb[1].w * scale) })
    .png()
    .toBuffer();
  const pm = await sharp(pattyMaster).raw().toBuffer({ resolveWithObject: true });
  const patty = { data: pm.data, w: pm.info.width, h: pm.info.height };
  // placed where the hero's own (title-crossed) patty sits: same centroid
  const pc = centroid(hero, hb[2]);
  let psx = 0;
  let psy = 0;
  let pn = 0;
  for (let y = 0; y < patty.h; y++)
    for (let x = 0; x < patty.w; x++)
      if (patty.data[(y * patty.w + x) * 4 + 3] > 128) {
        psx += x;
        psy += y;
        pn++;
      }
  const pattyBox = { x: Math.round(pc.x - psx / pn), y: Math.round(pc.y - psy / pn), w: patty.w, h: patty.h };

  const boxes = [hb[0], hb[1], pattyBox, hb[3], hb[4], hb[5]];
  const stack = {
    x: Math.min(...boxes.map((b) => b.x)),
    y: Math.min(...boxes.map((b) => b.y)),
  };
  stack.w = Math.max(...boxes.map((b) => b.x + b.w)) - stack.x;
  stack.h = Math.max(...boxes.map((b) => b.y + b.h)) - stack.y;

  const masters = LAYERS.map((name, i) => (i === 2 ? patty : cutout(hero, boxes[i], i === 5)));
  // the whole stack as the poster shows it: the six layers at their own places
  const whole = Buffer.alloc(stack.w * stack.h * 4);
  masters.forEach((m, i) => {
    const b = boxes[i];
    for (let y = 0; y < m.h; y++)
      for (let x = 0; x < m.w; x++) {
        const s = (y * m.w + x) * 4;
        const d = ((b.y - stack.y + y) * stack.w + (b.x - stack.x + x)) * 4;
        const a = m.data[s + 3] / 255;
        if (!a) continue;
        const ad = whole[d + 3] / 255;
        const out = a + ad * (1 - a);
        for (let c = 0; c < 3; c++) whole[d + c] = Math.round((m.data[s + c] * a + whole[d + c] * ad * (1 - a)) / out);
        whole[d + 3] = Math.round(out * 255);
      }
  });

  /** the stack's rect inside the reel frame the poster is cover-cropped into */
  const anchorIn = ([fw, fh]) => {
    const fa = fw / fh;
    const ia = hero.W / hero.H;
    const vis = ia > fa ? { w: hero.H * fa, h: hero.H } : { w: hero.W, h: hero.W / fa };
    const ox = (hero.W - vis.w) / 2;
    const oy = (hero.H - vis.h) / 2;
    const r = (v) => Math.round(v * 10000) / 10000;
    return { x: r((stack.x - ox) / vis.w), y: r((stack.y - oy) / vis.h), w: r(stack.w / vis.w), h: r(stack.h / vis.h) };
  };
  const r4 = (v) => Math.round(v * 10000) / 10000;
  const layers = LAYERS.map((name, i) => ({
    name,
    key: `rayo.layers.${name}`,
    w: masters[i].w,
    h: masters[i].h,
    /** the layer's box inside the whole stack (0–1 of the stack) */
    offset: { x: r4((boxes[i].x - stack.x) / stack.w), y: r4((boxes[i].y - stack.y) / stack.h), w: r4(masters[i].w / stack.w), h: r4(masters[i].h / stack.h) },
  }));
  return { layers, masters, whole: { data: whole, w: stack.w, h: stack.h }, anchor: { desktop: anchorIn(FRAMES.desktop), mobile: anchorIn(FRAMES.mobile) } };
}

/** cutout variant paths as scripts/media.mjs names them (1x = half the master, 2x = the master) */
const variants = (name, w, h) => ({
  avif: { "1x": `/media/rayo/${name}-desktop@1x.avif`, "2x": `/media/rayo/${name}-desktop@2x.avif` },
  webp: { "1x": `/media/rayo/${name}-desktop@1x.webp`, "2x": `/media/rayo/${name}-desktop@2x.webp` },
  width: Math.round(w / 2),
  height: Math.round(h / 2),
});

export function render({ layers, whole, anchor }) {
  const row = (l) =>
    `  { name: "${l.name}", key: "${l.key}", files: ${JSON.stringify(variants(l.name, l.w, l.h))}, offset: ${JSON.stringify(l.offset)} },`;
  return `// Generated by scripts/derive-rayo-layers.mjs from the real hero captures. Do not edit: run the script.
// Rayo Smash (Spec §09): the six layers of the Clásica as the demo's hero shows them, each
// cutout's box inside the whole stack, and where the stack sits in the reel poster.

import type { CutoutFiles, Rect01 } from "./types";

export interface RayoLayer {
  name: string;
  key: string;
  files: CutoutFiles;
  /** the layer's box inside the whole stack (0–1 of the stack) */
  offset: Rect01;
}

/** top → bottom */
export const RAYO_LAYERS: RayoLayer[] = [
${layers.map(row).join("\n")}
];

/** the whole stack, as one cutout */
export const RAYO_STACK: { files: CutoutFiles; aspect: [number, number] } = {
  files: ${JSON.stringify(variants("burger", whole.w, whole.h))},
  aspect: [${whole.w}, ${whole.h}],
};

/** the stack inside the reel poster, per frame (Spec §07 anchorRect) */
export const RAYO_ANCHOR: { desktop: Rect01; mobile: Rect01 } = ${JSON.stringify(anchor)};
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
      console.error("src/data/rayo-layers.ts is out of date: run node scripts/derive-rayo-layers.mjs");
      process.exit(1);
    }
    console.log("rayo-layers: up to date");
  } else {
    mkdirSync(MASTERS, { recursive: true });
    const all = [...result.layers.map((l, i) => ({ name: l.name, key: l.key, m: result.masters[i] })), { name: "burger", key: "rayo.burger", m: result.whole }];
    for (const { name, key, m } of all) {
      const master = join(MASTERS, `${name}.png`);
      await sharp(Buffer.from(m.data), { raw: { width: m.w, height: m.h, channels: 4 } }).png().toFile(master);
      const out = execFileSync(
        process.execPath,
        ["scripts/media.mjs", "cutout", "--key", key, "--tier", "desktop", "--in", master, "--out", `${OUT}/${name}`, "--height", String(Math.round(m.h / 2))],
        { cwd: ROOT, encoding: "utf8" },
      );
      const info = JSON.parse(out);
      console.log(`${key}: ${m.w}×${m.h} → ${Object.entries(info.sizes).map(([k, v]) => `${k} ${Math.round(v / 1024)} KB`).join(" · ")}`);
    }
    writeFileSync(DATA, text);
    console.log(`rayo-layers: ${DATA} (${result.layers.length} layers, stack ${result.whole.w}×${result.whole.h}, anchor ${JSON.stringify(result.anchor.desktop)})`);
  }
}
