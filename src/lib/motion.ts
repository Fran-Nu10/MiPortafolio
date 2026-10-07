"use client";

import { useSyncExternalStore } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { RM_QUERY } from "./tiers";

/**
 * Motion foundation (Spec §05, §16): one GSAP registration, the Revelado ease tokens and the
 * motion/pointer preferences. Tiers, gesture length and label snapping are pure helpers in
 * `lib/tiers.ts`.
 */

let registered = false;
export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  ScrollTrigger.config({ ignoreMobileResize: true });
  // GSAP does not parse cubic-bezier() strings: the two Revelado curves are named eases
  CustomEase.create("settle", "0.22,1,0.36,1");
  CustomEase.create("reveal", "0.65,0,0.35,1");
  // development only: QA scripts inspect the triggers
  if (process.env.NODE_ENV !== "production") Object.assign(window, { __ST: ScrollTrigger, __gsap: gsap });
  registered = true;
}

/** Ease tokens (Spec §05). CSS mirrors settle/reveal as --ease-settle / --ease-reveal. */
export const EASE = {
  /** arrivals */
  settle: "settle",
  /** aperture, contrast reveals */
  reveal: "reveal",
  /** camera retreat, accelerating (TS reveal) */
  dolly: "power2.in",
  /** snap-to-grid (TS trip) */
  steps: (n = 4) => `steps(${n})`,
  /** scrub-linked camera */
  none: "none",
} as const;

/** Absolute durations, only for time-based sequences (opening, End, reel snap). Seconds. */
export const DUR = {
  reelSettle: 0.42,
  metaSwap: 0.24,
  reveal: 0.6,
  name: 0.8,
} as const;

// ── preferences ──────────────────────────────────────────────────────────────

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(RM_QUERY).matches;
}

/** pointer type via media queries, never user-agent sniffing (Spec §15) */
export function isFinePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return !isFinePointer();
}

function subscribeRm(onChange: () => void) {
  const mq = window.matchMedia(RM_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** reduced-motion preference as React state (server snapshot: false = full motion markup) */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeRm, prefersReducedMotion, () => false);
}

export { gsap, ScrollTrigger };
