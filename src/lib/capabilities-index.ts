import type { EvidenceSlotVariant } from "@/data/types";

/**
 * Capabilities as a live editorial index (docs/26 §C). Pure: the component and the tests import it.
 *
 * Six numbered rows and one shared stage. On wide screens the rows scroll natively in their column
 * and the stage stays beside them (CSS sticky, no pinned section): the active capability is the row
 * that holds the reading line, so scrolling back activates the previous one again. Hover and focus
 * also activate a row; nothing is revealed by hover alone (every row's name, value and reference are
 * always in the document and legible).
 */

/** where the eye reads, as a fraction of the viewport height from the top */
export const READING_LINE = 0.46;

/** wide layout: the shared stage beside the index (CSS uses the same condition) */
export const WIDE_QUERY = "(min-width: 1024px)";

/**
 * The active row for a reading line at `line` px: the row that contains it; above the first row the
 * first, below the last row the last; between two rows (their gap) the one that ended last.
 */
export function pickActive(rows: { top: number; bottom: number }[], line: number): number {
  if (!rows.length) return 0;
  if (line < rows[0].top) return 0;
  let active = 0;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].top <= line) active = i;
    if (rows[i].top <= line && line < rows[i].bottom) return i;
  }
  return active;
}

/** the scene each capability's evidence becomes (the same material as before, one grammar) */
export type SceneId = "product" | "engineering" | "commerce" | "ai" | "interactive" | "growth";

/** evidence element (data/capabilities) → scene */
export const SCENE_FOR: Record<string, SceneId> = {
  "ts-flow": "product",
  posters: "engineering",
  "chef-commerce": "commerce",
  "ts-extraction": "ai",
  "rayo-layers": "interactive",
  typographic: "growth",
};

/**
 * A scene's words that come from its capability's approved statement (Content Master 22), never new
 * claims: 02 «Front, back y datos…» names its three layers; 06 «…acercar negocios a las personas que
 * pueden convertirse en sus próximos clientes» names its three stations.
 */
export function wordsFromStatement(statement: string, words: string[]): string[] {
  const lower = statement.toLocaleLowerCase("es");
  for (const w of words) if (!lower.includes(w.toLocaleLowerCase("es"))) throw new Error(`«${w}» is not in «${statement}»`);
  return words;
}

/**
 * EvidenceSlot guard (Spec §12, kept for future campaign material — docs/26 §C): a material variant renders only when every file is real and,
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
