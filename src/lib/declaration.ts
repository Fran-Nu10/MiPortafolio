/**
 * The commercial declaration — MOSTRAR → CONVENCER → CONVERTIR (Content Master 20). Pure
 * geometry and timing, no GSAP: the scene (components/declaration) and the tests import it.
 *
 * One pinned stage, one continuous choreography in three movements:
 * - discovery: ten small words latent in depth come into contrast, then are drawn into a red
 *   line that opens like an aperture on MOSTRAR.;
 * - organization: six words arrive loose and settle into a grid; CONVENCER. rises over it;
 * - resolution: the grid collapses into one track with four actions; they converge on one point,
 *   the point becomes the line, the line opens on CONVERTIR., and the final phrase lands.
 * Each protagonist word then shrinks into a running index (top left), so the three ideas stay
 * on screen as one statement. Every state is a resting label (one gesture = one change).
 *
 * Composition lives in a design space with a fixed aspect per variant (CSS sizes it and its type
 * in container units); positions here are fractions of that space.
 */

export const DEC_STATES = ["CAMPO", "DESCUBRE", "MOSTRAR", "ORDEN", "CONVENCER", "ACCION", "CONVERTIR", "ELIJAN"] as const;
export type DecState = (typeof DEC_STATES)[number];

/** state labels, in gestures (timeline units) */
export const DEC_AT: Record<DecState, number> = {
  CAMPO: 0,
  DESCUBRE: 0.8,
  MOSTRAR: 1.8,
  ORDEN: 2.8,
  CONVENCER: 3.6,
  ACCION: 4.6,
  CONVERTIR: 5.5,
  ELIJAN: 6.4,
};
/** pin length in gestures: the last state holds half a gesture before the pin releases */
export const DEC_UNITS = 6.9;

/** a moment inside the gesture that leads to `state`: 0 = the previous state, 1 = `state` */
export function within(state: DecState, f: number): number {
  const i = DEC_STATES.indexOf(state);
  const from = i > 0 ? DEC_AT[DEC_STATES[i - 1]] : 0;
  return from + (DEC_AT[state] - from) * f;
}

/** duration of a span of that gesture, in units */
export function span(state: DecState, a: number, b: number): number {
  return within(state, b) - within(state, a);
}

// ── composition variants ─────────────────────────────────────────────────────

/**
 * wide: landscape screens (1440 × 900 space) · tablet: portrait tablets (820 × 1180) · phone:
 * phones (390 × 844). The same media conditions are in globals.css (`.dec-space`).
 */
export type DecVariant = "wide" | "tablet" | "phone";
export const DEC_SPACE: Record<DecVariant, { w: number; h: number }> = {
  wide: { w: 1440, h: 900 },
  tablet: { w: 820, h: 1180 },
  phone: { w: 390, h: 844 },
};

export function decVariant(width: number, height: number): DecVariant {
  if (width < 768) return "phone";
  return width / height <= 0.9 ? "tablet" : "wide";
}

/** the final track runs horizontally under the actions, except on phones (a column) */
export const trackAxis = (v: DecVariant): "x" | "y" => (v === "phone" ? "y" : "x");

// ── act I · the field ────────────────────────────────────────────────────────

/** a latent word: top-left at (x, y) of the space, size in container units, opacity, depth (px) */
export interface FieldPose {
  x: number;
  y: number;
  fs: number;
  o: number;
  z: number;
}

/**
 * The ten words of act I, in the copy's order (productos … valor). An asymmetric constellation,
 * denser right of center, "valor" brightest at the core; far words are smaller, fainter and (on
 * lg/xl) deeper. Landscape and portrait compositions are drawn separately — never a reflow. Latent,
 * not absent: from .28 to .48 (docs/26 §A3 — at .12 the first state read as an empty black screen).
 */
export const FIELD_WIDE: FieldPose[] = [
  { x: 0.6, y: 0.27, fs: 1.9, o: 0.4, z: -300 },
  { x: 0.08, y: 0.16, fs: 1.2, o: 0.31, z: -700 },
  { x: 0.3, y: 0.68, fs: 1.5, o: 0.35, z: -450 },
  { x: 0.8, y: 0.58, fs: 1.1, o: 0.29, z: -800 },
  { x: 0.2, y: 0.4, fs: 2.2, o: 0.42, z: -200 },
  { x: 0.9, y: 0.12, fs: 1, o: 0.28, z: -900 },
  { x: 0.52, y: 0.82, fs: 1.3, o: 0.32, z: -600 },
  { x: 0.03, y: 0.86, fs: 1, o: 0.28, z: -900 },
  { x: 0.76, y: 0.84, fs: 1.4, o: 0.33, z: -500 },
  { x: 0.45, y: 0.46, fs: 2.8, o: 0.48, z: -150 },
];

export const FIELD_PORTRAIT: FieldPose[] = [
  { x: 0.52, y: 0.2, fs: 4.6, o: 0.4, z: 0 },
  { x: 0.08, y: 0.14, fs: 3.6, o: 0.31, z: 0 },
  { x: 0.14, y: 0.58, fs: 4, o: 0.35, z: 0 },
  { x: 0.48, y: 0.66, fs: 3.4, o: 0.29, z: 0 },
  { x: 0.1, y: 0.34, fs: 5.2, o: 0.42, z: 0 },
  { x: 0.7, y: 0.3, fs: 3.4, o: 0.28, z: 0 },
  { x: 0.4, y: 0.8, fs: 3.8, o: 0.32, z: 0 },
  { x: 0.62, y: 0.88, fs: 3.4, o: 0.28, z: 0 },
  { x: 0.08, y: 0.76, fs: 3.8, o: 0.33, z: 0 },
  { x: 0.42, y: 0.46, fs: 7, o: 0.48, z: 0 },
];

/** tablets keep the portrait drawing at a smaller size (their space is twice as wide) */
export const TABLET_FS = 0.55;

export function fieldPoses(v: DecVariant): FieldPose[] {
  if (v === "wide") return FIELD_WIDE;
  return v === "tablet" ? FIELD_PORTRAIT.map((p) => ({ ...p, fs: +(p.fs * TABLET_FS).toFixed(3) })) : FIELD_PORTRAIT;
}

/** the field's center: discovery draws every word a little toward it */
export const FIELD_CENTER = { x: 0.47, y: 0.48 };
const GATHER = 0.3;

/**
 * DESCUBRE: the same constellation, in contrast — forward (z 0), legible (opacity ≥ .6, paper on
 * black ≥ 5:1), tightened toward the center. The hierarchy of the field is kept.
 */
export function foundPose(p: FieldPose): { x: number; y: number; o: number } {
  return {
    x: +(p.x + (FIELD_CENTER.x - p.x) * GATHER).toFixed(4),
    y: +(p.y + (FIELD_CENTER.y - p.y) * GATHER).toFixed(4),
    o: +Math.min(1, 0.6 + p.o).toFixed(3),
  };
}

// ── act II · the loose words before the grid ─────────────────────────────────

/** where each of the six words of act II arrives from, relative to its cell (fractions of the space) */
export interface LoosePose {
  dx: number;
  dy: number;
  scale: number;
}

export const LOOSE: LoosePose[] = [
  { dx: 0.1, dy: -0.3, scale: 0.7 },
  { dx: 0.06, dy: -0.38, scale: 0.8 },
  { dx: 0, dy: 0.12, scale: 0.75 },
  { dx: 0, dy: -0.24, scale: 0.85 },
  { dx: 0.06, dy: 0.1, scale: 0.7 },
  { dx: -0.2, dy: -0.42, scale: 0.8 },
];

/** grid shape per variant (CSS draws the cells; the scene only moves words into them) */
export const GRID_COLS: Record<DecVariant, number> = { wide: 3, tablet: 3, phone: 2 };

/**
 * Advance width of each protagonist, in em (Schibsted Grotesk 900, measured): the red line of an
 * aperture and the final track are as wide as their word. Mirrored in globals.css.
 */
export const WORD_EM = { MOSTRAR: 5.71, CONVENCER: 6.86, CONVERTIR: 6.66 } as const;

/**
 * Act III's line, split for its typography: the first sentence small, the second monumental with
 * its last word on its own line and the period as the one red mark. Concatenated with single
 * spaces, the parts read exactly as the line («Que no solo te vean. Que te elijan.»).
 */
export function splitFinal(line: string): { first: string; lead: string; word: string; mark: string } {
  const cut = line.indexOf(". ");
  const first = cut >= 0 ? line.slice(0, cut + 1) : "";
  const second = cut >= 0 ? line.slice(cut + 2) : line;
  const space = second.lastIndexOf(" ");
  const lead = space >= 0 ? second.slice(0, space) : "";
  const tail = space >= 0 ? second.slice(space + 1) : second;
  const mark = /[.!?]$/.test(tail) ? tail.slice(-1) : "";
  return { first, lead, word: mark ? tail.slice(0, -1) : tail, mark };
}
