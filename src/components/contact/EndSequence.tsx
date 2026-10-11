"use client";

import { useLayoutEffect, useRef } from "react";
import { setJourney } from "@/lib/journey-store";
import { gsap, prefersReducedMotion, registerGsap } from "@/lib/motion";

/** the End's timing (Spec §02 S16), seconds */
export const END_T = { hold: 1.2, dim: 0.8, black: 0.4, name: 0.6 } as const;

/**
 * S16 · End (Spec §02). Triggered by the form's success (a 2xx from Resend), never by scroll.
 * "Brief recibido." (mono, paper on black) holds 1.2 s → the red signal dims to 0 over 800 ms
 * → full black 400 ms → FRANCO NÚÑEZ reveals in 600 ms. No other text; the header hides
 * (store `endActive`); focus moves to the status node. Reduced motion: the same states as
 * instant swaps with 1.2 s holds. Without JavaScript the server returns this block statically:
 * both lines visible, nothing animates.
 */
export function EndSequence({ success, name }: { success: string; name: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    setJourney({ endActive: true });
    registerGsap();
    const rm = prefersReducedMotion();
    const status = root.querySelector<HTMLElement>('[data-part="status"]')!;
    const signal = root.querySelector<HTMLElement>('[data-part="signal"]')!;
    const nameEl = root.querySelector<HTMLElement>('[data-part="name"]')!;
    root.dataset.endStep = "received";
    const ctx = gsap.context(() => {
      gsap.set(nameEl, { opacity: 0 });
      gsap.set(status, { opacity: 1 });
      gsap.set(signal, { opacity: 1 });
      const tl = gsap.timeline();
      // the red dims (and the line with it) → black
      tl.to(signal, { opacity: 0, duration: rm ? 0 : END_T.dim, ease: "none" }, END_T.hold);
      tl.to(status, { opacity: 0, duration: rm ? 0 : END_T.dim, ease: "none" }, END_T.hold);
      tl.call(() => (root.dataset.endStep = "dark"), [], END_T.hold + (rm ? 0 : END_T.dim));
      const nameAt = END_T.hold + (rm ? END_T.hold : END_T.dim + END_T.black);
      tl.to(nameEl, { opacity: 1, duration: rm ? 0 : END_T.name, ease: "none" }, nameAt);
      tl.call(() => (root.dataset.endStep = "name"), [], nameAt + (rm ? 0 : END_T.name));
    }, root);
    root.scrollIntoView({ block: "start", behavior: "instant" });
    statusRef.current?.focus({ preventScroll: true });
    return () => {
      ctx.revert();
      delete root.dataset.endStep;
      setJourney({ endActive: false });
    };
  }, []);

  return (
    <div ref={rootRef} className="end" data-part="end">
      <p ref={statusRef} role="status" tabIndex={-1} className="end-status micro" data-part="status">
        <span className="end-signal" data-part="signal" aria-hidden="true" />
        {success}
      </p>
      <p className="end-name" aria-hidden="true" data-part="name">
        {name}
      </p>
    </div>
  );
}
