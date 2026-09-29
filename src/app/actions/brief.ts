"use server";

export interface BriefInput {
  name: string;
  what: string;
  kind: "SaaS" | "Commerce" | "AI" | "Interactive";
  /** honeypot: must stay empty */
  company?: string;
}

export interface BriefResult {
  ok: boolean;
  /** true when an email was actually sent through the configured route */
  delivered: boolean;
  error?: string;
}

const KINDS = ["SaaS", "Commerce", "AI", "Interactive"] as const;

/**
 * Build 05 · the brief. Validates, then delivers through Resend's HTTP API when
 * RESEND_API_KEY + CONTACT_TO (+ optional CONTACT_FROM) are configured. Without those
 * env vars the brief is accepted but reported as not delivered, and the UI says so —
 * it never pretends a message was sent.
 */
export async function submitBrief(input: BriefInput): Promise<BriefResult> {
  const name = (input.name ?? "").trim().slice(0, 120);
  const what = (input.what ?? "").trim().slice(0, 2000);
  const kind = KINDS.includes(input.kind) ? input.kind : "SaaS";
  if (input.company) return { ok: true, delivered: false }; // bot: accept silently, send nothing
  if (name.length < 2) return { ok: false, delivered: false, error: "name" };
  if (what.length < 4) return { ok: false, delivered: false, error: "what" };

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM ?? "Build 05 <onboarding@resend.dev>";
  if (!key || !to) return { ok: true, delivered: false };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Build 05 · ${kind} · ${name}`,
        text: `Name: ${name}\nKind: ${kind}\n\n${what}\n`,
      }),
      cache: "no-store",
    });
    if (!res.ok) return { ok: true, delivered: false, error: `route ${res.status}` };
    return { ok: true, delivered: true };
  } catch {
    return { ok: true, delivered: false, error: "route" };
  }
}
