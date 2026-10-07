import type { ResolvedAsset } from "@/lib/resolved";
import { Placeholder } from "@/components/media/Placeholder";

/**
 * S14 · Franco at work (Spec §13). Decorative and silent: no copy, no focusable content.
 * Rendered only when `features.francoAtWork` is on (default off until the video is approved).
 * Phase 10 adds the pinned frame growth to 95% and the monitor close.
 */
export function FrancoAtWork({ media }: { media: ResolvedAsset }) {
  return (
    <section aria-label="Franco trabajando" className="at-work" data-moment="at-work">
      <figure data-part="frame" className="at-work-frame" aria-hidden="true">
        <Placeholder asset={media} />
      </figure>
    </section>
  );
}
