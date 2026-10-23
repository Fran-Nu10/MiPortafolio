/**
 * «Distintas disciplinas. Una sola visión.» (docs/27 §3, Content Master 25): one figure — nine
 * points — seen in three states, one per stage. Pensar: the points loose, joined by a free line (an
 * idea, still abstract). Diseñar: the same points on a 3 × 3 grid, joined by an orthogonal path
 * (structure). Construir: each point becomes a module and the nine make one solid block (a built,
 * stable form). The centre point is the accent in all three: the same decision, carried through.
 * Pure geometry in a 120 × 120 viewBox, shared by the server markup and the scene; nothing random.
 */

export const VISION_VIEWBOX = 120;

/** the grid's three lines, and the centre of each of its nine cells */
export const GRID_LINES = [24, 60, 96] as const;
export const GRID: readonly [number, number][] = Array.from({ length: 9 }, (_, i) => [GRID_LINES[i % 3], GRID_LINES[Math.floor(i / 3)]]);

/** the loose state: the same nine points, hand-placed (row-major like the grid), the centre near the middle */
export const LOOSE: readonly [number, number][] = [
  [17, 31],
  [50, 13],
  [97, 25],
  [31, 67],
  [63, 57],
  [104, 72],
  [13, 101],
  [57, 97],
  [92, 108],
];

/** the accent point: the centre, in every state */
export const ACCENT_POINT = 4;

/** the order the line visits the points: a serpentine, the same in the free and the structured state */
export const PATH_ORDER = [0, 1, 2, 5, 4, 3, 6, 7, 8] as const;

/** the free line: a Catmull-Rom curve through the loose points, as cubic Béziers */
export function freePath(points: readonly [number, number][] = LOOSE, order: readonly number[] = PATH_ORDER): string {
  const p = order.map((i) => points[i]);
  const r = (n: number) => Math.round(n * 10) / 10;
  let d = `M${r(p[0][0])} ${r(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)];
    const [p1, p2] = [p[i], p[i + 1]];
    const p3 = p[Math.min(p.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${r(c1[0])} ${r(c1[1])} ${r(c2[0])} ${r(c2[1])} ${r(p2[0])} ${r(p2[1])}`;
  }
  return d;
}

/** the structured line: straight segments through the grid, in the same order */
export function gridPath(order: readonly number[] = PATH_ORDER): string {
  return order.map((i, k) => `${k ? "L" : "M"}${GRID[i][0]} ${GRID[i][1]}`).join(" ");
}

/** the built block: nine modules of `size`, centred on the grid's cells (a gap of 36 − size between them) */
export const MODULE = 30;
export function moduleRect(i: number, size = MODULE): { x: number; y: number; w: number; h: number } {
  const [cx, cy] = GRID[i];
  return { x: cx - size / 2, y: cy - size / 2, w: size, h: size };
}

/**
 * The scene's timeline, in progress units of the section's own scroll (scrubbed, no pin): each
 * stage arrives in its third (its stretch of the conductor drawing once its words are in), the close
 * comes last.
 */
export const VISION_AT = {
  stages: [
    [0.02, 0.3],
    [0.32, 0.6],
    [0.62, 0.9],
  ],
  close: [0.86, 1],
} as const;
