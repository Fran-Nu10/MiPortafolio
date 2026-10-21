import { SITE } from "@/data/site";

/**
 * When this module was evaluated (build time for the static routes): the form's timing
 * check falls back to it without JavaScript, and the footer year comes from it.
 */
export const RENDERED_AT = Date.now();

/**
 * The optional sections (Spec §13): off until their media is approved. A preview build may show
 * their placeholders (`PREVIEW_MOMENTS=1` at build time, never on Vercel production) — the
 * sections carry no copy and no evidence claim, so a placeholder there is honest.
 */
const PREVIEW_MOMENTS = process.env.PREVIEW_MOMENTS === "1" && process.env.VERCEL_ENV !== "production";
export const FEATURES = {
  humanMoment: SITE.features.humanMoment || PREVIEW_MOMENTS,
  francoAtWork: SITE.features.francoAtWork || PREVIEW_MOMENTS,
};
