import type { StaticImageData } from "next/image";
import { projectById } from "./projects";

/* ---------- Capabilities · part bins ---------- */

export interface Part {
  label: string;
  /** Project sheet the part shipped in. */
  from: keyof typeof projectById;
  /** A crop of a real capture. null = documented but not captured yet → dashed slot. */
  capture: { src: StaticImageData; alt: string; position: string } | null;
}

export interface Tray {
  id: "digital-products" | "commerce" | "ai-automation" | "interactive-web";
  title: string;
  sub: string;
  parts: Part[];
}

const p = projectById;

/** the four bins; every part is a crop of a real screen or an explicit empty slot */
export const trays: Tray[] = [
  {
    id: "digital-products",
    title: "Productos digitales",
    sub: "SaaS · paneles · sistemas de gestión",
    parts: [
      { label: "inbox · de la IA a una persona", from: "travelsuite360", capture: { src: p.travelsuite360.captures[0].src, alt: "Inbox de TravelChat en TravelSuite360", position: "62% 35%" } },
      { label: "CRM · embudo comercial", from: "travelsuite360", capture: { src: p.travelsuite360.captures[1].src, alt: "Embudo comercial del CRM de TravelSuite360", position: "50% 22%" } },
      { label: "asistente IA de cotizaciones", from: "travelsuite360", capture: { src: p.travelsuite360.captures[2].src, alt: "Asistente IA de cotizaciones de TravelSuite360", position: "55% 55%" } },
      { label: "reportes financieros · UYU / USD", from: "travelsuite360", capture: { src: p.travelsuite360.captures[3].src, alt: "Reportes financieros de TravelSuite360", position: "50% 45%" } },
    ],
  },
  {
    id: "commerce",
    title: "Comercio",
    sub: "pedidos · catálogo · checkout",
    parts: [
      { label: "ficha · stock · Mercado Pago", from: "chef-arturo", capture: { src: p["chef-arturo"].captures[8].src, alt: "Ficha de producto de Chef Arturo", position: "center 70%" } },
      { label: "3 modos de compra", from: "chef-arturo", capture: { src: p["chef-arturo"].captures[5].src, alt: "Chef Arturo, Fechas que importan", position: "center 45%" } },
      { label: "menú tracklist", from: "prospector", capture: { src: p.prospector.captures[3].src, alt: "Menú tracklist de RAYO SMASH", position: "center 60%" } },
      { label: "producto · agregar al carrito", from: "prospector", capture: { src: p.prospector.captures[4].src, alt: "Ficha de producto de RAYO SMASH", position: "center 30%" } },
    ],
  },
  {
    id: "ai-automation",
    title: "IA y automatización",
    sub: "pipelines · demos generadas · automatizaciones",
    parts: [
      { label: "scraping y scoring de leads · Apify", from: "prospector", capture: null },
      { label: "una demo por lead", from: "prospector", capture: { src: p.prospector.captures[1].src, alt: "Una demo generada: RAYO SMASH", position: "center center" } },
      { label: "automatizaciones", from: "travelsuite360", capture: null },
      { label: "IA en el proceso de construcción", from: "prospector", capture: null },
    ],
  },
  {
    id: "interactive-web",
    title: "Web interactiva",
    sub: "motion · 3D · relato con scroll",
    parts: [
      { label: "hero por capas", from: "prospector", capture: { src: p.prospector.captures[0].src, alt: "Hero por capas de RAYO SMASH", position: "center center" } },
      { label: "expansión de imagen", from: "chef-arturo", capture: { src: p["chef-arturo"].captures[2].src, alt: "Chef Arturo, la fotografía a pantalla completa", position: "center 60%" } },
      { label: "páginas editoriales", from: "santi-nuca", capture: { src: p["santi-nuca"].captures[4].src, alt: "Tríptico editorial de Santi Nuca", position: "center 40%" } },
      { label: "este sitio · ENSAMBLE", from: "prospector", capture: null },
    ],
  },
];

/* ---------- Process · six stations ---------- */

export interface Station {
  key: string;
  label: string;
  note: string;
  /** Visual state of the one object at that station. */
  state: "dashed" | "outline" | "face" | "layers" | "filled" | "frontal";
}

export const stations: Station[] = [
  { key: "understand", label: "Entender", note: "El brief, las preguntas y el número que tiene que moverse.", state: "dashed" },
  { key: "strategize", label: "Definir", note: "Alcance, orden y qué sale primero.", state: "outline" },
  { key: "design", label: "Diseñar", note: "Interfaz, sistema e intención de motion.", state: "face" },
  { key: "prototype", label: "Prototipar", note: "Aparecen las capas: navegables, todavía en trazo.", state: "layers" },
  { key: "engineer", label: "Construir", note: "Datos, API y componentes toman cuerpo.", state: "filled" },
  { key: "launch", label: "Lanzar", note: "Frontal. En producción. Medido.", state: "frontal" },
];

/* ---------- Lab · loose parts ---------- */

export type LabKind = "shader" | "motion" | "object" | "interface" | "ai" | "system";
export type LabState = "running" | "recorded" | "drawing" | "reserved";

export interface Experiment {
  id: string;
  kind: LabKind;
  camera: "frontal" | "iso";
  state: LabState;
  date: string | null;
  note: string | null;
  /** Bench slot: percentage box on desktop. */
  slot: { x: number; y: number; w: number; h: number; round?: boolean };
}

export const experiments: Experiment[] = [
  { id: "this-site", kind: "system", camera: "iso", state: "running", date: "2026", note: "El sistema con el que se construye este portfolio: stack, cotas, cursor-instrumento, verbos de motion.", slot: { x: 62, y: 58, w: 30, h: 34 } },
  { id: "shader-01", kind: "shader", camera: "frontal", state: "reserved", date: null, note: null, slot: { x: 4, y: 6, w: 28, h: 26 } },
  { id: "motion-01", kind: "motion", camera: "frontal", state: "reserved", date: null, note: null, slot: { x: 36, y: 4, w: 30, h: 30 } },
  { id: "object-01", kind: "object", camera: "iso", state: "reserved", date: null, note: null, slot: { x: 72, y: 8, w: 18, h: 26, round: true } },
  { id: "interface-01", kind: "interface", camera: "iso", state: "reserved", date: null, note: null, slot: { x: 8, y: 42, w: 36, h: 30 } },
  { id: "ai-01", kind: "ai", camera: "frontal", state: "reserved", date: null, note: null, slot: { x: 48, y: 42, w: 40, h: 14 } },
  { id: "system-02", kind: "system", camera: "iso", state: "reserved", date: null, note: null, slot: { x: 4, y: 76, w: 24, h: 20 } },
  { id: "motion-02", kind: "motion", camera: "frontal", state: "reserved", date: null, note: null, slot: { x: 32, y: 62, w: 26, h: 30 } },
];

export const labStateLabel: Record<LabState, string> = {
  running: "en curso",
  recorded: "grabado",
  drawing: "en trazo",
  reserved: "reservado",
};

export const labKindLabel: Record<LabKind, string> = {
  shader: "shader · WebGL",
  motion: "estudio de motion",
  object: "objeto 3D",
  interface: "concepto de interfaz",
  ai: "experiencia con IA",
  system: "técnico · sistema",
};

/* ---------- Technology · engraved on the plate ---------- */

export interface Tech {
  name: string;
  /** base: in the Documento Maestro base stack · planned: for this site, not yet in a shipped build */
  tier: "base" | "planned";
  /** Documented project links only. */
  usedIn: Array<keyof typeof projectById>;
}

export const technologies: Tech[] = [
  { name: "Next.js", tier: "base", usedIn: ["prospector"] },
  { name: "React", tier: "base", usedIn: [] },
  { name: "TypeScript", tier: "base", usedIn: [] },
  { name: "Tailwind", tier: "base", usedIn: ["prospector"] },
  { name: "Framer Motion", tier: "base", usedIn: ["prospector"] },
  { name: "GSAP", tier: "planned", usedIn: [] },
  { name: "Three.js · R3F", tier: "planned", usedIn: [] },
  { name: "WebGL · shaders", tier: "planned", usedIn: [] },
  { name: "Supabase", tier: "base", usedIn: [] },
  { name: "PostgreSQL", tier: "base", usedIn: [] },
  { name: "Vercel", tier: "base", usedIn: [] },
  { name: "Apify", tier: "base", usedIn: ["prospector"] },
  { name: "Mercado Pago", tier: "base", usedIn: ["chef-arturo"] },
  { name: "WhatsApp", tier: "base", usedIn: ["chef-arturo"] },
  { name: "Herramientas IA", tier: "base", usedIn: [] },
];
