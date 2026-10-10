import type { Tier } from "./tiers";

/**
 * Santi Nuca world (Spec §10), pure: labels, the editorial compositions per variant and the
 * one geometric rule — a photograph only ever moves with a uniform scale and a clip-path
 * inset, never a non-uniform scale (photographs do not distort).
 *
 * Compositions are written in the design space (1440×900; 390×844 on phones). Each figure is
 * laid out at its largest size in the sequence (the single image); every later appearance is
 * that box, uniformly scaled and clipped to the target rectangle.
 */

/** units: SCREEN 0 · ISOLATE 1 · N02 2 (= s:WORLD) · N03 3 · N04 4 · N05 5 · hold → 5.4 */
export const N_T = { N02: 2, N03: 3, N04: 4, N05: 5, END: 5.4 } as const;
export const SANTI_UNITS = 5.4;
/** reduced motion: four static compositions after the card cut */
export const N_T_RM = { N02: 0.5, N03: 1.5, N04: 2.5, N05: 3.5, END: 4 } as const;
export const SANTI_UNITS_RM = 4;
/** N04 labels mask up with an 80 ms-equivalent stagger; N05 photos 4–6 reveal 120 ms apart */
export const N04_STAGGER = 0.08;
export const N05_STAGGER = 0.12;

export type SantiVariant = "desktop" | "sm";
export const santiVariant = (tier: Tier): SantiVariant => (tier === "sm" ? "sm" : "desktop");

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Composition {
  /** the figures' target rectangles, by photo index (missing = not shown) */
  figures: Box[];
  /** where the labels sit (N04: under each column; sm: right of each row) */
  labels?: Box[];
}

/** the editorial field every composition lives in */
export function field(v: SantiVariant): Box {
  return v === "sm" ? { x: 16, y: 120, w: 358, h: 620 } : { x: 120, y: 99, w: 1200, h: 702 };
}

/** N02 · the single image: the shell's escape rect (78% of the height; sm: full width ≤ 62% height) */
export function single(v: SantiVariant, aspect: number): Box {
  if (v === "sm") {
    const w = Math.min(390, 0.62 * 844 * aspect);
    return { x: (390 - w) / 2, y: (844 - w / aspect) / 2, w, h: w / aspect };
  }
  const h = 0.78 * 900;
  return { x: (1440 - h * aspect) / 2, y: (900 - h) / 2, w: h * aspect, h };
}

/** N03 · the diptych: two halves of the field (sm: two stacked rows) */
export function diptych(v: SantiVariant): Composition {
  const f = field(v);
  if (v === "sm") {
    const h = (f.h - 8) / 2;
    return { figures: [{ x: f.x, y: f.y, w: f.w, h }, { x: f.x, y: f.y + h + 8, w: f.w, h }] };
  }
  const w = (f.w - 8) / 2;
  return { figures: [{ x: f.x, y: f.y, w, h: f.h }, { x: f.x + w + 8, y: f.y, w, h: f.h }] };
}

/** N04 · the triptych: three columns with their labels under them (sm: three rows, labels right) */
export function triptych(v: SantiVariant): Composition {
  const f = field(v);
  if (v === "sm") {
    const h = (f.h - 2 * 8) / 3;
    const w = f.w - 96;
    const rows = [0, 1, 2].map((i) => ({ x: f.x, y: f.y + i * (h + 8), w, h }));
    return { figures: rows, labels: rows.map((r) => ({ x: r.x + r.w + 12, y: r.y + r.h - 44, w: 84, h: 44 })) };
  }
  const labelH = 56;
  const h = f.h - labelH;
  const w = (f.w - 2 * 8) / 3;
  const cols = [0, 1, 2].map((i) => ({ x: f.x + i * (w + 8), y: f.y, w, h }));
  return { figures: cols, labels: cols.map((c) => ({ x: c.x, y: c.y + c.h + 14, w: c.w, h: labelH - 14 })) };
}

/** N05 · the system: the works in the site's grid, 3×2 (sm: 2×3) */
export function system(v: SantiVariant): Composition {
  const f = field(v);
  const [cols, rows, gap] = v === "sm" ? [2, 3, 8] : [3, 2, 16];
  const w = (f.w - (cols - 1) * gap) / cols;
  const h = (f.h - (rows - 1) * gap) / rows;
  const figures: Box[] = [];
  for (let i = 0; i < cols * rows; i++) figures.push({ x: f.x + (i % cols) * (w + gap), y: f.y + Math.floor(i / cols) * (h + gap), w, h });
  return { figures };
}

/** where a crop keeps its subject: portraits are cut from the top third, not the middle */
export const FOCUS = { x: 0.5, y: 0.3 };

/**
 * Place a figure of natural size `nat` (laid out at the origin, transform-origin 0 0) so that
 * its visible part is exactly `target`: a uniform cover scale, a centered clip (in the figure's
 * own pixels) and the translation that puts the clipped window at the target. The clip is
 * applied before the transform, so its insets are in local pixels.
 */
export function fit(
  nat: { w: number; h: number },
  target: Box,
  focus: { x: number; y: number } = FOCUS,
): { x: number; y: number; scale: number; clip: [number, number, number, number] } {
  const scale = Math.max(target.w / nat.w, target.h / nat.h);
  const visW = target.w / scale;
  const visH = target.h / scale;
  const left = (nat.w - visW) * focus.x;
  const top = (nat.h - visH) * focus.y;
  return { x: target.x - left * scale, y: target.y - top * scale, scale, clip: [top, nat.w - visW - left, nat.h - visH - top, left] };
}

/**
 * `clip-path: inset(...)` for `fit`'s insets. The left value is kept a hair apart from the
 * right one: a computed inset with equal sides serializes as shorthand, and a tween read from
 * that shorthand lands on the wrong edge (0.013 px is invisible).
 */
export function insetOf(c: [number, number, number, number]): string {
  const v = c.map((x) => Math.max(0, x));
  if (Math.abs(v[3] - v[1]) < 0.005) v[3] += 0.013;
  return `inset(${v.map((x) => `${x.toFixed(3)}px`).join(" ")})`;
}

/** a transform matrix is a uniform scale with no skew (the §10 assertion) */
export function isUniform(m: { a: number; b: number; c: number; d: number }, eps = 1e-3): boolean {
  return Math.abs(m.b) < eps && Math.abs(m.c) < eps && Math.abs(m.a - m.d) < eps * Math.max(1, Math.abs(m.a));
}

/** "Forma · Línea · Textura" → the three view names; "01 · 02 · 03" → the page numbers */
export const splitViews = (text: string) => text.split(" · ").map((s) => s.trim()).filter(Boolean);
