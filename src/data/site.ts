/**
 * Global copy (Spec §21 `Site`). Every string is verbatim from the Content Master rev 26:
 * 03 navigation · 04 hero · 05 reel · 11/14 capabilities seam · 15 CTA · 16 microcopy · 17 meta.
 * `declaration` is Content Master 20 (approved by Franco on 2026-10-13).
 */
export const SITE = {
  name: "Franco Núñez",
  lang: "es",

  nav: {
    brand: "Franco Núñez",
    firma: "Producto × Diseño × Ingeniería",
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
    firma: "Producto × Diseño × Ingeniería",
    support: "Diseña y construye productos digitales, de la idea al sistema en producción.",
    /** red: the hero is the first reveal */
    index: "01",
    /** the opening shows only the light band and "00" */
    openingIndex: "00",
  },

  reel: {
    label: "Trabajo · 01–04",
    heading: "Cuatro productos.",
    enter: "Ver caso",
    open: "Abrir ↗",
    /** first visit, disappears after the first interaction */
    hint: "Arrastrá o usá ← →",
    /** resting navigation help */
    restHint: "arrastrá · ← → · 1–4",
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
    kicker: "Cinco cosas que se repiten en los cuatro productos. Y una sexta, después de publicar.",
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
    title: "Ahora, el tuyo.",
    support: "Cuatro productos, de la idea a producción. El quinto todavía está en blanco.",
    fields: {
      name: "Nombre",
      email: "Email",
      brief: "¿Qué estamos construyendo?",
      /** optional: only where it fits on one line (omitted on sm) */
      briefPlaceholder: "Contame lo que tengas, aunque sea una idea.",
    },
    button: { idle: "Enviar", pending: "Enviando…" },
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
      "Diseña y construye productos digitales, de la idea al sistema en producción. Socio de TravelSuite360, a cargo del software. Uruguay.",
    ogTitle: "Franco Núñez",
    ogDescription: "Cuatro productos digitales, de la idea a producción. El quinto todavía está en blanco.",
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
