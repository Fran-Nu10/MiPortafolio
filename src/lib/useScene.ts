"use client";

import { useLayoutEffect, type RefObject } from "react";
import { gsap, ScrollTrigger, registerGsap } from "./motion";
import {
  SCENE_CONDITIONS,
  SNAP_PREFIX,
  hasDepth,
  labelStops,
  pinLengthVh,
  snapToStop,
  stepToStop,
  tierFromConditions,
  type SceneConditions,
  type Tier,
} from "./tiers";

type Segment = gsap.core.Timeline | gsap.core.Tween;

export interface SceneApi {
  /** the section root (pinned unless `pinned` is false) */
  root: HTMLElement;
  /** scoped selector, usually `[data-part=…]` */
  q: (sel: string) => HTMLElement[];
  tier: Tier;
  /** reduced motion: build the same labels; the scene steps between them in place */
  rm: boolean;
  /** CSS 3D allowed: lg/xl only, never under reduced motion */
  depth: boolean;
  /** false on very small/short viewports: no pin, the scene steps through its states in flow */
  pinned: boolean;
  gsap: typeof gsap;
  /**
   * A time-based child segment fired when the playhead crosses `label` forward (`play()`),
   * reset instantly when it crosses backward (`progress(0)`). Under stepping it jumps to its end.
   */
  auto: (label: string, build: () => Segment) => void;
}

export interface SceneOptions {
  /** ScrollTrigger id (debugging, QA) */
  id?: string;
  /** pin length in gestures: units × GESTURE_VH[tier] (units × 50vh under reduced motion) */
  units: number | ((tier: Tier) => number);
  /** default true. Flow scenes (no pin) scrub while the section passes. */
  pin?: boolean;
  /** snap to `s:` labels after scrolling stops (default true; never under reduced motion) */
  snap?: boolean;
  /** default 0.6 (worlds); 0.8 for the rail and Franco at work */
  scrub?: number;
  /** build the timeline inside the section's gsap.context; return null for a scene without scrub */
  build: (api: SceneApi) => gsap.core.Timeline | null;
  /** current `s:` state changed (also mirrored to `data-state` on the root, without the prefix) */
  onState?: (state: string) => void;
  /** the section's trigger became active / inactive */
  onToggle?: (active: boolean) => void;
  deps?: unknown[];
}

/**
 * Sections can build out of document order (the opening waits for fonts, any scene rebuilds
 * on a width change), so after any build the triggers are re-sorted by document position and
 * refreshed once, coalesced to one frame.
 */
let refreshQueued = 0;
export function queueRefresh() {
  if (typeof window === "undefined" || refreshQueued) return;
  refreshQueued = window.requestAnimationFrame(() => {
    refreshQueued = 0;
    ScrollTrigger.sort((a: ScrollTrigger, b: ScrollTrigger) => {
      const ta = a.trigger as Element | undefined;
      const tb = b.trigger as Element | undefined;
      if (!ta || !tb || ta === tb) return 0;
      return ta.compareDocumentPosition(tb) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    ScrollTrigger.refresh();
  });
}

const isDev = process.env.NODE_ENV !== "production";

/**
 * One section = one gsap.matchMedia (tiers + reduced motion) → one timeline + at most one
 * ScrollTrigger, all inside the section's context (Spec §05). The vertical wheel is never
 * touched: pinning only translates the pinned element while the document scrolls natively.
 */
export function useScene(ref: RefObject<HTMLElement | null>, opts: SceneOptions) {
  // options are read once per (re)build; the effect re-runs only when `deps` change
  useLayoutEffect(() => {
    registerGsap();
    const root = ref.current;
    if (!root) return;
    const o = opts;
    let mm: gsap.MatchMedia | null = null;

    const build = (conditions: SceneConditions) => {
      const tier = tierFromConditions(conditions);
      const rm = conditions.rm;
      const pinned = (o.pin ?? true) && !conditions.tiny;
      // stepping = states replace each other in place (reduced motion, unpinned tiny viewports)
      const stepping = rm || ((o.pin ?? true) && !pinned);
      const autos: { label: string; seg: Segment }[] = [];
      const q = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
      const api: SceneApi = {
        root,
        q,
        tier,
        rm,
        depth: hasDepth(tier) && !rm,
        pinned,
        gsap,
        auto: (label, make) => {
          const seg = make();
          seg.pause(0);
          autos.push({ label, seg });
        },
      };

      let tl: gsap.core.Timeline | null;
      try {
        tl = o.build(api);
      } catch (err) {
        // that section falls back to its static layout; the others are unaffected (Spec §24)
        root.removeAttribute("data-anim");
        if (isDev) console.error(`[useScene:${o.id ?? root.id}] build failed`, err);
        return;
      }
      if (!tl) return;
      tl.pause();

      const duration = tl.duration();
      const stops = labelStops(tl.labels, duration, SNAP_PREFIX);
      const stateLabels = Object.entries(tl.labels)
        .filter(([name]) => name.startsWith(SNAP_PREFIX))
        .sort((a, b) => a[1] - b[1]);

      // state mirroring + autos follow the playhead (which lags the scroll while scrubbing)
      let prevTime = 0;
      let state = "";
      const track = () => {
        const t = tl!.time();
        for (const a of autos) {
          const at = tl!.labels[a.label];
          if (at === undefined) continue;
          if (prevTime < at && t >= at) {
            if (stepping) a.seg.progress(1);
            else a.seg.restart();
          } else if (t < at && prevTime >= at) {
            a.seg.pause().progress(0);
          }
        }
        prevTime = t;
        let current = stateLabels[0]?.[0] ?? "";
        for (const [name, at] of stateLabels) if (at <= t + 1e-4) current = name;
        if (current && current !== state) {
          state = current;
          root.dataset.state = current.slice(SNAP_PREFIX.length);
          o.onState?.(root.dataset.state);
        }
      };
      const prevOnUpdate = tl.eventCallback("onUpdate");
      tl.eventCallback("onUpdate", function (this: gsap.core.Timeline, ...args: unknown[]) {
        if (prevOnUpdate) (prevOnUpdate as (...a: unknown[]) => void).apply(this, args);
        track();
      });

      const units = typeof o.units === "function" ? o.units(tier) : o.units;
      const lengthVh = pinLengthVh(units, tier, rm);
      const scrollTrigger = ScrollTrigger.create({
        id: o.id,
        trigger: root,
        start: pinned ? "top top" : "top 80%",
        end: pinned ? `+=${lengthVh}%` : "bottom 20%",
        pin: pinned,
        pinSpacing: true,
        anticipatePin: pinned ? 1 : 0,
        scrub: stepping ? true : (o.scrub ?? 0.6),
        invalidateOnRefresh: true,
        animation: stepping ? undefined : tl,
        snap:
          stepping || !(o.snap ?? true) || stops.length < 2
            ? undefined
            : {
                snapTo: (value: number, self?: ScrollTrigger) => snapToStop(stops, value, self?.direction ?? 1),
                duration: { min: 0.25, max: 0.6 },
                delay: 0.08,
                ease: "power2.out",
                inertia: false,
              },
        onUpdate: stepping
          ? (self) => {
              // the same timeline, shown only at its resting states
              tl!.progress(stepToStop(stops, self.progress));
            }
          : undefined,
        onToggle: (self) => o.onToggle?.(self.isActive),
      });
      track();
      queueRefresh();

      return () => {
        scrollTrigger.kill();
        for (const a of autos) a.seg.kill();
      };
    };

    const setup = () => {
      mm = gsap.matchMedia();
      mm.add(SCENE_CONDITIONS, (ctx) => build(ctx.conditions as SceneConditions), root);
    };
    setup();
    // web fonts change measured geometry: refresh once they are in
    document.fonts?.ready.then(queueRefresh).catch(() => {});

    // matchMedia rebuilds on tier / reduced-motion flips; a same-tier width change that alters
    // measured geometry rebuilds by hand (mobile URL bars change only the height: ignored)
    let width = window.innerWidth;
    let timer = 0;
    const onResize = () => {
      if (Math.abs(window.innerWidth - width) < 2) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        width = window.innerWidth;
        const y = window.scrollY;
        mm?.revert();
        setup();
        window.scrollTo(0, y);
      }, 220);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
      mm?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, opts.deps ?? []);
}
