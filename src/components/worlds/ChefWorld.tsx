"use client";

import { useMemo, useState } from "react";
import { EASE } from "@/lib/motion";
import {
  C04_STAGGER,
  C06_STAGGER,
  C07_DIM,
  C_T,
  C_T_RM,
  CHEF_UNITS,
  CHEF_UNITS_RM,
  catalog,
  chefVariant,
  field,
  fit,
  insetOf,
  macro,
  product,
  splitCatalogLine,
  splitProductLine,
  splitPurchaseLine,
  type Box,
  type ChefVariant,
} from "@/lib/chef-world";
import type { ResolvedAsset } from "@/lib/resolved";
import type { SceneApi } from "@/lib/useScene";
import { Cutout } from "@/components/media/Cutout";
import { LoopVideo } from "@/components/media/LoopVideo";
import { WorldScene, type WorldBuildContext, type WorldSceneExtension, type WorldView } from "./WorldScene";

/** Content Master 09, verbatim, plus the photographs (Spec §11) */
export interface ChefView {
  /** "Merienda · cookies, brownies y boxes dulces" */
  catalogLine: string;
  /** "Cookie levain de pistacho y chocolate blanco · $ 120 · compra directa" */
  productLine: string;
  /** "− 1 + · Agregar al carrito · Mercado Pago · consultar por WhatsApp" */
  purchaseLine: string;
  /** "Primero el deseo. Después, la compra." */
  close: string;
  /** the product photograph (the escaping object) and its card label / price */
  productPhoto: { asset: ResolvedAsset; aspect: [number, number]; label: string; price: string };
  /** the three siblings of the catalog row, with the names the store prints */
  siblings: { asset: ResolvedAsset; aspect: [number, number]; label: string; price: string }[];
  /** the macro loop (optional; its poster is the product photograph) */
  macroLoop: ResolvedAsset;
  /** the aria-label of the commerce depiction (Spec §11 DOM commerce UI rules) */
  purchaseAria: string;
}

/**
 * S10 · Chef Arturo world (Spec §11, Revelado 2.2 §11.4). Food first, commerce second. The
 * shared shell runs SCREEN → ISOLATE → C02 (the product photograph leaves the product page and
 * fills the viewport: the macro; the loop plays there once it exists). From there: C03 the
 * still pulls back to the whole product and the store's cream arrives · C04 the catalog
 * composition, the same element in its card, three siblings revealed · C05 the product view
 * (name, price, tag) · C06 the purchase controls · C07 the closing line.
 *
 * One continuity rule: the food and the product photo are the same DOM node from C02 to C06
 * (the shell's escaping object hands over to the world's figure at C02 in the same frame,
 * and that figure never changes again). The commerce UI is a depiction: spans in a
 * `role="img"` group, no focusable fake controls; the real store is behind "Abrir ↗".
 */
export function ChefWorld({ world, chef }: { world: WorldView; chef: ChefView }) {
  const [macroActive, setMacroActive] = useState(false);
  const scene = useMemo<WorldSceneExtension>(
    () => ({
      units: (_tier, rm) => (rm ? CHEF_UNITS_RM : CHEF_UNITS),
      build: (api, tl, ctx) => buildChef(api, tl, ctx, chefVariant(api.tier), chef, setMacroActive),
    }),
    [chef],
  );
  const cat = splitCatalogLine(chef.catalogLine);
  const prod = splitProductLine(chef.productLine);
  const buy = splitPurchaseLine(chef.purchaseLine);
  const cards = [chef.siblings[0], chef.productPhoto, chef.siblings[1], chef.siblings[2]];

  return (
    <WorldScene world={world} scene={scene}>
      <div className="chef-layer" data-part="chef">
        <div className="chef-space" data-part="space">
          {/* the store's cream, arriving with the pull-back */}
          <div className="chef-field" data-part="field" />
          {/* the one image element: the food, then the product photo (C02 → C06) */}
          <figure className="chef-figure chef-product" data-part="product" data-photo="product">
            <Cutout asset={chef.productPhoto.asset} fill />
            {chef.macroLoop.status !== "placeholder" ? (
              <div className="chef-macro" data-part="macro">
                <LoopVideo asset={chef.macroLoop} active={macroActive} sizes="100vw" fill />
              </div>
            ) : null}
          </figure>
          {chef.siblings.map((s, i) => (
            <figure key={s.asset.key} className="chef-figure chef-sibling" data-part="sibling" data-photo={`sibling-${i + 1}`}>
              <Cutout asset={s.asset} fill />
            </figure>
          ))}
          {/* the catalog composition: heading and the cards' chrome (text under each photo) */}
          <div className="chef-catalog" data-part="catalog" aria-hidden="true">
            <p className="chef-heading" data-part="heading">
              <span className="chef-heading-title">{cat.title}</span>
              <span className="chef-heading-line">{cat.line}</span>
            </p>
            {cards.map((c, i) => (
              <div key={c.asset.key} className="chef-card-chrome" data-part="chrome" data-card={i}>
                <span className="chef-card-label">{c.label}</span>
                <span className="micro chef-card-price">{c.price}</span>
              </div>
            ))}
          </div>
          {/* the product view and the purchase depiction (Spec §11: spans, one role="img") */}
          <div className="chef-commerce" data-part="commerce" role="img" aria-label={chef.purchaseAria}>
            <div className="chef-info" data-part="info">
              <span className="chef-info-name" data-part="info-name">
                {prod.name}
              </span>
              <span className="chef-info-price" data-part="info-price">
                {prod.price}
              </span>
              <span className="micro chef-info-tag" data-part="info-tag">
                {prod.tag}
              </span>
            </div>
            <div className="chef-purchase" data-part="purchase">
              <span className="chef-stepper" data-part="control">
                {buy.stepper.map((s, i) => (
                  <span key={i} className={i === 1 ? "chef-stepper-qty" : "chef-stepper-sign"}>
                    {s}
                  </span>
                ))}
              </span>
              <span className="chef-btn chef-btn-primary" data-part="control">
                {buy.add}
              </span>
              <span className="micro chef-pay" data-part="control">
                {buy.pay}
              </span>
              <span className="chef-btn chef-btn-secondary" data-part="control">
                {buy.chat}
              </span>
            </div>
          </div>
          <p className="chef-close" data-part="close">
            {chef.close}
          </p>
        </div>
      </div>
    </WorldScene>
  );
}

// ── the timeline ──────────────────────────────────────────────────────────────────────────────

const HIDE_Y = "inset(100% 0% 0% 0%)";
const HIDE_X = "inset(0% 100% 0% 0%)";
const SHOW = "inset(0% 0% 0% 0%)";

function buildChef(api: SceneApi, tl: gsap.core.Timeline, ctx: WorldBuildContext, v: ChefVariant, chef: ChefView, setMacro: (on: boolean) => void) {
  const { gsap, root: stage, rm } = api;
  const one = (p: string) => api.q(`[data-part="${p}"]`)[0];
  const space = one("space");
  const fieldEl = one("field");
  const figure = one("product");
  const siblings = api.q('[data-part="sibling"]');
  const heading = one("heading");
  const chromes = api.q('[data-part="chrome"]');
  const commerce = one("commerce");
  const catalogEl = one("catalog");
  const info = one("info");
  const infoParts = ["info-name", "info-price", "info-tag"].map(one);
  const purchase = one("purchase");
  const controls = api.q('[data-part="control"]');
  const close = one("close");
  const T = (t: number) => t + (ctx.worldAt - (rm ? C_T_RM.C02 : C_T.C02));

  stage.dataset.chef = v;
  api.onRevert(() => {
    delete stage.dataset.chef;
    setMacro(false);
  });

  // ── the design space, scaled once ───────────────────────────────────────────────────────
  const sp = v === "sm" ? { w: 390, h: 844 } : { w: 1440, h: 900 };
  const s = Math.min(window.innerWidth / sp.w, stage.clientHeight / sp.h);
  gsap.set(space, { width: sp.w, height: sp.h, xPercent: -50, yPercent: -50, scale: s, transformOrigin: "50% 50%" });

  // the product figure at its largest size: the macro (it only ever scales down from there)
  const aspect = chef.productPhoto.aspect[0] / chef.productPhoto.aspect[1];
  // the macro covers the stage, not just the space (lg is wider than the space, md taller)
  const mac = macro(v, aspect, { w: window.innerWidth / s, h: stage.clientHeight / s });
  const nat = { w: mac.w, h: mac.h };
  const cat = catalog(v, aspect);
  const view = product(v, aspect);
  const f = field(v);
  const place = (target: Box) => {
    const p = fit(nat, target);
    return { x: p.x, y: p.y, scale: p.scale, clipPath: insetOf(p.clip) };
  };
  gsap.set(figure, { left: 0, top: 0, width: nat.w, height: nat.h, x: 0, y: 0, scale: 1, transformOrigin: "0 0", autoAlpha: 0, clipPath: SHOW });
  // siblings at their card slots, closed (revealed by clip-path)
  const sibSlots = [0, 2, 3].map((i) => cat.slots[i]);
  siblings.forEach((el, i) => {
    const b = sibSlots[i];
    gsap.set(el, { left: b.x, top: b.y, width: b.w, height: b.h, autoAlpha: 0, clipPath: HIDE_Y });
  });
  gsap.set(fieldEl, { opacity: 0 });
  gsap.set(heading, { left: cat.heading.x, top: cat.heading.y, width: cat.heading.w, clipPath: HIDE_Y });
  chromes.forEach((c, i) => {
    const b = cat.slots[i];
    gsap.set(c, { left: b.x, top: b.y + b.h + 10, width: b.w, opacity: 0 });
  });
  // the text blocks exist for AT only once their state is there (and never over the black stage)
  gsap.set([catalogEl, commerce, close], { visibility: "hidden" });
  gsap.set(commerce, { left: 0, top: 0, width: sp.w, height: sp.h, opacity: 1 });
  gsap.set(info, { left: view.info.x, top: view.info.y, width: view.info.w });
  gsap.set(infoParts, { clipPath: HIDE_X });
  gsap.set(purchase, { left: view.purchase.x, top: view.purchase.y, width: view.purchase.w });
  gsap.set(controls, { clipPath: HIDE_X });
  gsap.set(close, { left: view.close.x, top: view.close.y, width: view.close.w, clipPath: HIDE_Y });
  api.onRevert(() => {
    gsap.set([space, fieldEl, figure, ...siblings, heading, ...chromes, catalogEl, commerce, info, ...infoParts, purchase, ...controls, close], { clearProps: "all" });
    commerce.removeAttribute("aria-hidden");
  });

  const swapIn = (t: number) => {
    // the escaping object → the world's figure, in the same frame and the same rectangle
    tl.set(ctx.object, { autoAlpha: 0 }, t);
    tl.set(figure, { ...place(mac), autoAlpha: 1 }, t);
  };
  const productSlot = cat.slots[cat.productSlot];

  if (rm) {
    // five stills (Spec §16): macro → the whole product → the catalog → product + purchase → the line
    swapIn(T(C_T_RM.C02));
    tl.set(figure, place(productSlot), T(C_T_RM.C03));
    tl.set(fieldEl, { opacity: 1 }, T(C_T_RM.C03));
    tl.addLabel("s:C03", T(C_T_RM.C03));
    tl.set(siblings, { autoAlpha: 1, clipPath: SHOW }, T(C_T_RM.C04));
    tl.set(catalogEl, { visibility: "visible" }, T(C_T_RM.C04));
    tl.set(heading, { clipPath: SHOW }, T(C_T_RM.C04));
    tl.set(chromes, { opacity: 1 }, T(C_T_RM.C04));
    tl.addLabel("s:C04", T(C_T_RM.C04));
    tl.set(figure, place(view.photo), T(C_T_RM.C06));
    tl.set([...siblings, ...chromes], { autoAlpha: 0 }, T(C_T_RM.C06));
    tl.set(heading, { clipPath: HIDE_Y }, T(C_T_RM.C06));
    tl.set(catalogEl, { visibility: "hidden" }, T(C_T_RM.C06));
    tl.set(commerce, { visibility: "visible" }, T(C_T_RM.C06));
    tl.set([...infoParts, ...controls], { clipPath: SHOW }, T(C_T_RM.C06));
    tl.addLabel("s:C06", T(C_T_RM.C06));
    tl.set(close, { clipPath: SHOW, visibility: "visible" }, T(C_T_RM.C07));
    tl.set(commerce, { opacity: C07_DIM, attr: { "aria-hidden": "true" } }, T(C_T_RM.C07));
    tl.addLabel("s:C07", T(C_T_RM.C07));
    tl.to({}, { duration: C_T_RM.END - C_T_RM.C07 }, T(C_T_RM.C07));
    return;
  }

  // ── C02 · MACRO: the swap; the loop plays while the macro is the state ──────────────────
  swapIn(T(C_T.C02));
  tl.call(() => setMacro(Math.abs(tl.time() - T(C_T.C02)) < 0.5), [], T(C_T.C02) + 0.01);

  // ── C03 · RETROCEDE: the still pulls back to its card slot; the store's cream arrives ────
  const d3 = C_T.C03 - C_T.C02;
  tl.call(() => setMacro(false), [], T(C_T.C02) + 0.05);
  tl.to(figure, { ...place(productSlot), duration: d3, ease: "none" }, T(C_T.C02));
  tl.to(fieldEl, { opacity: 1, duration: d3 * 0.7, ease: EASE.settle }, T(C_T.C02) + d3 * 0.2);
  tl.addLabel("s:C03", T(C_T.C03));

  // ── C04 · COMPOSICIÓN: the heading, the card chrome, the siblings revealed ──────────────
  const d4 = C_T.C04 - C_T.C03;
  tl.set(catalogEl, { visibility: "visible" }, T(C_T.C03));
  tl.to(heading, { clipPath: SHOW, duration: 0.4, ease: EASE.reveal }, T(C_T.C03) + 0.05);
  siblings.forEach((el, i) => {
    const at = T(C_T.C03) + 0.25 + i * C04_STAGGER;
    tl.set(el, { autoAlpha: 1 }, at);
    tl.to(el, { clipPath: SHOW, duration: d4 * 0.45 }, at);
  });
  chromes.forEach((c, i) => tl.to(c, { opacity: 1, duration: 0.3 }, T(C_T.C03) + 0.45 + i * C04_STAGGER));
  tl.addLabel("s:C04", T(C_T.C04));

  // ── C05 · INFORMACIÓN: the card grows into the product view; the others go ─────────────
  const d5 = C_T.C05 - C_T.C04;
  tl.to(figure, { ...place(view.photo), duration: d5 }, T(C_T.C04));
  tl.to([...siblings, ...chromes], { autoAlpha: 0, duration: d5 * 0.5 }, T(C_T.C04));
  tl.to(heading, { clipPath: HIDE_Y, duration: d5 * 0.4, ease: EASE.reveal }, T(C_T.C04));
  tl.set(catalogEl, { visibility: "hidden" }, T(C_T.C04) + d5 * 0.5);
  tl.set(commerce, { visibility: "visible" }, T(C_T.C04) + 0.4);
  infoParts.forEach((el, i) => tl.to(el, { clipPath: SHOW, duration: 0.35, ease: EASE.reveal }, T(C_T.C04) + 0.45 + i * 0.08));
  tl.addLabel("s:C05", T(C_T.C05));

  // ── C06 · COMPRA: the controls mask in, 60 ms apart ───────────────────────────────────────
  controls.forEach((el, i) => tl.to(el, { clipPath: SHOW, duration: 0.3, ease: EASE.reveal }, T(C_T.C05) + 0.05 + i * C06_STAGGER));
  tl.addLabel("s:C06", T(C_T.C06));

  // ── C07 · CIERRE: the line masks up; the UI dims ─────────────────────────────────────────
  const d7 = C_T.C07 - C_T.C06;
  tl.set(close, { visibility: "visible" }, T(C_T.C06));
  tl.to(close, { clipPath: SHOW, duration: d7 * 0.7, ease: EASE.reveal }, T(C_T.C06) + 0.05);
  tl.to(commerce, { opacity: C07_DIM, duration: d7 * 0.6 }, T(C_T.C06) + 0.1);
  // dimmed under the closing line, the depiction leaves the accessibility tree (its text no longer
  // meets AA at .4; the closing line is the state's content; the sr-only summary keeps the purchase)
  tl.set(commerce, { attr: { "aria-hidden": "true" } }, T(C_T.C07) - 0.02);
  tl.addLabel("s:C07", T(C_T.C07));
  tl.to({}, { duration: C_T.END - C_T.C07 }, T(C_T.C07));
  void f;
}
