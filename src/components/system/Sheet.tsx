import type { Project } from "@/data/projects";

const isConfirmed = (v?: string) => !!v && !v.startsWith("[");

/** Left rail of a project sheet: title, category and the documented answers only. */
export function Rail({ project, paper = false, compact = false }: { project: Project; paper?: boolean; compact?: boolean }) {
  const ink = paper ? "#3e3e3e" : "var(--bone-2)";
  const strong = paper ? "#14120f" : "var(--bone)";
  const rows: Array<[string, string | undefined]> = [
    ["What", project.what],
    ["Challenge", project.challenge],
    ["Made", project.made],
    ["Role", project.role],
  ];
  return (
    <div className="rail flex flex-col gap-3" style={{ color: ink }}>
      <h2 className="t-display m-0 whitespace-pre-line" style={{ fontSize: compact ? 36 : "clamp(36px, 3.6vw, 56px)", color: strong }}>
        {project.displayName}
      </h2>
      <div className="t-mono" style={{ color: paper ? "#8a8a86" : "var(--bone-3)" }}>{project.category}</div>
      {rows.filter(([, v]) => isConfirmed(v)).map(([k, v]) => (
        <div key={k} className={`flex-col gap-1 border-t pt-2 ${compact ? "hidden md:flex" : "hidden md:flex"}`} style={{ borderColor: paper ? "rgba(20,18,15,.25)" : "var(--edge)" }}>
          <div className="t-dim">{k}</div>
          <p className="m-0 text-[13px] leading-[1.45]" style={{ textWrap: "pretty" }}>{v}</p>
        </div>
      ))}
    </div>
  );
}

/** The title block that signs every sheet: project · sheet number · stack (documented only) · drawn by. */
export function TitleBlock({ project, type }: { project: Project; type: string }) {
  return (
    <div className="title-block t-mono grid grid-cols-2 border border-edge" style={{ width: 340, fontSize: 10 }}>
      <div className="border-b border-r border-edge px-3 py-2"><span className="text-bone-3">Project</span><br />{project.name}</div>
      <div className="border-b border-edge px-3 py-2"><span className="text-bone-3">Sheet</span><br />0{project.index} / 04 · {type}</div>
      <div className="border-r border-edge px-3 py-2"><span className="text-bone-3">Stack</span><br />{project.stack.length ? project.stack.join(" · ") : "—"}</div>
      <div className="px-3 py-2"><span className="text-bone-3">Drawn by</span><br />F. Núñez</div>
    </div>
  );
}
