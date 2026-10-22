"use client";

import { useLayoutEffect } from "react";
import { EASE, ScrollTrigger, gsap, prefersReducedMotion, registerGsap } from "@/lib/motion";
import { queueRefresh } from "@/lib/useScene";

/**
 * Perfil's motion (docs/26 §E; it replaces the Phase 9 whole-block reveals). Every piece plays once,
 * when it comes into view, and is never hidden again on the way back:
 * - the declaration enters line by line: each line rises out of its own mask (yPercent 100 → 0,
 *   staggered 90 ms, settle). The lines are measured by GSAP's SplitText, loaded when the section
 *   approaches (it ships with the gsap package; no new dependency) with no ARIA rewrite: the text
 *   stays one paragraph. Once in, the split is reverted, so the paragraph reflows as plain text.
 * - the explanation and Meta Ads' paragraphs come in block by block (opacity and 18 px), as each one
 *   reaches 88 % of the viewport — no waiting: a block in view is readable at once.
 * - Meta Ads' conductor draws its red rules and lights its three words in order.
 * Reduced motion and no JS: nothing moves, everything is there.
 */
export function ProfileReveal() {
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    registerGsap();
    const section = document.getElementById("perfil");
    if (!section) return;
    const core = section.querySelector<HTMLElement>(".profile-core");
    const blocks = Array.from(section.querySelectorAll<HTMLElement>(".profile-detail p, .profile-ads-title, .profile-ads-body p"));
    const chain = section.querySelector<HTMLElement>(".profile-chain");
    let cancelled = false;
    let revertSplit: (() => void) | null = null;
    section.dataset.reveal = "pending";

    const ctx = gsap.context(() => {
      // the declaration: hidden as one block until its lines are measured, then line by line
      if (core) {
        gsap.set(core, { opacity: 0 });
        let started = false;
        const go = () => {
          if (started) return;
          started = true;
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
        };
        const st = ScrollTrigger.create({ trigger: core, start: "top 86%", once: true, onEnter: go });
        // a reload or a deep link below it: already past its start → in at once
        if (st.progress > 0) go();
      }

      // the paragraphs, each on its own entry
      for (const b of blocks) {
        gsap.set(b, { opacity: 0, y: 18 });
        let shown = false;
        const show = () => {
          if (shown) return;
          shown = true;
          gsap.to(b, { opacity: 1, y: 0, duration: 0.7, ease: EASE.settle, clearProps: "opacity,transform" });
        };
        const st = ScrollTrigger.create({ trigger: b, start: "top 88%", once: true, onEnter: show });
        if (st.progress > 0) show();
      }

      // Meta Ads' conductor: Estrategia → Producto → Crecimiento
      if (chain) {
        const words = Array.from(chain.querySelectorAll<HTMLElement>(".profile-chain-word"));
        const rules = Array.from(chain.querySelectorAll<HTMLElement>(".profile-chain-rule"));
        // the words are always legible; the red line draws from one to the next, and the last word
        // turns red when it arrives
        const last = words[words.length - 1];
        gsap.set(rules, { scaleX: 0, transformOrigin: "0% 50%" });
        if (last) gsap.set(last, { color: "rgb(237, 232, 222)" });
        const tl = gsap.timeline({ paused: true });
        rules.forEach((r) => tl.to(r, { scaleX: 1, duration: 0.5, ease: EASE.settle }, ">-0.08"));
        if (last) tl.to(last, { color: "rgb(230, 59, 46)", duration: 0.3, ease: EASE.settle }, ">-0.1");
        const st = ScrollTrigger.create({ trigger: chain, start: "top 85%", once: true, onEnter: () => tl.play() });
        if (st.progress > 0) tl.progress(1);
      }
    }, section);
    queueRefresh();
    return () => {
      cancelled = true;
      revertSplit?.();
      ctx.revert();
      delete section.dataset.reveal;
    };
  }, []);
  return null;
}
