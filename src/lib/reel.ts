/**
 * Project Reel rules (Spec §06, Revelado 2.2 §7), pure so they are unit tested. The component
 * (components/reel/ProjectReel.tsx) only measures the DOM and applies these decisions.
 */

/** reel frame width per tier (Spec §06), as `sizes` for every poster at reel geometry */
export const REEL_SIZES = "(min-width: 1440px) 1094px, (min-width: 1024px) 76vw, (min-width: 768px) 84vw, calc(100vw - 32px)";

/** settle when released past 20% of the active width, or flicked faster than 0.4 px/ms */
export const RELEASE_DISTANCE = 0.2;
export const RELEASE_VELOCITY = 0.4;
/** past the first / last item the track follows the finger at 35% */
export const EDGE_RESISTANCE = 0.35;
/** a pointer that moved more than this is a drag, not a click */
export const CLICK_SLOP = 6;
/** touch: the axis is decided after this much movement */
export const AXIS_LOCK = 8;
/** horizontal wheel / trackpad: accumulated delta that makes one step… */
export const WHEEL_STEP = 40;
/** …and the silence that ends a gesture (one piece per gesture; trackpad inertia tails included) */
export const WHEEL_GESTURE_END = 240;
/** settle duration (s) */
export const SETTLE = 0.42;

/**
 * Track offset that centers item `index`: x(i) = (vw − Wᵢ)/2 − Σ_{j<i}(Wⱼ + gap).
 * Widths can differ per item (the 72svh height cap shrinks tall frames). With `inset` (phones,
 * docs/28 §2) the item starts at that distance from the left edge instead: x(i) = inset − Σ.
 */
export function trackOffset(index: number, widths: number[], viewportWidth: number, gap: number, inset?: number): number {
  let before = 0;
  for (let j = 0; j < index; j++) before += widths[j] + gap;
  return (inset ?? (viewportWidth - widths[index]) / 2) - before;
}

/** the track position while dragging: 1:1 inside, 35% past the ends */
export function dragPosition(start: number, dx: number, index: number, count: number): number {
  const pullingPastStart = index === 0 && dx > 0;
  const pullingPastEnd = index === count - 1 && dx < 0;
  return start + (pullingPastStart || pullingPastEnd ? dx * EDGE_RESISTANCE : dx);
}

/** samples older than this before the release do not count toward the flick */
export const VELOCITY_WINDOW = 100;

/**
 * Release velocity (px/ms): over the samples of the last VELOCITY_WINDOW ms before the last
 * sample (the release itself). A finger that stopped before lifting has no velocity.
 */
export function velocity(samples: { x: number; t: number }[], windowMs: number = VELOCITY_WINDOW): number {
  if (samples.length < 2) return 0;
  const b = samples[samples.length - 1];
  const recent = samples.filter((s) => b.t - s.t <= windowMs);
  if (recent.length < 2) return 0;
  const a = recent[0];
  const dt = b.t - a.t;
  return dt > 0 ? (b.x - a.x) / dt : 0;
}

/** where a released drag settles: one piece at most, never past the ends */
export function releaseIndex(index: number, count: number, dx: number, v: number, width: number): number {
  const far = Math.abs(dx) > RELEASE_DISTANCE * width;
  const fast = Math.abs(v) > RELEASE_VELOCITY && Math.sign(v) === Math.sign(dx);
  if (!far && !fast) return index;
  const next = dx < 0 ? index + 1 : index - 1;
  return Math.max(0, Math.min(count - 1, next));
}

/**
 * Horizontal wheel / trackpad: the vertical wheel is never captured. Returns the horizontal
 * delta to act on, or null when the event must pass through untouched.
 */
export function horizontalDelta(e: { deltaX: number; deltaY: number; shiftKey: boolean }): number | null {
  if (e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)) return e.deltaY;
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return e.deltaX;
  return null;
}

/**
 * One piece per gesture: deltas accumulate until they cross the step; then the gesture is
 * spent until the wheel has been silent for WHEEL_GESTURE_END ms (trackpad inertia included).
 */
export function createWheelGesture() {
  let acc = 0;
  let spent = false;
  let last = -Infinity;
  return {
    /** feed a delta at time `now` (ms); returns −1 / +1 when a step fires, else 0 */
    push(delta: number, now: number): -1 | 0 | 1 {
      if (now - last > WHEEL_GESTURE_END) {
        acc = 0;
        spent = false;
      }
      last = now;
      if (spent) return 0;
      acc += delta;
      if (Math.abs(acc) < WHEEL_STEP) return 0;
      spent = true;
      return acc > 0 ? 1 : -1;
    },
  };
}

/**
 * Video lifecycle per item (Spec §06 table). `distance` = |item − active|. The reel being
 * within one viewport (`near`) is when any video may exist at all; playback starts only on
 * snap completion (`settled`), never during a drag.
 */
export function reelVideoPlan(p: {
  distance: number;
  near: boolean;
  settled: boolean;
  /** ms since the item was last within one of the active item (Infinity if never) */
  awayFor: number;
  reducedMotion: boolean;
  saveData: boolean;
}): { mount: boolean; preload: "none" | "metadata" | "auto"; play: boolean } {
  if (p.reducedMotion || p.saveData || !p.near) return { mount: false, preload: "none", play: false };
  if (p.distance === 0) return { mount: true, preload: "auto", play: p.settled };
  if (p.distance === 1) return { mount: true, preload: "metadata", play: false };
  // kept paused (currentTime kept) until it has been ≥ 2 away for more than 10 s
  return { mount: p.awayFor <= 10_000, preload: "metadata", play: false };
}
