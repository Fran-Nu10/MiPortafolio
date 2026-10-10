#!/usr/bin/env node
/**
 * Chef Arturo · provisional product photographs for the world (Spec §11, §29 Q4). The original
 * product / macro photography has to be produced; until then the world uses the store's own
 * photographs exactly as its pages show them: the Cookie levain from its product page and
 * three sibling products from the "Merienda" catalog, each cut at its panel's edges from the
 * real capture, with nothing added.
 *
 *   node scripts/derive-chef-photos.mjs           masters → media-src/chef, variants → public/media/chef,
 *                                                 geometry → src/data/chef-photos.ts
 *   node scripts/derive-chef-photos.mjs --check   exit 1 if the committed geometry differs
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "public/projects/chef-arturo");
const MASTERS = join(ROOT, "media-src/chef");
const OUT = "public/media/chef";
const DATA = join(ROOT, "src/data/chef-photos.ts");
const check = process.argv.includes("--check");

/** the store's page colour */
const CREAM = [247, 243, 234];
/** the product page the Cookie levain is cut from, and the reel frames it is cover-cropped into */
const PDP = "chef-arturo-pdp-cookie-levain.png";
const CATALOG = "chef-arturo-catalogo-merienda.png";
const FRAMES = { desktop: [1094, 640], mobile: [358, 420] };

/** the photographs: the product, then the three siblings of the "Merienda" row (left → right, skipping the product's own card) */
// names and prices as the store's catalog prints them (its "Merienda" row, left → right)
const PHOTOS = [
  { key: "chef.product", name: "product", file: PDP, column: [900, 1700], rows: [100, 1100], label: "Cookie Levain de pistacho y chocolate blanco", price: "$ 120", alt: "Cookie levain de pistacho y chocolate blanco" },
  { key: "chef.catalog.1", name: "catalog-1", file: CATALOG, column: [20, 640], rows: [540, 1180], label: "Cookie Levain clásica con chips", price: "$ 120", alt: "Cookie Levain clásica con chips, del catálogo de Chef Arturo" },
  { key: "chef.catalog.2", name: "catalog-2", file: CATALOG, column: [1270, 1900], rows: [540, 1180], label: "Cookie Levain red velvet con chocolate blanco", price: "$ 120", alt: "Cookie Levain red velvet con chocolate blanco, del catálogo de Chef Arturo" },
  { key: "chef.catalog.3", name: "catalog-3", file: CATALOG, column: [1900, 2540], rows: [540, 1180], label: "Cookie Levain cacao al 100%", price: "$ 120", alt: "Cookie Levain cacao al 100%, del catálogo de Chef Arturo" },
];

async function load(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height, C: info.channels };
}
/** a pixel that is not the page (the photograph, its frame, or text) */
const ink = (im, x, y) => {
  const i = (y * im.W + x) * im.C;
  return Math.max(Math.abs(im.data[i] - CREAM[0]), Math.abs(im.data[i + 1] - CREAM[1]), Math.abs(im.data[i + 2] - CREAM[2])) > 40;
};
const lum = (im, x, y) => {
  const i = (y * im.W + x) * im.C;
  return (im.data[i] + im.data[i + 1] + im.data[i + 2]) / 3;
};
/** the longest run of `on` indices, bridging gaps of up to `gapMax` */
function longestRun(values, th, gapMax) {
  let best = [0, 0];
  let s = -1;
  let gap = 0;
  for (let i = 0; i <= values.length; i++) {
    const on = i < values.length && values[i] > th;
    if (on) {
      if (s < 0) s = i;
      gap = 0;
    } else if (s >= 0) {
      gap++;
      if (gap > gapMax || i === values.length) {
        const e = i - gap;
        if (e - s > best[1] - best[0]) best = [s, e];
        s = -1;
        gap = 0;
      }
    }
  }
  return best;
}
/**
 * The photograph's rows inside a column of the page: the longest run of rows with picture
 * texture (horizontal gradient energy; text rows are sparse and short-lived).
 */
function photoRows(im, [x0, x1], [y0, y1]) {
  const rows = [];
  for (let y = y0; y < y1; y++) {
    let e = 0;
    let n = 0;
    for (let x = x0; x < x1 - 2; x += 2) {
      e += Math.abs(lum(im, x + 2, y) - lum(im, x, y));
      n++;
    }
    rows.push(e / n);
  }
  const [a, b] = longestRun(rows, 2.5, 12);
  return [y0 + a, y0 + b];
}
/** the photograph's columns inside those rows: everything that is not the page */
function photoCols(im, [x0, x1], [top, bottom]) {
  let a = x1;
  let b = x0;
  for (let y = top; y < bottom; y += 2)
    for (let x = x0; x < x1; x++)
      if (ink(im, x, y)) {
        a = Math.min(a, x);
        b = Math.max(b, x);
      }
  return [a, b + 1];
}

export async function derive() {
  const out = [];
  let anchor = null;
  const cache = new Map();
  // the catalog cards share one photo height: measured on the product's own card (dense texture)
  const catalogIm = await load(join(SRC, CATALOG));
  const catalogRows = photoRows(catalogIm, [640, 1270], [540, 1180]);
  cache.set(CATALOG, catalogIm);
  for (const p of PHOTOS) {
    if (!cache.has(p.file)) cache.set(p.file, await load(join(SRC, p.file)));
    const im = cache.get(p.file);
    const rows = p.file === CATALOG ? catalogRows : photoRows(im, p.column, p.rows);
    const [cx0, cx1] = photoCols(im, p.column, rows);
    const box = { x: cx0, y: rows[0], w: cx1 - cx0, h: rows[1] - rows[0] };
    out.push({ ...p, box });
    if (p.key === "chef.product") {
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

/** variant paths as scripts/media.mjs names them; 1x = half the master, 2x = the master */
const variants = (name, w, h) => {
  const h1 = Math.round(h / 2);
  return {
    avif: { "1x": `/media/chef/${name}-desktop@1x.avif`, "2x": `/media/chef/${name}-desktop@2x.avif` },
    webp: { "1x": `/media/chef/${name}-desktop@1x.webp`, "2x": `/media/chef/${name}-desktop@2x.webp` },
    width: Math.round((w * h1) / h),
    height: h1,
  };
};

export function render({ photos, anchor }) {
  const row = (p) =>
    `  { key: "${p.key}", label: "${p.label}", price: "${p.price}", alt: "${p.alt}", files: ${JSON.stringify(variants(p.name, p.box.w, p.box.h))}, aspect: [${p.box.w}, ${p.box.h}] },`;
  return `// Generated by scripts/derive-chef-photos.mjs from the real store captures. Do not edit: run the script.
// Chef Arturo (Spec §11): the Cookie levain as its product page shows it and three siblings of
// the "Merienda" catalog (provisional until the product photography is produced), and where
// the product sits in the product-page poster.

import type { CutoutFiles, Rect01 } from "./types";

export interface ChefPhoto {
  key: string;
  /** the card's name and price, as the store's catalog prints them */
  label: string;
  price: string;
  alt: string;
  files: CutoutFiles;
  /** the cut's pixel size */
  aspect: [number, number];
}

export const CHEF_PHOTOS: ChefPhoto[] = [
${photos.map(row).join("\n")}
];

/** the product inside the product-page poster, per reel frame (Spec §07 anchorRect) */
export const CHEF_ANCHOR: { desktop: Rect01; mobile: Rect01 } = ${JSON.stringify(anchor)};

/** the store's page colour, the field of C03–C07 */
export const CHEF_CREAM = "#f7f3ea";
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
      console.error("src/data/chef-photos.ts is out of date: run node scripts/derive-chef-photos.mjs");
      process.exit(1);
    }
    console.log("chef-photos: up to date");
  } else {
    mkdirSync(MASTERS, { recursive: true });
    for (const p of result.photos) {
      const master = join(MASTERS, `${p.name}.png`);
      await sharp(join(SRC, p.file)).extract({ left: p.box.x, top: p.box.y, width: p.box.w, height: p.box.h }).png().toFile(master);
      const out = execFileSync(
        process.execPath,
        ["scripts/media.mjs", "cutout", "--key", p.key, "--tier", "desktop", "--in", master, "--out", `${OUT}/${p.name}`, "--height", String(Math.round(p.box.h / 2))],
        { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      );
      const info = JSON.parse(out);
      console.log(`${p.key}: ${p.box.w}×${p.box.h} at (${p.box.x}, ${p.box.y}) → ${Object.entries(info.sizes).map(([k, v]) => `${k} ${Math.round(v / 1024)} KB`).join(" · ")}`);
    }
    writeFileSync(DATA, text);
    console.log(`chef-photos: ${DATA} (anchor ${JSON.stringify(result.anchor.desktop)})`);
  }
}
