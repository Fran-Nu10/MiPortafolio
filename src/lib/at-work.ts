import type { Rect01 } from "@/data/types";
import { GESTURE_VH, type Tier } from "./tiers";

/**
 * Franco at work (Spec §13) and the human moment (Spec §02 S7), pure: the frame's start and
 * end sizes per tier, the start pose as a uniform scale + clip inset over the frame laid out
 * at its end size (never a width/height animation), the phases of the 200vh pin, the monitor
 * close (a black plane with a clip-path hole that shrinks to `monitorFocus`), the progress at
 * which the frame covers half the viewport (video plays), and the human moment's aperture.
 */

export interface Size {
  w: number;
  h: number;
}

/** 200vh of pin on every tier (Spec §13), in gestures for `useScene` */
export const AT_WORK_PIN_VH = 200;
export const atWorkUnits = (tier: Tier) => AT_WORK_PIN_VH / GESTURE_VH[tier];

/** 0–60% the frame grows · 60–85% hold at 95% · 85–100% the transition boundary (monitor close) */
export const PHASE = { grow: 0.6, hold: 0.85 } as const;

/** the frame's end size (≈ 95% of the viewport; the aspect is released via the clip) */
export function frameEnd(vw: number, vh: number, tier: Tier): Size {
  return tier === "sm" ? { w: 0.95 * vw, h: 0.92 * vh } : { w: 0.95 * vw, h: 0.95 * vh };
}

/** the frame's start size: 16:9 at 56vw (lg/xl) or 72vw (md); 9:16 at 72vw capped at 70svh (sm) */
export function frameStart(vw: number, vh: number, tier: Tier): Size {
  if (tier === "sm") {
    const h = Math.min(0.72 * vw * (16 / 9), 0.7 * vh);
    return { w: h * (9 / 16), h };
  }
  const w = (tier === "md" ? 0.72 : 0.56) * vw;
  return { w, h: w * (9 / 16) };
}

export interface Pose {
  /** uniform scale of the frame (laid out at `end`) */
  scale: number;
  /** clip-path inset in the frame's own pixels: [top/bottom, left/right] */
  inset: [number, number];
}

/**
 * The start pose: the smallest uniform scale at which the scaled frame covers the start
 * window, and the local inset that leaves exactly that window visible. At scale 1 and inset
 * 0 the frame is the end size: one tween from this pose to {scale 1, inset 0} is the growth.
 */
export function startPose(start: Size, end: Size): Pose {
  const scale = Math.max(start.w / end.w, start.h / end.h);
  return { scale, inset: [Math.max(0, (end.h - start.h / scale) / 2), Math.max(0, (end.w - start.w / scale) / 2)] };
}

/** the pin progress at which the growing frame covers ≥ 50% of the viewport (the video plays) */
export function playAt(start: Size, end: Size, vw: number, vh: number): number {
  const s0 = startPose(start, end).scale;
  const s50 = Math.sqrt((0.5 * vw * vh) / (end.w * end.h));
  if (s50 <= s0) return 0;
  if (s50 >= 1) return PHASE.grow;
  return PHASE.grow * ((s50 - s0) / (1 - s0));
}

/**
 * The monitor plane's clip-path: a black plane over the frame with an even-odd hole. `t` 0 =
 * the hole is the whole frame (nothing covered); `t` 1 = the hole is `monitorFocus`. Both ends
 * share the same point count so GSAP can tween between them.
 */
export function monitorHole(focus: Rect01, t: number): string {
  const l = focus.x * t;
  const r = 1 - (1 - focus.x - focus.w) * t;
  const tp = focus.y * t;
  const b = 1 - (1 - focus.y - focus.h) * t;
  const pc = (v: number) => `${(v * 100).toFixed(3)}%`;
  return `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${pc(l)} ${pc(tp)}, ${pc(l)} ${pc(b)}, ${pc(r)} ${pc(b)}, ${pc(r)} ${pc(tp)}, ${pc(l)} ${pc(tp)})`;
}

/**
 * The human moment's aperture (Spec §02 S7): the same grammar as the opening's band. Over the
 * section's pass `p` (0–1): a centered horizontal band opens to the full frame between 0 and
 * 0.5, holds, then closes to black between 0.7 and 1. Returns the vertical inset (0–50%).
 */
export const BAND_INSET = 43;
export function apertureAt(p: number): number {
  if (p <= 0.5) return BAND_INSET * (1 - p / 0.5);
  if (p < 0.7) return 0;
  return 50 * Math.min(1, (p - 0.7) / 0.3);
}
