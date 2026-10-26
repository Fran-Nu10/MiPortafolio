/**
 * The profile copy (Content Master 13, rewritten in 21; its visuals and Meta Ads' chapter in 25):
 * verbatim text, visuals that add no claim, no results. (Moved out of the capabilities tests when
 * the capabilities became Servicios, docs/28 §1.)
 */
import { describe, expect, it } from "vitest";
import { PROFILE } from "@/data/profile";
import { SITE } from "@/data/site";

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
