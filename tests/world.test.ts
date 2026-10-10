/**
 * Phase 4 units: the Card → World grammar (Spec §07) — the design space, where each world's
 * escaping object lands, and the FLIP between the two rects.
 */
import { describe, expect, it } from "vitest";
import { PROJECTS } from "@/data/projects";
import { resolveAsset } from "@/lib/assets";
import { WORLD_UNITS, WORLD_UNITS_RM, escapeRect, flip, spaceRect } from "@/lib/world";

const XL = { width: 1440, height: 900 };
const LG = { width: 1366, height: 768 };
const SM = { width: 390, height: 844 };

describe("design space", () => {
  it("1440×900 is the space itself; 1366×768 scales by height and centers", () => {
    expect(spaceRect(XL, "xl")).toEqual({ x: 0, y: 0, w: 1440, h: 900, s: 1 });
    const r = spaceRect(LG, "lg");
    expect(r.s).toBeCloseTo(768 / 900);
    expect(r.h).toBeCloseTo(768);
    expect(r.x).toBeCloseTo((1366 - 1440 * r.s) / 2);
  });
  it("sm uses the 390×844 space", () => {
    expect(spaceRect(SM, "sm")).toEqual({ x: 0, y: 0, w: 390, h: 844, s: 1 });
  });
});

describe("escapeRect · where the object lands (the world's first state)", () => {
  it("TravelSuite360: the message at its TS01 place (x 160, centered; sm x 24, y 300), scaled with the space", () => {
    const text = { w: 900, h: 140 };
    expect(escapeRect("ts-depth", "xl", XL, text)).toEqual({ x: 160, y: 380, w: 900, h: 140 });
    expect(escapeRect("ts-depth", "sm", SM, { w: 342, h: 180 })).toEqual({ x: 24, y: 300, w: 342, h: 180 });
    const lg = escapeRect("ts-depth", "lg", LG, text);
    const s = 768 / 900;
    expect(lg.w).toBeCloseTo(900 * s);
    expect(lg.x).toBeCloseTo((1366 - 1440 * s) / 2 + 160 * s);
    expect(lg.y + lg.h / 2).toBeCloseTo(384);
  });
  it("Rayo: centered at 62% of the space height (sm: 70% of its width), aspect kept", () => {
    const r = escapeRect("rayo-layers", "xl", XL, { w: 250, h: 600 });
    expect(r.h).toBeCloseTo(558);
    expect(r.w / r.h).toBeCloseTo(250 / 600);
    expect(r.x + r.w / 2).toBeCloseTo(720);
    expect(r.y + r.h / 2).toBeCloseTo(450);
    const m = escapeRect("rayo-layers", "sm", SM, { w: 170, h: 400 });
    expect(m.w).toBeCloseTo(273);
    expect(m.w / m.h).toBeCloseTo(170 / 400);
  });
  it("Santi: 78% of the space height; sm full width unless that passes 62% of the height", () => {
    const r = escapeRect("santi-editorial", "xl", XL, { w: 450, h: 600 });
    expect(r.h).toBeCloseTo(702);
    expect(r.w / r.h).toBeCloseTo(0.75);
    const wide = escapeRect("santi-editorial", "sm", SM, { w: 300, h: 300 });
    expect(wide.w).toBeCloseTo(390);
    const tall = escapeRect("santi-editorial", "sm", SM, { w: 300, h: 600 });
    expect(tall.h).toBeCloseTo(0.62 * 844);
  });
  it("Chef: full-bleed cover — the image becomes the environment", () => {
    for (const vp of [XL, LG, SM]) {
      const r = escapeRect("chef-commerce", vp === SM ? "sm" : "xl", vp, { w: 160, h: 200 });
      expect(r.w).toBeGreaterThanOrEqual(vp.width - 1e-6);
      expect(r.h).toBeGreaterThanOrEqual(vp.height - 1e-6);
      expect(Math.min(r.w - vp.width, r.h - vp.height)).toBeCloseTo(0);
      expect(r.x + r.w / 2).toBeCloseTo(vp.width / 2);
    }
  });
});

describe("FLIP", () => {
  it("translate + uniform scale with transform-origin 0 0 maps one rect onto the other", () => {
    const from = { x: 0, y: 0, w: 200, h: 100 };
    const to = { x: 300, y: 120, w: 500, h: 250 };
    const t = flip(from, to);
    expect(t).toEqual({ x: 300, y: 120, scale: 2.5 });
    // the far corner lands too
    expect(from.x + t.x + from.w * t.scale).toBe(to.x + to.w);
    expect(from.y + t.y + from.h * t.scale).toBe(to.y + to.h);
  });
});

describe("timeline lengths", () => {
  it("SCREEN 0 · ISOLATE 1 · WORLD 2 · hold to 2.5; reduced motion is one gesture", () => {
    expect(WORLD_UNITS).toBe(2.5);
    expect(WORLD_UNITS_RM).toBe(1);
  });
});

describe("anchors · every world knows where its object sits in the poster", () => {
  it("each project's screen poster carries a desktop and a mobile anchor inside the frame", () => {
    for (const p of PROJECTS) {
      const anchor = resolveAsset(p.screen.poster).meta?.anchorRect;
      expect(anchor, p.id).toBeDefined();
      for (const r of [anchor?.desktop, anchor?.mobile]) {
        if (!r) throw new Error(`${p.id}: anchor missing`);
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(1 + 1e-9);
        expect(r.y + r.h).toBeLessThanOrEqual(1 + 1e-9);
      }
    }
  });
});
