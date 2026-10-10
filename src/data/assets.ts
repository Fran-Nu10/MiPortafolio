import type { AssetContract } from "./types";
import { RAYO_ANCHOR, RAYO_LAYERS, RAYO_STACK } from "./rayo-layers.ts";
import { SANTI_ANCHOR, SANTI_PHOTOS } from "./santi-photos.ts";

/**
 * Asset contract registry (Spec §22). Components never know a path: they receive a
 * contract resolved by `lib/assets.ts`. Replacing a placeholder = adding files here and
 * flipping `status` — no component or timeline changes.
 *
 * `derived` entries point at the real captures in `public/projects/**` (Phase 12 moves
 * optimized outputs to `public/media/**`). Nothing here is invented: a slot without real
 * material is a `placeholder` and renders as one.
 *
 * Kept free of runtime imports so `scripts/check-assets.mjs` can load it with Node's
 * type stripping.
 */

const REEL_MOBILE: [number, number] = [358, 420];

/** the reel's proof/recording placeholders: real poster underneath, no play button */
const PROOF_PLACEHOLDER: Pick<AssetContract, "kind" | "status" | "aspect" | "blocksLaunch"> = {
  kind: "proof",
  status: "placeholder",
  aspect: { desktop: [16, 9], mobile: [16, 9] },
  blocksLaunch: true,
};

export const ASSETS: AssetContract[] = [
  // ── Franco ──────────────────────────────────────────────────────────────────
  {
    key: "franco.hero",
    kind: "cutout",
    status: "placeholder",
    // provisional aspects until the portrait exists (Revelado 2.2 §15: 3/4 portrait; mobile crop 4:5)
    aspect: { desktop: [3, 4], mobile: [4, 5] },
    alt: "",
    blocksLaunch: true,
    meta: { source: "No existe retrato. Cutout con alpha ≥ 2400 px de alto + recorte mobile 4:5 (Spec §29 Q1)." },
  },
  {
    key: "franco.bust",
    kind: "cutout",
    status: "placeholder",
    aspect: { desktop: [4, 5], mobile: [4, 5] },
    alt: "",
    meta: { source: "Busto iluminado a producir (≥ 1600 px de alto)." },
  },
  {
    key: "franco.atWork",
    kind: "proof",
    status: "placeholder",
    aspect: { desktop: [16, 9], mobile: [9, 16] },
    alt: "",
    optional: true,
    meta: {
      duration: 12,
      // centered until the real video defines where the monitor is
      monitorFocus: { desktop: { x: 0.34, y: 0.3, w: 0.32, h: 0.34 }, mobile: { x: 0.2, y: 0.36, w: 0.6, h: 0.24 } },
      source: "Video propio 16:9 y 9:16 (no recorte), 8–15 s. Sección apagada por flag hasta tenerlo.",
    },
  },
  {
    key: "moments.human",
    kind: "still",
    status: "placeholder",
    aspect: { desktop: [3, 2], mobile: [4, 5] },
    alt: "",
    optional: true,
    meta: { source: "Plano de Franco (mano, perfil, espalda). Sección apagada por flag hasta tenerlo." },
  },
  {
    key: "site.grain",
    kind: "still",
    status: "derived",
    aspect: { desktop: [1, 1] },
    files: { desktop: { src: "/media/site/grain.png", width: 256, height: 256 } },
    alt: "",
    meta: { source: "Generado: node scripts/media.mjs grain (ruido 1-bit, mulberry32 semilla 360, ≤ 8 KB)." },
  },

  // ── reel posters (= SCREEN posters) ─────────────────────────────────────────
  {
    key: "ts.reel.poster",
    kind: "still",
    status: "placeholder",
    aspect: { desktop: [1094, 616], mobile: REEL_MOBILE },
    alt: "Pantalla de TravelSuite360",
    blocksLaunch: true,
    privacyChecked: false,
    meta: {
      source: "Captura real con datos demo (Spec §23). anchorRect del mensaje: se fija con la captura.",
      // where the message will sit in the capture: provisional, the placeholder has no message
      anchorRect: { desktop: { x: 0.08, y: 0.42, w: 0.5, h: 0.12 }, mobile: { x: 0.07, y: 0.4, w: 0.86, h: 0.14 } },
      // ENSAMBLE captures of production data with personal data blurred. Not approved:
      // Spec §23 requires controlled demo data and a two-person sign-off.
      candidates: [
        "public/projects/travelsuite360/travelsuite360-travelchat.png",
        "public/projects/travelsuite360/travelsuite360-crm.png",
        "public/projects/travelsuite360/travelsuite360-ai-assistant.png",
        "public/projects/travelsuite360/travelsuite360-reportes-financieros.png",
      ],
    },
  },
  {
    key: "rayo.reel.poster",
    kind: "still",
    status: "derived",
    aspect: { desktop: [1094, 580], mobile: REEL_MOBILE },
    files: {
      desktop: { src: "/projects/prospector/prospector-hero-exploded.png", width: 2543, height: 1321 },
      mobile: { src: "/projects/prospector/prospector-hero-exploded.png", width: 2543, height: 1321, focus: "50% 50%" },
    },
    alt: "Hamburguesa Clásica, vista por capas",
    meta: {
      source: "Captura real del hero de la demo.",
      // the layered burger (the stack of six cutouts), measured in the capture (scripts/derive-rayo-layers.mjs)
      anchorRect: RAYO_ANCHOR,
    },
  },
  {
    key: "santi.reel.poster",
    kind: "still",
    status: "derived",
    aspect: { desktop: [1094, 700], mobile: REEL_MOBILE },
    files: {
      desktop: { src: "/projects/santi-nuca/santi-nuca-opening.png", width: 2547, height: 1324 },
      mobile: { src: "/projects/santi-nuca/santi-nuca-opening.png", width: 2547, height: 1324, focus: "50% 50%" },
    },
    alt: "Apertura del portfolio de Santi Nuca — fotografía de Santi Nuca",
    meta: {
      source: "Captura real de la apertura del sitio.",
      // the opening photograph's panel, measured in the capture (scripts/derive-santi-photos.mjs)
      anchorRect: SANTI_ANCHOR,
    },
  },
  {
    key: "chef.reel.poster",
    kind: "still",
    status: "derived",
    aspect: { desktop: [1094, 640], mobile: REEL_MOBILE },
    files: {
      desktop: { src: "/projects/chef-arturo/chef-arturo-hero.png", width: 2553, height: 1324 },
      // the portrait crop keeps the product (right side of the hero) in frame
      mobile: { src: "/projects/chef-arturo/chef-arturo-hero.png", width: 2553, height: 1324, focus: "100% 50%" },
    },
    alt: "Portada de la tienda de Chef Arturo",
    meta: {
      source: "Captura real del hero de la tienda.",
      // the product in its arch, normalized to the reel frame (provisional until the original, Phase 8)
      anchorRect: { desktop: { x: 0.835, y: 0.365, w: 0.153, h: 0.33 }, mobile: { x: 0.53, y: 0.36, w: 0.31, h: 0.33 } },
    },
  },

  // ── reel loops (posters only until they exist — allowed in production) ──────
  { key: "ts.reel.loop", kind: "loop", status: "placeholder", aspect: { desktop: [1094, 616], mobile: REEL_MOBILE }, poster: "ts.reel.poster", alt: "", optional: true, meta: { duration: 4 } },
  { key: "rayo.reel.loop", kind: "loop", status: "placeholder", aspect: { desktop: [1094, 580], mobile: REEL_MOBILE }, poster: "rayo.reel.poster", alt: "", optional: true, meta: { duration: 4 } },
  { key: "santi.reel.loop", kind: "loop", status: "placeholder", aspect: { desktop: [1094, 700], mobile: REEL_MOBILE }, poster: "santi.reel.poster", alt: "", optional: true, meta: { duration: 4 } },
  { key: "chef.reel.loop", kind: "loop", status: "placeholder", aspect: { desktop: [1094, 640], mobile: REEL_MOBILE }, poster: "chef.reel.poster", alt: "", optional: true, meta: { duration: 4 } },

  // ── world objects ───────────────────────────────────────────────────────────
  // the Clásica as the demo's hero shows it (six layers, a double smash), keyed out of the
  // real captures by scripts/derive-rayo-layers.mjs; the demo's original PNGs replace them
  {
    key: "rayo.burger",
    kind: "cutout",
    status: "derived",
    aspect: { desktop: RAYO_STACK.aspect },
    files: { desktop: RAYO_STACK.files },
    alt: "Hamburguesa Clásica, vista por capas",
    meta: { source: "Derivado de prospector-hero-exploded.png (+ …-scroll.png para el medallón superior). Cutout final desde los PNG originales de la demo." },
  },
  ...RAYO_LAYERS.map((layer) => ({
    key: layer.key,
    kind: "cutout" as const,
    status: "derived" as const,
    aspect: { desktop: [layer.files.width, layer.files.height] as [number, number] },
    files: { desktop: layer.files },
    alt: "",
    meta: {
      offset: layer.offset,
      source:
        layer.name === "bottomBun"
          ? "Derivado de la captura; el pliegue del hero lo recorta (últimas filas fundidas). Cutout final desde el PNG original."
          : layer.name === "patty"
            ? "Derivado de prospector-hero-exploded-scroll.png (en el hero lo cruza el título de la demo). Cutout final desde el PNG original."
            : "Derivado de prospector-hero-exploded.png. Cutout final desde el PNG original.",
    },
  })),
  // R05 · the camera move between the layers: a test render from the derived cutouts at the
  // exact R04 composition (scripts/gen-rayo-through.mjs). Desktop only: on phones (no 9:16
  // clip) and tablets (3D off) R05 is skipped. The final render comes from the original PNGs.
  {
    key: "rayo.through.poster",
    kind: "still",
    status: "derived",
    aspect: { desktop: [1920, 1200] },
    files: { desktop: { src: "/media/rayo/through-desktop-poster.webp", width: 1920, height: 1200 } },
    alt: "",
    meta: { source: "Primer frame del render de prueba (= composición R04)." },
  },
  {
    key: "rayo.through",
    kind: "clip",
    status: "derived",
    aspect: { desktop: [1920, 1200], mobile: [9, 16] },
    files: {
      desktop: {
        sources: [
          { src: "/media/rayo/through-desktop.av1.mp4", type: 'video/mp4; codecs="av01.0.08M.08"' },
          { src: "/media/rayo/through-desktop.h264.mp4", type: 'video/mp4; codecs="avc1.640028"' },
        ],
        width: 1920,
        height: 1200,
        duration: 3.2,
      },
    },
    poster: "rayo.through.poster",
    alt: "",
    optional: true,
    meta: { duration: 3.2, source: "Render de prueba desde los cutouts derivados (sin 9:16: en sm se omite R05). Render final a producir desde los PNG originales." },
  },
  // Santi Nuca's photographs as his site shows them, cut from the real page captures at the
  // panels' edges (scripts/derive-santi-photos.mjs): provisional until the originals arrive
  ...SANTI_PHOTOS.map((p) => ({
    key: p.key,
    kind: "cutout" as const,
    status: "derived" as const,
    aspect: { desktop: p.aspect },
    files: { desktop: p.files },
    alt: p.alt,
    surface: "paper" as const,
    meta: { source: `Recorte provisional de la captura del sitio (${p.page}). Original a pedir a Santi Nuca, con permiso (Spec §29 Q3).` },
  })),
  {
    key: "chef.product",
    kind: "cutout",
    status: "placeholder",
    aspect: { desktop: [4, 5] },
    alt: "Cookie levain de pistacho y chocolate blanco",
    meta: { source: "Fotografía original de producto (Spec §29 Q4). Provisorio: chef-arturo-pdp-cookie-levain.png." },
  },
  {
    key: "chef.macro.loop",
    kind: "loop",
    status: "placeholder",
    aspect: { desktop: [16, 9], mobile: [9, 16] },
    poster: "chef.product",
    alt: "",
    optional: true,
    meta: { duration: 5, source: "Loop macro 4–6 s a producir. Sin él: still." },
  },
  ...[1, 2, 3].map((n) => ({
    key: `chef.catalog.${n}`,
    kind: "still" as const,
    status: "placeholder" as const,
    aspect: { desktop: [4, 5] as [number, number] },
    alt: "Producto del catálogo de Chef Arturo",
    meta: { source: "Derivable de chef-arturo-catalogo-merienda.png; originales preferidos." },
  })),

  // ── proof recordings (block launch for that project's proof) ────────────────
  { ...PROOF_PLACEHOLDER, key: "ts.proof", poster: "ts.reel.poster", alt: "", privacyChecked: false, meta: { duration: 8, chapters: [{ label: "TravelChat", at: 0 }, { label: "CRM", at: 3 }, { label: "IA", at: 5.5 }], source: "Grabación de 8 s con datos demo (Spec §08, §23)." } },
  { ...PROOF_PLACEHOLDER, key: "rayo.proof", poster: "rayo.reel.poster", alt: "", meta: { duration: 8, source: "Grabación hero → menú → producto." } },
  { ...PROOF_PLACEHOLDER, key: "santi.proof", poster: "santi.reel.poster", alt: "", meta: { duration: 8, source: "Grabación del scroll real del sitio." } },
  { ...PROOF_PLACEHOLDER, key: "chef.proof", poster: "chef.reel.poster", alt: "", meta: { duration: 8, source: "Grabación catálogo → producto → carrito, sin datos de clientes." } },

  // ── Open Graph (fallback: no og:image) ───────────────────────────────────────
  ...["og.home", "og.ts", "og.rayo", "og.santi", "og.chef"].map((key) => ({
    key,
    kind: "og" as const,
    status: "placeholder" as const,
    aspect: { desktop: [1200, 630] as [number, number] },
    alt: "",
    optional: true,
    meta: { source: "1200×630, FRANCO / NÚÑEZ en papel sobre negro (Content Master 17)." },
  })),
];
