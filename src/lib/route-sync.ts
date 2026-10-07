import type { ProjectSlug } from "@/data/types";
import type { SectionId } from "./journey-store";

/**
 * Section ↔ URL mapping (Spec §20). Every route renders the same journey; the route only
 * decides where the visitor starts and which metadata the server sends.
 *
 * - a world is the active section → `/trabajo/{slug}`
 * - capacidades / perfil / contacto → `/#{id}`
 * - anything else (opening, reel) → `/`
 *
 * Scrolling only ever calls `history.replaceState` (no history spam). Explicit navigation
 * (reel "Ver caso", overlay, "Siguiente →") pushes history — wired in Phase 4.
 */

const PROJECT_SECTIONS: readonly ProjectSlug[] = ["travelsuite360", "rayo-smash", "santi-nuca", "chef-arturo"];
const ANCHOR_SECTIONS = ["capacidades", "perfil", "contacto"] as const;

export function isProjectSection(s: SectionId): s is ProjectSlug {
  return (PROJECT_SECTIONS as readonly string[]).includes(s);
}

export function pathForSection(section: SectionId): string {
  if (isProjectSection(section)) return `/trabajo/${section}`;
  if ((ANCHOR_SECTIONS as readonly string[]).includes(section)) return `/#${section}`;
  return "/";
}

export function sectionForLocation(pathname: string, hash = ""): SectionId | null {
  const m = /^\/trabajo\/([^/]+)\/?$/.exec(pathname);
  if (m) return (PROJECT_SECTIONS as readonly string[]).includes(m[1]) ? (m[1] as ProjectSlug) : null;
  const h = hash.replace(/^#/, "");
  if ((ANCHOR_SECTIONS as readonly string[]).includes(h)) return h as SectionId;
  if (h === "trabajo") return "trabajo";
  return pathname === "/" ? "inicio" : null;
}

/** the URL as the router sees it, for comparison with `pathForSection` */
export function currentUrl(loc: Pick<Location, "pathname" | "hash">): string {
  return `${loc.pathname}${loc.hash}`;
}

/**
 * Keep the address bar and the document title in step with the active section
 * (`replaceState` only). `titles` maps each section to its `<title>`.
 */
export function syncUrl(section: SectionId, titles: Partial<Record<SectionId, string>>, fallbackTitle: string) {
  if (typeof window === "undefined") return;
  const next = pathForSection(section);
  if (currentUrl(window.location) !== next) window.history.replaceState(null, "", next);
  const title = titles[section] ?? fallbackTitle;
  if (document.title !== title) document.title = title;
}
