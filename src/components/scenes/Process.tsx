"use client";

import { useRef } from "react";
import { useScene } from "@/lib/useScene";
import { setSystem } from "@/lib/store";
import { stations } from "@/data/system";
import { EASE } from "@/lib/motion";

/**
 * 06 · Process — one object, six stations. Reuses the verbs the visitor already learned:
 * Understand (dashed) → Strategize (outline) → Design (face) → Prototype (layers) →
 * Engineer (fill + assemble) → Launch (rotate frontal). Desktop: side-view line, the
 * camera dollies. Mobile: vertical station line, the object pinned at the right.
 */
export function Process() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, {
    id: "process",
    pinVh: { desktop: 2.0, compact: 1.3 },
    states: 6,
    onProgress: (p) => {
      const i = Math.min(5, Math.floor(p * 6));
      setSystem({ step: 5, status: `Estación 0${i + 1} / 06`, section: "06 — Proceso", note: stations[i].label.toLowerCase(), frame: 1, grid: 1, tone: "graphite" });
    },
    build: ({ q, gsap }) => {
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      const line = q(".line")[0];
      const obj = q(".obj")[0];
      const labels = q(".st-label");
      const face = q(".obj-face")[0];
      const faceFill = q(".obj-face-fill")[0];
      const layers = q(".obj-layer");
      const layerFills = q(".obj-layer-fill");
      const desktop = window.matchMedia("(min-width: 1024px)").matches;

      tl.fromTo(q(".line-fill")[0], { scaleX: 0 }, { scaleX: 1, transformOrigin: "left", duration: 0.5, immediateRender: true }, 0);
      // the camera dollies: the line and labels move left while the object stays centred (desktop only)
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const at = 0.5 + i * 1.0;
        tl.addLabel(`st${i}`, at);
        tl.to(labels, { color: (k: number) => (k === i ? "#f04e23" : k < i ? "#e6e2d8" : "#9aa19c"), duration: 0.01 }, at);
        if (desktop) tl.to(line, { xPercent: -i * (100 / steps) * 0.8, duration: 0.6, ease: EASE.product }, at);
        else tl.to(line, { yPercent: -i * (100 / steps) * 0.45, duration: 0.6, ease: EASE.product }, at);
      }
      // 00 dashed → 01 outline
      tl.fromTo(obj, { "--dash": 1 }, { "--dash": 0, duration: 0.3, immediateRender: true }, "st1");
      // 02 face fills L → R
      tl.fromTo(faceFill, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: EASE.linear, immediateRender: true }, "st2");
      // 03 layers draw as outlines, exploded
      tl.fromTo(layers, { opacity: 0, y: 0 }, { opacity: 1, y: (k: number) => 26 + k * 26, duration: 0.4, stagger: 0.12, ease: EASE.settle, immediateRender: true }, "st3");
      // 04 layers fill bottom-up, then assemble in ticks
      tl.fromTo(layerFills, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.35, stagger: -0.15, immediateRender: true }, "st4");
      tl.to(layers, { y: (k: number) => 6 + k * 5, duration: 0.4, ease: EASE.snap(4) }, "st4+=0.5");
      // 05 launch: rotate frontal (clockwise), edge stays as a 4px line
      tl.to([face, layers], { rotateX: 0, rotateZ: 0, duration: 0.8, ease: EASE.product }, "st5");
      tl.to(q(".obj-edge")[0], { opacity: 1, duration: 0.2 }, "st5+=0.6");
      tl.to({}, { duration: 0.5 });
      return tl;
    },
  });

  const isoT = "rotateX(54.7deg) rotateZ(-45deg)";

  return (
    <div className="scene-slot">
      <section ref={ref} aria-label="Proceso" className="vh relative w-full overflow-hidden">
        <div className="absolute overflow-hidden" style={{ inset: "var(--frame-inset)", top: "var(--frame-top)" }}>
          <div className="absolute left-[2%] top-[4%] flex w-[96%] flex-col gap-3 md:w-[60%]">
            <div className="t-dim">06 · Proceso</div>
            <h2 className="t-display m-0" style={{ fontSize: "clamp(36px, 5vw, 72px)" }}>El mismo objeto,<br />seis estaciones</h2>
            <p className="m-0 hidden max-w-[520px] text-[15px] leading-[1.5] text-bone-2 md:block" style={{ textWrap: "pretty" }}>
              El contador que venís viendo desde 00/06, desplegado en una línea. Una pieza en blanco entra por la izquierda y sale por la derecha convertida en producto.
            </p>
          </div>

          {/* the line (desktop horizontal, mobile vertical) */}
          <div className="line absolute left-[2%] top-[58%] w-[160%] md:top-[70%]">
            <div className="line-fill axis-h absolute left-0 right-0 top-0 hidden md:block" />
            <div className="flex flex-col gap-2 md:flex-row md:gap-0">
              {stations.map((s) => (
                <div key={s.key} className="flex items-center gap-4 md:w-[16.6%] md:flex-col md:items-start md:gap-2 md:pt-4">
                  <span className="st-label t-display" style={{ fontSize: "clamp(22px, 2vw, 30px)", color: "#9aa19c" }}>{s.label}</span>
                  <span className="hidden max-w-[180px] text-[12px] leading-[1.4] text-bone-3 md:block">{s.note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* the one object, pinned centre-right; it transforms in place */}
          <div className="obj absolute right-[10%] top-[22%] md:right-[16%] md:top-[30%]" style={{ perspective: 1400, ["--dash" as string]: 1 }} data-cursor="separate">
            <div className="relative preserve-3d scale-[0.8] md:scale-100" style={{ width: 200, height: 130 }}>
              {[2, 1, 0].map((k) => (
                <div key={k} className="obj-layer absolute inset-0 opacity-0" style={{ transform: isoT, border: "1px solid var(--edge-2)", background: "transparent" }}>
                  <div className="obj-layer-fill absolute inset-0" style={{ background: "linear-gradient(160deg,#2e3330,#202422)" }} />
                  <div className="t-mono absolute left-2 top-2" style={{ fontSize: 8, color: "var(--bone-3)" }}>{["02 · componentes", "03 · api", "04 · datos"][2 - k]}</div>
                </div>
              ))}
              <div
                className="obj-face absolute inset-0"
                style={{ transform: isoT }}
              >
                <div className="absolute inset-0 border border-bone" style={{ opacity: "calc(1 - var(--dash))" }} />
                <div className="obj-face-fill absolute inset-0 p-3" style={{ background: "var(--paper)", clipPath: "inset(0 100% 0 0)" }}>
                  <div className="h-1.5 w-12 bg-ink" />
                  <div className="mt-2 flex gap-1.5"><div className="h-7 flex-1 bg-[#e4dfd3]" /><div className="h-7 flex-1 bg-[#e4dfd3]" /></div>
                  <div className="mt-2 h-2 w-12 bg-orange" />
                </div>
                <div className="absolute inset-0 border border-dashed border-edge" style={{ opacity: "var(--dash)" }} />
              </div>
              <div className="obj-edge absolute bottom-[-4px] left-0 h-1 w-full bg-[#141716] opacity-0" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
