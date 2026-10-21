"use client";

import { useEffect, useRef, useState } from "react";
import type { EvidenceSlotVariant } from "@/data/types";
import { EASE, gsap, prefersReducedMotion, usePrefersReducedMotion } from "@/lib/motion";
import type { ResolvedAsset } from "@/lib/resolved";
import { getScene, useScene } from "@/lib/useScene";
import { RAIL_ENTER_AT, cardScroll, railUnits, seamPx, separationWindow } from "@/lib/capabilities-rail";
import { Cutout } from "@/components/media/Cutout";
import { EvidenceElement, type EvidenceData } from "./EvidenceElement";
import { EvidenceSlot } from "./EvidenceSlot";

export interface CapabilityCardView {
  index: number;
  name: string;
  statement: string;
  group: "core" | "extended";
  attribution: { label: string; href?: string };
  /** a live element reused from a world, or a resolved material / typographic variant */
  evidence: { kind: "element"; data: EvidenceData } | { kind: "slot"; variant: EvidenceSlotVariant; media: ResolvedAsset[] };
}

export interface CapabilitiesView {
  heading: string;
  seam: string;
  kicker: string;
  subKicker: string;
  bust: ResolvedAsset;
  items: CapabilityCardView[];
}

const ID = "capacidades";
const gutterOf = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gutter")) || 16;

/**
 * S12 · Capabilities with the bust seam (Spec §12). On lg/xl the section pins and vertical
 * scroll drives the rail horizontally (scrub 0.8, no snap): the seam fills the first viewport
 * (bust and line appear at the pin start), then the bust slides out left as the rail enters,
 * and the rail travels 1:1 with the scroll. Tablets, phones, reduced motion and no JS: the
 * same list stacked in flow, no pin. Evidence loops run only while their card is in view and,
 * on the rail, while the pin is active; reduced motion shows their final states.
 */
export function CapabilitiesRail({ view }: { view: CapabilitiesView }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const measured = useRef({ vh: 0, overflow: 0 });
  const rm = usePrefersReducedMotion();
  const [pinActive, setPinActive] = useState(false);
  const [built, setBuilt] = useState(false);
  const [inView, setInView] = useState<Record<number, boolean>>({});

  useScene(stageRef, {
    id: ID,
    pin: "sticky",
    snap: false,
    scrub: 0.8,
    units: (tier) => railUnits(measured.current.vh, measured.current.overflow, tier),
    onToggle: setPinActive,
    build: (api) => {
      // the rail exists only on lg/xl with motion and a pin; everything else is the stacked list
      if (!api.depth || !api.pinned) {
        measured.current = { vh: 0, overflow: 0 };
        api.root.removeAttribute("data-rail");
        return null;
      }
      const { gsap, q, root } = api;
      const seam = q('[data-part="seam"]')[0];
      const kicker = q('[data-part="kicker"]')[0];
      const rail = q('[data-part="rail"]')[0];
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const g = gutterOf();
      root.setAttribute("data-rail", "");
      // measured in the rail layout (set by CSS from first paint on these tiers)
      const railW = rail.scrollWidth;
      const overflow = Math.max(0, railW - vw + g);
      measured.current = { vh, overflow };
      api.onRevert(() => root.removeAttribute("data-rail"));
      api.onRevert(() => setBuilt(false));
      setBuilt(true);

      // the timeline runs in scroll pixels: one viewport of seam, then the overflow, 1:1
      const tl = gsap.timeline({ defaults: { ease: EASE.none } });
      tl.addLabel("s:SEAM", 0);
      // the bust arrives while the section rises into view (its own scrub, inside this build's
      // context, reverted with it): the pin starts on it, never on an empty black frame (docs/25 §5)
      gsap.fromTo(
        seam,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, ease: EASE.settle, immediateRender: true, scrollTrigger: { trigger: root, start: "top 85%", end: "top 20%", scrub: 0.8 } },
      );
      const seamLen = seamPx(vh);
      const enterAt = RAIL_ENTER_AT * seamLen;
      const enterDur = seamLen - enterAt;
      tl.to(seam, { x: -0.5 * vw, opacity: 0, duration: enterDur }, enterAt);
      // placed after time 0: their start states must render now, or the kicker and the rail
      // would show in place until the playhead reaches them
      tl.fromTo(kicker, { opacity: 0 }, { opacity: 1, duration: enterDur * 0.6, ease: EASE.settle, immediateRender: true }, enterAt + enterDur * 0.2);
      tl.fromTo(rail, { x: vw - g }, { x: 0, duration: enterDur, immediateRender: true }, enterAt);
      tl.addLabel("s:RAIL", seamLen);
      tl.to(rail, { x: -overflow, duration: Math.max(1, overflow) }, seamLen);

      // 05: the layers separate with the rail's own scroll (the only scroll-tied evidence)
      const five = q('[data-capability="5"]')[0];
      const el = five?.querySelector<HTMLElement>('[data-evidence-el="rayo-layers"]');
      if (five && el) {
        const w = separationWindow(vw, vh, overflow, five.offsetLeft, five.offsetWidth);
        tl.fromTo(el, { "--sep": 0 }, { "--sep": 1, duration: w.to - w.from }, w.from);
      }
      return tl;
    },
  });

  // evidence lifecycle: one observer for all cards (≥ 50% visible)
  useEffect(() => {
    const root = sectionRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-capability]"));
    const io = new IntersectionObserver(
      (entries) => {
        setInView((prev) => {
          const next = { ...prev };
          for (const e of entries) next[Number((e.target as HTMLElement).dataset.capability)] = e.isIntersecting && e.intersectionRatio >= 0.5 - 1e-3;
          return next;
        });
      },
      { threshold: [0, 0.5] },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  // keyboard: focus inside an off-screen card scrolls the rail so the card is centered. The scroll is
  // driven frame by frame (settle, 0.5 s) rather than by a native smooth scrollTo: WebKit dropped the
  // native one when it followed a programmatic jump within ~1 s. Instant under reduced motion.
  useEffect(() => {
    const rail = sectionRef.current?.querySelector<HTMLElement>('[data-part="rail"]');
    if (!rail) return;
    let tween: gsap.core.Tween | null = null;
    const onFocus = (e: FocusEvent) => {
      const card = (e.target as Element).closest<HTMLElement>("[data-capability]");
      const scene = getScene(ID);
      if (!card || !scene || !measured.current.vh) return;
      const r = card.getBoundingClientRect();
      if (r.left >= 0 && r.right <= window.innerWidth) return;
      const top = cardScroll(scene.trigger.start, window.innerWidth, measured.current.vh, measured.current.overflow, card.offsetLeft, card.offsetWidth);
      tween?.kill();
      if (prefersReducedMotion()) {
        window.scrollTo(0, top);
        return;
      }
      const pos = { y: window.scrollY };
      let written = pos.y;
      tween = gsap.to(pos, {
        y: top,
        duration: 0.5,
        ease: EASE.settle,
        onUpdate: () => {
          // anything else moved the page (a click into a world, the visitor's own scroll): yield to it
          if (Math.abs(window.scrollY - written) > 2) return tween?.kill();
          written = Math.round(pos.y);
          window.scrollTo(0, pos.y);
        },
      });
    };
    rail.addEventListener("focusin", onFocus);
    return () => {
      tween?.kill();
      rail.removeEventListener("focusin", onFocus);
    };
  }, []);

  const core = view.items.filter((c) => c.group === "core");
  const extended = view.items.filter((c) => c.group === "extended");
  const running = (index: number) => !!inView[index] && (!built || pinActive);

  return (
    <section ref={sectionRef} id={ID} aria-labelledby="capacidades-h" data-section={ID} className="capabilities">
      <h2 id="capacidades-h" className="sr-only">
        {view.heading}
      </h2>
      {/* the stage's pin on lg/xl: as tall as the stage plus the rail's length (set by the scene) */}
      <div data-part="pin" className="capabilities-pin">
        <div ref={stageRef} data-part="stage" data-anim="" data-scene-root="" className="capabilities-stage">
          <figure className="seam" data-part="seam">
            <div className="seam-bust">
              <Cutout asset={view.bust} />
            </div>
            <p className="micro muted seam-line">{view.seam}</p>
          </figure>
          <p className="micro muted capabilities-kicker" data-part="kicker">
            {view.kicker}
          </p>
          <ol className="capabilities-list" data-part="rail">
            {core.map((c) => (
              <CapabilityCard key={c.index} c={c} running={running(c.index)} rm={rm} scrub={built} />
            ))}
            {extended.map((c, i) => (
              <CapabilityCard key={c.index} c={c} subKicker={i === 0 ? view.subKicker : undefined} running={running(c.index)} rm={rm} scrub={built} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function CapabilityCard({ c, subKicker, running, rm, scrub }: { c: CapabilityCardView; subKicker?: string; running: boolean; rm: boolean; scrub: boolean }) {
  const variant = c.evidence.kind === "element" ? "element" : c.evidence.variant.variant;
  return (
    <li className="capability" data-capability={c.index} data-group={c.group} data-evidence={variant}>
      {/* the extended capability is set apart by space and the sub-kicker, nothing else */}
      {subKicker ? <p className="micro muted capability-sub">{subKicker}</p> : null}
      <article>
        {/* level 1: the capability (its number is CSS, not text) · level 2: what it is for · level 3: its evidence, in a region of its own · level 4: the reference */}
        <h3 className="capability-name">{c.name}</h3>
        <p className="capability-statement">{c.statement}</p>
        <div aria-hidden="true" className="capability-evidence">
          {c.evidence.kind === "element" ? (
            <EvidenceElement data={c.evidence.data} running={running} rm={rm} scrub={scrub} />
          ) : (
            <EvidenceSlot evidence={c.evidence.variant} media={c.evidence.media} />
          )}
        </div>
        {c.attribution.href ? (
          <a href={c.attribution.href} className="micro muted link capability-attr">
            {c.attribution.label}
          </a>
        ) : (
          <p className="micro muted capability-attr">{c.attribution.label}</p>
        )}
      </article>
    </li>
  );
}
