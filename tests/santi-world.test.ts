/**
 * Phase 7 units: Santi Nuca world (Spec §10) — the provisional photographs and their check,
 * the attribution guards, the compositions, the one geometric rule (uniform scale + clip,
 * never a non-uniform scale) and the copy.
 */
import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getProject } from "@/data/projects";
import { SANTI_ANCHOR, SANTI_PHOTOS } from "@/data/santi-photos.ts";
import { getContract, resolveAsset } from "@/lib/assets";
import {
  N04_STAGGER,
  N05_STAGGER,
  N_T,
  SANTI_UNITS,
  SANTI_UNITS_RM,
  diptych,
  field,
  fit,
  insetOf,
  isUniform,
  santiVariant,
  single,
  splitViews,
  system,
  triptych,
  type Box,
} from "@/lib/santi-world";
import { pinLengthVh } from "@/lib/tiers";

const santi = getProject("santi-nuca")!;
const inside = (b: Box, f: Box) => b.x >= f.x - 1e-6 && b.y >= f.y - 1e-6 && b.x + b.w <= f.x + f.w + 1e-6 && b.y + b.h <= f.y + f.h + 1e-6;

describe("the provisional photographs (scripts/derive-santi-photos.mjs)", () => {
  it("the committed geometry is the script's output for the real captures", () => {
    const out = execFileSync(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "scripts/derive-santi-photos.mjs", "--check"], { encoding: "utf8" });
    expect(out).toContain("up to date");
  });
  it("six photographs, each cut from a real page, with files inside the budget", () => {
    expect(SANTI_PHOTOS.map((p) => p.n)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(SANTI_PHOTOS.map((p) => p.page)).toEqual(["Apertura", "Trabajo 01", "Trabajo 02", "Trabajo 03", "Trabajo 04", "Trabajo 05"]);
    for (const p of SANTI_PHOTOS) {
      for (const f of [p.files.avif["1x"], p.files.avif["2x"], p.files.webp["1x"], p.files.webp["2x"]]) expect(statSync(join("public", f)).size).toBeLessThanOrEqual(250 * 1024);
      expect(p.aspect[0]).toBeGreaterThan(400);
      expect(p.aspect[1]).toBeGreaterThan(400);
    }
  });
  it("the opening photograph sits inside both reel frames of the poster", () => {
    for (const a of [SANTI_ANCHOR.desktop, SANTI_ANCHOR.mobile]) {
      expect(a.x).toBeGreaterThanOrEqual(0);
      expect(a.y).toBeGreaterThanOrEqual(0);
      expect(a.x + a.w).toBeLessThanOrEqual(1);
      expect(a.y + a.h).toBeLessThanOrEqual(1);
    }
    expect(getContract("santi.reel.poster").meta?.anchorRect).toEqual(SANTI_ANCHOR);
  });
});

describe("attribution (Content Master 08, Spec §10)", () => {
  it("every photograph is Santi Nuca's: alt texts end with the credit; nothing names Franco", () => {
    for (const p of SANTI_PHOTOS) {
      const a = resolveAsset(p.key);
      expect(a.status).toBe("derived");
      expect(a.alt.endsWith("— fotografía de Santi Nuca")).toBe(true);
      expect(a.alt).not.toMatch(/franco/i);
      expect(getContract(p.key).meta?.source).toMatch(/Santi Nuca/);
      expect(a.meta.source).toBeUndefined();
    }
    expect(santi.credit).toEqual({ label: "Fotografía", holder: "Santi Nuca" });
    expect(santi.role).toBe("Diseño y desarrollo");
    expect(santi.microCase).toContain("Las fotografías son suyas");
    expect(santi.screen.object).toBe("santi.photo.1");
  });
  it("the world shows only the three view names and the page numbers", () => {
    expect(Object.keys(santi.worldCopy)).toEqual(["N04.views", "N04.pages"]);
    expect(splitViews(santi.worldCopy["N04.views"])).toEqual(["Forma", "Línea", "Textura"]);
    expect(splitViews(santi.worldCopy["N04.pages"])).toEqual(["01", "02", "03"]);
  });
});

describe("compositions", () => {
  for (const v of ["desktop", "sm"] as const) {
    it(`${v}: diptych, triptych and system fill the editorial field without overlap`, () => {
      const f = field(v);
      for (const comp of [diptych(v), triptych(v), system(v)]) {
        for (const b of comp.figures) {
          expect(inside(b, f)).toBe(true);
          expect(b.w).toBeGreaterThan(0);
          expect(b.h).toBeGreaterThan(0);
        }
        for (let i = 0; i < comp.figures.length; i++)
          for (let j = i + 1; j < comp.figures.length; j++) {
            const a = comp.figures[i];
            const b = comp.figures[j];
            const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
            expect(overlap, `${i}/${j}`).toBe(false);
          }
      }
      expect(diptych(v).figures).toHaveLength(2);
      expect(triptych(v).figures).toHaveLength(3);
      expect(triptych(v).labels).toHaveLength(3);
      expect(system(v).figures).toHaveLength(6);
    });
  }
  it("desktop: two halves side by side, three columns, a 3×2 grid; phones stack", () => {
    expect(diptych("desktop").figures[0].y).toBe(diptych("desktop").figures[1].y);
    expect(diptych("sm").figures[0].x).toBe(diptych("sm").figures[1].x);
    expect(new Set(triptych("desktop").figures.map((b) => b.y)).size).toBe(1);
    expect(new Set(triptych("sm").figures.map((b) => b.x)).size).toBe(1);
    expect(new Set(system("desktop").figures.map((b) => b.y)).size).toBe(2);
    expect(new Set(system("sm").figures.map((b) => b.y)).size).toBe(3);
  });
  it("the single image: 78% of the height, centered; phones full width within 62% of the height", () => {
    const d = single("desktop", 0.675);
    expect(d.h).toBeCloseTo(702);
    expect(d.x + d.w / 2).toBeCloseTo(720);
    const m = single("sm", 0.675);
    expect(m.h).toBeLessThanOrEqual(0.62 * 844 + 1e-9);
    expect(m.w).toBeLessThanOrEqual(390);
    expect(single("sm", 1.6).w).toBeCloseTo(390);
  });
});

describe("fit · a uniform scale and a clip, never a distortion", () => {
  const nat = { w: 688, h: 702 };
  for (const target of [
    { x: 120, y: 99, w: 596, h: 702 },
    { x: 120, y: 99, w: 394.67, h: 646 },
    { x: 525, y: 458, w: 389.33, h: 343 },
    { x: 16, y: 120, w: 358, h: 204 },
  ]) {
    it(`${target.w.toFixed(0)}×${target.h.toFixed(0)}: the visible window is exactly the target`, () => {
      const p = fit(nat, target);
      expect(p.scale).toBeGreaterThan(0);
      for (const c of p.clip) expect(c).toBeGreaterThanOrEqual(-1e-9);
      const visW = nat.w - p.clip[1] - p.clip[3];
      const visH = nat.h - p.clip[0] - p.clip[2];
      expect(visW * p.scale).toBeCloseTo(target.w, 6);
      expect(visH * p.scale).toBeCloseTo(target.h, 6);
      expect(p.x + p.clip[3] * p.scale).toBeCloseTo(target.x, 6);
      expect(p.y + p.clip[0] * p.scale).toBeCloseTo(target.y, 6);
      expect(insetOf(p.clip)).toMatch(/^inset\(/);
    });
  }
  it("the single image of its own aspect needs no clip and no scaling", () => {
    const p = fit(nat, { x: 376, y: 99, w: 688, h: 702 });
    expect(p.scale).toBeCloseTo(1);
    expect(p.clip.every((c) => Math.abs(c) < 1e-9)).toBe(true);
  });
  it("insetOf keeps the sides apart so the computed value never collapses to shorthand", () => {
    expect(insetOf([0, 187, 0, 187])).toBe("inset(0.000px 187.000px 0.000px 187.013px)");
    expect(insetOf([43, 0, 100, 0])).toBe("inset(43.000px 0.000px 100.000px 0.013px)");
    expect(insetOf([1, 2, 3, 4])).toBe("inset(1.000px 2.000px 3.000px 4.000px)");
  });
  it("isUniform accepts a uniform scale and rejects a stretch or a skew", () => {
    expect(isUniform({ a: 0.5, b: 0, c: 0, d: 0.5 })).toBe(true);
    expect(isUniform({ a: 0.5, b: 0, c: 0, d: 0.7 })).toBe(false);
    expect(isUniform({ a: 1, b: 0.1, c: 0, d: 1 })).toBe(false);
  });
});

describe("time", () => {
  it("5.4 units → 432vh at 80vh; tablets 378vh; reduced motion 4 × 50vh; staggers", () => {
    expect(SANTI_UNITS).toBe(5.4);
    expect(pinLengthVh(SANTI_UNITS, "xl", false)).toBe(432);
    expect(pinLengthVh(SANTI_UNITS, "md", false)).toBe(378);
    expect(pinLengthVh(SANTI_UNITS_RM, "xl", true)).toBe(200);
    expect([N_T.N02, N_T.N03, N_T.N04, N_T.N05, N_T.END]).toEqual([2, 3, 4, 5, 5.4]);
    expect(N04_STAGGER).toBe(0.08);
    expect(N05_STAGGER).toBe(0.12);
    expect([santiVariant("xl"), santiVariant("md"), santiVariant("sm")]).toEqual(["desktop", "desktop", "sm"]);
  });
});
