/**
 * Opening → Hero helpers (Spec §02 S1). Pure, so the timing rules are unit tested; the scene
 * itself lives in components/opening/OpeningHero.tsx.
 */

/** O1: the light band is a 14vh window — clip-path inset 43% top and bottom of a 100svh stage */
export const BAND_INSET = 43;

export const OPENING = {
  /** O0 holds black + grain before the band opens (s) */
  hold: 0.3,
  /** O0 → O1 band opening (s) */
  band: 0.9,
  /** O2 cross-fade LQIP → sharp (s) */
  focus: 0.6,
  /** O2 completes with the LQIP if the portrait has not decoded by then (ms after first paint) */
  decodeDeadline: 2500,
  /** without a built scene, CSS shows the static hero after this (ms) — never a dead black screen */
  rescue: 4000,
} as const;

/** units per gesture: O2 → O3 → H1 → H2, plus a short hold before the scene unpins */
export const HERO_UNITS = 3.25;
/** reduced motion: two states (portrait → names + copy), then a short hold */
export const HERO_UNITS_RM = 1;

export const inset = (pct: number) => `inset(${pct}% 0% ${pct}% 0%)`;

/** the top inset (%) of a computed `clip-path: inset(…)`, or null */
export function parseInsetTop(clipPath: string | null | undefined): number | null {
  const m = /inset\(\s*(-?[\d.]+)%/.exec(clipPath ?? "");
  return m ? Number(m[1]) : null;
}

/**
 * The mobile crop stacks each name in two lines: FRA / NCO above, NÚ / ÑEZ below
 * (Revelado 2.2 §6). Split at floor(length / 2), by code points.
 */
export function splitName(word: string): [string, string] {
  const chars = Array.from(word.normalize("NFC"));
  const i = Math.floor(chars.length / 2);
  return [chars.slice(0, i).join(""), chars.slice(i).join("")];
}

/**
 * O2 · focus. Resolves the race between the portrait's `decode()` and the 2.5 s deadline:
 * - decoded before the deadline → `focus(true)` (cross-fade to the sharp image)
 * - deadline first → `focus(false)` (O2 completes on the LQIP), then `sharp()` when decode resolves
 * - decode fails → `focus(false)` at once; the LQIP / poster stays (Spec §24)
 * Returns a cancel function.
 */
export function focusWhenReady(
  decode: Promise<unknown>,
  deadlineMs: number,
  on: { focus: (sharp: boolean) => void; sharp: () => void },
  timers: { set: (fn: () => void, ms: number) => unknown; clear: (id: unknown) => void } = {
    set: (fn, ms) => setTimeout(fn, ms),
    clear: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
  },
): () => void {
  let done = false;
  let cancelled = false;
  const timer = timers.set(() => {
    if (done || cancelled) return;
    done = true;
    on.focus(false);
  }, Math.max(0, deadlineMs));
  decode.then(
    () => {
      if (cancelled) return;
      if (!done) {
        done = true;
        timers.clear(timer);
        on.focus(true);
      } else on.sharp();
    },
    () => {
      if (cancelled || done) return;
      done = true;
      timers.clear(timer);
      on.focus(false);
    },
  );
  return () => {
    cancelled = true;
    timers.clear(timer);
  };
}
