"use client";

import { useRef } from "react";
import { EASE } from "@/lib/motion";
import type { ResolvedAsset } from "@/lib/resolved";
import { useScene } from "@/lib/useScene";
import { BAND_INSET } from "@/lib/at-work";
import { Still } from "@/components/media/Still";

/**
 * S7 · Human moment (Spec §02, §13). Silent: no copy, aria-hidden, alt empty. A 120svh section
 * with a sticky 100svh frame; the image sits in a clip-path window that opens from a centered
 * horizontal band to full over the first half of the pass (the opening's aperture grammar) and
 * closes to black over the last 30%. No pin, no state, no store writes. Reduced motion: the
 * image shown full, no aperture. Rendered only behind `features.humanMoment`.
 */
export function HumanMoment({ media }: { media: ResolvedAsset }) {
  const frameRef = useRef<HTMLDivElement>(null);

  useScene(frameRef, {
    id: "human-moment",
    pin: false,
    snap: false,
    units: 1,
    build: (api) => {
      if (api.rm) return null;
      const win = api.q('[data-part="window"]')[0];
      const tl = api.gsap.timeline({ defaults: { ease: EASE.none } });
      tl.addLabel("s:BAND", 0);
      tl.fromTo(win, { clipPath: `inset(${BAND_INSET}% 0% ${BAND_INSET}% 0%)` }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, immediateRender: true }, 0);
      tl.addLabel("s:OPEN", 0.5);
      tl.to(win, { clipPath: "inset(50% 0% 50% 0%)", duration: 0.3 }, 0.7);
      tl.addLabel("s:CLOSED", 1);
      return tl;
    },
  });

  return (
    <section aria-hidden="true" className="moment" data-moment="human">
      <div ref={frameRef} data-part="frame" data-anim="" className="moment-frame">
        <div data-part="window" className="moment-window">
          <Still asset={media} sizes="100vw" fill />
        </div>
      </div>
    </section>
  );
}
