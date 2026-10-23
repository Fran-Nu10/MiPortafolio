/**
 * THE SHIFT — de la complejidad al producto (docs/25). Pure geometry and timing, no GSAP: the
 * scene (components/shift) and the tests import it.
 *
 * One pinned stage, one continuous transformation in four acts, every element the same object
 * from the first frame to the last (FLIP: CSS lays every fragment out where the finished interface
 * has it; the disorder is an inverse transform, measured once per build):
 * - DESORDEN · fragments of a possible interface — blocks, lines, navigation, type, modules,
 *   indicators, incomplete components — scattered on a designed diagonal, raw (outlines, muted);
 * - DIRECCION · they straighten and align on the grid, which appears as they find it; on lg/xl the
 *   interface opens as an exploded axonometric of its layers, elsewhere as a flat exploded view;
 * - EJECUCION · the layers close into one plane, the paper surface fills in, the type takes its
 *   color, and one gesture works: «Publicar» switches on, the state reads «Publicado», the bar fills
 *   and a module answers;
 * - RESULTADO · the camera steps back, the system is annotated, the caption says what it is: a
 *   conceptual interface made for this section (never a project, never a metric).
 * Every act is a resting label (one gesture = one change); the last one holds before the pin lets go.
 *
 * Composition lives in a design space with a fixed aspect per variant (CSS sizes it in container
 * units); positions here are fractions of that space, layouts are fractions of the interface box.
 */

export const SHIFT_STATES = ["DESORDEN", "DIRECCION", "EJECUCION", "RESULTADO"] as const;
export type ShiftState = (typeof SHIFT_STATES)[number];

/** state labels, in gestures (timeline units) */
export const SHIFT_AT: Record<ShiftState, number> = {
  DESORDEN: 0,
  DIRECCION: 0.8,
  EJECUCION: 1.6,
  RESULTADO: 2.3,
};
/** pin length in gestures: the result holds a third of a gesture before the pin releases */
export const SHIFT_UNITS = 2.6;

/** a moment inside the gesture that leads to `state`: 0 = the previous state, 1 = `state` */
export function within(state: ShiftState, f: number): number {
  const i = SHIFT_STATES.indexOf(state);
  const from = i > 0 ? SHIFT_AT[SHIFT_STATES[i - 1]] : 0;
  return from + (SHIFT_AT[state] - from) * f;
}

/** duration of a span of that gesture, in units */
export function span(state: ShiftState, a: number, b: number): number {
  return within(state, b) - within(state, a);
}

// ── variants ────────────────────────────────────────────────────────────────

/**
 * wide: landscape screens (1440 × 900 space) · tablet: portrait tablets (820 × 1180) · phone:
 * phones (390 × 844) — the same conditions as the declaration (lib/declaration decVariant) and
 * as globals.css (`.shift-space`). Each variant is drawn on its own, never reflowed.
 */
export type ShiftVariant = "wide" | "tablet" | "phone";
export const SHIFT_VARIANTS: ShiftVariant[] = ["wide", "tablet", "phone"];
export const SHIFT_SPACE: Record<ShiftVariant, { w: number; h: number }> = {
  wide: { w: 1440, h: 900 },
  tablet: { w: 820, h: 1180 },
  phone: { w: 390, h: 844 },
};

export function shiftVariant(width: number, height: number): ShiftVariant {
  if (width < 768) return "phone";
  return width / height <= 0.9 ? "tablet" : "wide";
}

/** the interface's box in the space: left, top and width as fractions of the space, its aspect */
export const UI_BOX: Record<ShiftVariant, { x: number; y: number; w: number; ar: number }> = {
  wide: { x: 0.38, y: 0.15, w: 0.57, ar: 1.5 },
  tablet: { x: 0.08, y: 0.25, w: 0.84, ar: 0.95 },
  phone: { x: 0.06, y: 0.3, w: 0.88, ar: 0.7 },
};

/** the interface box's height, as a fraction of the space's */
export function uiHeight(v: ShiftVariant): number {
  const b = UI_BOX[v];
  const s = SHIFT_SPACE[v];
  return (b.w * s.w) / b.ar / s.h;
}

/** where the act lines live: no fragment ever crosses it (the text is never covered) */
export const TEXT_ZONE: Record<ShiftVariant, { x: number; y: number; w: number; h: number }> = {
  wide: { x: 0.05, y: 0.24, w: 0.32, h: 0.46 },
  tablet: { x: 0.08, y: 0.085, w: 0.84, h: 0.145 },
  phone: { x: 0.06, y: 0.1, w: 0.88, h: 0.17 },
};

// ── the interface ───────────────────────────────────────────────────────────

/**
 * Its fragments, in paint order. The frame is the container; the rest sit on it. Phones drop the
 * text navigation, the call to action, the third module and the divider (a menu glyph stands in);
 * tablets and wide screens have no menu glyph.
 */
export const SHIFT_ELEMENTS = [
  "frame",
  "bar",
  "rule",
  "visual",
  "card1",
  "card2",
  "card3",
  "mark",
  "word",
  "nav1",
  "nav2",
  "nav3",
  "menu",
  "cta",
  "eyebrow",
  "h1a",
  "h1b",
  "body",
  "button",
  "chip",
  "toggle",
  "progress",
] as const;
export type ShiftElement = (typeof SHIFT_ELEMENTS)[number];

/** a fragment's place in the finished interface: fractions of the interface box; type in cqw of it */
export interface UiRect {
  x: number;
  y: number;
  w: number;
  h: number;
  fs?: number;
}

type Layout = Partial<Record<ShiftElement, UiRect>>;

const WIDE: Layout = {
  frame: { x: 0, y: 0, w: 1, h: 1 },
  bar: { x: 0, y: 0.125, w: 1, h: 0.002 },
  mark: { x: 0.04, y: 0.045, w: 0.024, h: 0.036 },
  word: { x: 0.072, y: 0.04, w: 0.2, h: 0.05, fs: 1.9 },
  nav1: { x: 0.47, y: 0.046, w: 0.08, h: 0.045, fs: 1.5 },
  nav2: { x: 0.57, y: 0.046, w: 0.09, h: 0.045, fs: 1.5 },
  nav3: { x: 0.68, y: 0.046, w: 0.09, h: 0.045, fs: 1.5 },
  cta: { x: 0.84, y: 0.03, w: 0.12, h: 0.065, fs: 1.4 },
  eyebrow: { x: 0.04, y: 0.185, w: 0.3, h: 0.03, fs: 1.15 },
  h1a: { x: 0.04, y: 0.235, w: 0.48, h: 0.095, fs: 5.4 },
  h1b: { x: 0.04, y: 0.33, w: 0.48, h: 0.095, fs: 5.4 },
  body: { x: 0.04, y: 0.45, w: 0.4, h: 0.08, fs: 1.55 },
  button: { x: 0.04, y: 0.565, w: 0.17, h: 0.075, fs: 1.45 },
  chip: { x: 0.235, y: 0.574, w: 0.15, h: 0.057, fs: 1.3 },
  visual: { x: 0.53, y: 0.175, w: 0.43, h: 0.49 },
  rule: { x: 0.04, y: 0.71, w: 0.92, h: 0.002 },
  card1: { x: 0.04, y: 0.75, w: 0.21, h: 0.2, fs: 1.45 },
  card2: { x: 0.27, y: 0.75, w: 0.21, h: 0.2, fs: 1.45 },
  card3: { x: 0.5, y: 0.75, w: 0.21, h: 0.2, fs: 1.45 },
  toggle: { x: 0.74, y: 0.75, w: 0.22, h: 0.09, fs: 1.45 },
  progress: { x: 0.74, y: 0.885, w: 0.22, h: 0.012 },
};

const TABLET: Layout = {
  frame: { x: 0, y: 0, w: 1, h: 1 },
  bar: { x: 0, y: 0.095, w: 1, h: 0.002 },
  mark: { x: 0.05, y: 0.037, w: 0.03, h: 0.0285 },
  word: { x: 0.095, y: 0.032, w: 0.25, h: 0.042, fs: 2.9 },
  nav1: { x: 0.44, y: 0.037, w: 0.1, h: 0.036, fs: 2.1 },
  nav2: { x: 0.55, y: 0.037, w: 0.11, h: 0.036, fs: 2.1 },
  nav3: { x: 0.675, y: 0.037, w: 0.11, h: 0.036, fs: 2.1 },
  cta: { x: 0.84, y: 0.026, w: 0.11, h: 0.05, fs: 1.9 },
  eyebrow: { x: 0.05, y: 0.125, w: 0.4, h: 0.025, fs: 1.7 },
  h1a: { x: 0.05, y: 0.16, w: 0.9, h: 0.075, fs: 7.4 },
  h1b: { x: 0.05, y: 0.238, w: 0.9, h: 0.075, fs: 7.4 },
  body: { x: 0.05, y: 0.33, w: 0.6, h: 0.06, fs: 2.3 },
  button: { x: 0.05, y: 0.42, w: 0.22, h: 0.055, fs: 2.1 },
  chip: { x: 0.3, y: 0.427, w: 0.2, h: 0.042, fs: 1.9 },
  toggle: { x: 0.62, y: 0.42, w: 0.33, h: 0.055, fs: 2.1 },
  progress: { x: 0.62, y: 0.49, w: 0.33, h: 0.01 },
  visual: { x: 0.05, y: 0.53, w: 0.9, h: 0.24 },
  rule: { x: 0.05, y: 0.795, w: 0.9, h: 0.002 },
  card1: { x: 0.05, y: 0.82, w: 0.28, h: 0.15, fs: 2.1 },
  card2: { x: 0.36, y: 0.82, w: 0.28, h: 0.15, fs: 2.1 },
  card3: { x: 0.67, y: 0.82, w: 0.28, h: 0.15, fs: 2.1 },
};

const PHONE: Layout = {
  frame: { x: 0, y: 0, w: 1, h: 1 },
  bar: { x: 0, y: 0.1, w: 1, h: 0.003 },
  mark: { x: 0.06, y: 0.036, w: 0.05, h: 0.035 },
  word: { x: 0.13, y: 0.03, w: 0.4, h: 0.045, fs: 4.4 },
  menu: { x: 0.85, y: 0.04, w: 0.09, h: 0.03 },
  eyebrow: { x: 0.06, y: 0.135, w: 0.6, h: 0.03, fs: 3.2 },
  h1a: { x: 0.06, y: 0.175, w: 0.9, h: 0.075, fs: 10.4 },
  h1b: { x: 0.06, y: 0.252, w: 0.9, h: 0.075, fs: 10.4 },
  body: { x: 0.06, y: 0.345, w: 0.86, h: 0.075, fs: 3.9 },
  visual: { x: 0.06, y: 0.445, w: 0.88, h: 0.215 },
  chip: { x: 0.09, y: 0.465, w: 0.32, h: 0.045, fs: 3.3 },
  button: { x: 0.06, y: 0.69, w: 0.42, h: 0.075, fs: 3.9 },
  toggle: { x: 0.52, y: 0.69, w: 0.42, h: 0.075, fs: 3.9 },
  progress: { x: 0.06, y: 0.795, w: 0.88, h: 0.008 },
  card1: { x: 0.06, y: 0.83, w: 0.42, h: 0.14, fs: 3.6 },
  card2: { x: 0.52, y: 0.83, w: 0.42, h: 0.14, fs: 3.6 },
};

export const UI_LAYOUT: Record<ShiftVariant, Layout> = { wide: WIDE, tablet: TABLET, phone: PHONE };

/** the fragments a variant draws */
export const shown = (v: ShiftVariant): ShiftElement[] => SHIFT_ELEMENTS.filter((k) => UI_LAYOUT[v][k]);

// ── act I · the disorder ────────────────────────────────────────────────────

/** a fragment's first pose: its center at (x, y) of the space, rotated `r`°, scaled `s`, opacity `o` */
export interface ScatterPose {
  x: number;
  y: number;
  r: number;
  s: number;
  o: number;
}

/**
 * Drawn by hand, per variant: a loose diagonal from the top of the space to its lower edge, the
 * container a tilted ghost at its center, the headline's two lines large and apart, the small
 * pieces (navigation, indicators) along the edges, the accent mark the only one near the text.
 * Tension, never noise: no fragment leaves the space or crosses the act lines (tests/shift). Only
 * the containers and lines recede (opacity < .9): a fragment with type stays legible (AA on black).
 */
export const SCATTER: Record<ShiftVariant, Partial<Record<ShiftElement, ScatterPose>>> = {
  wide: {
    frame: { x: 0.665, y: 0.47, r: -7, s: 0.8, o: 0.7 },
    bar: { x: 0.69, y: 0.4, r: 26, s: 0.55, o: 0.8 },
    rule: { x: 0.24, y: 0.79, r: 3, s: 0.42, o: 0.7 },
    visual: { x: 0.82, y: 0.3, r: 11, s: 0.9, o: 1 },
    card1: { x: 0.47, y: 0.79, r: -13, s: 0.95, o: 1 },
    card2: { x: 0.9, y: 0.66, r: 15, s: 1, o: 0.9 },
    card3: { x: 0.2, y: 0.87, r: -9, s: 0.95, o: 0.9 },
    mark: { x: 0.44, y: 0.47, r: 22, s: 2.2, o: 1 },
    word: { x: 0.83, y: 0.085, r: 4, s: 1.35, o: 0.9 },
    nav1: { x: 0.47, y: 0.085, r: -11, s: 1.25, o: 0.9 },
    nav2: { x: 0.6, y: 0.06, r: 6, s: 1.1, o: 0.9 },
    nav3: { x: 0.93, y: 0.12, r: -15, s: 1.2, o: 0.9 },
    cta: { x: 0.91, y: 0.45, r: -18, s: 1.15, o: 0.9 },
    eyebrow: { x: 0.55, y: 0.58, r: 0, s: 1.2, o: 0.9 },
    h1a: { x: 0.6, y: 0.3, r: -5, s: 0.95, o: 1 },
    h1b: { x: 0.72, y: 0.67, r: 8, s: 1.05, o: 1 },
    body: { x: 0.62, y: 0.16, r: -3, s: 1.05, o: 0.9 },
    button: { x: 0.8, y: 0.8, r: 12, s: 1.15, o: 1 },
    chip: { x: 0.49, y: 0.4, r: -16, s: 1.25, o: 1 },
    toggle: { x: 0.63, y: 0.79, r: -9, s: 1.2, o: 1 },
    progress: { x: 0.88, y: 0.9, r: 17, s: 1.3, o: 0.8 },
  },
  tablet: {
    frame: { x: 0.5, y: 0.585, r: -6, s: 0.8, o: 0.7 },
    bar: { x: 0.45, y: 0.5, r: 24, s: 0.5, o: 0.8 },
    rule: { x: 0.3, y: 0.9, r: -5, s: 0.45, o: 0.7 },
    visual: { x: 0.6, y: 0.82, r: 9, s: 0.6, o: 1 },
    card1: { x: 0.2, y: 0.84, r: -12, s: 0.85, o: 1 },
    card2: { x: 0.82, y: 0.87, r: 14, s: 0.9, o: 0.9 },
    card3: { x: 0.62, y: 0.73, r: 4, s: 0.8, o: 0.9 },
    mark: { x: 0.12, y: 0.55, r: 20, s: 2, o: 1 },
    word: { x: 0.78, y: 0.28, r: 3, s: 1.2, o: 0.9 },
    nav1: { x: 0.2, y: 0.275, r: -10, s: 1.3, o: 0.9 },
    nav2: { x: 0.52, y: 0.285, r: 6, s: 1.2, o: 0.9 },
    nav3: { x: 0.86, y: 0.37, r: -14, s: 1.2, o: 0.9 },
    cta: { x: 0.86, y: 0.52, r: -17, s: 1.2, o: 0.9 },
    eyebrow: { x: 0.27, y: 0.42, r: 0, s: 1.3, o: 0.9 },
    h1a: { x: 0.43, y: 0.335, r: -5, s: 0.75, o: 1 },
    h1b: { x: 0.6, y: 0.47, r: 7, s: 0.72, o: 1 },
    body: { x: 0.64, y: 0.62, r: -4, s: 0.9, o: 0.9 },
    button: { x: 0.3, y: 0.72, r: 11, s: 1.1, o: 1 },
    chip: { x: 0.16, y: 0.655, r: -15, s: 1.2, o: 1 },
    toggle: { x: 0.79, y: 0.7, r: -8, s: 1, o: 1 },
    progress: { x: 0.5, y: 0.935, r: 10, s: 0.9, o: 0.8 },
  },
  phone: {
    frame: { x: 0.5, y: 0.6, r: -5, s: 0.78, o: 0.7 },
    bar: { x: 0.5, y: 0.56, r: 22, s: 0.5, o: 0.8 },
    visual: { x: 0.62, y: 0.78, r: 8, s: 0.7, o: 1 },
    card1: { x: 0.21, y: 0.83, r: -12, s: 0.9, o: 1 },
    card2: { x: 0.81, y: 0.665, r: 13, s: 0.7, o: 0.9 },
    mark: { x: 0.86, y: 0.4, r: 20, s: 2, o: 1 },
    word: { x: 0.3, y: 0.315, r: 4, s: 1.15, o: 0.9 },
    menu: { x: 0.8, y: 0.31, r: -14, s: 1.4, o: 0.8 },
    eyebrow: { x: 0.3, y: 0.445, r: 0, s: 0.9, o: 0.9 },
    h1a: { x: 0.45, y: 0.37, r: -6, s: 0.78, o: 1 },
    h1b: { x: 0.56, y: 0.51, r: 7, s: 0.74, o: 1 },
    body: { x: 0.6, y: 0.62, r: -4, s: 0.85, o: 0.9 },
    button: { x: 0.28, y: 0.71, r: 10, s: 1, o: 1 },
    chip: { x: 0.74, y: 0.455, r: -14, s: 1.1, o: 1 },
    toggle: { x: 0.69, y: 0.89, r: -8, s: 0.95, o: 1 },
    progress: { x: 0.32, y: 0.935, r: 12, s: 0.6, o: 0.8 },
  },
};

// ── act II · the direction ──────────────────────────────────────────────────

/**
 * lg/xl: the interface opens as an exploded axonometric — the plane tilts back and turns, each layer
 * lifts off it by its depth (a fraction of the space's width): the container at 0, lines and image
 * just above, modules, type, then the controls nearest the eye.
 */
export const PLANE_AXO = { rotationX: 52, rotation: -28, scale: 0.76 };
/** …and moves down and left by these fractions of the space: the lifted layers stay clear of the header */
export const AXO_SHIFT = { x: -0.04, y: 0.08 };
export const LAYER_Z: Record<ShiftElement, number> = {
  frame: 0,
  bar: 0.02,
  rule: 0.02,
  visual: 0.055,
  card1: 0.075,
  card2: 0.075,
  card3: 0.075,
  mark: 0.11,
  word: 0.1,
  nav1: 0.1,
  nav2: 0.1,
  nav3: 0.1,
  menu: 0.1,
  cta: 0.125,
  eyebrow: 0.11,
  h1a: 0.14,
  h1b: 0.14,
  body: 0.12,
  button: 0.165,
  chip: 0.17,
  toggle: 0.185,
  progress: 0.165,
};

/**
 * Elsewhere (no CSS 3D outside lg/xl, Spec §15): a flat exploded view — every fragment straight, at
 * its own column, its distance from the interface's center line spread by this factor while the
 * plane steps back to make room.
 */
export const EXPLODE = { spread: 0.24, scale: 0.88 };

/** a fragment's flat-explode offset (px): only vertical, away from the interface's center line */
export function explodeOffset(cy: number, uiCy: number): number {
  return (cy - uiCy) * EXPLODE.spread;
}

// ── act IV · the result ─────────────────────────────────────────────────────

/** the camera steps back: the whole system, with room for its annotations */
export const RESULT_SCALE: Record<ShiftVariant, number> = { wide: 0.86, tablet: 0.88, phone: 0.9 };

/** columns of the grid each variant draws (the same number the annotation states) */
export const GRID_COLUMNS: Record<ShiftVariant, number> = { wide: 12, tablet: 8, phone: 4 };

// ── checks (tests) ──────────────────────────────────────────────────────────

/** a fragment's axis-aligned bounds in its first pose (rotation included), in space fractions */
export function scatterBounds(v: ShiftVariant, k: ShiftElement): { x0: number; y0: number; x1: number; y1: number } | null {
  const rect = UI_LAYOUT[v][k];
  const pose = SCATTER[v][k];
  if (!rect || !pose) return null;
  const sp = SHIFT_SPACE[v];
  const ui = UI_BOX[v];
  const uiW = ui.w * sp.w;
  const uiH = uiW / ui.ar;
  const w = rect.w * uiW * pose.s;
  const h = Math.max(1, rect.h * uiH) * pose.s;
  const a = (Math.abs(pose.r) * Math.PI) / 180;
  const bw = w * Math.cos(a) + h * Math.sin(a);
  const bh = w * Math.sin(a) + h * Math.cos(a);
  const cx = pose.x * sp.w;
  const cy = pose.y * sp.h;
  return { x0: (cx - bw / 2) / sp.w, y0: (cy - bh / 2) / sp.h, x1: (cx + bw / 2) / sp.w, y1: (cy + bh / 2) / sp.h };
}
