"use client";

import { useLayoutEffect } from "react";
import { onApproach } from "@/lib/approach";
import { EASE, gsap, registerGsap } from "@/lib/motion";
import { queueRefresh } from "@/lib/useScene";
import { GRID, LOOSE, VISION_AT, VISION_VIEWBOX } from "@/lib/vision";

const WIDE = "(min-width: 1024px)";
const MOTION = "(prefers-reduced-motion: no-preference)";

/**
 * The transformation of «Una sola visión», played with the scroll (docs/27 §3.3): scrubbed to the
 * section's own pass through the viewport — no pin, reversible — in three thirds. Pensar: the points
 * leave the centre and find their loose places while the free line draws. Diseñar: the same points
 * move from those loose places onto the grid, its guides come up, the orthogonal path draws. Construir:
 * each point grows into its module and the block closes. The conductor runs under the three (along
 * the column on narrow screens, across on wide ones), a stretch per stage; each stage's words rise as
 * it arrives, the close last. Built per layout by gsap.matchMedia when the section approaches
 * (lib/approach: not in the hydration commit); reduced motion builds nothing (the static page).
 */
export function VisionScene() {
  useLayoutEffect(() => {
    const section = document.getElementById("vision");
    const body = section?.querySelector<HTMLElement>(".vision-body");
    if (!section || !body) return;
    return onApproach(section, () => {
      registerGsap();
      const mm = gsap.matchMedia();
      mm.add({ wide: WIDE, motion: MOTION }, (context) => {
        const { wide, motion } = context.conditions as { wide: boolean; motion: boolean };
        if (!motion) return;
        const q = <T extends Element>(sel: string, root: ParentNode = section) => Array.from(root.querySelectorAll<T>(sel));
        const stages = q<HTMLElement>("[data-stage]");
        const close = section.querySelector<HTMLElement>('[data-part="close"]');
        const mid = VISION_VIEWBOX / 2;

        const tl = gsap.timeline({
          defaults: { ease: EASE.none },
          scrollTrigger: { trigger: body, start: wide ? "top 82%" : "top 86%", end: wide ? "bottom 72%" : "bottom 78%", scrub: 0.5 },
        });
        tl.set({}, {}, 1);

        stages.forEach((stage, k) => {
          const [a, b] = VISION_AT.stages[k];
          const span = b - a;
          const node = stage.querySelector('[data-part="node"]');
          const text = q<HTMLElement>('[data-part="text"]', stage);
          const draw = stage.querySelector('[data-part="draw"]');
          const seg = stage.querySelector('[data-part="seg"]');
          // the conductor leaves this stage once its words are in, and reaches the next as it arrives
          if (seg) tl.fromTo(seg, wide ? { scaleX: 0 } : { scaleY: 0 }, { ...(wide ? { scaleX: 1 } : { scaleY: 1 }), duration: span * 0.55, immediateRender: true }, a + span * 0.45);
          if (node) tl.fromTo(node, { scale: 0 }, { scale: 1, duration: span * 0.25, ease: EASE.settle, immediateRender: true }, a);
          tl.fromTo(text, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: span * 0.55, ease: EASE.settle, stagger: span * 0.12, immediateRender: true }, a + span * 0.1);
          if (draw) tl.fromTo(draw, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: span * 0.8, immediateRender: true }, a + span * 0.15);
          const points = q<SVGCircleElement>("[data-point]", stage);
          if (k === 0) {
            // the idea: the points leave the centre and drift to their loose places
            points.forEach((p, i) => {
              tl.fromTo(p, { attr: { cx: mid, cy: mid }, opacity: 0 }, { attr: { cx: LOOSE[i][0], cy: LOOSE[i][1] }, opacity: 1, duration: span * 0.7, ease: EASE.settle, immediateRender: true }, a + span * (0.05 + i * 0.02));
            });
          } else if (k === 1) {
            // the structure: the same points, from where the idea left them onto the grid
            const guides = stage.querySelector('[data-part="guides"]');
            if (guides) tl.fromTo(guides, { opacity: 0 }, { opacity: 1, duration: span * 0.4, immediateRender: true }, a);
            points.forEach((p, i) => {
              tl.fromTo(p, { attr: { cx: LOOSE[i][0], cy: LOOSE[i][1] } }, { attr: { cx: GRID[i][0], cy: GRID[i][1] }, duration: span * 0.6, ease: EASE.settle, immediateRender: true }, a + span * 0.1);
            });
          } else {
            // the product: each point becomes its module; the block closes
            const modules = q<SVGRectElement>("[data-module]", stage);
            tl.fromTo(modules, { scale: 0.18, transformOrigin: "50% 50%" }, { scale: 1, duration: span * 0.6, ease: EASE.settle, stagger: span * 0.035, immediateRender: true }, a + span * 0.05);
          }
        });
        if (close) tl.fromTo(close, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: VISION_AT.close[1] - VISION_AT.close[0], ease: EASE.settle, immediateRender: true }, VISION_AT.close[0]);
      });
      queueRefresh();
      return () => mm.revert();
    });
  }, []);
  return null;
}
