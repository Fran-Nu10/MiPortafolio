import type { Project, ProjectSlug } from "./types";

/**
 * The four products, in journey order (Revelado 2.2 §5, fixed).
 * Copy: Content Master rev 26 — section 00 (ronda 1, final text) wins over 06–09 where
 * both exist. `pending` fields are [CONFIRMAR]: they are never rendered. The `note` on a
 * pending field records what is known so Franco can confirm it; it never reaches the page.
 */

const ENSAMBLE_LIVE_NOTE = "Candidata encontrada en src/data/live.ts de ENSAMBLE (HTTP 200 el 2026-10-01). Confirmar con Franco antes de publicar.";

export const PROJECTS: Project[] = [
  {
    id: "travelsuite360",
    index: 1,
    name: "TravelSuite360",
    category: "SaaS para agencias de viaje",
    role: "Socio · Producto e ingeniería",
    reelLine: "SaaS para agencias de viaje · Socio · Producto e ingeniería",
    oneLine: "Un sistema para operar una agencia: de la consulta a la reserva, en un solo lugar.",
    microCase:
      "TravelSuite360 es una empresa de tres socios. Franco lleva toda el área de software: el producto digital y su evolución técnica. Módulos: CRM, cotizaciones, viajes, reservas, reportes, usuarios, TravelChat con bandeja de WhatsApp, automatizaciones e IA. Hoy lo operan tres agencias.",
    proofLine: "Producto real, en uso en tres agencias.",
    year: { status: "pending" },
    liveUrl: { status: "pending", note: "Sin URL pública conocida. Si el producto es privado: «Ver demo ↗» o se omite." },
    stack: { status: "pending", note: "Candidatos del master: Next.js · TypeScript · Supabase · PostgreSQL · integración WhatsApp · IA." },
    worldType: "ts-depth",
    worldCopy: {
      "TS01.label": "input",
      "TS01.message": "Necesito viajar a Punta Cana en julio, somos cuatro.",
      "TS01.origin": "Las agencias operan en WhatsApp, planillas y correo. TravelSuite360 lo junta.",
      "TS03.label": "interpretado",
      "TS03.dest": "destino · Punta Cana",
      "TS03.date": "fechas · julio",
      "TS03.pax": "pasajeros · 4",
      "TS04.q1": "Opción 01",
      "TS04.q2": "Opción 02",
      "TS04.fields": "destino · fechas · pasajeros · vuelo · hotel",
      "TS05.tag": "seleccionada",
      "TS06.trip": "viaje · Punta Cana · fechas · pasajeros · vuelo · hotel · traslados · estado",
      "TS07.reservation": "reserva confirmada",
      "TS08.report": "→ reporte actualizado · sin intervención",
      "TS09.fragments": "mensaje · cotización · viaje · reserva · cliente · reporte",
      "TS10.close": "Una agencia entera, operando.",
    },
    theme: { env: "black", tone: "paper-on-black" },
    reel: { aspect: { desktop: [1094, 616], mobile: [358, 420] }, poster: "ts.reel.poster", loop: "ts.reel.loop" },
    screen: { poster: "ts.reel.poster", object: null },
    proof: { media: "ts.proof", chapters: [{ label: "TravelChat", at: 0 }, { label: "CRM", at: 3 }, { label: "IA", at: 5.5 }] },
    a11y: {
      reelLabel: "01 de 04: TravelSuite360",
      proofVideoLabel: "Recorrido por TravelSuite360",
      openLabel: "Abrir TravelSuite360 en una pestaña nueva",
      worldSummary: [
        "mensaje recibido",
        "datos interpretados: destino Punta Cana, fechas julio, pasajeros 4",
        "dos opciones de cotización, una seleccionada",
        "viaje armado",
        "reserva confirmada, reporte actualizado, sin intervención",
      ],
    },
    next: "rayo-smash",
    meta: {
      title: "TravelSuite360 — Franco Núñez",
      description:
        "Un sistema para operar una agencia de viajes: de la consulta a la reserva, en un solo lugar. Producto, diseño e ingeniería.",
      ogImage: "og.ts",
    },
  },
  {
    id: "rayo-smash",
    index: 2,
    name: "Rayo Smash",
    category: "Comercio interactivo · demo de Prospector",
    role: "Diseño, motion y desarrollo",
    reelLine: "Comercio interactivo · Diseño, motion y desarrollo",
    oneLine: "Una hamburguesa, capa por capa, que termina en menú y carrito: la demo con la que Prospector entra a cada restaurante.",
    microCase:
      "Prospector es el sistema de prospección de Franco: genera una demo comercial por negocio antes del primer contacto. Rayo Smash es esa demo para una hamburguesería: hero por capas, menú tipo tracklist, producto y pedido. Stack documentado: Next.js 15, Tailwind v4, Framer Motion, Apify.",
    relationLine: "Rayo Smash no es un cliente: es la demo que Prospector construye para vender.",
    proofLine: "Demo real, navegable.",
    proofLineExtra: {
      status: "pending",
      value: "Cada negocio recibe la suya.",
      note: "Content Master 19 · pregunta 3: ¿existen demos para más negocios? Si no: «Cada negocio recibiría la suya.» o se quita.",
    },
    year: { status: "pending" },
    liveUrl: { status: "pending", value: "https://prospector-phi-virid.vercel.app/rayo-smash", note: ENSAMBLE_LIVE_NOTE },
    stack: { status: "confirmed", value: ["Next.js 15", "Tailwind v4", "Framer Motion", "Apify"] },
    worldType: "rayo-layers",
    worldCopy: {
      "R03.title": "Capa por capa.",
      "R07.menu": "Clásica · doble medallón smash, cheddar fundido, salsa de la casa, pan brioche · $ 490",
    },
    theme: { env: "red", tone: "paper-on-black" },
    reel: { aspect: { desktop: [1094, 580], mobile: [358, 420] }, poster: "rayo.reel.poster", loop: "rayo.reel.loop" },
    screen: { poster: "rayo.reel.poster", object: "rayo.burger" },
    proof: { media: "rayo.proof" },
    a11y: {
      reelLabel: "02 de 04: Rayo Smash",
      proofVideoLabel: "Recorrido por Rayo Smash",
      openLabel: "Abrir Rayo Smash en una pestaña nueva",
      worldSummary: [],
    },
    next: "santi-nuca",
    meta: {
      title: "Rayo Smash — Franco Núñez",
      description: "Una demo interactiva que se arma capa por capa. Construida con Prospector.",
      ogImage: "og.rayo",
    },
  },
  {
    id: "santi-nuca",
    index: 3,
    name: "Santi Nuca",
    category: "Portfolio editorial",
    role: "Diseño y desarrollo",
    reelLine: "Portfolio editorial · Diseño y desarrollo",
    oneLine: "Un portfolio donde la fotografía manda y la interfaz desaparece.",
    microCase:
      "Portfolio para Santi Nuca, diseñador de imagen. Las fotografías son suyas; la web es de Franco: dirección estética digital, composición editorial, interfaz y desarrollo. Apertura a página completa, trabajos numerados 01–06, vistas forma / línea / textura, navegación mínima.",
    credit: { label: "Fotografía", holder: "Santi Nuca" },
    proofLine: "Sitio real, en línea.",
    year: { status: "pending" },
    liveUrl: { status: "pending", value: "https://hair-portfolio-two.vercel.app", note: ENSAMBLE_LIVE_NOTE },
    stack: { status: "pending", note: "Sin documentación técnica." },
    worldType: "santi-editorial",
    worldCopy: {
      "N04.views": "Forma · Línea · Textura",
      "N04.pages": "01 · 02 · 03",
    },
    theme: { env: "paper", tone: "ink-on-paper" },
    reel: { aspect: { desktop: [1094, 700], mobile: [358, 420] }, poster: "santi.reel.poster", loop: "santi.reel.loop" },
    screen: { poster: "santi.reel.poster", object: "santi.photo.1" },
    proof: { media: "santi.proof" },
    a11y: {
      reelLabel: "03 de 04: Santi Nuca",
      proofVideoLabel: "Recorrido por Santi Nuca",
      openLabel: "Abrir Santi Nuca en una pestaña nueva",
      worldSummary: [],
    },
    next: "chef-arturo",
    meta: {
      title: "Santi Nuca — Franco Núñez",
      description: "Un portfolio editorial donde la fotografía manda y la interfaz desaparece.",
      ogImage: "og.santi",
    },
  },
  {
    id: "chef-arturo",
    index: 4,
    name: "Chef Arturo",
    category: "Comercio digital · pastelería",
    role: "Producto, diseño y desarrollo",
    reelLine: "Comercio digital · Producto, diseño y desarrollo",
    oneLine: "Una pastelería que se vende por la foto y se cobra por Mercado Pago o WhatsApp.",
    microCase:
      "Tienda para Chef Arturo, hecha entera por Franco como producto digital: catálogo, tres modos de compra, producto con stock del día y cantidad, carrito, pago por Mercado Pago y consulta por WhatsApp.",
    proofLine: "Tienda real, en línea.",
    paymentsLive: { status: "pending", note: "Content Master 19 · pregunta 1: Mercado Pago ¿live o sandbox?" },
    year: { status: "pending" },
    liveUrl: { status: "pending", value: "https://chef-arturoprod.vercel.app", note: ENSAMBLE_LIVE_NOTE },
    stack: { status: "pending", note: "Mercado Pago · WhatsApp visibles; framework [CONFIRMAR]." },
    worldType: "chef-commerce",
    worldCopy: {
      "C04.catalog": "Merienda · cookies, brownies y boxes dulces",
      "C05.product": "Cookie levain de pistacho y chocolate blanco · $ 120 · compra directa",
      "C06.purchase": "− 1 + · Agregar al carrito · Mercado Pago · consultar por WhatsApp",
      "C07.close": "Primero el deseo. Después, la compra.",
    },
    theme: { env: "image", tone: "paper-on-black" },
    reel: { aspect: { desktop: [1094, 640], mobile: [358, 420] }, poster: "chef.reel.poster", loop: "chef.reel.loop" },
    screen: { poster: "chef.reel.poster", object: "chef.product" },
    proof: { media: "chef.proof" },
    a11y: {
      reelLabel: "04 de 04: Chef Arturo",
      proofVideoLabel: "Recorrido por Chef Arturo",
      openLabel: "Abrir Chef Arturo en una pestaña nueva",
      worldSummary: [],
    },
    next: "capacidades",
    meta: {
      title: "Chef Arturo — Franco Núñez",
      description: "Una pastelería que se vende por la foto y se cobra por Mercado Pago o WhatsApp.",
      ogImage: "og.chef",
    },
  },
];

export const PROJECT_SLUGS = PROJECTS.map((p) => p.id);

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.id === slug);
}

export function isProjectSlug(slug: string): slug is ProjectSlug {
  return PROJECTS.some((p) => p.id === slug);
}
