import type { StaticImageData } from "next/image";

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

/**
 * A live build that can open inside the portfolio (Live Project Window).
 * Only URLs taken from the project's own repository (GitHub homepage field) and verified to
 * answer 200 without X-Frame-Options / CSP frame-ancestors. Anything else stays null.
 */
export interface LiveBuild {
  url: string;
  /** host shown in the window strip */
  host: string;
  /** verified embeddable (no X-Frame-Options, no frame-ancestors) — else the window only offers OPEN LIVE */
  embeddable: boolean;
  /** the build is responsive: on desktop the window can also show it at phone width */
  responsive: boolean;
  /** date the headers were last checked */
  checked: string;
}

/** A module of a product system. capture null = documented but not captured yet. */
export interface Module {
  name: string;
  /** the documented API / data parts it runs through (from the layers) */
  api: string[];
  data: string[];
  capture: Capture | null;
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

export const projects: Project[] = [
  {
    id: "travelsuite360",
    index: 1,
    name: "TravelSuite360",
    displayName: "Travel\nSuite360",
    role: "[to confirm]",
    category: "Product system · SaaS",
    claim: "A complete operating system for travel agencies.",
    what: "An operating system for travel agencies: CRM, inbox, quotes, trips and reservations, users and permissions, multi-agency context.",
    challenge: "Design and build software an agency runs on — not a website for an agency.",
    stack: [],
    layers: [
      { key: "interface", label: "01 · interface", parts: ["dashboard"] },
      { key: "components", label: "02 · components", parts: ["tables", "threads", "forms", "status"] },
      { key: "api", label: "03 · api · automation", parts: ["inbox · TravelChat", "quotes", "reservations", "CRM", "automations", "auth · roles"] },
      { key: "data", label: "04 · data", parts: ["agencies", "users · permissions", "trips", "quotes", "reservations", "conversations", "multi-agency"] },
    ],
    captures: [],
    // module list: Content Map V2 + Master Prompt V2 (TravelChat, CRM, reportes financieros, AI assistant · cotizaciones).
    // Captures go in public/projects/travelsuite360/ (see docs/03-assets-manifest.md); each one fills its module.
    modules: [
      { name: "TravelChat · inbox", api: ["inbox · TravelChat"], data: ["conversations"], capture: null },
      { name: "CRM", api: ["CRM"], data: ["agencies", "users · permissions"], capture: null },
      { name: "Cotizaciones · AI assistant", api: ["quotes"], data: ["quotes"], capture: null },
      { name: "Viajes · reservas", api: ["reservations"], data: ["trips", "reservations"], capture: null },
      { name: "Reportes financieros", api: [], data: ["quotes", "reservations"], capture: null },
      { name: "Automations", api: ["automations", "auth · roles"], data: ["multi-agency"], capture: null },
    ],
    world: "product",
    faceColor: "#f6f7f9",
    pending: ["dashboard", "TravelChat · inbox", "CRM", "cotizaciones · AI assistant", "viajes · reservas", "reportes financieros"],
    live: null,
  },
  {
    id: "prospector",
    index: 2,
    name: "Prospector",
    displayName: "Prospector",
    role: "Strategy, design system, engineering, launch",
    category: "Creative engineering · interactive commerce",
    claim: "A restaurant commerce demo engineered to sell the experience before the pitch.",
    what: "A prospecting system that renders a personalized, working demo site for every lead before outreach begins. The RAYO SMASH demo is one vertical template: a layered hero, a tracklist menu and a product page.",
    challenge: "Arrive at a first conversation with the product already built — at scale, per vertical.",
    made: "Lead scoring pipeline, vertical template system, demo renderer, motion spec.",
    stack: ["Next.js 15", "Tailwind v4", "Framer Motion", "Apify"],
    layers: [
      { key: "interface", label: "01 · interface", parts: ["layered hero", "tracklist menu", "product page"] },
      { key: "components", label: "02 · components", parts: ["vertical template", "design tokens", "motion spec"] },
      { key: "api", label: "03 · pipeline", parts: ["scraping · Apify", "scoring", "demo renderer"] },
      { key: "data", label: "04 · data", parts: ["leads", "verticals", "demos per lead"] },
    ],
    captures: [
      { src: prospectorHeroExploded, alt: "RAYO SMASH hero: the burger exploded layer by layer under the headline CAPA POR CAPA", label: "hero · capa por capa" },
      { src: prospectorHeroExplodedScroll, alt: "RAYO SMASH hero while scrolling: the layers separate and the product label CLÁSICA appears", label: "hero · scroll" },
      { src: prospectorHeroLayerDetail, alt: "A single burger layer, patty with cheddar, at large scale during the scroll", label: "hero · layer detail" },
      { src: prospectorMenuTracklist, alt: "RAYO SMASH menu: a tracklist of five burgers with the active product CLÁSICA assembled, price and Agregar", label: "menu · tracklist" },
      { src: prospectorProductClasica, alt: "RAYO SMASH product page for CLÁSICA: ingredients, quantity, Agregar and related products", label: "product · clásica" },
      { src: prospectorSectionPlancha, alt: "RAYO SMASH section: Todo empieza en la plancha, a full-bleed photograph of a smash burger on the griddle", label: "section · plancha" },
    ],
    world: "demo",
    faceColor: "#0b0b0b",
    pending: ["real mobile capture"],
    live: { url: "https://prospector-phi-virid.vercel.app/rayo-smash", host: "prospector · rayo-smash", embeddable: true, responsive: true, checked: "2026-10-01" },
  },
  {
    id: "santi-nuca",
    index: 3,
    name: "Santi Nuca",
    displayName: "Santi\nNuca",
    role: "[to confirm]",
    category: "Art direction · editorial experience",
    claim: "An editorial portfolio built around image, rhythm and restraint.",
    what: "A portfolio for a creative discipline: large-format editorial layout, a vertical division, extreme negative space, black and white and colour photography, numbered works 01–06, minimal navigation.",
    stack: [],
    layers: [
      { key: "interface", label: "01 · spreads", parts: ["opening", "numbered works", "triptych"] },
      { key: "components", label: "02 · editorial system", parts: ["vertical rule", "numerals", "index"] },
      { key: "api", label: "03 · —", parts: [] },
      { key: "data", label: "04 · works", parts: ["01 — 06"] },
    ],
    captures: [
      { src: snOpening, alt: "Santi Nuca opening: SANTI / NUCA in heavy type, a black and white portrait and a vertical division", label: "opening" },
      { src: snWork01, alt: "Santi Nuca work 01: numeral 01 beside a black and white portrait", label: "01" },
      { src: snWork02, alt: "Santi Nuca work 02: a diptych, black and white portrait beside a colour editorial photograph", label: "02 · díptico" },
      { src: snWork03, alt: "Santi Nuca work 03: detail, macro colour photograph of lips and pearls", label: "03 · detalle" },
      { src: snTriptych, alt: "Santi Nuca editorial triptych: FORMA, LÍNEA, TEXTURA — three columns, three black and white photographs", label: "estudio de corte" },
      { src: snWork04, alt: "Santi Nuca work 04: numeral in orange beside a black and white portrait", label: "04" },
      { src: snWork05, alt: "Santi Nuca work 05: numeral in orange beside a dark black and white portrait", label: "05" },
      { src: snWork06, alt: "Santi Nuca work 06: numeral in orange beside a full-length black and white portrait", label: "06" },
    ],
    world: "editorial",
    faceColor: "#f4f3f0",
    pending: ["typeface name"],
    live: { url: "https://hair-portfolio-two.vercel.app", host: "santi nuca · live", embeddable: true, responsive: true, checked: "2026-10-01" },
  },
  {
    id: "chef-arturo",
    index: 4,
    name: "Chef Arturo",
    displayName: "Chef\nArturo",
    role: "[to confirm]",
    category: "Premium commerce · art direction × transaction",
    claim: "Editorial commerce designed to turn a food brand into a complete buying experience.",
    what: "CHEF Arturo by Julia Montserrat: pastelería, merienda y lunch para fiestas. An editorial hero with a small arched image that grows to full bleed, purchase modes (compra del día, encargo con fecha, lunch para eventos), a catalogue and a transactional product page with stock del día, Mercado Pago and a WhatsApp route.",
    stack: ["Mercado Pago", "WhatsApp"],
    layers: [
      { key: "interface", label: "01 · interface", parts: ["hero", "catálogo", "PDP"] },
      { key: "components", label: "02 · components", parts: ["modos de compra", "arco", "selector"] },
      { key: "api", label: "03 · transaction", parts: ["carrito", "Mercado Pago", "WhatsApp"] },
      { key: "data", label: "04 · data", parts: ["catálogo", "stock del día", "retiro y entrega"] },
    ],
    captures: [
      { src: caHero, alt: "Chef Arturo hero: Pastelería, merienda y lunch para fiestas, two calls to action, a small arched cake photograph", label: "hero" },
      { src: caHeroExpansion, alt: "Chef Arturo hero mid expansion: the arched photograph grows while the copy recedes", label: "hero · expansion" },
      { src: caHeroFullbleed, alt: "Chef Arturo hero at full bleed: a layered cake on a stone stand fills the viewport", label: "hero · full bleed" },
      { src: caDetalleIntro, alt: "Chef Arturo section: El detalle también forma parte del pedido, with a small kitchen photograph", label: "detalle" },
      { src: caDetalleFullbleed, alt: "Chef Arturo section at full bleed: a tiered stand of small cakes in a kitchen with copy overlaid", label: "detalle · full bleed" },
      { src: caFechas, alt: "Chef Arturo, Fechas que importan: Compra del día, Encargo con fecha, Lunch para eventos", label: "fechas que importan" },
      { src: caOcasion, alt: "Chef Arturo, Elegí tu ocasión: Pastelería, Merienda, Salados, Lunch para eventos", label: "elegí tu ocasión" },
      { src: caCatalogo, alt: "Chef Arturo catalogue, Merienda: four Cookie Levain products with prices and Agregar", label: "catálogo" },
      { src: caPdp, alt: "Chef Arturo product page: Cookie Levain de pistacho y chocolate blanco, price, quantity, stock del día, Mercado Pago, Agregar al carrito, Consultar por WhatsApp", label: "pdp · cookie levain" },
    ],
    world: "commerce",
    faceColor: "#f3eee4",
    pending: ["cart capture", "stack"],
    live: { url: "https://chef-arturoprod.vercel.app", host: "chef arturo · live", embeddable: true, responsive: true, checked: "2026-10-01" },
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

/** where the assembled CLÁSICA sits in the menu capture (prospector-menu-tracklist.png), % of the capture */
export const rayoAssembled = { cx: 49.4, cy: 53.2, w: 14.6, h: 24.4 } as const;

/** the captures are all ~2550 × 1320 */
export const CAPTURE_RATIO = 2550 / 1320;
