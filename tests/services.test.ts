/**
 * Servicios (docs/28 §1, Content Master 26): the eight services in the approved words, in order,
 * and nothing beyond them — no figure, no result, no promise.
 */
import { describe, expect, it } from "vitest";
import { SERVICES } from "@/data/services";
import { SITE } from "@/data/site";

describe("Servicios (Content Master 26)", () => {
  it("the section's name, headline and subtitle are the approved words", () => {
    expect(SITE.services).toEqual({
      label: "Servicios",
      heading: "Lo que puedo crear para vos.",
      sub: "De una página web a un sistema completo para tu negocio.",
    });
  });

  it("eight services, numbered 01–08, in the approved order and words", () => {
    expect(SERVICES.map((s) => s.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(SERVICES.map((s) => s.name)).toEqual([
      "Páginas web",
      "Tiendas online",
      "Sistemas a medida",
      "Diseño y experiencia",
      "Inteligencia artificial",
      "Aplicaciones web",
      "Publicidad en Meta Ads",
      "Estrategia digital",
    ]);
    expect(SERVICES.map((s) => s.line)).toEqual([
      "Sitios profesionales, landing pages, portfolios y páginas para marcas, negocios y profesionales.",
      "Shopify, tiendas de ropa, ecommerce, catálogos digitales y experiencias de compra.",
      "Plataformas de reservas, gestión de clientes, pedidos, ventas y procesos internos.",
      "Identidad visual digital, interfaces modernas, diseño responsive y experiencias interactivas.",
      "Asistentes inteligentes, automatizaciones, chatbots e integraciones para ahorrar tiempo.",
      "Aplicaciones y plataformas digitales personalizadas, con usuarios, paneles y funcionalidades propias.",
      "Campañas en Instagram y Facebook para llegar a personas interesadas en tus productos o servicios.",
      "Planificación y mejora de la presencia digital, desde la idea inicial hasta el lanzamiento.",
    ]);
  });

  it("no figure, no result, no promise beyond the approved lines", () => {
    for (const s of SERVICES) {
      expect(`${s.name} ${s.line}`, s.name).not.toMatch(/\d|%|ROAS|garantiz|resultados|clientes de|el mejor|l[ií]der/i);
    }
  });

  it("the old capabilities index is gone, words and all", () => {
    expect(JSON.stringify(SITE)).not.toMatch(/Cinco cosas que se repiten|Después de publicar|Capacidades/);
  });
});
