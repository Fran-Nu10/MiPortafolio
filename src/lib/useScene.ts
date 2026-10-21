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
  /** run `fn` when this build is reverted (tier / reduced-motion flip, resize rebuild, unmount) */
  onRevert: (fn: () => void) => void;
}

export interface SceneOptions {
  /** ScrollTrigger id (debugging, QA) */
  id?: string;
  /** pin length in gestures: units × GESTURE_VH[tier] (units × 50vh under reduced motion) */
  units: number | ((tier: Tier, rm: boolean) => number);
  /**
   * default true (a ScrollTrigger pin). "sticky": the root is `position: sticky` inside a parent
   * that only wraps it (the parent gets the pin length as height). Flow scenes (false) scrub
   * while the section passes.
   */
  pin?: boolean | "sticky";
  /** snap to `s:` labels after scrolling stops (default true; never under reduced motion) */
  snap?: boolean;
  /**
   * sticky pins only: the holder's height is already the pin length in CSS from the first paint. When
   * the build leaves it unchanged nothing else moved, so the document-wide refresh is skipped (its
   * reflow was a long task of its own after hydration — docs/22 §6); if it changed, it refreshes.
   */
  presized?: boolean;
  /**
   * presized sticky pins only: build when the section comes within a viewport of the screen instead
   * of in the hydration queue — building moves nothing, so nothing has to be ready before the visitor
   * gets there, and the build stays out of the load (docs/22 §6). The root carries no
   * `data-scene-root`: `scenesReady()` does not wait for it.
   */
  lazy?: boolean;
  /** default 0.6 (worlds); 0.8 for the rail and Franco at work */
  scrub?: number;
  /** build the timeline inside the section's gsap.context; return null for a scene without scrub */
  build: (api: SceneApi) => gsap.core.Timeline | null;
  /** current `s:` state changed (also mirrored to `data-state` on the root, without the prefix) */
  onState?: (state: string) => void;
  /** the section's trigger became active / inactive */
  onToggle?: (active: boolean) => void;
  /** scroll progress of the section's trigger (0–1), on every scroll update — not the playhead */
  onUpdate?: (progress: number) => void;
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
    // pin spacing changes in a refresh: keep the held view (see holdView)
    ScrollTrigger.sort((a: ScrollTrigger, b: ScrollTrigger) => {
      const ta = a.trigger as Element | undefined;
      const tb = b.trigger as Element | undefined;
      if (!ta || !tb || ta === tb) return 0;
      return ta.compareDocumentPosition(tb) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    ScrollTrigger.refresh();
    restoreView();
    if (!pending.length && !draining) reading = null;
  });
}

const isDev = process.env.NODE_ENV !== "production";

/**
 * Deferred builds (Phase 12, measured). Building every scene inside the hydration commit made one
 * long task (≈ 0.5 s on Lighthouse's mobile CPU) and delayed the opening. A scene whose root starts
 * more than 1.5 viewports below the viewport builds in its own task instead, in document order: its
 * growth only moves content below the viewport, so nothing visible shifts; until then it shows its
 * CSS first state (Spec §24 "JS delayed"). Scenes above or near the viewport build at once.
 * `scenesReady()` resolves when the queue has drained (deep links and reloads land after it).
 */
const pending: { root: HTMLElement; run: () => void }[] = [];
let draining = 0;
let waiters: (() => void)[] = [];
function drain() {
  draining = 0;
  const next = pending.shift();
  if (next) {
    next.run();
    draining = window.setTimeout(drain, 0);
    return;
  }
  const w = waiters;
  waiters = [];
  w.forEach((fn) => fn());
}
function enqueueBuild(root: HTMLElement, run: () => void) {
  const job = { root, run };
  pending.push(job);
  // document order: a scene above another builds first, so heights settle top-down
  pending.sort((a, b) => (a.root.compareDocumentPosition(b.root) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  if (!draining) draining = window.setTimeout(drain, 0);
  return () => {
    const i = pending.indexOf(job);
    if (i >= 0) pending.splice(i, 1);
  };
}
/**
 * Resolves once every scene in the document has built (each scene root carries `data-scene-root`
 * in the server HTML; `data-scene-built` is set by its first build, whatever it returns) and the
 * queue has drained. Sections hydrate progressively (Suspense boundaries in the Journey), so a
 * scene may not even have enqueued yet when this is first asked. Gives up after 4 s: a scene that
 * never builds falls back to its static layout (Spec §24) and must not hold the landing.
 */
export function scenesReady(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const t0 = performance.now();
  return new Promise((resolve) => {
    const check = () => {
      const unbuilt = document.querySelector("[data-scene-root]:not([data-scene-built])");
      if ((!unbuilt && !pending.length && !draining) || performance.now() - t0 > 4000) return resolve();
      if (!unbuilt && (pending.length || draining)) waiters.push(check);
      else requestAnimationFrame(check);
    };
    check();
  });
}
const DEFER_BELOW_VIEWPORTS = 1.5;

/**
 * Scenes may build while the visitor is already down the page (a late hydration on a slow device,
 * a deferred build after a quick scroll). Their pins grow above what the visitor is reading, and
 * the refresh that follows adds pin spacing. The section at the viewport's center when that starts
 * is held in place across every build and refresh until the queue has drained, or until the
 * visitor scrolls on their own (Phase 13: WebKit under load landed in another world — the
 * engines' own scroll anchoring picked anchors inside pinned stages, and the refreshes moved
 * everything unanchored).
 */
let reading: { el: HTMLElement; top: number } | null = null;
let readingListeners = false;
function holdView() {
  if (reading || window.scrollY <= 0) return;
  const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)?.closest<HTMLElement>("[data-section]");
  if (!el) return;
  reading = { el, top: el.getBoundingClientRect().top };
  if (!readingListeners) {
    readingListeners = true;
    const release = () => (reading = null);
    for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) window.addEventListener(type, release, { passive: true });
  }
}
function restoreView() {
  if (!reading) return;
  const delta = reading.el.getBoundingClientRect().top - reading.top;
  if (Math.abs(delta) >= 1) window.scrollBy({ top: delta, behavior: "instant" });
}
function anchored(root: HTMLElement, fn: () => void) {
  // a scene below the viewport's center grows below the visitor: nothing to hold
  if (root.getBoundingClientRect().top > window.innerHeight / 2) return fn();
  holdView();
  fn();
  restoreView();
}

/**
 * Built scenes by id: navigation asks where a scene starts or where one of its labels is
 * ("enter Rayo at s:ISOLATE") without knowing pin lengths. Label positions are 0–1 of the pin.
 */
const scenes = new Map<string, { trigger: ScrollTrigger; labels: Record<string, number> }>();

export function getScene(id: string) {
  return scenes.get(id);
}

/** document scroll position of a scene's start, or of one of its labels */
export function sceneScroll(id: string, label?: string): number | null {
  const sc = scenes.get(id);
  if (!sc) return null;
  const { start, end } = sc.trigger;
  const p = label ? (sc.labels[label] ?? 0) : 0;
  return start + p * (end - start);
}

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
      root.setAttribute("data-scene-built", "");
      const tier = tierFromConditions(conditions);
      const rm = conditions.rm;
      const pinned = (o.pin ?? true) && !conditions.tiny;
      // stepping = states replace each other in place (reduced motion, unpinned tiny viewports)
      const stepping = rm || ((o.pin ?? true) && !pinned);
      const autos: { label: string; seg: Segment }[] = [];
      const reverts: (() => void)[] = [];
      const runReverts = () => reverts.splice(0).forEach((fn) => fn());
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
        onRevert: (fn) => {
          reverts.push(fn);
        },
      };

      let tl: gsap.core.Timeline | null;
      try {
        tl = o.build(api);
      } catch (err) {
        // that section falls back to its static layout; the others are unaffected (Spec §24)
        root.removeAttribute("data-anim");
        if (isDev) console.error(`[useScene:${o.id ?? root.id}] build failed`, err);
        return runReverts;
      }
      if (!tl) {
        // a scene with no timeline (a static layout: tiny viewports, reduced motion) may still have changed
        // the document's layout while building (a world drops its stage): positions measured before it
        // would stay stale — the profile's reveals fired ~470 px early at 320×568 (Content Master 21 QA)
        queueRefresh();
        return runReverts;
      }
      tl.pause();

      const duration = tl.duration();
      const stops = labelStops(tl.labels, duration, SNAP_PREFIX);
      const stateLabels = Object.entries(tl.labels)
        .filter(([name]) => name.startsWith(SNAP_PREFIX))
        .sort((a, b) => a[1] - b[1]);

      // a snap lands on whole pixels, a hair before its label: ≈ 2 px of scroll in timeline time
      const labelEps = Math.max(1e-4, duration * 0.002);
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
        for (const [name, at] of stateLabels) if (at <= t + labelEps) current = name;
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

      // 2 px of scroll, in progress: a whole-pixel jump to a label (navigation, a deep link,
      // Back) is on that label, so a forward snap does not carry it to the next one
      const pxEps = (st?: ScrollTrigger) => (st && st.end > st.start ? 2 / (st.end - st.start) : 1e-4);
      const units = typeof o.units === "function" ? o.units(tier, rm) : o.units;
      // the end of the pin is a resting place too: past the last state, a stop releases the pin
      const snapStops = stops.length && stops[stops.length - 1] < 1 - 1e-4 ? [...stops, 1] : stops;
      const lengthVh = pinLengthVh(units, tier, rm);
      // sticky: the root sticks at the top of its parent, which is made as tall as the root plus
      // the pin length — no fixed positioning, so entering or leaving the pin never shifts layout
      const holder = pinned && o.pin === "sticky" ? root.parentElement : null;
      let moved = true;
      if (holder) {
        const before = holder.offsetHeight;
        holder.style.height = `${root.offsetHeight + (lengthVh * window.innerHeight) / 100}px`;
        moved = !o.presized || Math.abs(holder.offsetHeight - before) > 1;
        reverts.push(() => holder.style.removeProperty("height"));
      }
      // a snap back to the first state lands on the first whole pixel inside the sticky pin (a
      // fractional start would round to a scroll position just before the stage sticks)
      const inside = (stop: number, st?: ScrollTrigger) => {
        if (stop !== 0 || !holder || !st || st.end <= st.start) return stop;
        const first = Math.ceil(holder.getBoundingClientRect().top + window.scrollY);
        return Math.max(0, (first + 0.25 - st.start) / (st.end - st.start));
      };
      const scrollTrigger = ScrollTrigger.create({
        id: o.id,
        trigger: holder ?? root,
        start: pinned ? "top top" : "top 80%",
        end: holder ? () => `+=${holder.offsetHeight - root.offsetHeight}` : pinned ? `+=${lengthVh}%` : "bottom 20%",
        pin: pinned && !holder,
        pinSpacing: true,
        anticipatePin: pinned && !holder ? 1 : 0,
        scrub: stepping ? true : (o.scrub ?? 0.6),
        invalidateOnRefresh: true,
        animation: stepping ? undefined : tl,
        snap:
          stepping || !(o.snap ?? true) || snapStops.length < 2
            ? undefined
            : {
                snapTo: (value: number, self?: ScrollTrigger) => inside(snapToStop(snapStops, value, self?.direction ?? 1, pxEps(self)), self),
                duration: { min: 0.25, max: 0.6 },
                delay: 0.08,
                ease: "power2.out",
                inertia: false,
              },
        onUpdate: (self) => {
          // stepping: the same timeline, shown only at its resting states
          if (stepping) tl!.progress(stepToStop(stops, self.progress, pxEps(self)));
          o.onUpdate?.(self.progress);
        },
        onToggle: (self) => o.onToggle?.(self.isActive),
      });
      track();
      // a refresh renders the timeline with its events suppressed (a reload restores a scroll
      // position, nothing scrolls afterwards): mirror the state once the playhead is placed
      const retrack = () => requestAnimationFrame(track);
      ScrollTrigger.addEventListener("refresh", retrack);
      reverts.push(() => ScrollTrigger.removeEventListener("refresh", retrack));
      // a presized holder that kept its height moved nothing: only this trigger needs measuring
      if (moved) queueRefresh();
      else scrollTrigger.refresh();
      if (o.id) scenes.set(o.id, { trigger: scrollTrigger, labels: Object.fromEntries(Object.entries(tl.labels).map(([k, t]) => [k, duration > 0 ? t / duration : 0])) });

      // A refresh (coalesced build refresh, fonts, resize) cancels a pending snap. If the visitor
      // has stopped between two states when it lands, finish the directional snap once scrolling
      // has been idle for a moment — never while a gesture is in progress.
      const snaps = !stepping && (o.snap ?? true) && snapStops.length >= 2;
      let settleTimer = 0;
      let lastScroll = 0;
      const onScroll = () => {
        lastScroll = performance.now();
      };
      const settle = () => {
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => {
          if (performance.now() - lastScroll < 200) return settle();
          if (!scrollTrigger.isActive) return;
          const span = scrollTrigger.end - scrollTrigger.start;
          const target = inside(snapToStop(snapStops, scrollTrigger.progress, scrollTrigger.direction || 1, pxEps(scrollTrigger)), scrollTrigger);
          if (Math.abs(target - scrollTrigger.progress) * span < 2) return;
          window.scrollTo({ top: scrollTrigger.start + target * span, behavior: "smooth" });
        }, 260);
      };
      if (snaps) {
        window.addEventListener("scroll", onScroll, { passive: true });
        ScrollTrigger.addEventListener("refresh", settle);
      }

      return () => {
        if (o.id && scenes.get(o.id)?.trigger === scrollTrigger) scenes.delete(o.id);
        window.clearTimeout(settleTimer);
        if (snaps) {
          window.removeEventListener("scroll", onScroll);
          ScrollTrigger.removeEventListener("refresh", settle);
        }
        scrollTrigger.kill();
        for (const a of autos) a.seg.kill();
        runReverts();
      };
    };

    const setup = () => {
      mm = gsap.matchMedia();
      mm.add(SCENE_CONDITIONS, (ctx) => build(ctx.conditions as SceneConditions), root);
    };
    let cancelDeferred: (() => void) | null = null;
    if (o.lazy && typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io.disconnect();
          cancelDeferred = null;
          anchored(root, setup);
        },
        { rootMargin: "100% 0px" },
      );
      io.observe(root.parentElement ?? root);
      cancelDeferred = () => io.disconnect();
    } else if (root.getBoundingClientRect().top > window.innerHeight * (1 + DEFER_BELOW_VIEWPORTS)) {
      cancelDeferred = enqueueBuild(root, () => {
        cancelDeferred = null;
        anchored(root, setup);
      });
    } else anchored(root, setup);
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
        // still queued: it will build once, at the new width
        if (cancelDeferred) return;
        const y = window.scrollY;
        mm?.revert();
        setup();
        window.scrollTo(0, y);
      }, 220);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelDeferred?.();
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
      mm?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, opts.deps ?? []);
}
