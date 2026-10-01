"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { setSystem, useSystem } from "@/lib/store";
import { projectById, type Project } from "@/data/projects";
import { Screen } from "./Screen";
import { EASE, gsap, isCompact, prefersReducedMotion } from "@/lib/motion";

/** the live build has this long to answer before the window falls back to the capture */
const TIMEOUT_MS = 12000;
/** the reachability probe gets a shorter leash: a host that does not answer at all fails fast */
const PROBE_MS = 8000;

/** probing: is the host reachable at all? · loading: the frame is mounted · ready: it painted */
type Phase = "probing" | "loading" | "ready" | "failed";

/**
 * INTERACT · the Live Project Window. One at a time, mounted only when the visitor asks for it
 * (nothing external loads before), never autoplayed. It grows out of the frontal window the
 * visitor was looking at and takes the frame (desktop) or the whole screen (phones, 100dvh).
 *
 * Gesture ownership is explicit: while it is open the page underneath is locked and inert, so
 * every scroll belongs to the project; BACK TO PORTFOLIO (or Esc) gives it back, at the same
 * scroll position, with focus on the control that opened it.
 *
 * It never shows a broken frame: until the build answers, the real capture stays on screen;
 * if it does not answer in time (offline, blocked, slow), the capture stays with OPEN LIVE ↗.
 */
export function LiveWindow() {
  const live = useSystem((s) => s.live);
  const project = live ? projectById[live.id as Project["id"]] : null;
  if (!live || !project?.live) return null;
  return <LiveWindowOpen key={live.id} project={project} from={live.from} />;
}

function LiveWindowOpen({ project, from }: { project: Project; from: { x: number; y: number; w: number; h: number } | null }) {
  const build = project.live!;
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closing = useRef(false);
  const [phase, setPhase] = useState<Phase>(() => (typeof navigator !== "undefined" && navigator.onLine === false ? "failed" : "probing"));
  const [device, setDevice] = useState<"full" | "phone">("full");
  const [compact] = useState(isCompact);
  // the first capture of every build is its real landing screen
  const poster = project.captures[0];

  // lock the page underneath: the project owns every gesture while it is open
  useLayoutEffect(() => {
    opener.current = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const scenes = document.querySelector<HTMLElement>(".scenes");
    const prev = { html: html.style.overflow, body: document.body.style.overflow };
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    scenes?.setAttribute("inert", "");
    backRef.current?.focus({ preventScroll: true });
    return () => {
      html.style.overflow = prev.html;
      document.body.style.overflow = prev.body;
      scenes?.removeAttribute("inert");
      opener.current?.focus?.({ preventScroll: true });
    };
  }, []);

  // the window grows out of the frontal window it was opened from (a mask, not a fade)
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame || !from || prefersReducedMotion()) return;
    const r = frame.getBoundingClientRect();
    const inset = `inset(${Math.max(0, from.y - r.top)}px ${Math.max(0, r.right - (from.x + from.w))}px ${Math.max(0, r.bottom - (from.y + from.h))}px ${Math.max(0, from.x - r.left)}px)`;
    const tw = gsap.fromTo(frame, { clipPath: inset }, { clipPath: "inset(0px 0px 0px 0px)", duration: 0.55, ease: EASE.product });
    return () => {
      tw.kill();
    };
  }, [from]);

  // A frame's load event also fires on the browser's own error page, so a frame is only mounted
  // once the host has answered (an opaque no-cors response is enough: it proves the network path).
  useEffect(() => {
    if (phase !== "probing") return;
    const ctl = new AbortController();
    const t = window.setTimeout(() => ctl.abort(), PROBE_MS);
    fetch(build.url, { mode: "no-cors", cache: "no-store", signal: ctl.signal, referrerPolicy: "strict-origin-when-cross-origin" })
      .then(() => setPhase((p) => (p === "probing" ? "loading" : p)))
      .catch(() => setPhase((p) => (p === "probing" ? "failed" : p)))
      .finally(() => window.clearTimeout(t));
    return () => {
      window.clearTimeout(t);
      ctl.abort();
    };
  }, [phase, build.url]);

  // a build that does not answer in time falls back to its capture
  useEffect(() => {
    if (phase !== "loading") return;
    const t = window.setTimeout(() => setPhase((p) => (p === "loading" ? "failed" : p)), TIMEOUT_MS);
    const offline = () => setPhase("failed");
    window.addEventListener("offline", offline);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("offline", offline);
    };
  }, [phase]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const frame = frameRef.current;
    const done = () => setSystem({ live: null });
    if (!frame || prefersReducedMotion()) return done();
    gsap.to(frame, { clipPath: "inset(0px 0px 100% 0px)", duration: 0.35, ease: EASE.product, onComplete: done });
  }, []);

  // Esc closes; Tab stays inside the window
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.key === "Tab" && rootRef.current) {
        const f = Array.from(rootRef.current.querySelectorAll<HTMLElement>("button, a[href], iframe")).filter((n) => !n.hasAttribute("disabled"));
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const phone = !compact && device === "phone";

  return (
    <div ref={rootRef} role="dialog" aria-modal="true" aria-label={`${project.name} · live build`} className="live fixed inset-0 z-[55] bg-graphite" style={{ overscrollBehavior: "contain" }}>
      <div className="dot-grid absolute inset-0" aria-hidden="true" />
      <div ref={frameRef} className="live-frame absolute flex flex-col">
        {/* the strip: what is open, and the way back */}
        <div className="live-strip t-mono flex items-stretch justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 px-3">
            <span className="inline-block h-2 w-2 shrink-0" style={{ background: phase === "ready" ? "var(--orange)" : "var(--edge)" }} aria-hidden="true" />
            <span className="shrink-0 text-bone">0{project.index} · {project.name}</span>
            <span className="hidden truncate text-bone-3 sm:inline">· {phase === "ready" ? "live · interact" : phase === "failed" ? "the live build did not answer" : "connecting to the live build"} · {build.host}</span>
          </div>
          <div className="flex items-stretch">
            {!compact && build.responsive && phase !== "failed" && (
              <div className="hidden items-stretch md:flex" role="group" aria-label="Viewport">
                {(["full", "phone"] as const).map((d) => (
                  <button key={d} type="button" className="live-btn" aria-pressed={device === d} onClick={() => setDevice(d)} style={{ color: device === d ? "var(--bone)" : "var(--bone-3)" }} data-cursor="magnet">
                    {d === "full" ? "Desktop" : "390 px"}
                  </button>
                ))}
              </div>
            )}
            <a href={build.url} target="_blank" rel="noopener noreferrer" className="live-btn text-bone" data-cursor="magnet">
              Open live <span aria-hidden="true">↗</span>
            </a>
            <button ref={backRef} type="button" onClick={close} className="live-btn live-back" data-cursor="magnet">
              <span aria-hidden="true">←</span> Back to portfolio
            </button>
          </div>
        </div>

        {/* the project: the capture holds the place until the live build answers */}
        <div className="live-body relative flex-1 overflow-hidden">
          <div className="absolute inset-0" aria-hidden={phase === "ready"}>
            {poster && <Screen capture={poster} fx={0.5} fy={0} sizes="100vw" />}
          </div>
          {(phase === "loading" || phase === "ready") && (
            <div className={`absolute inset-y-0 ${phone ? "left-1/2 w-[390px] -translate-x-1/2 border-x border-edge" : "inset-x-0"}`}>
              {phone && (
                <div className="t-dim pointer-events-none absolute -top-0 left-0 right-0 z-10 flex justify-center" aria-hidden="true">
                  <span className="bg-graphite px-2">390 px</span>
                </div>
              )}
              <iframe
                src={build.url}
                title={`${project.name} — live build`}
                className="live-iframe h-full w-full border-0 bg-[#0b0b0d]"
                style={{ opacity: phase === "ready" ? 1 : 0 }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="fullscreen; clipboard-write"
                onLoad={() => setPhase((p) => (p === "loading" ? "ready" : p))}
                onError={() => setPhase("failed")}
              />
            </div>
          )}
          {(phase === "probing" || phase === "loading") && (
            <div className="live-loading pointer-events-none absolute inset-x-0 top-0 h-[2px] overflow-hidden" aria-hidden="true">
              <div className="live-loading-bar h-full w-1/3 bg-orange" />
            </div>
          )}
          {(phase === "probing" || phase === "loading") && <p className="sr-only" role="status">Loading the live {project.name} build</p>}
          {phase === "failed" && (
            <div role="status" className="absolute inset-x-0 bottom-0 flex flex-col gap-3 border-t border-edge bg-[rgba(31,34,32,.94)] p-5 md:flex-row md:items-center md:justify-between">
              <p className="m-0 max-w-[560px] text-[14px] leading-[1.45] text-bone-2">
                The live build did not answer inside the window. The capture above is the real screen; the build itself opens in a new tab.
              </p>
              <a href={build.url} target="_blank" rel="noopener noreferrer" className="pw-btn t-mono shrink-0 justify-center" style={{ background: "var(--orange)", color: "var(--graphite)", minHeight: 44 }}>
                Open live <span aria-hidden="true">↗</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
