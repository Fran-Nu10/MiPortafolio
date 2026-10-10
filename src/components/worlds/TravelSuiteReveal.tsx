"use client";

import { TS_GROUP_Z, TS_REVEAL } from "@/data/ts-reveal";
import type { TsVariant } from "@/lib/ts-world";

/**
 * TravelSuite360 · the big reveal (Spec §08): many operations behind the one we followed.
 * Four depth groups always exist (the scene places and animates the groups, never the
 * fragments); the fragments themselves — one aria-hidden word each, static left / top from
 * `data/ts-reveal.ts` — are mounted only while the world is within a viewport of the screen.
 * Each group paints as one layer. Nothing is random here.
 */
export function TravelSuiteReveal({ variant, groups, mounted }: { variant: TsVariant | null; groups: number[]; mounted: boolean }) {
  // phones: their own set; md: the desktop set's groups 0 and 2 — 32 fragments at z 0 / −600
  const set = variant === "sm" ? TS_REVEAL.mobile : TS_REVEAL.desktop;
  return (
    <div className="ts-reveal" aria-hidden="true">
      {TS_GROUP_Z.map((z, g) => (
        <div key={g} className="ts-group" data-part="group" data-depth={g} data-z={z}>
          <div className="ts-drift" data-part="drift">
            {mounted && variant && groups.includes(g)
              ? set
                  .filter((f) => f.group === g)
                  .map((f) => (
                    <span key={f.id} className="ts-frag" style={{ left: f.x, top: f.y }}>
                      {f.word}
                    </span>
                  ))
              : null}
          </div>
        </div>
      ))}
    </div>
  );
}
