/**
 * Phase 3 units: the Project Reel rules (Spec §06, Revelado 2.2 §7).
 */
import { describe, expect, it } from "vitest";
import { reelRect } from "@/lib/geometry";
import {
  EDGE_RESISTANCE,
  WHEEL_GESTURE_END,
  createWheelGesture,
  dragPosition,
  horizontalDelta,
  reelVideoPlan,
  releaseIndex,
  trackOffset,
  velocity,
} from "@/lib/reel";

describe("track offset", () => {
  it("centers the active piece: x(i) = (vw − W)/2 − Σ(W + gap)", () => {
    const w = [1094, 1094, 1013, 1094];
    expect(trackOffset(0, w, 1440, 32)).toBe(173);
    expect(trackOffset(1, w, 1440, 32)).toBe(173 - 1126);
    // a narrower (height-capped) piece is still centered
    expect(trackOffset(2, w, 1440, 32)).toBeCloseTo((1440 - 1013) / 2 - 2 * 1126);
  });

  it("matches the shared reel geometry (the proof and SCREEN rect)", () => {
    const r = reelRect({ desktop: [1094, 616], mobile: [358, 420] }, { width: 1440, height: 900 });
    expect(trackOffset(0, [r.w], 1440, 32)).toBeCloseTo(r.x);
  });

  it("the neighbour shows 141px at 1440", () => {
    expect((1440 - 1094) / 2 - 32).toBe(141);
  });
});

describe("drag", () => {
  it("follows 1:1 inside, at 35% past the ends", () => {
    expect(dragPosition(100, -50, 1, 4)).toBe(50);
    expect(dragPosition(100, 50, 0, 4)).toBe(100 + 50 * EDGE_RESISTANCE);
    expect(dragPosition(100, -50, 3, 4)).toBe(100 - 50 * EDGE_RESISTANCE);
  });

  it("velocity from the last samples (px/ms)", () => {
    expect(velocity([{ x: 0, t: 0 }, { x: -20, t: 10 }, { x: -60, t: 20 }])).toBe(-3);
    expect(velocity([{ x: 0, t: 0 }])).toBe(0);
  });

  it("settles one piece past 20% of the width or above 0.4 px/ms, never more", () => {
    expect(releaseIndex(1, 4, -0.21 * 1000, 0, 1000)).toBe(2);
    expect(releaseIndex(1, 4, 0.21 * 1000, 0, 1000)).toBe(0);
    expect(releaseIndex(1, 4, -0.1 * 1000, 0, 1000)).toBe(1);
    expect(releaseIndex(1, 4, -40, -0.6, 1000)).toBe(2);
    expect(releaseIndex(1, 4, -40, 0.6, 1000)).toBe(1); // a flick against the drag does not count
    expect(releaseIndex(1, 4, -3 * 1000, -5, 1000)).toBe(2); // one piece per gesture
    expect(releaseIndex(3, 4, -500, -2, 1000)).toBe(3);
    expect(releaseIndex(0, 4, 500, 2, 1000)).toBe(0);
  });
});

describe("wheel", () => {
  it("the vertical wheel is never captured", () => {
    expect(horizontalDelta({ deltaX: 0, deltaY: 120, shiftKey: false })).toBeNull();
    expect(horizontalDelta({ deltaX: 10, deltaY: 40, shiftKey: false })).toBeNull();
    expect(horizontalDelta({ deltaX: 40, deltaY: 10, shiftKey: false })).toBe(40);
    // Shift + wheel is the horizontal axis
    expect(horizontalDelta({ deltaX: 0, deltaY: 120, shiftKey: true })).toBe(120);
  });

  it("one piece per gesture, inertia included; a new gesture after the silence", () => {
    const g = createWheelGesture();
    const steps: number[] = [];
    let t = 0;
    for (let i = 0; i < 30; i++) steps.push(g.push(12, (t += 16)));
    expect(steps.filter((s) => s !== 0)).toEqual([1]);
    t += WHEEL_GESTURE_END + 20;
    expect(g.push(-50, t)).toBe(-1);
  });
});

describe("video lifecycle", () => {
  const base = { near: true, settled: true, awayFor: 0, reducedMotion: false, saveData: false };

  it("only the active piece plays, and only once the snap is complete", () => {
    expect(reelVideoPlan({ ...base, distance: 0 })).toEqual({ mount: true, preload: "auto", play: true });
    expect(reelVideoPlan({ ...base, distance: 0, settled: false }).play).toBe(false);
    expect(reelVideoPlan({ ...base, distance: 1 })).toEqual({ mount: true, preload: "metadata", play: false });
  });

  it("a piece ≥ 2 away keeps its paused video for 10 s, then unmounts it", () => {
    expect(reelVideoPlan({ ...base, distance: 2, awayFor: 9_000 }).mount).toBe(true);
    expect(reelVideoPlan({ ...base, distance: 2, awayFor: 10_001 }).mount).toBe(false);
    expect(reelVideoPlan({ ...base, distance: 3, awayFor: Infinity }).mount).toBe(false);
  });

  it("posters only: reel far away, reduced motion, Save-Data", () => {
    expect(reelVideoPlan({ ...base, distance: 0, near: false }).mount).toBe(false);
    expect(reelVideoPlan({ ...base, distance: 0, reducedMotion: true }).mount).toBe(false);
    expect(reelVideoPlan({ ...base, distance: 0, saveData: true }).mount).toBe(false);
  });
});
