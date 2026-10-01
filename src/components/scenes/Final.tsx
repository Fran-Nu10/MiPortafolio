"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useScene } from "@/lib/useScene";
import { setSystem, useSystem } from "@/lib/store";
import { site } from "@/data/site";
import { projects } from "@/data/projects";
import { Stack } from "@/components/system/Stack";
import { Cota } from "@/components/system/Cota";
import { submitBrief, type BriefInput } from "@/app/actions/brief";
import { EASE, gsap, prefersReducedMotion } from "@/lib/motion";

const KINDS: BriefInput["kind"][] = ["SaaS", "Commerce", "AI", "Interactive"];

/**
 * 10 · Final — 06/06, the system rests; one more scroll: WHAT I BUILT → WHAT WE CAN BUILD,
 * a fifth axis, and the contact is the first layer of Build 05. After sending, the brief
 * rotates into construction and the site ends where the next build begins. No footer.
 */
export function Final() {
  const ref = useRef<HTMLElement>(null);
  const brief = useSystem((s) => s.brief);
  const [kind, setKind] = useState<BriefInput["kind"]>("SaaS");
  const [name, setName] = useState("");
  const [what, setWhat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [delivered, setDelivered] = useState<boolean | null>(null);
  const [pending, start] = useTransition();
  // the part fills as the brief is typed: a name (40 %) and a few words on what we build (60 %)
  const fill = Math.min(100, Math.round(Math.min(1, name.trim().length / 4) * 40 + Math.min(1, what.trim().length / 24) * 60));

  useScene(ref, {
    id: "final",
    pinVh: { desktop: 1.8, compact: 0 },
    states: 5,
    mobile: "flow",
    onProgress: (p) => {
      if (brief) return;
      if (p < 0.3) setSystem({ step: 6, status: "Launched", section: "10 — Final", note: "nothing left to measure", frame: 1, grid: 1, tone: "graphite" });
      else setSystem({ step: 0, status: "Assembling", section: "10 — Build 05", note: "the counter resets · the loop closes at state 0", frame: 1, grid: 1, tone: "graphite" });
    },
    build: ({ q, gsap }) => {
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      const built = q(".h-built")[0];
      const can = q(".h-can")[0];
      const four = q(".four")[0];
      const axis5 = q(".axis5")[0];
      const brief = q(".brief")[0];
      const rest = q(".rest-note")[0];
      // arrival: rest
      tl.fromTo(rest, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.1);
      tl.to({}, { duration: 0.6 }); // the hold
      // transformation: "I built" masked out, "we can build" drawn over it; the four slide left; axis 05 draws
      tl.addLabel("turn");
      tl.fromTo(built, { clipPath: "inset(0 0% 0 0)" }, { clipPath: "inset(0 100% 0 0)", duration: 0.5, immediateRender: true }, "turn");
      tl.fromTo(can, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.6, immediateRender: true }, "turn+=0.2");
      tl.to(rest, { opacity: 0, duration: 0.2 }, "turn");
      tl.to(four, { xPercent: -18, opacity: 0.45, duration: 0.8, ease: EASE.product }, "turn");
      tl.fromTo(axis5, { scaleY: 0 }, { scaleY: 1, transformOrigin: "top", duration: 0.4, immediateRender: true }, "turn+=0.6");
      // the brief lands as part 01 — frontal, usable
      tl.fromTo(brief, { yPercent: 8, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: EASE.settle, immediateRender: true }, "turn+=0.9");
      tl.to({}, { duration: 0.5 });
      return tl;
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const payload: BriefInput = { name, what, kind, company: String(fd.get("company") ?? "") };
    start(async () => {
      const res = await submitBrief(payload);
      if (!res.ok) {
        setError(res.error === "name" ? "A name, at least two letters." : "Tell me what we are building, in a few words.");
        return;
      }
      setDelivered(res.delivered);
      setSystem({ brief: { name, what, kind }, step: 1, status: "Build 05 · Understand", section: "10 — Build 05", note: "brief received · station 01 of 06" });
    });
  }

  // the brief rotates into construction once it is on screen (layers 02–04 draw as outlines)
  useEffect(() => {
    const received = brief ? ref.current?.querySelector(".received") : null;
    if (!received || prefersReducedMotion()) return;
    const tw = gsap.fromTo(received, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: EASE.settle, delay: 0.1 });
    return () => {
      tw.kill();
    };
  }, [brief]);

  const hasRoutes = site.contact.email || site.contact.whatsapp || site.contact.booking;

  return (
    <div className="scene-slot">
      <section ref={ref} aria-label="Build 05 — start the next build" className="relative w-full overflow-hidden md:vh" style={{ minHeight: "100svh" }}>
        {/* phones: the section flows (no pin) and grows with its content; desktop: the frame composition */}
        <div className="final-inner relative px-[var(--frame-inset)] pb-10 pt-[var(--frame-top)] md:absolute md:p-0" style={{ ["--fi" as string]: "var(--frame-inset)" }}>
          {/* the headline: I built → we can build */}
          <div className="relative md:absolute md:left-0 md:top-[6%]">
            <h2 className="t-display relative m-0" style={{ fontSize: "clamp(48px, 6.8vw, 124px)", lineHeight: 0.86 }}>
              <span className="block">What</span>
              <span className="relative block">
                <span className="h-built block whitespace-nowrap" aria-hidden={!!brief}>I built</span>
                <span className="h-can absolute left-0 top-0 block whitespace-nowrap" style={{ clipPath: "inset(0 100% 0 0)" }}>we can build</span>
              </span>
            </h2>
            <div className="rest-note t-dim mt-4 opacity-0" style={{ color: "var(--bone-3)" }}>06 / 06 · four products · one person · the system is at rest</div>
          </div>

          {/* the four builds on the plate, then dimmed to the left */}
          <div className="four absolute bottom-[8%] left-0 hidden items-end gap-6 md:flex">
            {projects.map((p) => (
              <div key={p.id} className="relative" style={{ width: 110, height: 70, background: p.faceColor, border: "1px solid var(--bone)", transform: "rotate(-30deg) skewX(30deg) scaleY(0.864)", boxShadow: "6px 6px 0 #141716" }}>
                <div className="t-mono p-2" style={{ fontSize: 8, color: p.id === "prospector" ? "var(--bone)" : "var(--ink)" }}>0{p.index} · {p.name}</div>
              </div>
            ))}
          </div>

          {/* axis 05 + the brief as part 01 */}
          <div className="relative mt-10 w-full md:absolute md:right-0 md:top-[4%] md:mt-0 md:w-[46%]">
            <div className="axis5 axis-v absolute left-[50%] top-0 hidden h-[90%] md:block" />
            {!brief ? (
              <form onSubmit={onSubmit} className="brief relative mx-auto w-full max-w-[460px] md:mt-8" style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--bone)", padding: 22, boxShadow: "0 40px 60px -30px rgba(0,0,0,.9)" }} noValidate>
                <div className="t-mono mb-3 flex justify-between"><span>01 · interface · the brief</span><span className="text-orange">{fill} %</span></div>
                <label htmlFor="b-name" className="t-mono mb-1 block text-[#6a716c]">Name</label>
                <input id="b-name" name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required minLength={2} className="mb-3 h-12 w-full border border-ink bg-transparent px-3 text-[15px] text-ink" aria-invalid={error?.includes("name") || undefined} data-cursor="measure" data-measure={`brief · ${name.length + what.length} chars`} />
                <label htmlFor="b-what" className="t-mono mb-1 block text-[#6a716c]">What are we building</label>
                <input id="b-what" name="what" value={what} onChange={(e) => setWhat(e.target.value)} required minLength={4} className="mb-3 h-12 w-full border border-ink bg-transparent px-3 text-[15px] text-ink" data-cursor="measure" data-measure={`brief · ${name.length + what.length} chars`} />
                <fieldset className="m-0 mb-3 flex flex-wrap gap-2 border-0 p-0">
                  <legend className="sr-only">Project kind</legend>
                  {KINDS.map((k) => (
                    <label key={k} className="t-mono cursor-pointer border px-3 py-2.5" style={{ borderColor: kind === k ? "var(--ink)" : "#e4dfd3", color: kind === k ? "var(--ink)" : "#6a716c" }} data-cursor="magnet">
                      <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
                      {k}
                    </label>
                  ))}
                </fieldset>
                <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                {error && <p role="alert" className="t-dim mb-2">{error}</p>}
                <button type="submit" disabled={pending} className="flex h-[52px] w-full items-center justify-between bg-orange px-4 text-[15px] font-medium text-graphite disabled:opacity-60" data-cursor="magnet">
                  {pending ? "Drawing…" : "Start the build"} <span aria-hidden="true">→</span>
                </button>
                <div className="mt-3 h-1 bg-[#e4dfd3]"><div className="h-1 bg-ink" style={{ width: `${fill}%`, transition: "width .3s var(--ease-settle)" }} /></div>
              </form>
            ) : (
              <div className="received relative mx-auto w-full max-w-[460px] md:mt-8">
                <div className="t-display mb-4" style={{ fontSize: "clamp(28px, 3.4vw, 48px)" }}>
                  Build 05<br /><span className="text-orange">{brief.name}&apos;s product</span>
                </div>
                <Cota length="100%" label={`Núñez × ${brief.name} · 16 % · station 01 of 06`} />
                {/* the exploded iso stack projects upward from its base: give it the room */}
                <div className="mt-4 flex h-[420px] items-end justify-center md:h-[480px]" data-cursor="separate">
                  <Stack
                    layers={[
                      { key: "interface", label: "01 · the brief", parts: [brief.kind] },
                      { key: "components", label: "02 · components", parts: [] },
                      { key: "api", label: "03 · api", parts: [] },
                      { key: "data", label: "04 · data", parts: [] },
                    ]}
                    faces={{ interface: <div className="flex h-full flex-col gap-2 p-3" style={{ color: "var(--ink)" }}><div className="t-mono">01 · the brief · {brief.name}</div><div className="text-[12px] leading-[1.4]">&ldquo;{brief.what}&rdquo;</div><div className="t-dim">{brief.kind} · received</div></div> }}
                    width={300}
                    height={190}
                    rot={0}
                    explode={48}
                    fills={[1, 0, 0, 0]}
                    ghost
                  />
                </div>
                <p className="mt-2 text-[14px] leading-[1.5] text-bone-2">
                  {delivered
                    ? "Your brief is on the axis, next to the four builds."
                    : hasRoutes
                      ? "Your brief is on the axis. The delivery route is not connected yet — reach me through one of the routes below in the meantime."
                      : "Your brief is on the axis, on this screen only: the delivery route is not connected yet, so nothing was sent. Contact routes will be engraved here once confirmed."}
                  {site.contact.replyTime && ` ${site.contact.replyTime}`}
                </p>
              </div>
            )}
          </div>

          {/* side routes: only real ones; none supplied yet → the line is omitted */}
          {hasRoutes && (
            <div className="t-mono absolute bottom-0 left-0 flex gap-4 text-bone-3">
              {site.contact.email && <a href={`mailto:${site.contact.email}`} className="text-bone">{site.contact.email}</a>}
              {site.contact.whatsapp && <a href={site.contact.whatsapp} className="text-bone">WhatsApp</a>}
              {site.contact.booking && <a href={site.contact.booking} className="text-bone">Book 30 min</a>}
            </div>
          )}
          <div className="t-mono absolute bottom-0 right-0 hidden text-bone-3 md:block">Montevideo · worldwide · the site ends where the next build begins</div>
        </div>
      </section>
    </div>
  );
}
