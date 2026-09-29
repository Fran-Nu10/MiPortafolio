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

export const trays: Tray[] = [
  {
    id: "digital-products",
    title: "Digital products",
    sub: "SaaS · dashboards · operating systems",
    parts: [
      { label: "data table", from: "travelsuite360", capture: null },
      { label: "inbox thread", from: "travelsuite360", capture: null },
      { label: "CRM record", from: "travelsuite360", capture: null },
      { label: "quote · reservation", from: "travelsuite360", capture: null },
    ],
  },
  {
    id: "commerce",
    title: "Commerce experiences",
    sub: "ordering · catalogue · checkout",
    parts: [
      { label: "PDP · stock · Mercado Pago", from: "chef-arturo", capture: { src: p["chef-arturo"].captures[8].src, alt: "Chef Arturo product page", position: "center 70%" } },
      { label: "3 purchase modes", from: "chef-arturo", capture: { src: p["chef-arturo"].captures[5].src, alt: "Fechas que importan", position: "center 45%" } },
      { label: "tracklist menu", from: "prospector", capture: { src: p.prospector.captures[3].src, alt: "RAYO SMASH tracklist menu", position: "center 60%" } },
      { label: "product · add to cart", from: "prospector", capture: { src: p.prospector.captures[4].src, alt: "RAYO SMASH product page", position: "center 30%" } },
    ],
  },
  {
    id: "ai-automation",
    title: "AI & automation",
    sub: "pipelines · generated demos · automations",
    parts: [
      { label: "lead scraping + scoring · Apify", from: "prospector", capture: null },
      { label: "one demo per lead", from: "prospector", capture: { src: p.prospector.captures[1].src, alt: "A generated RAYO SMASH demo", position: "center center" } },
      { label: "automations", from: "travelsuite360", capture: null },
      { label: "AI tooling in the build process", from: "prospector", capture: null },
    ],
  },
  {
    id: "interactive-web",
    title: "Interactive web",
    sub: "motion · 3D · scroll storytelling",
    parts: [
      { label: "layered hero", from: "prospector", capture: { src: p.prospector.captures[0].src, alt: "RAYO SMASH layered hero", position: "center center" } },
      { label: "image expansion", from: "chef-arturo", capture: { src: p["chef-arturo"].captures[2].src, alt: "Chef Arturo image at full bleed", position: "center 60%" } },
      { label: "editorial spreads", from: "santi-nuca", capture: { src: p["santi-nuca"].captures[4].src, alt: "Santi Nuca triptych", position: "center 40%" } },
      { label: "this site · Ensamble", from: "prospector", capture: null },
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
  { key: "understand", label: "Understand", note: "Brief, questions, the number that must move.", state: "dashed" },
  { key: "strategize", label: "Strategize", note: "Scope, sequence, what ships first.", state: "outline" },
  { key: "design", label: "Design", note: "Interface, system, motion intent.", state: "face" },
  { key: "prototype", label: "Prototype", note: "Layers appear, clickable, still outlined.", state: "layers" },
  { key: "engineer", label: "Engineer", note: "Data, API, components fill in.", state: "filled" },
  { key: "launch", label: "Launch", note: "Frontal. In production. Watched.", state: "frontal" },
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
  { id: "this-site", kind: "system", camera: "iso", state: "running", date: "2026", note: "The portfolio's own construction system: stack, cotas, cursor instrument, motion verbs.", slot: { x: 62, y: 58, w: 30, h: 34 } },
  { id: "shader-01", kind: "shader", camera: "frontal", state: "reserved", date: null, note: null, slot: { x: 4, y: 6, w: 28, h: 26 } },
  { id: "motion-01", kind: "motion", camera: "frontal", state: "reserved", date: null, note: null, slot: { x: 36, y: 4, w: 30, h: 30 } },
  { id: "object-01", kind: "object", camera: "iso", state: "reserved", date: null, note: null, slot: { x: 72, y: 8, w: 18, h: 26, round: true } },
  { id: "interface-01", kind: "interface", camera: "iso", state: "reserved", date: null, note: null, slot: { x: 8, y: 42, w: 36, h: 30 } },
  { id: "ai-01", kind: "ai", camera: "frontal", state: "reserved", date: null, note: null, slot: { x: 48, y: 42, w: 40, h: 14 } },
  { id: "system-02", kind: "system", camera: "iso", state: "reserved", date: null, note: null, slot: { x: 4, y: 76, w: 24, h: 20 } },
  { id: "motion-02", kind: "motion", camera: "frontal", state: "reserved", date: null, note: null, slot: { x: 32, y: 62, w: 26, h: 30 } },
];

export const labKindLabel: Record<LabKind, string> = {
  shader: "shader · WebGL",
  motion: "motion study",
  object: "3D object",
  interface: "interface concept",
  ai: "AI experience",
  system: "technical · system",
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
  { name: "AI tooling", tier: "base", usedIn: [] },
];
