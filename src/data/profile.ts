import type { Gated } from "./types";

interface Profile {
  label: string;
  /** the declaration: the first paragraph, set apart (Content Master 21) */
  core: string;
  /** the explanation: the second and third paragraphs */
  body: string[];
  /** Meta Ads, in its own space (Content Master 21): a headline, its paragraphs and the term set in emphasis */
  ads: { title: string; paragraphs: string[]; emphasis: string };
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
  ads: {
    title: "Un gran producto también necesita llegar a las personas correctas.",
    paragraphs: [
      "Me gusta pensar en todo el recorrido: desde la primera vez que alguien descubre un negocio hasta el momento en que decide consultar, reservar o comprar.",
      "Por eso, además de diseñar y desarrollar productos digitales, también trabajo con publicidad en Meta Ads. Campañas en Instagram y Facebook que ayudan a dar a conocer una marca, atraer personas interesadas y aprovechar mejor cada oportunidad.",
      "Porque una buena experiencia digital importa. Pero también importa que la gente llegue a descubrirla.",
    ],
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
