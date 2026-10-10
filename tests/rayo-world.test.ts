/**
 * Phase 6 units: Rayo Smash world (Spec §09) — the derived layer geometry and its check, the
 * contracts, the arrangements (poster → exploded → assembled), the clip rules and the copy.
 */
import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getProject } from "@/data/projects";
import { RAYO_ANCHOR, RAYO_LAYERS, RAYO_STACK } from "@/data/rayo-layers.ts";
import { getContract, resolveAsset } from "@/lib/assets";
import {
  R04_SPREAD,
  R04_Z,
  R_T,
  RAYO_UNITS,
  RAYO_UNITS_RM,
  assembledBoxes,
  canRunClip,
  explodeOffsets,
  posterBoxes,
  rayoVariant,
  splitMenuLine,
  stackHeight,
} from "@/lib/rayo-world";
import { pinLengthVh } from "@/lib/tiers";

const rayo = getProject("rayo-smash")!;
const layers = RAYO_LAYERS.map((l) => ({ name: l.name, offset: l.offset }));
const stack = { w: RAYO_STACK.aspect[0], h: RAYO_STACK.aspect[1] };

describe("the derived layers (scripts/derive-rayo-layers.mjs)", () => {
  it("the committed geometry is the script's output for the real captures", () => {
    const out = execFileSync(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "scripts/derive-rayo-layers.mjs", "--check"], { encoding: "utf8" });
    expect(out).toContain("up to date");
  });
  it("six layers, top → bottom, as the real Clásica stacks (a double smash)", () => {
    expect(RAYO_LAYERS.map((l) => l.name)).toEqual(["topBun", "bacon", "patty", "onion", "patty2", "bottomBun"]);
    let last = -1;
    for (const l of RAYO_LAYERS) {
      for (const k of ["x", "y", "w", "h"] as const) expect(l.offset[k]).toBeGreaterThanOrEqual(0);
      expect(l.offset.x + l.offset.w).toBeLessThanOrEqual(1.0001);
      expect(l.offset.y + l.offset.h).toBeLessThanOrEqual(1.0001);
      expect(l.offset.y).toBeGreaterThan(last);
      last = l.offset.y;
    }
  });
  it("the stack sits inside both reel frames of the poster", () => {
    for (const a of [RAYO_ANCHOR.desktop, RAYO_ANCHOR.mobile]) {
      expect(a.x).toBeGreaterThan(0);
      expect(a.y).toBeGreaterThan(0);
      expect(a.x + a.w).toBeLessThan(1);
      expect(a.y + a.h).toBeLessThanOrEqual(1);
    }
    expect(getContract("rayo.reel.poster").meta?.anchorRect).toEqual(RAYO_ANCHOR);
  });
  it("every cutout file exists, within the §18 budget", () => {
    for (const files of [RAYO_STACK.files, ...RAYO_LAYERS.map((l) => l.files)]) {
      for (const p of [files.avif["1x"], files.avif["2x"], files.webp["1x"], files.webp["2x"]]) expect(statSync(join("public", p)).size).toBeLessThanOrEqual(250 * 1024);
    }
  });
});

describe("contracts (Spec §22)", () => {
  it("the burger and its layers are derived cutouts; the project's object is the burger", () => {
    expect(rayo.screen.object).toBe("rayo.burger");
    const burger = resolveAsset("rayo.burger");
    expect(burger.status).toBe("derived");
    expect(burger.kind).toBe("cutout");
    for (const l of RAYO_LAYERS) {
      const a = resolveAsset(l.key);
      expect(a.status).toBe("derived");
      expect(a.meta.offset).toEqual(l.offset);
    }
  });
  it("the through clip: a test render, AV1 first then H.264, ≤ 2.5 MB, desktop only, with its first frame as poster", () => {
    const c = getContract("rayo.through");
    expect(c.status).toBe("derived");
    expect(c.optional).toBe(true);
    const d = c.files!.desktop as { sources: { src: string; type: string }[]; width: number; height: number; duration: number };
    expect(d.sources.map((s) => s.type.split(";")[0])).toEqual(["video/mp4", "video/mp4"]);
    expect(d.sources[0].type).toContain("av01");
    expect(d.sources[1].type).toContain("avc1");
    for (const s of d.sources) expect(statSync(join("public", s.src)).size).toBeLessThanOrEqual(2.5 * 1024 * 1024);
    expect(c.files!.mobile).toBeUndefined();
    expect([d.width, d.height]).toEqual([1920, 1200]);
    expect(c.poster).toBe("rayo.through.poster");
    // resolved: the mobile files fall back to desktop by reference (RayoWorld reads that as "no 9:16 clip")
    const r = resolveAsset("rayo.through");
    expect(r.status).toBe("derived");
    if (r.status === "derived") expect(r.files.mobile).toBe(r.files.desktop);
  });
});

describe("arrangements", () => {
  it("poster boxes keep the stack's aspect; the assembled burger is far shorter than the exploded stack", () => {
    const poster = posterBoxes(layers, stack);
    expect(stackHeight(poster)).toBeCloseTo(stack.h / stack.w, 3);
    const asm = assembledBoxes(layers, stack);
    expect(stackHeight(asm)).toBeLessThan(stackHeight(poster) * 0.5);
    // bottom-up: every layer overlaps the one below it (seated), none floats
    for (let i = asm.length - 2; i >= 0; i--) {
      expect(asm[i].y + asm[i].h).toBeGreaterThan(asm[i + 1].y);
      expect(asm[i].y).toBeLessThan(asm[i + 1].y);
    }
    // the same horizontal places as the poster
    asm.forEach((b, i) => expect(b.x).toBeCloseTo(poster[i].x, 6));
  });
  it("R04: −32% → +30% of the assembled height, linear; depth 0 → −320 on lg/xl only", () => {
    const h = 100;
    const deep = explodeOffsets(6, h, "deep");
    expect(deep[0].dy).toBeCloseTo(R04_SPREAD.top * h);
    expect(deep[5].dy).toBeCloseTo(R04_SPREAD.bottom * h);
    expect(deep[3].dy - deep[2].dy).toBeCloseTo(deep[2].dy - deep[1].dy);
    expect(deep.map((d) => d.z)).toEqual(R04_Z);
    expect(explodeOffsets(6, h, "flat").every((d) => d.z === 0)).toBe(true);
    expect(explodeOffsets(6, h, "sm").every((d) => d.z === 0)).toBe(true);
  });
  it("variants: 3D on lg/xl; md and reduced motion flat; phones their own", () => {
    expect(rayoVariant("xl", false)).toBe("deep");
    expect(rayoVariant("lg", false)).toBe("deep");
    expect(rayoVariant("md", false)).toBe("flat");
    expect(rayoVariant("xl", true)).toBe("flat");
    expect(rayoVariant("sm", false)).toBe("sm");
  });
});

describe("time and the clip", () => {
  it("5.7 units → 456vh at 80vh; tablets capped at 450vh; reduced motion 3.5 × 50vh", () => {
    expect(RAYO_UNITS).toBe(5.7);
    expect(pinLengthVh(RAYO_UNITS, "xl", false)).toBe(456);
    expect(pinLengthVh(RAYO_UNITS, "md", false)).toBe(399);
    expect(pinLengthVh(RAYO_UNITS_RM, "xl", true)).toBe(175);
    expect([R_T.R02, R_T.R03, R_T.R04, R_T.R05, R_T.R06, R_T.R07]).toEqual([2, 2.6, 3.6, 3.9, 4.9, 5.5]);
  });
  it("R05 runs only with a ready clip for the tier, no reduced motion, no Save-Data", () => {
    expect(canRunClip({ hasClip: true, ready: true, rm: false, saveData: false })).toBe(true);
    expect(canRunClip({ hasClip: false, ready: true, rm: false, saveData: false })).toBe(false);
    expect(canRunClip({ hasClip: true, ready: false, rm: false, saveData: false })).toBe(false);
    expect(canRunClip({ hasClip: true, ready: true, rm: true, saveData: false })).toBe(false);
    expect(canRunClip({ hasClip: true, ready: true, rm: false, saveData: true })).toBe(false);
  });
});

describe("copy (Content Master 07, split only)", () => {
  it("the world shows only «Capa por capa.» and the real menu line", () => {
    expect(Object.keys(rayo.worldCopy)).toEqual(["R03.title", "R07.menu"]);
    expect(rayo.worldCopy["R03.title"]).toBe("Capa por capa.");
    expect(splitMenuLine(rayo.worldCopy["R07.menu"])).toEqual({
      name: "Clásica",
      detail: "doble medallón smash, cheddar fundido, salsa de la casa, pan brioche",
      price: "$ 490",
    });
    expect(rayo.relationLine).toBe("Rayo Smash no es un cliente: es la demo que Prospector construye para vender.");
  });
});
