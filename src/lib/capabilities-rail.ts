import type { EvidenceElement, EvidenceSlotVariant } from "@/data/types";
import { GESTURE_VH, type Tier } from "./tiers";

/**
 * Capabilities rail (Spec §12), pure: the rail's geometry on lg/xl, the scroll ↔ rail mapping
 * (vertical scroll translates the rail horizontally, 1:1 in pixels once the rail is in), the
 * position that centers a card (keyboard focus on an off-screen card), the evidence loops'
 * cadence and the EvidenceSlot guard. No DOM, no GSAP.
 */

/** cards are equal width, min(420px, 30vw); gap 32px; the gap before 06 is 3× */
export const CARD_GAP = 32;
export const EXTENDED_GAP = CARD_GAP * 3;
export const cardWidth = (vw: number) => Math.min(420, 0.3 * vw);

export interface RailLayout {
  cardW: number;
  /** left edge of each card inside the rail (after its left gutter), index 0–5 */
  lefts: number[];
  /** the rail's full width: the left gutter plus the six cards and their gaps */
  railW: number;
  /** horizontal travel once the rail is in: x goes 0 → −overflow (Spec §12) */
  overflow: number;
}

export function railLayout(vw: number, gutter: number, count = 6, extendedAt = 5): RailLayout {
  const cardW = cardWidth(vw);
  const lefts: number[] = [];
  let x = gutter;
  for (let i = 0; i < count; i++) {
    if (i > 0) x += i === extendedAt ? EXTENDED_GAP : CARD_GAP;
    lefts.push(x);
    x += cardW;
  }
  const railW = x;
  return { cardW, lefts, railW, overflow: Math.max(0, railW - vw + gutter) };
}

/**
 * The pin, in scroll pixels: SEAM_LEN of a viewport for the bust seam (the bust appears at the
 * start, holds, then slides out left as the rail enters over the seam's second half), then the
 * rail's own overflow, 1:1 with the scroll. The seam was a full viewport until docs/23 §3.2: with
 * only the bust and one line on screen it read as a dead stretch, so it is now 0.6 of one.
 */
export const SEAM_LEN = 0.6;
export const seamPx = (vh: number) => SEAM_LEN * vh;
export const SEAM_IN = 0.12;
export const RAIL_ENTER_AT = 0.5;
export function railPinPx(vh: number, overflow: number): number {
  return seamPx(vh) + overflow;
}

/** the pin's length in gestures, for `useScene` (its length is units × GESTURE_VH[tier]) */
export function railUnits(vh: number, overflow: number, tier: Tier): number {
  return railPinPx(vh, overflow) / ((vh * GESTURE_VH[tier]) / 100);
}

/** the rail's x at a scroll offset `s` (px from the pin start), vw/vh the viewport */
export function railX(s: number, vw: number, vh: number, gutter: number, overflow: number): number {
  const seam = seamPx(vh);
  const enterStart = RAIL_ENTER_AT * seam;
  const off = vw - gutter;
  if (s <= enterStart) return off;
  if (s < seam) return off * (1 - (s - enterStart) / (seam - enterStart));
  return -Math.min(overflow, s - seam) || 0;
}

/**
 * The scroll position at which a card is centered in the viewport (focus on an off-screen
 * card, Spec §12 keyboard rule), clamped to the rail's 1:1 stretch. `left` is the card's left
 * edge inside the rail (its gutter included).
 */
export function cardScroll(pinStart: number, vw: number, vh: number, overflow: number, left: number, cardW: number): number {
  const x = vw / 2 - left - cardW / 2;
  const seam = seamPx(vh);
  const s = seam - x;
  return pinStart + Math.min(overflow, Math.max(0, s - seam)) + seam;
}

/** the stretch of scroll (px from the pin start) over which card 05's layers separate: the card's travel across the viewport's right half */
export function separationWindow(vw: number, vh: number, overflow: number, left: number, cardW: number): { from: number; to: number } {
  // s at which the card is fully inside the right edge: left + cardW + x(s) = vw → x = vw − left − cardW
  const seam = seamPx(vh);
  const from = seam + Math.max(0, left + cardW - vw);
  const to = Math.min(seam + overflow, from + vw / 2);
  return { from, to: Math.max(to, from + 1) };
}

// ── evidence loops ───────────────────────────────────────────────────────────

export type EvidenceId = EvidenceElement["element"];

/** steps and cadence of each time-based loop (Spec §12 table); the rayo layers scrub on the rail */
export const EVIDENCE_CYCLE: Record<EvidenceId, { steps: number; every: number }> = {
  "ts-flow": { steps: 3, every: 1600 },
  posters: { steps: 3, every: 2000 },
  "chef-commerce": { steps: 3, every: 1600 },
  "ts-extraction": { steps: 4, every: 1400 },
  "rayo-layers": { steps: 2, every: 1800 },
};

/** reduced motion: every evidence element shows its final state as a still */
export const finalStep = (id: EvidenceId) => EVIDENCE_CYCLE[id].steps - 1;

export const nextStep = (id: EvidenceId, step: number) => (step + 1) % EVIDENCE_CYCLE[id].steps;

/**
 * EvidenceSlot guard (Spec §12): a material variant renders only when every file is real and,
 * for a campaign, each metric is authorized with a source; in production anything unproven
 * falls back to `typographic` — never a placeholder.
 */
export function resolveEvidence(
  evidence: EvidenceSlotVariant,
  allReal: boolean,
  production: boolean,
): EvidenceSlotVariant {
  if (evidence.variant === "typographic") return evidence;
  if (!allReal) return production ? { variant: "typographic", tag: "" } : evidence;
  if (evidence.variant === "campaign") {
    const metrics = evidence.metrics.filter((m) => m.authorized && m.source);
    return { ...evidence, metrics };
  }
  return evidence;
}
