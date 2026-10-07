import type { ResolvedAsset } from "@/lib/resolved";
import { ProofMedia } from "@/components/media/ProofMedia";
import { REEL_SIZES } from "@/components/reel/ProjectReel";

export interface ProofView {
  id: string;
  name: string;
  media: ResolvedAsset;
  videoLabel: string;
  caption: string;
  microCase: string;
  relationLine?: string;
  role: string;
  credit?: string;
  stack?: string;
  open?: { href: string; label: string; aria: string };
  next: { href: string; label: string };
  tone: "paper-on-black" | "ink-on-paper";
}

/**
 * S4/S6/S9/S11 · Proof (Spec §02 proof sheet). Real media of the real product, the micro case
 * and the two CTAs. The window sits at the reel geometry. Phase 4 adds the scale .9 → 1 and
 * the exit dim; the recording slots in through the `{p}.proof` contract.
 */
export function ProjectProof({ proof }: { proof: ProofView }) {
  const h = `${proof.id}-proof-h`;
  return (
    <section aria-labelledby={h} data-section={proof.id} data-proof={proof.id} data-tone={proof.tone} className="proof">
      <h3 id={h} className="proof-name micro">
        {proof.name}
      </h3>
      <figure className="proof-figure">
        <div className="proof-window" data-part="window">
          <ProofMedia asset={proof.media} label={proof.videoLabel} sizes={REEL_SIZES} />
        </div>
        <figcaption className="proof-caption">{proof.caption}</figcaption>
      </figure>
      <div className="proof-text">
        <p className="proof-case">{proof.microCase}</p>
        {proof.relationLine ? <p className="proof-case">{proof.relationLine}</p> : null}
        <p className="micro muted">{proof.role}</p>
        {proof.credit ? <p className="micro muted">{proof.credit}</p> : null}
        {proof.stack ? <p className="micro muted">{proof.stack}</p> : null}
        <p className="proof-links">
          {proof.open ? (
            <a href={proof.open.href} target="_blank" rel="noopener noreferrer" aria-label={proof.open.aria} className="link">
              {proof.open.label}
            </a>
          ) : null}
          <a href={proof.next.href} className="link">
            {proof.next.label}
          </a>
        </p>
      </div>
    </section>
  );
}
