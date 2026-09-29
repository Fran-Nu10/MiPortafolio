/**
 * Site-level facts. Anything not yet confirmed by Franco is `null` and the UI
 * renders the reserved state instead of inventing it.
 */
export const site = {
  name: "Franco Núñez",
  first: "Franco",
  last: "Núñez",
  initials: "FN",
  positioning: "Digital product designer & developer",
  tagline:
    "Builds digital products from brief to production. Strategy, design, engineering and launch — assembled by one person, on purpose.",
  basedIn: "Montevideo, Uruguay",
  buildingFor: "anywhere",
  does: "Designs and builds digital products end to end — strategy, design, engineering, launch.",
  worksWith:
    "Founders, studios and businesses that need one person who can take a product from brief to production.",
  timezone: "UTC−3",
  /** Real contact routes. null = not supplied yet → route omitted from the UI. */
  contact: {
    email: null as string | null,
    whatsapp: null as string | null,
    booking: null as string | null,
    replyTime: null as string | null,
  },
  workingSince: null as string | null,
  steps: ["Understand", "Strategize", "Design", "Prototype", "Engineer", "Launch"] as const,
  manifesto: [
    { word: "Design", measures: "01", clause: "Art direction, interface systems, motion. A product nobody can build is a drawing." },
    { word: "Engineering", measures: "02–04", clause: "Every layer is mine: data, API, components. No handoff gaps." },
    { word: "Product", measures: "Σ", clause: "Business is the first layer. If it doesn't change a number, it doesn't get built." },
  ],
};

export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
