"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Project } from "@/data/projects";
import { setSystem } from "@/lib/store";

type Tone = "graphite" | "paper" | "ink";

const tones: Record<Tone, { line: string; text: string; strong: string; bg: string }> = {
  graphite: { line: "var(--bone)", text: "var(--bone-3)", strong: "var(--bone)", bg: "var(--graphite)" },
  paper: { line: "#14120f", text: "#6b6a66", strong: "#14120f", bg: "#f4f3f0" },
  ink: { line: "var(--bone-3)", text: "var(--bone-3)", strong: "var(--bone)", bg: "#0b0b0d" },
};

/**
 * PRESENT. The frontal window a project ends in: one strip (sheet, name, what is on screen,
 * the live controls) and the real screen. It can arrive from construction: `--rot` 0 is the
 * isometric slab, 1 is frontal (the same camera as the Stack), `--s` scales it.
 *
 * Desktop: the window keeps the capture's ratio and takes ~85 % of the frame.
 * Compact: a portrait window, nearly the full useful width, controls under it (44 px targets).
 */
export function ProjectWindow({
  project,
  label,
  tone = "graphite",
  className = "",
  style,
  children,
  controls = true,
}: {
  project: Project;
  /** what is on screen right now (updated by the scene through `.pw-label`) */
  label?: ReactNode;
  tone?: Tone;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  controls?: boolean;
}) {
  const t = tones[tone];
  return (
    <div className={`pw-pos ${className}`} style={style}>
      <div className="pw-move">
        <div className="pw preserve-3d" style={{ ["--rot" as string]: 1, ["--s" as string]: 1, color: t.text }}>
          <div className="pw-strip t-mono flex items-center justify-between gap-3" style={{ borderColor: t.line, background: t.bg }}>
            <span className="flex min-w-0 items-center gap-2 truncate">
              <span style={{ color: t.strong }}>0{project.index} · {project.name}</span>
              <span className="pw-label hidden truncate sm:inline">{label}</span>
            </span>
            {controls && <LiveControls project={project} tone={tone} variant="strip" />}
          </div>
          <div className="pw-screen relative overflow-hidden" style={{ borderColor: t.line }}>
            {/* lines before surfaces: the outline is the border, the surface fills with --fill */}
            <div className="pw-fill absolute inset-0" style={{ background: t.bg }}>{children}</div>
          </div>
          {controls && <LiveControls project={project} tone={tone} variant="bar" />}
        </div>
      </div>
    </div>
  );
}

/**
 * INTERACT is a real button (it opens the Live Project Window, nothing loads before that);
 * OPEN LIVE is a real link. A project without a public build shows neither.
 */
export function LiveControls({ project, tone = "graphite", variant }: { project: Project; tone?: Tone; variant: "strip" | "bar" }) {
  const live = project.live;
  if (!live) return null;
  const t = tones[tone];
  const open = (e: React.MouseEvent<HTMLButtonElement>) => {
    const win = (e.currentTarget.closest(".pw") as HTMLElement | null)?.querySelector(".pw-screen") as HTMLElement | null;
    const r = win?.getBoundingClientRect();
    setSystem({ live: { id: project.id, from: r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null } });
  };
  const cls = variant === "strip" ? "pw-controls-strip hidden md:flex" : "pw-controls-bar flex md:hidden";
  return (
    <div className={`${cls} items-stretch`}>
      {live.embeddable && (
        <button type="button" onClick={open} className="pw-btn t-mono" style={{ color: tone === "paper" ? "#f4f3f0" : "var(--graphite)", background: "var(--orange)" }} data-cursor="magnet" aria-label={`Interact with the live ${project.name} build`}>
          <span aria-hidden="true">▸</span> Interact
        </button>
      )}
      <a href={live.url} target="_blank" rel="noopener noreferrer" className="pw-btn t-mono" style={{ color: t.strong, borderColor: t.line }} data-cursor="magnet" aria-label={`Open the live ${project.name} build in a new tab`}>
        Open live <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
