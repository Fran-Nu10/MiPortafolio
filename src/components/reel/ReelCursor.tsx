"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

const FINE = "(hover: hover) and (pointer: fine)";
const RM = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const a = window.matchMedia(FINE);
  const b = window.matchMedia(RM);
  a.addEventListener("change", onChange);
  b.addEventListener("change", onChange);
  return () => {
    a.removeEventListener("change", onChange);
    b.removeEventListener("change", onChange);
  };
}
const enabledNow = () => window.matchMedia(FINE).matches && !prefersReducedMotion();

/**
 * The reel cursor (Spec §06, Revelado 2.2 §8): a 22px ring and one word — over the reel the
 * drag word, over the active card (frame and metadata: the whole card enters its project) "Ver",
 * over a neighbour an arrow toward it. Fine pointers
 * only, never on touch, never under reduced motion; an enhancement, never the only cue.
 * One fixed element moved by transform (gsap.quickTo), no React state per frame.
 */
export function ReelCursor({ viewportRef, labels }: { viewportRef: RefObject<HTMLDivElement | null>; labels: { drag: string; enter: string } }) {
  const enabled = useSyncExternalStore(subscribe, enabledNow, () => false);
  const elRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const el = elRef.current;
    const word = wordRef.current;
    if (!enabled || !viewport || !el || !word) return;
    viewport.dataset.cursor = "";
    const xTo = gsap.quickTo(el, "x", { duration: 0.08, ease: "none" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.08, ease: "none" });

    const labelFor = (target: HTMLElement | null): string => {
      if (viewport.hasAttribute("data-dragging")) return labels.drag;
      const li = target?.closest<HTMLElement>(".reel-item");
      if (!li) return labels.drag;
      const active = viewport.querySelector<HTMLElement>(".reel-item[data-active]");
      const i = Number(li.dataset.index);
      const a = Number(active?.dataset.index ?? 0);
      if (i === a) return target?.closest(".reel-piece") ? labels.enter : labels.drag;
      return i > a ? "→" : "←";
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      xTo(e.clientX);
      yTo(e.clientY);
      const text = labelFor(e.target as HTMLElement);
      if (word.textContent !== text) word.textContent = text;
    };
    const show = () => (el.dataset.visible = "");
    const hide = () => delete el.dataset.visible;
    viewport.addEventListener("pointermove", onMove);
    viewport.addEventListener("pointerenter", show);
    viewport.addEventListener("pointerleave", hide);
    return () => {
      delete viewport.dataset.cursor;
      viewport.removeEventListener("pointermove", onMove);
      viewport.removeEventListener("pointerenter", show);
      viewport.removeEventListener("pointerleave", hide);
    };
  }, [enabled, viewportRef, labels]);

  if (!enabled) return null;
  return (
    <div ref={elRef} className="reel-cursor" aria-hidden="true">
      <span className="reel-cursor-ring" />
      <span ref={wordRef} className="reel-cursor-word micro" />
    </div>
  );
}
