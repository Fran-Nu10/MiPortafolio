import type { AssetKey, Project } from "@/data/types";
import { getContract, isUsable } from "./assets";
import { pathForSection } from "./route-sync";

/**
 * The showreel's declaration of a project (docs/23 §6). One place answers «what does this card
 * show?»: the project's id, name and route, its poster, its video per tier and its metadata.
 * Nothing here is new data: it reads `data/projects.ts` (identity, route, meta) and the asset
 * registry (`data/assets.ts`, the files). A project gets its professional video by flipping its
 * `*.reel.loop` contract from `placeholder` to `final` and adding the files — no component changes.
 *
 * Pure and server-safe: no DOM, no paths reach a component (they ask the registry for keys).
 */
export interface ShowreelEntry {
  id: Project["id"];
  name: string;
  /** the project's own route (`/trabajo/{slug}`): what a click on the card opens */
  route: string;
  poster: AssetKey;
  /** the loop contract (a `loop` asset; its poster is the floor under any video) */
  video: AssetKey;
  /** which tiers have a real, approved video today (none → the poster stands alone) */
  videoTiers: { desktop: boolean; mobile: boolean };
  /** the metadata line shown with the card */
  meta: { reelLine: string; relationLine?: string; title: string; description: string };
}

export function showreelOf(p: Project): ShowreelEntry {
  const c = getContract(p.reel.loop);
  const usable = isUsable(c);
  return {
    id: p.id,
    name: p.name,
    route: pathForSection(p.id),
    // with its film, the card's floor is the film's own first frame (docs/26 §F); until then, the poster
    poster: usable && c.poster ? c.poster : p.reel.poster,
    video: p.reel.loop,
    videoTiers: { desktop: usable && !!c.files?.desktop, mobile: usable && !!c.files?.mobile },
    meta: { reelLine: p.reelLine, relationLine: p.relationLine, title: p.meta.title, description: p.meta.description },
  };
}

/** a video that ships for one tier only is a half-integration: the card would fall back on the other */
export function incompleteVideo(e: ShowreelEntry): boolean {
  return e.videoTiers.desktop !== e.videoTiers.mobile;
}
