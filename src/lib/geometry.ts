import { tierForWidth, type Tier } from "./tiers";

/**
 * The one geometric guarantee (Spec §07): the active reel frame, every world's SCREEN state
 * and every proof window are the same viewport-centered rectangle, computed here. Any change
 * to the reel geometry propagates to all three. Values from Revelado 2.2 · reel spec (Spec §06).
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Viewport {
  width: number;
  /** small viewport height (svh): stable while mobile URL bars move */
  height: number;
}

/** frame aspect per project, as [w, h] — desktop tiers and the sm portrait crop */
export interface FrameAspect {
  desktop: [number, number];
  mobile: [number, number];
}

const MAX_W = 1094;

/** gap between reel items per tier (px) */
export const REEL_GAP: Record<Tier, number> = { xl: 32, lg: 32, md: 24, sm: 8 };

/** active frame width before the height cap */
export function reelWidth(tier: Tier, vw: number): number {
  switch (tier) {
    case "xl":
      return Math.min(MAX_W, 0.76 * vw);
    case "lg":
      return 0.76 * vw;
    case "md":
      return 0.84 * vw;
    case "sm":
      return vw - 32;
  }
}

/** active reel frame rectangle in viewport px */
export function reelRect(aspect: FrameAspect, viewport: Viewport, tier: Tier = tierForWidth(viewport.width)): Rect {
  const { width: vw, height: vh } = viewport;
  const [aw, ah] = tier === "sm" ? aspect.mobile : aspect.desktop;
  let w = reelWidth(tier, vw);
  let h = (w * ah) / aw;
  // height cap: shrink the width to keep the aspect (photographs never distort)
  const cap = tier === "sm" ? 0.64 * vh : 0.72 * vh;
  if (h > cap) {
    h = cap;
    w = (h * aw) / ah;
  }
  const x = (vw - w) / 2;
  const y = tier === "sm" ? 0.18 * vh : (vh - h) / 2;
  return { x, y, w, h };
}

/** reel track offset for item i: x(i) = (100vw − W)/2 − i·(W + gap) */
export function reelTrackX(index: number, frameWidth: number, viewportWidth: number, tier: Tier): number {
  return (viewportWidth - frameWidth) / 2 - index * (frameWidth + REEL_GAP[tier]);
}

/** visible part of each neighbour: (100vw − W)/2 − gap */
export function neighbourVisible(frameWidth: number, viewportWidth: number, tier: Tier): number {
  return (viewportWidth - frameWidth) / 2 - REEL_GAP[tier];
}

/** worlds are authored in a fixed design space: 1440×900 (xl/lg/md) and 390×844 (sm) */
export const DESIGN_SPACE: Record<"desktop" | "mobile", { w: number; h: number }> = {
  desktop: { w: 1440, h: 900 },
  mobile: { w: 390, h: 844 },
};

/** the single `scale(s)` applied to a world's design space so it fits the stage */
export function designScale(viewport: Viewport, tier: Tier = tierForWidth(viewport.width)): number {
  const space = tier === "sm" ? DESIGN_SPACE.mobile : DESIGN_SPACE.desktop;
  return Math.min(viewport.width / space.w, viewport.height / space.h);
}

/** perceived scale → translateZ under perspective P: z = P·(1 − 1/scale) (Spec §08) */
export function zForScale(scale: number, perspective = 1400): number {
  return perspective * (1 - 1 / scale);
}

/** a normalized rect (0–1 in an asset's own space) placed inside a pixel rect */
export function placeRect(norm: { x: number; y: number; w: number; h: number }, frame: Rect): Rect {
  return { x: frame.x + norm.x * frame.w, y: frame.y + norm.y * frame.h, w: norm.w * frame.w, h: norm.h * frame.h };
}
