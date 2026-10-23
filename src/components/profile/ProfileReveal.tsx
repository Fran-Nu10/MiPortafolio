"use client";

import { useLayoutEffect } from "react";
import { onApproach } from "@/lib/approach";
import { EASE, ScrollTrigger, gsap, prefersReducedMotion, registerGsap } from "@/lib/motion";
import { queueRefresh } from "@/lib/useScene";

/**
 * Perfil's motion (docs/26 §E, recomposed by docs/27 §3). Every piece plays once, when it comes into
 * view, and is never hidden again on the way back:
 * - the declaration enters line by line: each line rises out of its own mask (yPercent 100 → 0,
 *   staggered 90 ms, settle). The lines are measured by GSAP's SplitText, loaded when the section
 *   approaches (it ships with the gsap package; no new dependency) with no ARIA rewrite: the text
 *   stays one paragraph. Once in, the split is reverted, so the paragraph reflows as plain text.
 * - the paragraphs and Meta Ads' headline lines come in as each reaches 88 % of the viewport.
 * - the four phrases join one by one along their accent thread; the project fragments open from
 *   their own frame (a clip, no movement of the picture).
 * - Meta Ads' sequence: Producto, then the module is seen further (its outlines grow), then one
 *   comes to it (the accent module arrives); the thread draws from step to step.
 * Reduced motion and no JS: nothing moves, everything is there. The reveals are built when the section
 * approaches (lib/approach), not in the hydration commit; until then the section is its static page.
 */
export function ProfileReveal() {
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const section = document.getElementById("perfil");
    if (!section) return;
    section.dataset.reveal = "pending";
    const stop = onApproach(section, () => {
      registerGsap();
      const core = section.querySelector<HTMLElement>(".profile-core");
      const blocks = Array.from(section.querySelectorAll<HTMLElement>(".profile-p, .profile-ads-line, .profile-ads-p"));
      const phrases = section.querySelector<HTMLElement>(".profile-phrases");
      const shots = Array.from(section.querySelectorAll<HTMLElement>(".profile-shot"));
      const steps = section.querySelector<HTMLElement>(".profile-steps");
      let cancelled = false;
      let revertSplit: (() => void) | null = null;

      /** play `run` once, when `el` reaches `start` (or at once if a reload already put it past there) */
      const once = (el: Element, start: string, run: () => void) => {
        let done = false;
        const go = () => {
          if (done) return;
          done = true;
          run();
        };
        const st = ScrollTrigger.create({ trigger: el, start, once: true, onEnter: go });
        if (st.progress > 0) go();
      };

      const ctx = gsap.context(() => {
        // the declaration: hidden as one block until its lines are measured, then line by line
        if (core) {
          gsap.set(core, { opacity: 0 });
          once(core, "top 86%", () => {
            import("gsap/SplitText")
              .then(({ SplitText }) => {
                if (cancelled) return;
                gsap.registerPlugin(SplitText);
                const split = SplitText.create(core, { type: "lines", mask: "lines", aria: "none" });
                revertSplit = () => split.revert();
                gsap.set(core, { opacity: 1 });
                section.dataset.reveal = "shown";
                gsap.fromTo(split.lines, { yPercent: 100 }, { yPercent: 0, duration: 0.85, ease: EASE.settle, stagger: 0.09, onComplete: () => split.revert() });
              })
              .catch(() => {
                // the plugin did not load: the text is shown as it is
                gsap.set(core, { opacity: 1 });
                section.dataset.reveal = "shown";
              });
          });
        }

        // the paragraphs and the chapter's headline lines, each on its own entry
        for (const b of blocks) {
          gsap.set(b, { opacity: 0, y: 18 });
          once(b, "top 88%", () => gsap.to(b, { opacity: 1, y: 0, duration: 0.7, ease: EASE.settle, clearProps: "opacity,transform" }));
        }

        // the four phrases, joined one by one along the thread
        if (phrases) {
          const items = Array.from(phrases.querySelectorAll<HTMLElement>(".profile-phrase"));
          gsap.set(phrases, { "--thread": 0 });
          gsap.set(items, { opacity: 0, x: -12 });
          once(phrases, "top 84%", () => {
            const tl = gsap.timeline();
            tl.to(phrases, { "--thread": 1, duration: 0.9, ease: EASE.settle }, 0);
            tl.to(items, { opacity: 1, x: 0, duration: 0.55, ease: EASE.settle, stagger: 0.16, clearProps: "opacity,transform" }, 0.05);
          });
        }

        // the project fragments open from their own frame
        for (const s of shots) {
          const frame = s.querySelector(".profile-shot-frame");
          if (!frame) continue;
          gsap.set(frame, { clipPath: "inset(0 0 100% 0)" });
          once(s, "top 86%", () => gsap.to(frame, { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: EASE.reveal, delay: Number(s.dataset.k ?? 0) * 0.12, clearProps: "clipPath" }));
        }

        // Meta Ads: product → discovery → action, and the thread between them
        if (steps) {
          const items = Array.from(steps.querySelectorAll<HTMLElement>(".profile-step"));
          const wide = window.matchMedia("(min-width: 1024px)").matches;
          const tl = gsap.timeline({ paused: true });
          items.forEach((item, k) => {
            const at = k * 0.55;
            const node = item.querySelector(".profile-step-node");
            const seg = item.querySelector(".profile-step-seg");
            const words = item.querySelectorAll(".profile-step-word, .profile-step-line");
            if (node) tl.fromTo(node, { scale: 0 }, { scale: 1, duration: 0.35, ease: EASE.settle }, at);
            tl.fromTo(words, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: EASE.settle, stagger: 0.08, clearProps: "opacity,transform" }, at + 0.05);
            const mod = item.querySelector('[data-part="mod"]');
            if (mod) tl.fromTo(mod, { scale: 0.4, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.5, ease: EASE.settle }, at);
            const echoes = item.querySelectorAll("[data-echo]");
            if (echoes.length) tl.fromTo(echoes, { opacity: 0, scale: 0.7, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.6, ease: EASE.settle, stagger: 0.1 }, at + 0.1);
            const act = item.querySelector('[data-part="act"]');
            if (act) tl.fromTo(act, { opacity: 0, x: -36 }, { opacity: 1, x: 0, duration: 0.6, ease: EASE.settle }, at + 0.35);
            if (seg) tl.fromTo(seg, wide ? { scaleX: 0 } : { scaleY: 0 }, { ...(wide ? { scaleX: 1 } : { scaleY: 1 }), duration: 0.45, ease: EASE.settle }, at + 0.25);
          });
          once(steps, "top 82%", () => tl.play());
        }
      }, section);
      queueRefresh();
      return () => {
        cancelled = true;
        revertSplit?.();
        ctx.revert();
      };
    });
    return () => {
      stop();
      delete section.dataset.reveal;
    };
  }, []);
  return null;
}
