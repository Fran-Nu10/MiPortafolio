"use client";

import { useLayoutEffect } from "react";
import type { ProjectSlug } from "@/data/types";
import { registerGsap, ScrollTrigger } from "@/lib/motion";
import { getJourney, setJourney, subscribeJourney, type SectionId } from "@/lib/journey-store";
import { syncUrl } from "@/lib/route-sync";
import { queueRefresh } from "@/lib/useScene";

/**
 * Mounts once per journey (Spec §03): section tracking → store, store → URL (replaceState
 * only, Spec §20), and the deep-link start on `/trabajo/{slug}`. Renders nothing.
 *
 * Phase 1 tracks sections with one plain ScrollTrigger each; from Phase 2 on, sections that
 * own a scene report through their own trigger instead.
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
    // the opening is static until Phase 2: the header may show at once
    setJourney({ heroRevealed: true });

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

    let syncing = !initial;
    const unsubscribe = subscribeJourney(() => {
      if (syncing) syncUrl(getJourney().section, titles, homeTitle);
    });

    // deep link: start at the world, instantly, once layout and fonts are measured
    let cancelled = false;
    if (initial) {
      const restoration = history.scrollRestoration;
      history.scrollRestoration = "manual";
      const jump = () => {
        if (cancelled) return;
        ScrollTrigger.refresh();
        const target = document.getElementById(initial);
        if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
        history.scrollRestoration = restoration;
        setJourney({ section: initial });
        syncing = true;
      };
      (document.fonts?.ready ?? Promise.resolve()).then(() => requestAnimationFrame(jump));
    }

    return () => {
      cancelled = true;
      unsubscribe();
      triggers.forEach((t) => t.kill());
    };
  }, [initial, titles, homeTitle]);

  return null;
}
