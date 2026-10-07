import type { CSSProperties } from "react";
import type { ResolvedAsset } from "@/lib/resolved";
import { Still } from "@/components/media/Still";

export interface ReelItemView {
  id: string;
  /** "01 / 04" */
  indexLabel: string;
  name: string;
  reelLine: string;
  relationLine?: string;
  aspect: { desktop: [number, number]; mobile: [number, number] };
  poster: ResolvedAsset;
  reelLabel: string;
  enter: { href: string; label: string };
  /** only when the live URL is confirmed */
  open?: { href: string; label: string; aria: string };
}

/** reel frame width per tier (Spec §06), as `sizes` for the poster */
export const REEL_SIZES = "(min-width: 1440px) 1094px, (min-width: 1024px) 76vw, (min-width: 768px) 84vw, calc(100vw - 32px)";

/**
 * S2 · Project Reel (Spec §06). Phase 1: the no-JS form of the reel — a vertical list of the
 * four real posters with their metadata and links. Phase 3 turns this same DOM into the
 * horizontal reel (track, drag, keys, 01–04 buttons, live region, loops).
 */
export function ProjectReel({ label, heading, items }: { label: string; heading: string; items: ReelItemView[] }) {
  return (
    <section id="trabajo" aria-labelledby="trabajo-h" data-section="trabajo" className="reel">
      <header className="reel-header">
        <p className="micro muted">{label}</p>
        <h2 id="trabajo-h" className="reel-heading">
          {heading}
        </h2>
      </header>
      <div data-part="viewport" className="reel-viewport">
        <ol data-part="track" className="reel-track">
          {items.map((item) => (
            <li key={item.id} aria-label={item.reelLabel} className="reel-item" data-project={item.id}>
              <div
                data-part="frame"
                className="reel-frame"
                style={
                  {
                    "--ar-d": `${item.aspect.desktop[0]} / ${item.aspect.desktop[1]}`,
                    "--ar-m": `${item.aspect.mobile[0]} / ${item.aspect.mobile[1]}`,
                  } as CSSProperties
                }
              >
                <Still asset={item.poster} sizes={REEL_SIZES} fill />
              </div>
              <div data-part="meta" className="reel-meta">
                <p className="micro muted">{item.indexLabel}</p>
                <h3 className="reel-name">{item.name}</h3>
                <p className="micro muted">{item.reelLine}</p>
                {item.relationLine ? <p className="reel-relation">{item.relationLine}</p> : null}
                <p className="reel-links">
                  <a href={item.enter.href} className="link">
                    {item.enter.label}
                  </a>
                  {item.open ? (
                    <a href={item.open.href} target="_blank" rel="noopener noreferrer" aria-label={item.open.aria} className="link">
                      {item.open.label}
                    </a>
                  ) : null}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
