import type { CSSProperties, ReactNode } from "react";

interface CotaProps {
  /** horizontal or vertical dimension line */
  dir?: "h" | "v";
  /** length in px or CSS length */
  length: number | string;
  label?: ReactNode;
  sub?: ReactNode;
  tone?: "orange" | "bone" | "muted";
  className?: string;
  style?: CSSProperties;
  /** where the label sits relative to the line */
  labelSide?: "after" | "before";
}

const colors = { orange: "var(--orange)", bone: "var(--bone)", muted: "var(--bone-3)" };

/**
 * T1/T2 dimension line: a hairline with end ticks and a mono label. Draw-on is done
 * by the scenes (scaleX/scaleY from 0) so the component stays static and cheap.
 */
export function Cota({ dir = "h", length, label, sub, tone = "orange", className = "", style, labelSide = "after" }: CotaProps) {
  const c = colors[tone];
  const len = typeof length === "number" ? `${length}px` : length;
  const isH = dir === "h";
  return (
    <div className={`cota relative ${className}`} style={{ width: isH ? len : 1, height: isH ? 1 : len, ...style }} data-dir={dir}>
      <div className="cota-line absolute inset-0" style={{ background: c, transformOrigin: isH ? "left center" : "center top" }} />
      <div className="absolute" style={isH ? { left: 0, top: -6, width: 1, height: 13, background: c } : { top: 0, left: -6, height: 1, width: 13, background: c }} />
      <div className="absolute" style={isH ? { right: 0, top: -6, width: 1, height: 13, background: c } : { bottom: 0, left: -6, height: 1, width: 13, background: c }} />
      {(label || sub) && (
        <div
          className="cota-label t-dim absolute"
          style={
            isH
              ? { left: 0, top: labelSide === "after" ? 8 : -30, color: c }
              : { left: labelSide === "after" ? 12 : -12, top: 0, color: c, transform: labelSide === "before" ? "translateX(-100%)" : undefined }
          }
        >
          {label && <div style={{ color: tone === "orange" ? "var(--bone)" : c }}>{label}</div>}
          {sub && <div>{sub}</div>}
        </div>
      )}
    </div>
  );
}

/** T2 marker: a dormant ring that becomes a solid dot when its callout is drawn. */
export function Marker({ active = false, style, className = "", onClick, label }: { active?: boolean; style?: CSSProperties; className?: string; onClick?: () => void; label: string }) {
  const base = "absolute h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange";
  const inner = active ? "bg-orange" : "bg-[rgba(31,34,32,0.6)]";
  if (onClick) {
    return (
      <button type="button" aria-label={label} aria-pressed={active} onClick={onClick} className={`${base} ${inner} ${className} pointer-events-auto`} style={style} data-cursor="magnet">
        <span className="sr-only">{label}</span>
      </button>
    );
  }
  return <span aria-hidden="true" className={`${base} ${inner} ${className}`} style={style} />;
}

/** T2 callout: leader line + two mono lines. Positioned by the parent. */
export function Callout({ title, detail, width = 140, style, className = "" }: { title: ReactNode; detail?: ReactNode; width?: number; style?: CSSProperties; className?: string }) {
  return (
    <div className={`callout absolute flex items-start ${className}`} style={style}>
      <div className="callout-line mt-[4px] h-px" style={{ width, background: "var(--orange)", transformOrigin: "left center" }} />
      <div className="callout-text t-dim ml-2 -mt-[3px]">
        <div style={{ color: "var(--bone)" }}>{title}</div>
        {detail && <div>{detail}</div>}
      </div>
    </div>
  );
}
