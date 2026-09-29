"use client";

import { useEffect, useState } from "react";

/**
 * 00 · Preloader — the same frame the hero uses, with the counter at 00/06 and the first
 * part arriving. It corresponds to real readiness (fonts + hydration) and never holds
 * the visitor: it leaves the moment the document is ready, 800 ms at most.
 */
export function Preloader() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setGone(true);
    };
    const t = window.setTimeout(finish, 800);
    if (document.fonts?.ready) document.fonts.ready.then(() => window.setTimeout(finish, 120));
    else finish();
    return () => window.clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <div aria-hidden="true" className="fixed inset-0 z-[60] bg-graphite" style={{ transition: "opacity .2s" }}>
      <div className="absolute" style={{ inset: "var(--frame-inset)", top: "calc(var(--frame-inset) + 16px)", border: "1px solid var(--hairline)" }} />
      <div className="t-mono absolute flex items-center gap-3" style={{ left: "var(--frame-inset)", top: "calc(var(--frame-inset) - 16px)", color: "var(--bone-3)" }}>
        <span style={{ color: "var(--bone)", fontWeight: 500 }}>FN</span>
        <span className="inline-block h-2 w-2 bg-orange" />
        <span>Assembling</span>
        <span>00 / 06</span>
      </div>
    </div>
  );
}
