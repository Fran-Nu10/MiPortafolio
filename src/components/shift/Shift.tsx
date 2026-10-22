"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { EASE } from "@/lib/motion";
import { useScene } from "@/lib/useScene";
import {
  EXPLODE,
  GRID_COLUMNS,
  LAYER_Z,
  AXO_SHIFT,
  PLANE_AXO,
  RESULT_SCALE,
  SCATTER,
  SHIFT_AT,
  SHIFT_STATES,
  SHIFT_UNITS,
  SHIFT_VARIANTS,
  UI_LAYOUT,
  explodeOffset,
  shiftVariant,
  span,
  within,
  type ShiftElement,
  type ShiftState,
  type ShiftVariant,
} from "@/lib/shift";

export interface ShiftView {
  /** the section's title, shown small (its working name, THE SHIFT, never is: Content Master 03) */
  heading: string;
  acts: { n: string; title: string; line: string; accent: string }[];
  /** the caption that says what the interface is */
  concept: string;
  notes: { grid: Record<ShiftVariant, string>; type: string; state: string };
  ui: {
    brand: string;
    nav: string[];
    cta: string;
    eyebrow: string;
    headline: string[];
    body: string;
    button: string;
    draft: string;
    live: string;
    toggle: string;
    cards: string[];
    label: string;
  };
}

const ID = "shift";
const PREFIX: Record<ShiftVariant, string> = { wide: "w", tablet: "t", phone: "p" };

/** a fragment's place in each variant's finished interface (CSS picks one; absent → not drawn) */
function place(k: ShiftElement): CSSProperties {
  const vars: Record<string, string | number> = {};
  for (const v of SHIFT_VARIANTS) {
    const r = UI_LAYOUT[v][k];
    const p = PREFIX[v];
    if (!r) {
      vars[`--${p}d`] = "none";
      continue;
    }
    vars[`--${p}x`] = r.x;
    vars[`--${p}y`] = r.y;
    vars[`--${p}w`] = r.w;
    vars[`--${p}h`] = r.h;
    if (r.fs) vars[`--${p}fs`] = r.fs;
  }
  return vars as CSSProperties;
}

/** one fragment: its raw state (acts I–II) and its finished one (III–IV), the same object throughout */
function Fragment({ k, raw, done }: { k: ShiftElement; raw?: ReactNode; done?: ReactNode }) {
  return (
    <div data-part="el" data-k={k} className={`sh-el sh-${k}`} style={place(k)}>
      <div data-part="raw" className="sh-raw">
        {raw}
      </div>
      <div data-part="done" className="sh-done">
        {done ?? raw}
      </div>
    </div>
  );
}

/** an element's layout box in the design space (offsets ignore transforms) */
function box(el: HTMLElement, space: HTMLElement) {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== space) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

/**
 * S2b · THE SHIFT (docs/25; Content Master 23): between the reel (what is built) and the
 * capabilities (which disciplines), how complexity becomes product. One sticky stage, scrub 0.6,
 * label snap: DESORDEN → DIRECCION → EJECUCION → RESULTADO (lib/shift). Transforms and opacity only;
 * every fragment is laid out by CSS where the finished interface has it, and the disorder is the
 * inverse transform measured once per build (FLIP), so the fragments are the interface. Reduced
 * motion, tiny viewports and no JS: the four lines and the finished interface, static.
 */
export function Shift({ view }: { view: ShiftView }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const ui = view.ui;

  useScene(stageRef, {
    id: ID,
    pin: "sticky",
    // the holder is SHIFT_UNITS gestures tall in CSS from the first paint (globals.css .shift-pin), so
    // the scene builds when the visitor approaches, outside the page load (as the declaration)
    presized: true,
    lazy: true,
    units: () => SHIFT_UNITS,
    build: (api) => {
      // the static page (CSS) under reduced motion and on tiny viewports
      if (api.rm || !api.pinned) return null;
      const { gsap, q } = api;
      const pick = (sel: string) => q(sel)[0];
      const space = pick('[data-part="space"]');
      const plane = pick('[data-part="plane"]');
      const W = space.clientWidth;
      const H = space.clientHeight;
      const variant = shiftVariant(window.innerWidth, window.innerHeight);
      const depth = api.depth && variant === "wide";

      // the fragments this variant draws (the others are display: none)
      const els = q('[data-part="el"]').filter((el) => el.offsetWidth > 0);
      const keys = els.map((el) => el.dataset.k as ShiftElement);
      const raw = els.map((el) => el.querySelector<HTMLElement>('[data-part="raw"]')!);
      const done = els.map((el) => el.querySelector<HTMLElement>('[data-part="done"]')!);
      const frameAt = keys.indexOf("frame");
      const acts = q('[data-part="act"]');
      const cols = q('[data-part="col"]').filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0);
      const notes = q('[data-part="note"]').filter((el) => el.offsetWidth > 0);
      const noteLines = notes.map((n) => n.querySelector<HTMLElement>('[data-part="note-line"]')!);
      const concept = pick('[data-part="concept"]');
      const knob = pick('[data-part="knob"]');
      const track = pick('[data-part="track"]');
      const on = pick('[data-part="on"]');
      const draft = pick('[data-part="draft"]');
      const live = pick('[data-part="live"]');
      const fill = pick('[data-part="fill"]');
      const answer = pick('[data-part="answer"]');
      const card2 = els[keys.indexOf("card2")];

      // every measure first, before any write: the build never forces a style recalculation
      const boxes = els.map((el) => box(el, space));
      const planeBox = box(plane, space);
      const uiCy = planeBox.y + planeBox.h / 2;
      const travel = track.offsetWidth - knob.offsetWidth - 2 * knob.offsetLeft;
      const lift = -0.035 * planeBox.h;

      // act I: each fragment's first pose, as an offset from its own place (FLIP)
      const poses = keys.map((k) => SCATTER[variant][k]!);
      const dx = (i: number) => poses[i].x * W - (boxes[i].x + boxes[i].w / 2);
      const dy = (i: number) => poses[i].y * H - (boxes[i].y + boxes[i].h / 2);
      // act II: lifted into its layer (lg/xl) or spread from the center line (flat)
      const ey = (i: number) => (depth ? 0 : explodeOffset(boxes[i].y + boxes[i].h / 2, uiCy));
      const ez = (i: number) => (depth ? LAYER_Z[keys[i]] * W : 0);

      // the first state of every staggered group, set outright: a staggered fromTo renders only its
      // first target immediately (the others would show their final state until the playhead got there)
      gsap.set(cols, { scaleY: 0, opacity: 0, transformOrigin: "50% 0%" });
      gsap.set(done, { opacity: 0 });
      gsap.set(notes, { opacity: 0 });
      gsap.set(noteLines, { scaleX: 0, transformOrigin: "0% 50%" });

      const tl = gsap.timeline({ defaults: { ease: EASE.none } });
      for (const s of SHIFT_STATES) tl.addLabel(`s:${s}`, SHIFT_AT[s]);

      // the act lines (docs/26 §B): one at a time. The old one leaves upward; the new one rises out of
      // its mask, its first words, then its red accent — the protagonist of each act
      const lead = acts.map((a) => a.querySelector<HTMLElement>('[data-part="lead"]')!);
      const accent = acts.map((a) => a.querySelector<HTMLElement>('[data-part="accent"]')!);
      gsap.set(acts.slice(1), { opacity: 1 });
      gsap.set([...lead.slice(1), ...accent.slice(1)], { yPercent: 110 });
      const swap = (from: number, state: ShiftState) => {
        tl.fromTo([lead[from], accent[from]], { yPercent: 0 }, { yPercent: -110, duration: span(state, 0, 0.3), ease: EASE.reveal, stagger: span(state, 0, 0.04), immediateRender: false }, within(state, 0));
        tl.fromTo(acts[from].querySelector(".shift-act-n"), { opacity: 1 }, { opacity: 0, duration: span(state, 0, 0.2), immediateRender: false }, within(state, 0));
        tl.fromTo(acts[from + 1].querySelector(".shift-act-n"), { opacity: 0 }, { opacity: 1, duration: span(state, 0.36, 0.56), immediateRender: true }, within(state, 0.36));
        tl.fromTo(lead[from + 1], { yPercent: 110 }, { yPercent: 0, duration: span(state, 0.4, 0.78), ease: EASE.settle, immediateRender: false }, within(state, 0.4));
        tl.fromTo(accent[from + 1], { yPercent: 110 }, { yPercent: 0, duration: span(state, 0.5, 0.9), ease: EASE.settle, immediateRender: false }, within(state, 0.5));
      };

      // ── I → II · the direction: straighten, align, find the grid ──
      swap(0, "DIRECCION");
      // nearest to its place first: the order reads as a decision, not a burst
      const dist = els.map((_, i) => Math.hypot(dx(i), dy(i)));
      const maxDist = Math.max(1, ...dist);
      els.forEach((el, i) =>
        tl.fromTo(
          el,
          { x: dx(i), y: dy(i), z: 0, rotation: poses[i].r, scale: poses[i].s, opacity: poses[i].o, transformOrigin: "50% 50%" },
          { x: 0, y: ey(i), z: ez(i), rotation: 0, scale: 1, opacity: 1, duration: span("DIRECCION", 0.1, 0.78), ease: EASE.reveal, immediateRender: true },
          within("DIRECCION", 0.04) + (dist[i] / maxDist) * span("DIRECCION", 0, 0.14),
        ),
      );
      const axo = { ...PLANE_AXO, x: AXO_SHIFT.x * W, y: AXO_SHIFT.y * H };
      tl.fromTo(
        plane,
        { rotationX: 0, rotation: 0, scale: 1, x: 0, y: 0, transformOrigin: "50% 50%" },
        depth
          ? { ...axo, duration: span("DIRECCION", 0.2, 0.92), ease: EASE.reveal, immediateRender: true }
          : { rotationX: 0, rotation: 0, scale: EXPLODE.scale, x: 0, y: 0, duration: span("DIRECCION", 0.2, 0.92), ease: EASE.reveal, immediateRender: true },
        within("DIRECCION", 0.2),
      );
      // the grid appears as the fragments find it, column by column
      tl.fromTo(cols, { scaleY: 0, opacity: 0, transformOrigin: "50% 0%" }, { scaleY: 1, opacity: 1, duration: span("DIRECCION", 0.45, 0.85), ease: EASE.settle, stagger: span("DIRECCION", 0, 0.012), immediateRender: true }, within("DIRECCION", 0.45));

      // ── II → III · the execution: the layers close, the surface fills, the type takes its color ──
      swap(1, "EJECUCION");
      tl.fromTo(
        els,
        { x: 0, y: ey, z: ez },
        { x: 0, y: 0, z: 0, duration: span("EJECUCION", 0, 0.5), ease: EASE.reveal, immediateRender: false },
        within("EJECUCION", 0),
      );
      tl.fromTo(
        plane,
        depth ? { ...axo } : { rotationX: 0, rotation: 0, scale: EXPLODE.scale, x: 0, y: 0 },
        { rotationX: 0, rotation: 0, scale: 1, x: 0, y: 0, duration: span("EJECUCION", 0, 0.55), ease: EASE.reveal, immediateRender: false },
        within("EJECUCION", 0),
      );
      tl.fromTo(cols, { opacity: 1 }, { opacity: 0, duration: span("EJECUCION", 0.45, 0.7), immediateRender: false }, within("EJECUCION", 0.45));
      // the surface first, then everything on it
      if (frameAt >= 0) {
        tl.fromTo(done[frameAt], { opacity: 0 }, { opacity: 1, duration: span("EJECUCION", 0.4, 0.62), immediateRender: true }, within("EJECUCION", 0.4));
        tl.fromTo(raw[frameAt], { opacity: 1 }, { opacity: 0, duration: span("EJECUCION", 0.4, 0.62), immediateRender: false }, within("EJECUCION", 0.4));
      }
      const content = els.map((_, i) => i).filter((i) => i !== frameAt);
      tl.fromTo(
        content.map((i) => done[i]),
        { opacity: 0 },
        { opacity: 1, duration: span("EJECUCION", 0.5, 0.72), stagger: span("EJECUCION", 0, 0.006), immediateRender: true },
        within("EJECUCION", 0.5),
      );
      tl.fromTo(content.map((i) => raw[i]), { opacity: 1 }, { opacity: 0, duration: span("EJECUCION", 0.48, 0.66), immediateRender: false }, within("EJECUCION", 0.48));

      // the gesture: «Publicar» switches on, the state follows, the bar fills, a module answers
      tl.fromTo(knob, { x: 0 }, { x: travel, duration: span("EJECUCION", 0.74, 0.86), ease: EASE.settle, immediateRender: true }, within("EJECUCION", 0.74));
      tl.fromTo(on, { opacity: 0 }, { opacity: 1, duration: span("EJECUCION", 0.74, 0.84), immediateRender: true }, within("EJECUCION", 0.74));
      tl.fromTo(draft, { opacity: 1 }, { opacity: 0, duration: span("EJECUCION", 0.8, 0.86), immediateRender: false }, within("EJECUCION", 0.8));
      tl.fromTo(live, { opacity: 0 }, { opacity: 1, duration: span("EJECUCION", 0.84, 0.92), immediateRender: true }, within("EJECUCION", 0.84));
      tl.fromTo(fill, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: span("EJECUCION", 0.8, 1), ease: EASE.settle, immediateRender: true }, within("EJECUCION", 0.8));
      if (card2) tl.fromTo(card2, { y: 0 }, { y: lift, duration: span("EJECUCION", 0.86, 1), ease: EASE.settle, immediateRender: false }, within("EJECUCION", 0.86));
      tl.fromTo(answer, { opacity: 0 }, { opacity: 1, duration: span("EJECUCION", 0.86, 1), immediateRender: true }, within("EJECUCION", 0.86));

      // ── III → IV · the result: the camera steps back, the system is annotated ──
      swap(2, "RESULTADO");
      tl.fromTo(plane, { scale: 1 }, { scale: RESULT_SCALE[variant], duration: span("RESULTADO", 0.05, 0.7), ease: EASE.settle, immediateRender: false }, within("RESULTADO", 0.05));
      tl.fromTo(noteLines, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: span("RESULTADO", 0.4, 0.75), ease: EASE.settle, stagger: span("RESULTADO", 0, 0.06), immediateRender: true }, within("RESULTADO", 0.4));
      tl.fromTo(notes, { opacity: 0 }, { opacity: 1, duration: span("RESULTADO", 0.42, 0.72), stagger: span("RESULTADO", 0, 0.06), immediateRender: true }, within("RESULTADO", 0.42));
      // the caption follows the interface's lower left corner as it steps back
      const k = 1 - RESULT_SCALE[variant];
      const cx = (k * planeBox.w) / 2;
      const cy = -(k * planeBox.h) / 2;
      tl.fromTo(concept, { opacity: 0, x: cx, y: cy + 8 }, { opacity: 1, x: cx, y: cy, duration: span("RESULTADO", 0.6, 0.95), ease: EASE.settle, immediateRender: true }, within("RESULTADO", 0.6));

      // the hold: the result rests until the pin releases
      tl.set({}, {}, SHIFT_UNITS);
      return tl;
    },
  });

  return (
    <section id={ID} aria-labelledby="shift-h" data-section={ID} className="shift">
      {/* the stage's pin: as tall as the stage plus the choreography's length (set by the scene) */}
      <div data-part="pin" className="shift-pin">
        <div ref={stageRef} data-part="stage" data-anim="" className="shift-stage">
          <div data-part="space" className="shift-space">
            <h2 id="shift-h" className="shift-title micro">
              {view.heading}
            </h2>
            <ol className="shift-acts">
              {view.acts.map((a) => (
                <li key={a.n} data-part="act" data-a={a.n} className="shift-act">
                  <span className="shift-act-n micro">
                    {a.n} — {a.title}
                  </span>
                  {/* the line reads as one sentence; its two halves move on their own (the accent in red) */}
                  <p className="shift-line">
                    <span className="shift-mask">
                      <span data-part="lead" className="shift-lead">
                        {a.line.slice(0, a.line.length - a.accent.length).trimEnd()}
                      </span>
                    </span>{" "}
                    <span className="shift-mask">
                      <span data-part="accent" className="shift-accent">
                        {a.accent}
                      </span>
                    </span>
                  </p>
                </li>
              ))}
            </ol>

            <figure className="shift-figure">
              <div data-part="plane" className="shift-ui" role="img" aria-label={ui.label}>
                <Fragment k="frame" />
                <div className="sh-grid" aria-hidden="true">
                  {Array.from({ length: GRID_COLUMNS.wide }, (_, i) => (
                    <span key={i} data-part="col" className="sh-col" />
                  ))}
                </div>
                <Fragment k="bar" />
                <Fragment k="rule" />
                <Fragment
                  k="visual"
                  raw={<span className="sh-cross" />}
                  done={
                    <span className="sh-poster">
                      <span className="sh-sun" />
                      <span className="sh-horizon" />
                      <span className="sh-poster-n">01</span>
                    </span>
                  }
                />
                {ui.cards.map((c, i) => (
                  <Fragment
                    key={c}
                    k={`card${i + 1}` as ShiftElement}
                    raw={
                      <>
                        <span className="sh-thumb" />
                        <span className="sh-card-n">{String(i + 1).padStart(2, "0")}</span>
                        <span className="sh-card-t">{c}</span>
                      </>
                    }
                    done={
                      <>
                        <span className="sh-thumb" data-shape={i} />
                        <span className="sh-card-n">{String(i + 1).padStart(2, "0")}</span>
                        <span className="sh-card-t">{c}</span>
                        {i === 1 ? <span data-part="answer" className="sh-answer" /> : null}
                      </>
                    }
                  />
                ))}
                <Fragment k="mark" />
                <Fragment k="word" raw={ui.brand} />
                {ui.nav.map((n, i) => (
                  <Fragment key={n} k={`nav${i + 1}` as ShiftElement} raw={n} />
                ))}
                <Fragment k="menu" raw={<span className="sh-menu-lines" />} />
                <Fragment k="cta" raw={ui.cta} />
                <Fragment k="eyebrow" raw={ui.eyebrow} />
                <Fragment k="h1a" raw={ui.headline[0]} />
                <Fragment k="h1b" raw={ui.headline[1]} />
                <Fragment k="body" raw={ui.body} />
                <Fragment k="button" raw={ui.button} />
                <Fragment
                  k="chip"
                  raw={<span className="sh-chip-label">{ui.draft}</span>}
                  done={
                    <>
                      <span data-part="draft" className="sh-chip-label">
                        {ui.draft}
                      </span>
                      <span data-part="live" className="sh-chip-label" data-live="">
                        {ui.live}
                      </span>
                    </>
                  }
                />
                <Fragment
                  k="toggle"
                  raw={
                    <>
                      <span className="sh-toggle-label">{ui.toggle}</span>
                      <span className="sh-track">
                        <span className="sh-knob" />
                      </span>
                    </>
                  }
                  done={
                    <>
                      <span className="sh-toggle-label">{ui.toggle}</span>
                      <span data-part="track" className="sh-track">
                        <span data-part="on" className="sh-track-on" />
                        <span data-part="knob" className="sh-knob" />
                      </span>
                    </>
                  }
                />
                <Fragment
                  k="progress"
                  raw={<span className="sh-meter" />}
                  done={
                    <span className="sh-meter">
                      <span data-part="fill" className="sh-meter-fill" />
                    </span>
                  }
                />
              </div>
              <figcaption data-part="concept" className="shift-concept micro">
                {view.concept}
              </figcaption>
            </figure>

            {/* act IV: the system, annotated (decorative: the interface's label already describes it) */}
            <p data-part="note" data-n="grid" className="sh-note" aria-hidden="true">
              <span data-part="note-line" className="sh-note-line" />
              {SHIFT_VARIANTS.map((v) => (
                <span key={v} data-v={v} className="sh-note-v">
                  {view.notes.grid[v]}
                </span>
              ))}
            </p>
            <p data-part="note" data-n="type" className="sh-note" aria-hidden="true">
              <span data-part="note-line" className="sh-note-line" />
              {view.notes.type}
            </p>
            <p data-part="note" data-n="state" className="sh-note" aria-hidden="true">
              <span data-part="note-line" className="sh-note-line" />
              {view.notes.state}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
