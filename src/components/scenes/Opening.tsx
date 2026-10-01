"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useScene } from "@/lib/useScene";
import { setSystem } from "@/lib/store";
import { site } from "@/data/site";
import { projectById } from "@/data/projects";
import { Stack } from "@/components/system/Stack";
import { Cota } from "@/components/system/Cota";
import { ModuleFace } from "@/components/system/ModuleFace";
import { EASE, gsap, isCoarsePointer, prefersReducedMotion } from "@/lib/motion";

/** iso projection constants (orthographic): rotateZ(-45deg) then rotateX(54.7deg) */
const C45 = Math.SQRT1_2;
const COS_X = Math.cos((54.7 * Math.PI) / 180);
const ISO_EXPLODE = 110;
const ISO_EXPLODE_COMPACT = 64; // phones: the system reads with less depth
const SEP_RANGE = 50; // the cursor separates the layers within 60–160 px

type Hl = "none" | "design" | "engineering" | "product";
const HL_BY_WORD: Hl[] = ["design", "engineering", "product"];

/**
 * 00 → 01 Hero → 02 Manifesto → assembly → Sheet 01. One pinned scene, one timeline:
 * the same stack, the same axis and the same physical world all the way.
 *
 * §10 · the hero: FRANCO filled, NÚÑEZ at 0 %, one frontal interface part. Scroll draws
 * the guides, the part turns to construction and its system appears (components · API ·
 * data), the layers fill and each one lands 25 % of the surname. At 100 % the name changes
 * function: it lies down and *becomes* the engraved base plate under the system — the
 * real h1 travels onto the plate's engraving (measured, not approximated).
 *
 * §11 · the manifesto: nothing fades to another section. DESIGN, ENGINEERING and PRODUCT
 * are three dimension lines drawn on the model itself — 01 (interface), 02–04 (the
 * technical layers) and Σ (the whole system) — and each word lights the layers it measures,
 * on scroll and on hover / focus.
 */
export function Opening() {
  const ref = useRef<HTMLElement>(null);
  const ts = projectById.travelsuite360;
  // the name's geometry is measured, so the scene is built once the real fonts are in
  const [fontsReady, setFontsReady] = useState(false);
  const progress = useRef(0);
  const sepUntil = useRef(0);
  // where each phase starts, as a fraction of the scene (measured from the timeline's labels)
  const marks = useRef({ drawing: 0.08, build: 0.18, plate: 0.42, manifesto: 0.55, assembly: 0.78 });

  useEffect(() => {
    let alive = true;
    const fonts = document.fonts?.ready ?? Promise.resolve();
    fonts.then(() => alive && setFontsReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useScene(ref, {
    id: "opening",
    // phones: the same drawings in ~half the gesture (5.5 → 3.0 viewport heights)
    pinVh: { desktop: 4.2, compact: 2.8 },
    states: 12,
    deps: [fontsReady],
    onProgress: (p) => {
      const was = progress.current;
      progress.current = p;
      if (was < sepUntil.current && p >= sepUntil.current) resetSeparation();
      // the six-step counter follows the construction
      const m = marks.current;
      if (p < m.drawing) setSystem({ step: 0, status: "Armando", section: "01 — Inicio", note: "el scroll traza las guías" });
      else if (p < m.build) setSystem({ step: 1, status: "Trazando", section: "01 — Inicio", note: "líneas antes que superficies" });
      else if (p < m.plate) setSystem({ step: 2, status: "Armando", section: "01 — Inicio", note: "cada pieza = 25 % del apellido" });
      else if (p < m.manifesto) setSystem({ step: 3, status: "Armando", section: "01 — Inicio → Manifiesto", note: "el nombre se vuelve placa base" });
      else if (p < m.assembly + 0.04) setSystem({ step: 4, status: "Ensamblado", section: "02 — Manifiesto", note: "tres cotas miden un objeto" });
      else setSystem({ step: 4, status: "Ensamblado", section: "03 — Proyectos · 01 / 04", note: "la construcción explica · el producto demuestra" });
    },
    build: ({ q, gsap, rm, root, compact }) => {
      if (!fontsReady) return null;
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      const frame = q(".op-frame")[0];
      const stack = q(".bench .stack")[0];
      const guides = q(".guide");
      const nameH1 = q(".name-h1")[0];
      const nameFill = q(".name-fill")[0];
      const nameCota = q(".name-cota")[0];
      const nameRule = q(".name-rule")[0];
      const tagline = q(".tagline")[0];
      const bench = q(".bench")[0];
      const partLabel = q(".part-label")[0];
      const explodeCota = q(".explode-cota")[0];
      const plate = q(".bench .plate")[0];
      const plateName = q(".plate-name")[0];
      const plateTag = q(".plate-tag")[0];
      const wordsCol = q(".m-col")[0];
      const words = q(".m-word");
      const clauses = q(".m-clause");
      const dims = root.querySelector<SVGSVGElement>(".m-dims")!;
      const handoff = q(".handoff")[0];
      const explodeIso = compact ? ISO_EXPLODE_COMPACT : ISO_EXPLODE;
      q(".explode-val").forEach((n) => (n.textContent = `despiece · ${explodeIso}`));
      // the assembled slab hands over at exactly the size Sheet 01 shows it (--bench-scale)
      const inner = q(".bench-inner")[0];
      const innerScale = inner.getBoundingClientRect().width / inner.offsetWidth || 1;
      const sheetScale = parseFloat(getComputedStyle(root).getPropertyValue("--bench-scale")) || 1.25;
      const endScale = sheetScale / innerScale;

      const setHl = (hl: Hl) => ({ attr: { "data-hl": hl, "data-hl-scroll": hl } });
      tl.set(stack, setHl("none"), 0);
      tl.set(dims, setHl("none"), 0);

      // ── 01 · ENTER: guides draw, the part turns from product (frontal) to construction (iso)
      //    and its system appears as outlines: components · API · data
      tl.addLabel("draw", 0);
      tl.to(guides, { scaleX: 1, duration: 0.6, stagger: 0.1, ease: EASE.linear }, "draw");
      tl.fromTo(stack, { "--rot": 1, "--explode": "0px" }, { "--rot": 0, "--explode": `${explodeIso}px`, duration: 1, ease: EASE.product, immediateRender: true }, "draw+=0.2");
      tl.to(partLabel, { opacity: 0, duration: 0.2 }, "draw+=0.2");
      tl.to(explodeCota, { opacity: 1, duration: 0.2 }, "draw+=0.9");

      // ── BUILD: the layers fill bottom-up; each one lands 25 % of the surname
      tl.addLabel("build", "draw+=1.3");
      [3, 2, 1].forEach((i, n) => {
        tl.to(stack, { [`--fill-${i}`]: 1, duration: 0.7, ease: rm ? EASE.linear : EASE.product }, `build+=${n * 0.75}`);
        tl.to(nameFill, { clipPath: `inset(0 ${100 - (n + 1) * 25}% 0 0)`, duration: 0.7, ease: EASE.linear }, `build+=${n * 0.75}`);
        tl.set(nameCota, { attr: { "data-text": `Núñez · ${(n + 1) * 25} % · pieza 0${i + 1} colocada` } }, `build+=${n * 0.75 + 0.7}`);
      });
      tl.to(nameFill, { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: EASE.linear }, "build+=2.25");
      tl.set(nameCota, { attr: { "data-text": "Núñez · 100 % · el sistema se entiende" } }, "build+=2.95");

      // ── 01 → 02 · the name changes function: it becomes the base plate under the system
      tl.addLabel("plate", "build+=3.2");
      tl.to([tagline, guides, explodeCota, nameCota, nameRule], { opacity: 0, duration: 0.3 }, "plate");
      tl.to(
        bench,
        compact ? { xPercent: -4, y: -16, scale: 0.8, duration: 1.2, ease: EASE.product } : { xPercent: -78, scale: 0.8, duration: 1.2, ease: EASE.product },
        "plate",
      );
      // lines before surfaces: the plate arrives as an outline (the name can land on it), and its
      // surface fills only once the engraving is in place
      tl.fromTo(plate, { opacity: 0, backgroundColor: "rgba(27,30,28,0)" }, { opacity: 1, duration: 0.4, ease: EASE.snap(3), immediateRender: true }, "plate+=0.5");
      tl.to(plate, { backgroundColor: "rgba(27,30,28,1)", duration: 0.3, ease: EASE.linear }, "plate+=1.42");
      tl.addLabel("manifesto", "plate+=1.85");

      // ── 02 · ASSEMBLY → SHEET 01 (positions known now; geometry-dependent tweens are added below)
      const W = 0.8; // spacing between the three words
      tl.addLabel("assembly", `manifesto+=${W * 3 + 0.9}`);
      tl.to(stack, { "--explode": "0px", duration: 0.5, ease: EASE.snap(4) }, "assembly+=0.3");
      tl.to(plate, { opacity: 0, duration: 0.4 }, "assembly+=1.1");
      // the slab is handed over at the exact place and size Sheet 01's window starts from:
      // the centre of the frame, offset by --pw-dy (measured on the untransformed bench)
      const fb = frame.getBoundingClientRect();
      const bb = bench.getBoundingClientRect();
      const pwDy = parseFloat(getComputedStyle(root).getPropertyValue("--pw-dy")) || 44;
      const hand = { x: fb.left + fb.width / 2 - (bb.left + bb.width / 2), y: fb.top + fb.height / 2 + pwDy - (bb.top + bb.height / 2) };
      tl.to(bench, { xPercent: 0, x: hand.x, y: hand.y, scale: endScale, duration: 1.1, ease: EASE.product }, "assembly+=1.1");
      tl.to(stack, { "--rot": 1, duration: 1.1, ease: EASE.product }, "assembly+=1.1");
      tl.fromTo(handoff, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: true }, "assembly+=2.1");
      tl.to({}, { duration: 0.4 });

      // ── measure the model in its manifesto state: the plate's engraving and the layers
      tl.seek(tl.labels.manifesto, true);
      const box = frame.getBoundingClientRect();
      const local = (r: DOMRect) => ({ cx: r.left + r.width / 2 - box.left, cy: r.top + r.height / 2 - box.top, w: r.width, h: r.height, right: r.right - box.left, left: r.left - box.left });
      // projected scale k of an element lying in the iso plane: bboxWidth = (w + h)·cos45·k
      const isoK = (el: HTMLElement) => el.getBoundingClientRect().width / ((el.offsetWidth + el.offsetHeight) * C45);
      const target = local(plateName.getBoundingClientRect());
      const kPlate = isoK(plateName);
      // right-hand vertex of each layer face: (bbox.right, cy + (h − w)/2 · cos45 · cosX · k)
      const vertex = (key: string) => {
        const face = q(`.bench .layer[data-layer="${key}"] > .face`)[0];
        const r = local(face.getBoundingClientRect());
        const k = isoK(face);
        return { x: r.right, y: r.cy + ((face.offsetHeight - face.offsetWidth) / 2) * C45 * COS_X * k };
      };
      const V = ["interface", "components", "api", "data"].map(vertex);
      tl.seek(0, true);
      const name = local(nameH1.getBoundingClientRect());
      const nameScale = (kPlate * plateName.offsetWidth) / nameH1.offsetWidth;

      // the h1 itself travels: frontal → iso, onto the engraving, ink → engraved line
      tl.fromTo(
        nameH1,
        { "--nx": "0px", "--ny": "0px", "--lay": 0, "--ns": 1 },
        { "--nx": `${target.cx - name.cx}px`, "--ny": `${target.cy - name.cy}px`, "--lay": 1, "--ns": nameScale, duration: 1.3, ease: EASE.product, immediateRender: true },
        "plate+=0.1",
      );
      tl.fromTo(
        nameH1,
        { "--ink": "rgba(230,226,216,1)", "--sf": "rgba(106,113,108,0)", "--sn": "rgba(154,161,156,1)" },
        { "--ink": "rgba(230,226,216,0)", "--sf": "rgba(106,113,108,1)", "--sn": "rgba(106,113,108,1)", duration: 0.5, immediateRender: true },
        "plate+=0.85",
      );
      // it lands: the engraving takes over in the same place (snap, no crossfade)
      tl.set(nameH1, { autoAlpha: 0 }, "plate+=1.4");
      tl.fromTo(plateName, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: true }, "plate+=1.4");
      tl.fromTo(plateTag, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: EASE.snap(2), immediateRender: true }, "plate+=1.45");

      // ── 02 · the three cotas, drawn on the model (SVG in frame coordinates)
      const NS = "http://www.w3.org/2000/svg";
      dims.replaceChildren();
      const el = (tag: string, attrs: Record<string, string | number>, text?: string) => {
        const n = document.createElementNS(NS, tag);
        Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, String(v)));
        if (text) n.textContent = text;
        dims.appendChild(n);
        return n;
      };
      const x1 = Math.max(...V.map((v) => v.x)) + 26;
      const x2 = x1 + 30;
      const maxX = box.width - 6;
      const X1 = Math.min(x1, maxX - 30);
      const X2 = Math.min(x2, maxX);
      const [y0, y1, , y3] = V.map((v) => v.y);
      const exts = V.map((v) => el("path", { d: `M ${v.x + 6} ${v.y} H ${X2 + 8}`, class: "dim-ext", opacity: 0 }));
      const dim = (key: Hl, x: number, a: number, b: number, code: string) => {
        const path = el("path", { d: `M ${x - 5} ${a} H ${x + 5} M ${x} ${a} V ${b} M ${x - 5} ${b} H ${x + 5}`, class: `dim dim-${key}`, pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1 });
        const mid = (a + b) / 2;
        const label = el("text", { x: x + 5, y: mid, class: `dim-label dim-label-${key}`, transform: `rotate(-90 ${x + 5} ${mid})`, opacity: 0, "text-anchor": "middle", dy: 9 }, code);
        return { path, label };
      };
      // phones: the words column already names them, the cotas carry only their codes
      const D = compact
        ? [dim("design", X1, y0, y1, "01"), dim("engineering", X1, y1, y3, "02–04"), dim("product", X2, y0, y3, "Σ")]
        : [dim("design", X1, y0, y1, "01 · diseño"), dim("engineering", X1, y1, y3, "02–04 · ingeniería"), dim("product", X2, y0, y3, "Σ · producto")];
      const extsFor: number[][] = [[0, 1], [1, 3], [0, 3]];

      // the words column starts right of the cotas on wide screens; on compact layouts it stays on top
      if (!compact) gsap.set(wordsCol, { left: X2 + 44, right: 0, width: "auto" });

      words.forEach((w, i) => {
        const at = `manifesto+=${i * W}`;
        tl.to(D[i].path, { attr: { "stroke-dashoffset": 0 }, duration: 0.4, ease: EASE.linear }, at);
        tl.to(extsFor[i].map((e) => exts[e]), { attr: { opacity: 1 }, duration: 0.01 }, at);
        tl.to(D[i].label, { attr: { opacity: 1 }, duration: 0.15, ease: EASE.snap(2) }, `${at}+=0.3`);
        tl.set([stack, dims], setHl(HL_BY_WORD[i]), at);
        tl.fromTo(w, { autoAlpha: 0, "--wfill": 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: true }, at);
        tl.to(w, { "--wfill": 1, duration: 0.45, ease: EASE.linear }, `${at}+=0.15`);
        tl.fromTo(clauses[i], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: true }, `${at}+=0.4`);
      });

      // assembly: the cotas retract, the words leave, the layers close (product = the whole)
      tl.to([...D.map((d) => d.path)], { attr: { "stroke-dashoffset": 1 }, duration: 0.3, ease: EASE.linear }, "assembly");
      tl.to([...exts, ...D.map((d) => d.label)], { attr: { opacity: 0 }, duration: 0.2 }, "assembly");
      tl.to([...words, ...clauses], { autoAlpha: 0, duration: 0.3 }, "assembly");
      tl.set([stack, dims], setHl("none"), "assembly+=0.8");

      // resting states (reduced motion snaps between exactly these, nothing plays in between)
      [
        0,
        tl.labels.draw + 1.25,
        tl.labels.build + 0.75,
        tl.labels.build + 1.5,
        tl.labels.build + 2.25,
        tl.labels.build + 3.0,
        tl.labels.plate + 1.78,
        ...words.map((_, i) => tl.labels.manifesto + i * W + 0.75),
        tl.labels.assembly + 0.85,
        tl.duration(),
      ].forEach((t, i) => tl.addLabel(`rest${String(i).padStart(2, "0")}`, t));

      const d = tl.duration();
      marks.current = { drawing: 0.02, build: tl.labels.build / d, plate: tl.labels.plate / d, manifesto: tl.labels.manifesto / d, assembly: tl.labels.assembly / d };

      // the separation by cursor only belongs to the hero; it is released when the name lies down
      sepUntil.current = tl.labels.plate / tl.duration();
      setSystem({ ready: true });
      return tl;
    },
  });

  // ── the cursor separates the layers, within 60–160 px, while the hero is being built
  const sep = useRef<{ to: ((v: number) => void) | null }>({ to: null });
  function separation(): (v: number) => void {
    if (sep.current.to) return sep.current.to;
    const stack = ref.current?.querySelector<HTMLElement>(".bench .stack");
    const readout = ref.current?.querySelector<HTMLElement>(".explode-val");
    const proxy = { v: 0 };
    const tween = gsap.quickTo(proxy, "v", {
      duration: prefersReducedMotion() ? 0 : 0.35,
      ease: "power3.out",
      onUpdate: () => {
        if (!stack) return;
        stack.style.setProperty("--sep", `${proxy.v.toFixed(1)}px`);
        const base = parseFloat(stack.style.getPropertyValue("--explode")) || 0;
        if (readout) readout.textContent = `despiece · ${Math.round(base + proxy.v)}`;
      },
    });
    sep.current.to = (v: number) => tween(v);
    return sep.current.to;
  }
  function resetSeparation() {
    sep.current.to?.(0);
  }
  function onBenchMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || isCoarsePointer()) return;
    if (progress.current >= sepUntil.current) return;
    const stack = ref.current?.querySelector<HTMLElement>(".bench .stack");
    const explode = parseFloat(stack?.style.getPropertyValue("--explode") ?? "0") || 0;
    if (explode < 60) return; // nothing to separate yet: the part is still frontal
    const r = e.currentTarget.getBoundingClientRect();
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2); // −1 … 1
    separation()(Math.max(-1, Math.min(1, -dy)) * SEP_RANGE);
  }

  function hover(hl: Hl | null) {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll<Element>(".bench .stack, .m-dims").forEach((n) => {
      n.setAttribute("data-hl", hl ?? n.getAttribute("data-hl-scroll") ?? "none");
    });
  }

  return (
    <div className="scene-slot">
      <section ref={ref} aria-label="Inicio y manifiesto" className="vh relative w-full overflow-hidden">
        <div className="op-frame absolute" style={{ inset: "var(--frame-inset)", top: "var(--frame-top)" }}>
          {/* construction guides */}
          <div className="guide absolute left-0 right-0 origin-left scale-x-0" style={{ top: "12%", height: 1, background: "repeating-linear-gradient(to right,#6a716c 0 4px,transparent 4px 10px)" }} />
          <div className="guide absolute left-0 right-0 origin-left scale-x-0" style={{ top: "54%", height: 1, background: "repeating-linear-gradient(to right,#6a716c 0 4px,transparent 4px 10px)" }} />

          {/* the name — FRANCO filled, NÚÑEZ outline at 0 % */}
          <div className="name-block absolute left-0 top-[8%]">
            <h1
              className="name-h1 t-display m-0 will-change-transform"
              style={{
                fontSize: "var(--hero-size)",
                lineHeight: 0.82,
                width: "max-content",
                transformOrigin: "50% 50%",
                transform: "translate(var(--nx, 0px), var(--ny, 0px)) rotateX(calc(54.7deg * var(--lay, 0))) rotateZ(calc(-45deg * var(--lay, 0))) scale(var(--ns, 1))",
                ["--ink" as string]: "rgba(230,226,216,1)",
                ["--sf" as string]: "rgba(106,113,108,0)",
                ["--sn" as string]: "rgba(154,161,156,1)",
              }}
            >
              <span className="block" style={{ color: "var(--ink)", WebkitTextStroke: "calc(1px / var(--ns, 1)) var(--sf)" }}>{site.first}</span>
              <span className="relative block" style={{ color: "transparent", WebkitTextStroke: "calc(1px / var(--ns, 1)) var(--sn)" }}>
                {site.last}
                <span className="name-fill absolute left-0 top-0" style={{ color: "var(--ink)", WebkitTextStroke: 0, clipPath: "inset(0 100% 0 0)" }} aria-hidden="true">
                  {site.last}
                </span>
              </span>
            </h1>
            <div className="name-rule mt-3 flex items-center gap-4">
              <Cota length="min(44vw, 620px)" tone="orange" />
            </div>
            <div className="name-cota t-dim mt-3 before:content-[attr(data-text)]" data-text="Núñez · 0 % · faltan las piezas 02–04" data-cursor="measure" data-measure="apellido · lo arman las piezas" aria-live="polite" />
          </div>

          {/* positioning */}
          <div className="tagline absolute left-0 top-[calc(8%+var(--hero-size)*1.64+58px)] flex max-w-[560px] flex-col gap-4 md:top-auto md:bottom-[6%]">
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

          {/* the bench: the signature object (the preloader draws its first part in this exact box) */}
          <div
            className="bench absolute right-[-10%] top-[46%] h-[54%] w-[120%] will-change-transform md:right-[2%] md:top-[4%] md:h-[92%] md:w-[46%]"
            data-cursor="separate"
            onPointerMove={onBenchMove}
            onPointerLeave={resetSeparation}
          >
            <div className="part-label t-mono absolute left-[12%] top-0 text-bone-3 md:left-0">Pieza 01 · interfaz · frontal</div>
            <div className="bench-inner absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.62] sm:scale-[0.85] md:scale-100">
              <Stack
                layers={ts.layers}
                faces={{ interface: <ModuleFace project={ts} active={0} panels={false} /> }}
                width={420}
                height={260}
                rot={1}
                explode={0}
                fills={[1, 0, 0, 0]}
                centered
                plate={
                  <div className="absolute bottom-6 left-6">
                    <div className="plate-name t-display" style={{ fontSize: 56, lineHeight: 0.82, width: "max-content", color: "transparent", WebkitTextStroke: "1px var(--edge)", visibility: "hidden" }}>
                      <span className="block">{site.first}</span>
                      <span className="block">{site.last}</span>
                    </div>
                    <div className="plate-tag t-mono mt-2" style={{ color: "var(--edge)", fontSize: 9, opacity: 0 }}>
                      placa base · grabada
                    </div>
                  </div>
                }
              />
            </div>
            <div className="explode-cota absolute left-[12%] top-[36%] opacity-0 md:left-0">
              <Cota
                dir="v"
                length={120}
                label={<span className="explode-val">despiece · {ISO_EXPLODE}</span>}
                sub={<span className="hidden [@media(hover:hover)]:inline">el cursor separa 60–160</span>}
              />
            </div>
          </div>

          {/* 02 · the three cotas, drawn on the model in frame coordinates */}
          <svg className="m-dims pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true" data-hl="none" />

          {/* the words that the cotas measure */}
          <div className="m-col pointer-events-none absolute right-0 top-[6%] flex w-[56%] flex-col gap-3 md:top-[10%] md:w-[38%] md:gap-6">
            {site.manifesto.map((m, i) => (
              <div key={m.word} className="relative">
                <button
                  type="button"
                  className="m-word t-display pointer-events-auto relative block text-left"
                  style={{ fontSize: "clamp(26px, 3.4vw, 56px)", lineHeight: 1, color: "transparent", WebkitTextStroke: "1px var(--bone)", visibility: "hidden", ["--wfill" as string]: 0 }}
                  aria-describedby={`m-clause-${i}`}
                  onPointerEnter={() => hover(HL_BY_WORD[i])}
                  onPointerLeave={() => hover(null)}
                  onFocus={() => hover(HL_BY_WORD[i])}
                  onBlur={() => hover(null)}
                  data-cursor="measure"
                  data-measure={`mide ${m.measures}`}
                >
                  {m.word}
                  {i < 2 && <span style={{ color: "var(--orange)", WebkitTextStroke: 0 }}> ×</span>}
                  <span className="absolute left-0 top-0" style={{ color: "var(--bone)", WebkitTextStroke: 0, clipPath: "inset(0 calc((1 - var(--wfill)) * 100%) 0 0)" }} aria-hidden="true">
                    {m.word}
                    {i < 2 && <span style={{ color: "var(--orange)" }}> ×</span>}
                  </span>
                </button>
                <p id={`m-clause-${i}`} className="m-clause m-0 mt-2 max-w-[420px] text-[13px] leading-[1.5] text-bone-2" style={{ visibility: "hidden" }}>
                  <span className="t-dim">§{i + 1} · mide {m.measures}</span>&nbsp; {m.clause}
                </p>
              </div>
            ))}
          </div>

          {/* handoff note into sheet 01 */}
          <div className="handoff t-mono absolute bottom-0 left-0 flex items-center gap-3 text-bone-3 opacity-0">
            <span className="text-orange">↓</span>
            <span>lo que viste armarse es la lámina 01 · TravelSuite360</span>
          </div>
        </div>
      </section>
    </div>
  );
}
