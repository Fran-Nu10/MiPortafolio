"use client";

import { useRef } from "react";
import { useScene } from "@/lib/useScene";
import { setSystem } from "@/lib/store";
import { projectById } from "@/data/projects";
import { ProjectWindow } from "@/components/system/ProjectWindow";
import { Screen } from "@/components/system/Screen";
import { SheetHead } from "@/components/system/Sheet";
import { EASE } from "@/lib/motion";

const sn = projectById["santi-nuca"];

/** the spreads, in editorial order; on phones each is framed on its subject and may pan */
const spreads = [
  { c: sn.captures[0], fx: 0.6, pan: null, label: "apertura · SANTI / NUCA" },
  { c: sn.captures[4], fx: 0.22, pan: [0.22, 0.8], label: "forma · línea · textura" },
  { c: sn.captures[2], fx: 0.3, pan: [0.3, 0.72], label: "02 · díptico · editorial" },
  { c: sn.captures[3], fx: 0.6, pan: null, label: "03 · detalle · macro" },
  { c: sn.captures[7], fx: 0.82, pan: null, label: "06 · corte · volumen" },
] as const;

/**
 * 03.03 · Santi Nuca — the editorial rupture. ENSAMBLE withdraws: no grid, no frame, no cotas.
 * Paper wipes in, a single rule and the numeral set the page, then the real spreads arrive
 * frontal and large, one after another like pages, at the project's own rhythm.
 */
export function SantiNuca() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, {
    id: "santi",
    pinVh: { desktop: 2.4, compact: 1.7 },
    states: 7,
    onProgress: (p) => {
      setSystem({
        step: 4,
        status: p < 0.1 ? "Lámina 02 → 03" : "Lámina 03 / 04",
        section: "03 — Proyectos · Santi Nuca",
        note: p < 0.25 ? "el sistema se retira" : "sin grilla · sin cotas · mandan las páginas",
        // the system withdraws once the paper has covered the bench
        frame: p < 0.07 ? 1 : 0,
        grid: p < 0.07 ? 0.4 : 0,
        tone: p < 0.07 ? "graphite" : "paper",
      });
    },
    build: ({ q, gsap, compact }) => {
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      const wipe = q(".sn-wipe")[0];
      const rule = q(".sn-rule")[0];
      const numeral = q(".sn-numeral")[0];
      const head = q(".sheet-head")[0];
      const pos = q(".pw-move")[0];
      const pages = q(".sn-page");
      const canvases = pages.map((p) => p.querySelector<HTMLElement>(".screen-canvas")!);

      // reduced motion: the first resting state is the page already set (no half-wiped paper)
      canvases.forEach((c, i) => tl.set(c, { "--fx": spreads[i].fx }, 0));
      tl.set(pos, { y: () => window.innerHeight * 0.6 }, 0);
      pages.forEach((pg, i) => i && tl.set(pg, { yPercent: 100, visibility: "hidden" }, 0));
      // paper wipes in over the dark, a rule and the numeral set the page
      tl.fromTo(wipe, { scaleX: 0 }, { scaleX: 1, transformOrigin: "right center", duration: 0.6, ease: EASE.product, immediateRender: true }, 0);
      tl.fromTo(rule, { scaleY: 0 }, { scaleY: 1, transformOrigin: "top center", duration: 0.4, ease: EASE.linear, immediateRender: true }, 0.35);
      tl.fromTo(numeral, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.4, ease: EASE.settle, immediateRender: true }, 0.5);
      tl.fromTo(head, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.3, ease: EASE.linear, immediateRender: true }, 0.7);
      // the first spread rises as a page; the numeral steps back
      tl.fromTo(pos, { y: () => window.innerHeight * 0.6 }, { y: 0, duration: 0.7, ease: EASE.product, immediateRender: true }, 1.0);
      tl.to([rule, numeral], { clipPath: "inset(0 0 100% 0)", duration: 0.3, ease: EASE.linear }, 1.3);
      tl.addLabel("rest2", 1.8);

      let t = 1.85;
      pages.forEach((page, i) => {
        const s = spreads[i];
        if (i > 0) {
          tl.set(page, { visibility: "visible" }, t);
          tl.fromTo(page, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: EASE.product, immediateRender: false }, t);
          t += 0.6;
        }
        if (compact && s.pan) {
          tl.fromTo(canvases[i], { "--fx": s.pan[0] }, { "--fx": s.pan[1], duration: 0.8, ease: EASE.settle, immediateRender: false }, t + 0.05);
          t += 0.85;
        } else {
          t += i === 0 ? 0 : 0.3;
        }
        if (i > 0) tl.addLabel(`rest${i + 2}`, t);
      });
      tl.to({}, { duration: 0.4 });
      return tl;
    },
  });

  return (
    <div className="scene-slot">
      <section ref={ref} aria-label="Proyecto 03 — Santi Nuca" className="vh relative w-full overflow-hidden">
        <div className="sn-wipe absolute inset-0 bg-[#f4f3f0]" style={{ transform: "scaleX(0)" }} />
        <div className="area area-cq absolute" style={{ inset: "var(--frame-inset)", top: "var(--frame-top)" }}>
          <div className="sn-rule absolute left-[40%] top-0 h-full w-px bg-[#14120f]" style={{ transform: "scaleY(0)" }} />
          <div className="sn-numeral absolute bottom-0 left-0" style={{ fontSize: "clamp(120px, 26vw, 380px)", fontWeight: 300, lineHeight: 0.8, letterSpacing: "-0.06em", color: "#14120f", fontFamily: "var(--font-plex-sans)", clipPath: "inset(100% 0 0 0)" }} aria-hidden="true">03</div>
          <SheetHead project={sn} paper />
          <ProjectWindow project={sn} tone="paper" label="páginas · 1:1">
            {spreads.map((s, i) => (
              <div key={s.label} className="sn-page absolute inset-0 bg-[#f4f3f0]" style={i ? { visibility: "hidden" } : undefined}>
                <Screen capture={s.c} fx={s.fx} fy={0.5} />
                <span className="t-mono absolute bottom-2 left-3" style={{ fontSize: 9, color: "#6b6a66" }} aria-hidden="true">{s.label}</span>
              </div>
            ))}
          </ProjectWindow>
        </div>
      </section>
    </div>
  );
}
