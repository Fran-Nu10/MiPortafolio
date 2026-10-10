/**
 * Phase 5 units: TravelSuite360 world (Spec §08) — the reveal generator and its rules, the
 * design-space layout, depth ↔ perceived scale, the dolly stops, the copy split, chapters.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generate, GROUP_Z, VARIANTS, WORDS } from "../scripts/gen-ts-reveal.mjs";
import { getProject } from "@/data/projects";
import { TS_GROUP_Z, TS_REVEAL } from "@/data/ts-reveal";
import {
  DOLLY,
  P,
  TS_KEY_WORDS,
  TS_LAYOUT,
  TS_T,
  TS_UNITS,
  TS_UNITS_RM,
  chapterAt,
  depthFor,
  perceived,
  project,
  splitField,
  splitList,
  ts09aTime,
  tsVariant,
} from "@/lib/ts-world";
import { pinLengthVh } from "@/lib/tiers";

const ts = getProject("travelsuite360")!;

describe("the reveal generator (mulberry32, seed 360)", () => {
  it("is deterministic and the committed data/ts-reveal.ts is its output", () => {
    expect(generate()).toEqual(generate());
    const out = execFileSync(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "scripts/gen-ts-reveal.mjs", "--check"], { encoding: "utf8" });
    expect(out).toContain("up to date");
    const fresh = generate();
    expect(TS_REVEAL.desktop).toEqual(fresh.desktop);
    expect(TS_REVEAL.mobile).toEqual(fresh.mobile);
  });

  it("64 fragments in 4 groups on desktop, 32 in 2 groups (z 0 / −600) on mobile", () => {
    expect(TS_REVEAL.desktop).toHaveLength(64);
    expect(TS_REVEAL.mobile).toHaveLength(32);
    for (const g of [0, 1, 2, 3]) expect(TS_REVEAL.desktop.filter((f) => f.group === g)).toHaveLength(16);
    expect(new Set(TS_REVEAL.mobile.map((f) => TS_GROUP_Z[f.group]))).toEqual(new Set([0, -600]));
    expect([...TS_GROUP_Z]).toEqual(GROUP_Z);
    expect(new Set([...TS_REVEAL.desktop, ...TS_REVEAL.mobile].map((f) => f.id)).size).toBe(96);
  });

  it("the words cycle through the six Content Master words", () => {
    expect(WORDS).toEqual(splitList(ts.worldCopy["TS09.fragments"]));
    TS_REVEAL.desktop.forEach((f, i) => expect(f.word).toBe(WORDS[i % 6]));
  });

  for (const name of ["desktop", "mobile"] as const) {
    it(`${name}: in the final frame, outside the clear ellipse; before the retreat, outside 80% of the frame`, () => {
      const v = VARIANTS[name];
      const cx = v.w / 2;
      const cy = v.h / 2;
      for (const f of TS_REVEAL[name]) {
        const z = TS_GROUP_Z[f.group];
        const end = perceived(z + v.camEnd);
        const X = cx + (f.x - cx) * end;
        const Y = cy + (f.y - cy) * end;
        expect(X, f.id).toBeGreaterThanOrEqual(v.margin - 1);
        expect(X, f.id).toBeLessThanOrEqual(v.w - v.margin + 1);
        expect(Y, f.id).toBeGreaterThanOrEqual(v.margin - 1);
        expect(Y, f.id).toBeLessThanOrEqual(v.h - v.margin + 1);
        // the word's center stays out of the clear zone around the followed trip
        const w = Math.ceil(f.word.length * 5.6);
        const ex = (X + w / 2 - cx) / v.clear.rx;
        const ey = (Y + 7 - cy) / v.clear.ry;
        expect(ex * ex + ey * ey, f.id).toBeGreaterThan(0.95);
        // they appear through the camera retreat, not by fading in
        const start = perceived(z);
        const sx = cx + (f.x - cx) * start;
        const sy = cy + (f.y - cy) * start;
        expect(Math.abs(sx - cx) >= 0.8 * cx - 1 || Math.abs(sy - cy) >= 0.8 * cy - 1, f.id).toBe(true);
      }
    });
  }
});

describe("no randomness at runtime", () => {
  it("nothing under src/ calls Math.random()", () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(e)) files.push(p);
      }
    };
    walk("src");
    const hits = files.filter((f) => readFileSync(f, "utf8").includes("Math.random("));
    expect(hits).toEqual([]);
  });
});

describe("depth (P = 1400)", () => {
  it("z = P·(1 − 1/scale): 1.25 → +280, .9 → −156, .72 → −544, .7 → −600", () => {
    expect(P).toBe(1400);
    expect(depthFor(1.25)).toBeCloseTo(280);
    expect(depthFor(0.9)).toBeCloseTo(-155.6, 0);
    expect(depthFor(0.72)).toBeCloseTo(-544.4, 0);
    expect(depthFor(0.7)).toBeCloseTo(-600);
    expect(perceived(depthFor(0.7))).toBeCloseTo(0.7);
  });
  it("the 2D drawing of a translateZ scales toward the perspective origin", () => {
    const p = project({ x: 120, y: 520, z: depthFor(0.72) }, { x: 720, y: 450 });
    expect(p.scale).toBeCloseTo(0.72);
    expect(p.x).toBeCloseTo(720 - 600 * 0.72);
    expect(p.y).toBeCloseTo(450 + 70 * 0.72);
    expect(project({ x: 300, y: 200, z: 0 }, { x: 720, y: 450 })).toEqual({ x: 300, y: 200, scale: 1 });
  });
  it("3D only on lg/xl; md and reduced motion draw it flat; phones have their own column", () => {
    expect(tsVariant("xl", false)).toBe("deep");
    expect(tsVariant("lg", false)).toBe("deep");
    expect(tsVariant("md", false)).toBe("flat");
    expect(tsVariant("xl", true)).toBe("flat");
    expect(tsVariant("sm", false)).toBe("sm");
    expect(tsVariant("sm", true)).toBe("sm");
  });
});

describe("the state layout (Spec §08 table, 1440×900 / 390×844)", () => {
  const d = TS_LAYOUT.deep;
  const sm = TS_LAYOUT.sm;
  it("TS01 raw: x 160, vertically centered; sm x 24, y 300", () => {
    expect(d.raw).toEqual({ x: 160, y: 450, center: true });
    expect(sm.raw).toEqual({ x: 24, y: 300, center: false });
  });
  it("TS03 fields: (560,140) 1.25 · (220,300) .9 op .85 · (1020,360) .7 op .6; camera +200; sentence y 560 op .45", () => {
    expect([d.fields.dest.x, d.fields.dest.y, perceived(d.fields.dest.z), d.fields.dest.opacity]).toEqual([560, 140, 1.25, 1]);
    expect([d.fields.date.x, d.fields.date.y, d.fields.date.opacity]).toEqual([220, 300, 0.85]);
    expect(perceived(d.fields.date.z)).toBeCloseTo(0.9);
    expect([d.fields.pax.x, d.fields.pax.y, d.fields.pax.opacity]).toEqual([1020, 360, 0.6]);
    expect(perceived(d.fields.pax.z)).toBeCloseTo(0.7);
    expect(d.camTs03).toBe(200);
    expect(d.sentenceLow).toEqual({ x: 160, y: 560, opacity: 0.45 });
    expect([sm.fields.dest.y, sm.fields.date.y, sm.fields.pax.y]).toEqual([120, 200, 280]);
    expect([sm.fields.dest.z, sm.fields.date.z, sm.fields.pax.z]).toEqual([0, 0, 0]);
    expect(sm.sentenceLow.y).toBe(520);
  });
  it("TS04–05 quote: Opción 01 (120,160) z 0; Opción 02 (120,520) at .72, op .4 → z −900, op 0", () => {
    expect(d.q1).toMatchObject({ x: 120, y: 160, z: 0, opacity: 1 });
    expect(d.q2).toMatchObject({ x: 120, y: 520, opacity: 0.4 });
    expect(perceived(d.q2.z)).toBeCloseTo(0.72);
    expect(d.q2Out).toMatchObject({ z: -900, opacity: 0 });
    expect([sm.q1.y, sm.q2.y, sm.q2.opacity, sm.q2.z]).toEqual([120, 460, 0.4, 0]);
  });
  it("TS06 trip at (760,150); TS09 the trip at perceived .7, camera → −800 (sm −500); name at y 560 (sm 600)", () => {
    expect(d.trip).toEqual({ x: 760, y: 150 });
    expect(sm.trip).toEqual({ x: 24, y: 140 });
    expect(perceived(d.tripDepth)).toBeCloseTo(0.7);
    expect(d.dollyTo).toBe(-800);
    expect(sm.dollyTo).toBe(-500);
    expect(d.name.y).toBe(560);
    expect(sm.name.y).toBe(600);
    // the followed trip is centered horizontally
    expect(d.tripCenter.x + 600 / 2).toBe(720);
    expect(sm.tripCenter.x + 342 / 2).toBe(195);
  });
  it("groups: 4 with drift on lg/xl, 2 on md, 2 without drift on phones", () => {
    expect(TS_LAYOUT.deep.groups).toEqual([0, 1, 2, 3]);
    expect(TS_LAYOUT.flat.groups).toEqual([0, 2]);
    expect(TS_LAYOUT.sm.groups).toEqual([0, 2]);
    expect(TS_LAYOUT.sm.drift).toBe(false);
  });
});

describe("time", () => {
  it("unit budget 7.5 → 600vh at 80vh; tablets ≤ 450vh; reduced motion 6 units × 50vh", () => {
    expect(TS_UNITS).toBe(7.5);
    expect(pinLengthVh(TS_UNITS, "xl", false)).toBe(600);
    expect(pinLengthVh(TS_UNITS, "md", false)).toBe(450);
    expect(pinLengthVh(TS_UNITS_RM, "xl", true)).toBe(300);
    expect([TS_T.TS01, TS_T.TS03, TS_T.TS04, TS_T.TS05, TS_T.TS06, TS_T.TS09B, TS_T.END]).toEqual([2, 3, 4, 4.6, 5.1, 6.7, 7.5]);
  });
  it("09a rests where the power2.in dolly (GSAP: cubic) has reached −300 of −800", () => {
    const g = (ts09aTime() - TS_T.TS06) / (TS_T.TS09B - TS_T.TS06);
    expect(DOLLY.to * g ** 3).toBeCloseTo(DOLLY.stopA);
  });
});

describe("copy (Content Master 06, split only)", () => {
  it("fields, the key words and the lists come from the world copy", () => {
    expect(splitField(ts.worldCopy["TS03.dest"])).toEqual({ label: "destino", value: "Punta Cana" });
    expect(splitField(ts.worldCopy["TS03.pax"])).toEqual({ label: "pasajeros", value: "4" });
    for (const w of Object.values(TS_KEY_WORDS)) expect(ts.worldCopy["TS01.message"]).toContain(w);
    expect(splitList(ts.worldCopy["TS04.fields"])).toEqual(["destino", "fechas", "pasajeros", "vuelo", "hotel"]);
    expect(splitList(ts.worldCopy["TS06.trip"])).toEqual(["viaje", "Punta Cana", "fechas", "pasajeros", "vuelo", "hotel", "traslados", "estado"]);
  });
  it("proof chapters switch at 3.0 s and 5.5 s", () => {
    const ch = ts.proof.chapters!;
    expect(ch.map((c) => c.label)).toEqual(["TravelChat", "CRM", "IA"]);
    expect([0, 2.9, 3, 5.4, 5.5, 8].map((t) => chapterAt(ch, t))).toEqual([0, 0, 1, 1, 2, 2]);
  });
});
