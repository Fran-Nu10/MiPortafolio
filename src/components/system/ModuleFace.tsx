import type { Project } from "@/data/projects";
import { Screen } from "./Screen";

/**
 * The interface layer of a product system, one face per documented module.
 * A module with a capture *is* its capture — the real screen, whole, sidebar included.
 * A module without one is drawn from the documentation: the system's module index and the
 * layers that module runs through — never an invented UI. Faces stack in module order, so a
 * scene steps through them by revealing the next one. Sized in container units: the same
 * face reads on a 420 px slab, a full-frame window and (stacked) a portrait phone window.
 */
export function ModuleFace({ project, active = 0, panels = true }: { project: Project; active?: number; panels?: boolean }) {
  const modules = project.modules ?? [];
  const face = (i: number, sizes: string) => {
    const m = modules[i];
    if (!m) return null;
    return m.capture ? <Screen capture={m.capture} fx={m.fx ?? 0.5} fy={m.fy ?? 0} zm={m.zm} sizes={sizes} /> : <DrawnFace project={project} active={i} />;
  };
  if (!panels) return <div className="relative h-full w-full bg-paper">{face(active, "420px")}</div>;
  return (
    <div className="relative h-full w-full bg-paper">
      {modules.map((m, i) => (
        <div key={m.name} className="mf-panel absolute inset-0 bg-paper" data-i={i} style={{ visibility: i === active ? "visible" : "hidden" }}>
          {face(i, "(max-width: 1023px) 1100px, 88vw")}
        </div>
      ))}
    </div>
  );
}

/** a module that has no capture yet: the module index + the layers it runs through */
function DrawnFace({ project, active }: { project: Project; active: number }) {
  const modules = project.modules ?? [];
  const m = modules[active];
  const rows: Array<[string, string]> = [["01 · interface", `${m.name} · screen`]];
  if (m.api.length) rows.push(["03 · api", m.api.join(" · ")]);
  rows.push(["04 · data", m.data.join(" · ")]);
  return (
    <div className="mf relative h-full w-full">
      <div className="mf-body">
        <div className="mf-side">
          <div className="mf-name t-mono">{project.name}</div>
          <div className="mf-sep" />
          {modules.map((x, i) => (
            <div key={x.name} className="mf-item t-mono" data-on={i === active ? "1" : "0"}>
              <span className="mf-tick" />
              <span className="truncate">{x.name}</span>
            </div>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="mf-panel-in">
            <div className="flex items-baseline justify-between gap-3">
              <div className="mf-title t-display">{m.name}</div>
              <div className="mf-meta t-mono shrink-0">module 0{active + 1} / 0{modules.length}</div>
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
        </div>
      </div>
    </div>
  );
}
