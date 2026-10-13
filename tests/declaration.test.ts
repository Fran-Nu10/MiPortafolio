/**
 * The commercial declaration (Content Master 20, docs/22): the approved copy, word for word; its
 * independence from TravelSuite360; and the geometry its scene relies on (states, poses, variants).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SITE } from "@/data/site";
import { getProject } from "@/data/projects";
import {
  DEC_AT,
  DEC_STATES,
  DEC_UNITS,
  FIELD_PORTRAIT,
  FIELD_WIDE,
  GRID_COLS,
  LOOSE,
  decVariant,
  fieldPoses,
  foundPose,
  span,
  splitFinal,
  within,
} from "@/lib/declaration";

const D = SITE.declaration;
const [I, II, III] = D.acts;

describe("copy · Content Master 20 (approved 2026-10-13)", () => {
  it("act I · MOSTRAR", () => {
    expect(I.title).toBe("MOSTRAR.");
    expect(I.line).toBe("Tenés algo que vale la pena mostrar.");
    expect(I.words).toEqual(["productos", "servicios", "identidad", "experiencia", "calidad", "ideas", "atención", "detalles", "oportunidades", "valor"]);
  });

  it("act II · CONVENCER", () => {
    expect(II.title).toBe("CONVENCER.");
    expect(II.line).toBe("Hagamos que tus clientes descubran por qué elegirte.");
    expect(II.words).toEqual(["claridad", "identidad", "confianza", "diferenciación", "facilidad", "experiencia"]);
  });

  it("act III · CONVERTIR", () => {
    expect(III.title).toBe("CONVERTIR.");
    expect(III.line).toBe("Que no solo te vean. Que te elijan.");
    expect(III.words).toEqual(["explorar", "consultar", "reservar", "comprar"]);
  });

  it("the conclusion and the section heading", () => {
    expect(D.close).toBe("Diseño y desarrollo productos digitales pensados para mostrar lo mejor de tu negocio y convertir el interés en acción.");
    expect(D.heading).toBe("MOSTRAR. CONVENCER. CONVERTIR.");
  });

  it("the final line is split for its typography without changing a character", () => {
    const f = splitFinal(III.line);
    expect(f).toEqual({ first: "Que no solo te vean.", lead: "Que te", word: "elijan", mark: "." });
    expect(`${f.first} ${f.lead} ${f.word}${f.mark}`).toBe(III.line);
  });

  it("«soluciones» was replaced by «oportunidades» (Content Master 02: never «soluciones»)", () => {
    const all = [D.heading, D.close, ...D.acts.flatMap((a) => [a.title, a.line, ...a.words])];
    for (const s of all) expect(s, s).not.toMatch(/soluci[oó]n/i);
    expect(I.words[8]).toBe("oportunidades");
  });

  it("the approved voice exceptions: second person to the visitor, the conclusion in the first person", () => {
    expect(I.line).toMatch(/^Tenés /);
    expect(II.line).toMatch(/\btus clientes\b/);
    expect(III.line).toMatch(/\bte elijan\.$/);
    expect(D.close).toMatch(/^Diseño y desarrollo /);
  });

  it("promises no result: no numbers, no percentages, no guarantees", () => {
    const all = [D.heading, D.close, ...D.acts.flatMap((a) => [a.title, a.line, ...a.words])];
    for (const s of all) {
      expect(s, s).not.toMatch(/\d|%|garantiz|asegur|vend[eé]s m[aá]s|duplic|tripl|ROI/i);
    }
  });
});

describe("independence from TravelSuite360", () => {
  const ts = getProject("travelsuite360")!;
  const all = [D.heading, D.close, ...D.acts.flatMap((a) => [a.title, a.line, ...a.words])].join(" \n ");

  it("no TravelSuite360 copy, data or vocabulary in the declaration", () => {
    for (const v of Object.values(ts.worldCopy)) expect(all.includes(v), `TS copy «${v}»`).toBe(false);
    for (const re of [/Punta Cana/i, /julio/i, /pasajer/i, /viaje/i, /agencia/i, /TravelSuite/i, /cotizaci/i, /\breservas?\b/i]) expect(all, String(re)).not.toMatch(re);
  });

  it("the scene imports nothing from the TravelSuite360 world", () => {
    const sources = ["src/components/declaration/Declaration.tsx", "src/lib/declaration.ts"].map((p) => readFileSync(join(process.cwd(), p), "utf8"));
    for (const src of sources) {
      expect(src).not.toMatch(/ts-world|ts-reveal|TravelSuite|travelsuite/);
      expect(src).not.toMatch(/from "@\/data\//);
    }
  });
});

describe("states and timing", () => {
  it("eight resting states, ascending, inside the pin; the last one holds before the release", () => {
    expect(DEC_STATES).toEqual(["CAMPO", "DESCUBRE", "MOSTRAR", "ORDEN", "CONVENCER", "ACCION", "CONVERTIR", "ELIJAN"]);
    const at = DEC_STATES.map((s) => DEC_AT[s]);
    expect(at[0]).toBe(0);
    for (let i = 1; i < at.length; i++) {
      const gap = at[i] - at[i - 1];
      // one gesture per change: never a sliver, never two gestures for one change
      expect(gap).toBeGreaterThanOrEqual(0.8);
      expect(gap).toBeLessThanOrEqual(1);
    }
    expect(DEC_UNITS - DEC_AT.ELIJAN).toBeGreaterThanOrEqual(0.4);
  });

  it("within/span map a gesture's fractions onto the timeline", () => {
    expect(within("MOSTRAR", 0)).toBe(DEC_AT.DESCUBRE);
    expect(within("MOSTRAR", 1)).toBe(DEC_AT.MOSTRAR);
    expect(within("CAMPO", 1)).toBe(0);
    expect(span("ORDEN", 0, 1)).toBeCloseTo(DEC_AT.ORDEN - DEC_AT.MOSTRAR);
  });
});

describe("composition", () => {
  it("one drawing per variant: phones, portrait tablets, landscape screens", () => {
    expect(decVariant(390, 844)).toBe("phone");
    expect(decVariant(767, 1024)).toBe("phone");
    expect(decVariant(820, 1180)).toBe("tablet");
    expect(decVariant(1024, 1366)).toBe("tablet");
    expect(decVariant(1024, 768)).toBe("wide");
    expect(decVariant(1440, 900)).toBe("wide");
    expect(GRID_COLS).toEqual({ wide: 3, tablet: 3, phone: 2 });
  });

  it("ten field poses per drawing, inside the space; depth only in the landscape drawing", () => {
    for (const poses of [FIELD_WIDE, FIELD_PORTRAIT]) {
      expect(poses).toHaveLength(I.words.length);
      for (const p of poses) {
        expect(p.x).toBeGreaterThanOrEqual(0.02);
        expect(p.x).toBeLessThanOrEqual(0.9);
        expect(p.y).toBeGreaterThanOrEqual(0.1);
        expect(p.y).toBeLessThanOrEqual(0.9);
        expect(p.o).toBeLessThan(0.5);
      }
    }
    expect(FIELD_PORTRAIT.every((p) => p.z === 0)).toBe(true);
    expect(FIELD_WIDE.every((p) => p.z < 0)).toBe(true);
    expect(fieldPoses("tablet").every((p, i) => p.fs < FIELD_PORTRAIT[i].fs)).toBe(true);
  });

  it("discovery makes every word legible (≥ .6 of paper on black) and draws it toward the center", () => {
    for (const p of [...FIELD_WIDE, ...FIELD_PORTRAIT]) {
      const f = foundPose(p);
      expect(f.o).toBeGreaterThanOrEqual(0.6);
      expect(Math.abs(f.x - 0.47)).toBeLessThan(Math.abs(p.x - 0.47) + 1e-9);
    }
  });

  it("the loose words of act II arrive from inside the space", () => {
    expect(LOOSE).toHaveLength(II.words.length);
    // cells: x of each column and y of each row, per variant (globals.css)
    const cells = {
      wide: { x: [0.044, 0.348, 0.652], y: [0.58, 0.71], cols: 3 },
      phone: { x: [0.041, 0.501], y: [0.52, 0.62, 0.72], cols: 2 },
    };
    for (const c of Object.values(cells)) {
      LOOSE.forEach((l, i) => {
        const x = c.x[i % c.cols] + l.dx;
        const y = c.y[Math.floor(i / c.cols)] + l.dy;
        expect(x, `x ${i}`).toBeGreaterThanOrEqual(0);
        expect(x, `x ${i}`).toBeLessThanOrEqual(0.8);
        expect(y, `y ${i}`).toBeGreaterThanOrEqual(0.1);
        expect(y, `y ${i}`).toBeLessThanOrEqual(0.9);
      });
    }
  });
});
