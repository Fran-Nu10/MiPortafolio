import type { Capability } from "@/data/types";
import type { ResolvedAsset } from "@/lib/resolved";
import { Cutout } from "@/components/media/Cutout";
import { EvidenceSlot } from "./EvidenceSlot";

export interface CapabilitiesView {
  heading: string;
  seam: string;
  kicker: string;
  subKicker: string;
  bust: ResolvedAsset;
  items: Capability[];
}

/**
 * S12 · Capabilities with the bust seam (Spec §12). Phase 1: the static list (the no-JS and
 * mobile form). Phase 9 pins it on lg/xl and drives the rail horizontally with vertical scroll.
 */
export function CapabilitiesRail({ view }: { view: CapabilitiesView }) {
  const core = view.items.filter((c) => c.group === "core");
  const extended = view.items.filter((c) => c.group === "extended");
  return (
    <section id="capacidades" aria-labelledby="capacidades-h" data-section="capacidades" className="capabilities">
      <h2 id="capacidades-h" className="sr-only">
        {view.heading}
      </h2>
      <figure className="seam" data-part="seam">
        <div className="seam-bust">
          <Cutout asset={view.bust} />
        </div>
        <p className="micro muted seam-line">{view.seam}</p>
      </figure>
      <p className="micro muted capabilities-kicker">{view.kicker}</p>
      <ol className="capabilities-list" data-part="rail">
        {core.map((c) => (
          <CapabilityCard key={c.index} c={c} />
        ))}
        {extended.map((c, i) => (
          <CapabilityCard key={c.index} c={c} subKicker={i === 0 ? view.subKicker : undefined} />
        ))}
      </ol>
    </section>
  );
}

function CapabilityCard({ c, subKicker }: { c: Capability; subKicker?: string }) {
  return (
    <li className="capability" data-capability={c.index} data-group={c.group} data-evidence={c.evidence.variant}>
      {/* the extended capability is set apart by space and the sub-kicker, nothing else */}
      {subKicker ? <p className="micro muted capability-sub">{subKicker}</p> : null}
      <article>
        <h3 className="capability-name">{c.name}</h3>
        <p className="capability-statement">{c.statement}</p>
        <div aria-hidden="true" className="capability-evidence">
          <EvidenceSlot evidence={c.evidence} />
        </div>
        {c.attribution.href ? (
          <a href={c.attribution.href} className="micro muted link">
            {c.attribution.label}
          </a>
        ) : (
          <p className="micro muted">{c.attribution.label}</p>
        )}
      </article>
    </li>
  );
}
