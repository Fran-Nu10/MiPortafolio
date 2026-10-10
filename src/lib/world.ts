import { DESIGN_SPACE, designScale, type Rect, type Viewport } from "./geometry";
import type { Tier } from "./tiers";
import type { WorldType } from "@/data/types";

/**
 * Card → World grammar (Spec §07), pure. Every world starts at SCREEN — its reel poster at the
 * shared reel rectangle with the escaping object aligned over it — and EXPANDs the object to
 * the world's own `escapeTo` rect. Positions are computed from two rects (FLIP), never
 * hardcoded in tweens.
 */

/** units per gesture: SCREEN 0 · ISOLATE 1 · (ESCAPE) · WORLD 2 · hold */
export const WORLD_UNITS = 2.5;
/** reduced motion: SCREEN → (one gesture) the object large in its environment → hold */
export const WORLD_UNITS_RM = 1;

/** the world's design space (1440×900, or 390×844 on sm) scaled to fit and centered */
export function spaceRect(viewport: Viewport, tier: Tier): Rect & { s: number } {
  const space = tier === "sm" ? DESIGN_SPACE.mobile : DESIGN_SPACE.desktop;
  const s = designScale(viewport, tier);
  const w = space.w * s;
  const h = space.h * s;
  return { x: (viewport.width - w) / 2, y: (viewport.height - h) / 2, w, h, s };
}

/**
 * Where each world's escaping object lands at the end of EXPAND (the world's first state):
 * - TravelSuite360 · the message at TS01: x 160, vertically centered (sm: x 24, y 300), in the
 *   design space — `object` is the text's own box at its design size
 * - Rayo · the burger centered at 62% of the space height (sm: 70% of its width)
 * - Santi · the photograph centered at 78% of the space height (sm: full width, ≤ 62% height)
 * - Chef · full-bleed: the image itself becomes the environment
 */
export function escapeRect(worldType: WorldType, tier: Tier, viewport: Viewport, object: { w: number; h: number }): Rect {
  const sp = spaceRect(viewport, tier);
  const aspect = object.w / object.h;
  const centered = (w: number, h: number): Rect => ({ x: (viewport.width - w) / 2, y: (viewport.height - h) / 2, w, h });
  switch (worldType) {
    case "ts-depth": {
      // `object` is the message at its design-space size (64px, ≤ 1100 wide; sm 34px, ≤ 342):
      // it lands scaled with the space, exactly where the scene's sentence sits
      const w = object.w * sp.s;
      const h = object.h * sp.s;
      if (tier === "sm") return { x: sp.x + 24 * sp.s, y: sp.y + 300 * sp.s, w, h };
      return { x: sp.x + 160 * sp.s, y: sp.y + (450 - object.h / 2) * sp.s, w, h };
    }
    case "rayo-layers": {
      if (tier === "sm") {
        const w = 0.7 * sp.w;
        return centered(w, w / aspect);
      }
      const h = 0.62 * sp.h;
      return centered(h * aspect, h);
    }
    case "santi-editorial": {
      if (tier === "sm") {
        const w = Math.min(viewport.width, 0.62 * viewport.height * aspect);
        return centered(w, w / aspect);
      }
      const h = 0.78 * sp.h;
      return centered(h * aspect, h);
    }
    case "chef-commerce": {
      const k = Math.max(viewport.width / object.w, viewport.height / object.h);
      return centered(object.w * k, object.h * k);
    }
  }
}

/** transform from `from` to `to` (transform-origin 0 0, uniform scale) */
export function flip(from: Rect, to: Rect): { x: number; y: number; scale: number } {
  return { x: to.x - from.x, y: to.y - from.y, scale: to.w / from.w };
}
