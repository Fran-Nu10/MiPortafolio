/**
 * The brief (Spec §14): parsing, validation, layered spam protection and delivery through
 * Resend's HTTP API over `fetch` (no SDK). Pure and dependency-injected so it is unit
 * tested; `app/actions/brief.ts` is the thin server-action wrapper.
 *
 * Success is returned only after Resend answers 2xx (Content Master claim 38). Missing
 * configuration is an error, never a silent "accepted".
 */

export interface BriefValues {
  name: string;
  email: string;
  brief: string;
}

export interface BriefFieldErrors {
  name?: "missing";
  email?: "missing" | "invalid";
  brief?: "missing";
}

export type BriefState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      /** changes on every response, so the form can tell a fresh server error from a stale one */
      id: string;
      fields?: BriefFieldErrors;
      /** delivery failed (Resend non-2xx, network, missing env, rate limit) */
      route?: true;
      /** echoed back so a no-JS re-render keeps what the visitor wrote */
      values: BriefValues;
      /**
       * the original render timestamp, echoed back: a no-JS re-render must not restart the
       * timing check, or a quick correction would be mistaken for a bot (silent success)
       */
      t: number;
    };

export const BRIEF_INITIAL: BriefState = { status: "idle" };

export const LIMITS = {
  name: { min: 2, max: 120 },
  email: { max: 254 },
  brief: { min: 4, max: 2000 },
  /** a human needs more than this between render and submit */
  minFillMs: 3000,
  rate: { max: 5, windowMs: 10 * 60 * 1000 },
} as const;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readValues(fd: FormData): BriefValues {
  const get = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v : "";
  };
  return {
    name: get("name").trim().slice(0, LIMITS.name.max),
    email: get("email").trim().slice(0, LIMITS.email.max),
    brief: get("brief").trim().slice(0, LIMITS.brief.max),
  };
}

/** identical on client and server; the server is the authority */
export function validateBrief(v: BriefValues): BriefFieldErrors | undefined {
  const e: BriefFieldErrors = {};
  if (v.name.trim().length < LIMITS.name.min) e.name = "missing";
  const email = v.email.trim();
  if (!email) e.email = "missing";
  else if (email.length > LIMITS.email.max || !EMAIL_PATTERN.test(email)) e.email = "invalid";
  if (v.brief.trim().length < LIMITS.brief.min) e.brief = "missing";
  return Object.keys(e).length ? e : undefined;
}

/** completion readout, 0–100: name 20 · email 20 · brief 60 scaling up to 140 chars */
export function briefCompletion(v: BriefValues): number {
  const name = v.name.trim().length >= LIMITS.name.min ? 20 : v.name.trim() ? 10 : 0;
  const email = EMAIL_PATTERN.test(v.email.trim()) ? 20 : v.email.trim() ? 10 : 0;
  const brief = Math.round(Math.min(v.brief.trim().length / 140, 1) * 60);
  return Math.min(100, name + email + brief);
}

/** in-memory sliding window per IP (best effort per server instance — Spec §14) */
export function createRateLimiter(max: number = LIMITS.rate.max, windowMs: number = LIMITS.rate.windowMs) {
  const hits = new Map<string, number[]>();
  return {
    /** true when this submission is allowed (and records it) */
    allow(key: string, now: number): boolean {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= max) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      // keep the map from growing without bound
      if (hits.size > 5000) for (const [k, ts] of hits) if (!ts.some((t) => now - t < windowMs)) hits.delete(k);
      return true;
    },
  };
}

export interface BriefEnv {
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

export interface BriefDeps {
  env: BriefEnv;
  ip: string;
  now: number;
  fetch: typeof fetch;
  limiter: ReturnType<typeof createRateLimiter>;
}

export async function processBrief(fd: FormData, deps: BriefDeps): Promise<BriefState> {
  const values = readValues(fd);
  const id = String(deps.now);

  // (1) honeypot and (2) timing: answer like a success and send nothing
  const company = fd.get("company");
  if (typeof company === "string" && company.trim() !== "") return { status: "success" };
  const t = Number(fd.get("t"));
  if (!Number.isFinite(t) || t <= 0 || deps.now - t < LIMITS.minFillMs) return { status: "success" };

  // (4) validation + length caps (applied in readValues)
  const fields = validateBrief(values);
  if (fields) return { status: "error", id, fields, values, t };

  // (3) rate limit: same message as any delivery failure (no hint for bots)
  if (!deps.limiter.allow(deps.ip, deps.now)) return { status: "error", id, route: true, values, t };

  const { RESEND_API_KEY: key, CONTACT_TO: to, CONTACT_FROM: from } = deps.env;
  if (!key || !to || !from) return { status: "error", id, route: true, values, t };

  // (5) plain text only; reply goes to the visitor
  try {
    const res = await deps.fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: values.email,
        subject: `Brief · ${values.name}`,
        text: `Nombre: ${values.name}\nEmail: ${values.email}\n\n${values.brief}\n`,
      }),
      cache: "no-store",
    });
    if (res.status >= 200 && res.status < 300) return { status: "success" };
    return { status: "error", id, route: true, values, t };
  } catch {
    return { status: "error", id, route: true, values, t };
  }
}
