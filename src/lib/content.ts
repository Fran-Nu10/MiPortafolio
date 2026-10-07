import type { Gated, Project } from "@/data/types";

/**
 * Claim gating (Spec §21 rule 1): a `pending` value is [CONFIRMAR] in the Content Master.
 * It is never rendered and never reaches the HTML — server components read data only
 * through these helpers, and only confirmed values are passed on as props.
 */
export function confirmed<T>(g: Gated<T> | undefined): T | undefined {
  return g?.status === "confirmed" ? g.value : undefined;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "0n / 04" */
export function indexLabel(index: number, total: number): string {
  return `${pad2(index)} / ${pad2(total)}`;
}

/** Chef's proof line upgrades only when Mercado Pago live is confirmed (Spec §21 rule 4) */
export const CHEF_PAYMENTS_PROOF = "Tienda real, con pagos en producción.";

/** the proof caption: only confirmed sentence(s) */
export function proofCaption(p: Project): string {
  const base = p.id === "chef-arturo" && confirmed(p.paymentsLive) === true ? CHEF_PAYMENTS_PROOF : p.proofLine;
  const extra = confirmed(p.proofLineExtra);
  return extra ? `${base} ${extra}` : base;
}

/** "Stack · Next.js 15 · Tailwind v4 · …" — the whole line is omitted unless confirmed */
export function stackLine(p: Project, label: string): string | undefined {
  const stack = confirmed(p.stack);
  return stack && stack.length ? [label, ...stack].join(" · ") : undefined;
}

/** the route-error sentence; the email completes it only once confirmed */
export function routeErrorText(base: string, emailJoiner: string, email: string | undefined): string {
  return email ? `${base} ${emailJoiner} ${email}` : `${base}.`;
}
