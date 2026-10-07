/**
 * Global copy (Spec §21 `Site`). Every string is verbatim from the Content Master rev 26:
 * 03 navigation · 04 hero · 05 reel · 11/14 capabilities seam · 15 CTA · 16 microcopy · 17 meta.
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
