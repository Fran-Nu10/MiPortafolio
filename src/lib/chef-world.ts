import type { Tier } from "./tiers";
import { fit, insetOf, type Box } from "./santi-world";

export { fit, insetOf, type Box };

/**
 * Chef Arturo world (Spec §11), pure: labels, the compositions per variant and the one
 * continuity rule — the food and the product photo are the same image element from C02 to
 * C06; it only ever moves with a uniform scale and a clip (the Santi `fit`).
 *
 * Compositions are written in the design space (1440×900; 390×844 on phones).
 */

/** units: SCREEN 0 · ISOLATE 1 · C02 2 (= s:WORLD) · C03 3 · C04 4 · C05 5 · C06 5.6 · C07 6.2 · end 6.4 */
export const C_T = { C02: 2, C03: 3, C04: 4, C05: 5, C06: 5.6, C07: 6.2, END: 6.4 } as const;
export const CHEF_UNITS = 6.4;
/** reduced motion: five stills after the card cut */
export const C_T_RM = { C02: 0.5, C03: 1.5, C04: 2.5, C06: 3.5, C07: 4.5, END: 5 } as const;
export const CHEF_UNITS_RM = 5;
/** C04 siblings reveal 80 ms apart; C06 controls mask in 60 ms apart */
export const C04_STAGGER = 0.08;
export const C06_STAGGER = 0.06;
/** C07: the commerce UI dims to .4 under the closing line */
export const C07_DIM = 0.4;

export type ChefVariant = "desktop" | "sm";
export const chefVariant = (tier: Tier): ChefVariant => (tier === "sm" ? "sm" : "desktop");

/** the page's field (the store's cream) */
export function field(v: ChefVariant): Box {
  return v === "sm" ? { x: 16, y: 104, w: 358, h: 700 } : { x: 120, y: 90, w: 1200, h: 740 };
}

/**
 * C02 · macro: the product covers the whole stage (full-bleed), centered on the space. `cover`
 * is the stage in design units (the space itself by default; the scene passes the real stage,
 * which is wider than the space on lg and taller on md).
 */
export function macro(v: ChefVariant, aspect: number, cover?: { w: number; h: number }): Box {
  const sp = v === "sm" ? { w: 390, h: 844 } : { w: 1440, h: 900 };
  const c = cover ?? sp;
  const scale = Math.max(c.w / aspect, c.h);
  const w = aspect * scale;
  const h = scale;
  return { x: (sp.w - w) / 2, y: (sp.h - h) / 2, w, h };
}

export interface Catalog {
  heading: Box;
  /** the four cards' photo slots, left → right; `productSlot` is the escaping product's */
  slots: Box[];
  productSlot: number;
  /** the card chrome under each photo: label + price rows */
  chrome: number;
}

/** C04 · the catalog row (sm: a 2×2 grid); the product takes the second card, as in the store */
export function catalog(v: ChefVariant, aspect: number): Catalog {
  const f = field(v);
  if (v === "sm") {
    const gap = 12;
    const w = (f.w - gap) / 2;
    const h = w / aspect;
    const chrome = 44;
    const top = f.y + 56;
    const slots = [0, 1, 2, 3].map((i) => ({ x: f.x + (i % 2) * (w + gap), y: top + Math.floor(i / 2) * (h + chrome + gap), w, h }));
    return { heading: { x: f.x, y: f.y, w: f.w, h: 44 }, slots, productSlot: 1, chrome };
  }
  const gap = 16;
  const w = (f.w - 3 * gap) / 4;
  const h = w / aspect;
  const chrome = 52;
  const top = f.y + 96;
  const slots = [0, 1, 2, 3].map((i) => ({ x: f.x + i * (w + gap), y: top, w, h }));
  return { heading: { x: f.x, y: f.y + 8, w: f.w, h: 56 }, slots, productSlot: 1, chrome };
}

export interface ProductView {
  photo: Box;
  /** the information column (name, price, tag) and the purchase controls */
  info: Box;
  purchase: Box;
  close: Box;
}

/** C05–C07 · the product view: photo and information (sm: photo on top, information below) */
export function product(v: ChefVariant, aspect: number): ProductView {
  const f = field(v);
  if (v === "sm") {
    const h = Math.min(f.w / aspect, 300);
    const w = h * aspect;
    return {
      photo: { x: f.x + (f.w - w) / 2, y: f.y, w, h },
      info: { x: f.x, y: f.y + h + 16, w: f.w, h: 110 },
      purchase: { x: f.x, y: f.y + h + 140, w: f.w, h: 150 },
      close: { x: f.x, y: f.y + f.h - 70, w: f.w, h: 60 },
    };
  }
  const h = 600;
  const w = h * aspect;
  const left = f.x + 40;
  const colX = left + w + 72;
  return {
    photo: { x: left, y: f.y + 24, w, h },
    info: { x: colX, y: f.y + 96, w: f.x + f.w - colX, h: 220 },
    purchase: { x: colX, y: f.y + 336, w: f.x + f.w - colX, h: 220 },
    close: { x: f.x, y: f.y + f.h - 66, w: f.w, h: 60 },
  };
}

/** "Cookie levain … · $ 120 · compra directa" → name, price, tag */
export function splitProductLine(text: string): { name: string; price: string; tag: string } {
  const parts = text.split(" · ");
  return { name: parts[0] ?? text, price: parts[1] ?? "", tag: parts.slice(2).join(" · ") };
}
/** "− 1 + · Agregar al carrito · Mercado Pago · consultar por WhatsApp" → stepper, add, payment, whatsapp */
export function splitPurchaseLine(text: string): { stepper: string[]; add: string; pay: string; chat: string } {
  const parts = text.split(" · ");
  return { stepper: (parts[0] ?? "").split(" "), add: parts[1] ?? "", pay: parts[2] ?? "", chat: parts[3] ?? "" };
}
/** "Merienda · cookies, brownies y boxes dulces" → title, line */
export function splitCatalogLine(text: string): { title: string; line: string } {
  const i = text.indexOf(" · ");
  return i < 0 ? { title: text, line: "" } : { title: text.slice(0, i), line: text.slice(i + 3) };
}
