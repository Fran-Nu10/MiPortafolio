import type { Project } from "@/data/projects";
import { Screen } from "./Screen";

/**
 * The interface layer of a product system, drawn from its documented modules: the module index
 * (the system's real information architecture) and, per module, the layers it runs through.
 * When a module has a capture, the capture *is* the panel; until then the panel is a drawing
 * that says what the screen does — never an invented UI. Sized in container units, so the same
 * face reads on a 420 px slab, on a full-frame window and (stacked) in a portrait phone window.
 */
export function ModuleFace({ project, active = 0, panels = true }: { project: Project; active?: number; panels?: boolean }) {
  const modules = project.modules ?? [];
  return (
    <div className="mf relative h-full w-full">
      <div className="mf-body">
        {/* the module index: the system's IA */}
        <div className="mf-side">
          <div className="mf-name t-mono">{project.name}</div>
          <div className="mf-sep" />
          {modules.map((m, i) => (
            <div key={m.name} className="mf-item t-mono" data-i={i} data-on={i === active ? "1" : "0"}>
              <span className="mf-tick" />
              <span className="truncate">{m.name}</span>
            </div>
          ))}
        </div>
        {/* the panels: one per module, the scene swaps them */}
        <div className="relative flex-1">
          {panels ? (
            modules.map((m, i) => (
              <div key={m.name} className="mf-panel absolute inset-0" data-i={i} style={{ background: "var(--paper)", visibility: i === active ? "visible" : "hidden" }}>
                {m.capture ? <Screen capture={m.capture} fx={0.5} fy={0} sizes="(max-width: 1023px) 100vw, 70vw" /> : <ModulePanel project={project} index={i} />}
              </div>
            ))
          ) : (
            <ModulePanel project={project} index={active} />
          )}
        </div>
      </div>
    </div>
  );
}

function ModulePanel({ project, index }: { project: Project; index: number }) {
  const all = project.modules ?? [];
  const m = all[index];
  if (!m) return null;
  const rows: Array<[string, string]> = [["01 · interface", `${m.name} · screen`]];
  if (m.api.length) rows.push(["03 · api", m.api.join(" · ")]);
  rows.push(["04 · data", m.data.join(" · ")]);
  return (
    <div className="mf-panel-in">
      <div className="flex items-baseline justify-between gap-3">
        <div className="mf-title t-display">{m.name}</div>
        <div className="mf-meta t-mono shrink-0">module 0{index + 1} / 0{all.length}</div>
      </div>
      {/* the layers this screen runs through, drawn as dimension lines */}
      <div className="mf-rows">
        {rows.map(([k, v]) => (
          <div key={k} className="mf-row">
            <span className="mf-k t-mono">{k}</span>
            <span className="mf-line" />
            <span className="mf-v t-mono">{v}</span>
          </div>
        ))}
      </div>
      {/* the screen itself: reserved until its capture lands (public/projects/travelsuite360/) */}
      <div className="mf-slot">
        <span className="mf-meta t-mono">{m.name.toLowerCase()} · capture · reserved slot</span>
      </div>
    </div>
  );
}
