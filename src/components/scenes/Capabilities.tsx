"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useScene } from "@/lib/useScene";
import { setSystem } from "@/lib/store";
import { trays, type Tray } from "@/data/system";
import { projectById } from "@/data/projects";
import { EASE } from "@/lib/motion";

/**
 * 05 · Capabilities — parts, not services. The four slabs left on the plate open into
 * four trays; each tray holds crops of real screens. A part with no capture stays a
 * dashed slot. Desktop: iso bench, 2 × 2. Mobile: frontal accordion, one tray open.
 */
export function Capabilities() {
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<Tray["id"] | null>(null);

  useScene(ref, {
    id: "capabilities",
    pinVh: 2,
    states: 4,
    onProgress: (p) => {
      setSystem({ step: 5, status: "Assembled", section: "05 — Capabilities", note: p < 0.3 ? "the four slabs open like lids" : "parts, not services · hover a tray", frame: 1, grid: 1, tone: "graphite" });
    },
    build: ({ q, gsap }) => {
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      const lids = q(".lid");
      const traysEl = q(".tray-d");
      const parts = q(".part-d");
      const head = q(".cap-head")[0];
      tl.fromTo(head, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3 }, 0);
      // lids lift in sequence, trays slide into the 2 × 2, parts land
      tl.fromTo(lids, { y: 0 }, { y: -60, duration: 0.4, stagger: 0.12, ease: EASE.settle }, 0.2);
      tl.to(lids, { opacity: 0, duration: 0.2, stagger: 0.12 }, 0.7);
      tl.fromTo(traysEl, { xPercent: -30, yPercent: 20, opacity: 0.6 }, { xPercent: 0, yPercent: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: EASE.settle, immediateRender: true }, 0.6);
      tl.fromTo(parts, { yPercent: -40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3, stagger: 0.03, ease: EASE.snap(2), immediateRender: true }, 1.2);
      tl.to({}, { duration: 0.6 });
      return tl;
    },
  });

  return (
    <div className="scene-slot">
      <section ref={ref} aria-label="Capabilities" className="vh relative w-full overflow-hidden">
        <div className="absolute" style={{ inset: "var(--frame-inset)", top: "calc(var(--frame-inset) + 16px)" }}>
          <div className="cap-head absolute left-0 top-[2%] flex w-full flex-col gap-3 md:left-[2%] md:top-[4%] md:w-[34%] md:gap-4">
            <div className="t-dim">05 · Capabilities</div>
            <h2 className="t-display m-0" style={{ fontSize: "clamp(40px, 5.6vw, 88px)" }}>Parts,<br />not services</h2>
            <p className="m-0 max-w-[440px] text-[14px] leading-[1.5] text-bone-2 md:text-[15px]" style={{ textWrap: "pretty" }}>
              You just saw four finished products. These are the parts they were built from — sorted into four bins, still warm. A part that has no capture stays an empty slot.
            </p>
          </div>

          {/* desktop bench: 2 × 2 iso trays */}
          <div className="hidden md:block absolute left-[52%] top-[14%] h-[80%] w-[48%]" style={{ perspective: 2000 }}>
            {trays.map((tray, i) => {
              const project = projectById[tray.parts[0].from];
              const isOpen = open === tray.id;
              const dim = open !== null && !isOpen;
              return (
                <div
                  key={tray.id}
                  className="absolute"
                  style={{ left: `${(i % 2) * 52}%`, top: `${Math.floor(i / 2) * 48}%`, width: "46%", height: "40%" }}
                >
                  {/* the lid: the product's face, lifted away on scroll */}
                  <div className="lid pointer-events-none absolute inset-0" style={{ background: project.faceColor, border: "1px solid var(--bone)", transform: "rotate(-30deg) skewX(30deg) scaleY(0.864)" }} />
                  <button
                    type="button"
                    className="tray-d absolute inset-0 text-left"
                    style={{ transform: "rotate(-30deg) skewX(30deg) scaleY(0.864)", border: `1px solid ${isOpen ? "var(--bone)" : "var(--edge-2)"}`, background: "linear-gradient(160deg,#2a2e2c,#202422)", opacity: dim ? 0.4 : 1, transition: "opacity .3s var(--ease-settle), border-color .3s" }}
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : tray.id)}
                    data-cursor="separate"
                  >
                    <div className="flex h-full flex-col gap-2 p-3">
                      <div className="t-mono" style={{ color: "var(--bone)", fontSize: 10 }}>
                        {tray.title} <span className="text-bone-3">· {tray.sub}</span>
                      </div>
                      <div className="grid flex-1 grid-cols-4 gap-2">
                        {tray.parts.map((part) => (
                          <PartSlot key={part.label} part={part} lifted={isOpen} desktop />
                        ))}
                      </div>
                      <div className="t-dim" style={{ color: "var(--bone-3)" }}>
                        used in · {Array.from(new Set(tray.parts.map((p) => `sheet 0${projectById[p.from].index}`))).join(" · ")}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* mobile: frontal accordion */}
          <div className="md:hidden absolute left-0 right-0 top-[46%] flex flex-col gap-2">
            {trays.map((tray) => {
              const isOpen = open === tray.id || (open === null && tray.id === "commerce");
              return (
                <div key={tray.id} className="tray border" style={{ borderColor: isOpen ? "var(--bone)" : "var(--edge-2)", background: "linear-gradient(160deg,#2a2e2c,#202422)" }}>
                  <button type="button" className="t-mono flex w-full items-center justify-between px-3 py-3 text-left" style={{ color: "var(--bone)", minHeight: 44 }} aria-expanded={isOpen} onClick={() => setOpen(tray.id)}>
                    <span>{tray.title}</span>
                    <span className="text-bone-3">{tray.parts.length}</span>
                  </button>
                  {isOpen && (
                    <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
                      {tray.parts.map((part) => (
                        <PartSlot key={part.label} part={part} lifted={false} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function PartSlot({ part, lifted, desktop = false }: { part: Tray["parts"][number]; lifted: boolean; desktop?: boolean }) {
  const style = { transform: lifted ? "translateY(-10px)" : "translateY(0)", transition: "transform .6s var(--ease-settle)" };
  const cls = desktop ? "part part-d" : "part";
  if (!part.capture) {
    return (
      <div className={`${cls} flex h-14 items-center justify-center border border-dashed border-edge p-1 text-center`} style={style}>
        <span className="t-mono text-bone-3" style={{ fontSize: 7 }}>{part.label}</span>
      </div>
    );
  }
  return (
    <div className={`${cls} relative h-14 overflow-hidden border border-bone bg-paper`} style={style}>
      <Image src={part.capture.src} alt={part.capture.alt} sizes="120px" className="h-full w-full object-cover" style={{ objectPosition: part.capture.position }} />
      <span className="t-mono absolute bottom-0.5 left-0.5 bg-[rgba(31,34,32,.85)] px-1 text-bone" style={{ fontSize: 7 }}>{part.label}</span>
    </div>
  );
}
