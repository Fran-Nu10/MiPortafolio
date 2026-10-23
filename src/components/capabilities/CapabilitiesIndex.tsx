"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import type { ResolvedAsset } from "@/lib/resolved";
import { READING_LINE, WIDE_QUERY, pickActive } from "@/lib/capabilities-index";
import { Cutout } from "@/components/media/Cutout";
import { Still } from "@/components/media/Still";

/** what each scene shows: real copy and real material of the projects (docs/26 §C2) */
export type SceneData =
  | { id: "product"; message: string; interpreted: string; fields: { label: string; value: string }[]; quote: string; reservation: string }
  | { id: "engineering"; poster: ResolvedAsset; layers: string[] }
  | { id: "commerce"; photo: ResolvedAsset; product: string; stepper: string[]; add: string; pay: string }
  | { id: "ai"; message: string; words: { word: string; label: string; value: string }[] }
  | { id: "interactive"; layers: { name: string; asset: ResolvedAsset; offset: { x: number; y: number; w: number; h: number } }[]; aspect: [number, number] }
  | { id: "growth"; stations: string[] };

export interface CapabilityItemView {
  index: number;
  name: string;
  statement: string;
  group: "core" | "extended";
  attribution: { label: string; href?: string };
  scene: SceneData;
}

export interface CapabilitiesView {
  /** the section's visible title (its opening line moved to «Una sola visión», docs/27 §3) */
  heading: string;
  kicker: string;
  subKicker: string;
  items: CapabilityItemView[];
}

const ID = "capacidades";
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Wide layout, live. The server (and the first client render) assume narrow: the HTML carries one set
 * of scenes — under each row, what phones, tablets and no-JS show. On wide screens the client then
 * swaps them for the shared stage's set. Rendering both sets doubled the section's nodes and their
 * hydration (docs/26: +435 nodes, the mobile LCP's render delay; docs/27 §7.4).
 */
function subscribeWide(on: () => void) {
  const mq = window.matchMedia(WIDE_QUERY);
  mq.addEventListener("change", on);
  return () => mq.removeEventListener("change", on);
}
const useWide = () =>
  useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => false,
  );

/**
 * S12 · Capabilities — a live editorial index (docs/26 §C; copy Content Master 22). Six numbered rows
 * (number, name, commercial value, reference) and one shared stage whose scene follows the active row.
 * Wide screens: the rows scroll natively, the stage is sticky beside them, the active row is the one
 * on the reading line (scrolling back re-activates the previous one); hover and focus activate too.
 * Narrow screens: each capability is one editorial unit with its scene right under its words. Scenes
 * play a short explanatory sequence when they become active or come into view; reduced motion and no
 * JS show their final state. The scenes are decorative (aria-hidden): every word that matters is in
 * the rows.
 */
export function CapabilitiesIndex({ view }: { view: CapabilitiesView }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const wide = useWide();

  // wide layout: the active row is the one on the reading line (rAF-throttled, passive)
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const wide = window.matchMedia(WIDE_QUERY);
    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-row]"));
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!wide.matches) return;
      const line = window.innerHeight * READING_LINE;
      setActive(pickActive(rows.map((r) => r.getBoundingClientRect()), line));
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    wide.addEventListener("change", queue);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      wide.removeEventListener("change", queue);
    };
  }, []);

  // narrow layout: each unit's scene plays once it is half in view
  useEffect(() => {
    const root = sectionRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>("[data-unit-scene]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.setAttribute("data-on", "");
      },
      { threshold: 0.45 },
    );
    scenes.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [wide]);

  return (
    <section ref={sectionRef} id={ID} aria-labelledby="capacidades-h" data-section={ID} className="cx">
      <header className="cx-head">
        <h2 id="capacidades-h" className="cx-title">
          {view.heading}
        </h2>
        <p className="cx-kicker">{view.kicker}</p>
      </header>

      <div className="cx-body">
        <ol className="cx-index">
          {view.items.map((c, i) => (
            <li
              key={c.index}
              data-row={c.index}
              data-group={c.group}
              data-active={i === active ? "" : undefined}
              className="cx-row"
              onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
              onFocus={() => setActive(i)}
            >
              {/* the group's name: the kicker already says it on screen; it stays for screen readers */}
              {c.group === "extended" ? <p className="sr-only">{view.subKicker}</p> : null}
              <span className="cx-n micro" aria-hidden="true">
                {pad(c.index)}
              </span>
              <h3 className="cx-name">{c.name}</h3>
              <p className="cx-value">{c.statement}</p>
              {c.attribution.href ? (
                <a href={c.attribution.href} className="micro link cx-ref">
                  {c.attribution.label}
                </a>
              ) : (
                <p className="micro cx-ref">{c.attribution.label}</p>
              )}
              {/* narrow screens (and the server's HTML): the demonstration right under its words */}
              {wide ? null : (
                <div className="cx-unit-scene" data-unit-scene="" aria-hidden="true">
                  <Scene c={c} />
                </div>
              )}
            </li>
          ))}
        </ol>

        {/* wide screens: one stage beside the index, the active capability's scene in it */}
        <div className="cx-stage" aria-hidden="true">
          <div className="cx-stage-in">
            {wide
              ? view.items.map((c, i) => (
                  <div key={c.index} className="cx-stage-scene" data-on={i === active ? "" : undefined}>
                    <Scene c={c} />
                  </div>
                ))
              : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/** one plate: the demonstration alone — its number, name and reference are the row's (docs/27 §4) */
function Plate({ c, children }: { c: CapabilityItemView; children: ReactNode }) {
  return (
    <div className="cx-plate" data-scene={c.scene.id}>
      <div className="cx-plate-body">{children}</div>
    </div>
  );
}

function Scene({ c }: { c: CapabilityItemView }) {
  const s = c.scene;
  switch (s.id) {
    case "product":
      // a product's path: the request, what it means, the offer, the state it reaches
      return (
        <Plate c={c}>
          <ol className="cs-flow">
            <li className="cs-node" style={{ "--k": 0 } as CSSProperties}>
              <p className="cs-msg">{s.message}</p>
            </li>
            <li className="cs-node" style={{ "--k": 1 } as CSSProperties}>
              <p className="micro cs-label">{s.interpreted}</p>
              <dl className="cs-fields">
                {s.fields.map((f) => (
                  <div key={f.label}>
                    <dt className="micro">{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            </li>
            <li className="cs-node" style={{ "--k": 2 } as CSSProperties}>
              <p className="cs-quote">{s.quote}</p>
            </li>
            <li className="cs-node cs-node-state" style={{ "--k": 3 } as CSSProperties}>
              <span className="cs-dot" />
              <p className="cs-state">{s.reservation}</p>
            </li>
          </ol>
        </Plate>
      );
    case "engineering":
      // the real interface on top, the layers that hold it underneath
      return (
        <Plate c={c}>
          <div className="cs-layers">
            {s.layers
              .slice()
              .reverse()
              .map((l, i) => (
                <div key={l} className="cs-slab" style={{ "--k": s.layers.length - 1 - i } as CSSProperties}>
                  <span className="micro cs-slab-label">{l}</span>
                </div>
              ))}
            <div className="cs-shot" style={{ "--k": 0 } as CSSProperties}>
              <Still asset={s.poster} sizes="(min-width: 1024px) 40vw, 90vw" fill />
            </div>
          </div>
        </Plate>
      );
    case "commerce":
      return (
        <Plate c={c}>
          <div className="cs-shop">
            <div className="cs-shop-photo">
              <Cutout asset={s.photo} fill />
            </div>
            <div className="cs-shop-info">
              <p className="cs-shop-name">{s.product}</p>
              <p className="cs-stepper">
                <span>{s.stepper[0]}</span>
                <span className="cs-qty">
                  <span className="cs-qty-a">{s.stepper[1]}</span>
                  <span className="cs-qty-b">{String(Number(s.stepper[1]) + 1)}</span>
                </span>
                <span>{s.stepper[2]}</span>
              </p>
              <p className="cs-add">{s.add}</p>
              <p className="micro cs-pay">{s.pay}</p>
            </div>
          </div>
        </Plate>
      );
    case "ai": {
      const parts = splitByWords(s.message, s.words.map((w) => w.word));
      return (
        <Plate c={c}>
          <div className="cs-ai">
            <p className="cs-ai-msg">
              {parts.map((p, i) =>
                p.word ? (
                  <mark key={i} className="cs-ai-word" style={{ "--k": p.index } as CSSProperties}>
                    {p.text}
                  </mark>
                ) : (
                  <span key={i}>{p.text}</span>
                ),
              )}
            </p>
            <dl className="cs-ai-out">
              {s.words.map((w, k) => (
                <div key={w.label} style={{ "--k": k } as CSSProperties}>
                  <dt className="micro">{w.label}</dt>
                  <dd>{w.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Plate>
      );
    }
    case "interactive": {
      const [aw, ah] = s.aspect;
      return (
        <Plate c={c}>
          <div className="cs-rayo" style={{ "--ar": `${aw} / ${ah}` } as CSSProperties}>
            {s.layers.map((l, i) => (
              <div
                key={l.name}
                className="cs-rayo-layer"
                style={
                  {
                    left: `${l.offset.x * 100}%`,
                    top: `${l.offset.y * 100}%`,
                    width: `${l.offset.w * 100}%`,
                    height: `${l.offset.h * 100}%`,
                    "--dy": `${(-0.3 + (0.6 * i) / Math.max(1, s.layers.length - 1)) * 100}%`,
                    "--k": i,
                  } as CSSProperties
                }
              >
                <Cutout asset={l.asset} fill />
              </div>
            ))}
          </div>
        </Plate>
      );
    }
    case "growth":
      // reach, discovery, the commercial path: three stations from the statement, no figure
      return (
        <Plate c={c}>
          <div className="cs-grow">
            <span className="cs-ring" style={{ "--k": 0 } as CSSProperties} />
            <span className="cs-ring" style={{ "--k": 1 } as CSSProperties} />
            <span className="cs-ring" style={{ "--k": 2 } as CSSProperties} />
            <span className="cs-core" />
            <span className="cs-path" />
            <ol className="cs-stations">
              {s.stations.map((t, k) => (
                <li key={t} style={{ "--k": k } as CSSProperties}>
                  <span className="cs-station-dot" />
                  {t}
                </li>
              ))}
            </ol>
          </div>
        </Plate>
      );
  }
}

/** the sentence cut around its key words (first occurrence of each), in order */
export function splitByWords(text: string, words: string[]): { text: string; word?: true; index?: number }[] {
  const hits = words
    .map((w, index) => ({ at: text.indexOf(w), len: w.length, index }))
    .filter((h) => h.at >= 0)
    .sort((a, b) => a.at - b.at);
  const out: { text: string; word?: true; index?: number }[] = [];
  let pos = 0;
  for (const h of hits) {
    if (h.at < pos) continue;
    if (h.at > pos) out.push({ text: text.slice(pos, h.at) });
    out.push({ text: text.slice(h.at, h.at + h.len), word: true, index: h.index });
    pos = h.at + h.len;
  }
  if (pos < text.length) out.push({ text: text.slice(pos) });
  return out;
}
