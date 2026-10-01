"use client";

import { useRef } from "react";
import { useScene } from "@/lib/useScene";
import { setSystem } from "@/lib/store";
import { projectById } from "@/data/projects";
import { ProjectWindow } from "@/components/system/ProjectWindow";
import { ModuleFace } from "@/components/system/ModuleFace";
import { SheetHead } from "@/components/system/Sheet";
import { EASE } from "@/lib/motion";

const ts = projectById.travelsuite360;
const modules = ts.modules ?? [];

/** the hero hands over a 420 px slab at --bench-scale; the window starts at exactly that size */
export const SLAB_W = 420;

/**
 * 03.01 · TravelSuite360 — product system. The slab the visitor watched being built in the
 * hero arrives frontal, then PRESENTS: it grows into the full window and steps through the
 * system's modules (each one with the layers it runs through, or its capture once supplied).
 * EXIT: it turns back to construction and leaves as an outline.
 */
export function TravelSuite() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, {
    id: "ts",
    pinVh: { desktop: 2.2, compact: 1.3 },
    states: 8,
    onProgress: (p) => {
      const i = Math.min(modules.length - 1, Math.max(0, Math.floor(((p - 0.22) / 0.62) * modules.length)));
      setSystem({
        step: 4,
        status: p < 0.88 ? "Sheet 01 / 04" : "Sheet 01 → 02",
        section: "03 — Selected work · TravelSuite360",
        note: p < 0.2 ? "construction explains · product proves" : p < 0.88 ? `module 0${i + 1} · ${modules[i]?.name.toLowerCase()}` : "the system leaves as an outline",
        frame: 1,
        grid: p < 0.2 ? 1 : 0.4,
        tone: "graphite",
      });
    },
    build: ({ q, gsap, root }) => {
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      const pw = q(".pw")[0];
      const screen = q(".pw-screen")[0];
      const strip = q(".pw-strip")[0];
      const bar = q(".pw-controls-bar");
      const head = q(".sheet-head")[0];
      const items = q(".mf-item");
      const panels = q(".mf-panel");
      // the window starts at the slab the hero handed over (same size, same centre)
      const bench = parseFloat(getComputedStyle(root).getPropertyValue("--bench-scale")) || 1;
      const s0 = (SLAB_W * bench) / (screen.offsetWidth || SLAB_W);

      tl.addLabel("rest0", 0);
      // every value a later tween changes gets an explicit state at 0, so scrubbing back restores it
      tl.set(pw, { "--s": s0, "--rot": 1, "--fill": 1 }, 0);
      tl.set(q(".pw-pos")[0], { x: 0 }, 0);
      tl.fromTo([strip, ...bar], { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.3, ease: EASE.linear, immediateRender: true }, 0.55);
      tl.fromTo(head, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.35, ease: EASE.linear, immediateRender: true }, 0.1);
      // PRESENT: the slab becomes the window
      tl.fromTo(pw, { "--s": s0 }, { "--s": 1, duration: 0.9, ease: EASE.product, immediateRender: false }, 0.15);
      tl.addLabel("rest1", 1.1);

      // the modules, one per step (the capture or the module's layers)
      modules.forEach((_, i) => {
        if (i === 0) return;
        const at = 1.2 + (i - 1) * 0.6;
        tl.set(items[i - 1], { attr: { "data-on": "0" } }, at);
        tl.set(items[i], { attr: { "data-on": "1" } }, at);
        tl.set(panels[i], { visibility: "visible" }, at);
        tl.fromTo(panels[i], { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.35, ease: EASE.product, immediateRender: false }, at);
        tl.set(panels[i - 1], { visibility: "hidden" }, at + 0.36);
        tl.addLabel(`rest${i + 1}`, at + 0.45);
      });
      tl.to({}, { duration: 0.3 });

      // EXIT: back to construction, the surface clears, the outline leaves
      tl.addLabel("exit");
      tl.fromTo(pw, { "--rot": 1, "--s": 1 }, { "--rot": 0, "--s": 0.42, duration: 0.9, ease: EASE.product, immediateRender: false }, "exit");
      tl.to([strip, ...bar, head], { clipPath: "inset(0 100% 0 0)", duration: 0.25, ease: EASE.linear }, "exit");
      tl.fromTo(pw, { "--fill": 1 }, { "--fill": 0, duration: 0.3, ease: EASE.linear, immediateRender: false }, "exit+=0.7");
      tl.fromTo(q(".pw-pos")[0], { x: 0 }, { x: () => -window.innerWidth, duration: 0.5, ease: EASE.linear, immediateRender: false }, "exit+=1.0");
      tl.addLabel("rest99", tl.duration());
      return tl;
    },
  });

  return (
    <div className="scene-slot">
      <section ref={ref} aria-label="Selected work 01 — TravelSuite360" className="vh relative w-full overflow-hidden">
        <div className="area area-cq absolute" style={{ inset: "var(--frame-inset)", top: "var(--frame-top)" }}>
          <SheetHead project={ts} />
          <ProjectWindow project={ts} tone="graphite" label="the system · its modules">
            <ModuleFace project={ts} active={0} />
          </ProjectWindow>
        </div>
      </section>
    </div>
  );
}
