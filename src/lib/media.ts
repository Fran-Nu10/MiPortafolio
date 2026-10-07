"use client";

import type { Tier } from "./tiers";

/**
 * Media lifecycle helpers (Spec §17): the one-active registry for decorative loops and the
 * low-bandwidth probe. Module-level, no React state.
 */

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

/** Save-Data on, or a 2G-class connection. Absent API → normal. Never blocks. */
export function isSaveData(): boolean {
  if (typeof navigator === "undefined") return false;
  const c = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (!c) return false;
  return c.saveData === true || c.effectiveType === "slow-2g" || c.effectiveType === "2g";
}

/** desktop vs mobile source, chosen in JS at mount (not by <source media>) */
export function mediaTierFor(tier: Tier): "desktop" | "mobile" {
  return tier === "sm" ? "mobile" : "desktop";
}

let active: HTMLVideoElement | null = null;

/**
 * At most one decorative loop plays at a time. Claiming playback pauses whichever loop
 * held it; releasing clears it only if the caller still holds it.
 */
export function claimPlayback(video: HTMLVideoElement) {
  if (active && active !== video) active.pause();
  active = video;
}

export function releasePlayback(video: HTMLVideoElement) {
  if (active === video) active = null;
}

/** playing videos in the document (QA assertion: never more than one decorative loop) */
export function countPlaying(): number {
  if (typeof document === "undefined") return 0;
  return Array.from(document.querySelectorAll("video")).filter((v) => !v.paused && !v.ended).length;
}
