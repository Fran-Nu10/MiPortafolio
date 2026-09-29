"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;
export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

/** The two curves of the grammar, plus the product curve for rotate/scale. */
export const EASE = {
  /** mechanical: discrete ticks */
  snap: (n = 4) => `steps(${n})`,
  /** coming to rest */
  settle: "cubic-bezier(0.22, 1, 0.36, 1)",
  /** rotate & scale into product */
  product: "cubic-bezier(0.7, 0, 0.2, 1)",
  linear: "none",
} as const;

export const DUR = {
  drawOn: 0.4,
  fill: 0.8,
  assemble: 0.5,
  rotate: 1.1,
  settle: 0.6,
  inspect: 0.25,
  ghost: 0.12,
} as const;

/** Isometric camera used for every construction state (true isometric, no perspective distortion). */
export const ISO = { rotateX: 54.7, rotateZ: -45 } as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches;
}

export { gsap, ScrollTrigger };

/** the site's one layout breakpoint (Tailwind `md`): below it the compact layouts apply */
export const COMPACT_QUERY = "(max-width: 1023px)";
export const isCompact = () => typeof window !== "undefined" && window.matchMedia(COMPACT_QUERY).matches;
