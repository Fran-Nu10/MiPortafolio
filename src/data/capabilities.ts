import type { Capability } from "./types";

/**
 * Six capabilities (Content Master 00-D and 11; Spec §12). Five core, one extended.
 * 06 has no live element and no metrics until a real, authorized campaign exists.
 */
export const CAPABILITIES: Capability[] = [
  {
    index: 1,
    name: "Producto",
    statement: "Definir qué se construye, para quién y en qué orden.",
    group: "core",
    attribution: { label: "TravelSuite360 · 01", href: "/trabajo/travelsuite360" },
    evidence: { variant: "element", element: "ts-flow" },
  },
  {
    index: 2,
    name: "Ingeniería web",
    statement: "Front, back y datos en producción, no en demo.",
    group: "core",
    attribution: { label: "Santi Nuca · Rayo Smash · Chef Arturo" },
    evidence: { variant: "element", element: "posters" },
  },
  {
    index: 3,
    name: "Comercio digital",
    statement: "Del catálogo al cobro sin fricción.",
    group: "core",
    attribution: { label: "Chef Arturo · 04", href: "/trabajo/chef-arturo" },
    evidence: { variant: "element", element: "chef-commerce" },
  },
  {
    index: 4,
    name: "IA + automatización",
    statement: "Extraer datos de mensajes reales y convertirlos en trabajo hecho.",
    group: "core",
    attribution: { label: "TravelSuite360 · Prospector" },
    evidence: { variant: "element", element: "ts-extraction" },
  },
  {
    index: 5,
    name: "Experiencias interactivas",
    statement: "Movimiento con propósito: cuando el scroll cuenta algo.",
    group: "core",
    attribution: { label: "Rayo Smash · 02", href: "/trabajo/rayo-smash" },
    evidence: { variant: "element", element: "rayo-layers" },
  },
  {
    index: 6,
    name: "Adquisición de clientes",
    statement: "Publicidad en Meta Ads, orientada a ventas.",
    group: "extended",
    attribution: { label: "Meta Ads" },
    evidence: { variant: "typographic", tag: "Meta Ads" },
  },
];
