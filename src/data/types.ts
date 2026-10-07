/**
 * Content model (Spec §21) and asset contracts (Spec §22).
 *
 * `data/*` holds content only: copy, facts, links and asset keys. Animation logic never
 * lives here, and copy never lives anywhere else. This file is types only, so scripts can
 * import the data files with Node's type stripping.
 */

export type ProjectSlug = "travelsuite360" | "rayo-smash" | "santi-nuca" | "chef-arturo";
export type WorldType = "ts-depth" | "rayo-layers" | "santi-editorial" | "chef-commerce";

/** "pending" = [CONFIRMAR] in the Content Master: never rendered, never in the HTML. */
export type ClaimStatus = "confirmed" | "pending";
export type Gated<T> =
  | { status: "confirmed"; value: T; note?: string }
  | { status: "pending"; value?: T; note?: string };

/** normalized 0–1 rectangle in an asset's own pixel space */
export interface Rect01 {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type AssetKey = string;

export interface Project {
  /** also the URL slug (`/trabajo/{id}`) and the section id */
  id: ProjectSlug;
  /** display "01"…"04"; order of the journey */
  index: 1 | 2 | 3 | 4;
  name: string;
  category: string;
  role: string;
  /** the reel's one line: category · role (Content Master 05 gives it per project) */
  reelLine: string;
  oneLine: string;
  microCase: string;
  /** Rayo only: it is a demo, not a client */
  relationLine?: string;
  /** Santi: { "Fotografía", "Santi Nuca" } */
  credit?: { label: string; holder: string };
  /** confirmed sentence(s) under the proof window */
  proofLine: string;
  /** a second proof sentence that ships only once confirmed */
  proofLineExtra?: Gated<string>;
  year: Gated<string>;
  liveUrl: Gated<string>;
  stack: Gated<string[]>;
  /** Chef only: "Tienda real, con pagos en producción." needs Mercado Pago live confirmed */
  paymentsLive?: Gated<boolean>;
  worldType: WorldType;
  /** world copy keyed by state + part, e.g. "TS01.message" — in order of appearance */
  worldCopy: Record<string, string>;
  theme: { env: "black" | "red" | "paper" | "image"; tone: "paper-on-black" | "ink-on-paper" };
  reel: { aspect: { desktop: [number, number]; mobile: [number, number] }; poster: AssetKey; loop: AssetKey };
  /** the SCREEN state: same poster as the reel + the escaping object (its anchorRect lives in the poster contract) */
  screen: { poster: AssetKey; object: AssetKey | null };
  proof: { media: AssetKey; chapters?: { label: string; at: number }[] };
  a11y: {
    reelLabel: string;
    proofVideoLabel: string;
    openLabel: string;
    /** sr-only summary of the visual-only world states (rendered once the world animates, Phase 5–8) */
    worldSummary: string[];
  };
  next: ProjectSlug | "capacidades";
  meta: { title: string; description: string; ogImage: AssetKey };
}

/** Spec §12 · EvidenceSlot. `typographic` is the production state of capability 06. */
export type EvidenceSlotVariant =
  | { variant: "typographic"; tag: string }
  | { variant: "verified-material"; media: AssetKey[]; source: string; caption?: string }
  | {
      variant: "campaign";
      media: AssetKey[];
      source: string;
      metrics: { label: string; value: string; authorized: boolean; source: string }[];
    };

/** live evidence elements reused from the worlds (built in Phase 9) */
export type EvidenceElement = { variant: "element"; element: "ts-flow" | "posters" | "chef-commerce" | "ts-extraction" | "rayo-layers" };

export interface Capability {
  index: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  statement: string;
  /** 06 = extended (sub-kicker "Después de publicar") */
  group: "core" | "extended";
  attribution: { label: string; href?: string };
  evidence: EvidenceElement | EvidenceSlotVariant;
}

// ── asset contracts ────────────────────────────────────────────────────────────

export type AssetKind = "still" | "cutout" | "loop" | "proof" | "clip" | "og";
/** final = delivered and approved · derived = produced from real material (captures) · placeholder = missing */
export type AssetStatus = "final" | "placeholder" | "derived";
export type AssetTier = "desktop" | "mobile";

export interface ImageFile {
  /** path under /public */
  src: string;
  width: number;
  height: number;
  /** object-position used when the tier's frame crops the file, e.g. "50% 40%" */
  focus?: string;
}

export interface CutoutFiles {
  avif: { "1x": string; "2x": string };
  webp: { "1x": string; "2x": string };
  width: number;
  height: number;
}

export interface VideoFiles {
  /** AV1 first, H.264 second (Spec §17) */
  sources: { src: string; type: string }[];
  width: number;
  height: number;
  /** seconds */
  duration: number;
}

export type TierFiles = ImageFile | CutoutFiles | VideoFiles;

export interface AssetContract {
  key: AssetKey;
  kind: AssetKind;
  status: AssetStatus;
  /** reserved aspect per tier, as [w, h] — the box exists before any byte loads */
  aspect: { desktop: [number, number]; mobile?: [number, number] };
  /** final/derived files per tier (absent while placeholder) */
  files?: { desktop?: TierFiles; mobile?: TierFiles };
  /** for loop/proof/clip: the still under the video (an asset key) */
  poster?: AssetKey;
  /** inline base64, < 1 KB (hero only) */
  lqip?: string;
  alt: string;
  /** dark field (#141414) or paper field (#D6D0C4) for the placeholder */
  surface?: "black" | "paper";
  meta?: {
    anchorRect?: { desktop?: Rect01; mobile?: Rect01 };
    macroFocus?: Rect01;
    monitorFocus?: { desktop?: Rect01; mobile?: Rect01 };
    offset?: Rect01;
    chapters?: { label: string; at: number }[];
    /** placeholder duration in seconds, so autos and holds behave like the final media */
    duration?: number;
    /** where the material comes from / what is still needed */
    source?: string;
    /** candidate files that exist in the repo but are not approved for use */
    candidates?: string[];
  };
  /** TravelSuite360 media: true only after the §23 checklist is signed by two people */
  privacyChecked?: boolean;
  /** production build is refused while this resolves to a placeholder (Spec §22) */
  blocksLaunch?: boolean;
  /** the slot is optional: a missing file skips a state instead of showing a placeholder */
  optional?: boolean;
}
