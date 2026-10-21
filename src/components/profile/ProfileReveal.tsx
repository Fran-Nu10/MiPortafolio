"use client";

import { useLayoutEffect } from "react";
import { EASE, ScrollTrigger, gsap, prefersReducedMotion, registerGsap } from "@/lib/motion";
import { queueRefresh } from "@/lib/useScene";

/**
 * Perfil's reveals on entry (Spec §12 Profile · Motion), one per group, each once: the declaration
 * and its explanation when the section's top reaches 75% of the viewport; Meta Ads' headline and its
 * paragraphs when their block's top reaches 82% (it sits well below the fold, so it reveals when the
 * visitor gets there, not before). Each block reveals as a whole — clip-path inset bottom 100% → 0
 * and y 16 → 0, 700 ms, settle, 120 ms stagger. Whole blocks only: the text is never split, so it
 * stays intact for assistive tech. Reduced motion and no JS: no reveal, the text is there.
 */
const GROUPS = [
  { host: "#perfil", blocks: ".profile-core, .profile-detail", start: "top 75%" },
  { host: "#perfil .profile-ads", blocks: ".profile-ads-title, .profile-ads-body", start: "top 82%" },
] as const;

export function ProfileReveal() {
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    registerGsap();
    const section = document.getElementById("perfil");
    if (!section) return;
    const hosts: HTMLElement[] = [];
    const ctx = gsap.context(() => {
      for (const g of GROUPS) {
        const host = document.querySelector<HTMLElement>(g.host);
        const blocks = host ? Array.from(section.querySelectorAll<HTMLElement>(g.blocks)) : [];
        if (!host || !blocks.length) continue;
        hosts.push(host);
        host.dataset.reveal = "pending";
        gsap.set(blocks, { clipPath: "inset(0 0 100% 0)", y: 16 });
        const play = () => {
          if (host.dataset.reveal !== "pending") return;
          host.dataset.reveal = "shown";
          gsap.to(blocks, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 0.7, ease: EASE.settle, stagger: 0.12, clearProps: "clipPath,transform" });
        };
        const st = ScrollTrigger.create({ trigger: host, start: g.start, once: true, onEnter: play });
        // a reload or a deep link below the block: already past its start → reveal at once
        if (st.progress > 0 || st.isActive) play();
      }
    }, section);
    queueRefresh();
    return () => {
      ctx.revert();
      for (const h of hosts) delete h.dataset.reveal;
    };
  }, []);
  return null;
}
