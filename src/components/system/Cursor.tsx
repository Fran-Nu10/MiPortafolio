"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, isCoarsePointer, prefersReducedMotion } from "@/lib/motion";

type Mode = "default" | "inspect" | "measure" | "separate" | "magnet";

/**
 * The cursor as an instrument. One element, five behaviours, driven by the nearest
 * [data-cursor] ancestor under the pointer. Fine pointers only; touch never sees it.
 * Never more than one readout.
 */
export function Cursor() {
  // rendered client-only (dynamic, ssr: false), so the pointer type is known at first render
  const [enabled] = useState(() => typeof window !== "undefined" && !isCoarsePointer());
  const rootRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<Mode>("default");

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.setAttribute("data-cursor-instrument", "on");
    return () => document.documentElement.removeAttribute("data-cursor-instrument");
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const el = rootRef.current;
    const readout = readoutRef.current;
    if (!el || !readout) return;
    const rm = prefersReducedMotion();
    const lag = rm ? 0 : 0.06;
    const xTo = gsap.quickTo(el, "x", { duration: lag, ease: "none" });
    const yTo = gsap.quickTo(el, "y", { duration: lag, ease: "none" });
    let magnetTarget: HTMLElement | null = null;

    const setMode = (m: Mode, target: HTMLElement | null) => {
      if (modeRef.current === m && (m !== "magnet" || target === magnetTarget)) return;
      modeRef.current = m;
      el.dataset.mode = m;
      magnetTarget = m === "magnet" ? target : null;
      if (m === "magnet" && target) {
        const r = target.getBoundingClientRect();
        el.style.setProperty("--bw", `${r.width + 12}px`);
        el.style.setProperty("--bh", `${r.height + 12}px`);
      }
      if (m === "measure" && target) {
        const r = target.getBoundingClientRect();
        readout.textContent = target.dataset.measure ?? `${Math.round(r.width)} × ${Math.round(r.height)}`;
      } else if (m === "separate") {
        readout.textContent = "separar";
      } else if (m !== "inspect") {
        readout.textContent = "";
      }
    };

    const onMove = (e: PointerEvent) => {
      if (magnetTarget) {
        const r = magnetTarget.getBoundingClientRect();
        xTo(r.left + r.width / 2);
        yTo(r.top + r.height / 2);
      } else {
        xTo(e.clientX);
        yTo(e.clientY);
      }
      if (modeRef.current === "inspect") {
        readout.textContent = `x ${Math.round(e.clientX)} · y ${Math.round(e.clientY)}`;
      }
    };
    const onOver = (e: PointerEvent) => {
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor]");
      if (!t) return setMode("default", null);
      const m = (t.dataset.cursor as Mode) || "default";
      setMode(m, t);
    };
    const onLeave = () => {
      el.style.opacity = "0";
    };
    const onEnter = () => {
      el.style.opacity = "1";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("pointerenter", onEnter);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("pointerenter", onEnter);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={rootRef} aria-hidden="true" className="cursor pointer-events-none fixed left-0 top-0 z-50" data-mode="default" style={{ willChange: "transform" }}>
      <style>{`
        .cursor{color:var(--orange);--bw:24px;--bh:24px}
        .cursor .ret{position:absolute;left:-12px;top:-12px;width:24px;height:24px;transition:opacity .12s}
        .cursor .ret:before{content:"";position:absolute;left:11px;top:0;width:1px;height:24px;background:currentColor}
        .cursor .ret:after{content:"";position:absolute;top:11px;left:0;height:1px;width:24px;background:currentColor}
        .cursor .eye{position:absolute;left:-4px;top:-4px;width:8px;height:8px;border:1px solid currentColor;box-sizing:border-box;transition:transform .12s,opacity .12s}
        .cursor[data-mode="inspect"] .eye{transform:scale(1.6);background:currentColor}
        .cursor .cal{position:absolute;left:-30px;top:0;width:60px;height:1px;background:currentColor;opacity:0;transition:opacity .12s}
        .cursor .cal:before,.cursor .cal:after{content:"";position:absolute;top:-6px;width:1px;height:13px;background:currentColor}
        .cursor .cal:before{left:0}.cursor .cal:after{right:0}
        .cursor[data-mode="measure"] .cal{opacity:1}
        .cursor[data-mode="measure"] .ret,.cursor[data-mode="measure"] .eye{opacity:0}
        .cursor .sep{position:absolute;left:-1px;top:-24px;width:1px;height:48px;background:currentColor;opacity:0;transition:opacity .12s}
        .cursor .sep:before,.cursor .sep:after{content:"";position:absolute;left:-4px;width:9px;height:9px;border:1px solid currentColor;border-right:0;border-bottom:0;transform:rotate(45deg)}
        .cursor .sep:before{top:0}.cursor .sep:after{bottom:0;transform:rotate(225deg)}
        .cursor[data-mode="separate"] .sep{opacity:1}
        .cursor[data-mode="separate"] .ret,.cursor[data-mode="separate"] .eye{opacity:0}
        .cursor .br{position:absolute;left:calc(var(--bw) / -2);top:calc(var(--bh) / -2);width:var(--bw);height:var(--bh);opacity:0;transition:opacity .12s,width .12s,height .12s}
        .cursor .br i{position:absolute;width:10px;height:10px;border-color:currentColor;border-style:solid;border-width:0}
        .cursor .br i:nth-child(1){left:0;top:0;border-left-width:1px;border-top-width:1px}
        .cursor .br i:nth-child(2){right:0;top:0;border-right-width:1px;border-top-width:1px}
        .cursor .br i:nth-child(3){left:0;bottom:0;border-left-width:1px;border-bottom-width:1px}
        .cursor .br i:nth-child(4){right:0;bottom:0;border-right-width:1px;border-bottom-width:1px}
        .cursor[data-mode="magnet"] .br{opacity:1}
        .cursor[data-mode="magnet"] .ret,.cursor[data-mode="magnet"] .eye{opacity:0}
        .cursor .ro{position:absolute;left:18px;top:14px;font-family:var(--font-plex-mono),monospace;font-size:10px;letter-spacing:.04em;color:var(--bone);white-space:nowrap;text-transform:uppercase}
      `}</style>
      <div className="ret" />
      <div className="eye" />
      <div className="cal" />
      <div className="sep" />
      <div className="br"><i /><i /><i /><i /></div>
      <div ref={readoutRef} className="ro" />
    </div>
  );
}
