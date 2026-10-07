"use client";

import { useSyncExternalStore } from "react";
import type { ProjectSlug } from "@/data/types";

/**
 * The journey's only global state (Spec §04): three fields, one tiny external store via
 * useSyncExternalStore so each subscriber selects one field. Animation progress never
 * lives here — it stays inside GSAP timelines.
 */

export type SectionId = "inicio" | "trabajo" | ProjectSlug | "capacidades" | "perfil" | "contacto";

export interface JourneyState {
  /** the opening reached O2: the header may fade in */
  heroRevealed: boolean;
  /** the section in view (header index, route sync, overlay highlight) */
  section: SectionId;
  /** the brief was delivered: the End sequence owns the screen, the header hides */
  endActive: boolean;
}

const initial: JourneyState = { heroRevealed: false, section: "inicio", endActive: false };

let state: JourneyState = initial;
const listeners = new Set<() => void>();

/** idempotent: a patch that changes nothing notifies nobody */
export function setJourney(patch: Partial<JourneyState>) {
  let changed = false;
  for (const k of Object.keys(patch) as (keyof JourneyState)[]) {
    if (state[k] !== patch[k]) {
      changed = true;
      break;
    }
  }
  if (!changed) return;
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getJourney(): JourneyState {
  return state;
}

export function subscribeJourney(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useJourney<T>(selector: (s: JourneyState) => T): T {
  return useSyncExternalStore(
    subscribeJourney,
    () => selector(state),
    () => selector(initial),
  );
}

/** tests only */
export function resetJourney() {
  state = initial;
}
