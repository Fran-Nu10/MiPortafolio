import type { ResolvedAsset } from "@/lib/resolved";
import { Cutout } from "@/components/media/Cutout";

export interface HeroContent {
  name: readonly [string, string];
  firma: string;
  support: string;
  index: string;
}

/**
 * S1 · Opening → Hero → Positioning (Spec §02, §03 hero stack). Phase 1 renders the readable
 * H2-like composition as server HTML — no element waits on JS. Phase 2 adds O0–O3, H1, H2 on
 * top of this exact markup (layers addressed by `data-part`).
 *
 * Layer stack, bottom → top: ground · FRANCO (behind the body) · portrait · NÚÑEZ (in front,
 * cut by the edge) · firma / support / index. The giant names are decorative duplicates of
 * the sr-only <h1>.
 */
export function OpeningHero({ hero, portrait }: { hero: HeroContent; portrait: ResolvedAsset }) {
  return (
    <section id="inicio" aria-label="Franco Núñez" data-section="inicio" className="hero">
      <div className="hero-stage" data-part="stage">
        <h1 className="sr-only">Franco Núñez</h1>
        <span aria-hidden="true" className="hero-name hero-name-first" data-part="first">
          {hero.name[0]}
        </span>
        <div className="hero-portrait" data-part="portrait">
          <Cutout asset={portrait} priority fill />
        </div>
        <span aria-hidden="true" className="hero-name hero-name-last" data-part="last">
          {hero.name[1]}
        </span>
        <div className="hero-copy">
          <p className="hero-index micro" data-part="index">
            {hero.index}
          </p>
          <p className="hero-firma micro" data-part="firma">
            {hero.firma}
          </p>
          <p className="hero-support" data-part="support">
            {hero.support}
          </p>
        </div>
      </div>
    </section>
  );
}
