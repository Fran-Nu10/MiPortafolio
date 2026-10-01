"use client";

import { useRef } from "react";
import { useScene } from "@/lib/useScene";
import { setSystem } from "@/lib/store";
import { site } from "@/data/site";
import { Cota } from "@/components/system/Cota";
import { EASE } from "@/lib/motion";

const dims = ["Design", "Engineering", "Product", "Business"];

/**
 * 08 · About — Drawn by. The title block that signed every sheet becomes the section.
 * The portrait is a plate that fills on scroll; the four words are its four cotas.
 * The real portrait goes in public/about/franco-portrait.* — until then the slot stays explicit.
 */
export function About() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, {
    id: "about",
    // phones: no pin — the plate fills while the section passes
    pinVh: { desktop: 1, compact: 0 },
    mobile: "flow",
    flowRange: ["top 75%", "top 5%"],
    states: 3,
    onProgress: (p) => setSystem({ step: 5, status: "Drawn by", section: "08 — About", note: p < 0.5 ? "the plate fills" : "based in Uruguay · building globally", frame: 1, grid: 0.6, tone: "graphite" }),
    build: ({ q, gsap }) => {
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      tl.fromTo(q(".portrait-fill")[0], { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1, immediateRender: true }, 0);
      q(".dim-cota").forEach((c, i) => tl.fromTo(c, { scale: 0 }, { scale: 1, duration: 0.3, ease: EASE.linear, immediateRender: true }, 0.2 + i * 0.2));
      tl.fromTo(q(".about-block")[0], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3 }, 0.3);
      tl.to({}, { duration: 0.4 });
      return tl;
    },
  });

  return (
    <div className="scene-slot">
      <section ref={ref} aria-label="About" className="relative w-full md:h-[100svh] md:overflow-hidden">
        <div className="relative px-[var(--frame-inset)] pb-16 pt-[calc(var(--frame-top)+72px)] md:absolute md:inset-[var(--frame-inset)] md:top-[var(--frame-top)] md:p-0">
          {/* the portrait plate with its four cotas */}
          <div className="relative mx-auto h-[300px] w-[56%] max-w-[250px] md:absolute md:left-[8%] md:top-[10%] md:mx-0 md:h-[74%] md:w-[26%] md:max-w-none">
            <div className="relative h-full w-full" style={{ border: "1px solid var(--bone-3)" }}>
              <div className="portrait-fill absolute inset-0" style={{ background: "#3d423f" }} />
              <div className="absolute bottom-0 left-0 h-1 w-full bg-[#141716]" />
              <div className="t-mono absolute left-3 top-3 text-bone" style={{ fontSize: 10 }}>portrait · reserved slot</div>
              <div className="t-dim absolute bottom-3 left-3" style={{ color: "var(--bone-3)" }}>public/about/franco-portrait</div>
              {/* top · Design */}
              <div className="dim-cota absolute -top-7 left-0 right-0" style={{ transformOrigin: "left" }}><Cota length="100%" tone="orange" /></div>
              <div className="t-display absolute -top-16 left-0" style={{ fontSize: "clamp(18px, 1.8vw, 28px)" }}>{dims[0]}</div>
              {/* right · Engineering */}
              <div className="dim-cota absolute -right-7 top-0 bottom-0" style={{ transformOrigin: "top" }}><Cota dir="v" length="100%" tone="orange" /></div>
              <div className="t-display absolute -right-14 top-1/2 -translate-y-1/2" style={{ fontSize: "clamp(18px, 1.8vw, 28px)", writingMode: "vertical-rl" }}>{dims[1]}</div>
              {/* bottom · Product */}
              <div className="dim-cota absolute -bottom-7 left-0 right-0" style={{ transformOrigin: "left" }}><Cota length="100%" tone="orange" /></div>
              <div className="t-display absolute -bottom-16 left-0" style={{ fontSize: "clamp(18px, 1.8vw, 28px)" }}>{dims[2]}</div>
              {/* left · Business */}
              <div className="dim-cota absolute -left-7 top-0 bottom-0" style={{ transformOrigin: "top" }}><Cota dir="v" length="100%" tone="orange" /></div>
              <div className="t-display absolute -left-14 top-1/2 -translate-y-1/2" style={{ fontSize: "clamp(18px, 1.8vw, 28px)", writingMode: "vertical-rl", transform: "translateY(-50%) rotate(180deg)" }}>{dims[3]}</div>
            </div>
          </div>

          <div className="about-block relative mt-24 flex w-full flex-col gap-3 md:absolute md:left-[48%] md:top-[8%] md:mt-0 md:w-[48%] md:gap-5">
            <h2 className="t-display m-0" style={{ fontSize: "clamp(40px, 7vw, 120px)" }}>Drawn by<br />{site.name}</h2>
            <dl className="t-mono m-0 grid grid-cols-[110px_1fr] border-t border-edge">
              {[
                ["Based in", site.basedIn],
                ["Building for", site.buildingFor],
                ["Does", site.does],
                ...(site.workingSince ? [["Working since", site.workingSince]] : []),
                ["Works with", site.worksWith],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="border-b border-hairline py-3 text-bone-3">{k}</dt>
                  <dd className="m-0 border-b border-hairline py-3" style={k === "Does" || k === "Works with" ? { textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-plex-sans)", fontSize: 14, color: "var(--bone-2)" } : undefined}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="m-0 hidden max-w-[520px] text-[15px] leading-[1.5] text-bone-2 md:block">Based in Uruguay. Building globally. No biography beyond this block: the four builds above are the biography.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
