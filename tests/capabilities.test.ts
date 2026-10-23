/**
 * Capabilities as a live editorial index (docs/26 §C, which replaced the Phase 9 rail): the active row
 * on the reading line, the scene of each capability, the words a scene borrows from its statement, the
 * EvidenceSlot guard, and the profile copy (Content Master 13, rewritten in 21).
 */
import { describe, expect, it } from "vitest";
import { CAPABILITIES } from "@/data/capabilities";
import { PROFILE } from "@/data/profile";
import { SITE } from "@/data/site";
import type { EvidenceSlotVariant } from "@/data/types";
import { READING_LINE, SCENE_FOR, pickActive, resolveEvidence, wordsFromStatement } from "@/lib/capabilities-index";
import { splitByWords } from "@/components/capabilities/CapabilitiesIndex";

describe("the live index (docs/26 §C)", () => {
  const rows = [0, 1, 2, 3, 4, 5].map((i) => ({ top: 200 + i * 300, bottom: 200 + i * 300 + 260 }));
  it("the active row is the one on the reading line; before the first, the first; after the last, the last", () => {
    expect(pickActive(rows, 100)).toBe(0);
    expect(pickActive(rows, 250)).toBe(0);
    expect(pickActive(rows, 820)).toBe(2);
    expect(pickActive(rows, 5000)).toBe(5);
    // in the gap between two rows: the one that ended last
    expect(pickActive(rows, 480)).toBe(0);
    expect(pickActive(rows, 470)).toBe(0);
  });
  it("reversible: walking the line back activates the rows back in order", () => {
    const down = [250, 550, 850, 1150, 1450, 1750].map((y) => pickActive(rows, y));
    const up = [1750, 1450, 1150, 850, 550, 250].map((y) => pickActive(rows, y));
    expect(down).toEqual([0, 1, 2, 3, 4, 5]);
    expect(up).toEqual([5, 4, 3, 2, 1, 0]);
  });
  it("the reading line sits a little above the middle of the screen", () => {
    expect(READING_LINE).toBeGreaterThan(0.35);
    expect(READING_LINE).toBeLessThan(0.55);
  });
  it("six scenes, one per capability, each a different demonstration", () => {
    const scenes = CAPABILITIES.map((c) => SCENE_FOR[c.evidence.variant === "element" ? c.evidence.element : "typographic"]);
    expect(scenes).toEqual(["product", "engineering", "commerce", "ai", "interactive", "growth"]);
  });
  it("a scene's words come from its own statement (never a new claim)", () => {
    expect(wordsFromStatement(CAPABILITIES[1].statement, ["Front", "Back", "Datos"])).toHaveLength(3);
    expect(wordsFromStatement(CAPABILITIES[5].statement, ["Negocios", "Personas", "Próximos clientes"])).toHaveLength(3);
    expect(() => wordsFromStatement(CAPABILITIES[5].statement, ["Ventas"])).toThrow();
  });
  it("the extraction sentence is cut around the three key words, in order, text intact", () => {
    const text = "Necesito viajar a Punta Cana en julio, somos cuatro.";
    const parts = splitByWords(text, ["Punta Cana", "julio", "cuatro"]);
    expect(parts.map((p) => p.text).join("")).toBe(text);
    expect(parts.filter((p) => p.word).map((p) => p.index)).toEqual([0, 1, 2]);
  });
  it("06 stays typographic: Meta Ads, no numbers, no material", () => {
    expect(CAPABILITIES[5].evidence).toEqual({ variant: "typographic", tag: "Meta Ads" });
    expect(CAPABILITIES[5].statement).not.toMatch(/\d/);
    expect(CAPABILITIES[5].attribution).toEqual({ label: "Meta Ads" });
    // the old opening line is gone: «Una sola visión» says how the work is done (Content Master 25)
    expect(JSON.stringify(SITE)).not.toContain("Todo lo anterior pasó por las mismas manos.");
  });
});

describe("EvidenceSlot guard (Spec §12)", () => {
  it("typographic passes through; unproven material falls back to typographic in production only", () => {
    const typo = { variant: "typographic", tag: "Meta Ads" } as const;
    expect(resolveEvidence(typo, false, true)).toBe(typo);
    const material: EvidenceSlotVariant = { variant: "verified-material", media: ["x" as never], source: "s" };
    expect(resolveEvidence(material, false, true).variant).toBe("typographic");
    expect(resolveEvidence(material, false, false).variant).toBe("verified-material");
    expect(resolveEvidence(material, true, true).variant).toBe("verified-material");
  });
  it("a campaign keeps only authorized, sourced metrics", () => {
    const campaign: EvidenceSlotVariant = {
      variant: "campaign",
      media: ["x" as never],
      source: "s",
      metrics: [
        { label: "a", value: "1", authorized: true, source: "s" },
        { label: "b", value: "2", authorized: false, source: "s" },
        { label: "c", value: "3", authorized: true, source: "" },
      ],
    };
    const r = resolveEvidence(campaign, true, true);
    expect(r.variant === "campaign" && r.metrics.map((m) => m.label)).toEqual(["a"]);
  });
});

describe("profile (Content Master 13, rewritten in Content Master 21 · 2026-10-21; Meta Ads in 25)", () => {
  const ALL = [
    PROFILE.core,
    ...PROFILE.body,
    ...PROFILE.facets.phrases,
    ...PROFILE.facets.projects.map((p) => p.kind),
    ...PROFILE.ads.title,
    ...PROFILE.ads.steps.flatMap((s) => [s.word, s.line]),
    PROFILE.ads.paragraph,
  ];

  it("the declaration, the explanation and Meta Ads are verbatim; the label is the nav word", () => {
    expect(PROFILE.label).toBe(SITE.nav.profile);
    expect(PROFILE.core).toBe(
      "Diseño y desarrollo productos digitales donde la estrategia, la experiencia de usuario y la ingeniería trabajan con un mismo propósito: crear valor real para cada negocio.",
    );
    expect(PROFILE.body).toEqual([
      "Mi trabajo va más allá de construir una interfaz. Me involucro en cómo se presenta una marca, cómo interactúan sus clientes, cómo funcionan sus procesos y cómo convertir una idea en un producto digital sólido, escalable y preparado para crecer.",
      "Desde Uruguay, trabajo en proyectos de comercio electrónico, plataformas y sistemas de gestión, combinando criterio de producto, diseño y desarrollo con una visión comercial.",
    ]);
    // Meta Ads, its own chapter (Content Master 25, 2026-10-23)
    expect(PROFILE.ads.title).toEqual(["Construirlo es una parte.", "Hacer que lo descubran es la otra."]);
    expect(PROFILE.ads.steps.map((s) => s.word)).toEqual(["Producto", "Descubrimiento", "Acción"]);
    expect(PROFILE.ads.paragraph).toBe(
      "Además de diseñar y desarrollar productos digitales, creo campañas en Meta Ads para conectar marcas con personas interesadas en sus productos y servicios.",
    );
    expect(PROFILE.ads.emphasis).toBe("Meta Ads");
    expect(PROFILE.ads.paragraph.includes(PROFILE.ads.emphasis)).toBe(true);
  });

  it("the visuals add no claim: the four phrases are the first paragraph's own, in order; the steps' lines keep the approved precisions", () => {
    const p1 = PROFILE.body[0];
    let at = -1;
    for (const phrase of PROFILE.facets.phrases) {
      const next = p1.indexOf(phrase, at + 1);
      expect(next, phrase).toBeGreaterThan(at);
      at = next;
    }
    // Content Master 21's precisions, carried by the steps: Instagram and Facebook; consult, book, buy
    expect(PROFILE.ads.steps.map((s) => s.line)).toEqual(["Una buena experiencia digital.", "Campañas en Instagram y Facebook.", "Consultar, reservar o comprar."]);
    // the kinds are the second paragraph's own words
    expect(PROFILE.body[1]).toContain("comercio electrónico");
    expect(PROFILE.body[1]).toContain("plataformas y sistemas de gestión");
  });

  it("the declaration opens the profile and stays a sentence, not a paragraph (hierarchy needs a short lead)", () => {
    expect(PROFILE.core.split(/\s+/).length).toBeLessThanOrEqual(30);
    expect(PROFILE.core.endsWith("para cada negocio.")).toBe(true);
  });

  it("the profile no longer carries the old TravelSuite360 and «de punta a punta» claims", () => {
    for (const s of ALL) expect(s, s).not.toMatch(/TravelSuite|tres agencias|agencias de viaje|punta a punta|socio de|equipos en cualquier lugar/i);
  });

  it("authority comes from precision: no prestige adjectives, no founder, no results, no certifications", () => {
    for (const s of ALL) {
      expect(s, s).not.toMatch(/fundador|founder|freelance|disponible|años de experiencia|remoto\b/i);
      expect(s, s).not.toMatch(/exitos|l[ií]der|el mejor|\bmejor(es)? del\b|n[úu]mero (uno|1)|premiad|certificad|garantiz|asegur/i);
    }
  });

  it("Meta Ads claims no results, no ad spend, no clients and no figures", () => {
    for (const s of [...PROFILE.ads.title, ...PROFILE.ads.steps.flatMap((x) => [x.word, x.line]), PROFILE.ads.paragraph]) {
      expect(s, s).not.toMatch(/\d|%|ROAS|retorno|inversi[oó]n|presupuesto|ventas|resultados|clientes de|certific/i);
    }
  });
});
