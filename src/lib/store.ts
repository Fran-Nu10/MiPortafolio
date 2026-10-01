"use client";

import { useSyncExternalStore } from "react";

/**
 * The site's construction state. The frame (T0) and the counter read from it;
 * scenes write to it from their ScrollTriggers. One store, no dependency.
 */
export interface SystemState {
  /** 0–6 · the six-step counter shown in the header */
  step: number;
  /** what the counter is counting: "Assembling", "Launched", … */
  status: string;
  /** section label at the left of the header */
  section: string;
  /** right-hand note */
  note: string;
  /** frame opacity 0–1 (T0) */
  frame: number;
  /** grid opacity 0–1 (T0) */
  grid: number;
  /** ink on paper (Santi Nuca / Chef Arturo) vs bone on graphite */
  tone: "graphite" | "paper";
  /** build 05 · the visitor's brief once sent */
  brief: { name: string; what: string; kind: string } | null;
  /** the opening scene is built (fonts + layout measured) — the preloader may leave */
  ready: boolean;
}

const initial: SystemState = {
  step: 0,
  status: "Assembling",
  section: "00 — Preloader",
  note: "",
  frame: 1,
  grid: 1,
  tone: "graphite",
  brief: null,
  ready: false,
};

let state: SystemState = initial;
const listeners = new Set<() => void>();

export function setSystem(patch: Partial<SystemState>) {
  let changed = false;
  for (const k of Object.keys(patch) as (keyof SystemState)[]) {
    if (state[k] !== patch[k]) {
      changed = true;
      break;
    }
  }
  if (!changed) return;
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getSystem() {
  return state;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSystem<T>(selector: (s: SystemState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(initial));
}
