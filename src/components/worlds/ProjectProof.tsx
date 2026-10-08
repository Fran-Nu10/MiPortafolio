"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { EASE, gsap, prefersReducedMotion, registerGsap, ScrollTrigger } from "@/lib/motion";
import { REEL_SIZES } from "@/lib/reel";
import type { ResolvedAsset } from "@/lib/resolved";
import { ProofMedia } from "@/components/media/ProofMedia";

export interface ProofView {
  id: string;
  name: string;
  media: ResolvedAsset;
  videoLabel: string;
  caption: string;
  microCase: string;
  relationLine?: string;
  role: string;
  credit?: string;
  stack?: string;
  open?: { href: string; label: string; aria: string };
  next: { href: string; label: string };
  tone: "paper-on-black" | "ink-on-paper";
  /** the window keeps the reel geometry of its project */
  aspect: { desktop: [number, number]; mobile: [number, number] };
}

/**
 * S4/S6/S9/S11 · Proof (Spec §02 proof sheet). Real media of the real product + the micro case +
 * the two CTAs. The window sits at the reel geometry (the shared rectangle), centered in its
 * stage; it scales .9 → 1 over the first 40% of its pass and dims to .55 over the last 30%
 * (the generic exit; TS → Rayo's red seam is TS12, Phase 5). Normal flow: nothing pins.
 */
export function ProjectProof({ proof }: { proof: ProofView }) {
  const ref = useRef<HTMLElement>(null);
  const h = `${proof.id}-proof-h`;

  useLayoutEffect(() => {
    registerGsap();
    const root = ref.current;
    const stage = root?.querySelector<HTMLElement>('[data-part="stage"]');
    const win = root?.querySelector<HTMLElement>('[data-part="window"]');
    if (!root || !stage || !win || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: EASE.none } });
      tl.fromTo(win, { scale: 0.9 }, { scale: 1, duration: 0.4 }, 0);
      tl.fromTo(win, { opacity: 1 }, { opacity: 0.55, duration: 0.3, immediateRender: false }, 0.7);
      ScrollTrigger.create({ trigger: stage, start: "top bottom", end: "bottom top", scrub: 0.6, animation: tl });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      aria-labelledby={h}
      data-section={proof.id}
      data-proof={proof.id}
      data-tone={proof.tone}
      className="proof"
      style={
        {
          "--r-d": proof.aspect.desktop[0] / proof.aspect.desktop[1],
          "--r-m": proof.aspect.mobile[0] / proof.aspect.mobile[1],
          "--ar-d": `${proof.aspect.desktop[0]} / ${proof.aspect.desktop[1]}`,
          "--ar-m": `${proof.aspect.mobile[0]} / ${proof.aspect.mobile[1]}`,
        } as CSSProperties
      }
    >
      <h3 id={h} className="proof-name micro">
        {proof.name}
      </h3>
      <figure className="proof-figure" data-part="stage">
        <div className="proof-window" data-part="window">
          <ProofMedia asset={proof.media} label={proof.videoLabel} sizes={REEL_SIZES} />
        </div>
        <figcaption className="proof-caption">{proof.caption}</figcaption>
      </figure>
      <div className="proof-text">
        <p className="proof-case">{proof.microCase}</p>
        {proof.relationLine ? <p className="proof-case">{proof.relationLine}</p> : null}
        <p className="micro muted">{proof.role}</p>
        {proof.credit ? <p className="micro muted">{proof.credit}</p> : null}
        {proof.stack ? <p className="micro muted">{proof.stack}</p> : null}
        <p className="proof-links">
          {proof.open ? (
            <a href={proof.open.href} target="_blank" rel="noopener noreferrer" aria-label={proof.open.aria} className="link">
              {proof.open.label}
            </a>
          ) : null}
          <a href={proof.next.href} className="link">
            {proof.next.label}
          </a>
        </p>
      </div>
    </section>
  );
}
