/**
 * The live builds that can open inside the portfolio (Live Project Windows).
 *
 * Source: each project's own repository (GitHub "homepage" field of Fran-Nu10/prospector,
 * Fran-Nu10/HairPortfolio and Fran-Nu10/Chef-Arturo). Each URL was checked on 2026-10-01:
 * HTTP 200, no X-Frame-Options, no Content-Security-Policy frame-ancestors — embeddable.
 * TravelSuite360 has no public build: null, never invented.
 *
 * Kept free of image imports so next.config.ts can read it (frame-src).
 */
export interface LiveBuild {
  url: string;
  /** host shown in the window strip */
  host: string;
  /** verified embeddable (no X-Frame-Options, no frame-ancestors) — else the window only offers OPEN LIVE */
  embeddable: boolean;
  /** the build is responsive: on desktop the window can also show it at phone width */
  responsive: boolean;
  /** date the headers were last checked */
  checked: string;
}

export const LIVE: Record<"travelsuite360" | "prospector" | "santi-nuca" | "chef-arturo", LiveBuild | null> = {
  travelsuite360: null,
  prospector: { url: "https://prospector-phi-virid.vercel.app/rayo-smash", host: "prospector · rayo-smash", embeddable: true, responsive: true, checked: "2026-10-01" },
  "santi-nuca": { url: "https://hair-portfolio-two.vercel.app", host: "santi nuca · live", embeddable: true, responsive: true, checked: "2026-10-01" },
  "chef-arturo": { url: "https://chef-arturoprod.vercel.app", host: "chef arturo · live", embeddable: true, responsive: true, checked: "2026-10-01" },
};

/** origins allowed in frame-src */
export const liveOrigins = Array.from(new Set(Object.values(LIVE).flatMap((b) => (b?.embeddable ? [new URL(b.url).origin] : []))));
