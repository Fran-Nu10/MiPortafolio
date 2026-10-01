"use client";

import { useSystem } from "@/lib/store";
import { site } from "@/data/site";

/**
 * T0 · the drafting table: dot grid, hairline frame and the header strip with the
 * six-step counter. Fixed, above every scene, never interactive.
 */
export function Frame() {
  const { step, status, section, note, frame, grid, tone } = useSystem((s) => s);
  const paper = tone === "paper";
  const line = paper ? "rgba(20,18,15,0.55)" : "var(--hairline)";
  const text = paper ? "#8a8a86" : "var(--bone-3)";
  const strong = paper ? "#14120f" : "var(--bone)";
  const complete = step >= 6;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40">
      <div className="frame-grid dot-grid absolute inset-0 transition-opacity duration-500" style={{ opacity: grid }} />
      {/* the header band: content that flows under the strip never collides with the counter */}
      <div className="absolute left-0 right-0 top-0 transition-colors duration-300" style={{ height: "calc(var(--frame-top) - 12px)", background: paper ? "#f4f3f0" : "var(--graphite)" }} />
      {/* hairline frame */}
      <div className="frame-line absolute transition-opacity duration-500" style={{ inset: "var(--frame-inset)", top: "var(--frame-top)", border: `1px solid ${line}`, opacity: frame }} />
      {/* header strip */}
      <div
        className="t-mono absolute flex items-center justify-between"
        style={{ left: "var(--frame-inset)", right: "var(--frame-inset)", top: "calc(var(--frame-top) - 32px)", color: text }}
      >
        <div className="flex items-center gap-5">
          <span style={{ color: strong, fontWeight: 500 }}>{site.initials}</span>
          <span className="hidden sm:inline">{section}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-block h-2 w-2" style={{ background: complete ? strong : "var(--orange)" }} />
          <span style={{ color: strong }}>{status}</span>
          <span aria-live="polite">
            {String(Math.min(step, 6)).padStart(2, "0")} / 06
          </span>
        </div>
        <div className="hidden md:block">{note}</div>
      </div>
    </div>
  );
}
