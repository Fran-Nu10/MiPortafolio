"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useScene } from "@/lib/useScene";
import { setSystem } from "@/lib/store";
import { trays, type Tray } from "@/data/system";
import { projectById, projects } from "@/data/projects";
import { EASE, ScrollTrigger, prefersReducedMotion } from "@/lib/motion";

const usedIn = (tray: Tray) => Array.from(new Set(tray.parts.map((p) => `lámina 0${projectById[p.from].index}`))).join(" · ");

/**
 * 05 · Capabilities — parts, not services. The four slabs left on the plate are an inventory:
 * four small isometric bins. ISOMETRIC = what exists; FRONTAL = what you look at — so on
 * scroll (or on click) one bin lifts out of the inventory, turns frontal and takes most of
 * the frame, with its parts at a size where the real screens can be read.
 * Phones: no pin — the four bins follow each other, frontal, two parts per row.
 */
export function Capabilities() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  // progress at which each bin's content is swapped (measured from the timeline, while its parts are masked)
  const marks = useRef([0, 0.33, 0.55, 0.77]);

  useScene(ref, {
    id: "capabilities",
    pinVh: { desktop: 2.6, compact: 0 },
    mobile: "flow",
    flowRange: ["top 85%", "bottom 85%"],
    states: 5,
    onProgress: (p) => {
      const i = marks.current.filter((m) => p >= m).length - 1;
      if (i !== activeRef.current) {
        activeRef.current = i;
        setActive(i);
      }
      setSystem({ step: 5, status: "Ensamblado", section: "05 — Capacidades", note: p < marks.current[0] + 0.1 ? "las cuatro piezas son un inventario" : `bandeja 0${i + 1} · ${trays[i].title.toLowerCase()}`, frame: 1, grid: 1, tone: "graphite" });
    },
    build: ({ q, gsap, flow }) => {
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      const head = q(".cap-head")[0];
      if (flow) {
        // phones: each bin draws as it comes in — outline, then its parts land
        tl.fromTo(head, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.3, immediateRender: true }, 0);
        q(".cap-m").forEach((bin, i) => {
          tl.fromTo(bin, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.4, ease: EASE.linear, immediateRender: true }, 0.2 + i * 0.6);
        });
        return tl;
      }
      const lids = q(".lid");
      const panel = q(".cap-panel")[0];
      tl.set(panel, { "--rot": 0, "--s": 0.6 }, 0);
      tl.fromTo(head, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.3, immediateRender: true }, 0);
      // the lids (each build's own face) lift off the bins
      tl.fromTo(lids, { y: 0, autoAlpha: 1 }, { y: -40, autoAlpha: 0, duration: 0.35, stagger: 0.08, ease: EASE.settle, immediateRender: true }, 0.15);
      // the first bin turns frontal and takes the frame
      tl.fromTo(panel, { "--rot": 0, "--s": 0.6 }, { "--rot": 1, "--s": 1, duration: 0.6, ease: EASE.product, immediateRender: false }, 0.45);
      // then one bin per step (the panel content is swapped by state; the step is a wipe)
      const parts = q(".cap-panel .cap-part");
      [1, 2, 3].forEach((i) => {
        const at = 0.45 + i * 0.95;
        // the bin closes and refills fast: the parts are what you read, not the swap
        tl.fromTo(parts, { clipPath: "inset(0 0 0% 0)" }, { clipPath: "inset(0 0 100% 0)", duration: 0.1, ease: EASE.linear, immediateRender: false }, at - 0.12);
        tl.fromTo(parts, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.18, stagger: 0.03, ease: EASE.snap(3), immediateRender: false }, at);
      });
      tl.to({}, { duration: 0.6 });
      const D = tl.duration();
      marks.current = [0, ...[1, 2, 3].map((i) => (0.45 + i * 0.95 - 0.02) / D)];
      [0.3, ...[1, 2, 3].map((i) => 0.45 + i * 0.95 + 0.5)].forEach((t, i) => tl.addLabel(`rest${i}`, Math.min(t, D)));
      return tl;
    },
  });

  /** clicking a bin scrolls to its state — the scroll stays the visitor's, nothing is hijacked */
  function goTo(i: number) {
    const st = ScrollTrigger.getById("capabilities");
    if (!st) return setActive(i);
    const m = marks.current;
    const p = i === 0 ? 0.2 : Math.min(0.98, m[i] + 0.08);
    window.scrollTo({ top: st.start + (st.end - st.start) * p, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  const tray = trays[active];

  return (
    <div className="scene-slot">
      <section ref={ref} aria-label="Capacidades" className="relative w-full md:h-[100svh] md:overflow-hidden">
        <div className="relative px-[var(--frame-inset)] pb-16 pt-[calc(var(--frame-top)+24px)] md:absolute md:inset-[var(--frame-inset)] md:top-[var(--frame-top)] md:p-0">
          <div className="cap-head flex flex-col gap-3 md:absolute md:left-[1%] md:top-[3%] md:w-[30%] md:gap-4">
            <div className="t-dim">05 · Capacidades</div>
            <h2 className="t-display m-0" style={{ fontSize: "clamp(40px, 5vw, 84px)" }}>Despiece</h2>
            <p className="m-0 max-w-[420px] text-[15px] leading-[1.5] text-bone-2" style={{ textWrap: "pretty" }}>
              Cuatro productos terminados, desarmados. No es una lista de servicios: son las piezas que combino para construir un producto entero.
            </p>
          </div>

          {/* ── desktop: the inventory (iso, small) + the bin being looked at (frontal, large) */}
          <div className="absolute bottom-[4%] left-[1%] hidden w-[30%] md:block" style={{ aspectRatio: "1.25" }} role="tablist" aria-label="Bandejas de piezas">
            {trays.map((t, i) => {
              const on = active === i;
              const lid = projects[i];
              return (
                <div key={t.id} className="absolute" style={{ left: `${(i % 2) * 50 + 4}%`, top: `${Math.floor(i / 2) * 48 + 4}%`, width: "40%", height: "36%" }}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls="cap-panel"
                    onClick={() => goTo(i)}
                    className="tray-d absolute inset-0 text-left"
                    style={{
                      transform: `rotate(-30deg) skewX(30deg) scaleY(0.864) translateY(${on ? -14 : 0}px)`,
                      border: `1px ${on ? "dashed" : "solid"} ${on ? "var(--orange)" : "var(--edge-2)"}`,
                      background: on ? "transparent" : "linear-gradient(160deg,#2a2e2c,#202422)",
                      transition: "transform .35s var(--ease-settle), border-color .2s, background .2s",
                    }}
                    data-cursor="magnet"
                  >
                    <span className="t-mono block p-2" style={{ fontSize: 9, color: on ? "var(--orange)" : "var(--bone)" }}>0{i + 1} · {t.title}</span>
                  </button>
                  {/* the lid: the face of the build that left this slab on the plate */}
                  <div className="lid pointer-events-none absolute inset-0" style={{ background: lid.faceColor, border: "1px solid var(--bone)", transform: "rotate(-30deg) skewX(30deg) scaleY(0.864)" }} aria-hidden="true" />
                </div>
              );
            })}
            <div className="t-dim absolute -bottom-1 left-[4%]" style={{ color: "var(--bone-3)" }}>inventario · iso · elegí una bandeja</div>
          </div>

          <div className="cap-panel-pos absolute right-0 top-[2%] hidden h-[94%] w-[66%] md:block" style={{ perspective: "none" }}>
            <div id="cap-panel" role="tabpanel" aria-label={tray.title} className="cap-panel pw relative flex h-full w-full flex-col border border-bone bg-graphite-2" style={{ ["--rot" as string]: 1, ["--s" as string]: 1 }}>
              <div className="t-mono flex items-center justify-between border-b border-edge px-4 py-3">
                <span className="text-bone">0{active + 1} · {tray.title} <span className="text-bone-3">· {tray.sub}</span></span>
                <span className="text-bone-3">usado en · {usedIn(tray)}</span>
              </div>
              <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-3 p-3">
                {/* keyed by slot: the same four nodes are re-filled, so the scene's masks stay attached */}
                {tray.parts.map((part, k) => (
                  <Part key={k} part={part} sizes="32vw" />
                ))}
              </div>
            </div>
          </div>

          {/* ── phones: the four bins in sequence, frontal, parts two per row */}
          <div className="mt-10 flex flex-col gap-10 md:hidden">
            {trays.map((t, i) => (
              <div key={t.id} className="cap-m flex flex-col gap-3">
                <div className="flex items-baseline justify-between border-b border-edge pb-2">
                  <h3 className="t-mono m-0 font-normal text-bone">0{i + 1} · {t.title}</h3>
                  <span className="t-dim" style={{ color: "var(--bone-3)" }}>{usedIn(t)}</span>
                </div>
                <div className="t-mono text-bone-3">{t.sub}</div>
                <div className="grid grid-cols-2 gap-2">
                  {t.parts.map((part) => (
                    <Part key={part.label} part={part} sizes="50vw" compact />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Part({ part, sizes, compact = false }: { part: Tray["parts"][number]; sizes: string; compact?: boolean }) {
  const h = compact ? "aspect-[4/3]" : "h-full min-h-0";
  if (!part.capture) {
    return (
      <figure className={`cap-part part relative m-0 flex ${h} min-w-0 flex-col justify-end overflow-hidden border border-dashed border-edge p-3`}>
        <figcaption className="t-mono text-bone-3" style={{ fontSize: compact ? 10 : 11 }}>{part.label}</figcaption>
        <span className="t-dim mt-1" style={{ color: "var(--edge-2)", whiteSpace: "normal" }}>espacio vacío · {projectById[part.from].name}</span>
      </figure>
    );
  }
  return (
    <figure className={`cap-part part relative m-0 ${h} overflow-hidden border border-bone bg-paper`}>
      <Image src={part.capture.src} alt={part.capture.alt} sizes={sizes} className="h-full w-full object-cover" style={{ objectPosition: part.capture.position }} />
      <figcaption className="t-mono absolute bottom-0 left-0 right-0 bg-[rgba(31,34,32,.88)] px-2 py-1.5 text-bone" style={{ fontSize: compact ? 9 : 10 }}>
        {part.label} <span className="text-bone-3">· {projectById[part.from].name}</span>
      </figcaption>
    </figure>
  );
}
