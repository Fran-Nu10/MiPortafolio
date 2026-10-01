"use client";

import { useLayoutEffect, type RefObject } from "react";
import { gsap, ScrollTrigger, registerGsap, prefersReducedMotion } from "./motion";

export interface SceneApi {
  /** the pinned root element */
  root: HTMLElement;
  /** scoped selector */
  q: (sel: string) => HTMLElement[];
  /** true when the visitor prefers reduced motion — build the same timeline, it will snap between its states */
  rm: boolean;
  gsap: typeof gsap;
}

interface SceneOptions {
  /** total scroll distance while pinned, in viewport heights (e.g. 1.5 = 150vh) */
  pinVh?: number;
  /** number of discrete states the timeline snaps to under reduced motion */
  states?: number;
  /** id for ScrollTrigger debugging */
  id?: string;
  /** called on every scroll update with progress 0–1 */
  onProgress?: (p: number) => void;
  onEnter?: () => void;
  onEnterBack?: () => void;
  /** on phones: "flow" = no pin, the timeline scrubs while the section passes (for scenes with inputs) */
  mobile?: "pin" | "flow";
  /** return the scrubbed timeline; return null for a scene without pin/scrub */
  build: (api: SceneApi) => gsap.core.Timeline | null;
  deps?: unknown[];
}

/**
 * Scenes can (re)build out of document order — the opening waits for the fonts, any scene
 * rebuilds on a width change — so after any build the triggers are re-sorted by their
 * position in the page and refreshed once (coalesced to one frame).
 */
let refreshQueued = 0;
function queueRefresh() {
  if (refreshQueued) return;
  refreshQueued = window.requestAnimationFrame(() => {
    refreshQueued = 0;
    ScrollTrigger.sort((a: ScrollTrigger, b: ScrollTrigger) => {
      const ta = a.trigger as Element | undefined;
      const tb = b.trigger as Element | undefined;
      if (!ta || !tb || ta === tb) return 0;
      return ta.compareDocumentPosition(tb) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    ScrollTrigger.refresh();
  });
}

/**
 * One pinned, scrubbed scene = one ScrollTrigger + one timeline. Every scene of the
 * site is built through this so pin, scrub, cleanup and reduced motion behave the same.
 */
export function useScene(ref: RefObject<HTMLElement | null>, opts: SceneOptions) {
  // the options are read once per (re)build — the effect re-runs only when `deps` change
  useLayoutEffect(() => {
    registerGsap();
    const root = ref.current;
    if (!root) return;
    const o = opts;
    const rm = prefersReducedMotion();
    let ctx: gsap.Context | null = null;

    const setup = () => {
      ctx = gsap.context(() => {
        const q = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
        const tl = o.build({ root, q, rm, gsap });
        if (!tl) return;
        tl.pause();
        // reduced motion: the timeline is never played between states. A scene can name its
        // resting states with labels "rest…" (the snap lands exactly on them); otherwise the
        // timeline is cut into `states` equal steps.
        const rest = Object.entries(tl.labels)
          .filter(([k]) => k.startsWith("rest"))
          .map(([, t]) => t / tl.duration())
          .sort((a, b) => a - b);
        const stops = rest.length ? rest : Array.from({ length: (o.states ?? 4) + 1 }, (_, i) => i / (o.states ?? 4));
        const snap = (p: number) => stops[Math.min(stops.length - 1, Math.floor(p * stops.length))];
        const flow = o.mobile === "flow" && window.matchMedia("(max-width: 1023px)").matches;
        ScrollTrigger.create({
          id: o.id,
          trigger: root,
          start: flow ? "top 70%" : "top top",
          end: flow ? "top 10%" : `+=${Math.round((o.pinVh ?? 1) * 100)}%`,
          pin: !flow,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: rm ? true : 0.6,
          invalidateOnRefresh: true,
          animation: tl,
          onUpdate: (self) => {
            // reduced motion: the same timeline, but it only ever shows one of its N states
            if (rm) tl.progress(snap(self.progress));
            o.onProgress?.(self.progress);
          },
          onEnter: () => o.onEnter?.(),
          onEnterBack: () => o.onEnterBack?.(),
        });
      }, root);
      queueRefresh();
    };
    setup();

    // Scenes measure their own geometry (cotas, the name landing on the plate) and pick a
    // layout per breakpoint, so a width change rebuilds the scene instead of stretching it.
    let width = window.innerWidth;
    let timer = 0;
    const onResize = () => {
      if (Math.abs(window.innerWidth - width) < 2) return; // mobile URL bar: height only
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        width = window.innerWidth;
        const y = window.scrollY;
        ctx?.revert();
        setup();
        window.scrollTo(0, y);
      }, 220);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, opts.deps ?? []);
}

/** A scene that is not pinned: it only reports its presence (for the counter / frame). */
export function useSceneEnter(ref: RefObject<HTMLElement | null>, onEnter: () => void, start = "top 60%") {
  useLayoutEffect(() => {
    registerGsap();
    const root = ref.current;
    if (!root) return;
    const st = ScrollTrigger.create({
      trigger: root,
      start,
      end: "bottom 40%",
      onEnter,
      onEnterBack: onEnter,
    });
    return () => st.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, start]);
}
