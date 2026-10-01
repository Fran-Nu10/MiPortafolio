"use client";

import { useRef, useState } from "react";
import { useSceneEnter } from "@/lib/useScene";
import { setSystem } from "@/lib/store";
import { experiments, labKindLabel, labStateLabel, type Experiment } from "@/data/system";

/**
 * 07 · Lab — loose parts on the bench. Built from data; reserved slots stay reserved.
 * Free scroll (not pinned). Desktop: hand-placed slots, mixed cameras. Mobile: one column.
 */
export function Lab() {
  const ref = useRef<HTMLElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  useSceneEnter(ref, () => setSystem({ step: 5, status: "Piezas sueltas", section: "07 — Lab", note: `${experiments.filter((e) => e.state === "running").length} en curso · ${experiments.filter((e) => e.state === "reserved").length} reservados`, frame: 1, grid: 1, tone: "graphite" }));

  const running = experiments.filter((e) => e.state !== "reserved");
  const reserved = experiments.filter((e) => e.state === "reserved");

  return (
    <div className="scene-slot">
      <section ref={ref} aria-label="Lab" className="relative w-full" style={{ minHeight: "100svh" }}>
        <div className="relative mx-auto" style={{ padding: "calc(var(--frame-inset) + 32px) var(--frame-inset) var(--frame-inset)" }}>
          <div className="flex max-w-[520px] flex-col gap-3">
            <div className="t-dim">07 · Lab</div>
            <h2 className="t-display m-0" style={{ fontSize: "clamp(36px, 5vw, 72px)" }}>Piezas sin<br />proyecto</h2>
            <p className="m-0 text-[15px] leading-[1.5] text-bone-2" style={{ textWrap: "pretty" }}>
              Motion, interacción, 3D, conceptos: pruebas que todavía no pertenecen a un proyecto. Quedan donde se dejaron; cada espacio vacío espera un experimento real.
            </p>
          </div>

          {/* desktop bench */}
          <div className="relative mt-10 hidden md:block" style={{ height: "62vh", minHeight: 520 }}>
            {experiments.map((e) => (
              <Slot key={e.id} e={e} open={openId === e.id} onToggle={() => setOpenId(openId === e.id ? null : e.id)} />
            ))}
          </div>

          {/* mobile: one column, all frontal */}
          <div className="mt-8 flex flex-col gap-3 md:hidden">
            {[...running, ...reserved.slice(0, 3)].map((e) => (
              <div key={e.id} className="relative" style={{ height: e.state === "reserved" ? 96 : 180 }}>
                <Slot e={{ ...e, camera: "frontal", slot: { x: 0, y: 0, w: 100, h: 100 } }} open={openId === e.id} onToggle={() => setOpenId(openId === e.id ? null : e.id)} />
              </div>
            ))}
            <div className="t-dim mt-2" style={{ color: "var(--bone-3)" }}>+ {reserved.length - 3} espacios reservados en la versión de escritorio</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Slot({ e, open, onToggle }: { e: Experiment; open: boolean; onToggle: () => void }) {
  const reserved = e.state === "reserved";
  const iso = e.camera === "iso";
  const style: React.CSSProperties = {
    left: `${e.slot.x}%`,
    top: `${e.slot.y}%`,
    width: `${e.slot.w}%`,
    height: `${e.slot.h}%`,
    borderRadius: e.slot.round ? "50%" : 0,
    border: `1px ${reserved ? "dashed" : "solid"} ${reserved ? "var(--edge)" : e.state === "running" ? "var(--bone)" : "var(--edge-2)"}`,
    background: reserved ? "transparent" : "rgba(251,250,246,.06)",
    transform: iso ? "skewX(-14deg)" : undefined,
  };
  const label = `${labKindLabel[e.kind]} · ${labStateLabel[e.state]}`;
  if (reserved) {
    return (
      <div className="absolute box-border flex items-end p-2.5" style={style} aria-label={label}>
        <span className="t-mono text-bone-3" style={{ fontSize: 9, transform: iso ? "skewX(14deg)" : undefined }}>{labKindLabel[e.kind]} · {labStateLabel.reserved}</span>
      </div>
    );
  }
  return (
    <button type="button" className="absolute box-border flex items-end p-2.5 text-left" style={style} onClick={onToggle} aria-expanded={open} data-cursor="inspect">
      <span className="t-dim absolute right-2.5 top-2.5">{e.date} · {labStateLabel[e.state]}</span>
      <span className="t-mono text-bone" style={{ fontSize: 9 }}>{labKindLabel[e.kind]}</span>
      {open && e.note && <span className="absolute left-2.5 top-8 max-w-[90%] text-[12px] leading-[1.4] text-bone-2">{e.note}</span>}
    </button>
  );
}
