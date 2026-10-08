"use client";

import { getJourney, setJourney, type SectionId } from "./journey-store";
import { prefersReducedMotion } from "./motion";
import { isProjectSection, pathForSection, sectionForLocation } from "./route-sync";
import { sceneScroll } from "./useScene";

/**
 * In-journey navigation (Spec §06 "Entering a world", §20). One document on every URL: explicit
 * navigation pushes history and scrolls; scrolling only replaces. Never `router.push` (it would
 * remount the journey between `/` and `/trabajo/[slug]`).
 *
 * History entries carry only our own state — `{ section, y }` — so Next.js keeps copying its
 * router internals into them and Back/Forward restore the same page tree without a reload.
 */

export interface JourneyHistoryState {
  section?: SectionId;
  /** scroll position to return to on Back / Forward */
  y?: number;
}

const NEXT_KEYS = new Set(["__NA", "__PRIVATE_NEXTJS_INTERNALS_TREE", "_N"]);

/** our part of `history.state` (Next's internals left out, so its patched history adds them back) */
export function ownState(): JourneyHistoryState {
  const s = (typeof history !== "undefined" ? history.state : null) as Record<string, unknown> | null;
  if (!s) return {};
  const own: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(s)) if (!NEXT_KEYS.has(k)) own[k] = v;
  return own as JourneyHistoryState;
}

export function replaceOwnState(patch: JourneyHistoryState, url?: string) {
  history.replaceState({ ...ownState(), ...patch }, "", url ?? `${location.pathname}${location.hash}`);
}

const headerOffset = () => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
const docTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY;

/**
 * Where a section starts. Worlds: their pinned stage at SCREEN (or one of their labels); the reel:
 * its stage, where the active frame sits at the shared reel rectangle; the rest: their top under
 * the header.
 */
export function sectionScroll(section: SectionId, label?: string): number {
  if (isProjectSection(section)) {
    const y = sceneScroll(`world-${section}`, label);
    // the start: the first whole pixel at which the sticky stage holds the top of the viewport
    // (a fractional start rounds down to just before it — the SCREEN picture half a pixel low)
    const holder = document.querySelector(`#${section} [data-part="pin"]`);
    if (y !== null) return label || !holder ? y : Math.ceil(docTop(holder));
    // tiny viewports: the world is a static section, read from its name under the header
    const el = document.getElementById(section);
    return el ? Math.max(0, docTop(el) - headerOffset()) : 0;
  }
  if (section === "inicio") return 0;
  if (section === "trabajo") {
    const stage = document.querySelector('#trabajo [data-part="stage"]');
    return stage ? docTop(stage) : 0;
  }
  const el = document.getElementById(section);
  return el ? Math.max(0, docTop(el) - headerOffset()) : 0;
}

function jump(y: number) {
  window.scrollTo({ top: y, behavior: "instant" });
}

/** move focus to the section without scrolling (keyboard and screen-reader users land there) */
function focusSection(section: SectionId) {
  const el = document.getElementById(section);
  if (!el) return;
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

/**
 * Explicit navigation: push a history entry, then jump. Entering a world (reel "Ver caso",
 * the 01–04 overlay, "Siguiente →", capability links): an instant jump to its SCREEN state —
 * the same image at the same rectangle as the reel frame, so the jump is invisible — then one
 * gesture's native smooth scroll to `s:ISOLATE`. Reduced motion: a cut to the world state.
 */
export function navigate(section: SectionId, opts: { focus?: boolean; from?: Element | null } = {}) {
  // the entry we leave remembers where we were, so Back returns exactly there
  replaceOwnState({ section: getJourney().section, y: window.scrollY });
  const world = isProjectSection(section);
  const rm = prefersReducedMotion();
  const start = sectionScroll(section);
  const rest = world ? sectionScroll(section, rm ? "s:WORLD" : "s:ISOLATE") : start;
  // from the reel: its stage scrolls freely, so keep where the visitor sees it — a stage left
  // a little below the top lands the world's stage at the same offset (the same rectangle)
  const reelStage = opts.from?.closest("#trabajo")?.querySelector('[data-part="stage"]');
  const offset = world && reelStage ? Math.max(0, Math.round(reelStage.getBoundingClientRect().top)) : 0;
  history.pushState({ section, y: rest } satisfies JourneyHistoryState, "", pathForSection(section));
  setJourney({ section });
  jump(world && rm ? rest : start - offset);
  if (world && !rm) requestAnimationFrame(() => window.scrollTo({ top: rest, behavior: "smooth" }));
  if (opts.focus) focusSection(section);
}

/** a same-origin link into the journey → its section (null: let the browser handle it) */
export function sectionForHref(href: string): SectionId | null {
  let url: URL;
  try {
    url = new URL(href, location.href);
  } catch {
    return null;
  }
  if (url.origin !== location.origin) return null;
  return sectionForLocation(url.pathname, url.hash);
}

/**
 * Scrolling keeps the address bar and the title in step with the active section — with
 * `replaceState` only, so scrolling never adds history entries (Spec §20).
 */
export function syncUrl(section: SectionId, titles: Partial<Record<SectionId, string>>, fallbackTitle: string) {
  const next = pathForSection(section);
  if (`${location.pathname}${location.hash}` !== next) replaceOwnState({ section }, next);
  const title = titles[section] ?? fallbackTitle;
  if (document.title !== title) document.title = title;
}

/** remember the scroll position in the current entry once scrolling settles (reload keeps place) */
export function trackScrollPosition(): () => void {
  let t = 0;
  const onScroll = () => {
    window.clearTimeout(t);
    t = window.setTimeout(() => replaceOwnState({ y: Math.round(window.scrollY) }), 300);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    window.clearTimeout(t);
    window.removeEventListener("scroll", onScroll);
  };
}

/** a reload (not a fresh visit) with a remembered position */
export function reloadPosition(): number | null {
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const y = ownState().y;
  return nav?.type === "reload" && typeof y === "number" ? y : null;
}

/** Back / Forward: return to the remembered position (or the section's start) instantly */
export function installHistory(): () => void {
  const onPop = (e: PopStateEvent) => {
    const state = (e.state ?? {}) as JourneyHistoryState;
    const section = state.section ?? sectionForLocation(location.pathname, location.hash);
    if (!section) return;
    const y = typeof state.y === "number" ? state.y : sectionScroll(section);
    // after the browser's own restoration, so ours wins
    requestAnimationFrame(() => {
      jump(y);
      setJourney({ section });
    });
  };
  window.addEventListener("popstate", onPop);
  return () => window.removeEventListener("popstate", onPop);
}
