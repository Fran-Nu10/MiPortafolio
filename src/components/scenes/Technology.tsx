"use client";

import { useRef, useState } from "react";
import { useScene } from "@/lib/useScene";
import { setSystem } from "@/lib/store";
import { technologies, type Tech } from "@/data/system";
import { projectById } from "@/data/projects";
import { EASE } from "@/lib/motion";

/**
 * 09 · Technology — engraved on the base plate, seen from above. Outline type, no logos,
 * no bars. A name lights up only when a documented sheet used it; hover/tap draws one cota.
 */
export function Technology() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState<Tech | null>(null);

  useScene(ref, {
    id: "technology",
    pinVh: 1.2,
    states: 3,
    onProgress: () => setSystem({ step: 5, status: "Engraved", section: "09 — Technology", note: "no logos · no badges · no bars", frame: 1, grid: 0.6, tone: "graphite" }),
    build: ({ q, gsap }) => {
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      // the camera tilts down to look at the plate from above
      tl.fromTo(q(".plate-top")[0], { rotateX: 40, scale: 0.9 }, { rotateX: 0, scale: 1, duration: 1, ease: EASE.product, immediateRender: true }, 0);
      tl.fromTo(q(".eng"), { opacity: 0 }, { opacity: 1, duration: 0.2, stagger: 0.04 }, 0.4);
      tl.to({}, { duration: 0.5 });
      return tl;
    },
  });

  return (
    <div className="scene-slot">
      <section ref={ref} aria-label="Technology" className="vh relative w-full overflow-hidden">
        <div className="absolute" style={{ inset: "var(--frame-inset)", top: "calc(var(--frame-inset) + 16px)" }}>
          <div className="absolute left-[2%] top-[4%] flex w-[60%] flex-col gap-3">
            <div className="t-dim">09 · Technology</div>
            <h2 className="t-display m-0" style={{ fontSize: "clamp(32px, 4vw, 56px)" }}>Engraved on the plate</h2>
          </div>

          <div className="absolute left-[2%] right-[2%] top-[24%] h-[62%] md:top-[26%]" style={{ perspective: 1600 }}>
            <div className="plate-top relative h-full w-full border border-edge bg-plate" style={{ transform: "skewX(-8deg)", transformOrigin: "50% 100%" }}>
              <div className="flex h-full flex-col gap-5 p-6 md:p-10" style={{ transform: "skewX(8deg)" }}>
                <div className="t-mono flex justify-between text-edge"><span>Base plate · every build stood here</span><span className="hidden md:inline">engraved 2024 — 2026</span></div>
                <ul className="m-0 flex list-none flex-wrap gap-x-8 gap-y-3 p-0">
                  {technologies.map((t) => {
                    const documented = t.usedIn.length > 0;
                    const isActive = active?.name === t.name;
                    return (
                      <li key={t.name} className="eng relative">
                        <button
                          type="button"
                          className="t-display bg-transparent p-0"
                          style={{
                            fontSize: "clamp(22px, 2.6vw, 38px)",
                            color: isActive ? "rgba(240,78,35,.12)" : "transparent",
                            WebkitTextStroke: `1px ${documented ? "var(--orange)" : t.tier === "base" ? "var(--bone)" : "var(--edge)"}`,
                            cursor: documented ? "pointer" : "default",
                          }}
                          onMouseEnter={() => documented && setActive(t)}
                          onMouseLeave={() => setActive(null)}
                          onFocus={() => documented && setActive(t)}
                          onBlur={() => setActive(null)}
                          onClick={() => documented && setActive(isActive ? null : t)}
                          aria-describedby={isActive ? `tech-${t.name}` : undefined}
                          data-cursor={documented ? "inspect" : undefined}
                        >
                          {t.name}
                        </button>
                        {isActive && (
                          <div id={`tech-${t.name}`} role="status" className="t-dim absolute left-0 top-full mt-1 whitespace-nowrap">
                            <div className="mb-1 h-4 w-px bg-orange" />
                            <span style={{ color: "var(--bone)" }}>{t.usedIn.map((id) => `${projectById[id].name} · sheet 0${projectById[id].index}`).join(" · ")}</span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-auto flex flex-wrap gap-6 t-mono text-edge">
                  <span><span className="text-orange">orange stroke</span> · documented in a sheet</span>
                  <span><span className="text-bone">bone stroke</span> · base stack</span>
                  <span>grey stroke · planned for this site, not yet in a shipped build</span>
                </div>
              </div>
            </div>
          </div>
          <p className="absolute bottom-0 left-[2%] m-0 max-w-[560px] text-[13px] leading-[1.5] text-bone-3">
            Technology supports the work; it does not present it. Only Prospector (Next.js, Tailwind, Framer Motion, Apify) and Chef Arturo (Mercado Pago, WhatsApp) have documented links; the other builds light nothing until confirmed.
          </p>
        </div>
      </section>
    </div>
  );
}
