"use client";

import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TS_GROUP_Z } from "@/data/ts-reveal";
import { EASE, registerGsap, ScrollTrigger } from "@/lib/motion";
import {
  AUTO,
  TS_LAYOUT,
  TS_T,
  TS_UNITS,
  TS_UNITS_RM,
  perceived,
  project,
  ts09aTime,
  tsVariant,
  type Pt,
  type TsVariant,
} from "@/lib/ts-world";
import type { SceneApi } from "@/lib/useScene";
import { TravelSuiteReveal } from "./TravelSuiteReveal";
import { WorldScene, type WorldBuildContext, type WorldSceneExtension, type WorldView } from "./WorldScene";

/** Content Master 06, verbatim, split into the pieces each state shows */
export interface TsView {
  input: string;
  message: string;
  /** the three key words, as they appear in the message */
  words: { dest: string; date: string; pax: string };
  origin: string;
  interpretado: string;
  fields: Record<"dest" | "date" | "pax", { label: string; value: string }>;
  quote: { titles: [string, string]; rows: { label: string; value?: string }[]; tag: string };
  trip: { label: string; value: string; cells: { label: string; value?: string }[] };
  reservation: string;
  report: string;
  name: string;
  close: string;
}

const KEYS = ["dest", "date", "pax"] as const;
type Key = (typeof KEYS)[number];

/**
 * S3 · TravelSuite360 world (Spec §08, Revelado 2.2 §10). The shared shell (WorldScene) runs
 * SCREEN → ISOLATE → ESCAPE → EXPAND with the message as the escaping object; from `s:WORLD`
 * on this world continues the same timeline: TS01 raw → TS02 extraction → TS03 fields →
 * TS04 quote → TS05 selected → TS06 trip (→ TS07 reservation → TS08 report, automatic) →
 * TS09 big reveal (camera retreat) → TS10 name (automatic). TS11/TS12 are the proof and its
 * accent seam (ProjectProof). DOM + CSS 3D (lg/xl only) + GSAP; nothing random at runtime.
 *
 * Accessibility (Spec §19): the message, the `input` label, the origin line and the closing
 * line are real text; every other visual piece is aria-hidden and the states are summarized
 * once in an sr-only list. Without JavaScript (or on tiny screens) the world reads as text.
 */
export function TravelSuiteWorld({ world, ts, summary }: { world: WorldView; ts: TsView; summary: string[] }) {
  const [variant, setVariant] = useState<{ v: TsVariant; groups: number[] } | null>(null);
  const [mounted, setMounted] = useState(false);
  const pinRef = useRef<HTMLDivElement>(null);
  const tsRef = useRef(ts);

  // fragments live only within a viewport of the world (Spec §08 mount / unmount)
  useLayoutEffect(() => {
    registerGsap();
    const layer = pinRef.current;
    const holder = layer?.closest<HTMLElement>('[data-part="pin"]');
    if (!holder) return;
    const st = ScrollTrigger.create({
      trigger: holder,
      start: "top bottom+=100%",
      end: "bottom top-=100%",
      onToggle: (self) => setMounted(self.isActive),
    });
    return () => st.kill();
  }, []);

  const scene = useMemo<WorldSceneExtension>(
    () => ({
      units: (_tier, rm) => (rm ? TS_UNITS_RM : TS_UNITS),
      build: (api, tl, ctx) => {
        const v = tsVariant(api.tier, api.rm);
        const groups = buildTravelSuite(api, tl, ctx, v, tsRef.current);
        setVariant({ v, groups });
      },
    }),
    [],
  );

  return (
    <WorldScene world={world} scene={scene} summary={summary}>
      <TravelSuiteLayers ts={ts} variant={variant} mounted={mounted} layerRef={pinRef} />
    </WorldScene>
  );
}

function Message({ ts }: { ts: TsView }) {
  // split the sentence at its three key words (in order of appearance)
  const parts: { text: string; key?: Key }[] = [];
  let rest = ts.message;
  const order = [...KEYS].sort((a, b) => ts.message.indexOf(ts.words[a]) - ts.message.indexOf(ts.words[b]));
  for (const k of order) {
    const i = rest.indexOf(ts.words[k]);
    if (i < 0) continue;
    if (i > 0) parts.push({ text: rest.slice(0, i) });
    parts.push({ text: ts.words[k], key: k });
    rest = rest.slice(i + ts.words[k].length);
  }
  if (rest) parts.push({ text: rest });
  return (
    <p className="ts-msg ts-statement" data-part="msg">
      {parts.map((p, i) =>
        p.key ? (
          <span key={i} data-word={p.key}>
            {p.text}
          </span>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
    </p>
  );
}

function Rows({ rows, part }: { rows: { label: string; value?: string }[]; part: string }) {
  return (
    <>
      {rows.map((r) => (
        <div key={r.label} className="ts-row" data-part={part} data-row={r.label}>
          <span className="micro ts-row-label">{r.label}</span>
          {/* fields without a known value show the label and a rule only (Spec §08) */}
          <span className="ts-row-value">{r.value ?? ""}</span>
        </div>
      ))}
    </>
  );
}

function TravelSuiteLayers({
  ts,
  variant,
  mounted,
  layerRef,
}: {
  ts: TsView;
  variant: { v: TsVariant; groups: number[] } | null;
  mounted: boolean;
  layerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={layerRef} className="ts-layer" data-part="ts">
      <div className="ts-persp" data-part="persp">
        <div className="ts-space" data-part="space">
          <div className="ts-camera" data-part="camera">
            <div className="ts-raw" data-part="raw">
              <p className="micro ts-raw-label" data-part="input">
                {ts.input}
              </p>
              <Message ts={ts} />
              <p className="ts-origin" data-part="origin">
                {ts.origin}
              </p>
            </div>
            {/* one 3D plane for the visual-only pieces (preserve-3d: each keeps its own depth) */}
            <div className="ts-plane" aria-hidden="true">
              <p className="micro ts-interp" data-part="interp">
                {ts.interpretado}
              </p>
              {KEYS.map((k) => (
                <div key={k} className="ts-field" data-part={`f-${k}`}>
                  <span className="micro ts-field-label" data-part="f-label">
                    {ts.fields[k].label}
                  </span>
                  <span className="ts-field-value ts-statement" data-part="f-value">
                    <span data-part="f-from">{ts.words[k]}</span>
                    {ts.words[k] !== ts.fields[k].value ? (
                      <span className="ts-field-to" data-part="f-to">
                        {ts.fields[k].value}
                      </span>
                    ) : null}
                  </span>
                </div>
              ))}
              {ts.quote.titles.map((title, i) => (
                <div key={title} className="ts-quote" data-part={i === 0 ? "q1" : "q2"}>
                  <p className="ts-q-title">
                    <span>{title}</span>
                    {i === 0 ? (
                      <span className="micro ts-tag" data-part="tag">
                        {ts.quote.tag}
                      </span>
                    ) : null}
                  </p>
                  <Rows rows={ts.quote.rows} part={i === 0 ? "q1-row" : "q2-row"} />
                </div>
              ))}
              <div className="ts-trip" data-part="trip">
                <div className="ts-row ts-trip-title" data-part="cell" data-cell="title">
                  <span className="micro ts-row-label" data-part="trip-label">
                    {ts.trip.label}
                  </span>
                  <span className="ts-row-value">{ts.trip.value}</span>
                </div>
                <div className="ts-grid">
                  {ts.trip.cells.map((c) => (
                    <div key={c.label} className="ts-row ts-cell" data-part="cell" data-cell={c.label}>
                      <span className="micro ts-row-label">{c.label}</span>
                      <span className="ts-row-value">{c.value ?? ""}</span>
                    </div>
                  ))}
                </div>
                <div className="ts-res" data-part="res">
                  <div className="ts-bar" data-part="bar">
                    <span className="ts-signal" data-part="signal" />
                  </div>
                  <p className="micro ts-res-text" data-part="res-text">
                    {ts.reservation}
                  </p>
                  <p className="micro ts-report" data-part="report">
                    {ts.report}
                  </p>
                </div>
              </div>
            </div>
            <TravelSuiteReveal variant={variant?.v ?? null} groups={variant?.groups ?? []} mounted={mounted} />
          </div>
          <div className="ts-name" data-part="name">
            {/* the name is the section's sr-only h2; this is its visual reveal (Spec §19) */}
            <p className="ts-name-title" data-part="name-title" aria-hidden="true">
              {ts.name}
            </p>
            <p className="ts-close" data-part="close">
              {ts.close}
            </p>
          </div>
        </div>
      </div>
      <div className="ts-vignette" data-part="vignette" />
    </div>
  );
}

// ── the timeline ──────────────────────────────────────────────────────────────────────────────

const HIDE_X = "inset(0% 100% 0% 0%)";
/** automatic segments fire this far (timeline units, ≈ 6 px) before their state's label */
const AUTO_LEAD = 0.02;
const SHOW_X = "inset(0% 0% 0% 0%)";

/** builds the TS timeline into the world's; returns the depth groups it draws */
function buildTravelSuite(api: SceneApi, tl: gsap.core.Timeline, ctx: WorldBuildContext, v: TsVariant, ts: TsView): number[] {
  const { gsap, root: stage, rm } = api;
  const L = TS_LAYOUT[v];
  const deep = v === "deep";
  const one = (p: string) => api.q(`[data-part="${p}"]`)[0];
  const all = (p: string) => api.q(`[data-part="${p}"]`);
  const off = ctx.worldAt - TS_T.TS01;
  const T = (t: number) => t + off;

  const persp = one("persp");
  const space = one("space");
  const camera = one("camera");
  const raw = one("raw");
  const msg = one("msg");
  const input = one("input");
  const origin = one("origin");
  const interp = one("interp");
  const fields = Object.fromEntries(KEYS.map((k) => [k, one(`f-${k}`)])) as Record<Key, HTMLElement>;
  const q1 = one("q1");
  const q2 = one("q2");
  const tag = one("tag");
  const q1Rows = all("q1-row");
  const trip = one("trip");
  const cells = all("cell");
  const bar = one("bar");
  const signal = one("signal");
  const resText = one("res-text");
  const report = one("report");
  const groups = all("group");
  const drifts = all("drift");
  const nameTitle = one("name-title");
  const close = one("close");
  const vignette = one("vignette");
  // tablets draw 2 groups (Spec §15); reduced motion on lg/xl keeps all four, flattened
  const inUse = v === "flat" && api.tier !== "md" ? [0, 1, 2, 3] : L.groups;
  const used = (g: HTMLElement) => inUse.includes(Number(g.dataset.depth));

  stage.dataset.ts = v;
  api.onRevert(() => {
    delete stage.dataset.ts;
  });

  // the design space: one scale, centered in the stage (Spec §08 design space)
  const s = Math.min(window.innerWidth / L.space.w, stage.clientHeight / L.space.h);
  gsap.set(space, { width: L.space.w, height: L.space.h, xPercent: -50, yPercent: -50, scale: s, transformOrigin: "50% 50%" });
  gsap.set(persp, deep ? { perspective: 1400, perspectiveOrigin: "50% 50%" } : { perspective: "none" });
  const positioned = [raw, interp, ...KEYS.map((k) => fields[k]), q1, q2, trip];
  gsap.set(positioned, { x: 0, y: 0, z: 0, scale: 1, transformOrigin: "0% 0%" });
  gsap.set(trip, { transformOrigin: "50% 50%" });
  gsap.set(camera, { z: 0 });

  // ── measure (camera at rest, every plane at z 0: what is measured is what is drawn) ──────
  const pH = msg.offsetHeight;
  const rawAt = { x: L.raw.x, y: L.raw.center ? L.raw.y - pH / 2 : L.raw.y };
  gsap.set(raw, rawAt);
  gsap.set(q1, { x: L.q1.x, y: L.q1.y });
  gsap.set(trip, { x: L.trip.x, y: L.trip.y });
  const rect = (el: Element) => el.getBoundingClientRect();
  /** where `a` sits relative to `b`, in design px */
  const rel = (a: Element, b: Element) => ({ x: (rect(a).left - rect(b).left) / s, y: (rect(a).top - rect(b).top) / s });
  const fontPx = (el: Element) => parseFloat(getComputedStyle(el).fontSize);
  const rowFor = (label: string) => q1Rows.find((r) => r.dataset.row === label);
  const start: Record<Key, Pt> = {} as Record<Key, Pt>;
  const toRow: Record<Key, Pt & { scale: number }> = {} as Record<Key, Pt & { scale: number }>;
  for (const k of KEYS) {
    const from = fields[k].querySelector('[data-part="f-from"]')!;
    start[k] = rel(msg.querySelector(`[data-word="${k}"]`)!, from);
    const row = rowFor(ts.fields[k].label)?.querySelector(".ts-row-value");
    toRow[k] = row ? { ...rel(row, from), scale: fontPx(row) / fontPx(from) } : { x: 0, y: 0, scale: 1 };
  }
  /** TS06: each q1 row re-flows into its trip cell (offset = row − cell) */
  const cellFrom = cells.map((c) => {
    const label = c.dataset.cell === "title" ? ts.quote.rows[0]?.label : c.dataset.cell;
    const row = label ? rowFor(label) : undefined;
    return row ? rel(row, c) : null;
  });
  const barW = bar.offsetWidth;
  const tripBox = { w: trip.offsetWidth, h: trip.offsetHeight };

  // ── placement: 3D (x, y, z) or its 2D drawing (x, y, scale) ─────────────────────────────
  const originPx = (o: Pt) => ({ x: o.x * L.space.w, y: o.y * L.space.h });
  const place = (p: { x: number; y: number; z?: number }, camZ = 0, o: Pt = L.origin.rest) => {
    const z = p.z ?? 0;
    if (deep) return { x: p.x, y: p.y, z };
    const pr = project({ x: p.x, y: p.y, z: z + camZ }, originPx(o));
    return { x: pr.x, y: pr.y, scale: pr.scale };
  };
  /** the trip, scaled about its own center */
  const placeTrip = (p: Pt, z = 0) => {
    if (deep) return { x: p.x, y: p.y, z };
    const c = project({ x: p.x + tripBox.w / 2, y: p.y + tripBox.h / 2, z }, originPx(L.origin.rest));
    return { x: c.x - tripBox.w / 2, y: c.y - tripBox.h / 2, scale: c.scale };
  };

  // ── SCREEN: nothing of the world shows yet ──────────────────────────────────────────────
  gsap.set([msg, input, origin, interp], { opacity: 0 });
  for (const k of KEYS) {
    gsap.set(fields[k], { ...place(start[k]), opacity: 0 });
    gsap.set(fields[k].querySelector('[data-part="f-label"]'), { opacity: 0 });
    gsap.set(fields[k].querySelector('[data-part="f-value"]'), { scale: 1, transformOrigin: "0% 0%" });
    const to = fields[k].querySelector('[data-part="f-to"]');
    if (to) gsap.set(to, { opacity: 0 });
  }
  gsap.set(msg.querySelectorAll("[data-word]"), { textDecorationColor: "rgba(237, 232, 222, 0)" });
  gsap.set(q1, { ...place(L.q1), opacity: 0 });
  gsap.set(q1.querySelectorAll(".ts-row-value"), { opacity: 0 });
  gsap.set(tag, { clipPath: HIDE_X });
  gsap.set(q2, { ...place(L.q2), opacity: 0 });
  gsap.set(trip, { ...placeTrip(L.trip), opacity: 0 });
  gsap.set(cells, { x: 0, y: 0, opacity: 1 });
  gsap.set([bar, resText, report], { opacity: 0 });
  gsap.set([resText, report], { clipPath: HIDE_X });
  gsap.set(signal, { x: 0, opacity: 0 });
  groups.forEach((g) => {
    const z = TS_GROUP_Z[Number(g.dataset.depth)];
    gsap.set(g, deep ? { z, visibility: "hidden" } : { scale: perceived(z), transformOrigin: "50% 50%", visibility: "hidden" });
  });
  gsap.set(drifts, { x: 0, y: 0, opacity: 1 });
  gsap.set(vignette, { opacity: 0 });
  gsap.set([nameTitle, close], { clipPath: HIDE_X });
  api.onRevert(() => gsap.set([camera, persp, ...groups, ...drifts], { clearProps: "all" }));

  // ── TS01 · RAW: the escaping object hands over to the sentence, at the same pixels ──────
  if (!rm) {
    const inner = ctx.object.firstElementChild;
    if (inner) {
      tl.to(inner, { y: -2, duration: 0.9, ease: "none" }, T(1));
      tl.to(inner, { y: 0, duration: 0.1, ease: EASE.settle }, T(1.9));
    }
    tl.to([input, origin], { opacity: 1, duration: 0.4 }, T(1.6));
  } else {
    tl.set([input, origin], { opacity: 1 }, T(TS_T.TS01));
  }
  tl.set(ctx.object, { autoAlpha: 0 }, T(TS_T.TS01));
  tl.set(msg, { opacity: 1 }, T(TS_T.TS01));
  tl.addLabel("s:TS01", T(TS_T.TS01));

  // ── TS02 · EXTRACTION: the three words detach in place; their slots stay as underlined gaps
  tl.addLabel("m:TS02", T(TS_T.TS02));
  const lift = T(TS_T.TS02) + 0.02;
  tl.set(Object.values(fields), { opacity: 1 }, lift);
  // reduced motion (Spec §16): nothing flies, so the words stay readable in the sentence — underlined,
  // with the three fields listed beside it; with motion the copies carry the words and the slots are gaps
  tl.set(msg.querySelectorAll("[data-word]"), rm ? { textDecorationColor: "rgba(237, 232, 222, 1)" } : { color: "transparent", textDecorationColor: "rgba(237, 232, 222, 1)" }, lift);
  for (const k of KEYS) {
    tl.to(fields[k], { ...place({ x: start[k].x, y: start[k].y - 12 }), duration: 0.38, ease: EASE.settle }, lift);
    tl.to(fields[k].querySelector('[data-part="f-value"]'), { scale: 1.06, duration: 0.38, ease: EASE.settle }, lift);
  }
  tl.to([input, origin], { opacity: 0, duration: 0.3 }, T(TS_T.TS02));
  if (deep) tl.to(persp, { perspectiveOrigin: `${L.origin.follow.x * 100}% ${L.origin.follow.y * 100}%`, duration: 0.4 }, T(TS_T.TS02));

  // ── TS03 · FIELDS: destino · fechas · pasajeros at their depths; the camera leans in ────
  const t3 = T(TS_T.TS02_END);
  const d3 = TS_T.TS03 - TS_T.TS02_END;
  for (const k of KEYS) {
    // the perceived scales (1.25 / .9 / .7) are what the visitor sees with the camera leaning
    // in: each field's own depth is solved with the camera's +200 included
    const f = L.fields[k];
    tl.to(fields[k], { ...place({ x: f.x, y: f.y, z: f.z - L.camTs03 }, L.camTs03, L.origin.followEnd), opacity: f.opacity, duration: d3 }, t3);
    tl.to(fields[k].querySelector('[data-part="f-value"]'), { scale: 1, duration: d3 }, t3);
    tl.to(fields[k].querySelector('[data-part="f-label"]'), { opacity: 1, duration: d3 * 0.6 }, t3 + d3 * 0.3);
    const to = fields[k].querySelector('[data-part="f-to"]');
    if (to) {
      tl.to(fields[k].querySelector('[data-part="f-from"]'), { opacity: 0, duration: d3 * 0.5 }, t3);
      tl.to(to, { opacity: 1, duration: d3 * 0.5 }, t3);
    }
  }
  tl.to(raw, { ...place({ x: L.sentenceLow.x, y: L.sentenceLow.y }, L.camTs03, L.origin.followEnd), duration: d3 }, t3);
  tl.to(msg, { opacity: L.sentenceLow.opacity, duration: d3 }, t3);
  tl.fromTo(interp, { ...place(L.interpretado, L.camTs03, L.origin.followEnd) }, { opacity: 1, duration: d3 * 0.6, immediateRender: false }, t3 + d3 * 0.4);
  if (deep) {
    tl.to(camera, { z: L.camTs03, duration: d3 }, t3);
    tl.to(persp, { perspectiveOrigin: `${L.origin.followEnd.x * 100}% ${L.origin.followEnd.y * 100}%`, duration: d3 }, t3);
  }
  tl.addLabel("s:TS03", T(TS_T.TS03));

  // ── TS04 · QUOTE: the fields fly into Opción 01's lines; Opción 02 waits behind ─────────
  const t4 = T(TS_T.TS03);
  const d4 = TS_T.TS04 - TS_T.TS03;
  for (const k of KEYS) {
    tl.to(fields[k], { ...place({ x: toRow[k].x, y: toRow[k].y }), opacity: 1, duration: d4 }, t4);
    tl.to(fields[k].querySelector('[data-part="f-value"]'), { scale: toRow[k].scale, duration: d4 }, t4);
    tl.to(fields[k].querySelector('[data-part="f-label"]'), { opacity: 0, duration: d4 * 0.4 }, t4);
  }
  tl.to(q1, { opacity: 1, duration: d4 * 0.6 }, t4 + d4 * 0.2);
  tl.to(q2, { opacity: L.q2.opacity, duration: d4 * 0.6 }, t4 + d4 * 0.3);
  tl.to([msg, interp], { opacity: 0, duration: d4 * 0.5 }, t4);
  if (deep) {
    tl.to(camera, { z: 0, duration: d4 }, t4);
    tl.to(persp, { perspectiveOrigin: "50% 50%", duration: d4 }, t4);
  } else {
    tl.to(raw, { ...place({ x: L.sentenceLow.x, y: L.sentenceLow.y }), duration: d4 }, t4);
  }
  // the moved words become Opción 01's values (same text, same place)
  tl.set(Object.values(fields), { opacity: 0 }, T(TS_T.TS04));
  tl.set(q1.querySelectorAll(".ts-row-value"), { opacity: 1 }, T(TS_T.TS04));
  tl.addLabel("s:TS04", T(TS_T.TS04));

  // ── TS05 · SELECTED: `seleccionada` on Opción 01; Opción 02 retires ─────────────────────
  const t5 = T(TS_T.TS04);
  const d5 = TS_T.TS05 - TS_T.TS04;
  tl.to(q2, { ...place(L.q2Out), opacity: L.q2Out.opacity, duration: d5 }, t5);
  tl.to(tag, { clipPath: SHOW_X, duration: d5 * 0.7, ease: EASE.reveal }, t5 + d5 * 0.15);
  tl.addLabel("s:TS05", T(TS_T.TS05));

  // ── TS06 · TRIP: the selected option re-flows into the trip grid — a dry snap, no morph ─
  // starts just after the label: resting on TS05 (a reduced-motion step lands exactly on it)
  // still shows the quote, not the first frame of the re-flow
  const t6 = T(TS_T.TS05) + 0.01;
  const d6 = TS_T.TS06 - TS_T.TS05 - 0.01;
  const snap = EASE.steps(4);
  tl.set(trip, { opacity: 1 }, t6);
  tl.set(q1Rows, { opacity: 0 }, t6);
  cells.forEach((c, i) => {
    const from = cellFrom[i];
    if (from) tl.fromTo(c, { x: from.x, y: from.y }, { x: 0, y: 0, duration: d6, ease: snap, immediateRender: false }, t6);
    else tl.fromTo(c, { opacity: 0 }, { opacity: 1, duration: d6, ease: snap, immediateRender: false }, t6);
  });
  tl.to(q1, { opacity: 0, duration: d6, ease: snap }, t6);
  tl.addLabel("s:TS06", T(TS_T.TS06));

  // ── TS07 · RESERVATION → TS08 · REPORT: automatic, 500 ms after the trip (Spec §08 autos) ─
  // fired from a marker a hair before the label: a snap may rest a pixel short of it
  tl.addLabel("m:TS07", T(TS_T.TS06) - AUTO_LEAD);
  api.auto("m:TS07", () => {
    const seg = gsap.timeline({ defaults: { ease: EASE.settle } });
    const t = AUTO.reservationDelay;
    seg.to(bar, { opacity: 1, duration: 0.12 }, t);
    seg.to(resText, { opacity: 1, clipPath: SHOW_X, duration: 0.2, ease: EASE.reveal }, t);
    if (rm) {
      // the signal shown at the bar's end, not travelling (Spec §16)
      seg.set(signal, { x: barW - 10, opacity: 1 }, t);
    } else {
      seg.set(signal, { opacity: 1 }, t);
      seg.fromTo(signal, { x: 0 }, { x: barW, duration: AUTO.signal, ease: "none" }, t);
      seg.to(signal, { x: barW + 200, opacity: 0, duration: AUTO.signalExit, ease: "none" }, t + AUTO.signal);
    }
    seg.to(report, { opacity: 1, clipPath: SHOW_X, duration: AUTO.report, ease: EASE.reveal }, t + AUTO.signal);
    return seg;
  });

  // ── TS09 · BIG REVEAL: the camera retreats; dozens of operations were there all along ───
  const t9 = T(TS_T.TS06);
  const d9 = TS_T.TS09B - TS_T.TS06;
  const groupsInUse = groups.filter(used);
  const willChange = (on: boolean) => gsap.set([camera, ...groupsInUse], { willChange: on ? "transform" : "auto" });
  tl.addLabel("m:TS08", T(TS_T.TS08));
  tl.set(groupsInUse, { visibility: "visible" }, T(TS_T.TS08));
  tl.call(() => willChange(tl.time() >= T(TS_T.TS08)), [], T(TS_T.TS08));
  if (deep) {
    tl.to(camera, { z: L.dollyTo, duration: d9, ease: EASE.dolly }, t9);
    tl.to(trip, { x: L.tripCenter.x, y: L.tripCenter.y, duration: d9 * 0.4 }, t9);
    tl.to(trip, { z: L.tripDepth - L.dollyTo, duration: d9, ease: EASE.dolly }, t9);
  } else {
    const end = placeTrip(L.tripCenter, L.tripDepth);
    tl.to(trip, { x: end.x, y: end.y, duration: d9 * 0.4 }, t9);
    tl.to(trip, { scale: end.scale, duration: d9, ease: EASE.dolly }, t9);
    groupsInUse.forEach((g) => {
      const z = TS_GROUP_Z[Number(g.dataset.depth)];
      tl.to(g, { scale: perceived(z + L.dollyTo), duration: d9, ease: EASE.dolly }, t9);
    });
  }
  tl.to(vignette, { opacity: 1, duration: d9 * 0.6 }, t9);
  if (!rm) tl.addLabel("s:TS09a", T(ts09aTime()));
  tl.addLabel("s:TS09b", T(TS_T.TS09B));

  // drift (lg/xl/md, never under reduced motion): ±4 px, sine, 6–9 s periods, one per group
  let drift: gsap.core.Timeline | null = null;
  tl.addLabel("m:TS10", T(TS_T.TS09B) - AUTO_LEAD);
  if (L.drift && !rm) {
    api.auto("m:TS10", () => {
      drift = gsap.timeline();
      drifts.filter((d) => used(d.parentElement as HTMLElement)).forEach((d, i) => {
        const period = 6 + ((i * 1.1) % 3);
        drift!.to(d, { x: i % 2 ? -4 : 4, duration: period / 2, ease: "sine.inOut", yoyo: true, repeat: -1 }, 0);
        drift!.to(d, { y: i % 2 ? 4 : -4, duration: (period + 1) / 2, ease: "sine.inOut", yoyo: true, repeat: -1 }, 0);
      });
      return drift;
    });
  }

  // ── TS10 · NAME: the drift stops; the name comes up with a contrast reveal (automatic) ──
  api.auto("m:TS10", () => {
    const seg = gsap.timeline({ defaults: { ease: EASE.settle } });
    const t = rm ? 0 : AUTO.nameDelay;
    seg.call(() => drift?.pause(), [], t);
    seg.to(drifts, { x: 0, y: 0, duration: AUTO.driftStop }, t);
    seg.to(drifts, { opacity: 0.5, duration: AUTO.name }, t);
    seg.to(nameTitle, { clipPath: SHOW_X, duration: AUTO.name, ease: EASE.reveal }, t);
    seg.to(close, { clipPath: SHOW_X, duration: AUTO.name, ease: EASE.reveal }, t + 0.15);
    seg.call(() => willChange(false), [], t + AUTO.name + 0.15);
    return seg;
  });

  // hold, then the world releases into its proof (TS11)
  tl.to({}, { duration: TS_T.END - TS_T.TS09B }, T(TS_T.TS09B));
  return inUse;
}
