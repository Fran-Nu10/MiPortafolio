"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import type { Rect01, WorldType } from "@/data/types";
import { placeRect, type Rect } from "@/lib/geometry";
import { EASE } from "@/lib/motion";
import { REEL_SIZES } from "@/lib/reel";
import type { ResolvedAsset } from "@/lib/resolved";
import { WORLD_UNITS, WORLD_UNITS_RM, escapeRect, flip } from "@/lib/world";
import type { Tier } from "@/lib/tiers";
import { useScene, type SceneApi } from "@/lib/useScene";
import { Still } from "@/components/media/Still";

export interface WorldView {
  id: string;
  name: string;
  worldType: WorldType;
  env: "black" | "red" | "paper" | "image";
  tone: "paper-on-black" | "ink-on-paper";
  aspect: { desktop: [number, number]; mobile: [number, number] };
  poster: ResolvedAsset;
  /** where the escaping object sits in the poster (normalized to the reel frame) */
  anchor: { desktop: Rect01; mobile: Rect01 };
  /**
   * the escaping object (Spec §07): TravelSuite360's is live DOM text (the message); the others,
   * until their cutouts exist, are a crop of their own real poster — the same pixels, leaving
   */
  object: { kind: "text"; text: string } | { kind: "crop" };
  /** world copy in order of appearance (Content Master, verbatim) */
  copy: { key: string; text: string }[];
  /** Santi: "Fotografía · Santi Nuca", visible next to the first photograph */
  credit?: string;
  /** the world a deep link starts at: its poster is the route's largest paint */
  priority?: boolean;
}

/**
 * What a world adds after the shared grammar (Spec §07 "everything after s:WORLD"): its own
 * timeline, appended to the same timeline inside the same build — one pin, one snap, one
 * ScrollTrigger per world. Navigation, history and the reel jump stay the shell's.
 */
export interface WorldSceneExtension {
  /** the whole world's length in gestures (the shell's own 2.5 / 1 are replaced) */
  units: (tier: Tier, rm: boolean) => number;
  /** labels and tweens from `worldAt` (the time of `s:WORLD`) on */
  build: (api: SceneApi, tl: gsap.core.Timeline, ctx: WorldBuildContext) => void;
  /** the world's trigger became active / inactive */
  onToggle?: (active: boolean) => void;
}

export interface WorldBuildContext {
  /** the escaping object (aria-hidden), at its world rect from `worldAt` on */
  object: HTMLElement;
  worldAt: number;
  /** the object's box at its natural size, before any transform */
  natural: { w: number; h: number };
}

/**
 * Shared world shell (Spec §07). Every world:
 *   SCREEN   its reel poster at the shared reel rectangle, the object aligned over it
 *   ISOLATE  gesture 1 — the rest of the screen darkens to .75; the object keeps its light
 *   ESCAPE   the object crosses the screen edge toward the world; the screen recedes (.92)
 *   EXPAND   gesture 2 — the object reaches the world's own rect, the environment fills,
 *            the screen is gone → WORLD
 * What happens after WORLD is each world's own timeline (Phases 5–8). Until then the world's
 * copy follows the stage in normal flow, readable. The stage (and SCREEN) is laid out in CSS
 * from first paint, so a jump from the reel or a deep link never moves anything.
 */
export function WorldScene({
  world,
  scene,
  summary,
  children,
}: {
  world: WorldView;
  scene?: WorldSceneExtension;
  /** the visual-only states, once, for assistive tech (Spec §19) — only while the scene runs */
  summary?: string[];
  /** the world's own layers, inside the stage above the shared ones */
  children?: ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useScene(stageRef, {
    id: `world-${world.id}`,
    pin: "sticky",
    units: (tier, rm) => (scene ? scene.units(tier, rm) : rm ? WORLD_UNITS_RM : WORLD_UNITS),
    build: (api) => buildWorld(api, world, scene),
    onToggle: scene?.onToggle,
    onState: (state) => {
      if (sectionRef.current) sectionRef.current.dataset.state = state;
    },
  });

  const a = world.anchor;
  const vars = {
    "--r-d": world.aspect.desktop[0] / world.aspect.desktop[1],
    "--r-m": world.aspect.mobile[0] / world.aspect.mobile[1],
    "--ar-d": `${world.aspect.desktop[0]} / ${world.aspect.desktop[1]}`,
    "--ar-m": `${world.aspect.mobile[0]} / ${world.aspect.mobile[1]}`,
    "--ax-d": a.desktop.x,
    "--ay-d": a.desktop.y,
    "--aw-d": a.desktop.w,
    "--ah-d": a.desktop.h,
    "--ax-m": a.mobile.x,
    "--ay-m": a.mobile.y,
    "--aw-m": a.mobile.w,
    "--ah-m": a.mobile.h,
  } as CSSProperties;

  return (
    <section
      ref={sectionRef}
      id={world.id}
      data-world={world.id}
      data-section={world.id}
      data-state="SCREEN"
      data-env={world.env}
      data-tone={world.tone}
      data-scene={scene ? "" : undefined}
      aria-labelledby={`${world.id}-h`}
      className="world"
      style={vars}
    >
      <h2 id={`${world.id}-h`} className="world-name" data-part="name">
        {world.name}
      </h2>
      {/* the stage's pin: as tall as the stage plus the scene's length (set by the scene) */}
      <div data-part="pin" className="world-pin">
        <div ref={stageRef} data-part="stage" data-anim="" className="world-stage">
          <div data-part="env" className="world-env" />
          <div data-part="screen" className="world-screen">
            <Still asset={world.poster} sizes={REEL_SIZES} fill priority={world.priority} />
            <div data-part="screen-dim" className="world-screen-dim" />
          </div>
          <div data-part="object" className={`world-object world-object-${world.object.kind}`} aria-hidden="true">
            {world.object.kind === "crop" ? (
              <div className="world-object-crop">
                <Still asset={world.poster} sizes={REEL_SIZES} fill />
              </div>
            ) : (
              <p className="world-object-text">{world.object.text}</p>
            )}
          </div>
          {children}
        </div>
      </div>
      {summary?.length ? (
        <ol className="sr-only world-summary">
          {summary.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      ) : null}
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
    </section>
  );
}

/** a rect relative to the stage (which is the viewport while pinned) */
function rel(el: HTMLElement, stage: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
}

function buildWorld(api: SceneApi, world: WorldView, scene?: WorldSceneExtension): gsap.core.Timeline | null {
  const { gsap, root: stage } = api;
  if (!api.pinned) {
    // very small / short viewports: the static layout (Spec §24)
    stage.removeAttribute("data-anim");
    return null;
  }
  const one = (p: string) => api.q(`[data-part="${p}"]`)[0];
  const env = one("env");
  const screen = one("screen");
  const dim = one("screen-dim");
  const object = one("object");
  const viewport = { width: window.innerWidth, height: stage.clientHeight };
  const anchor = api.tier === "sm" ? world.anchor.mobile : world.anchor.desktop;

  // FLIP: from the object's place in the poster to the world's own rect (transform-origin 0 0;
  // the object box sits at the stage origin and lives on x / y / scale only)
  let from: Rect;
  let natural: { w: number; h: number };
  if (world.object.kind === "text") {
    // the message renders at its TS01 size; at SCREEN it is scaled down into its place
    natural = { w: object.offsetWidth, h: object.offsetHeight };
    const box = placeRect(anchor, rel(screen, stage));
    from = { ...box, h: (box.w / natural.w) * natural.h };
  } else {
    // the crop is laid out in CSS at its anchor; measured here, then moved to the origin
    from = rel(object, stage);
    natural = { w: from.w, h: from.h };
  }
  const to = escapeRect(world.worldType, api.tier, viewport, natural);
  const start = { x: from.x, y: from.y, scale: from.w / natural.w };
  const end = { ...flip({ x: 0, y: 0, w: natural.w, h: natural.h }, to) };

  // SCREEN: what the reel showed. The object exists over the poster but only shows from the
  // first scroll on (pixel-identical while it sits there; a text object has nothing to align
  // with until the TravelSuite360 capture exists).
  gsap.set(object, { left: 0, top: 0, width: natural.w, height: natural.h, transformOrigin: "0 0", ...start, autoAlpha: 0 });
  gsap.set(dim, { opacity: 0 });
  gsap.set(env, { opacity: 0 });

  const tl = gsap.timeline({ defaults: { ease: EASE.settle } });
  tl.addLabel("s:SCREEN", 0);
  if (api.rm) {
    // three instant states (Spec §07): SCREEN → the object large in its environment, the
    // screen hidden → the world
    tl.set(object, { autoAlpha: 1, ...end }, 0.5);
    tl.set(env, { opacity: 1 }, 0.5);
    tl.set(screen, { autoAlpha: 0 }, 0.5);
    tl.addLabel("s:WORLD", 0.5);
    if (scene) scene.build(api, tl, { object, worldAt: 0.5, natural });
    else tl.to({}, { duration: WORLD_UNITS_RM - 0.5 }, 0.5);
    return tl;
  }
  // ISOLATE · the screen darkens around the object (nothing starts at 0)
  tl.set(object, { autoAlpha: 1 }, 0.01);
  tl.fromTo(dim, { opacity: 0 }, { opacity: 0.75, duration: 0.98, immediateRender: false }, 0.02);
  tl.addLabel("s:ISOLATE", 1);
  // ESCAPE (1 → 1.45) and EXPAND (1.45 → 2)
  tl.fromTo(object, start, { ...end, duration: 1, immediateRender: false }, 1);
  tl.fromTo(screen, { scale: 1 }, { scale: 0.92, duration: 0.45, immediateRender: false }, 1);
  tl.fromTo(env, { opacity: 0 }, { opacity: 1, duration: 0.55, immediateRender: false }, 1.45);
  tl.fromTo(screen, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.55, immediateRender: false }, 1.45);
  tl.addLabel("s:WORLD", 2);
  if (scene) scene.build(api, tl, { object, worldAt: 2, natural });
  else tl.to({}, { duration: WORLD_UNITS - 2 }, 2);
  return tl;
}
