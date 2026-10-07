import type { ResolvedAsset } from "@/lib/resolved";
import { Still } from "@/components/media/Still";

/**
 * S7 · Human moment (Spec §02, §13). Silent: no copy, aria-hidden, alt empty. Rendered only
 * when `features.humanMoment` is on (default off until `moments.human` exists). Phase 10
 * adds the aperture scrub.
 */
export function HumanMoment({ media }: { media: ResolvedAsset }) {
  return (
    <section aria-hidden="true" className="moment" data-moment="human">
      <div className="moment-frame">
        <Still asset={media} sizes="100vw" />
      </div>
    </section>
  );
}
