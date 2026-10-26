import { ACCENT_POINT, GRID, GRID_LINES, LOOSE, VISION_VIEWBOX, freePath, gridPath, moduleRect } from "@/lib/vision";
import { VisionScene } from "./VisionScene";

export interface VisionView {
  /** «Distintas disciplinas.» / «Una sola visión.» — the second line in the accent */
  heading: [string, string];
  stages: { word: string; line: string }[];
  close: string;
}

const V = VISION_VIEWBOX;
const POINT = 3.4;
const POINT_ACCENT = 5;

/** Pensar: the nine points loose, a free line through them */
function FigThink() {
  return (
    <>
      <path className="vf-line" d={freePath()} pathLength={1} data-part="draw" />
      {LOOSE.map(([x, y], i) => (
        <circle key={i} className={i === ACCENT_POINT ? "vf-point vf-accent" : "vf-point"} cx={x} cy={y} r={i === ACCENT_POINT ? POINT_ACCENT : POINT} data-point={i} />
      ))}
    </>
  );
}

/** Diseñar: the same points on the grid, its guides, an orthogonal path */
function FigDesign() {
  return (
    <>
      <g className="vf-guides" data-part="guides">
        {GRID_LINES.map((g) => (
          <line key={`v${g}`} x1={g} y1={6} x2={g} y2={V - 6} />
        ))}
        {GRID_LINES.map((g) => (
          <line key={`h${g}`} x1={6} y1={g} x2={V - 6} y2={g} />
        ))}
      </g>
      <path className="vf-line" d={gridPath()} pathLength={1} data-part="draw" />
      {GRID.map(([x, y], i) => (
        <circle key={i} className={i === ACCENT_POINT ? "vf-point vf-accent" : "vf-point"} cx={x} cy={y} r={i === ACCENT_POINT ? POINT_ACCENT : POINT} data-point={i} />
      ))}
    </>
  );
}

/** Construir: every point a module, one solid block — the accent at its centre */
function FigBuild() {
  return (
    <>
      {GRID.map((_, i) => {
        const r = moduleRect(i);
        return <rect key={i} className={i === ACCENT_POINT ? "vf-module vf-accent" : "vf-module"} x={r.x} y={r.y} width={r.w} height={r.h} data-module={i} />;
      })}
    </>
  );
}

const FIGS = [FigThink, FigDesign, FigBuild];

/**
 * «Distintas disciplinas. Una sola visión.» (docs/27 §3, Content Master 25), between THE SHIFT and
 * the services (docs/28). It replaced the capabilities' opening line «Todo lo anterior pasó por las mismas
 * manos.» — which read as if every photograph and brand of the projects were Franco's: this says how
 * the work is done, not who made each asset. Three stages — Pensar → Diseñar → Construir — show one
 * figure in three states (lib/vision), joined by one accent conductor — a stretch from each stage
 * to the next, the last into the close (down the column on phones and tablets, across on wide screens). The static page already reads as the transformation;
 * VisionScene only plays it with the scroll (scrubbed, reversible, no pin). Reduced motion and no JS:
 * the three states as they are. The figures are decorative: the words carry the meaning.
 */
export function Vision({ view }: { view: VisionView }) {
  return (
    <section id="vision" aria-labelledby="vision-h" data-section="vision" className="vision">
      <h2 id="vision-h" className="vision-title">
        <span className="vision-title-line" data-part="title">
          {view.heading[0]}
        </span>{" "}
        <span className="vision-title-line vision-accent" data-part="title">
          {view.heading[1]}
        </span>
      </h2>
      <div className="vision-body">
        <ol className="vision-stages">
          {view.stages.map((s, k) => {
            const Fig = FIGS[k];
            return (
              <li key={s.word} className="vision-stage" data-stage={k}>
                <svg className="vision-fig" viewBox={`0 0 ${V} ${V}`} aria-hidden="true" focusable="false">
                  <Fig />
                </svg>
                <span className="vision-node" aria-hidden="true" data-part="node" />
                {/* the conductor's stretch from this stage to the next (the last one leads to the close) */}
                <span className="vision-seg" aria-hidden="true" data-part="seg" />
                <h3 className="vision-word" data-part="text">
                  {s.word}
                </h3>
                <p className="vision-line" data-part="text">
                  {s.line}
                </p>
              </li>
            );
          })}
        </ol>
        <p className="vision-close" data-part="close">
          {view.close}
        </p>
      </div>
      <VisionScene />
    </section>
  );
}
