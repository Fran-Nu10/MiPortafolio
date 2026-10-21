import type { ProjectSlug } from "@/data/types";
import type { SectionId } from "./journey-store";

/**
 * Section ↔ URL mapping (Spec §20, docs/25). Two documents since THE SHIFT: the home journey (`/`)
 * and each project's case (`/trabajo/{slug}`, its world and proof). The mapping is the same for both.
 *
 * - a world is the active section → `/trabajo/{slug}` (its own document)
 * - capacidades / propuesta / perfil / contacto → `/#{id}`
 * - anything else (opening, reel) → `/`
 *
 * Pure mapping, used on the server too. The history side (replaceState while scrolling,
 * pushState on explicit navigation, popstate) lives in lib/journey-nav.
 */

const PROJECT_SECTIONS: readonly ProjectSlug[] = ["travelsuite360", "rayo-smash", "santi-nuca", "chef-arturo"];
const ANCHOR_SECTIONS = ["capacidades", "propuesta", "perfil", "contacto"] as const;

export function isProjectSection(s: SectionId): s is ProjectSlug {
  return (PROJECT_SECTIONS as readonly string[]).includes(s);
}

export function pathForSection(section: SectionId): string {
  if (isProjectSection(section)) return `/trabajo/${section}`;
  if ((ANCHOR_SECTIONS as readonly string[]).includes(section)) return `/#${section}`;
  return "/";
}

export function sectionForLocation(pathname: string, hash = ""): SectionId | null {
  // an anchor wins over the path: "#perfil" means Perfil on every journey URL
  const h = hash.replace(/^#/, "");
  if ((ANCHOR_SECTIONS as readonly string[]).includes(h)) return h as SectionId;
  if (h === "trabajo") return "trabajo";
  // any other fragment (the skip link, the no-JS "Ir a …") is the browser's
  if (h) return null;
  const m = /^\/trabajo\/([^/]+)\/?$/.exec(pathname);
  if (m) return (PROJECT_SECTIONS as readonly string[]).includes(m[1]) ? (m[1] as ProjectSlug) : null;
  return pathname === "/" ? "inicio" : null;
}

/** the reel in the home journey: where a case's «← Trabajo» returns (docs/25) */
export const REEL_HREF = "/#trabajo";

/** the URL as the router sees it, for comparison with `pathForSection` */
export function currentUrl(loc: Pick<Location, "pathname" | "hash">): string {
  return `${loc.pathname}${loc.hash}`;
}
