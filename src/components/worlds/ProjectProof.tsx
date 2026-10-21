"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useJourney } from "@/lib/journey-store";
import { EASE, gsap, prefersReducedMotion, registerGsap, ScrollTrigger } from "@/lib/motion";
import { REEL_SIZES } from "@/lib/reel";
import { chapterAt } from "@/lib/ts-world";
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
  /** «← Trabajo»: back to the reel of the home journey (a case is its own document, docs/25) */
  back?: { href: string; label: string };
  tone: "paper-on-black" | "ink-on-paper";
  /** the window keeps the reel geometry of its project */
  aspect: { desktop: [number, number]; mobile: [number, number] };
  /** chapter labels over the recording ("TravelChat · CRM · IA"), switched by its time */
  chapters?: { label: string; at: number }[];
  /** preload staged by the world: none → metadata (world active) → auto (from TS09) */
  stagedPreload?: boolean;
  /** TS12: the red field closes in from the viewport edges toward the next world */
  exit?: "seam";
}

/** the TS reveal states from which the recording may load in full */
const DEEP_STATES = new Set(["TS09a", "TS09b"]);

/** the seam's red plane: a full-viewport rect with a hole `inset` % from each edge (evenodd) */
const seamClip = (inset: number) => {
  const a = inset;
  const b = 100 - inset;
  return `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${a}% ${a}%, ${a}% ${b}%, ${b}% ${b}%, ${b}% ${a}%, ${a}% ${a}%)`;
};

/**
 * S4/S6/S9/S11 · Proof (Spec §02 proof sheet). Real media of the real product + the micro case +
 * the two CTAs. The window sits at the reel geometry (the shared rectangle), centered in its
 * stage; it scales .9 → 1 over the first 40% of its pass and dims to .55 over the last 30%
 * (the generic exit; TS → Rayo's red seam is TS12, Phase 5). Normal flow: nothing pins.
 */
export function ProjectProof({ proof }: { proof: ProofView }) {
  const ref = useRef<HTMLElement>(null);
  const h = `${proof.id}-proof-h`;
  const section = useJourney((st) => st.section);
  const [deep, setDeep] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [failed, setFailed] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);
  const chapters = proof.chapters && proof.media.status !== "placeholder" && !failed ? proof.chapters : null;

  // the world says when the recording may load: its reveal (TS09) → auto (Spec §08 preload)
  useEffect(() => {
    if (!proof.stagedPreload) return;
    const world = document.getElementById(proof.id);
    if (!world) return;
    const check = () => {
      if (DEEP_STATES.has(world.dataset.state ?? "")) setDeep(true);
    };
    check();
    const mo = new MutationObserver(check);
    mo.observe(world, { attributes: true, attributeFilter: ["data-state"] });
    return () => mo.disconnect();
  }, [proof.stagedPreload, proof.id]);
  const preload = proof.stagedPreload ? (deep ? "auto" : section === proof.id ? "metadata" : "none") : undefined;

  useLayoutEffect(() => {
    registerGsap();
    const root = ref.current;
    const stage = root?.querySelector<HTMLElement>('[data-part="stage"]');
    const win = root?.querySelector<HTMLElement>('[data-part="window"]');
    if (!root || !stage || !win || prefersReducedMotion()) return;
    const seam = root.querySelector<HTMLElement>('[data-part="seam"]');
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: EASE.none } });
      tl.fromTo(win, { scale: 0.9 }, { scale: 1, duration: 0.4 }, 0);
      tl.fromTo(win, { opacity: 1 }, { opacity: 0.55, duration: 0.3, immediateRender: false }, 0.7);
      ScrollTrigger.create({ trigger: stage, start: "top bottom", end: "bottom top", scrub: 0.6, animation: tl });
      if (seam) {
        // TS12 · over the last 30% of the proof's pass the red field closes in from the edges;
        // the next world's stage then rises over it (no black flash, no cut)
        const red = gsap.timeline({ defaults: { ease: EASE.none } });
        red.fromTo(seam, { clipPath: seamClip(0) }, { clipPath: seamClip(50), duration: 0.3 }, 0.7);
        const show = (p: number) => gsap.set(seam, { autoAlpha: p > 0.7 && p < 1 ? 1 : 0 });
        ScrollTrigger.create({
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
          animation: red,
          onUpdate: (self) => show(self.progress),
          onRefresh: (self) => show(self.progress),
        });
      }
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
      data-exit={proof.exit}
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
        {chapters ? (
          <ol className="proof-chapters micro" aria-label={proof.videoLabel}>
            {chapters.map((c, i) => (
              <li key={c.label} aria-current={i === chapter ? "true" : undefined}>
                {c.label}
              </li>
            ))}
          </ol>
        ) : null}
        <div className="proof-window" data-part="window">
          <ProofMedia
            asset={proof.media}
            label={proof.videoLabel}
            sizes={REEL_SIZES}
            preload={preload}
            onTime={chapters ? (t) => setChapter(chapterAt(chapters, t)) : undefined}
            onFail={onFail}
          />
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
          {proof.back ? (
            <a href={proof.back.href} className="link">
              {proof.back.label}
            </a>
          ) : null}
          <a href={proof.next.href} className="link">
            {proof.next.label}
          </a>
        </p>
      </div>
      {proof.exit === "seam" ? <div className="proof-seam" data-part="seam" aria-hidden="true" /> : null}
    </section>
  );
}
