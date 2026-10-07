import type { CSSProperties } from "react";
import type { ResolvedAsset } from "@/lib/resolved";
import { Still } from "@/components/media/Still";
import { REEL_SIZES } from "@/components/reel/ProjectReel";

export interface WorldView {
  id: string;
  name: string;
  env: "black" | "red" | "paper" | "image";
  tone: "paper-on-black" | "ink-on-paper";
  aspect: { desktop: [number, number]; mobile: [number, number] };
  poster: ResolvedAsset;
  /** world copy in order of appearance (Content Master, verbatim) */
  copy: { key: string; text: string }[];
  /** Santi: "Fotografía · Santi Nuca", visible next to the first photograph */
  credit?: string;
}

/**
 * Shared world shell (Spec §07 stage structure). Phase 1: the static, readable form — the
 * SCREEN poster at the reel geometry and the world copy as text, in reading order. Phase 4
 * makes this the client `WorldScene` (pin, label snap, SCREEN → ISOLATE → ESCAPE → EXPAND);
 * Phases 5–8 add each world's own timeline over the same `data-part` markup.
 */
export function WorldScene({ world }: { world: WorldView }) {
  return (
    <section
      id={world.id}
      data-world={world.id}
      data-section={world.id}
      data-state="SCREEN"
      data-env={world.env}
      data-tone={world.tone}
      aria-labelledby={`${world.id}-h`}
      className="world"
    >
      <div data-part="stage" className="world-stage">
        <div data-part="env" className="world-env" />
        <h2 id={`${world.id}-h`} className="world-name" data-part="name">
          {world.name}
        </h2>
        <div
          data-part="screen"
          className="world-screen"
          style={
            {
              "--ar-d": `${world.aspect.desktop[0]} / ${world.aspect.desktop[1]}`,
              "--ar-m": `${world.aspect.mobile[0]} / ${world.aspect.mobile[1]}`,
            } as CSSProperties
          }
        >
          <Still asset={world.poster} sizes={REEL_SIZES} fill />
          <div data-part="screen-dim" className="world-screen-dim" />
        </div>
        {world.credit ? (
          <p className="world-credit micro" data-part="credit">
            {world.credit}
          </p>
        ) : null}
        <div data-part="world" className="world-copy">
          {world.copy.map((c) => (
            <p key={c.key} data-copy={c.key} className="world-line">
              {c.text}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
