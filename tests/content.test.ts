/**
 * Content guards (Spec §21 "Rules enforced by tests", §28 A2/A3/A21). The Content Master's
 * claim audit becomes build failures instead of reviews. The rendered-HTML checks run when a
 * production build exists (`npm run build` first).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ASSETS } from "@/data/assets";
import { CAPABILITIES } from "@/data/capabilities";
import { PROFILE } from "@/data/profile";
import { PROJECTS, getProject } from "@/data/projects";
import { SITE } from "@/data/site";
import type { Gated } from "@/data/types";
import { hasAsset, launchBlockers, resolveAsset } from "@/lib/assets";
import { CHEF_PAYMENTS_PROOF, confirmed, proofCaption, routeErrorText, stackLine } from "@/lib/content";

// ── helpers ──────────────────────────────────────────────────────────────────

/** keys whose strings are internal (never rendered) */
const INTERNAL_KEYS = new Set(["note", "source", "candidates", "key", "id", "href", "src", "type", "lang"]);

function isGated(v: unknown): v is Gated<unknown> {
  return typeof v === "object" && v !== null && "status" in v && ((v as { status: unknown }).status === "pending" || (v as { status: unknown }).status === "confirmed") && !("kind" in v);
}

/** every string that can reach the page: pending gated values and internal notes excluded */
function renderable(value: unknown, path = "", out: { path: string; text: string }[] = []) {
  if (typeof value === "string") out.push({ path, text: value });
  else if (Array.isArray(value)) value.forEach((v, i) => renderable(v, `${path}[${i}]`, out));
  else if (typeof value === "function") renderable((value as (n: number) => unknown)(2026), `${path}()`, out);
  else if (value && typeof value === "object") {
    if (isGated(value) && value.status === "pending") return out;
    for (const [k, v] of Object.entries(value)) if (!INTERNAL_KEYS.has(k)) renderable(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}

/** pending values: they must never appear in the HTML */
function pendingValues(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => pendingValues(v, out));
  else if (value && typeof value === "object") {
    if (isGated(value) && value.status === "pending") {
      const v = (value as { value?: unknown }).value;
      if (typeof v === "string") out.push(v);
      if (Array.isArray(v)) out.push(...v.filter((x): x is string => typeof x === "string"));
      return out;
    }
    for (const v of Object.values(value)) pendingValues(v, out);
  }
  return out;
}

const SITE_STRINGS = [
  ...renderable(SITE, "SITE"),
  ...renderable(PROJECTS, "PROJECTS"),
  ...renderable(CAPABILITIES, "CAPABILITIES"),
  ...renderable(PROFILE, "PROFILE"),
  ...ASSETS.flatMap((a) => (a.alt ? [{ path: `ASSETS.${a.key}.alt`, text: a.alt }] : [])),
];

const TS = getProject("travelsuite360")!;
const RAYO = getProject("rayo-smash")!;
const SANTI = getProject("santi-nuca")!;
const CHEF = getProject("chef-arturo")!;

// ── rule 1 · pending is never rendered ─────────────────────────────────────

describe("rule 1 · gated claims", () => {
  it("confirmed() drops pending values", () => {
    expect(confirmed({ status: "pending", value: "x" })).toBeUndefined();
    expect(confirmed({ status: "confirmed", value: "x" })).toBe("x");
  });

  it("year, live URL and stack lines appear only when confirmed", () => {
    for (const p of PROJECTS) {
      expect(p.year.status).toBe("pending");
      expect(confirmed(p.liveUrl)).toBeUndefined();
    }
    expect(stackLine(RAYO, SITE.world.stackLabel)).toBe("Stack · Next.js 15 · Tailwind v4 · Framer Motion · Apify");
    for (const p of [TS, SANTI, CHEF]) expect(stackLine(p, SITE.world.stackLabel)).toBeUndefined();
    expect(confirmed(PROFILE.stack)).toBeUndefined();
    expect(confirmed(PROFILE.contacts.email)).toBeUndefined();
    expect(confirmed(PROFILE.contacts.linkedin)).toBeUndefined();
  });

  it("Rayo's second proof sentence ships only once confirmed", () => {
    expect(proofCaption(RAYO)).toBe("Demo real, navegable.");
  });

  it("the route error omits the unconfirmed email", () => {
    expect(routeErrorText(SITE.cta.errors.route, SITE.cta.errors.routeEmail, confirmed(PROFILE.contacts.email))).toBe(
      "No se envió. Probá de nuevo.",
    );
    expect(routeErrorText(SITE.cta.errors.route, SITE.cta.errors.routeEmail, "hola@ejemplo.com")).toBe(
      "No se envió. Probá de nuevo o escribí a hola@ejemplo.com",
    );
  });

  it("no rendered string carries a [CONFIRMAR] marker", () => {
    for (const s of SITE_STRINGS) expect(s.text, s.path).not.toMatch(/CONFIRMAR/i);
  });
});

// ── rule 2 · TravelSuite360 is a partnership ─────────────────────────────────

describe("rule 2 · TravelSuite360 role", () => {
  // "en un solo lugar" (Content Master one-liner) is the only allowed "solo": it means "one place"
  const FORBIDDEN = [/fundador/i, /founder/i, /por mi cuenta/i, /(?<!un )\bsolo\b/i, /\bsola\b/i, /fund[eé]\b/i];

  it("role is exactly «Socio · Producto e ingeniería»", () => {
    expect(TS.role).toBe("Socio · Producto e ingeniería");
    expect(TS.reelLine).toBe("SaaS para agencias de viaje · Socio · Producto e ingeniería");
    expect(TS.proofLine).toBe("Producto real, en uso en tres agencias.");
  });

  it("no string about TravelSuite360 says founder, solo or por mi cuenta", () => {
    const tsStrings = [...renderable(TS, "TS"), ...SITE_STRINGS.filter((s) => s.text.includes("TravelSuite360"))];
    for (const s of tsStrings) for (const re of FORBIDDEN) expect(s.text, `${s.path}: ${re}`).not.toMatch(re);
  });

  it("nothing on the site says fundador / founder", () => {
    for (const s of SITE_STRINGS) expect(s.text, s.path).not.toMatch(/fundador|founder/i);
  });

  it("meta and profile name the partnership", () => {
    expect(SITE.meta.description).toContain("Socio de TravelSuite360, a cargo del software.");
    expect(PROFILE.core).toContain("Soy socio de TravelSuite360 y llevo toda su área de software");
  });
});

// ── rule 3 · Santi Nuca's photography ────────────────────────────────────────

describe("rule 3 · Santi Nuca credit", () => {
  it("credit holder is Santi Nuca", () => {
    expect(SANTI.credit).toEqual({ label: "Fotografía", holder: "Santi Nuca" });
    expect(SANTI.role).toBe("Diseño y desarrollo");
  });

  it("every Santi image alt ends with «fotografía de Santi Nuca»", () => {
    const santi = ASSETS.filter((a) => a.key.startsWith("santi.") && a.alt);
    expect(santi.length).toBeGreaterThan(0);
    for (const a of santi) expect(a.alt, a.key).toMatch(/fotografía de Santi Nuca$/);
  });

  it("no string attributes the photographs to Franco", () => {
    for (const s of SITE_STRINGS) expect(s.text, s.path).not.toMatch(/fotograf[ií]a(s)? (de|por) Franco/i);
  });
});

// ── rule 4 · Chef Arturo's proof line ────────────────────────────────────────

describe("rule 4 · Chef Arturo", () => {
  it("proof line is «Tienda real, en línea.» while Mercado Pago live is unconfirmed", () => {
    expect(CHEF.paymentsLive?.status).toBe("pending");
    expect(proofCaption(CHEF)).toBe("Tienda real, en línea.");
    expect(proofCaption({ ...CHEF, paymentsLive: { status: "confirmed", value: true } })).toBe(CHEF_PAYMENTS_PROOF);
  });

  it("role, and no brand or photography credited to Franco", () => {
    expect(CHEF.role).toBe("Producto, diseño y desarrollo");
    expect(CHEF.credit).toBeUndefined();
    for (const s of SITE_STRINGS) expect(s.text, s.path).not.toBe(CHEF_PAYMENTS_PROOF);
  });
});

// ── rule 5 · capability 06 without metrics ──────────────────────────────────

describe("rule 5 · capabilities", () => {
  it("six capabilities, five core and one extended", () => {
    expect(CAPABILITIES.map((c) => c.name)).toEqual([
      "Producto",
      "Ingeniería web",
      "Comercio digital",
      "IA + automatización",
      "Experiencias interactivas",
      "Adquisición de clientes",
    ]);
    expect(CAPABILITIES.filter((c) => c.group === "core")).toHaveLength(5);
    expect(CAPABILITIES[5].group).toBe("extended");
  });

  it("06 is «Publicidad en Meta Ads, orientada a ventas.» with no numbers", () => {
    const c6 = CAPABILITIES[5];
    expect(c6.statement).toBe("Publicidad en Meta Ads, orientada a ventas.");
    expect(c6.evidence.variant).toBe("typographic");
    expect(`${c6.name} ${c6.statement} ${c6.attribution.label}`).not.toMatch(/\d/);
  });

  it("any metric needs authorization and a source", () => {
    for (const c of CAPABILITIES) {
      if (c.evidence.variant !== "campaign") continue;
      for (const m of c.evidence.metrics) {
        expect(m.authorized, `${c.name}: ${m.label}`).toBe(true);
        expect(m.source, `${c.name}: ${m.label}`).toBeTruthy();
      }
    }
  });

  it("no unconfirmed advertising claim anywhere", () => {
    const BANNED = [/\bROAS\b/, /\bCPA\b/, /\bCPL\b/, /\bCTR\b/, /Google Ads/i, /TikTok/i, /growth/i, /marketing digital/i, /full-stack/i, /end-to-end/i, /\b360°/];
    for (const s of SITE_STRINGS) for (const re of BANNED) expect(s.text, `${s.path}: ${re}`).not.toMatch(re);
  });
});

// ── rule 6 · asset keys ──────────────────────────────────────────────────────

describe("rule 6 · asset contracts", () => {
  it("every referenced key exists in the registry", () => {
    const refs = [
      SITE.meta.ogImage,
      "franco.hero",
      "franco.bust",
      "franco.atWork",
      "moments.human",
      ...PROJECTS.flatMap((p) => [p.reel.poster, p.reel.loop, p.screen.poster, p.screen.object, p.proof.media, p.meta.ogImage]),
    ].filter((k): k is string => !!k);
    for (const k of refs) expect(hasAsset(k), k).toBe(true);
  });

  it("TravelSuite360 media never resolves to real files without the privacy sign-off", () => {
    for (const a of ASSETS.filter((x) => x.key.startsWith("ts."))) expect(resolveAsset(a.key).status, a.key).toBe("placeholder");
  });

  it("launch blockers are reported, not hidden", () => {
    expect(launchBlockers().map((c) => c.key)).toEqual(expect.arrayContaining(["franco.hero", "ts.reel.poster"]));
  });

  it("placeholders carry no imagery", () => {
    for (const a of ASSETS.filter((x) => x.status === "placeholder")) expect(a.files, a.key).toBeUndefined();
  });
});

// ── copy fidelity (A2) ───────────────────────────────────────────────────────

describe("copy fidelity · Content Master rev 26", () => {
  it("hero, firma and positioning", () => {
    expect(SITE.hero.name).toEqual(["FRANCO", "NÚÑEZ"]);
    expect(SITE.hero.firma).toBe("Producto × Diseño × Ingeniería");
    expect(SITE.hero.support).toBe("Diseña y construye productos digitales, de la idea al sistema en producción.");
  });

  it("reel, CTA, success, seam", () => {
    expect(SITE.reel.heading).toBe("Cuatro productos.");
    expect(SITE.cta.title).toBe("Ahora, el tuyo.");
    expect(SITE.cta.support).toBe("Cuatro productos, de la idea a producción. El quinto todavía está en blanco.");
    expect(SITE.cta.success).toBe("Brief recibido.");
    expect(SITE.capabilities.seam).toBe("Todo lo anterior pasó por las mismas manos.");
    expect(SITE.cta.fields).toMatchObject({ name: "Nombre", email: "Email", brief: "¿Qué estamos construyendo?" });
    expect(SITE.cta.button).toEqual({ idle: "Enviar", pending: "Enviando…" });
  });

  it("journey order and project roles", () => {
    expect(PROJECTS.map((p) => p.name)).toEqual(["TravelSuite360", "Rayo Smash", "Santi Nuca", "Chef Arturo"]);
    expect(RAYO.role).toBe("Diseño, motion y desarrollo");
    expect(RAYO.relationLine).toBe("Rayo Smash no es un cliente: es la demo que Prospector construye para vender.");
    expect(SANTI.proofLine).toBe("Sitio real, en línea.");
    expect(TS.worldCopy["TS10.close"]).toBe("Una agencia entera, operando.");
    expect(CHEF.worldCopy["C07.close"]).toBe("Primero el deseo. Después, la compra.");
  });

  it("forbidden microcopy never appears", () => {
    const BANNED = [/\bSubmit\b/i, /Click here/i, /Hacé clic/i, /Learn more/i, /Ver más/i, /Descubrí/i, /Explorá/i, /¡/, /!/, /❤|🚀/u, /Hecho con amor/i, /Powered by/i, /Gracias por contactarme/i];
    for (const s of SITE_STRINGS) for (const re of BANNED) expect(s.text, `${s.path}: ${re}`).not.toMatch(re);
  });

  it("the footer line has no © and a dynamic year", () => {
    expect(SITE.footer.line(2026)).toBe("Franco Núñez · Uruguay · 2026");
  });
});

// ── rendered HTML (after `npm run build`) ────────────────────────────────────

const APP = join(process.cwd(), ".next", "server", "app");
const ROUTES = ["index.html", ...PROJECTS.map((p) => `trabajo/${p.id}.html`)];
const built = ROUTES.every((r) => existsSync(join(APP, r)));

describe.skipIf(!built)("rendered HTML · production build", () => {
  const pending = [
    ...pendingValues(PROJECTS),
    ...pendingValues(PROFILE),
  ];

  it.each(ROUTES)("%s contains no pending value", (route) => {
    const html = readFileSync(join(APP, route), "utf8");
    for (const v of pending) expect(html.includes(v), `${route} leaks pending «${v}»`).toBe(false);
    expect(html).not.toMatch(/CONFIRMAR/);
  });

  it.each(ROUTES)("%s is readable without JS: all key copy is in the document", (route) => {
    const html = readFileSync(join(APP, route), "utf8");
    const must = [
      "Franco Núñez",
      SITE.hero.firma,
      SITE.hero.support,
      SITE.reel.heading,
      ...PROJECTS.flatMap((p) => [p.name, proofCaption(p), p.role]),
      SITE.capabilities.seam,
      ...CAPABILITIES.map((c) => c.statement),
      PROFILE.core,
      SITE.cta.title,
      SITE.cta.fields.brief,
      "Fotografía · Santi Nuca",
    ];
    for (const m of must) expect(html, `${route} misses «${m}»`).toContain(escapeHtml(m));
  });
});

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
