"use client";

import { useLayoutEffect } from "react";
import type { ProjectSlug } from "@/data/types";
import { registerGsap, ScrollTrigger } from "@/lib/motion";
import { getJourney, setJourney, subscribeJourney, type SectionId } from "@/lib/journey-store";
import { installHistory, navigate, releaseTitle, reloadPosition, sectionForHref, sectionScroll, syncUrl, trackScrollPosition } from "@/lib/journey-nav";
import { queueRefresh, scenesReady } from "@/lib/useScene";

/**
 * Mounts once per journey (Spec §03, §20). Renders nothing.
 * - section tracking → store; store → URL and title (replaceState only)
 * - in-journey links (reel "Ver caso", "Siguiente →", header, capabilities) → pushState + jump,
 *   handled in the bubble phase so the reel (a drag is not a click) and the overlay can veto
 * - Back / Forward → the remembered position
 * - start: a deep link lands on its world's SCREEN state; a reload returns where the visitor was
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
      if (!section) return;
      e.preventDefault();
      // a keyboard activation (detail 0) moves focus to where the visitor lands
      navigate(section, { focus: e.detail === 0, from: a });
    };
    document.addEventListener("click", onClick);

    // the first position: deep link → the world's SCREEN; reload → the remembered place
    let cancelled = false;
    const remembered = reloadPosition();
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
      const y = remembered ?? (initial ? sectionScroll(initial) : null);
      if (y !== null) window.scrollTo({ top: y, behavior: "instant" });
      history.scrollRestoration = "auto";
      // the hero was kept out of sight until now (no opening flash on deep links)
      main?.setAttribute("data-started", "");
      if (initial && remembered === null) setJourney({ section: initial });
      syncing = true;
      syncUrl(getJourney().section, titles, homeTitle);
    };
    if (initial || remembered !== null) {
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
