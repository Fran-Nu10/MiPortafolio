import type { Project } from "@/data/projects";

/**
 * The honest slot for a screen that has not been captured yet. It carries only the
 * documented module names — never an invented interface — and is replaced by a real
 * capture (a <Capture/>) without any structural change.
 */
export function ReservedFace({ project, screen }: { project: Project; screen: string }) {
  return (
    <div className="relative flex h-full w-full flex-col" style={{ background: "var(--paper)", color: "var(--ink)" }}>
      <div className="flex h-full">
        <div className="flex w-[30%] flex-col gap-2 border-r border-[#e4e7ea] p-3">
          <div className="t-mono" style={{ fontSize: 9, color: "var(--ink)" }}>{project.name}</div>
          {project.layers[2].parts.slice(0, 5).map((m) => (
            <div key={m} className="t-mono" style={{ fontSize: 8, color: "#6b7280" }}>
              {m}
            </div>
          ))}
        </div>
        <div className="relative flex-1 p-3">
          <div className="absolute inset-3 border border-dashed border-[#c9ccd1]" />
          <div className="t-mono absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center" style={{ fontSize: 9, color: "#8a94a0" }}>
            {screen}
            <br />
            capture reserved
          </div>
        </div>
      </div>
    </div>
  );
}
