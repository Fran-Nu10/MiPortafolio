/**
 * Pure tier and gesture helpers (Spec §05, §15). No directive, no GSAP: geometry, server
 * components and tests import these directly; `lib/motion` re-exports them for scenes.
 * The four tiers must match the `--breakpoint-*` values in globals.css.
 */

// ── tiers ────────────────────────────────────────────────────────────────────

export type Tier = "xl" | "lg" | "md" | "sm";
export const TIERS: Tier[] = ["xl", "lg", "md", "sm"];

/** lower bound (px) of each tier — same values as `--breakpoint-*` in globals.css */
export const TIER_MIN: Record<Tier, number> = { sm: 0, md: 768, lg: 1024, xl: 1440 };

export const TIER_QUERIES: Record<Tier, string> = {
  xl: "(min-width: 1440px)",
  lg: "(min-width: 1024px) and (max-width: 1439.98px)",
  md: "(min-width: 768px) and (max-width: 1023.98px)",
  sm: "(max-width: 767.98px)",
};

export const RM_QUERY = "(prefers-reduced-motion: reduce)";
/** very small or very short viewports: pins are disabled, sections step in flow (Spec §24) */
export const TINY_QUERY = "(max-width: 359.98px), (max-height: 559.98px)";
/** Revelado portrait media: any tier with aspect < 0.8 */
export const PORTRAIT_QUERY = "(max-aspect-ratio: 4/5)";

/** conditions handed to every section's gsap.matchMedia() */
export const SCENE_CONDITIONS = { ...TIER_QUERIES, rm: RM_QUERY, tiny: TINY_QUERY } as const;
export type SceneConditions = Record<keyof typeof SCENE_CONDITIONS, boolean>;

export function tierForWidth(width: number): Tier {
  if (width >= TIER_MIN.xl) return "xl";
  if (width >= TIER_MIN.lg) return "lg";
  if (width >= TIER_MIN.md) return "md";
  return "sm";
}

export function tierFromConditions(c: Partial<SceneConditions>): Tier {
  return c.xl ? "xl" : c.lg ? "lg" : c.md ? "md" : "sm";
}

/** CSS 3D (perspective, translateZ) exists only at lg and xl (Spec §15 depth rule) */
export const hasDepth = (tier: Tier) => tier === "xl" || tier === "lg";

// ── gestures ─────────────────────────────────────────────────────────────────

/** one gesture (≈ a trackpad flick or 3–5 wheel notches), in vh. Starting values (Spec §29 Q8). */
export const GESTURE_VH: Record<Tier, number> = { xl: 80, lg: 80, md: 70, sm: 60 };
/** under reduced motion pins shorten to units × 50vh (Spec §16) */
export const RM_GESTURE_VH = 50;

export function pinLengthVh(units: number, tier: Tier, rm: boolean): number {
  return Math.round(units * (rm ? RM_GESTURE_VH : GESTURE_VH[tier]));
}

/** snap label prefix (resting states) and marker prefix (inside a gesture, never snapped) */
export const SNAP_PREFIX = "s:";
export const MARK_PREFIX = "m:";

/** progress (0–1) of every label starting with `prefix`, ascending */
export function labelStops(labels: Record<string, number>, duration: number, prefix = SNAP_PREFIX): number[] {
  return Object.entries(labels)
    .filter(([name]) => name.startsWith(prefix))
    .map(([, time]) => (duration > 0 ? time / duration : 0))
    .sort((a, b) => a - b);
}

/**
 * Directional label snap: settles on the next `s:` label in the direction of travel
 * (markers `m:` are skipped — the built-in labelsDirectional would stop on every label).
 */
export function snapToStop(stops: number[], value: number, direction: number): number {
  if (!stops.length) return value;
  const eps = 1e-4;
  if (direction >= 0) {
    for (const s of stops) if (s >= value - eps) return s;
    return stops[stops.length - 1];
  }
  for (let i = stops.length - 1; i >= 0; i--) if (stops[i] <= value + eps) return stops[i];
  return stops[0];
}

/** reduced motion / tiny viewports: the state shown is the last stop reached */
export function stepToStop(stops: number[], value: number): number {
  if (!stops.length) return value;
  let current = stops[0];
  for (const s of stops) if (s <= value + 1e-4) current = s;
  return current;
}
