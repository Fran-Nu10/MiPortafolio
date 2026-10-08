"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { EASE, gsap, registerGsap, ScrollTrigger, usePrefersReducedMotion } from "@/lib/motion";
import { isSaveData } from "@/lib/media";
import {
  AXIS_LOCK,
  CLICK_SLOP,
  SETTLE,
  createWheelGesture,
  dragPosition,
  horizontalDelta,
  releaseIndex,
  trackOffset,
  velocity,
} from "@/lib/reel";
import { ReelCursor } from "./ReelCursor";
import { ReelItem, type ReelItemView } from "./ReelItem";

export type { ReelItemView } from "./ReelItem";

export interface ReelCopy {
  hint: string;
  restHint: string;
  prev: string;
  next: string;
  a11y: { region: string; roleCarousel: string; roleItem: string; nav: string };
  cursor: { drag: string; enter: string };
}

/** mask-up for the section heading on entry (Spec §06 animation table) */
const MASKED = { clipPath: "inset(-30% -4% 130% -4%)", yPercent: 100 };
const SHOWN = { clipPath: "inset(-30% -4% -10% -4%)", yPercent: 0 };

const noop = () => () => {};

/**
 * S2 · Project Reel (Spec §06, Revelado 2.2 §7). Four pieces on one axis: the active one at
 * reel geometry (76vw at 1440, max 1094), neighbours showing at the edges, one piece per
 * gesture. Not a carousel library: drag (mouse, pen, touch with axis lock), horizontal
 * trackpad / Shift+wheel, keys, the 01–04 buttons. The vertical wheel is never touched.
 *
 * `activeIndex` is React state (it changes structure: tab order, video lifecycle, labels);
 * the track position is GSAP's. Without JavaScript the reel is a vertical list (Phase 1).
 */
export function ProjectReel({ label, heading, items, copy }: { label: string; heading: string; items: ReelItemView[]; copy: ReelCopy }) {
  const rootRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  const [settled, setSettled] = useState(true);
  const [near, setNear] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [interacted, setInteracted] = useState(false);
  const rm = usePrefersReducedMotion();
  const saveData = useSyncExternalStore(noop, isSaveData, () => false);

  const activeRef = useRef(0);
  const geo = useRef<{ widths: number[]; gap: number; vw: number }>({ widths: [], gap: 0, vw: 0 });
  const halfVisible = useRef(false);
  const rmRef = useRef(rm);

  const count = items.length;

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const lis = Array.from(track.children) as HTMLElement[];
    geo.current = {
      widths: lis.map((li) => li.getBoundingClientRect().width),
      gap: parseFloat(getComputedStyle(track).columnGap) || 0,
      vw: window.innerWidth,
    };
  }, []);

  const offsetFor = useCallback((i: number) => {
    const g = geo.current;
    return trackOffset(i, g.widths, g.vw, g.gap);
  }, []);

  /** move to piece `i` (one settle); `focus` moves focus to its "Ver caso" (keyboard inside the reel) */
  const goTo = useCallback(
    (target: number, opts: { focus?: boolean } = {}) => {
      const track = trackRef.current;
      const root = rootRef.current;
      if (!track || !root) return;
      const i = Math.max(0, Math.min(count - 1, target));
      const changed = i !== activeRef.current;
      activeRef.current = i;
      setActive(i);
      setSettled(false);
      setInteracted(true);
      const instant = rmRef.current;
      const frames = Array.from(track.querySelectorAll<HTMLElement>('[data-part="frame"]'));
      gsap.killTweensOf(track);
      gsap.to(track, {
        x: offsetFor(i),
        duration: instant ? 0 : SETTLE,
        ease: EASE.settle,
        onComplete: () => {
          setSettled(true);
          if (changed) setAnnounce(items[i].liveLabel);
        },
      });
      frames.forEach((f, j) => gsap.to(f, { opacity: j === i ? 1 : 0.55, duration: instant ? 0 : SETTLE, ease: EASE.settle, overwrite: true }));
      if (opts.focus) {
        requestAnimationFrame(() => root.querySelector<HTMLElement>(`.reel-item[data-index="${i}"] [data-enter]`)?.focus({ preventScroll: true }));
      }
    },
    [count, items, offsetFor],
  );

  // ── geometry, gestures, keys ─────────────────────────────────────────────────
  useLayoutEffect(() => {
    registerGsap();
    const root = rootRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!root || !viewport || !track) return;
    let ctx: gsap.Context | null = null;
    try {
      ctx = gsap.context(() => {
        measure();
        gsap.set(track, { x: offsetFor(activeRef.current) });
        // the heading masks up once, when the reel top reaches 80% of the viewport
        const h = root.querySelector<HTMLElement>('[data-part="heading"]');
        if (h && !rmRef.current) {
          gsap.set(h, MASKED);
          ScrollTrigger.create({
            trigger: root,
            start: "top 80%",
            once: true,
            onEnter: () => gsap.to(h, { ...SHOWN, duration: 0.6, ease: EASE.settle }),
          });
        }
      }, root);
    } catch (err) {
      // the reel falls back to its static list; nothing else is affected (Spec §24)
      root.removeAttribute("data-anim");
      if (process.env.NODE_ENV !== "production") console.error("[ProjectReel] build failed", err);
      return;
    }

    const ro = new ResizeObserver(() => {
      measure();
      gsap.killTweensOf(track);
      gsap.set(track, { x: offsetFor(activeRef.current) });
    });
    ro.observe(viewport);

    // one piece per horizontal gesture; vertical deltas pass through untouched
    const wheel = createWheelGesture();
    const onWheel = (e: WheelEvent) => {
      const d = horizontalDelta(e);
      if (d === null) return;
      e.preventDefault();
      const step = wheel.push(d, e.timeStamp || performance.now());
      if (step) goTo(activeRef.current + step);
    };

    // drag: mouse, pen, touch (touch decides its axis after 8px; vertical goes to the page)
    let drag: {
      id: number;
      x0: number;
      y0: number;
      start: number;
      axis: "x" | "y" | null;
      dx: number;
      samples: { x: number; t: number }[];
    } | null = null;
    let suppressClick = false;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, start: 0, axis: null, dx: 0, samples: [] };
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0;
      const dy = e.clientY - drag.y0;
      if (!drag.axis) {
        const lock = e.pointerType === "touch" ? AXIS_LOCK : 3;
        if (Math.hypot(dx, dy) < lock) return;
        drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (drag.axis === "y") {
          // vertical: the page scrolls; the reel goes back to rest
          drag = null;
          goTo(activeRef.current);
          return;
        }
        // horizontal: take the track from wherever a settle had it, continuing from this finger
        gsap.killTweensOf(track);
        drag.start = Number(gsap.getProperty(track, "x")) - dx;
        try {
          viewport.setPointerCapture(e.pointerId);
        } catch {
          // the pointer is no longer active: the drag continues on the viewport's own events
        }
        viewport.dataset.dragging = "";
        setSettled(false);
      }
      drag.dx = dx;
      gsap.set(track, { x: dragPosition(drag.start, dx, activeRef.current, count) });
      drag.samples.push({ x: e.clientX, t: e.timeStamp });
      if (drag.samples.length > 6) drag.samples.shift();
      if (Math.abs(dx) > CLICK_SLOP) suppressClick = true;
    };
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      delete viewport.dataset.dragging;
      if (viewport.hasPointerCapture?.(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
      if (d.axis !== "x") return;
      const i = activeRef.current;
      // the release is the last sample: a finger that stopped before lifting has no velocity
      const v = e.type === "pointercancel" ? 0 : velocity([...d.samples, { x: e.clientX, t: e.timeStamp }]);
      goTo(e.type === "pointercancel" ? i : releaseIndex(i, count, d.dx, v, geo.current.widths[i] ?? 1));
    };
    // click / tap: a neighbour comes to the center; the active frame enters its world
    const onClick = (e: MouseEvent) => {
      if (suppressClick) {
        suppressClick = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const target = e.target as HTMLElement;
      const li = target.closest<HTMLElement>(".reel-item");
      if (!li) return;
      const i = Number(li.dataset.index);
      if (i !== activeRef.current) {
        e.preventDefault();
        goTo(i);
        return;
      }
      if (target.closest("a")) return;
      if (target.closest('[data-part="frame"]')) {
        // Phase 4 replaces this with the in-journey jump (pushState + SCREEN state)
        const href = li.querySelector<HTMLAnchorElement>("[data-enter]")?.href;
        if (href) window.location.assign(href);
      }
    };
    const onDragStart = (e: DragEvent) => e.preventDefault();

    // keys: inside the reel, or on the page body while the reel is half in view (Spec §06)
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable], dialog")) return;
      const inside = !!el && root.contains(el);
      const onBody = !el || el === document.body;
      if (!inside && !(onBody && halfVisible.current)) return;
      const i = activeRef.current;
      let to: number | null = null;
      if (e.key === "ArrowRight") to = i + 1;
      else if (e.key === "ArrowLeft") to = i - 1;
      else if (e.key === "Home") to = 0;
      else if (e.key === "End") to = count - 1;
      else if (/^[1-9]$/.test(e.key) && Number(e.key) <= count) to = Number(e.key) - 1;
      if (to === null) return;
      e.preventDefault();
      goTo(to, { focus: inside });
    };

    const ioHalf = new IntersectionObserver(([en]) => (halfVisible.current = en.isIntersecting && en.intersectionRatio >= 0.5), {
      threshold: [0, 0.5],
    });
    ioHalf.observe(viewport);
    // a video may exist only while the reel is within one viewport
    const ioNear = new IntersectionObserver(([en]) => setNear(en.isIntersecting), { rootMargin: "100% 0px 100% 0px" });
    ioNear.observe(root);

    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("pointerdown", onDown);
    viewport.addEventListener("pointermove", onMove);
    viewport.addEventListener("pointerup", onUp);
    viewport.addEventListener("pointercancel", onUp);
    viewport.addEventListener("click", onClick, true);
    viewport.addEventListener("dragstart", onDragStart);
    document.addEventListener("keydown", onKey);
    return () => {
      ro.disconnect();
      ioHalf.disconnect();
      ioNear.disconnect();
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("pointerdown", onDown);
      viewport.removeEventListener("pointermove", onMove);
      viewport.removeEventListener("pointerup", onUp);
      viewport.removeEventListener("pointercancel", onUp);
      viewport.removeEventListener("click", onClick, true);
      viewport.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("keydown", onKey);
      ctx?.revert();
    };
  }, [count, goTo, measure, offsetFor]);

  // reduced motion flips mid-session: snap the track to the active piece without a tween
  useEffect(() => {
    rmRef.current = rm;
    const track = trackRef.current;
    if (!track || !geo.current.widths.length) return;
    gsap.set(track, { x: offsetFor(activeRef.current) });
  }, [rm, offsetFor]);

  const first = items[0];
  return (
    <section
      ref={rootRef}
      id="trabajo"
      aria-labelledby="trabajo-h"
      data-section="trabajo"
      data-anim=""
      className="reel"
      style={
        {
          "--r0-d": first.aspect.desktop[0] / first.aspect.desktop[1],
          "--r0-m": first.aspect.mobile[0] / first.aspect.mobile[1],
          "--active-r-d": items[active].aspect.desktop[0] / items[active].aspect.desktop[1],
          "--active-r-m": items[active].aspect.mobile[0] / items[active].aspect.mobile[1],
        } as CSSProperties
      }
    >
      <header className="reel-header">
        <p className="micro muted">{label}</p>
        <h2 id="trabajo-h" className="reel-heading" data-part="heading">
          {heading}
        </h2>
      </header>
      <div className="reel-stage" data-part="stage">
        <div
          ref={viewportRef}
          data-part="viewport"
          role="region"
          aria-roledescription={copy.a11y.roleCarousel}
          aria-label={copy.a11y.region}
          className="reel-viewport"
        >
          <ol ref={trackRef} data-part="track" className="reel-track">
            {items.map((item, i) => (
              <ReelItem
                key={item.id}
                item={item}
                index={i}
                active={i === active}
                side={i < active ? "before" : i > active ? "after" : "active"}
                distance={Math.abs(i - active)}
                settled={settled}
                near={near}
                reducedMotion={rm}
                saveData={saveData}
                roleItem={copy.a11y.roleItem}
              />
            ))}
          </ol>
          <ReelCursor viewportRef={viewportRef} labels={copy.cursor} />
        </div>
        <div className="reel-controls" data-part="controls">
          <button type="button" className="reel-step" aria-label={copy.prev} disabled={active === 0} onClick={() => goTo(active - 1)}>
            <span aria-hidden="true">←</span>
          </button>
          <nav aria-label={copy.a11y.nav} className="reel-nav">
            {items.map((item, i) => (
              <button key={item.id} type="button" aria-current={i === active ? "true" : undefined} className="reel-nav-item" onClick={() => goTo(i)}>
                <span className="reel-nav-num micro">{item.miniLabel.slice(0, 2)}</span>
                <span className="reel-nav-name micro">{` · ${item.name}`}</span>
              </button>
            ))}
          </nav>
          <button type="button" className="reel-step" aria-label={copy.next} disabled={active === count - 1} onClick={() => goTo(active + 1)}>
            <span aria-hidden="true">→</span>
          </button>
          <p className="reel-hint micro muted">{interacted ? copy.restHint : copy.hint}</p>
        </div>
        <div aria-live="polite" className="sr-only" data-part="live">
          {announce}
        </div>
      </div>
    </section>
  );
}
