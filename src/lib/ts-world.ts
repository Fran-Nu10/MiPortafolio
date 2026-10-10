import type { Tier } from "./tiers";

/**
 * TravelSuite360 world (Spec §08), pure: design-space layout per variant, label times and the
 * perspective projection. Every position is in the world's own design space — 1440×900 (xl/lg/md)
 * or 390×844 (sm) — never in viewport pixels; the scene scales the space once.
 *
 * Variants (Spec §15 depth rule, §16):
 * - `deep`  xl/lg: CSS 3D — `perspective 1400px`, depths are `translateZ`, the camera dollies
 * - `flat`  md, and reduced motion on md+: the same composition, depth drawn in 2D (each depth
 *           element projected to its x / y / scale; no `translateZ` anywhere)
 * - `sm`    phones (and their reduced motion): the sm columns of §08, 2D
 */

export const P = 1400;

export type TsVariant = "deep" | "flat" | "sm";

export function tsVariant(tier: Tier, rm: boolean): TsVariant {
  if (tier === "sm") return "sm";
  return tier === "md" || rm ? "flat" : "deep";
}

/** perceived scale of a plane at total depth z (camera included): k = P / (P − z) */
export const perceived = (z: number) => P / (P - z);
/** the depth that reads as a given scale: z = P·(1 − 1/scale) (Spec §08) */
export const depthFor = (scale: number) => P * (1 - 1 / scale);

/**
 * Where a point at (x, y) on a plane at total depth z lands in the frame, seen through a
 * perspective origin (ox, oy): the 2D drawing of a `translateZ` (transform-origin 0 0).
 */
export function project(p: { x: number; y: number; z: number }, origin: { x: number; y: number }) {
  const s = perceived(p.z);
  return { x: origin.x + (p.x - origin.x) * s, y: origin.y + (p.y - origin.y) * s, scale: s };
}

/** labels (timeline units). SCREEN 0 · ISOLATE 1 · TS01 2 … hold → 7.5 (Spec §08 unit budget) */
export const TS_T = {
  TS01: 2,
  /** m:TS02 — the key words detach over the first 0.4 of the unit */
  TS02: 2,
  TS02_END: 2.4,
  TS03: 3,
  TS04: 4,
  TS05: 4.6,
  TS06: 5.1,
  /** m:TS08 — the reveal becomes visible as the dolly begins */
  TS08: 5.12,
  TS09B: 6.7,
  END: 7.5,
} as const;

/** the dolly: camZ 0 → −800 over TS06 → TS09b with power2.in; 09a rests where camZ = −300 */
export const DOLLY = { from: 0, to: -800, toSm: -500, stopA: -300 };
/** time of the first dolly stop. GSAP's power2.in is cubic (power1 is the quadratic): it
 * reaches −300 of −800 at ∛(3/8) of the way */
export const ts09aTime = () => TS_T.TS06 + (TS_T.TS09B - TS_T.TS06) * Math.cbrt(DOLLY.stopA / DOLLY.to);

/** unit budget: 7.5 (600vh at 80vh per gesture) · reduced motion: the card cut at 0.5, 6 units */
export const TS_UNITS = 7.5;
export const TS_UNITS_RM = 6;

/** autos (time-based, seconds): TS07 500 ms after the trip, signal 500 ms, report 400 ms; TS10 */
export const AUTO = { reservationDelay: 0.5, signal: 0.5, signalExit: 0.2, report: 0.4, nameDelay: 1, name: 0.8, driftStop: 0.6 };

export interface Pt {
  x: number;
  y: number;
}
export interface Placed extends Pt {
  z: number;
  opacity: number;
}

export interface TsLayout {
  space: { w: number; h: number };
  /** perspective origin per state (fractions of the space) */
  origin: { rest: Pt; follow: Pt; followEnd: Pt };
  /** TS01: the sentence; `center` → y is the sentence's vertical center, else its top */
  raw: Pt & { center: boolean };
  /** TS03 */
  sentenceLow: Pt & { opacity: number };
  interpretado: Pt;
  /** perceived depths (camera included): the scene subtracts the camera's lean */
  fields: { dest: Placed; date: Placed; pax: Placed };
  camTs03: number;
  /** TS04 / TS05 */
  q1: Placed;
  q2: Placed;
  q2Out: Placed;
  /** TS06 */
  trip: Pt;
  /** TS09: the followed trip, centered, at perceived .7 */
  tripCenter: Pt;
  tripDepth: number;
  dollyTo: number;
  /** TS10 */
  name: Pt;
  /** depth groups in use (indices into TS_GROUP_Z) */
  groups: number[];
  drift: boolean;
}

const DESKTOP: Omit<TsLayout, "groups" | "drift"> = {
  space: { w: 1440, h: 900 },
  origin: { rest: { x: 0.5, y: 0.5 }, follow: { x: 0.39, y: 0.5 }, followEnd: { x: 0.45, y: 0.5 } },
  raw: { x: 160, y: 450, center: true },
  sentenceLow: { x: 160, y: 560, opacity: 0.45 },
  interpretado: { x: 160, y: 140 },
  fields: {
    dest: { x: 560, y: 140, z: depthFor(1.25), opacity: 1 },
    date: { x: 220, y: 300, z: depthFor(0.9), opacity: 0.85 },
    pax: { x: 1020, y: 360, z: depthFor(0.7), opacity: 0.6 },
  },
  camTs03: 200,
  q1: { x: 120, y: 160, z: 0, opacity: 1 },
  q2: { x: 120, y: 520, z: depthFor(0.72), opacity: 0.4 },
  q2Out: { x: 120, y: 520, z: -900, opacity: 0 },
  trip: { x: 760, y: 150 },
  // centered horizontally; vertically a little above center so the name (y 560) stays clear
  tripCenter: { x: 420, y: 224 },
  tripDepth: depthFor(0.7),
  dollyTo: DOLLY.to,
  name: { x: 720, y: 560 },
};

export const TS_LAYOUT: Record<TsVariant, TsLayout> = {
  deep: { ...DESKTOP, groups: [0, 1, 2, 3], drift: true },
  // md: 32 fragments in 2 groups (z 0 / −600) — the desktop set's groups 0 and 2
  flat: { ...DESKTOP, groups: [0, 2], drift: true },
  sm: {
    space: { w: 390, h: 844 },
    origin: { rest: { x: 0.5, y: 0.5 }, follow: { x: 0.5, y: 0.5 }, followEnd: { x: 0.5, y: 0.5 } },
    raw: { x: 24, y: 300, center: false },
    sentenceLow: { x: 24, y: 520, opacity: 0.45 },
    interpretado: { x: 24, y: 72 },
    // a 2D column, no depth (Spec §08 sm)
    fields: {
      dest: { x: 24, y: 120, z: 0, opacity: 1 },
      date: { x: 24, y: 200, z: 0, opacity: 0.85 },
      pax: { x: 24, y: 280, z: 0, opacity: 0.6 },
    },
    camTs03: 0,
    q1: { x: 24, y: 120, z: 0, opacity: 1 },
    q2: { x: 24, y: 460, z: 0, opacity: 0.4 },
    q2Out: { x: 24, y: 460, z: 0, opacity: 0 },
    trip: { x: 24, y: 140 },
    tripCenter: { x: 24, y: 180 },
    tripDepth: depthFor(0.7),
    dollyTo: DOLLY.toSm,
    name: { x: 195, y: 600 },
    groups: [0, 2],
    drift: false,
  },
};

/** the three key words of the message (substrings of Content Master 06's raw sentence) */
export const TS_KEY_WORDS = { dest: "Punta Cana", date: "julio", pax: "cuatro" } as const;

/** "destino · Punta Cana" → { label: "destino", value: "Punta Cana" } (Content Master 06 strings) */
export function splitField(text: string): { label: string; value: string } {
  const i = text.indexOf(" · ");
  return i < 0 ? { label: text, value: "" } : { label: text.slice(0, i), value: text.slice(i + 3) };
}

/** "a · b · c" → ["a", "b", "c"] */
export const splitList = (text: string) => text.split(" · ").map((s) => s.trim()).filter(Boolean);

/** the active chapter of a proof recording at time t (seconds) */
export function chapterAt(chapters: { label: string; at: number }[], t: number): number {
  let i = 0;
  for (let c = 0; c < chapters.length; c++) if (t >= chapters[c].at) i = c;
  return i;
}
