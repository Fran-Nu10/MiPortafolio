import type { EvidenceElement, EvidenceSlotVariant } from "@/data/types";

/**
 * Evidence for a capability (Spec §12). Variants:
 * - `typographic` — no element: the card shows its statement at lead size and the mono tag
 *   is its attribution ("Meta Ads"); no image, no numbers. The production state of
 *   capability 06 until a real, authorized campaign exists.
 * - `verified-material` / `campaign` — real material only; a metric renders only when it is
 *   `authorized` and has a `source`. Never a placeholder: anything unproven falls back to
 *   `typographic`.
 * - `element` — the live mini-sequences reused from the worlds (Phase 9). Until then: nothing.
 */
export function EvidenceSlot({ evidence }: { evidence: EvidenceElement | EvidenceSlotVariant }) {
  if (evidence.variant === "element" || evidence.variant === "typographic") return null;
  // real material (Phase 9): authorized metrics only, never a placeholder
  const metrics = evidence.variant === "campaign" ? evidence.metrics.filter((m) => m.authorized && m.source) : [];
  return (
    <div className="evidence" data-evidence={evidence.variant}>
      {evidence.variant === "verified-material" && evidence.caption ? <p className="micro muted">{evidence.caption}</p> : null}
      {metrics.length ? (
        <dl className="evidence-metrics">
          {metrics.map((m) => (
            <div key={m.label}>
              <dt className="micro muted">{m.label}</dt>
              <dd>{m.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
