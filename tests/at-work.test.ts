/**
 * Phase 10 units: Franco at work (Spec §13) — the frame's sizes per tier, the start pose as a
 * uniform scale + clip (never width/height), the pin's phases, when the video plays, the
 * monitor close; the human moment's aperture (Spec §02 S7); the End's timing (S16); the
 * brief's delivery URL override is test-only.
 */
import { describe, expect, it } from "vitest";
import { AT_WORK_PIN_VH, PHASE, apertureAt, atWorkUnits, frameEnd, frameStart, monitorHole, playAt, startPose } from "@/lib/at-work";
import { END_T } from "@/components/contact/EndSequence";
import { RESEND_URL } from "@/lib/brief";
import { pinLengthVh } from "@/lib/tiers";

describe("the frame (Spec §13 table)", () => {
  it("end size ≈ 95% of the viewport (95vw × 95svh; 95vw × 92svh on phones)", () => {
    expect(frameEnd(1440, 900, "xl")).toEqual({ w: 1368, h: 855 });
    expect(frameEnd(390, 844, "sm")).toEqual({ w: 370.5, h: 776.48 });
  });
  it("start size: 16:9 at 56vw (lg/xl) and 72vw (md); 9:16 at 72vw capped at 70svh (sm)", () => {
    const xl = frameStart(1440, 900, "xl");
    expect(xl.w).toBeCloseTo(806.4);
    expect(xl.w / xl.h).toBeCloseTo(16 / 9);
    expect(frameStart(820, 1180, "md").w).toBeCloseTo(590.4);
    const sm = frameStart(390, 844, "sm");
    expect(sm.h).toBeCloseTo(Math.min(0.72 * 390 * (16 / 9), 0.7 * 844));
    expect(sm.w / sm.h).toBeCloseTo(9 / 16);
  });
  it("the start pose is a uniform scale that covers the start window, plus a symmetric clip inset", () => {
    const start = frameStart(1440, 900, "xl");
    const end = frameEnd(1440, 900, "xl");
    const p = startPose(start, end);
    expect(p.scale).toBeGreaterThan(0);
    expect(p.scale).toBeLessThan(1);
    // the visible window after scale + clip is exactly the start size
    expect((end.w - 2 * p.inset[1]) * p.scale).toBeCloseTo(start.w);
    expect((end.h - 2 * p.inset[0]) * p.scale).toBeCloseTo(start.h);
    expect(p.inset[0]).toBeGreaterThanOrEqual(0);
    expect(p.inset[1]).toBeGreaterThanOrEqual(0);
    // at the end: scale 1, no inset
    expect(startPose(end, end)).toEqual({ scale: 1, inset: [0, 0] });
  });
  it("200vh of pin on every tier; 0–60% grow, hold to 85%, then the boundary", () => {
    expect(AT_WORK_PIN_VH).toBe(200);
    expect(pinLengthVh(atWorkUnits("xl"), "xl", false)).toBe(200);
    expect(pinLengthVh(atWorkUnits("md"), "md", false)).toBe(200);
    expect(pinLengthVh(atWorkUnits("sm"), "sm", false)).toBe(200);
    expect(PHASE).toEqual({ grow: 0.6, hold: 0.85 });
  });
  it("the video plays once the growing frame covers half the viewport, inside the growth phase", () => {
    const start = frameStart(1440, 900, "xl");
    const end = frameEnd(1440, 900, "xl");
    const at = playAt(start, end, 1440, 900);
    expect(at).toBeGreaterThan(0);
    expect(at).toBeLessThan(PHASE.grow);
    // a start that already covers half the viewport plays from the first pixel
    expect(playAt({ w: 1200, h: 800 }, end, 1440, 900)).toBe(0);
  });
  it("the monitor close: an even-odd hole from the whole frame to monitorFocus, same point count at both ends", () => {
    const f = { x: 0.34, y: 0.3, w: 0.32, h: 0.34 };
    const a = monitorHole(f, 0);
    const b = monitorHole(f, 1);
    expect(a.startsWith("polygon(evenodd,")).toBe(true);
    expect(a.split(",").length).toBe(b.split(",").length);
    expect(a).toContain("0.000% 0.000%, 0.000% 100.000%, 100.000% 100.000%, 100.000% 0.000%");
    expect(b).toContain("34.000% 30.000%, 34.000% 64.000%, 66.000% 64.000%, 66.000% 30.000%");
  });
});

describe("the human moment's aperture (Spec §02 S7)", () => {
  it("a centered band opens to full over the first half, holds, and closes to black over the last 30%", () => {
    expect(apertureAt(0)).toBe(43);
    expect(apertureAt(0.25)).toBeCloseTo(21.5);
    expect(apertureAt(0.5)).toBe(0);
    expect(apertureAt(0.6)).toBe(0);
    expect(apertureAt(0.7)).toBe(0);
    expect(apertureAt(0.85)).toBeCloseTo(25);
    expect(apertureAt(1)).toBe(50);
  });
});

describe("the End (Spec §02 S16)", () => {
  it("1.2 s hold, 800 ms dim, 400 ms black, 600 ms name", () => {
    expect(END_T).toEqual({ hold: 1.2, dim: 0.8, black: 0.4, name: 0.6 });
  });
});

describe("delivery", () => {
  it("Resend's real endpoint is the default; the override exists only for the e2e stand-in", () => {
    expect(RESEND_URL).toBe("https://api.resend.com/emails");
  });
});
