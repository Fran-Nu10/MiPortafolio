import type { Project } from "@/data/projects";

/**
 * The head of a project sheet in V2: sheet number, name, category and the structural claim.
 * Short on purpose — the product underneath takes the frame.
 */
export function SheetHead({ project, paper = false, className = "" }: { project: Project; paper?: boolean; className?: string }) {
  const strong = paper ? "#14120f" : "var(--bone)";
  const dim = paper ? "#6b6a66" : "var(--bone-3)";
  return (
    <div className={`sheet-head ${className}`}>
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="t-dim">03.0{project.index} · lámina 0{project.index} / 04</div>
        <h2 className="sheet-name t-display m-0" style={{ color: strong }}>{project.name}</h2>
        <div className="t-mono" style={{ color: dim }}>
          {project.category}
          {project.stack.length > 0 && <span className="hidden lg:inline"> · {project.stack.join(" · ")}</span>}
        </div>
        {/* the documented description, for readers who don't watch the drawing */}
        <p className="sr-only">{project.what}</p>
      </div>
      <p className="m-0 hidden max-w-[400px] pb-1 text-right text-[14px] leading-[1.45] md:block" style={{ color: paper ? "#3e3e3e" : "var(--bone-2)", textWrap: "pretty" }}>
        {project.claim}
      </p>
    </div>
  );
}
