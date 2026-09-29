"use client";

import { useRef, useState } from "react";
import { useScene } from "@/lib/useScene";
import { setSystem } from "@/lib/store";
import { projectById } from "@/data/projects";
import { Stack } from "@/components/system/Stack";
import { Capture } from "@/components/system/Capture";
import { Cota, Marker, Callout } from "@/components/system/Cota";
import { ReservedFace } from "@/components/system/ReservedFace";
import { Rail, TitleBlock } from "@/components/system/Sheet";
import { EASE } from "@/lib/motion";

const ts = projectById.travelsuite360;
const pr = projectById.prospector;
const sn = projectById["santi-nuca"];
const ca = projectById["chef-arturo"];

/** Real order of the RAYO SMASH hero layers, top to bottom (from the capture). */
const burgerParts = [
  { label: "01 · pan superior", color: "#c9a46a", h: 1 },
  { label: "02 · bacon", color: "#8a3b2a", h: 0.5 },
  { label: "03 · medallón + cheddar", color: "#e9b23a", h: 0.7 },
  { label: "04 · cebolla", color: "#b07a3c", h: 0.5 },
  { label: "05 · medallón + cheddar", color: "#6b4a2b", h: 0.7 },
  { label: "06 · pan inferior", color: "#c9a46a", h: 0.8 },
];

const modules = ["TravelChat · inbox", "CRM", "Cotizaciones", "Viajes · reservas"];

/**
 * 03 · Selected Work. One pinned scene, four sheets, three part-reuse transitions.
 * Construction explains (iso) · product proves (frontal). Ensamble presents the work,
 * it never uniforms it: each sheet keeps its product's own material.
 */
export function Work() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, {
    id: "work",
    pinVh: 16,
    states: 24,
    onProgress: (p) => {
      if (p < 0.2) setSystem({ step: 4, status: "Sheet 01 / 04", section: "03 — Selected work · TravelSuite360", note: "product system · the rack", frame: 1, grid: 0.4, tone: "graphite" });
      else if (p < 0.28) setSystem({ status: "Sheet 01 → 02", section: "03 — Selected work", note: "the stack changes material", frame: 1, grid: 1, tone: "graphite" });
      else if (p < 0.5) setSystem({ status: "Sheet 02 / 04", section: "03 — Selected work · Prospector", note: "the demo's own scroll", frame: 0.35, grid: 0, tone: "graphite" });
      else if (p < 0.56) setSystem({ status: "Sheet 02 → 03", section: "03 — Selected work", note: "the system withdraws", frame: 0, grid: 0, tone: "paper" });
      else if (p < 0.72) setSystem({ status: "Sheet 03 / 04", section: "03 — Selected work · Santi Nuca", note: "no frame · no grid · no cotas", frame: 0, grid: 0, tone: "paper" });
      else if (p < 0.78) setSystem({ status: "Sheet 03 → 04", section: "03 — Selected work", note: "the photograph carries over", frame: 0, grid: 0, tone: "paper" });
      else if (p < 0.86) setSystem({ status: "Sheet 04 / 04", section: "03 — Selected work · Chef Arturo", note: "the image crosses the frame", frame: 0.25, grid: 0, tone: "paper" });
      else if (p < 0.95) setSystem({ status: "Sheet 04 / 04", section: "03 — Selected work · Chef Arturo", note: "inspect the transaction layer", frame: 1, grid: 0.4, tone: "graphite" });
      else setSystem({ status: "Assembled", section: "03 — Selected work · exit", note: "four builds on the plate", frame: 1, grid: 1, tone: "graphite" });
    },
    build: ({ q, gsap }) => {
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      const sheet = (n: number) => q(`.sheet-${n}`)[0];
      const S = (el: HTMLElement | HTMLElement[], on: boolean, pos: string | number) => tl.set(el, { autoAlpha: on ? 1 : 0 }, pos);

      /* ================= SHEET 01 · TravelSuite360 · elevation + rack ================= */
      tl.addLabel("s1", 0);
      const s1 = sheet(1);
      const s1Stack = q(".s1-stack .stack")[0];
      const s1Bench = q(".s1-bench")[0];
      const rack = q(".rack-module");
      const s1Rail = q(".s1-rail")[0];
      const s1Title = q(".s1-title")[0];
      tl.fromTo([s1Rail, s1Title], { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, "s1");
      // the rack fans out: one module per step, the previous one docks back
      rack.forEach((m, i) => {
        tl.fromTo(m, { xPercent: 0, rotateY: -32, opacity: 0.55 }, { xPercent: 12 + i * 6, rotateY: -22, opacity: 0.9, duration: 0.4, ease: EASE.settle }, `s1+=${0.5 + i * 0.5}`);
      });
      tl.to({}, { duration: 0.4 });
      // exit: rack folds → slab rotates back to iso (counter-clockwise) → layers leave as outlines
      tl.addLabel("t12");
      tl.to(rack, { xPercent: 0, rotateY: -32, opacity: 0.3, duration: 0.4, ease: EASE.settle }, "t12");
      tl.to(s1Bench, { scale: 0.9, x: 0, duration: 1, ease: EASE.product }, "t12+=0.2");
      tl.fromTo(s1Stack, { "--rot": 1 }, { "--rot": 0, duration: 1, ease: EASE.product, immediateRender: true }, "t12+=0.2");
      tl.fromTo(s1Stack, { "--explode": "0px" }, { "--explode": "70px", duration: 0.4, ease: EASE.snap(4), immediateRender: true }, "t12+=1.2");
      tl.to([s1Rail, s1Title], { opacity: 0, duration: 0.2 }, "t12+=0.6");
      tl.to(q(".s1-stack .layer"), { x: -420, opacity: 0, duration: 0.6, stagger: 0.08, ease: EASE.linear }, "t12+=1.7");
      tl.fromTo(s1Stack, { "--fill-0": 1, "--fill-1": 1, "--fill-2": 1, "--fill-3": 1 }, { "--fill-0": 0, "--fill-1": 0, "--fill-2": 0, "--fill-3": 0, duration: 0.3, immediateRender: true }, "t12+=1.7");
      S(sheet(2), true, "t12+=1.9");
      const disc = q(".burger-disc");
      tl.fromTo(disc[5], { x: 420, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: EASE.settle }, "t12+=2.0");
      S(s1, false, "t12+=2.5");

      /* ================= SHEET 02 · Prospector · burger drawn → real demo ================= */
      tl.addLabel("s2", "t12+=2.5");
      const s2Rail = q(".s2-rail")[0];
      const burger = q(".burger")[0];
      const demo = q(".demo")[0];
      const demoStates = q(".demo-state");
      tl.fromTo(s2Rail, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, "s2");
      // parts arrive top-down as outlines, then fill bottom-up with their material
      disc.slice(0, 5).reverse().forEach((d, i) => {
        tl.fromTo(d, { x: 420, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: EASE.settle }, `s2+=${0.2 + i * 0.2}`);
      });
      [...disc].reverse().forEach((d, i) => {
        tl.fromTo(d, { "--dfill": 0 }, { "--dfill": 1, duration: 0.35, ease: EASE.linear, immediateRender: true }, `s2+=${1.4 + i * 0.3}`);
      });
      // assemble: explode 70 → 0 in ticks, then rotate to frontal and become the real hero
      tl.fromTo(burger, { "--bexplode": "70px" }, { "--bexplode": "0px", duration: 0.5, ease: EASE.snap(4), immediateRender: true }, "s2+=3.4");
      tl.to({}, { duration: 0.3 });
      tl.to(burger, { rotateX: 0, scale: 1.4, duration: 1.0, ease: EASE.product }, "s2+=4.2");
      tl.to(s2Rail, { opacity: 0, duration: 0.2 }, "s2+=4.4");
      S(demo, true, "s2+=5.1");
      tl.fromTo(demo, { scale: 0.4, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.6, ease: EASE.product }, "s2+=5.1");
      tl.to(burger, { opacity: 0, duration: 0.01 }, "s2+=5.15");
      // the demo's own scroll: real states swap by mask (wipe), never by fade
      demoStates.slice(1).forEach((st, i) => {
        tl.fromTo(st, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.6, ease: EASE.product }, `s2+=${6.2 + i * 0.9}`);
      });
      tl.to({}, { duration: 0.6 });
      // exit: withdrawal. grid & frame go to 0 (store), the demo shrinks to the axis, paper wipes in
      tl.addLabel("t23");
      tl.to(demo, { scale: 0.32, y: 0, duration: 0.8, ease: EASE.product }, "t23");
      tl.to(demo, { opacity: 0, duration: 0.01 }, "t23+=0.8");
      const wipe = q(".paper-wipe")[0];
      S(sheet(3), true, "t23+=0.3");
      tl.fromTo(wipe, { scaleX: 0 }, { scaleX: 1, transformOrigin: "right", duration: 0.8, ease: EASE.product, immediateRender: true }, "t23+=0.3");
      const rule = q(".sn-rule")[0];
      tl.fromTo(rule, { scaleY: 0, background: "#f04e23" }, { scaleY: 1, background: "#14120f", transformOrigin: "top", duration: 0.6, immediateRender: true }, "t23+=0.6");
      const numeral = q(".sn-numeral")[0];
      tl.fromTo(numeral, { scale: 0.2, opacity: 0, transformOrigin: "left bottom" }, { scale: 1, opacity: 1, duration: 0.6, ease: EASE.settle }, "t23+=1.0");
      S(sheet(2), false, "t23+=1.2");

      /* ================= SHEET 03 · Santi Nuca · the page ================= */
      tl.addLabel("s3", "t23+=1.6");
      const spreads = q(".sn-spread");
      tl.fromTo(spreads[0], { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: EASE.product, immediateRender: true }, "s3");
      tl.to([rule, numeral, wipe], { opacity: 0, duration: 0.01 }, "s3+=0.7");
      S(q(".sn-index")[0], true, "s3+=2.2");
      spreads.slice(1).forEach((sp, i) => {
        tl.fromTo(sp, { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: EASE.product, immediateRender: true }, `s3+=${1.2 + i * 1.0}`);
      });
      tl.to({}, { duration: 0.6 });
      // exit: the last photograph shrinks into an arch, colour returns, paper → cream
      tl.addLabel("t34");
      const carry = q(".carry")[0];
      const cream = q(".cream")[0];
      S(carry, true, "t34");
      tl.fromTo(carry, { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", filter: "grayscale(1)" }, { clipPath: "inset(53% 10% 18% 79% round 90px 90px 0px 0px)", filter: "grayscale(0)", duration: 1.0, ease: EASE.product, immediateRender: true }, "t34");
      tl.fromTo(cream, { opacity: 0 }, { opacity: 1, duration: 0.6 }, "t34+=0.3");
      S(sheet(4), true, "t34+=1.0");
      tl.to(carry, { opacity: 0, duration: 0.01 }, "t34+=1.05");
      S(sheet(3), false, "t34+=1.1");

      /* ================= SHEET 04 · Chef Arturo · hero → expansion → modes → PDP → transaction ================= */
      tl.addLabel("s4", "t34+=1.1");
      const arch = q(".ca-arch")[0];
      const caStates = q(".ca-state");
      const pdp = q(".ca-pdp")[0];
      const caRail = q(".s4-rail")[0];
      tl.to({}, { duration: 0.5 }); // read the hero
      // expansion: the arch grows past the frame
      S(arch, true, "s4+=0.5");
      tl.fromTo(arch, { clipPath: "inset(53% 10% 18% 79% round 90px 90px 0px 0px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", duration: 1.4, ease: EASE.product, immediateRender: true }, "s4+=0.5");
      tl.to({}, { duration: 0.4 });
      // structure returns: fechas que importan, then the PDP
      caStates.forEach((st, i) => {
        tl.fromTo(st, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.7, ease: EASE.product }, `s4+=${2.6 + i * 1.1}`);
      });
      tl.fromTo(caRail, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, "s4+=3.7");
      tl.fromTo(pdp, { scale: 1, opacity: 1 }, { scale: 1, duration: 0.8 }, "s4+=4.8"); // inspect hold
      // exit: the PDP turns to iso and shows its layers, then four slabs line up on the plate
      tl.addLabel("exit");
      const caStack = q(".ca-stack")[0];
      const caStackInner = q(".ca-stack .stack")[0];
      tl.to([caStates, arch, q(".ca-hero")[0], caRail], { opacity: 0, duration: 0.01 }, "exit");
      S(caStack, true, "exit");
      tl.fromTo(caStackInner, { "--rot": 1, "--explode": "0px" }, { "--rot": 0, "--explode": "90px", duration: 1.0, ease: EASE.product, immediateRender: true }, "exit");
      tl.to({}, { duration: 0.4 });
      const lineup = q(".lineup-slab");
      tl.to(caStack, { scale: 0.45, x: 260, y: 120, duration: 0.8, ease: EASE.product }, "exit+=1.4");
      tl.to(caStackInner, { "--explode": "0px", duration: 0.4, ease: EASE.snap(4) }, "exit+=1.4");
      tl.fromTo(lineup, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.12, ease: EASE.settle }, "exit+=1.8");
      tl.to(caStack, { opacity: 0, duration: 0.01 }, "exit+=2.3");
      tl.to({}, { duration: 0.5 });
      return tl;
    },
  });

  return (
    <div className="scene-slot">
      <section ref={ref} aria-label="Selected work" className="vh relative w-full overflow-hidden">
        <div className="area absolute" style={{ inset: "var(--frame-inset)", top: "calc(var(--frame-inset) + 16px)" }}>
          {/* ---------- SHEET 01 · TravelSuite360 ---------- */}
          <div className="sheet-1 absolute inset-0">
            <div className="s1-rail absolute left-[2%] top-[2%] w-[96%] md:w-[22%]">
              <Rail project={ts} />
              <div className="t-dim mt-4" style={{ color: "var(--bone-3)" }}>captures reserved · the rack holds real modules only</div>
            </div>
            <div className="s1-bench absolute left-[0%] top-[46%] h-[50%] w-[100%] md:left-[18%] md:top-[6%] md:h-[80%] md:w-[60%]" data-cursor="separate">
              <div className="s1-stack absolute left-1/2 top-1/2" style={{ transform: "translate(-50%,-50%) scale(var(--bench-scale, 1.25))" }}>
                <Stack layers={ts.layers} faces={{ interface: <ReservedFace project={ts} screen="dashboard" /> }} width={420} height={260} rot={1} explode={0} fills={[1, 1, 1, 1]} axis />
              </div>
              {/* the rack: modules docked behind the dashboard, fanned by scroll */}
              <div className="absolute left-[82%] top-[14%] hidden h-[70%] w-[30%] md:block" style={{ perspective: 1600 }}>
                {modules.map((m, i) => (
                  <div key={m} className="rack-module absolute left-0 top-0 h-full w-full origin-left" style={{ transform: `rotateY(-32deg)`, zIndex: 10 - i, marginLeft: i * 10, marginTop: i * 8 }}>
                    <div className="h-full w-full border border-bone" style={{ background: "var(--paper)" }}>
                      <div className="t-mono border-b border-[#e4e7ea] px-3 py-2" style={{ color: "var(--ink)", fontSize: 10 }}>{m}</div>
                      <div className="relative h-[80%] p-3">
                        <div className="absolute inset-3 border border-dashed border-[#c9ccd1]" />
                        <div className="t-mono absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ fontSize: 9, color: "#8a94a0" }}>capture reserved</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="s1-title absolute bottom-0 right-0 hidden md:block">
              <TitleBlock project={ts} type="type A · elevation" />
            </div>
          </div>

          {/* ---------- SHEET 02 · Prospector ---------- */}
          <div className="sheet-2 absolute inset-0" style={{ visibility: "hidden", opacity: 0 }}>
            <div className="s2-rail absolute left-[2%] top-[2%] w-[96%] md:w-[26%]">
              <Rail project={pr} />
            </div>
            {/* the burger as a technical drawing: six real parts on the axis */}
            <div className="burger absolute left-[50%] top-[64%] preserve-3d scale-[0.7] md:left-[52%] md:top-[50%] md:scale-100" style={{ width: 360, height: 360, marginLeft: -180, marginTop: -180, transform: "rotateX(60deg)", ["--bexplode" as string]: "70px" }} data-cursor="separate">
              {burgerParts.map((p, i) => {
                const b = burgerParts.length - 1 - i; // z index from bottom
                return (
                  <div
                    key={p.label}
                    className="burger-disc absolute left-1/2 top-1/2 rounded-full"
                    style={{
                      width: 300,
                      height: 300,
                      marginLeft: -150,
                      marginTop: -150,
                      transform: `translateZ(calc(var(--bexplode) * ${b}))`,
                      border: `1px solid ${i === 1 || i === 3 ? "var(--bone-3)" : "var(--bone)"}`,
                      ["--dfill" as string]: 0,
                      background: `radial-gradient(circle, ${p.color} 0 calc(var(--dfill) * 100%), transparent calc(var(--dfill) * 100%))`,
                    }}
                  >
                    <span className="t-dim absolute left-[102%] top-1/2 -translate-y-1/2" style={{ transform: "rotateX(-60deg)" }}>{p.label}</span>
                  </div>
                );
              })}
            </div>
            {/* the real demo, full bleed inside the frame */}
            <div className="demo absolute inset-0 overflow-hidden bg-[#0b0b0b]" style={{ visibility: "hidden", opacity: 0 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="demo-state absolute inset-0">
                  <Capture capture={pr.captures[i]} sizes="100vw" position="center top" mobilePosition="center center" />
                </div>
              ))}
              <div className="absolute bottom-4 left-4">
                <Cota length={220} label="explode · burger · 6 parts · 0–90" sub="handoff: Ensamble's axis → the demo's own scroll" />
              </div>
              <div className="t-mono absolute bottom-4 right-4 text-bone-3" style={{ textShadow: "0 1px 2px #000" }}>RAYO SMASH · demo · hero → menú → producto</div>
            </div>
          </div>

          {/* ---------- SHEET 03 · Santi Nuca ---------- */}
          <div className="sheet-3 absolute inset-0" style={{ visibility: "hidden", opacity: 0 }}>
            <div className="paper-wipe absolute inset-0 bg-[#f4f3f0]" />
            <div className="sn-rule absolute left-[40%] top-0 h-full w-px" style={{ background: "#14120f" }} />
            <div className="sn-numeral absolute bottom-[4%] left-[2%] opacity-0" style={{ fontSize: "clamp(120px, 26vw, 380px)", fontWeight: 300, lineHeight: 0.8, letterSpacing: "-0.06em", color: "#14120f", fontFamily: "var(--font-plex-sans)" }}>03</div>
            <div className="absolute inset-0 overflow-hidden">
              {[[sn.captures[0], "58% top"], [sn.captures[4], "center top"], [sn.captures[2], "22% top"], [sn.captures[7], "84% top"]].map(([c, mp], i) => (
                <div key={i} className="sn-spread absolute inset-0 bg-[#f4f3f0]">
                  <Capture capture={c as typeof sn.captures[0]} sizes="100vw" position="center top" mobilePosition={mp as string} />
                </div>
              ))}
              {/* the index: the real spreads as a strip, tap/hover to jump */}
              <div className="sn-index absolute bottom-3 left-4 right-4 hidden gap-2 md:flex" aria-label="Works 01–06" style={{ visibility: "hidden", opacity: 0 }}>
                {sn.captures.slice(1, 4).concat(sn.captures.slice(5)).map((c, i) => (
                  <div key={i} className="h-14 flex-1 overflow-hidden border border-[#d8d5ce] bg-[#f4f3f0]">
                    <Capture capture={c} sizes="200px" position="center top" />
                  </div>
                ))}
              </div>
            </div>
            {/* the photograph that carries over into Chef Arturo */}
            <div className="carry absolute inset-0" style={{ visibility: "hidden", opacity: 0 }}>
              <Capture capture={ca.captures[2]} sizes="100vw" position="60% center" />
            </div>
            <div className="cream absolute inset-0 -z-10 bg-[#f3eee4] opacity-0" />
          </div>

          {/* ---------- SHEET 04 · Chef Arturo ---------- */}
          <div className="sheet-4 absolute inset-0" style={{ visibility: "hidden", opacity: 0 }}>
            <div className="ca-hero absolute inset-0 bg-[#f3eee4]">
              <Capture capture={ca.captures[0]} sizes="100vw" position="center top" mobilePosition="84% top" />
            </div>
            {/* the arch: the full-bleed photograph masked, allowed past the frame */}
            <div className="ca-arch absolute" style={{ inset: "calc(var(--frame-inset) * -1)", visibility: "hidden", opacity: 0 }}>
              <Capture capture={ca.captures[2]} sizes="100vw" position="60% center" />
            </div>
            <div className="ca-state absolute inset-0 bg-[#f3eee4]" style={{ clipPath: "inset(100% 0 0 0)" }}>
              <Capture capture={ca.captures[5]} sizes="100vw" position="center 40%" mobilePosition="center 40%" />
              <div className="absolute bottom-6 left-6"><Cota length="min(60vw, 900px)" label="3 rutas comerciales" sub="una arquitectura de compra detrás de la estética" /></div>
            </div>
            <div className="ca-state ca-pdp absolute inset-0 bg-[#1f2220]" style={{ clipPath: "inset(100% 0 0 0)" }}>
              <div className="absolute left-[2%] top-[14%] h-[70%] w-[96%] overflow-hidden border border-bone bg-[#f3eee4] md:left-[26%] md:top-[4%] md:h-[86%] md:w-[60%]">
                <Capture capture={ca.captures[8]} sizes="(max-width: 1023px) 100vw, 60vw" position="center top" mobilePosition="center top" />
                <PdpMarkers />
              </div>
              <div className="s4-rail absolute left-[2%] top-[2%] w-[96%] md:top-[4%] md:w-[20%]">
                <Rail project={ca} compact />
              </div>
              <div className="absolute bottom-0 right-0 hidden md:block"><TitleBlock project={ca} type="type B + C" /></div>
              <div className="t-dim absolute bottom-3 left-[26%]" style={{ color: "var(--bone-3)" }}>carrito · captura reservada · la compra termina en Mercado Pago o WhatsApp</div>
            </div>
            {/* exit: the PDP as an iso object with its real layers, then the four builds line up */}
            <div className="ca-stack absolute left-[30%] top-[10%]" style={{ visibility: "hidden", opacity: 0 }}>
              <Stack layers={ca.layers} faces={{ interface: <div className="h-full w-full"><Capture capture={ca.captures[8]} sizes="420px" position="center top" /></div> }} width={420} height={260} rot={1} explode={0} />
            </div>
            <div className="absolute bottom-[10%] left-[6%] grid grid-cols-2 gap-x-10 gap-y-8 md:flex md:items-end">
              {[ts, pr, sn, ca].map((p) => (
                <div key={p.id} className="lineup-slab opacity-0" style={{ width: 120, height: 78, background: p.faceColor, border: "1px solid var(--bone)", transform: "rotate(-30deg) skewX(30deg) scaleY(0.864)", boxShadow: "6px 6px 0 #141716" }}>
                  <div className="t-mono p-2" style={{ fontSize: 8, color: p.id === "prospector" ? "var(--bone)" : "var(--ink)" }}>0{p.index} · {p.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** T2 · three tappable markers on the transactional column of the real PDP. Max three, one open. */
function PdpMarkers() {
  const [open, setOpen] = useState<number | null>(null);
  const items = [
    { x: 78, y: 62, title: "Stock del día", detail: "catálogo · inventario · capa 04" },
    { x: 78, y: 71, title: "Agregar al carrito", detail: "carrito → Mercado Pago · capa 03" },
    { x: 78, y: 79, title: "Consultar por WhatsApp", detail: "segunda ruta · misma PDP" },
  ];
  return (
    <>
      {items.map((it, i) => (
        <div key={it.title}>
          <Marker label={`${it.title}: ${it.detail}`} active={open === i} onClick={() => setOpen(open === i ? null : i)} style={{ left: `${it.x}%`, top: `${it.y}%` }} />
          {open === i && <Callout title={it.title} detail={it.detail} width={80} style={{ left: `${it.x + 1.5}%`, top: `${it.y}%` }} />}
        </div>
      ))}
    </>
  );
}
