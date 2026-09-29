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
    const ctx = gsap.context(() => {
      const q = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
      const tl = o.build({ root, q, rm, gsap });
      if (!tl) return;
      tl.pause();
      const states = o.states ?? 4;
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
          if (rm) tl.progress(Math.round(self.progress * states) / states);
          o.onProgress?.(self.progress);
        },
        onEnter: () => o.onEnter?.(),
        onEnterBack: () => o.onEnterBack?.(),
      });
    }, root);
    return () => ctx.revert();
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
