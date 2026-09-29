"use client";

import { useRef } from "react";
import { useScene } from "@/lib/useScene";
import { setSystem } from "@/lib/store";
import { site } from "@/data/site";
import { projectById } from "@/data/projects";
import { Stack } from "@/components/system/Stack";
import { Cota } from "@/components/system/Cota";
import { ReservedFace } from "@/components/system/ReservedFace";
import { EASE } from "@/lib/motion";

/**
 * 00 Preloader → 01 Hero → 02 Manifesto → assembly → Sheet 01 handoff.
 * One pinned scene, one timeline: the same stack, axis and plate all the way.
 */
export function Opening() {
  const ref = useRef<HTMLElement>(null);
  const ts = projectById.travelsuite360;

  useScene(ref, {
    id: "opening",
    pinVh: 5.5,
    states: 12,
    onProgress: (p) => {
      // the six-step counter follows the construction
      if (p < 0.08) setSystem({ step: 0, status: "Assembling", section: "01 — Hero", note: "scroll draws the guides" });
      else if (p < 0.18) setSystem({ step: 1, status: "Drawing", note: "lines before surfaces" });
      else if (p < 0.42) setSystem({ step: 2, status: "Assembling", note: "each part = 25 % of the surname" });
      else if (p < 0.55) setSystem({ step: 3, status: "Assembling", section: "01 — Hero → Manifesto", note: "the name lies down" });
      else if (p < 0.78) setSystem({ step: 4, status: "Assembled", section: "02 — Manifesto", note: "three cotas measure one object" });
      else setSystem({ step: 4, status: "Assembled", section: "03 — Selected work · 01 / 04", note: "construction explains · product proves" });
    },
    build: ({ q, gsap, rm }) => {
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      const stack = q(".stack")[0];
      const guides = q(".guide");
      const nameFill = q(".name-fill")[0];
      const nameCota = q(".name-cota")[0];
      const nameBlock = q(".name-block")[0];
      const tagline = q(".tagline")[0];
      const bench = q(".bench")[0];
      const partLabel = q(".part-label")[0];
      const explodeCota = q(".explode-cota")[0];
      const words = q(".m-word");
      const clauses = q(".m-clause");
      const mCotas = q(".m-cota");
      const plate = q(".plate")[0];
      const handoff = q(".handoff")[0];
      // phones: the bench sits under the name; it never leaves the screen
      const phone = window.matchMedia("(max-width: 1023px)").matches;

      // --- 0 → 0.15 · ENTER: guides draw, part rotates frontal → iso, outlines of 02–04 appear
      tl.addLabel("draw", 0);
      tl.to(guides, { scaleX: 1, duration: 0.6, stagger: 0.1, ease: EASE.linear }, "draw");
      tl.fromTo(stack, { "--rot": 1, "--explode": "0px" }, { "--rot": 0, "--explode": "110px", duration: 1, ease: EASE.product, immediateRender: true }, "draw+=0.2");
      tl.to(partLabel, { opacity: 0, duration: 0.2 }, "draw+=0.2");
      tl.to(explodeCota, { opacity: 1, duration: 0.2 }, "draw+=0.9");

      // --- 0.15 → 0.42 · BUILD: parts fill bottom-up, the surname fills 25 % per part
      tl.addLabel("build", "draw+=1.3");
      const order = [3, 2, 1];
      order.forEach((i, n) => {
        tl.to(stack, { [`--fill-${i}`]: 1, duration: 0.7, ease: rm ? EASE.linear : EASE.product }, `build+=${n * 0.75}`);
        tl.to(nameFill, { clipPath: `inset(0 ${100 - (n + 1) * 25}% 0 0)`, duration: 0.7, ease: EASE.linear }, `build+=${n * 0.75}`);
        tl.set(nameCota, { attr: { "data-text": `Núñez · ${(n + 1) * 25} % · part 0${4 - i} landed` } }, `build+=${n * 0.75 + 0.7}`);
      });
      tl.to(nameFill, { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: EASE.linear }, "build+=2.25");
      tl.set(nameCota, { attr: { "data-text": "Núñez · 100 % · built" } }, "build+=2.95");

      // --- 0.42 → 0.55 · TRANSITION: the name lies down and becomes the base plate; camera pulls back
      tl.addLabel("plate", "build+=3.2");
      tl.to(nameBlock, { rotateX: 88, y: 260, scale: 0.7, opacity: 0.25, transformOrigin: "50% 100%", duration: 1.2, ease: EASE.product }, "plate");
      tl.to(tagline, { opacity: 0, y: 20, duration: 0.4 }, "plate");
      tl.to(guides, { opacity: 0, duration: 0.3 }, "plate");
      tl.to(explodeCota, { opacity: 0, duration: 0.2 }, "plate");
      tl.to(nameCota, { opacity: 0, duration: 0.2 }, "plate");
      tl.to(bench, phone ? { xPercent: -14, y: 60, scale: 0.9, duration: 1.2, ease: EASE.product } : { xPercent: -78, scale: 0.8, duration: 1.2, ease: EASE.product }, "plate");
      tl.to(plate, { opacity: 1, duration: 0.6 }, "plate+=0.6");
      tl.to(nameBlock, { opacity: 0, duration: 0.2 }, "plate+=1.1");

      // --- 0.55 → 0.78 · MANIFESTO: the three words are the three cotas of the object
      tl.addLabel("manifesto", "plate+=1.3");
      mCotas.forEach((c, i) => {
        tl.fromTo(c, { scaleY: 0 }, { scaleY: 1, transformOrigin: "top", duration: 0.4, ease: EASE.linear }, `manifesto+=${i * 0.5}`);
      });
      words.forEach((w, i) => {
        tl.fromTo(w, { opacity: 0, "--wfill": 0 }, { opacity: 1, duration: 0.01 }, `manifesto+=${i * 0.5}`);
        tl.to(w, { "--wfill": 1, duration: 0.5, ease: EASE.linear }, `manifesto+=${i * 0.5 + 0.2}`);
        tl.fromTo(clauses[i], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 }, `manifesto+=${i * 0.5 + 0.5}`);
      });
      tl.to({}, { duration: 0.8 }); // read

      // --- 0.78 → 1 · ASSEMBLY → SHEET 01: cotas retract, layers close in 4 ticks, hold, rotate, scale
      tl.addLabel("assembly");
      tl.to(mCotas, { scaleY: 0, transformOrigin: "top", duration: 0.3, ease: EASE.linear }, "assembly");
      tl.to([words, clauses], { opacity: 0, duration: 0.3 }, "assembly");
      tl.to(stack, { "--explode": "0px", duration: 0.5, ease: EASE.snap(4) }, "assembly+=0.3");
      tl.to({}, { duration: 0.3 }); // the hold: one object
      tl.to(plate, { opacity: 0, duration: 0.4 }, "assembly+=1.0");
      tl.to(bench, phone ? { xPercent: -4, scale: 1.25, y: -150, duration: 1.1, ease: EASE.product } : { xPercent: -8, scale: 1.45, y: -90, duration: 1.1, ease: EASE.product }, "assembly+=1.0");
      tl.to(stack, { "--rot": 1, duration: 1.1, ease: EASE.product }, "assembly+=1.0");
      tl.fromTo(handoff, { opacity: 0 }, { opacity: 1, duration: 0.3 }, "assembly+=2.0");
      tl.to({}, { duration: 0.4 });
      return tl;
    },
  });

  return (
    <div className="scene-slot">
    <section ref={ref} aria-label="Hero and manifesto" className="vh relative w-full overflow-hidden">
      <div className="absolute" style={{ inset: "var(--frame-inset)", top: "calc(var(--frame-inset) + 16px)" }}>
        {/* construction guides */}
        <div className="guide absolute left-0 right-0 origin-left scale-x-0" style={{ top: "12%", height: 1, background: "repeating-linear-gradient(to right,#6a716c 0 4px,transparent 4px 10px)" }} />
        <div className="guide absolute left-0 right-0 origin-left scale-x-0" style={{ top: "54%", height: 1, background: "repeating-linear-gradient(to right,#6a716c 0 4px,transparent 4px 10px)" }} />

        {/* the name */}
        <div className="name-block absolute left-0 top-[8%] will-change-transform" style={{ perspective: 1200 }}>
          <h1 className="t-display m-0" style={{ fontSize: "var(--hero-size)", lineHeight: 0.82 }}>
            <span className="block">{site.first}</span>
            <span className="relative block t-outline">
              {site.last}
              <span className="name-fill absolute left-0 top-0" style={{ color: "var(--bone)", WebkitTextStroke: 0, clipPath: "inset(0 100% 0 0)" }} aria-hidden="true">
                {site.last}
              </span>
            </span>
          </h1>
          <div className="mt-3 flex items-center gap-4">
            <Cota length="min(52vw, 720px)" tone="orange" />
          </div>
          <div className="name-cota t-dim mt-3 before:content-[attr(data-text)]" data-text="Núñez · 0 % · awaiting parts 01–04" data-cursor="measure" data-measure="cap height 240" aria-live="polite" />
        </div>

        {/* positioning */}
        <div className="tagline absolute left-0 top-[30%] flex max-w-[560px] flex-col gap-4 md:top-auto md:bottom-[6%]">
          <p className="m-0 text-[14px] leading-[1.35] md:text-[clamp(16px,1.5vw,22px)]" style={{ textWrap: "pretty" }}>{site.tagline}</p>
          <div className="t-mono hidden items-center gap-2 text-bone-3 md:flex">
            {site.steps.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span style={{ color: i === 0 ? "var(--bone)" : undefined }}>{s}</span>
                {i < site.steps.length - 1 && <span className="inline-block h-px w-6 bg-edge" />}
              </span>
            ))}
          </div>
        </div>

        {/* the bench: the signature object */}
        <div className="bench absolute right-[-10%] top-[46%] h-[54%] w-[120%] will-change-transform md:right-[2%] md:top-[4%] md:h-[92%] md:w-[46%]" data-cursor="separate">
          <div className="part-label t-mono absolute left-0 top-0 text-bone-3">Part 01 · interface · frontal</div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.62] md:scale-100">
            <Stack
              layers={ts.layers}
              faces={{ interface: <ReservedFace project={ts} screen="dashboard" /> }}
              width={Math.min(420, 420)}
              height={260}
              rot={1}
              explode={0}
              fills={[1, 0, 0, 0]}
              plate={
                <div className="t-display absolute left-6 bottom-6 t-outline" style={{ fontSize: 56, WebkitTextStroke: "1px var(--edge)", lineHeight: 0.9 }}>
                  {site.first}
                  <br />
                  {site.last}
                  <div className="t-mono mt-2 text-edge" style={{ WebkitTextStroke: 0, color: "var(--edge)", fontSize: 9 }}>base plate · engraved</div>
                </div>
              }
            />
          </div>
          <div className="explode-cota absolute left-0 top-[36%] opacity-0">
            <Cota dir="v" length={120} label="explode · 110" sub="cursor drags 60–160" />
          </div>
        </div>

        {/* manifesto: three measurements */}
        <div className="absolute right-0 top-[8%] flex w-[56%] flex-col gap-3 md:top-[10%] md:w-[44%] md:gap-5">
          {site.manifesto.map((m, i) => (
            <div key={m.word} className="relative">
              <div className="m-cota absolute -left-8 top-2 h-[80%] w-px" style={{ background: "var(--orange)", transform: "scaleY(0)" }} />
              <div
                className="m-word t-display relative opacity-0"
                style={{ fontSize: "clamp(28px, 6.2vw, 96px)", color: "transparent", WebkitTextStroke: "1px var(--bone)", ["--wfill" as string]: 0 }}
                data-cursor="measure"
                data-measure={`measures ${m.measures}`}
              >
                {m.word}
                {i < 2 && <span style={{ color: "var(--orange)", WebkitTextStroke: 0 }}> ×</span>}
                <span className="absolute left-0 top-0" style={{ color: "var(--bone)", WebkitTextStroke: 0, clipPath: "inset(0 calc((1 - var(--wfill)) * 100%) 0 0)" }} aria-hidden="true">
                  {m.word}
                  {i < 2 && <span style={{ color: "var(--orange)" }}> ×</span>}
                </span>
              </div>
              <p className="m-clause m-0 mt-2 max-w-[420px] text-[13px] leading-[1.5] text-bone-2 opacity-0">
                <span className="t-dim">§{i + 1} · measures {m.measures}</span>&nbsp; {m.clause}
              </p>
            </div>
          ))}
        </div>

        {/* handoff note into sheet 01 */}
        <div className="handoff t-mono absolute bottom-0 left-0 flex items-center gap-3 text-bone-3 opacity-0">
          <span className="text-orange">↓</span>
          <span>the object you watched being built is sheet 01 · TravelSuite360</span>
        </div>
      </div>
    </section>
    </div>
  );
}
