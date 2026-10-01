"use client";

import { useEffect, useState } from "react";
import { useSystem } from "@/lib/store";

/** Hard ceiling: the visitor is never held longer than this, ready or not. */
const CEILING_MS = 900;

/**
 * 00 · Preloader. Not a loading animation: the same physical world as the hero —
 * empty frame, dot grid, counter at 00 / 06 — and the first part arriving exactly where
 * the hero's frontal part sits. It leaves the moment the site is actually ready
 * (fonts loaded + the opening scene built and measured), with a hard ceiling.
 * It leaves with a snap, no fade: underneath is the same frame with the same part in
 * the same place, so the hero simply *is* the next state.
 */
export function Preloader() {
  const sceneReady = useSystem((s) => s.ready);
  const [fontsReady, setFontsReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let alive = true;
    const t = window.setTimeout(() => alive && setTimedOut(true), CEILING_MS);
    if (document.fonts?.ready) document.fonts.ready.then(() => alive && setFontsReady(true));
    else window.setTimeout(() => alive && setFontsReady(true), 0);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, []);

  if ((sceneReady && fontsReady) || timedOut) return null;

  return (
    <div aria-hidden="true" className="fixed inset-0 z-[60] bg-graphite">
      <div className="dot-grid absolute inset-0" />
      {/* the frame */}
      <div className="absolute" style={{ inset: "var(--frame-inset)", top: "calc(var(--frame-inset) + 16px)", border: "1px solid var(--hairline)" }}>
        {/* the first part — same box and centring as the hero bench (Opening.tsx) */}
        <div className="absolute right-[-10%] top-[46%] h-[54%] w-[120%] md:right-[2%] md:top-[4%] md:h-[92%] md:w-[46%]">
          <div className="t-mono absolute left-[12%] top-0 text-bone-3 md:left-0">Part 01 · interface · frontal</div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.62] sm:scale-[0.85] md:scale-100">
            <div className="relative" style={{ width: 420, height: 260 }}>
              <div className="pl-outline absolute inset-0 border border-bone" />
              <div className="pl-fill absolute inset-[1px] bg-paper" />
            </div>
          </div>
        </div>
      </div>
      {/* the header strip, identical to Frame at step 0 */}
      <div
        className="t-mono absolute flex items-center justify-between"
        style={{ left: "var(--frame-inset)", right: "var(--frame-inset)", top: "calc(var(--frame-inset) - 16px)", color: "var(--bone-3)" }}
      >
        <div className="flex items-center gap-5">
          <span style={{ color: "var(--bone)", fontWeight: 500 }}>FN</span>
          <span className="hidden sm:inline">00 — Preloader</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-block h-2 w-2 bg-orange" />
          <span style={{ color: "var(--bone)" }}>Assembling</span>
          <span>00 / 06</span>
        </div>
        <div className="hidden md:block">part 01 arriving</div>
      </div>
    </div>
  );
}
