/**
 * Site-level facts. Anything not yet confirmed by Franco is `null` and the UI
 * renders the reserved state instead of inventing it.
 */
export const site = {
  name: "Franco Núñez",
  first: "Franco",
  last: "Núñez",
  initials: "FN",
  positioning: "Diseño y desarrollo de productos digitales",
  tagline:
    "Productos digitales, de la idea a producción. Estrategia, diseño, ingeniería y lanzamiento, ensamblados por una sola persona.",
  basedIn: "Montevideo, Uruguay · UTC−3",
  buildingFor: "proyectos en cualquier país",
  does: "Diseña y construye productos digitales de punta a punta: estrategia, diseño, ingeniería y lanzamiento.",
  worksWith:
    "Fundadores, estudios y empresas que necesitan a una persona capaz de llevar un producto de la idea a producción.",
  timezone: "UTC−3",
  /** Real contact routes. null = not supplied yet → route omitted from the UI. */
  contact: {
    email: null as string | null,
    whatsapp: null as string | null,
    booking: null as string | null,
    replyTime: null as string | null,
  },
  workingSince: null as string | null,
  steps: ["Entender", "Definir", "Diseñar", "Prototipar", "Construir", "Lanzar"] as const,
  manifesto: [
    { word: "Diseño", measures: "01", clause: "Dirección de arte, interfaz y motion. Si no se puede construir, es solo un dibujo." },
    { word: "Ingeniería", measures: "02–04", clause: "Datos, API, componentes: cada capa es mía. Nada se pierde entre el diseño y el código." },
    { word: "Producto", measures: "Σ", clause: "El negocio es la primera capa. Si no mueve un número, no se construye." },
  ],
};

export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
