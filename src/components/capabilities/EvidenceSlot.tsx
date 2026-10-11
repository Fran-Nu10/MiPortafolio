import type { EvidenceSlotVariant } from "@/data/types";
import type { ResolvedAsset } from "@/lib/resolved";
import { Still } from "@/components/media/Still";

/**
 * Evidence for a capability without a live element (Spec §12). Variants:
 * - `typographic` — no element: the card shows its statement at lead size and the mono tag
 *   is its attribution ("Meta Ads"); no image, no numbers. The production state of
 *   capability 06 until a real, authorized campaign exists.
 * - `verified-material` / `campaign` — real material only; a metric renders only when it is
 *   `authorized` and has a `source`. Never a placeholder: the server resolves the variant with
 *   `resolveEvidence` (lib/capabilities-rail) before it gets here, so anything unproven already
 *   fell back to `typographic` in production.
 * The live elements (`element` variant) are `EvidenceElement`, owned by the rail.
 */
export function EvidenceSlot({ evidence, media = [] }: { evidence: EvidenceSlotVariant; media?: ResolvedAsset[] }) {
  if (evidence.variant === "typographic") return null;
  const real = media.filter((m) => m.status !== "placeholder");
  if (!real.length) return null;
  const metrics = evidence.variant === "campaign" ? evidence.metrics.filter((m) => m.authorized && m.source) : [];
  return (
    <div className="evidence" data-evidence={evidence.variant}>
      {real.map((m) => (
        <Still key={m.key} asset={m} sizes="(min-width: 1024px) 30vw, 100vw" />
      ))}
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
