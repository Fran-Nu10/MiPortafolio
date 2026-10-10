"use client";

import { useMemo } from "react";
import { EASE } from "@/lib/motion";
import {
  N04_STAGGER,
  N05_STAGGER,
  N_T,
  N_T_RM,
  SANTI_UNITS,
  SANTI_UNITS_RM,
  diptych,
  field,
  fit,
  insetOf,
  santiVariant,
  single,
  splitViews,
  system,
  triptych,
  type Box,
  type SantiVariant,
} from "@/lib/santi-world";
import type { ResolvedAsset } from "@/lib/resolved";
import type { SceneApi } from "@/lib/useScene";
import { Cutout } from "@/components/media/Cutout";
import { WorldScene, type WorldBuildContext, type WorldSceneExtension, type WorldView } from "./WorldScene";

/** Content Master 08, verbatim, plus the photographs (Spec §10) */
export interface SantiView {
  /** "Forma · Línea · Textura" */
  views: string;
  /** "01 · 02 · 03" */
  pages: string;
  /** "Fotografía · Santi Nuca" */
  credit: string;
  /** the six photographs, in the world's order (1 = the opening photograph, the escaping object) */
  photos: { n: number; asset: ResolvedAsset; aspect: [number, number] }[];
}

/**
 * S8 · Santi Nuca world (Spec §10, Revelado 2.2 §11.3). The shared shell runs SCREEN →
 * ISOLATE → N02 (the opening photograph leaves the page and becomes the single image; black
 * → paper with the `reveal` ease; the credit appears). From there the editorial layout
 * recomposes itself: N03 diptych → N04 triptych with Forma · Línea · Textura → N05 the system,
 * the works in the site's grid. 2D only: every photograph moves with a uniform scale and a
 * clip-path inset, never a non-uniform scale.
 *
 * Authorship (Content Master 08): the photographs are Santi Nuca's — the credit is real text
 * from the moment the first photograph appears and stays through the proof. Nothing here
 * attributes them to anyone else.
 */
export function SantiWorld({ world, santi }: { world: WorldView; santi: SantiView }) {
  const scene = useMemo<WorldSceneExtension>(
    () => ({
      units: (_tier, rm) => (rm ? SANTI_UNITS_RM : SANTI_UNITS),
      envEase: EASE.reveal,
      build: (api, tl, ctx) => buildSanti(api, tl, ctx, santiVariant(api.tier), santi),
    }),
    [santi],
  );
  const views = splitViews(santi.views);
  const pages = splitViews(santi.pages);

  return (
    <WorldScene world={world} scene={scene}>
      <div className="santi-layer" data-part="santi">
        <div className="santi-space" data-part="space" data-paper="no">
          {santi.photos.map((p) => (
            <figure key={p.n} className="santi-figure" data-part="figure" data-photo={p.n}>
              <Cutout asset={p.asset} fill />
            </figure>
          ))}
          <p className="micro santi-credit" data-part="credit">
            {santi.credit}
          </p>
          {views.map((v, i) => (
            <div key={v} className="santi-label" data-part="label" data-view={i + 1} aria-hidden="true">
              <span className="santi-label-view">{v}</span>
              <span className="micro santi-label-page">{pages[i] ?? ""}</span>
            </div>
          ))}
          {santi.photos.map((p) => (
            <span key={p.n} className="micro santi-index" data-part="index" data-photo={p.n} aria-hidden="true">
              {String(p.n).padStart(2, "0")}
            </span>
          ))}
        </div>
      </div>
    </WorldScene>
  );
}

// ── the timeline ──────────────────────────────────────────────────────────────────────────────

const HIDE_Y = "inset(100% 0% 0% 0%)";
const SHOW = "inset(0% 0% 0% 0%)";

function buildSanti(api: SceneApi, tl: gsap.core.Timeline, ctx: WorldBuildContext, v: SantiVariant, santi: SantiView) {
  const { gsap, root: stage, rm } = api;
  const one = (p: string) => api.q(`[data-part="${p}"]`)[0];
  const space = one("space");
  const figures = api.q('[data-part="figure"]');
  const credit = one("credit");
  const labels = api.q('[data-part="label"]');
  const indices = api.q('[data-part="index"]');
  const T = (t: number) => t + (ctx.worldAt - (rm ? N_T_RM.N02 : N_T.N02));

  stage.dataset.santi = v;
  api.onRevert(() => {
    delete stage.dataset.santi;
  });

  // ── the design space, scaled once ───────────────────────────────────────────────────────
  const sp = v === "sm" ? { w: 390, h: 844 } : { w: 1440, h: 900 };
  const s = Math.min(window.innerWidth / sp.w, stage.clientHeight / sp.h);
  gsap.set(space, { width: sp.w, height: sp.h, xPercent: -50, yPercent: -50, scale: s, transformOrigin: "50% 50%" });

  // every figure at its largest size: the single image's height, its own aspect (later
  // appearances are that box, scaled down uniformly and clipped)
  const aspects = santi.photos.map((p) => p.aspect[0] / p.aspect[1]);
  const one1 = single(v, aspects[0]);
  const nats = aspects.map((a) => ({ w: one1.h * a, h: one1.h }));
  figures.forEach((f, i) => gsap.set(f, { left: 0, top: 0, width: nats[i].w, height: nats[i].h, x: 0, y: 0, scale: 1, transformOrigin: "0 0", autoAlpha: 0, clipPath: SHOW }));
  const place = (i: number, target: Box) => {
    const p = fit(nats[i], target);
    return { x: p.x, y: p.y, scale: p.scale, clipPath: insetOf(p.clip) };
  };
  /** the same placement with the window closed from one side (for a reveal) */
  const closed = (i: number, target: Box, side: "left" | "top") => {
    const p = fit(nats[i], target);
    const c: [number, number, number, number] = [...p.clip];
    if (side === "left") c[3] = nats[i].w - p.clip[1];
    else c[0] = nats[i].h - p.clip[2];
    return { x: p.x, y: p.y, scale: p.scale, clipPath: insetOf(c) };
  };
  const revealSide: "left" | "top" = v === "sm" ? "top" : "left";
  const dip = diptych(v);
  const tri = triptych(v);
  const sys = system(v);
  const f = field(v);

  // the credit under the single image, then it stays; labels under / beside the triptych
  gsap.set(credit, { left: one1.x, top: one1.y + one1.h + 14, width: one1.w, opacity: 0 });
  labels.forEach((l, i) => {
    const b = tri.labels![i];
    gsap.set(l, { left: b.x, top: b.y, width: b.w, height: b.h, clipPath: HIDE_Y, textAlign: v === "sm" ? "right" : "left" });
  });
  indices.forEach((el, i) => {
    const c = sys.figures[i];
    gsap.set(el, { left: c.x + 12, top: c.y + 10, opacity: 0 });
  });
  gsap.set(space, { attr: { "data-paper": "no" } });
  api.onRevert(() => gsap.set([space, ...figures, credit, ...labels, ...indices], { clearProps: "all" }));

  // the paper tone, switched a hair before N02 so a snap resting on the label is on paper (CSS
  // colour swap, not tweened); a reversal restores the black tone
  const tone = (t: number) => tl.set(space, { attr: { "data-paper": "yes" } }, t - 0.02);

  const swapIn = (t: number) => {
    // the escaping photograph → figure 1, in the same frame and the same rectangle
    tl.set(ctx.object, { autoAlpha: 0 }, t);
    tl.set(figures[0], { ...place(0, one1), autoAlpha: 1 }, t);
  };

  if (rm) {
    // four static compositions (Spec §16): single → diptych → triptych with labels → system
    const t2 = T(N_T_RM.N02);
    swapIn(t2);
    tone(t2);
    tl.set(credit, { opacity: 1 }, t2);
    tl.set(figures[0], place(0, dip.figures[0]), T(N_T_RM.N03));
    tl.set(figures[1], { ...place(1, dip.figures[1]), autoAlpha: 1 }, T(N_T_RM.N03));
    tl.addLabel("s:N03", T(N_T_RM.N03));
    [0, 1, 2].forEach((i) => tl.set(figures[i], { ...place(i, tri.figures[i]), autoAlpha: 1 }, T(N_T_RM.N04)));
    tl.set(labels, { clipPath: SHOW }, T(N_T_RM.N04));
    tl.addLabel("s:N04", T(N_T_RM.N04));
    figures.forEach((fig, i) => tl.set(fig, { ...place(i, sys.figures[i]), autoAlpha: 1 }, T(N_T_RM.N05)));
    tl.set(labels, { clipPath: HIDE_Y }, T(N_T_RM.N05));
    tl.set(indices, { opacity: 1 }, T(N_T_RM.N05));
    tl.addLabel("s:N05", T(N_T_RM.N05));
    tl.to({}, { duration: N_T_RM.END - N_T_RM.N05 }, T(N_T_RM.N05));
    return;
  }

  // ── N02 · the single image: the swap (the frame the photograph arrives), the tone, the credit
  swapIn(T(N_T.N02));
  tone(T(N_T.N02));
  // the credit arrives with the paper (the last stretch of EXPAND): it is there at the label
  tl.to(credit, { opacity: 1, duration: 0.2 }, T(N_T.N02) - 0.2);

  // ── N03 · diptych: photo 1 to its half, photo 2 revealed into the other ────────────────
  const d3 = N_T.N03 - N_T.N02;
  tl.to(figures[0], { ...place(0, dip.figures[0]), duration: d3 }, T(N_T.N02));
  tl.set(figures[1], { ...closed(1, dip.figures[1], revealSide), autoAlpha: 1 }, T(N_T.N02) + 0.02);
  tl.to(figures[1], { clipPath: place(1, dip.figures[1]).clipPath, duration: d3 - 0.02 }, T(N_T.N02) + 0.02);
  tl.to(credit, { left: dip.figures[0].x, top: f.y + f.h + 14, width: dip.figures[0].w, duration: d3 }, T(N_T.N02));
  tl.addLabel("s:N03", T(N_T.N03));

  // ── N04 · triptych: thirds, photo 3 from the right, the labels mask up ───────────────────
  const d4 = N_T.N04 - N_T.N03;
  [0, 1].forEach((i) => tl.to(figures[i], { ...place(i, tri.figures[i]), duration: d4 }, T(N_T.N03)));
  tl.set(figures[2], { ...closed(2, tri.figures[2], revealSide), autoAlpha: 1 }, T(N_T.N03) + 0.02);
  tl.to(figures[2], { clipPath: place(2, tri.figures[2]).clipPath, duration: d4 - 0.02 }, T(N_T.N03) + 0.02);
  // the labels are fully up at the label (the last one ends 0.09 units before N04)
  labels.forEach((l, i) => tl.to(l, { clipPath: SHOW, duration: 0.3, ease: EASE.reveal }, T(N_T.N03) + 0.45 + i * N04_STAGGER));
  if (v === "sm") tl.to(credit, { top: f.y + f.h + 14, width: tri.figures[0].w, duration: d4 }, T(N_T.N03));
  tl.addLabel("s:N04", T(N_T.N04));

  // ── N05 · the system: FLIP into the grid, photos 4–6 revealed, the numbering ───────────
  const d5 = N_T.N05 - N_T.N04;
  [0, 1, 2].forEach((i) => tl.to(figures[i], { ...place(i, sys.figures[i]), duration: d5 }, T(N_T.N04)));
  [3, 4, 5].forEach((i, k) => {
    const at = T(N_T.N04) + 0.25 + k * N05_STAGGER;
    tl.set(figures[i], { ...closed(i, sys.figures[i], "top"), autoAlpha: 1 }, at);
    tl.to(figures[i], { clipPath: place(i, sys.figures[i]).clipPath, duration: 0.4 }, at);
  });
  labels.forEach((l) => tl.to(l, { clipPath: HIDE_Y, duration: 0.3, ease: EASE.reveal }, T(N_T.N04)));
  indices.forEach((el, i) => tl.to(el, { opacity: 1, duration: 0.2 }, T(N_T.N04) + 0.55 + (i % 3) * 0.06));
  tl.addLabel("s:N05", T(N_T.N05));
  tl.to({}, { duration: N_T.END - N_T.N05 }, T(N_T.N05));
}
