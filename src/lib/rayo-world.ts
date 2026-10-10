import type { Rect01 } from "@/data/types";
import type { Tier } from "./tiers";

/**
 * Rayo Smash world (Spec §09), pure: labels, the layer arrangements and the clip rules. The
 * stage is the 1440×900 design space (390×844 on phones), scaled once like TravelSuite360's.
 *
 * The real hero shows the Clásica already exploded (six bands, a double smash), so the
 * arrangement the poster shows — "the whole burger" of §09 — is the stack as captured. R04
 * separates the layers further, with depth on lg/xl; R06 is the first time the burger is
 * whole: the layers settle into their assembled positions.
 */

/** units: SCREEN 0 · ISOLATE 1 · R02 2 (= s:WORLD) · R03 2.6 · R04 3.6 · R05 3.9 · R06 4.9 · R07 5.5 */
export const R_T = { R02: 2, R03: 2.6, R04: 3.6, R05: 3.9, R06: 4.9, R07: 5.5, END: 5.7 } as const;
export const RAYO_UNITS = 5.7;
/** reduced motion: three stills after the card cut (assembled → exploded + title → assembled + line) */
export const RAYO_UNITS_RM = 3.5;
export const R_T_RM = { R02: 0.5, R04: 1.5, R06: 2.5, END: 3.5 } as const;

/** perspective on the stage (Spec §09 starting value) */
export const RAYO_PERSPECTIVE = 1200;
/** R04: the layer group tilts slightly (lg/xl only) */
export const R04_TILT = 8;
/** R04 depths, top → bottom, over the §09 range for six layers */
export const R04_Z = [0, -64, -128, -192, -256, -320];
/** R04 spread: top −32% → bottom +30% of the assembled burger's height, linear */
export const R04_SPREAD = { top: -0.32, bottom: 0.3 };
/** R06: the assembly staggers bottom-up, 60 ms equivalent per layer */
export const R06_STAGGER = 0.06;

export type RayoVariant = "deep" | "flat" | "sm";
export function rayoVariant(tier: Tier, rm: boolean): RayoVariant {
  if (tier === "sm") return "sm";
  return tier === "md" || rm ? "flat" : "deep";
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The assembled burger: the layers stacked as one, bottom-up. Each layer rests on the one
 * below, sunk by a share of its own height (buns and patties seat deeper than bacon and
 * onion, which sit on top of what is under them). A fixed geometric rule — no morph.
 */
export const SEAT: Record<string, number> = { topBun: 0.42, bacon: 0.55, patty: 0.5, onion: 0.6, patty2: 0.5, bottomBun: 0 };

/** layer boxes (in stack units: the stack's width is 1) for the poster arrangement */
export function posterBoxes(layers: { name: string; offset: Rect01 }[], stack: { w: number; h: number }): Box[] {
  const k = stack.h / stack.w;
  return layers.map((l) => ({ x: l.offset.x, y: l.offset.y * k, w: l.offset.w, h: l.offset.h * k }));
}

/** the assembled arrangement, in the same units, centered on the poster stack's x center */
export function assembledBoxes(layers: { name: string; offset: Rect01 }[], stack: { w: number; h: number }): Box[] {
  const p = posterBoxes(layers, stack);
  const out: Box[] = new Array(p.length);
  // bottom-up: the bottom bun keeps its place, every layer above seats into the one below
  let top = p[p.length - 1].y;
  for (let i = p.length - 1; i >= 0; i--) {
    const b = p[i];
    const seat = i === p.length - 1 ? 0 : SEAT[layers[i].name] ?? 0.5;
    const y = i === p.length - 1 ? b.y : top - b.h * (1 - seat);
    out[i] = { x: b.x, y, w: b.w, h: b.h };
    top = y;
  }
  // keep the assembled burger centered where the poster stack was, vertically
  const pc = (p[0].y + p[p.length - 1].y + p[p.length - 1].h) / 2;
  const ac = (out[0].y + out[out.length - 1].y + out[out.length - 1].h) / 2;
  const dy = pc - ac;
  return out.map((b) => ({ ...b, y: b.y + dy }));
}

/** R04: each layer's extra y offset (stack units) and depth from the poster arrangement */
export function explodeOffsets(count: number, assembledHeight: number, variant: RayoVariant): { dy: number; z: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const t = count > 1 ? i / (count - 1) : 0;
    const dy = (R04_SPREAD.top + (R04_SPREAD.bottom - R04_SPREAD.top) * t) * assembledHeight;
    return { dy, z: variant === "deep" ? R04_Z[Math.min(i, R04_Z.length - 1)] : 0 };
  });
}

/** the assembled burger's height in stack units */
export const stackHeight = (boxes: Box[]) => Math.max(...boxes.map((b) => b.y + b.h)) - Math.min(...boxes.map((b) => b.y));

/**
 * Whether R05 (the prerendered camera move) runs: a clip for the tier exists, it can play
 * through, no reduced motion, no Save-Data. Otherwise R04 goes straight to R06 (Spec §09).
 */
export function canRunClip(o: { hasClip: boolean; ready: boolean; rm: boolean; saveData: boolean }): boolean {
  return o.hasClip && o.ready && !o.rm && !o.saveData;
}

/** the menu line: "Clásica · doble medallón … · $ 490" → name, description, price */
export function splitMenuLine(text: string): { name: string; detail: string; price: string } {
  const parts = text.split(" · ");
  if (parts.length < 3) return { name: text, detail: "", price: "" };
  return { name: parts[0], detail: parts.slice(1, -1).join(" · "), price: parts[parts.length - 1] };
}
