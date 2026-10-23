import type { Gated } from "./types";

interface Profile {
  label: string;
  /** the declaration: the first paragraph, set apart (Content Master 21) */
  core: string;
  /** the explanation: the second and third paragraphs */
  body: string[];
  /**
   * the visual beside each paragraph of the explanation (docs/27 §3): the first paragraph's own four
   * phrases, in order (verified by test against the paragraph), and the kinds of project the second
   * one names, each shown by a real fragment of one of the projects — captioned by its kind only (the
   * Perfil does not name TravelSuite360, Content Master 21); `slug` picks the material
   */
  facets: { phrases: string[]; projects: { slug: "chef-arturo" | "travelsuite360"; kind: string }[] };
  /**
   * Meta Ads, a chapter of its own (Content Master 25, 2026-10-23): a two-line headline, a sequence of
   * three steps — each with a short line taken from the approved copy of Content Master 21 — and one
   * paragraph with the term set in emphasis
   */
  ads: { title: [string, string]; steps: { word: string; line: string }[]; paragraph: string; emphasis: string };
  stack: Gated<string>;
  /** href values; the email also completes the form's route error */
  contacts: { email: Gated<string>; linkedin: Gated<string> };
}

/**
 * Perfil (Content Master 13, rewritten by the positioning pass of 2026-10-21 — Content Master 21).
 * No photo, no title beyond the label. TravelSuite360 is no longer named here (it has its own world,
 * its reel line and the capabilities); the optional «Cofundador de TravelSuite360…» line is NOT
 * included: «cofundador» contradicts the frozen role «Socio · Producto e ingeniería» (round 1).
 */
export const PROFILE: Profile = {
  label: "Perfil",
  core: "Diseño y desarrollo productos digitales donde la estrategia, la experiencia de usuario y la ingeniería trabajan con un mismo propósito: crear valor real para cada negocio.",
  body: [
    "Mi trabajo va más allá de construir una interfaz. Me involucro en cómo se presenta una marca, cómo interactúan sus clientes, cómo funcionan sus procesos y cómo convertir una idea en un producto digital sólido, escalable y preparado para crecer.",
    "Desde Uruguay, trabajo en proyectos de comercio electrónico, plataformas y sistemas de gestión, combinando criterio de producto, diseño y desarrollo con una visión comercial.",
  ],
  facets: {
    phrases: ["una marca", "sus clientes", "sus procesos", "un producto digital"],
    projects: [
      { slug: "chef-arturo", kind: "Comercio electrónico" },
      { slug: "travelsuite360", kind: "Plataforma y sistema de gestión" },
    ],
  },
  ads: {
    title: ["Construirlo es una parte.", "Hacer que lo descubran es la otra."],
    // the precisions of the approved text (Content Master 21) carried by the steps: Instagram and
    // Facebook; the path from discovering a business to consulting, booking or buying
    steps: [
      { word: "Producto", line: "Una buena experiencia digital." },
      { word: "Descubrimiento", line: "Campañas en Instagram y Facebook." },
      { word: "Acción", line: "Consultar, reservar o comprar." },
    ],
    paragraph: "Además de diseñar y desarrollar productos digitales, creo campañas en Meta Ads para conectar marcas con personas interesadas en sus productos y servicios.",
    emphasis: "Meta Ads",
  },
  stack: {
    status: "pending",
    value: "Stack habitual: Next.js · React · TypeScript · Supabase · PostgreSQL · Vercel. IA integrada donde ahorra trabajo real.",
    note: "Content Master 19 · pregunta 8: confirmar que los seis nombres se usan en al menos dos de los productos.",
  },
  contacts: {
    email: { status: "pending", note: "hola@… [CONFIRMAR email]" },
    linkedin: { status: "pending", note: "[CONFIRMAR URL]" },
  },
};
