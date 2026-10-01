"use client";

import { useRef, useState } from "react";
import { useScene } from "@/lib/useScene";
import { setSystem } from "@/lib/store";
import { projectById, projects, CAPTURE_RATIO } from "@/data/projects";
import { ProjectWindow } from "@/components/system/ProjectWindow";
import { Screen } from "@/components/system/Screen";
import { Capture } from "@/components/system/Capture";
import { SheetHead } from "@/components/system/Sheet";
import { Marker, Callout } from "@/components/system/Cota";
import { EASE } from "@/lib/motion";

const ca = projectById["chef-arturo"];

/** the arched photograph in the hero capture, % of the capture (chef-arturo-hero.png) */
const ARCH = { l: 79.8, t: 36.6, r: 93.1, b: 69.1 };

const pages = [
  { c: ca.captures[0], fx: 0.12, zm: 1, fy: 0.5, label: "hero · pastelería, merienda y lunch para fiestas" },
  { c: ca.captures[5], fx: 0.2, zm: 1, fy: 0.5, pan: [0.2, 0.8], label: "fechas que importan · 3 rutas de compra" },
  { c: ca.captures[6], fx: 0.25, zm: 1, fy: 0.5, pan: [0.25, 0.75], label: "elegí tu ocasión" },
  { c: ca.captures[8], fx: 0.495, zm: 1.7, fy: 0.74, label: "ficha · cookie levain · stock del día · mercado pago" },
] as const;

/**
 * 03.04 · Chef Arturo — art direction × transaction. BUILD: the sheet arrives as an outline in
 * construction and turns frontal (the pattern every presentation follows). PRESENT: the hero,
 * then its hero moment — the arched photograph grows past the window and the frame. Then the
 * commerce architecture returns: purchase modes, occasions, the real PDP with three markers.
 * INTERACT opens the live store. EXIT: the sheet goes back to construction and lies down as the
 * fourth slab on the plate, next to the other three builds.
 */
export function ChefArturo() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, {
    id: "chef",
    pinVh: { desktop: 3.2, compact: 2.3 },
    states: 8,
    onProgress: (p) => {
      if (p < 0.86)
        setSystem({
          step: 4,
          status: p < 0.06 ? "Lámina 03 → 04" : "Lámina 04 / 04",
          section: "03 — Proyectos · Chef Arturo",
          note: p < 0.24 ? "construir → girar → presentar" : p < 0.45 ? "la imagen cruza el marco" : p < 0.7 ? "arquitectura de compra" : "inspeccioná la capa de compra",
          frame: p > 0.2 && p < 0.42 ? 0 : 0.6,
          grid: 0,
          tone: "paper",
        });
      else setSystem({ status: "Ensamblado", section: "03 — Proyectos · salida", note: "cuatro proyectos sobre la placa", frame: 1, grid: 1, tone: "graphite" });
    },
    build: ({ q, gsap, compact, root }) => {
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      const cream = q(".ca-cream")[0];
      const dark = q(".ca-dark")[0];
      const head = q(".sheet-head")[0];
      const pw = q(".pw")[0];
      const pos = q(".pw-move")[0];
      const strip = q(".pw-strip")[0];
      const bar = q(".pw-controls-bar");
      const pageEls = q(".ca-page");
      const canvases = pageEls.map((p) => p.querySelector<HTMLElement>(".screen-canvas")!);
      const arch = q(".ca-arch")[0];
      const markers = q(".ca-markers")[0];
      const lineup = q(".lineup-slab");
      const slot4 = q(".lineup-slot")[0];

      // the arch's rect on screen, at the framing the hero has when it expands
      const sec = root.getBoundingClientRect();
      const win = q(".pw-screen")[0].getBoundingClientRect();
      const ch = win.height;
      const cw = Math.max(win.width, ch * CAPTURE_RATIO);
      const fx = compact ? 0.86 : 0.5;
      const left = Math.min(0, Math.max(win.width - cw, win.width / 2 - fx * cw));
      const ax = win.left - sec.left + left + (ARCH.l / 100) * cw;
      const ay = win.top - sec.top + (ARCH.t / 100) * (cw / CAPTURE_RATIO);
      const aw = ((ARCH.r - ARCH.l) / 100) * cw;
      const ah = ((ARCH.b - ARCH.t) / 100) * (cw / CAPTURE_RATIO);
      const archClip = `inset(${ay}px ${sec.width - ax - aw}px ${sec.height - ay - ah}px ${ax}px round ${aw / 2}px ${aw / 2}px 0px 0px)`;

      // reduced motion: the first resting state is the frontal hero (no half-built sheet)
      canvases.forEach((c, i) => tl.set(c, { "--fx": pages[i].fx }, 0));
      tl.set(pos, { x: 0, y: 0 }, 0);
      tl.set(arch, { visibility: "hidden" }, 0);
      pageEls.forEach((p, i) => tl.set(p, { visibility: i ? "hidden" : "visible", clipPath: "inset(0% 0 0 0)" }, 0));
      // cream rises over the editorial paper
      tl.fromTo(cream, { scaleY: 0 }, { scaleY: 1, transformOrigin: "bottom center", duration: 0.5, ease: EASE.product, immediateRender: true }, 0);
      tl.fromTo(head, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.3, ease: EASE.linear, immediateRender: true }, 0.35);
      // BUILD → ROTATE → PRESENT: an outline in construction, the surface fills, it turns frontal
      tl.fromTo(pw, { "--rot": 0, "--s": 0.5, "--fill": 0 }, { "--rot": 0, "--s": 0.5, "--fill": 0, duration: 0.01, immediateRender: true }, 0);
      tl.fromTo([strip, ...bar], { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 100% 0 0)", duration: 0.01, immediateRender: true }, 0);
      tl.fromTo(pw, { "--fill": 0 }, { "--fill": 1, duration: 0.4, ease: EASE.linear, immediateRender: false }, 0.45);
      tl.fromTo(pw, { "--rot": 0, "--s": 0.5 }, { "--rot": 1, "--s": 1, duration: 0.9, ease: EASE.product, immediateRender: false }, 0.8);
      tl.fromTo([strip, ...bar], { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.3, ease: EASE.linear, immediateRender: false }, 1.5);
      tl.addLabel("rest1", 1.85);

      let t = 1.9;
      if (compact) {
        // phones: from the copy to the arch, across the real hero
        tl.fromTo(canvases[0], { "--fx": 0.12 }, { "--fx": 0.86, duration: 0.7, ease: EASE.settle, immediateRender: false }, t);
        t += 0.75;
      }
      // the hero moment: the arch grows past the window and past the frame
      tl.set(arch, { visibility: "visible" }, t);
      tl.fromTo(arch, { clipPath: archClip }, { clipPath: "inset(0px 0px 0px 0px round 0px 0px 0px 0px)", duration: 1.1, ease: EASE.product, immediateRender: false }, t);
      tl.addLabel("rest2", t + 1.2);
      t += 1.6;
      // the commerce architecture returns under it
      tl.set(pageEls[1], { visibility: "visible", yPercent: 0 }, t - 0.1);
      tl.fromTo(arch, { clipPath: "inset(0px 0px 0px 0px round 0px 0px 0px 0px)" }, { clipPath: "inset(0px 0px 100% 0px round 0px 0px 0px 0px)", duration: 0.55, ease: EASE.product, immediateRender: false }, t);
      t += 0.6;
      tl.addLabel("rest3", t);
      [1, 2, 3].forEach((i) => {
        const p = pages[i];
        if (i > 1) {
          tl.set(pageEls[i], { visibility: "visible" }, t);
          tl.fromTo(pageEls[i], { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.55, ease: EASE.product, immediateRender: false }, t);
          t += 0.6;
        }
        if (compact && "pan" in p) {
          tl.fromTo(canvases[i], { "--fx": p.pan[0] }, { "--fx": p.pan[1], duration: 0.8, ease: EASE.settle, immediateRender: false }, t);
          t += 0.85;
        } else t += 0.35;
        tl.addLabel(`rest${i + 3}`, t);
      });
      // inspect: the three markers on the transactional column
      tl.fromTo(markers, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: true }, t - 0.2);
      t += 0.5;

      // EXIT: graphite returns, the sheet goes back to construction and lies down as slab 04
      tl.addLabel("exit", t);
      tl.to(markers, { autoAlpha: 0, duration: 0.01 }, t);
      tl.fromTo(dark, { scaleY: 0 }, { scaleY: 1, transformOrigin: "top center", duration: 0.5, ease: EASE.product, immediateRender: true }, t);
      tl.to([strip, ...bar, head], { clipPath: "inset(0 100% 0 0)", duration: 0.2, ease: EASE.linear }, t);
      const p0 = pos.getBoundingClientRect();
      const s4 = slot4.getBoundingClientRect();
      const screenW = q(".pw-screen")[0].offsetWidth || 1;
      tl.fromTo(pw, { "--rot": 1, "--s": 1 }, { "--rot": 0, "--s": s4.width / screenW, duration: 0.9, ease: EASE.product, immediateRender: false }, t + 0.2);
      tl.fromTo(pos, { x: 0, y: 0 }, { x: s4.left + s4.width / 2 - (p0.left + p0.width / 2), y: s4.top + s4.height / 2 - (p0.top + p0.height / 2), duration: 0.9, ease: EASE.product, immediateRender: false }, t + 0.2);
      tl.fromTo(lineup, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, stagger: 0.1, ease: EASE.settle, immediateRender: true }, t + 0.7);
      tl.addLabel("rest9", t + 1.3);
      tl.to({}, { duration: 0.3 });
      return tl;
    },
  });

  return (
    <div className="scene-slot">
      <section ref={ref} aria-label="Proyecto 04 — Chef Arturo" className="vh relative w-full overflow-hidden">
        <div className="ca-cream absolute inset-0 bg-[#f3eee4]" style={{ transform: "scaleY(0)" }} />
        <div className="ca-dark absolute inset-0 bg-graphite" style={{ transform: "scaleY(0)" }} />
        <div className="area area-cq absolute" style={{ inset: "var(--frame-inset)", top: "var(--frame-top)" }}>
          <SheetHead project={ca} paper />
          {/* the four builds lie down on the plate: three slabs + the slot this sheet lands in */}
          <div className="absolute bottom-[4%] left-1/2 flex origin-bottom -translate-x-1/2 scale-[0.6] items-end gap-6 md:scale-100 md:gap-14">
            {projects.map((p) =>
              p.id === "chef-arturo" ? (
                <div key={p.id} className="lineup-slot" style={{ width: 120, height: 78 }} />
              ) : (
                <div key={p.id} className="lineup-slab opacity-0" style={{ width: 120, height: 78, background: p.faceColor, border: "1px solid var(--bone)", transform: "rotate(-30deg) skewX(30deg) scaleY(0.864)", boxShadow: "6px 6px 0 #141716" }}>
                  <div className="t-mono p-2" style={{ fontSize: 8, color: p.id === "prospector" ? "var(--bone)" : "var(--ink)" }}>0{p.index} · {p.name}</div>
                </div>
              ),
            )}
          </div>
          <ProjectWindow project={ca} tone="paper" label="la tienda · 1:1">
            {pages.map((p, i) => (
              <div key={p.label} className="ca-page absolute inset-0 bg-[#f3eee4]" style={i ? { visibility: "hidden" } : undefined}>
                <Screen capture={p.c} fx={p.fx} fy={p.fy} zm={p.zm} />
                <span className="t-mono absolute bottom-2 left-3" style={{ fontSize: 9, color: "#6b6a66" }} aria-hidden="true">{p.label}</span>
                {i === 3 && <PdpMarkers />}
              </div>
            ))}
          </ProjectWindow>
        </div>
        {/* the arched photograph, allowed past the window and the frame */}
        <div className="ca-arch absolute inset-0" style={{ visibility: "hidden" }} aria-hidden="true">
          <Capture capture={ca.captures[2]} sizes="100vw" position="60% center" />
        </div>
      </section>
    </div>
  );
}

/** T2 · three tappable markers on the transactional column of the real PDP. Max three, one open. */
function PdpMarkers() {
  const [open, setOpen] = useState<number | null>(null);
  const items = [
    { y: 79, title: "Stock del día", detail: "catálogo · inventario · capa 04" },
    { y: 84, title: "Agregar al carrito", detail: "carrito → Mercado Pago · capa 03" },
    { y: 88.5, title: "Consultar por WhatsApp", detail: "segunda ruta · misma ficha" },
  ];
  return (
    <div className="ca-markers absolute inset-0" style={{ visibility: "hidden" }}>
      {/* the markers sit in capture coordinates, on the same canvas as the PDP */}
      <div className="screen pointer-events-none">
        <div className="screen-canvas" style={{ ["--fx" as string]: 0.495, ["--fy" as string]: 0.74, ["--zm" as string]: 1.7, ["--r" as string]: CAPTURE_RATIO }}>
          {items.map((it, i) => (
            <div key={it.title}>
              <Marker label={`${it.title}: ${it.detail}`} active={open === i} onClick={() => setOpen(open === i ? null : i)} style={{ left: "59.6%", top: `${it.y}%` }} />
              {open === i && (
                <div className="hidden md:block">
                  <Callout title={it.title} detail={it.detail} width={40} style={{ left: "60.6%", top: `${it.y}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* phones: the open marker reads as a caption under the column */}
      {open !== null && (
        <div className="t-dim absolute inset-x-0 bottom-0 bg-[rgba(31,34,32,.92)] px-3 py-2 md:hidden" role="status">
          <span style={{ color: "var(--bone)" }}>{items[open].title}</span> · {items[open].detail}
        </div>
      )}
    </div>
  );
}
