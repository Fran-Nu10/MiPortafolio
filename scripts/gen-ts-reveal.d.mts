// Types for scripts/gen-ts-reveal.mjs (imported by the unit tests).
export interface GeneratedFragment {
  id: string;
  group: number;
  x: number;
  y: number;
  word: string;
}
export const SEED: number;
export const P: number;
export const WORDS: string[];
export const GROUP_Z: number[];
export const VARIANTS: Record<
  "desktop" | "mobile",
  { w: number; h: number; groups: number[]; perGroup: number; camEnd: number; clear: { rx: number; ry: number }; margin: number }
>;
export function generate(): { desktop: GeneratedFragment[]; mobile: GeneratedFragment[] };
export function render(data: { desktop: GeneratedFragment[]; mobile: GeneratedFragment[] }): string;
