import { describe, expect, it } from "vitest";
import {
  GRID_COLUMNS,
  LAYER_Z,
  SCATTER,
  SHIFT_AT,
  SHIFT_ELEMENTS,
  SHIFT_STATES,
  SHIFT_UNITS,
  SHIFT_VARIANTS,
  TEXT_ZONE,
  UI_BOX,
  UI_LAYOUT,
  explodeOffset,
  scatterBounds,
  shiftVariant,
  shown,
  span,
  uiHeight,
  within,
} from "@/lib/shift";
import { GESTURE_VH, pinLengthVh } from "@/lib/tiers";
import { decVariant } from "@/lib/declaration";
import { SITE } from "@/data/site";

describe("THE SHIFT · timing (docs/25)", () => {
  it("four acts, in order, each a resting label; the last holds before the pin lets go", () => {
    expect(SHIFT_STATES).toEqual(["DESORDEN", "DIRECCION", "EJECUCION", "RESULTADO"]);
    const at = SHIFT_STATES.map((s) => SHIFT_AT[s]);
    expect(at[0]).toBe(0);
    for (let i = 1; i < at.length; i++) expect(at[i]).toBeGreaterThan(at[i - 1]);
    expect(SHIFT_UNITS).toBeGreaterThan(SHIFT_AT.RESULTADO);
  });

  it("within/span measure inside the gesture that leads to a state", () => {
    expect(within("DIRECCION", 0)).toBe(0);
    expect(within("DIRECCION", 1)).toBe(SHIFT_AT.DIRECCION);
    expect(within("EJECUCION", 0.5)).toBeCloseTo((SHIFT_AT.DIRECCION + SHIFT_AT.EJECUCION) / 2);
    expect(span("RESULTADO", 0, 1)).toBeCloseTo(SHIFT_AT.RESULTADO - SHIFT_AT.EJECUCION);
  });

  it("compact: the section is two to three viewports tall on a desktop, pin included", () => {
    const sectionVh = 100 + pinLengthVh(SHIFT_UNITS, "xl", false);
    expect(sectionVh / 100).toBeGreaterThanOrEqual(2);
    expect(sectionVh / 100).toBeLessThanOrEqual(3.2);
    // no gesture without a change: each act is at most one gesture from the last
    for (let i = 1; i < SHIFT_STATES.length; i++) expect(SHIFT_AT[SHIFT_STATES[i]] - SHIFT_AT[SHIFT_STATES[i - 1]]).toBeLessThanOrEqual(1);
    expect(GESTURE_VH.xl * (SHIFT_UNITS - SHIFT_AT.RESULTADO)).toBeLessThanOrEqual(40);
  });
});

describe("THE SHIFT · composition", () => {
  it("the variants follow the declaration's (one rule for the whole page)", () => {
    for (const [w, h] of [
      [1440, 900],
      [1366, 768],
      [820, 1180],
      [1024, 1366],
      [430, 932],
      [390, 844],
      [320, 568],
      [2560, 1080],
    ])
      expect(shiftVariant(w, h)).toBe(decVariant(w, h));
  });

  it("the interface fits its space, below the act lines on portrait screens", () => {
    for (const v of SHIFT_VARIANTS) {
      const b = UI_BOX[v];
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(1);
      expect(b.y + uiHeight(v)).toBeLessThanOrEqual(0.9);
      const t = TEXT_ZONE[v];
      if (v !== "wide") expect(t.y + t.h).toBeLessThanOrEqual(b.y);
      else expect(t.x + t.w).toBeLessThanOrEqual(b.x);
    }
  });

  it("every fragment a variant draws has a place in the interface and a first pose", () => {
    for (const v of SHIFT_VARIANTS) {
      for (const k of shown(v)) {
        expect(SCATTER[v][k], `${v} ${k}`).toBeDefined();
        const r = UI_LAYOUT[v][k]!;
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(1.0001);
        expect(r.y + r.h).toBeLessThanOrEqual(1.0001);
      }
      for (const k of Object.keys(SCATTER[v])) expect(shown(v)).toContain(k);
    }
    // phones keep the idea with fewer pieces: no text navigation, no third module
    expect(shown("phone")).not.toContain("nav1");
    expect(shown("phone")).not.toContain("card3");
    expect(shown("phone")).toContain("menu");
    expect(shown("wide")).not.toContain("menu");
  });

  it("the disorder stays inside the space and never covers the act lines", () => {
    for (const v of SHIFT_VARIANTS) {
      const t = TEXT_ZONE[v];
      for (const k of shown(v)) {
        const b = scatterBounds(v, k)!;
        expect(b.x0, `${v} ${k} left`).toBeGreaterThanOrEqual(0);
        expect(b.y0, `${v} ${k} top`).toBeGreaterThanOrEqual(0.04);
        expect(b.x1, `${v} ${k} right`).toBeLessThanOrEqual(1);
        expect(b.y1, `${v} ${k} bottom`).toBeLessThanOrEqual(1);
        const overlaps = b.x0 < t.x + t.w && b.x1 > t.x && b.y0 < t.y + t.h && b.y1 > t.y;
        expect(overlaps, `${v} ${k} over the text`).toBe(false);
      }
    }
  });

  it("a designed disorder: every fragment turns, within ±30°, and none sits on its final place", () => {
    for (const v of SHIFT_VARIANTS) {
      const poses = Object.values(SCATTER[v]);
      expect(Math.max(...poses.map((p) => Math.abs(p.r)))).toBeLessThanOrEqual(30);
      expect(poses.filter((p) => p.r === 0).length).toBeLessThanOrEqual(1);
      for (const p of poses) {
        expect(p.o).toBeGreaterThan(0.5);
        expect(p.s).toBeGreaterThan(0.3);
      }
    }
  });

  it("depth layers: the container is the floor, the controls nearest the eye", () => {
    for (const k of SHIFT_ELEMENTS) expect(LAYER_Z[k]).toBeGreaterThanOrEqual(0);
    expect(LAYER_Z.frame).toBe(0);
    expect(LAYER_Z.toggle).toBe(Math.max(...Object.values(LAYER_Z)));
  });

  it("the flat exploded view moves fragments away from the center line, never across it", () => {
    expect(explodeOffset(100, 300)).toBeLessThan(0);
    expect(explodeOffset(500, 300)).toBeGreaterThan(0);
    expect(explodeOffset(300, 300)).toBe(0);
  });

  it("the grid annotation states the columns each variant draws", () => {
    expect(GRID_COLUMNS).toEqual({ wide: 12, tablet: 8, phone: 4 });
    for (const v of SHIFT_VARIANTS) expect(SITE.shift.notes.grid(GRID_COLUMNS[v])).toContain(String(GRID_COLUMNS[v]));
  });
});

describe("THE SHIFT · copy (Content Master §23)", () => {
  it("the four acts in the brief's words", () => {
    expect(SITE.shift.acts.map((a) => a.line)).toEqual(["Una idea no alcanza.", "Necesita dirección.", "Y ejecución.", "De la idea al producto."]);
  });

  it("the interface says what it is: conceptual, no project, no metric", () => {
    expect(SITE.shift.concept).toMatch(/conceptual/i);
    const ui = JSON.stringify(SITE.shift.ui);
    expect(ui).not.toMatch(/\d+\s*%|\+\d|clientes|ventas|usuarios/i);
    for (const name of ["TravelSuite", "Rayo", "Santi", "Chef", "Prospector"]) expect(ui).not.toContain(name);
  });
});

describe("THE SHIFT · legibility of the raw type", () => {
  it("fragments that carry type never recede below .9 (AA on black with the raw paper at .62)", () => {
    const typed = ["word", "nav1", "nav2", "nav3", "cta", "eyebrow", "h1a", "h1b", "body", "button", "chip", "toggle", "card1", "card2", "card3"];
    for (const v of SHIFT_VARIANTS) for (const k of typed) if (SCATTER[v][k as keyof (typeof SCATTER)[typeof v]]) expect(SCATTER[v][k as keyof (typeof SCATTER)[typeof v]]!.o, `${v} ${k}`).toBeGreaterThanOrEqual(0.9);
  });
});
