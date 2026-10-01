"use client";

import { useRef } from "react";
import { useScene } from "@/lib/useScene";
import { setSystem } from "@/lib/store";
import { projectById, rayoLayers, rayoAssembled } from "@/data/projects";
import { ProjectWindow } from "@/components/system/ProjectWindow";
import { Screen } from "@/components/system/Screen";
import { Capture } from "@/components/system/Capture";
import { SheetHead } from "@/components/system/Sheet";
import { EASE } from "@/lib/motion";

const pr = projectById.prospector;
const hero = pr.captures[0];
const menu = pr.captures[3];
const product = pr.captures[4];

/** where each part sits once assembled (centre y, % of the capture), top to bottom */
const ASSEMBLED_CY = [45.5, 50, 52.6, 55.4, 58, 61.8];
const ASSEMBLED_K = 0.72;
const ellipse = (l: (typeof rayoLayers)[number], k = 1) => `ellipse(${l.rx * k}% ${l.ry * k}% at ${l.cx}% ${l.cy}%)`;
const SIZES = "(max-width: 1023px) 1000px, 88vw";

/**
 * 03.02 · Prospector — rebuilt. ENSAMBLE builds the real product, not a diagram of it:
 * TECHNICAL OUTLINE (six ellipses at the exact place of each ingredient in the real hero) →
 * REAL INGREDIENT LAYERS (each outline fills with its own ingredient, cut out of the capture) →
 * the cut-outs are revealed as THE REAL HERO (same pixels, same place) → ASSEMBLED (the parts
 * close in steps and snap into the real assembled CLÁSICA) → the menu opens around it →
 * the product page → INTERACT with the live demo.
 *
 * Everything lives in capture coordinates inside one canvas, so on phones the same drawing
 * is framed in a portrait window and panned, instead of shrunk.
 */
export function Prospector() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, {
    id: "prospector",
    pinVh: { desktop: 3.0, compact: 2.2 },
    states: 7,
    onProgress: (p) => {
      const note = p < 0.14 ? "trazo técnico · seis piezas reales" : p < 0.3 ? "cada trazo se llena con su ingrediente" : p < 0.44 ? "las piezas eran el hero real" : p < 0.56 ? "ensamble · encastre" : p < 0.78 ? "menú · tracklist" : "producto · clásica · probá la demo";
      setSystem({ step: 4, status: "Lámina 02 / 04", section: "03 — Proyectos · Prospector", note, frame: 1, grid: p < 0.3 ? 0.4 : 0, tone: "graphite" });
    },
    build: ({ q, gsap, compact }) => {
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      const head = q(".sheet-head")[0];
      const ell = q(".rs-ell");
      const leaders = q(".rs-leader");
      const labels = q(".rs-label");
      const layers = q(".rs-layer");
      const heroEl = q(".rs-hero")[0];
      const menuEl = q(".rs-menu")[0];
      const pdp = q(".rs-pdp")[0];
      const canvas = q(".screen-canvas")[0];
      const caps = q(".rs-cap");
      const cap = (i: number, at: number | string) => {
        caps.forEach((c, k) => tl.set(c, { visibility: k === i ? "visible" : "hidden" }, at));
      };

      cap(0, 0);
      tl.set(canvas, { "--fx": 0.494 }, 0);
      tl.set(layers, { autoAlpha: 1 }, 0);
      tl.fromTo(head, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.3, ease: EASE.linear, immediateRender: true }, 0);

      // ── DRAW: the technical outline, at the real place of each ingredient
      tl.fromTo(ell, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.35, stagger: 0.08, ease: EASE.snap(5), immediateRender: true }, 0.1);
      tl.fromTo(leaders, { scaleX: 0 }, { scaleX: 1, transformOrigin: "left center", duration: 0.15, stagger: 0.08, ease: EASE.linear, immediateRender: true }, 0.35);
      tl.fromTo(labels, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.15, stagger: 0.08, ease: EASE.snap(3), immediateRender: true }, 0.45);
      tl.addLabel("rest1", 1.05);

      // ── BUILD: each outline fills with its real ingredient, bottom-up
      cap(1, 1.1);
      [...layers].reverse().forEach((l, n) => {
        const i = layers.length - 1 - n;
        tl.fromTo(l, { clipPath: ellipse(rayoLayers[i], 0) }, { clipPath: ellipse(rayoLayers[i]), duration: 0.4, ease: EASE.product, immediateRender: true }, 1.1 + n * 0.16);
      });
      tl.addLabel("rest2", 2.2);

      // ── PRESENT: the cut-outs were the real hero all along — the page opens around them
      tl.to(ell, { clipPath: "inset(0 0 0 100%)", duration: 0.2, ease: EASE.linear }, 2.25);
      tl.to([...leaders, ...labels], { clipPath: "inset(0 100% 0 0)", duration: 0.2, ease: EASE.linear }, 2.25);
      cap(2, 2.4);
      tl.fromTo(heroEl, { clipPath: "inset(0% 50% 0% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: EASE.product, immediateRender: true }, 2.4);
      tl.addLabel("rest3", 3.35);

      // ── ASSEMBLE: the page withdraws, the parts close in steps and snap into the real burger
      tl.to(heroEl, { clipPath: "inset(0% 50% 0% 50%)", duration: 0.35, ease: EASE.product }, 3.45);
      cap(3, 3.8);
      layers.forEach((l, i) => {
        const d = rayoLayers[i];
        tl.fromTo(l, { yPercent: 0, scale: 1 }, { yPercent: ASSEMBLED_CY[i] - d.cy, scale: ASSEMBLED_K, duration: 0.6, ease: EASE.snap(4), immediateRender: true }, 3.8);
      });
      const snapAt = 4.45;
      tl.set(layers, { autoAlpha: 0 }, snapAt);
      const a = rayoAssembled;
      tl.fromTo(menuEl, { clipPath: `ellipse(0% 0% at ${a.cx}% ${a.cy}%)` }, { clipPath: `ellipse(${a.rx}% ${a.ry}% at ${a.cx}% ${a.cy}%)`, duration: 0.01, immediateRender: true }, snapAt);
      tl.addLabel("rest4", snapAt + 0.15);

      // ── the menu opens around the burger: the product is the interface
      cap(4, 4.7);
      tl.to(menuEl, { clipPath: `ellipse(150% 150% at ${a.cx}% ${a.cy}%)`, duration: 0.8, ease: EASE.product }, 4.7);
      tl.addLabel("rest5", 5.6);
      let t = 5.6;
      if (compact) {
        // phones: the window pans across the real menu (title · price → add)
        tl.fromTo(canvas, { "--fx": 0.494 }, { "--fx": 0.33, duration: 0.6, ease: EASE.settle, immediateRender: false }, t);
        tl.fromTo(canvas, { "--fx": 0.33 }, { "--fx": 0.64, duration: 0.7, ease: EASE.settle, immediateRender: false }, t + 0.7);
        t += 1.5;
      } else {
        t += 0.3;
      }

      // ── the product page
      cap(5, t);
      tl.fromTo(pdp, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.6, ease: EASE.product, immediateRender: true }, t);
      if (compact) {
        tl.fromTo(canvas, { "--fx": 0.64 }, { "--fx": 0.4, duration: 0.5, ease: EASE.settle, immediateRender: false }, t + 0.3);
        tl.fromTo(canvas, { "--fx": 0.4 }, { "--fx": 0.6, duration: 0.6, ease: EASE.settle, immediateRender: false }, t + 0.9);
      }
      tl.addLabel("rest6", t + 0.7);
      tl.to({}, { duration: 0.6 });
      tl.addLabel("rest7", tl.duration());
      return tl;
    },
  });

  return (
    <div className="scene-slot">
      <section ref={ref} aria-label="Proyecto 02 — Prospector" className="vh relative w-full overflow-hidden">
        <div className="area area-cq absolute" style={{ inset: "var(--frame-inset)", top: "var(--frame-top)" }}>
          <SheetHead project={pr} />
          <ProjectWindow project={pr} tone="ink" label="RAYO SMASH · demo · hero → menú → producto">
            <Screen fx={0.494} fy={0.5} sizes={SIZES}>
              {/* the real hero, opened around its own parts */}
              <div className="rs-hero absolute inset-0" style={{ clipPath: "inset(0% 50% 0% 50%)" }}>
                <Capture capture={hero} sizes={SIZES} position="center center" />
              </div>
              {/* the six parts, cut out of the same capture at their real place */}
              {rayoLayers.map((l) => (
                <div key={l.label} className="rs-layer absolute inset-0" style={{ clipPath: ellipse(l, 0), transformOrigin: `${l.cx}% ${l.cy}%`, mixBlendMode: "lighten" }} aria-hidden="true">
                  <Capture capture={hero} sizes={SIZES} position="center center" />
                </div>
              ))}
              {/* the technical outline: one hairline ellipse per part, at its real place */}
              {rayoLayers.map((l, i) => (
                <div
                  key={l.label}
                  className="rs-ell pointer-events-none absolute rounded-[50%]"
                  style={{ left: `${l.cx - l.rx}%`, top: `${l.cy - l.ry}%`, width: `${l.rx * 2}%`, height: `${l.ry * 2}%`, border: `1px solid ${i % 2 ? "var(--bone-3)" : "var(--bone)"}`, clipPath: "inset(0 100% 0 0)" }}
                  aria-hidden="true"
                />
              ))}
              {rayoLayers.map((l) => (
                <div key={l.label} className="pointer-events-none absolute flex items-center gap-1.5" style={{ left: `${l.cx + l.rx + 0.6}%`, top: `${l.cy}%`, transform: "translateY(-50%)" }} aria-hidden="true">
                  <span className="rs-leader block h-px w-4 bg-orange md:w-8" />
                  <span className="rs-label t-dim">
                    <span className="hidden md:inline">{l.label}</span>
                    <span className="md:hidden">{l.short}</span>
                  </span>
                </div>
              ))}
              {/* the real menu, around the assembled CLÁSICA */}
              <div className="rs-menu absolute inset-0" style={{ clipPath: "ellipse(0% 0% at 50% 50%)" }}>
                <Capture capture={menu} sizes={SIZES} position="center center" />
              </div>
              {/* the real product page */}
              <div className="rs-pdp absolute inset-0" style={{ clipPath: "inset(100% 0 0 0)" }}>
                <Capture capture={product} sizes={SIZES} position="center center" />
              </div>
            </Screen>
            {/* what the window is showing, in the system's own voice */}
            <div className="t-mono pointer-events-none absolute bottom-2 left-3 text-bone-3" style={{ fontSize: 9, textShadow: "0 1px 2px #000" }} aria-hidden="true">
              {["trazo · 6 piezas · posición real", "capas · recortadas del hero real", "hero · capa por capa · 1:1", "ensamble · encastre", "menú · tracklist", "producto · clásica"].map((c, i) => (
                <span key={c} className="rs-cap absolute bottom-0 left-0 whitespace-nowrap" style={{ visibility: i === 0 ? "visible" : "hidden" }}>{c}</span>
              ))}
            </div>
          </ProjectWindow>
        </div>
      </section>
    </div>
  );
}
