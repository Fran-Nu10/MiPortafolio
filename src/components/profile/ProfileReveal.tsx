"use client";

import { useLayoutEffect } from "react";
import { EASE, ScrollTrigger, gsap, prefersReducedMotion, registerGsap } from "@/lib/motion";
import { queueRefresh } from "@/lib/useScene";

/**
 * Perfil's one reveal on entry (Spec §12 Profile · Motion): when the section's top reaches
 * 75% of the viewport, each block reveals as a whole — clip-path inset bottom 100% → 0 and
 * y 16 → 0, 700 ms, settle, 120 ms stagger. Whole blocks only: the text is never split, so
 * it stays intact for assistive tech. Reduced motion and no JS: no reveal, the text is there.
 */
export function ProfileReveal() {
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    registerGsap();
    const section = document.getElementById("perfil");
    const blocks = section ? Array.from(section.querySelectorAll<HTMLElement>(".profile-body > *")) : [];
    if (!section || !blocks.length) return;
    section.dataset.reveal = "pending";
    const ctx = gsap.context(() => {
      gsap.set(blocks, { clipPath: "inset(0 0 100% 0)", y: 16 });
      const play = () => {
        if (section.dataset.reveal !== "pending") return;
        section.dataset.reveal = "shown";
        gsap.to(blocks, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 0.7, ease: EASE.settle, stagger: 0.12, clearProps: "clipPath,transform" });
      };
      const st = ScrollTrigger.create({ trigger: section, start: "top 75%", once: true, onEnter: play });
      // a reload or a deep link below the section: already past its start → reveal at once
      if (st.progress > 0 || st.isActive) play();
    }, section);
    queueRefresh();
    return () => {
      ctx.revert();
      delete section.dataset.reveal;
    };
  }, []);
  return null;
}
