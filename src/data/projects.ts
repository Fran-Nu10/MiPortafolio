import type { StaticImageData } from "next/image";

// TravelSuite360 · client names, phones and staff names blurred before publishing
import tsTravelChat from "../../public/projects/travelsuite360/travelsuite360-travelchat.png";
import tsCrm from "../../public/projects/travelsuite360/travelsuite360-crm.png";
import tsAiAssistant from "../../public/projects/travelsuite360/travelsuite360-ai-assistant.png";
import tsReportes from "../../public/projects/travelsuite360/travelsuite360-reportes-financieros.png";
// Prospector · demo RAYO SMASH
import prospectorHeroExploded from "../../public/projects/prospector/prospector-hero-exploded.png";
import prospectorHeroExplodedScroll from "../../public/projects/prospector/prospector-hero-exploded-scroll.png";
import prospectorHeroLayerDetail from "../../public/projects/prospector/prospector-hero-layer-detail.png";
import prospectorMenuTracklist from "../../public/projects/prospector/prospector-menu-tracklist.png";
import prospectorProductClasica from "../../public/projects/prospector/prospector-product-clasica.png";
import prospectorSectionPlancha from "../../public/projects/prospector/prospector-section-plancha.png";
// Santi Nuca
import snOpening from "../../public/projects/santi-nuca/santi-nuca-opening.png";
import snWork01 from "../../public/projects/santi-nuca/santi-nuca-work-01.png";
import snWork02 from "../../public/projects/santi-nuca/santi-nuca-work-02-diptych.png";
import snWork03 from "../../public/projects/santi-nuca/santi-nuca-work-03-detail.png";
import snTriptych from "../../public/projects/santi-nuca/santi-nuca-editorial-forma-linea-textura.png";
import snWork04 from "../../public/projects/santi-nuca/santi-nuca-work-04.png";
import snWork05 from "../../public/projects/santi-nuca/santi-nuca-work-05.png";
import snWork06 from "../../public/projects/santi-nuca/santi-nuca-work-06.png";
// Chef Arturo
import caHero from "../../public/projects/chef-arturo/chef-arturo-hero.png";
import caHeroExpansion from "../../public/projects/chef-arturo/chef-arturo-hero-expansion.png";
import caHeroFullbleed from "../../public/projects/chef-arturo/chef-arturo-hero-fullbleed.png";
import caDetalleIntro from "../../public/projects/chef-arturo/chef-arturo-detalle-intro.png";
import caDetalleFullbleed from "../../public/projects/chef-arturo/chef-arturo-detalle-fullbleed.png";
import caFechas from "../../public/projects/chef-arturo/chef-arturo-fechas-que-importan.png";
import caOcasion from "../../public/projects/chef-arturo/chef-arturo-elegi-tu-ocasion.png";
import caCatalogo from "../../public/projects/chef-arturo/chef-arturo-catalogo-merienda.png";
import caPdp from "../../public/projects/chef-arturo/chef-arturo-pdp-cookie-levain.png";

import { LIVE, type LiveBuild } from "./live";

export type { LiveBuild };

export type LayerKey = "interface" | "components" | "api" | "data";

export interface Layer {
  key: LayerKey;
  label: string;
  /** Real modules / parts named on the layer face. Only documented facts. */
  parts: string[];
}

export interface Capture {
  src: StaticImageData;
  alt: string;
  /** Short caption used in the sheet, never a claim. */
  label: string;
}

/** A module of a product system. capture null = documented but not captured yet. */
export interface Module {
  name: string;
  /** the documented API / data parts it runs through (from the layers) */
  api: string[];
  data: string[];
  capture: Capture | null;
  /** phones: the region of the capture the portrait window frames (0–1), and an optional pan */
  fx?: number;
  fy?: number;
  /** phones only: zoom into the screen so dense UI stays legible */
  zm?: number;
  pan?: [number, number];
}

export interface Project {
  id: "travelsuite360" | "prospector" | "santi-nuca" | "chef-arturo";
  index: number;
  name: string;
  displayName: string;
  role: string;
  category: string;
  claim: string;
  what: string;
  challenge?: string;
  made?: string;
  /** Empty when not documented. Never invented. */
  stack: string[];
  layers: Layer[];
  captures: Capture[];
  /** The world the project enters when frontal. */
  world: "product" | "demo" | "editorial" | "commerce";
  /** Hex colours of the product's own top face, so the plate reads four identities. */
  faceColor: string;
  pending: string[];
  /** the live build, when one is public and verified */
  live: LiveBuild | null;
  /** product systems: the modules the frontal window steps through */
  modules?: Module[];
}

/** TravelSuite360 screens (shared by the sheet's captures and its modules) */
const tsScreens = {
  chat: { src: tsTravelChat, alt: "TravelChat de TravelSuite360: la bandeja de la agencia con conversaciones abiertas y cerradas, un chat donde la IA deriva a una persona del equipo, documentación del pasajero, estado comercial y resumen con IA", label: "travelchat · inbox" },
  crm: { src: tsCrm, alt: "CRM de TravelSuite360: total de clientes, tasas de conversión del embudo comercial, distribución por estado y prioridad, valor promedio por cliente y la tabla de clientes", label: "crm" },
  ai: { src: tsAiAssistant, alt: "Asistente IA de TravelSuite360: crear una cotización de viaje con IA, continuar un borrador o abrir documentos recientes, con el historial de cotizaciones a la izquierda", label: "asistente ia · cotizaciones" },
  reports: { src: tsReportes, alt: "Reportes financieros de TravelSuite360: leads, conversión y reservas, ingresos y promedios del mes en UYU y USD, y la evolución de ingresos", label: "reportes financieros" },
} satisfies Record<string, Capture>;

export const projects: Project[] = [
  {
    id: "travelsuite360",
    index: 1,
    name: "TravelSuite360",
    displayName: "Travel\nSuite360",
    role: "[to confirm]",
    category: "Plataforma SaaS · agencias de viaje",
    claim: "El sistema con el que opera una agencia de viajes: de la primera conversación a la reserva.",
    what: "Un sistema operativo para agencias de viaje: CRM, TravelChat, cotizaciones con IA, viajes y reservas, reportes financieros, usuarios y permisos, varias agencias en una misma plataforma.",
    challenge: "Diseñar y construir el software con el que trabaja una agencia — no la web de una agencia.",
    stack: [],
    layers: [
      { key: "interface", label: "01 · interfaz", parts: ["dashboard"] },
      { key: "components", label: "02 · componentes", parts: ["tablas", "hilos", "formularios", "estados"] },
      { key: "api", label: "03 · api · automatización", parts: ["inbox · TravelChat", "cotizaciones", "reservas", "CRM", "automatizaciones", "auth · roles"] },
      { key: "data", label: "04 · datos", parts: ["agencias", "usuarios · permisos", "viajes", "cotizaciones", "reservas", "conversaciones", "multiagencia"] },
    ],
    captures: [tsScreens.chat, tsScreens.crm, tsScreens.ai, tsScreens.reports],
    // module list: Content Map V2 + Master Prompt V2. Modules with a capture show the real screen;
    // the others stay drawn until theirs lands in public/projects/travelsuite360/.
    modules: [
      { name: "TravelChat · inbox", api: ["inbox · TravelChat"], data: ["conversaciones"], capture: tsScreens.chat, fx: 0.5, fy: 0.4, zm: 1.2, pan: [0.5, 0.88] },
      { name: "CRM", api: ["CRM"], data: ["agencias", "usuarios · permisos"], capture: tsScreens.crm, fx: 0.15, fy: 0.16, zm: 1.2, pan: [0.15, 0.85] },
      { name: "Cotizaciones · asistente IA", api: ["cotizaciones"], data: ["cotizaciones"], capture: tsScreens.ai, fx: 0.55, fy: 0.52, zm: 1.2 },
      { name: "Reportes financieros", api: [], data: ["cotizaciones", "reservas"], capture: tsScreens.reports, fx: 0.12, fy: 0.24, zm: 1.2, pan: [0.12, 0.5] },
      { name: "Viajes · reservas", api: ["reservas"], data: ["viajes", "reservas"], capture: null },
      { name: "Automatizaciones", api: ["automatizaciones", "auth · roles"], data: ["multiagencia"], capture: null },
    ],
    world: "product",
    faceColor: "#f6f7f9",
    pending: ["viajes · reservas", "automatizaciones", "public demo URL"],
    live: LIVE.travelsuite360,
  },
  {
    id: "prospector",
    index: 2,
    name: "Prospector",
    displayName: "Prospector",
    role: "Estrategia, sistema de diseño, ingeniería, lanzamiento",
    category: "Ingeniería creativa · comercio interactivo",
    claim: "Demos que llegan construidas: el restaurante ve su producto antes de la primera conversación.",
    what: "Un sistema de prospección que genera una demo funcional y personalizada para cada lead antes del primer contacto. RAYO SMASH es la plantilla gastronómica: hero por capas, menú tipo tracklist y ficha de producto.",
    challenge: "Llegar a la primera conversación con el producto ya construido — a escala, rubro por rubro.",
    made: "Pipeline de scoring de leads, sistema de plantillas por rubro, generador de demos, especificación de motion.",
    stack: ["Next.js 15", "Tailwind v4", "Framer Motion", "Apify"],
    layers: [
      { key: "interface", label: "01 · interfaz", parts: ["hero por capas", "menú tracklist", "ficha de producto"] },
      { key: "components", label: "02 · componentes", parts: ["plantilla por rubro", "design tokens", "spec de motion"] },
      { key: "api", label: "03 · pipeline", parts: ["scraping · Apify", "scoring", "generador de demos"] },
      { key: "data", label: "04 · datos", parts: ["leads", "rubros", "una demo por lead"] },
    ],
    captures: [
      { src: prospectorHeroExploded, alt: "Hero de RAYO SMASH: la hamburguesa despiezada capa por capa bajo el título CAPA POR CAPA", label: "hero · capa por capa" },
      { src: prospectorHeroExplodedScroll, alt: "Hero de RAYO SMASH durante el scroll: las capas se separan y aparece el producto CLÁSICA", label: "hero · scroll" },
      { src: prospectorHeroLayerDetail, alt: "Una sola capa de la hamburguesa, medallón con cheddar, a gran escala durante el scroll", label: "hero · detalle de capa" },
      { src: prospectorMenuTracklist, alt: "Menú de RAYO SMASH: un tracklist de cinco hamburguesas con la CLÁSICA armada como producto activo, precio y Agregar", label: "menú · tracklist" },
      { src: prospectorProductClasica, alt: "Ficha de producto de la CLÁSICA en RAYO SMASH: ingredientes, cantidad, Agregar y productos relacionados", label: "producto · clásica" },
      { src: prospectorSectionPlancha, alt: "Sección de RAYO SMASH: Todo empieza en la plancha, una fotografía a pantalla completa de una smash burger en la plancha", label: "sección · plancha" },
    ],
    world: "demo",
    faceColor: "#0b0b0b",
    pending: ["real mobile capture"],
    live: LIVE.prospector,
  },
  {
    id: "santi-nuca",
    index: 3,
    name: "Santi Nuca",
    displayName: "Santi\nNuca",
    role: "[to confirm]",
    category: "Dirección de arte · experiencia editorial",
    claim: "Un portfolio editorial hecho de imagen, ritmo y contención.",
    what: "El portfolio de un hair artist: maquetación editorial de gran formato, una división vertical, espacio negativo extremo, fotografía en blanco y negro y color, trabajos numerados del 01 al 06 y una navegación mínima.",
    stack: [],
    layers: [
      { key: "interface", label: "01 · páginas", parts: ["apertura", "trabajos numerados", "tríptico"] },
      { key: "components", label: "02 · sistema editorial", parts: ["filete vertical", "numerales", "índice"] },
      { key: "api", label: "03 · —", parts: [] },
      { key: "data", label: "04 · trabajos", parts: ["01 — 06"] },
    ],
    captures: [
      { src: snOpening, alt: "Apertura de Santi Nuca: SANTI / NUCA en tipografía pesada, un retrato en blanco y negro y una división vertical", label: "apertura" },
      { src: snWork01, alt: "Santi Nuca, trabajo 01: el numeral 01 junto a un retrato en blanco y negro", label: "01" },
      { src: snWork02, alt: "Santi Nuca, trabajo 02: un díptico, retrato en blanco y negro junto a una fotografía editorial en color", label: "02 · díptico" },
      { src: snWork03, alt: "Santi Nuca, trabajo 03: detalle, fotografía macro en color de labios y perlas", label: "03 · detalle" },
      { src: snTriptych, alt: "Tríptico editorial de Santi Nuca: FORMA, LÍNEA, TEXTURA — tres columnas, tres fotografías en blanco y negro", label: "estudio de corte" },
      { src: snWork04, alt: "Santi Nuca, trabajo 04: numeral en naranja junto a un retrato en blanco y negro", label: "04" },
      { src: snWork05, alt: "Santi Nuca, trabajo 05: numeral en naranja junto a un retrato oscuro en blanco y negro", label: "05" },
      { src: snWork06, alt: "Santi Nuca, trabajo 06: numeral en naranja junto a un retrato de cuerpo entero en blanco y negro", label: "06" },
    ],
    world: "editorial",
    faceColor: "#f4f3f0",
    pending: ["typeface name"],
    live: LIVE["santi-nuca"],
  },
  {
    id: "chef-arturo",
    index: 4,
    name: "Chef Arturo",
    displayName: "Chef\nArturo",
    role: "[to confirm]",
    category: "Comercio premium · dirección de arte × compra",
    claim: "Comercio editorial para una marca gastronómica: identidad fuerte, compra clara.",
    what: "CHEF Arturo by Julia Montserrat: pastelería, merienda y lunch para fiestas. Un hero editorial con una imagen en arco que crece hasta ocupar la pantalla, tres modos de compra (compra del día, encargo con fecha, lunch para eventos), catálogo y una ficha de producto con stock del día, Mercado Pago y consulta por WhatsApp.",
    stack: ["Mercado Pago", "WhatsApp"],
    layers: [
      { key: "interface", label: "01 · interfaz", parts: ["hero", "catálogo", "ficha de producto"] },
      { key: "components", label: "02 · componentes", parts: ["modos de compra", "arco", "selector"] },
      { key: "api", label: "03 · compra", parts: ["carrito", "Mercado Pago", "WhatsApp"] },
      { key: "data", label: "04 · datos", parts: ["catálogo", "stock del día", "retiro y entrega"] },
    ],
    captures: [
      { src: caHero, alt: "Hero de Chef Arturo: Pastelería, merienda y lunch para fiestas, dos llamados a la acción y una pequeña fotografía de torta en arco", label: "hero" },
      { src: caHeroExpansion, alt: "Hero de Chef Arturo a mitad de la expansión: la fotografía en arco crece mientras el texto retrocede", label: "hero · expansión" },
      { src: caHeroFullbleed, alt: "Hero de Chef Arturo a pantalla completa: una torta por capas sobre una base de piedra ocupa toda la pantalla", label: "hero · pantalla completa" },
      { src: caDetalleIntro, alt: "Sección de Chef Arturo: El detalle también forma parte del pedido, con una pequeña fotografía de cocina", label: "detalle" },
      { src: caDetalleFullbleed, alt: "Sección de Chef Arturo a pantalla completa: una base de varios pisos con pequeñas tortas en una cocina, con texto encima", label: "detalle · pantalla completa" },
      { src: caFechas, alt: "Chef Arturo, Fechas que importan: Compra del día, Encargo con fecha, Lunch para eventos", label: "fechas que importan" },
      { src: caOcasion, alt: "Chef Arturo, Elegí tu ocasión: Pastelería, Merienda, Salados, Lunch para eventos", label: "elegí tu ocasión" },
      { src: caCatalogo, alt: "Catálogo de Chef Arturo, Merienda: cuatro Cookie Levain con precio y Agregar", label: "catálogo" },
      { src: caPdp, alt: "Ficha de producto de Chef Arturo: Cookie Levain de pistacho y chocolate blanco, precio, cantidad, stock del día, Mercado Pago, Agregar al carrito, Consultar por WhatsApp", label: "ficha · cookie levain" },
    ],
    world: "commerce",
    faceColor: "#f3eee4",
    pending: ["cart capture", "stack"],
    live: LIVE["chef-arturo"],
  },
];

export const projectById = Object.fromEntries(projects.map((p) => [p.id, p])) as Record<Project["id"], Project>;

/**
 * RAYO SMASH · the six real ingredients as they sit in the exploded hero capture
 * (prospector-hero-exploded.png), top to bottom. Centre and radii in % of the capture, so the
 * portfolio can cut each layer out of the real image and move it — the drawing becomes the product.
 */
export const rayoLayers = [
  { label: "01 · pan superior", short: "01 · pan", cx: 49.4, cy: 12.4, rx: 9.2, ry: 7.4 },
  { label: "02 · bacon", short: "02 · bacon", cx: 49.4, cy: 30.4, rx: 11.6, ry: 6.4 },
  { label: "03 · medallón + cheddar", short: "03 · medallón", cx: 49.2, cy: 46.9, rx: 9.6, ry: 6.4 },
  { label: "04 · cebolla", short: "04 · cebolla", cx: 49.4, cy: 63.2, rx: 10.2, ry: 6.0 },
  { label: "05 · medallón + cheddar", short: "05 · medallón", cx: 49.4, cy: 79.6, rx: 10.2, ry: 6.0 },
  { label: "06 · pan inferior", short: "06 · pan", cx: 49.4, cy: 96.4, rx: 9.6, ry: 5.2 },
] as const;

/** the assembled CLÁSICA in the menu capture (prospector-menu-tracklist.png): an ellipse that hugs the
 *  burger and leaves out the letters of the title behind it, % of the capture */
export const rayoAssembled = { cx: 49.5, cy: 53.4, rx: 7.4, ry: 12.3 } as const;

/** the captures are all ~2550 × 1320 */
export const CAPTURE_RATIO = 2550 / 1320;
