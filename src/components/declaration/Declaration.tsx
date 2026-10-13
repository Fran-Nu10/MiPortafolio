"use client";

import { useRef, type CSSProperties } from "react";
import { EASE } from "@/lib/motion";
import { useScene } from "@/lib/useScene";
import { DEC_AT, DEC_STATES, DEC_UNITS, FIELD_PORTRAIT, FIELD_WIDE, LOOSE, TABLET_FS, decVariant, fieldPoses, foundPose, span, trackAxis, within } from "@/lib/declaration";

export interface DeclarationView {
  /** sr-only section heading */
  heading: string;
  /** MOSTRAR, CONVENCER, CONVERTIR: each act's words, its protagonist and its line */
  acts: { title: string; words: string[]; line: string }[];
  /** act III's line, split for its typography (the text reads exactly as the line) */
  final: { first: string; lead: string; word: string; mark: string };
  close: string;
}

const ID = "propuesta";

/** a field word's first-paint pose, for both drawings (CSS picks one per variant) */
function fieldVars(i: number): CSSProperties {
  const w = FIELD_WIDE[i];
  const p = FIELD_PORTRAIT[i];
  return {
    "--x": w.x,
    "--y": w.y,
    "--fs": w.fs,
    "--o": w.o,
    "--z": `${w.z}px`,
    "--px": p.x,
    "--py": p.y,
    "--pfs": p.fs,
    "--tfs": +(p.fs * TABLET_FS).toFixed(3),
    "--po": p.o,
  } as CSSProperties;
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
 * S12b · The commercial declaration (Content Master 20; docs/22). One sticky stage, scrub 0.6,
 * label snap: CAMPO → DESCUBRE → MOSTRAR → ORDEN → CONVENCER → ACCION → CONVERTIR → ELIJAN (see
 * lib/declaration). Transforms, opacity and clip-path only; every position is laid out by CSS
 * from the first paint and measured once per build. Reduced motion, tiny viewports and no JS: the
 * same text as a static editorial page (three acts stacked, no pin).
 */
export function Declaration({ view }: { view: DeclarationView }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [one, two, three] = view.acts;

  useScene(stageRef, {
    id: ID,
    pin: "sticky",
    units: () => DEC_UNITS,
    build: (api) => {
      // the static editorial layout (CSS) under reduced motion and on tiny viewports
      if (api.rm || !api.pinned) return null;
      const { gsap, q } = api;
      const pick = (sel: string) => q(sel)[0];
      const space = pick('[data-part="space"]');
      const W = space.clientWidth;
      const H = space.clientHeight;
      const variant = decVariant(window.innerWidth, window.innerHeight);
      const depth = api.depth && variant === "wide";
      const axis = trackAxis(variant);
      const poses = fieldPoses(variant);

      const field = q('[data-part="fw"]');
      const words = [1, 2, 3].map((n) => pick(`[data-part="word"][data-w="${n}"]`));
      const lines = [1, 2].map((n) => pick(`[data-part="statement"][data-l="${n}"]`));
      const slots = [1, 2, 3].map((n) => pick(`[data-part="slot"][data-i="${n}"]`));
      const ap1 = q('[data-part="ap"][data-w="1"]');
      const ap3 = q('[data-part="ap"][data-w="3"]');
      const cells = q('[data-part="gw"]');
      const rules = q('[data-part="rule"]');
      const nums = q('[data-part="n"]');
      const track = pick('[data-part="track"]');
      const actions = q('[data-part="action"]');
      const dots = q('[data-part="dot"]');
      const finalA = pick('[data-part="final-a"]');
      const finalIn = pick('[data-part="final-in"]');
      const close = pick('[data-part="close"]');

      const tl = gsap.timeline({ defaults: { ease: EASE.none } });
      for (const s of DEC_STATES) tl.addLabel(`s:${s}`, DEC_AT[s]);

      // a protagonist shrinks into its index line (top left), from its own layout box
      const toIndex = (i: number, state: (typeof DEC_STATES)[number]) => {
        const w = box(words[i], space);
        const s = box(slots[i], space);
        tl.fromTo(
          words[i],
          { x: 0, y: 0, scale: 1, transformOrigin: "0% 0%" },
          { x: s.x - w.x, y: s.y - w.y, scale: s.h / w.h, transformOrigin: "0% 0%", duration: span(state, 0, 0.45), ease: EASE.reveal, immediateRender: false },
          within(state, 0),
        );
      };
      // an aperture: the word opens from its center line, the two red edges part with it
      const aperture = (i: number, edges: HTMLElement[], state: (typeof DEC_STATES)[number], a: number, b: number) => {
        const half = box(words[i], space).h / 2;
        tl.fromTo(words[i], { clipPath: "inset(50% 0% 50% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: span(state, a, b), ease: EASE.reveal, immediateRender: true }, within(state, a));
        edges.forEach((e, k) => tl.fromTo(e, { y: 0 }, { y: k === 0 ? -half : half, duration: span(state, a, b), ease: EASE.reveal, immediateRender: false }, within(state, a)));
        tl.fromTo(edges, { opacity: 1 }, { opacity: 0, duration: span(state, b - 0.12, b + 0.08), immediateRender: false }, within(state, b - 0.12));
      };
      const lineIn = (el: HTMLElement, state: (typeof DEC_STATES)[number], a: number, b: number) =>
        tl.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: span(state, a, b), ease: EASE.settle, immediateRender: true }, within(state, a));
      const lineOut = (el: HTMLElement, state: (typeof DEC_STATES)[number]) =>
        tl.fromTo(el, { opacity: 1, y: 0 }, { opacity: 0, y: -12, duration: span(state, 0, 0.25), immediateRender: false }, within(state, 0));

      // ── I · discovery: the latent field comes forward, into contrast ──
      field.forEach((el, i) => {
        const p = poses[i];
        const f = foundPose(p);
        tl.fromTo(
          el,
          { x: 0, y: 0, z: depth ? p.z : 0, scale: 1, opacity: p.o, transformOrigin: "0% 0%" },
          { x: (f.x - p.x) * W, y: (f.y - p.y) * H, z: 0, opacity: f.o, duration: span("DESCUBRE", 0.05 + (i % 3) * 0.05, 1), ease: EASE.settle, immediateRender: true },
          within("DESCUBRE", 0.05 + (i % 3) * 0.05),
        );
      });

      // ── … drawn into one red line, which opens on MOSTRAR. ──
      const line1 = box(ap1[0], space);
      const order = poses.map((p, i) => ({ i, x: foundPose(p).x })).sort((a, b) => a.x - b.x);
      const SHRINK = 0.35;
      order.forEach(({ i }, rank) => {
        const p = poses[i];
        const f = foundPose(p);
        const b = box(field[i], space);
        const tx = line1.x + (rank / (order.length - 1)) * Math.max(0, line1.w - b.w * SHRINK);
        const ty = line1.y + line1.h / 2 - (b.h * SHRINK) / 2;
        tl.fromTo(
          field[i],
          { x: (f.x - p.x) * W, y: (f.y - p.y) * H, scale: 1, opacity: f.o },
          { x: tx - b.x, y: ty - b.y, scale: SHRINK, opacity: 0, duration: span("MOSTRAR", 0.04 + rank * 0.02, 0.5), ease: EASE.reveal, immediateRender: false },
          within("MOSTRAR", 0.04 + rank * 0.02),
        );
      });
      tl.fromTo(ap1, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, transformOrigin: "0% 50%", duration: span("MOSTRAR", 0, 0.4), ease: EASE.settle, immediateRender: true }, within("MOSTRAR", 0));
      aperture(0, ap1, "MOSTRAR", 0.48, 0.86);
      lineIn(lines[0], "MOSTRAR", 0.74, 1);

      // ── II · organization: MOSTRAR. to the index; six loose words settle into a grid ──
      toIndex(0, "ORDEN");
      lineOut(lines[0], "ORDEN");
      cells.forEach((el, i) => {
        const l = LOOSE[i];
        tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: span("ORDEN", 0.12, 0.42), immediateRender: true }, within("ORDEN", 0.12 + i * 0.02));
        tl.fromTo(
          el,
          { x: l.dx * W, y: l.dy * H, scale: l.scale, transformOrigin: "0% 0%" },
          { x: 0, y: 0, scale: 1, transformOrigin: "0% 0%", duration: span("ORDEN", 0.3, 0.88), ease: EASE.reveal, immediateRender: true },
          within("ORDEN", 0.3 + i * 0.015),
        );
      });
      rules.forEach((el, i) =>
        tl.fromTo(el, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, transformOrigin: "0% 50%", duration: span("ORDEN", 0.45, 0.9), ease: EASE.settle, immediateRender: true }, within("ORDEN", 0.45 + i * 0.015)),
      );
      tl.fromTo(nums, { opacity: 0 }, { opacity: 1, duration: span("ORDEN", 0.65, 1), immediateRender: true }, within("ORDEN", 0.65));

      // … CONVENCER. rises over the grid, which steps back
      const wordIn2 = words[1].querySelector<HTMLElement>('[data-part="word-in"]')!;
      tl.fromTo(cells, { opacity: 1 }, { opacity: 0.5, duration: span("CONVENCER", 0, 0.4), immediateRender: false }, within("CONVENCER", 0));
      // y stays 0: the CSS first state (translateY 105%) would otherwise be read as pixels
      tl.fromTo(wordIn2, { y: 0, yPercent: 105 }, { y: 0, yPercent: 0, duration: span("CONVENCER", 0.08, 0.72), ease: EASE.settle, immediateRender: true }, within("CONVENCER", 0.08));
      lineIn(lines[1], "CONVENCER", 0.58, 1);

      // ── III · resolution: the grid collapses into one track; four actions light on it ──
      toIndex(1, "ACCION");
      lineOut(lines[1], "ACCION");
      tl.fromTo(cells, { opacity: 0.5, y: 0 }, { opacity: 0, y: -8, duration: span("ACCION", 0, 0.35), immediateRender: false }, within("ACCION", 0));
      tl.fromTo(nums, { opacity: 1 }, { opacity: 0, duration: span("ACCION", 0, 0.3), immediateRender: false }, within("ACCION", 0));
      tl.fromTo(rules, { scaleX: 1, transformOrigin: "100% 50%" }, { scaleX: 0, transformOrigin: "100% 50%", duration: span("ACCION", 0.08, 0.45), immediateRender: false }, within("ACCION", 0.08));
      const trackProp = axis === "x" ? "scaleX" : "scaleY";
      const trackOrigin = axis === "x" ? "0% 50%" : "50% 0%";
      tl.fromTo(track, { [trackProp]: 0, opacity: 1, transformOrigin: trackOrigin }, { [trackProp]: 1, transformOrigin: trackOrigin, duration: span("ACCION", 0.28, 0.66), ease: EASE.settle, immediateRender: true }, within("ACCION", 0.28));
      // the labels sit on their stops: the first starts there, the last ends there (horizontal track)
      if (axis === "x") actions.forEach((el, k) => gsap.set(el, { xPercent: k === 0 ? 0 : k === actions.length - 1 ? -100 : -50 }));
      else gsap.set(actions, { yPercent: -50 });
      tl.fromTo(actions, { opacity: 0, [axis === "x" ? "y" : "x"]: axis === "x" ? 10 : -10 }, { opacity: 0.45, x: 0, y: 0, duration: span("ACCION", 0.4, 0.68), ease: EASE.settle, stagger: span("ACCION", 0, 0.03), immediateRender: true }, within("ACCION", 0.4));
      actions.forEach((el, k) => {
        // after its own arrival: one property, one tween at a time
        const at = within("ACCION", 0.7 + k * 0.07);
        tl.fromTo(el, { opacity: 0.45 }, { opacity: 1, duration: span("ACCION", 0, 0.07), immediateRender: false }, at);
        tl.fromTo(dots[k], { scale: 0 }, { scale: 1, duration: span("ACCION", 0, 0.07), ease: EASE.settle, immediateRender: true }, at);
      });

      // … they converge on one point; the point becomes the line; the line opens on CONVERTIR.
      const last = box(dots[dots.length - 1], space);
      dots.forEach((d) => {
        const b = box(d, space);
        tl.fromTo(d, { x: 0, y: 0 }, { x: last.x - b.x, y: last.y - b.y, duration: span("CONVERTIR", 0, 0.4), ease: EASE.reveal, immediateRender: false }, within("CONVERTIR", 0));
      });
      const drift = axis === "x" ? { x: 0.03 * W } : { y: 0.03 * H };
      tl.fromTo(actions, { opacity: 1, x: 0, y: 0 }, { opacity: 0, ...drift, duration: span("CONVERTIR", 0, 0.38), ease: EASE.reveal, immediateRender: false }, within("CONVERTIR", 0));
      tl.fromTo(track, { opacity: 1 }, { opacity: 0, duration: span("CONVERTIR", 0.15, 0.45), immediateRender: false }, within("CONVERTIR", 0.15));
      tl.fromTo(dots, { scale: 1 }, { scale: 0, duration: span("CONVERTIR", 0.4, 0.5), immediateRender: false }, within("CONVERTIR", 0.4));
      const apOrigin = axis === "x" ? "100% 50%" : "0% 50%";
      tl.fromTo(ap3, { scaleX: 0, transformOrigin: apOrigin }, { scaleX: 1, transformOrigin: apOrigin, duration: span("CONVERTIR", 0.38, 0.62), ease: EASE.settle, immediateRender: true }, within("CONVERTIR", 0.38));
      aperture(2, ap3, "CONVERTIR", 0.58, 0.92);

      // ── … CONVERTIR. to the index; the final phrase, then the conclusion ──
      toIndex(2, "ELIJAN");
      tl.fromTo(finalA, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: span("ELIJAN", 0.22, 0.55), ease: EASE.settle, immediateRender: true }, within("ELIJAN", 0.22));
      // 120%: below its mask including the descender room (105% let the cap tops peek through)
      tl.fromTo(finalIn, { y: 0, yPercent: 120 }, { y: 0, yPercent: 0, duration: span("ELIJAN", 0.38, 0.86), ease: EASE.settle, immediateRender: true }, within("ELIJAN", 0.38));
      lineIn(close, "ELIJAN", 0.7, 1);

      // the hold: the last state rests until the pin releases
      tl.set({}, {}, DEC_UNITS);
      return tl;
    },
  });

  return (
    <section id={ID} aria-labelledby="propuesta-h" data-section={ID} className="declaration">
      <h2 id="propuesta-h" className="sr-only">
        {view.heading}
      </h2>
      {/* the stage's pin: as tall as the stage plus the choreography's length (set by the scene) */}
      <div data-part="pin" className="dec-pin">
        <div ref={stageRef} data-part="stage" data-anim="" data-scene-root="" className="dec-stage">
          <div data-part="space" className="dec-space">
            <div className="dec-act" data-act="1">
              <ul className="dec-field">
                {one.words.map((w, i) => (
                  <li key={w} data-part="fw" className="dec-fw" style={fieldVars(i)}>
                    {w}
                  </li>
                ))}
              </ul>
              <span aria-hidden="true" data-part="ap" data-w="1" className="dec-ap" />
              <span aria-hidden="true" data-part="ap" data-w="1" className="dec-ap" />
              <h3 data-part="word" data-w="1" className="dec-word">
                <span data-part="word-in" className="dec-word-in">
                  {one.title}
                </span>
              </h3>
              <p data-part="statement" data-l="1" className="dec-line">
                {one.line}
              </p>
            </div>

            <div className="dec-act" data-act="2">
              <ol className="dec-grid">
                {two.words.map((w, i) => (
                  <li key={w} className="dec-cell" data-c={i}>
                    <span aria-hidden="true" data-part="rule" className="dec-rule" />
                    <span aria-hidden="true" data-part="n" className="micro muted dec-n">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span data-part="gw" className="dec-gw">
                      {w}
                    </span>
                  </li>
                ))}
              </ol>
              <h3 data-part="word" data-w="2" className="dec-word">
                <span data-part="word-in" className="dec-word-in">
                  {two.title}
                </span>
              </h3>
              <p data-part="statement" data-l="2" className="dec-line">
                {two.line}
              </p>
            </div>

            <div className="dec-act" data-act="3">
              <span aria-hidden="true" data-part="track" className="dec-track" />
              <ol className="dec-actions">
                {three.words.map((w, k) => (
                  <li key={w} data-part="action" data-k={k} className="dec-action">
                    {w}
                  </li>
                ))}
              </ol>
              {three.words.map((w, k) => (
                <span key={w} aria-hidden="true" data-part="dot" data-k={k} className="dec-dot" />
              ))}
              <span aria-hidden="true" data-part="ap" data-w="3" className="dec-ap" />
              <span aria-hidden="true" data-part="ap" data-w="3" className="dec-ap" />
              <h3 data-part="word" data-w="3" className="dec-word">
                <span data-part="word-in" className="dec-word-in">
                  {three.title}
                </span>
              </h3>
              <p className="dec-final">
                <span data-part="final-a" className="dec-final-a">
                  {view.final.first}
                </span>{" "}
                <span data-part="final-b" className="dec-final-b">
                  <span data-part="final-in" className="dec-final-in">
                    {view.final.lead}{" "}
                    <span className="dec-final-end">
                      {view.final.word}
                      <span className="dec-mark">{view.final.mark}</span>
                    </span>
                  </span>
                </span>
              </p>
            </div>

            <p data-part="close" className="dec-close">
              {view.close}
            </p>
            {/* where each protagonist comes to rest: the running index */}
            {[1, 2, 3].map((n) => (
              <span key={n} aria-hidden="true" data-part="slot" data-i={n} className="dec-slot" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
