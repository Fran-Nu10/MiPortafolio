"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { ResolvedAsset } from "@/lib/resolved";
import { REEL_SIZES } from "@/lib/reel";
import { EVIDENCE_CYCLE, finalStep, nextStep, type EvidenceId } from "@/lib/capabilities-rail";
import { Cutout } from "@/components/media/Cutout";
import { Still } from "@/components/media/Still";

/** what each live element shows: real copy and real material from the worlds (Spec §12) */
export type EvidenceData =
  | { id: "ts-flow"; message: string; fields: { label: string; value: string }[]; reservation: string }
  | { id: "posters"; posters: { name: string; asset: ResolvedAsset }[] }
  | { id: "chef-commerce"; stepper: string[]; add: string; pay: string }
  | { id: "ts-extraction"; message: string; words: { word: string; label: string }[] }
  | { id: "rayo-layers"; layers: { name: string; asset: ResolvedAsset; offset: { x: number; y: number; w: number; h: number } }[]; aspect: [number, number] };

/**
 * One live evidence element: a tiny time-based loop that runs only while `running` (its card
 * in view and the pin active — decided by the rail). Reduced motion: the final state as a
 * still. The rayo layers separate by the rail's own scroll on desktop (`--sep` is set by the
 * rail's timeline) and on a time loop elsewhere.
 */
export function EvidenceElement({ data, running, rm, scrub = false }: { data: EvidenceData; running: boolean; rm: boolean; scrub?: boolean }) {
  const id: EvidenceId = data.id;
  const looping = running && !rm && !(scrub && id === "rayo-layers");
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!looping) return;
    const t = window.setInterval(() => setStep((s) => nextStep(id, s)), EVIDENCE_CYCLE[id].every);
    return () => window.clearInterval(t);
  }, [looping, id]);

  const shown = rm ? finalStep(id) : step;
  const attrs = { "data-evidence-el": id, "data-step": shown, "data-running": looping ? "" : undefined, "data-scrub": scrub && id === "rayo-layers" ? "" : undefined };

  switch (data.id) {
    case "ts-flow":
      // message → the three fields → reserva confirmada
      return (
        <div className="ev ev-ts-flow" {...attrs}>
          <p className="ev-ts-msg" data-ev-step="0">
            {data.message}
          </p>
          <dl className="ev-ts-fields" data-ev-step="1">
            {data.fields.map((f) => (
              <div key={f.label}>
                <dt className="micro muted">{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
          <p className="ev-ts-res micro" data-ev-step="2">
            {data.reservation}
          </p>
        </div>
      );
    case "posters":
      // three real posters stacked; the front one cycles, opacity only
      return (
        <div className="ev ev-posters" {...attrs} style={{ "--n": data.posters.length } as CSSProperties}>
          {data.posters.map((p, i) => (
            <div key={p.name} className="ev-poster" data-ev-step={i} data-name={p.name}>
              {/* the reel's own `sizes`: the browser reuses the poster it already downloaded for the reel
                  instead of fetching a second width of the same capture (Phase 12, measured) */}
              <Still asset={p.asset} sizes={REEL_SIZES} fill />
            </div>
          ))}
        </div>
      );
    case "chef-commerce":
      // − 1 + → Agregar al carrito → Mercado Pago, highlighted in turn
      return (
        <div className="ev ev-chef" {...attrs}>
          <span className="ev-chef-stepper" data-ev-step="0">
            {data.stepper.map((s, i) => (
              <span key={i}>{s}</span>
            ))}
          </span>
          <span className="ev-chef-btn" data-ev-step="1">
            {data.add}
          </span>
          <span className="ev-chef-pay micro" data-ev-step="2">
            {data.pay}
          </span>
        </div>
      );
    case "ts-extraction": {
      // the sentence; the three key words underline in turn, then resolve to their labels
      const parts = splitByWords(data.message, data.words.map((w) => w.word));
      return (
        <div className="ev ev-extract" {...attrs}>
          <p className="ev-extract-msg">
            {parts.map((p, i) =>
              p.word ? (
                <span key={i} className="ev-word" data-ev-word={p.index}>
                  <span className="ev-word-text">{p.text}</span>
                  <span className="ev-word-label micro">{data.words[p.index!].label}</span>
                </span>
              ) : (
                <span key={i}>{p.text}</span>
              ),
            )}
          </p>
        </div>
      );
    }
    case "rayo-layers": {
      const [aw, ah] = data.aspect;
      return (
        <div className="ev ev-rayo" {...attrs} style={{ "--ar": `${aw} / ${ah}` } as CSSProperties}>
          <div className="ev-rayo-stack">
            {data.layers.map((l, i) => (
              <div
                key={l.name}
                className="ev-rayo-layer"
                data-layer={l.name}
                style={
                  {
                    left: `${l.offset.x * 100}%`,
                    top: `${l.offset.y * 100}%`,
                    width: `${l.offset.w * 100}%`,
                    height: `${l.offset.h * 100}%`,
                    // the spread: top −32% → bottom +30% of the stack, like R04 (Spec §09)
                    "--dy": `${(-0.32 + (0.62 * i) / Math.max(1, data.layers.length - 1)) * 100}%`,
                  } as CSSProperties
                }
              >
                <Cutout asset={l.asset} fill />
              </div>
            ))}
          </div>
        </div>
      );
    }
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
