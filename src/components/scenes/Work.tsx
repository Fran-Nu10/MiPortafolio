"use client";

import { TravelSuite } from "./work/TravelSuite";
import { Prospector } from "./work/Prospector";
import { SantiNuca } from "./work/SantiNuca";
import { ChefArturo } from "./work/ChefArturo";

/**
 * 03 · Selected Work. Four sheets, four scenes — each with its own scroll budget per viewport
 * and its own world — all following one camera rule:
 *
 *   ISOMETRIC = BUILD / UNDERSTAND · FRONTAL = PRESENT / USE
 *
 * BUILD → ROTATE → PRESENT → INTERACT → EXIT. Construction explains, the product proves,
 * and the live build can be used (INTERACT) wherever one is public.
 */
export function Work() {
  return (
    <>
      <TravelSuite />
      <Prospector />
      <SantiNuca />
      <ChefArturo />
    </>
  );
}
