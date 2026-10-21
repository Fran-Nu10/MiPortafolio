/**
 * Global copy (Spec §21 `Site`). Every string is verbatim from the Content Master rev 26:
 * 03 navigation · 04 hero · 05 reel · 11/14 capabilities seam · 15 CTA · 16 microcopy · 17 meta.
 * `declaration` is Content Master 20 (approved by Franco on 2026-10-13). The firma «× Crecimiento», the
 * hero line, the reel heading, the capabilities kicker, the CTA support and the meta lines were
 * updated by the positioning pass of 2026-10-21 (Content Master 21).
 */
export const SITE = {
  name: "Franco Núñez",
  lang: "es",

  nav: {
    brand: "Franco Núñez",
    firma: "Producto × Diseño × Ingeniería × Crecimiento",
    work: "Trabajo",
    profile: "Perfil",
    /** without a period in the nav, with a period in the section */
    cta: "Ahora, el tuyo",
    close: "Cerrar",
    /** skip link (Spec §19) */
    skip: "Saltar al contenido",
  },

  hero: {
    name: ["FRANCO", "NÚÑEZ"] as const,
    firma: "Producto × Diseño × Ingeniería × Crecimiento",
    /** option A, approved 2026-10-21 (Content Master 21): an explicit exception to §02 «transformar ideas» */
    support: "Transforma ideas y negocios en productos digitales que destacan, funcionan y generan oportunidades.",
    /** red: the hero is the first reveal */
    index: "01",
    /** the opening shows only the light band and "00" */
    openingIndex: "00",
  },

  reel: {
    /** the range «01–NN» is added from the real number of projects (lib/content `rangeLabel`) */
    label: "Trabajo",
    /** no number: the selection keeps growing (Content Master 21) */
    heading: "Trabajo seleccionado.",
    enter: "Ver caso",
    open: "Abrir ↗",
    /** first visit, disappears after the first interaction */
    hint: "Arrastrá o usá ← →",
    /** resting navigation help */
    /** the last key is the real number of projects */
    restHint: (total: number) => `arrastrá · ← → · 1–${total}`,
    prev: "Proyecto anterior",
    next: "Proyecto siguiente",
    /** accessible names of the reel's structure (Spec §06 DOM) */
    a11y: { region: "Trabajo", roleCarousel: "carrusel", roleItem: "proyecto", nav: "Proyectos" },
    /**
     * cursor words (Revelado 2.2 §8: DRAG · VER). Content Master 03 allows no English interface
     * labels, so the drag word is the Content Master's own verb for it ("arrastrá", 05 and 16).
     */
    cursor: { drag: "Arrastrá", enter: "Ver" },
  },

  world: {
    next: "Siguiente →",
    back: "← Trabajo",
    stackLabel: "Stack",
    /** the capabilities rail is the target after Chef Arturo */
    capabilitiesName: "Capacidades",
    /** no-JS deep link on /trabajo/{slug}: "Ir a {name}" (Spec §20) */
    goTo: "Ir a",
  },

  capabilities: {
    /** sr-only section heading: the rail words are the visual title */
    heading: "Capacidades",
    seam: "Todo lo anterior pasó por las mismas manos.",
    kicker: "Cinco cosas que se repiten en todos los productos. Y una sexta, después de publicar.",
    subKicker: "Después de publicar",
  },

  /**
   * The commercial declaration (Content Master 20, approved by Franco on 2026-10-13): MOSTRAR →
   * CONVENCER → CONVERTIR, between the capabilities and the profile. Its own vocabulary — nothing
   * here comes from a project (no TravelSuite360 copy, data or narrative). The actions are kinds
   * of businesses' possibilities, never results. Voice exceptions approved for this section only
   * (Content Master 20): the visitor is addressed in the second person, and the conclusion is in
   * the first person outside the profile.
   */
  declaration: {
    /** sr-only section heading: the three words are the visual titles */
    heading: "MOSTRAR. CONVENCER. CONVERTIR.",
    acts: [
      {
        title: "MOSTRAR.",
        words: ["productos", "servicios", "identidad", "experiencia", "calidad", "ideas", "atención", "detalles", "oportunidades", "valor"],
        line: "Tenés algo que vale la pena mostrar.",
      },
      {
        title: "CONVENCER.",
        words: ["claridad", "identidad", "confianza", "diferenciación", "facilidad", "experiencia"],
        line: "Hagamos que tus clientes descubran por qué elegirte.",
      },
      {
        title: "CONVERTIR.",
        words: ["explorar", "consultar", "reservar", "comprar"],
        line: "Que no solo te vean. Que te elijan.",
      },
    ],
    /** the conclusion: body text, not another headline */
    close: "Diseño y desarrollo productos digitales pensados para mostrar lo mejor de tu negocio y convertir el interés en acción.",
  },

  cta: {
    /** the closing of the journey, redesigned on 2026-10-21 (docs/23 §5): eyebrow, headline, text, aside */
    eyebrow: "Tu próximo proyecto empieza acá",
    title: "Ahora, el tuyo.",
    support: "Una idea nueva, un negocio que quiere crecer o un producto que necesita dar el siguiente paso. Contame qué tenés en mente.",
    /** said next to the button: the invitation, not another headline */
    aside: "Hablemos de lo que podemos construir.",
    fields: {
      name: "Nombre",
      email: "Email",
      brief: "¿Qué estamos construyendo?",
      /** optional: only where it fits on one line (omitted on sm) */
      briefPlaceholder: "Contame lo que tengas, aunque sea una idea.",
    },
    button: { idle: "Enviar proyecto", pending: "Enviando…" },
    errors: {
      missing: "Falta esto.",
      invalid: "Revisá el email.",
      /** "No se envió. Probá de nuevo o escribí a {email}" — the email part ships only once confirmed */
      route: "No se envió. Probá de nuevo",
      routeEmail: "o escribí a",
    },
    success: "Brief recibido.",
    end: "FRANCO NÚÑEZ",
  },

  footer: { line: (year: number) => `Franco Núñez · Uruguay · ${year}` },

  notFound: { title: "No existe.", back: "← Trabajo" },

  meta: {
    title: "Franco Núñez — Producto × Diseño × Ingeniería",
    description:
      "Transforma ideas y negocios en productos digitales que destacan, funcionan y generan oportunidades. Socio de TravelSuite360, a cargo del software. Uruguay.",
    ogTitle: "Franco Núñez",
    ogDescription: "Transforma ideas y negocios en productos digitales que destacan, funcionan y generan oportunidades.",
    ogImage: "og.home",
    /** JSON-LD Person (home only). url and sameAs are [CONFIRMAR] → omitted. */
    person: { name: "Franco Núñez", jobTitle: "Producto × Diseño × Ingeniería", addressCountry: "UY" },
  },

  /** optional sections ship only with their real media (Spec §13) */
  features: {
    humanMoment: false,
    francoAtWork: false,
  },
} as const;

export type Site = typeof SITE;
