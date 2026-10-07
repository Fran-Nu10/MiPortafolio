import type { AssetContract, AssetKey, CutoutFiles, ImageFile, VideoFiles } from "@/data/types";

/**
 * A resolved asset contract: what media components receive as props. Types and the
 * aspect helper only — no registry import, so client components stay registry-free.
 */

export interface ResolvedBase {
  key: AssetKey;
  kind: AssetContract["kind"];
  alt: string;
  aspect: { desktop: [number, number]; mobile: [number, number] };
  surface: "black" | "paper";
  meta: NonNullable<AssetContract["meta"]>;
}

export interface ResolvedPlaceholder extends ResolvedBase {
  status: "placeholder";
  /** the real still under a missing video, if that still exists */
  poster: ResolvedReal | null;
}

export interface ResolvedReal extends ResolvedBase {
  status: "final" | "derived";
  files: { desktop: ImageFile | CutoutFiles | VideoFiles; mobile: ImageFile | CutoutFiles | VideoFiles };
  poster: ResolvedReal | null;
  lqip?: string;
}

export type ResolvedAsset = ResolvedPlaceholder | ResolvedReal;

/** `aspect-ratio` values for the reserved box, desktop and mobile */
export function aspectVars(a: ResolvedBase): Record<string, string> {
  return {
    "--ar-d": `${a.aspect.desktop[0]} / ${a.aspect.desktop[1]}`,
    "--ar-m": `${a.aspect.mobile[0]} / ${a.aspect.mobile[1]}`,
  };
}
