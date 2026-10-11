"use client";

import { useRef, useState, type CSSProperties } from "react";
import type { Rect01 } from "@/data/types";
import { useJourney } from "@/lib/journey-store";
import { EASE, usePrefersReducedMotion } from "@/lib/motion";
import type { ResolvedAsset } from "@/lib/resolved";
import { useScene } from "@/lib/useScene";
import { PHASE, atWorkUnits, frameEnd, frameStart, monitorHole, playAt, startPose } from "@/lib/at-work";
import { LoopVideo } from "@/components/media/LoopVideo";
import { ProofMedia } from "@/components/media/ProofMedia";
import { Placeholder } from "@/components/media/Placeholder";

const ID = "at-work";
const CENTERED: Rect01 = { x: 0.34, y: 0.3, w: 0.32, h: 0.34 };

/**
 * S14 · Franco at work (Spec §13). Decorative and silent: no copy. A pinned stage (200vh,
 * scrub 0.8, no snap) in which the frame — laid out at ≈ 95% of the viewport — starts as a
 * uniform scale + clip inset at its start size, grows to 95% over the first 60%, holds, then
 * the transition boundary: a black plane with a hole closes to the monitor (`monitorFocus`)
 * and the CTA starts in flow on black. The video (non-loop, plays once per entry, holds its
 * last frame) runs when the frame covers half the viewport; preload none → metadata when the
 * profile enters → auto at the pin start. Reduced motion: the frame at 95% as a still, a play
 * button when the video exists, the close is a cut. The placeholder (flat field, a lighter
 * monitor block, no imagery) runs the same timeline. Rendered only behind `features.francoAtWork`.
 */
export function FrancoAtWork({ media }: { media: ResolvedAsset }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const rm = usePrefersReducedMotion();
  const section = useJourney((s) => s.section);
  const [pinActive, setPinActive] = useState(false);
  const [big, setBig] = useState(false);
  const playFrom = useRef(1);
  const real = media.status !== "placeholder";
  const mf = media.meta.monitorFocus;
  const focus: { desktop: Rect01; mobile: Rect01 } = { desktop: mf?.desktop ?? CENTERED, mobile: mf?.mobile ?? mf?.desktop ?? CENTERED };

  useScene(stageRef, {
    id: ID,
    pin: "sticky",
    snap: false,
    scrub: 0.8,
    units: (tier, rm) => (rm ? 1 : atWorkUnits(tier)),
    onToggle: setPinActive,
    onUpdate: (p) => setBig(p >= playFrom.current),
    build: (api) => {
      const { gsap, q, tier } = api;
      const frame = q('[data-part="frame"]')[0];
      const plane = q('[data-part="monitor"]')[0];
      const f = tier === "sm" ? focus.mobile : focus.desktop;
      if (api.rm || !api.pinned) {
        // a still at 95%; the monitor close becomes a cut to the CTA
        gsap.set(frame, { clearProps: "transform,clipPath" });
        gsap.set(plane, { clipPath: monitorHole(f, 0), visibility: "hidden" });
        playFrom.current = 0;
        return null;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const start = frameStart(vw, vh, tier);
      const end = frameEnd(vw, vh, tier);
      const pose = startPose(start, end);
      playFrom.current = playAt(start, end, vw, vh);

      // the timeline runs 0–1 over the pin
      const tl = gsap.timeline({ defaults: { ease: EASE.none } });
      tl.addLabel("s:START", 0);
      tl.fromTo(frame, { scale: pose.scale, clipPath: `inset(${pose.inset[0]}px ${pose.inset[1]}px)` }, { scale: 1, clipPath: "inset(0px 0px)", duration: PHASE.grow, immediateRender: true }, 0);
      tl.addLabel("s:FULL", PHASE.grow);
      // visibility flips on when the close starts (and back off when it reverses)
      tl.fromTo(plane, { clipPath: monitorHole(f, 0), visibility: "hidden" }, { clipPath: monitorHole(f, 1), visibility: "visible", duration: 1 - PHASE.hold, immediateRender: true }, PHASE.hold);
      tl.addLabel("s:CLOSE", 1);
      return tl;
    },
  });

  const preload = pinActive ? "auto" : section === "perfil" || section === "contacto" ? "metadata" : "none";
  const vars = { "--mx": focus.desktop.x, "--my": focus.desktop.y, "--mw": focus.desktop.w, "--mh": focus.desktop.h, "--mx-m": focus.mobile.x, "--my-m": focus.mobile.y, "--mw-m": focus.mobile.w, "--mh-m": focus.mobile.h } as CSSProperties;

  return (
    <section aria-label="Franco trabajando" aria-hidden={real && rm ? undefined : true} className="at-work" data-moment="at-work" data-placeholder-media={real ? undefined : ""} style={vars}>
      <div data-part="pin" className="at-work-pin">
        <div ref={stageRef} data-part="stage" data-anim="" className="at-work-stage">
          <figure data-part="frame" className="at-work-frame">
            {!real ? (
              // the placeholder: a flat field, a 1px inner rule and a lighter monitor block — no text, no figure, no stock imagery
              <div className="at-work-ph">
                <Placeholder asset={media} fill />
                <div className="at-work-ph-monitor" data-part="monitor-block" />
              </div>
            ) : rm ? (
              <ProofMedia asset={media} label="Franco trabajando" sizes="95vw" />
            ) : (
              <LoopVideo asset={media} active={big && pinActive} loop={false} preload={preload} sizes="95vw" fill />
            )}
            {/* the transition boundary: black, with a hole around the monitor that closes over the rest */}
            <div data-part="monitor" className="at-work-monitor" />
          </figure>
        </div>
      </div>
    </section>
  );
}
