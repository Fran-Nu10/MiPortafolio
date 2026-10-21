/**
 * Phase 9 units: the capabilities rail (Spec §12) — geometry, scroll ↔ rail mapping, the
 * position that centers a card for keyboard focus, the evidence loops' cadence and final
 * states, the EvidenceSlot guard, and the profile copy (Content Master 13, verbatim).
 */
import { describe, expect, it } from "vitest";
import { CAPABILITIES } from "@/data/capabilities";
import { PROFILE } from "@/data/profile";
import { SITE } from "@/data/site";
import type { EvidenceSlotVariant } from "@/data/types";
import {
  CARD_GAP,
  EVIDENCE_CYCLE,
  EXTENDED_GAP,
  cardScroll,
  cardWidth,
  finalStep,
  nextStep,
  railLayout,
  railPinPx,
  railUnits,
  railX,
  resolveEvidence,
  separationWindow,
} from "@/lib/capabilities-rail";
import { splitByWords } from "@/components/capabilities/EvidenceElement";
import { pinLengthVh } from "@/lib/tiers";

describe("rail geometry (lg/xl)", () => {
  it("cards are min(420px, 30vw), gap 32, the gap before 06 is 3×", () => {
    expect(cardWidth(1440)).toBe(420);
    expect(cardWidth(1024)).toBeCloseTo(307.2);
    expect(EXTENDED_GAP).toBe(3 * CARD_GAP);
    const l = railLayout(1440, 32);
    expect(l.lefts).toHaveLength(6);
    for (let i = 1; i < 5; i++) expect(l.lefts[i] - l.lefts[i - 1]).toBe(420 + CARD_GAP);
    expect(l.lefts[5] - l.lefts[4]).toBe(420 + EXTENDED_GAP);
    expect(l.railW).toBe(32 + 6 * 420 + 4 * 32 + 96);
  });
  it("x runs 0 → −(railWidth − 100vw + gutter), so the last card ends one gutter before the edge", () => {
    const l = railLayout(1440, 32);
    expect(l.overflow).toBe(l.railW - 1440 + 32);
    expect(l.lefts[5] + l.cardW - l.overflow).toBe(1440 - 32);
  });
  it("the pin is 0.6 of a viewport of seam plus the overflow: ≈ 2.2–2.6 gestures (docs/23 §3.2)", () => {
    const l = railLayout(1440, 32);
    const px = railPinPx(900, l.overflow);
    expect(px / 900).toBeGreaterThan(1.9);
    expect(px / 900).toBeLessThan(2.8);
    const units = railUnits(900, l.overflow, "xl");
    expect(pinLengthVh(units, "xl", false)).toBe(Math.round((px / 900) * 100));
  });
  it("the rail waits off-screen through the seam's first half, enters over its second half, then travels 1:1", () => {
    const l = railLayout(1440, 32);
    const x = (s: number) => railX(s, 1440, 900, 32, l.overflow);
    expect(x(0)).toBe(1440 - 32);
    expect(x(270)).toBe(1440 - 32);
    expect(x(405)).toBeCloseTo((1440 - 32) / 2);
    expect(x(540)).toBe(0);
    expect(x(540 + 100)).toBe(-100);
    expect(x(540 + l.overflow + 500)).toBe(-l.overflow);
  });
  it("focus on an off-screen card: the scroll that centers it, clamped to the rail's stretch", () => {
    const l = railLayout(1440, 32);
    const pinStart = 10_000;
    const s = cardScroll(pinStart, 1440, 900, l.overflow, l.lefts[3], l.cardW);
    // at that scroll the card's center is the viewport's center
    expect(l.lefts[3] + l.cardW / 2 + railX(s - pinStart, 1440, 900, 32, l.overflow)).toBeCloseTo(720);
    // the first card cannot be centered (the rail never moves right of 0): the rail's start
    expect(cardScroll(pinStart, 1440, 900, l.overflow, l.lefts[0], l.cardW)).toBe(pinStart + 540);
    // the last card: never past the rail's end
    expect(cardScroll(pinStart, 1440, 900, l.overflow, l.lefts[5], l.cardW)).toBeLessThanOrEqual(pinStart + 540 + l.overflow);
  });
  it("05's layers separate while the card crosses the viewport's right half, inside the rail's stretch", () => {
    const l = railLayout(1440, 32);
    const w = separationWindow(1440, 900, l.overflow, l.lefts[4], l.cardW);
    expect(w.from).toBeGreaterThanOrEqual(540);
    expect(w.to).toBeLessThanOrEqual(540 + l.overflow);
    expect(w.to - w.from).toBeLessThanOrEqual(720);
    expect(w.to).toBeGreaterThan(w.from);
  });
});

describe("evidence loops", () => {
  it("cadence per element (Spec §12 table) and a still at the final state under reduced motion", () => {
    expect(EVIDENCE_CYCLE["ts-flow"]).toEqual({ steps: 3, every: 1600 });
    expect(EVIDENCE_CYCLE.posters).toEqual({ steps: 3, every: 2000 });
    expect(finalStep("ts-flow")).toBe(2);
    expect(finalStep("ts-extraction")).toBe(3);
    expect(finalStep("rayo-layers")).toBe(1);
    expect([0, 1, 2].map((s) => nextStep("ts-flow", s))).toEqual([1, 2, 0]);
  });
  it("the extraction sentence is cut around the three key words, in order, text intact", () => {
    const text = "Necesito viajar a Punta Cana en julio, somos cuatro.";
    const parts = splitByWords(text, ["Punta Cana", "julio", "cuatro"]);
    expect(parts.map((p) => p.text).join("")).toBe(text);
    expect(parts.filter((p) => p.word).map((p) => p.index)).toEqual([0, 1, 2]);
  });
  it("every capability's evidence is a live element from a world, except 06 (typographic, Meta Ads, no numbers)", () => {
    expect(CAPABILITIES.slice(0, 5).map((c) => c.evidence.variant)).toEqual(["element", "element", "element", "element", "element"]);
    const six = CAPABILITIES[5].evidence;
    expect(six).toEqual({ variant: "typographic", tag: "Meta Ads" });
    expect(CAPABILITIES[5].statement).not.toMatch(/\d/);
    expect(CAPABILITIES[5].attribution).toEqual({ label: "Meta Ads" });
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

describe("profile (Content Master 13, rewritten in Content Master 21 · 2026-10-21)", () => {
  const ALL = [PROFILE.core, ...PROFILE.body, PROFILE.ads.title, ...PROFILE.ads.paragraphs];

  it("the declaration, the explanation and Meta Ads are verbatim; the label is the nav word", () => {
    expect(PROFILE.label).toBe(SITE.nav.profile);
    expect(PROFILE.core).toBe(
      "Diseño y desarrollo productos digitales donde la estrategia, la experiencia de usuario y la ingeniería trabajan con un mismo propósito: crear valor real para cada negocio.",
    );
    expect(PROFILE.body).toEqual([
      "Mi trabajo va más allá de construir una interfaz. Me involucro en cómo se presenta una marca, cómo interactúan sus clientes, cómo funcionan sus procesos y cómo convertir una idea en un producto digital sólido, escalable y preparado para crecer.",
      "Desde Uruguay, trabajo en proyectos de comercio electrónico, plataformas y sistemas de gestión, combinando criterio de producto, diseño y desarrollo con una visión comercial.",
    ]);
    expect(PROFILE.ads.title).toBe("Un gran producto también necesita llegar a las personas correctas.");
    expect(PROFILE.ads.paragraphs).toEqual([
      "Me gusta pensar en todo el recorrido: desde la primera vez que alguien descubre un negocio hasta el momento en que decide consultar, reservar o comprar.",
      "Por eso, además de diseñar y desarrollar productos digitales, también trabajo con publicidad en Meta Ads. Campañas en Instagram y Facebook que ayudan a dar a conocer una marca, atraer personas interesadas y aprovechar mejor cada oportunidad.",
      "Porque una buena experiencia digital importa. Pero también importa que la gente llegue a descubrirla.",
    ]);
    expect(PROFILE.ads.emphasis).toBe("Meta Ads");
    expect(PROFILE.ads.paragraphs.some((p) => p.includes(PROFILE.ads.emphasis))).toBe(true);
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
    for (const s of [PROFILE.ads.title, ...PROFILE.ads.paragraphs]) {
      expect(s, s).not.toMatch(/\d|%|ROAS|retorno|inversi[oó]n|presupuesto|ventas|resultados|clientes de|certific/i);
    }
  });
});
