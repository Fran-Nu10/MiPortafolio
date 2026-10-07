"use server";

import { headers } from "next/headers";
import { createRateLimiter, processBrief, type BriefState } from "@/lib/brief";

/** one limiter per server instance (best effort on serverless — Spec §14) */
const limiter = createRateLimiter();

/**
 * The brief's server action. Used through `useActionState`, so the form works without
 * JavaScript (plain POST) and, with it, gets pending/error states without a reload.
 */
export async function submitBrief(_prev: BriefState, formData: FormData): Promise<BriefState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return processBrief(formData, {
    env: {
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      CONTACT_TO: process.env.CONTACT_TO,
      CONTACT_FROM: process.env.CONTACT_FROM,
    },
    ip,
    now: Date.now(),
    fetch,
    limiter,
  });
}
