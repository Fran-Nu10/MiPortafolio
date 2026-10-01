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
  // where each module starts and where the exit starts, as progress (measured from the timeline)
  const marks = useRef({ modules: modules.map((_, i) => 0.2 + (i * 0.65) / modules.length), exit: 0.88 });

  useScene(ref, {
    id: "ts",
    // four real screens to read (phones pan across them), two drawn modules
    pinVh: { desktop: 2.8, compact: 2.0 },
    states: 8,
    onProgress: (p) => {
      const m = marks.current;
      const i = Math.max(0, m.modules.filter((s) => p >= s).length - 1);
      setSystem({
        step: 4,
        status: p < m.exit ? "Sheet 01 / 04" : "Sheet 01 → 02",
        section: "03 — Selected work · TravelSuite360",
        note: p < m.modules[0] ? "construction explains · product proves" : p < m.exit ? `module 0${i + 1} · ${modules[i]?.name.toLowerCase()}` : "the system leaves as an outline",
        frame: 1,
        grid: p < 0.2 ? 1 : 0.4,
        tone: "graphite",
      });
    },
    build: ({ q, gsap, root, compact }) => {
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      const pw = q(".pw")[0];
      const screen = q(".pw-screen")[0];
      const strip = q(".pw-strip")[0];
      const bar = q(".pw-controls-bar");
      const head = q(".sheet-head")[0];
      const panels = q(".mf-panel");
      const canvases = panels.map((p) => p.querySelector<HTMLElement>(":scope > .screen > .screen-canvas"));
      // the window starts at the slab the hero handed over (same size, same centre)
      const bench = parseFloat(getComputedStyle(root).getPropertyValue("--bench-scale")) || 1;
      const s0 = (SLAB_W * bench) / (screen.offsetWidth || SLAB_W);

      tl.addLabel("rest0", 0);
      // every value a later tween changes gets an explicit state at 0, so scrubbing back restores it
      tl.set(pw, { "--s": s0, "--rot": 1, "--fill": 1 }, 0);
      tl.set(q(".pw-move")[0], { x: 0 }, 0);
      panels.forEach((p, i) => tl.set(p, { visibility: i ? "hidden" : "visible", clipPath: "inset(0% 0 0 0)" }, 0));
      canvases.forEach((c, i) => c && tl.set(c, { "--fx": modules[i].fx ?? 0.5 }, 0));
      tl.fromTo([strip, ...bar], { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.3, ease: EASE.linear, immediateRender: true }, 0.55);
      tl.fromTo(head, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.35, ease: EASE.linear, immediateRender: true }, 0.1);
      // PRESENT: the slab becomes the window
      tl.fromTo(pw, { "--s": s0 }, { "--s": 1, duration: 0.9, ease: EASE.product, immediateRender: false }, 0.15);
      tl.addLabel("rest1", 1.1);

      // the modules, one per step: the real screen (phones pan across it) or the module's layers
      const starts: number[] = [];
      let t = 1.15;
      modules.forEach((m, i) => {
        if (i > 0) {
          tl.set(panels[i], { visibility: "visible" }, t);
          tl.fromTo(panels[i], { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.35, ease: EASE.product, immediateRender: false }, t);
          tl.set(panels[i - 1], { visibility: "hidden" }, t + 0.36);
        }
        starts.push(t);
        t += i > 0 ? 0.4 : 0;
        const c = canvases[i];
        if (compact && m.pan && c) {
          tl.fromTo(c, { "--fx": m.pan[0] }, { "--fx": m.pan[1], duration: 0.8, ease: EASE.settle, immediateRender: false }, t);
          t += 0.85;
        } else t += m.capture ? 0.55 : 0.3;
        tl.addLabel(`rest${i + 1}`, t);
      });
      tl.to({}, { duration: 0.3 }, t); // hold the last module

      // EXIT: back to construction, the surface clears, the outline leaves
      tl.addLabel("exit");
      tl.fromTo(pw, { "--rot": 1, "--s": 1 }, { "--rot": 0, "--s": 0.42, duration: 0.9, ease: EASE.product, immediateRender: false }, "exit");
      tl.to([strip, ...bar, head], { clipPath: "inset(0 100% 0 0)", duration: 0.25, ease: EASE.linear }, "exit");
      tl.fromTo(pw, { "--fill": 1 }, { "--fill": 0, duration: 0.3, ease: EASE.linear, immediateRender: false }, "exit+=0.7");
      tl.fromTo(q(".pw-move")[0], { x: 0 }, { x: () => -window.innerWidth, duration: 0.5, ease: EASE.linear, immediateRender: false }, "exit+=1.0");
      tl.addLabel("rest99", tl.duration());
      const D = tl.duration();
      marks.current = { modules: starts.map((x) => x / D), exit: tl.labels.exit / D };
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
