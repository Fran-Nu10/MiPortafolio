import type { AssetContract } from "./types";

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
    status: "placeholder",
    aspect: { desktop: [1, 1] },
    alt: "",
    meta: { source: "Tile de ruido 256×256 generado (Phase 2)." },
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
    meta: { source: "Captura real del hero de la demo. anchorRect de la burger: Phase 4 (bandas de capas en docs/06)." },
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
    meta: { source: "Captura real de la apertura del sitio." },
  },
  {
    key: "chef.reel.poster",
    kind: "still",
    status: "derived",
    aspect: { desktop: [1094, 640], mobile: REEL_MOBILE },
    files: {
      desktop: { src: "/projects/chef-arturo/chef-arturo-hero.png", width: 2553, height: 1324 },
      mobile: { src: "/projects/chef-arturo/chef-arturo-hero.png", width: 2553, height: 1324, focus: "50% 50%" },
    },
    alt: "Portada de la tienda de Chef Arturo",
    meta: { source: "Captura real del hero de la tienda." },
  },

  // ── reel loops (posters only until they exist — allowed in production) ──────
  { key: "ts.reel.loop", kind: "loop", status: "placeholder", aspect: { desktop: [1094, 616], mobile: REEL_MOBILE }, poster: "ts.reel.poster", alt: "", optional: true, meta: { duration: 4 } },
  { key: "rayo.reel.loop", kind: "loop", status: "placeholder", aspect: { desktop: [1094, 580], mobile: REEL_MOBILE }, poster: "rayo.reel.poster", alt: "", optional: true, meta: { duration: 4 } },
  { key: "santi.reel.loop", kind: "loop", status: "placeholder", aspect: { desktop: [1094, 700], mobile: REEL_MOBILE }, poster: "santi.reel.poster", alt: "", optional: true, meta: { duration: 4 } },
  { key: "chef.reel.loop", kind: "loop", status: "placeholder", aspect: { desktop: [1094, 640], mobile: REEL_MOBILE }, poster: "chef.reel.poster", alt: "", optional: true, meta: { duration: 4 } },

  // ── world objects ───────────────────────────────────────────────────────────
  {
    key: "rayo.burger",
    kind: "cutout",
    status: "placeholder",
    aspect: { desktop: [1600, 831] },
    alt: "Hamburguesa Clásica",
    meta: { source: "Cutout a derivar de prospector-hero-exploded.png (Phase 6)." },
  },
  ...(["topBun", "bacon", "onion", "patty", "bottomBun"] as const).map((layer) => ({
    key: `rayo.layers.${layer}`,
    kind: "cutout" as const,
    status: "placeholder" as const,
    aspect: { desktop: [1600, 831] as [number, number] },
    alt: "",
    meta: { source: "Bandas identificadas en la captura (docs/06). Cutouts a producir (Phase 6)." },
  })),
  {
    key: "rayo.through",
    kind: "clip",
    status: "placeholder",
    aspect: { desktop: [16, 9], mobile: [9, 16] },
    alt: "",
    optional: true,
    meta: { duration: 3, source: "Render a producir. Sin él, R05 se omite (R04 → R06)." },
  },
  ...[1, 2, 3, 4, 5, 6].map((n) => ({
    key: `santi.photo.${n}`,
    kind: "cutout" as const,
    status: "placeholder" as const,
    aspect: { desktop: [4, 5] as [number, number] },
    alt: `Trabajo ${String(n).padStart(2, "0")} — fotografía de Santi Nuca`,
    surface: "paper" as const,
    meta: { source: "Originales a pedir a Santi Nuca, con permiso (Spec §29 Q3)." },
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
