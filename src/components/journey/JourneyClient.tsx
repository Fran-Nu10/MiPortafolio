"use client";

import { useLayoutEffect } from "react";
import type { ProjectSlug } from "@/data/types";
import { registerGsap, ScrollTrigger } from "@/lib/motion";
import { getJourney, setJourney, subscribeJourney, type SectionId } from "@/lib/journey-store";
import { installHistory, isHere, navigate, releaseTitle, reloadPosition, sectionForHref, sectionScroll, syncUrl, trackScrollPosition } from "@/lib/journey-nav";
import { sectionForLocation } from "@/lib/route-sync";
import { anchorView, queueRefresh, scenesReady } from "@/lib/useScene";

/**
 * Mounts once per journey (Spec §03, §20). Renders nothing.
 * - section tracking → store; store → URL and title (replaceState only)
 * - in-journey links (reel "Ver caso", "Siguiente →", header, capabilities) → pushState + jump,
 *   handled in the bubble phase so the reel (a drag is not a click) and the overlay can veto
 * - Back / Forward → the remembered position
 * - start: a deep link lands on its world's SCREEN state; a reload (or Back from another document)
 *   returns where the visitor was; an anchor lands on its section
 */
export function JourneyClient({
  initial,
  titles,
  homeTitle,
}: {
  initial: ProjectSlug | null;
  titles: Partial<Record<SectionId, string>>;
  homeTitle: string;
}) {
  useLayoutEffect(() => {
    registerGsap();
    const main = document.getElementById("contenido");
    // a case has no opening to reveal the header (docs/25): it shows from the start
    if (!document.getElementById("inicio")) setJourney({ heroRevealed: true });

    const triggers = Array.from(document.querySelectorAll<HTMLElement>("[data-section]")).map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: "top 50%",
        end: "bottom 50%",
        onToggle: (self) => {
          if (self.isActive) setJourney({ section: el.dataset.section as SectionId });
        },
      }),
    );
    queueRefresh();

    let syncing = false;
    const unsubscribe = subscribeJourney(() => {
      if (syncing) syncUrl(getJourney().section, titles, homeTitle);
    });
    const offHistory = installHistory();
    const offScroll = trackScrollPosition();

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const section = sectionForHref(a.getAttribute("href") ?? "");
      // a section of another document (a case from the home, the home from a case): the browser's
      if (!section || !isHere(section)) return;
      e.preventDefault();
      // a keyboard activation (detail 0) moves focus to where the visitor lands
      navigate(section, { focus: e.detail === 0, from: a });
    };
    document.addEventListener("click", onClick);

    // the first position: deep link → the world's SCREEN; reload or Back → the remembered place; an
    // anchor of this document (a case's «← Trabajo» → `/#trabajo`, docs/25) → that section, measured
    // once every pin has its length (the browser's own jump happens before the scenes have built)
    let cancelled = false;
    const remembered = reloadPosition();
    const hashed = sectionForLocation(location.pathname, location.hash);
    const anchor = !initial && remembered === null && hashed && hashed !== "inicio" && isHere(hashed) ? hashed : null;
    const start = () => {
      if (cancelled) return;
      ScrollTrigger.refresh();
      // the jump waits two frames after the refresh: issued in the same frame as the pins' layout
      // changes, Chromium measured the whole stage as one layout shift of 1.0 (Lighthouse CLS on
      // every deep link, Phase 12). The hero is still out of sight meanwhile: nothing flashes.
      requestAnimationFrame(() => requestAnimationFrame(land));
    };
    const land = () => {
      if (cancelled) return;
      const target = initial ?? anchor;
      const y = remembered ?? (target ? sectionScroll(target) : null);
      if (y !== null) window.scrollTo({ top: y, behavior: "instant" });
      // the landing is authoritative: hold the landed section (not the one picked mid-build)
      anchorView();
      history.scrollRestoration = "auto";
      // the hero was kept out of sight until now (no opening flash on deep links)
      main?.setAttribute("data-started", "");
      if (target && remembered === null) setJourney({ section: target });
      syncing = true;
      syncUrl(getJourney().section, titles, homeTitle);
    };
    if (initial || anchor || remembered !== null) {
      history.scrollRestoration = "manual";
      // every scene must be built (pins sized) before the landing position is measured
      (document.fonts?.ready ?? Promise.resolve()).then(scenesReady).then(() => requestAnimationFrame(start));
    } else {
      main?.setAttribute("data-started", "");
      syncing = true;
      // a section trigger can toggle while it is created, before the subscription above existed (a
      // visitor who scrolled before hydration — WebKit under load, Phase 13): sync what is current
      syncUrl(getJourney().section, titles, homeTitle);
    }

    return () => {
      cancelled = true;
      unsubscribe();
      offHistory();
      offScroll();
      releaseTitle();
      document.removeEventListener("click", onClick);
      triggers.forEach((t) => t.kill());
    };
  }, [initial, titles, homeTitle]);

  return null;
}
