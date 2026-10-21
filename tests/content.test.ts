/**
 * Content guards (Spec §21 "Rules enforced by tests", §28 A2/A3/A21). The Content Master's
 * claim audit becomes build failures instead of reviews. The rendered-HTML checks run when a
 * production build exists (`npm run build` first).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ASSETS } from "@/data/assets";
import { CAPABILITIES } from "@/data/capabilities";
import { PROFILE } from "@/data/profile";
import { PROJECTS, getProject } from "@/data/projects";
import { SITE } from "@/data/site";
import { PROVISIONAL_LAUNCH } from "@/data/launch";
import type { Gated } from "@/data/types";
import { hasAsset, launchBlockers, resolveAsset } from "@/lib/assets";
import { CHEF_PAYMENTS_PROOF, confirmed, proofCaption, rangeLabel, routeErrorText, stackLine } from "@/lib/content";

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

  it("the meta description names the partnership (the profile no longer does: Content Master 21)", () => {
    expect(SITE.meta.description).toContain("Socio de TravelSuite360, a cargo del software.");
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
      "IA y automatización",
      "Experiencias interactivas",
      "Meta Ads y crecimiento",
    ]);
    expect(CAPABILITIES.filter((c) => c.group === "core")).toHaveLength(5);
    expect(CAPABILITIES[5].group).toBe("extended");
  });

  it("06 is «Meta Ads y crecimiento» (brief of 2026-10-21) with no numbers and no promised results", () => {
    const c6 = CAPABILITIES[5];
    expect(c6.statement).toBe(
      "Un buen producto merece ser descubierto. Creo campañas para acercar negocios a las personas que pueden convertirse en sus próximos clientes.",
    );
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

describe("the selection is open-ended (Content Master 21)", () => {
  /** a fixed count of projects, or a fifth that is «still blank»: the collection is not closed */
  const CLOSED = /cuatro (productos|proyectos|mundos)|los cuatro|el quint[oa]|la quint[oa]|quint[oa] (producto|proyecto)|en blanco|0?1\s?[–-]\s?0?4\b|\b1\s?[–-]\s?4\b/i;
  const RENDERED = [
    ...renderable(SITE, "SITE"),
    ...renderable(CAPABILITIES, "CAPABILITIES"),
    ...renderable(PROFILE, "PROFILE"),
    ...PROJECTS.flatMap((p) => renderable({ reelLine: p.reelLine, relationLine: p.relationLine, microCase: p.microCase, proofLine: p.proofLine, meta: p.meta }, `PROJECT.${p.id}`)),
  ];

  it("no rendered text counts the projects or closes the collection", () => {
    for (const s of RENDERED) expect(s.text, s.path).not.toMatch(CLOSED);
  });

  it("the reel's labels and hints follow the real number of projects", () => {
    const n = PROJECTS.length;
    expect(rangeLabel(SITE.reel.label, n)).toBe(`Trabajo · 01–${String(n).padStart(2, "0")}`);
    expect(rangeLabel(SITE.reel.label, 6)).toBe("Trabajo · 01–06");
    expect(SITE.reel.restHint(n)).toBe(`arrastrá · ← → · 1–${n}`);
    expect(SITE.reel.restHint(7)).toBe("arrastrá · ← → · 1–7");
  });

  it("the heading and the capabilities kicker carry no number", () => {
    expect(SITE.reel.heading).toBe("Trabajo seleccionado.");
    expect(SITE.capabilities.kicker).toBe("Cinco cosas que se repiten en todos los productos. Y una sexta, después de publicar.");
  });
});

describe("copy fidelity · Content Master rev 26", () => {
  it("hero, firma and positioning (Content Master 21, option A, 2026-10-21)", () => {
    expect(SITE.hero.name).toEqual(["FRANCO", "NÚÑEZ"]);
    expect(SITE.hero.firma).toBe("Producto × Diseño × Ingeniería × Crecimiento");
    expect(SITE.nav.firma).toBe(SITE.hero.firma);
    expect(SITE.hero.support).toBe("Transforma ideas y negocios en productos digitales que destacan, funcionan y generan oportunidades.");
    // the page title and the JSON-LD job title keep the three disciplines (the SEO identity)
    expect(SITE.meta.title).toBe("Franco Núñez — Producto × Diseño × Ingeniería");
  });

  it("the meta lines follow the hero line instead of the old one", () => {
    expect(SITE.meta.description).toBe(`${SITE.hero.support} Socio de TravelSuite360, a cargo del software. Uruguay.`);
    expect(SITE.meta.ogDescription).toBe(SITE.hero.support);
    expect(SITE.meta.description.length).toBeLessThanOrEqual(160);
  });

  it("reel, CTA, success, seam", () => {
    expect(SITE.reel.heading).toBe("Trabajo seleccionado.");
    expect(SITE.cta.title).toBe("Ahora, el tuyo.");
    expect(SITE.cta.eyebrow).toBe("Tu próximo proyecto empieza acá");
    expect(SITE.cta.support).toBe("Una idea nueva, un negocio que quiere crecer o un producto que necesita dar el siguiente paso. Contame qué tenés en mente.");
    expect(SITE.cta.aside).toBe("Hablemos de lo que podemos construir.");
    expect(SITE.cta.success).toBe("Brief recibido.");
    expect(SITE.capabilities.seam).toBe("Todo lo anterior pasó por las mismas manos.");
    expect(SITE.cta.fields).toMatchObject({ name: "Nombre", email: "Email", brief: "¿Qué estamos construyendo?" });
    expect(SITE.cta.button).toEqual({ idle: "Enviar proyecto", pending: "Enviando…" });
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

  // since THE SHIFT (docs/25) the home and each case are two documents: each carries its own copy
  it("index.html is readable without JS: all of the home journey's key copy is in the document", () => {
    const html = readFileSync(join(APP, "index.html"), "utf8");
    const must = [
      "Franco Núñez",
      SITE.hero.firma,
      SITE.hero.support,
      SITE.reel.heading,
      // the reel opens every case: its name, its line and its door
      ...PROJECTS.flatMap((p) => [p.name, p.reelLine, `/trabajo/${p.id}`]),
      SITE.reel.enter,
      // THE SHIFT (Content Master 23): the title, the four acts and what the interface is
      SITE.shift.heading,
      ...SITE.shift.acts.flatMap((a) => [a.title, a.line]),
      SITE.shift.concept,
      SITE.capabilities.seam,
      ...CAPABILITIES.map((c) => c.statement),
      // the profile (Content Master 21): the declaration, the explanation and Meta Ads
      PROFILE.core,
      ...PROFILE.body,
      PROFILE.ads.title,
      ...PROFILE.ads.paragraphs,
      SITE.cta.support,
      SITE.cta.eyebrow,
      SITE.cta.aside,
      // the declaration (Content Master 20): every act's words, title and line, and the conclusion
      ...SITE.declaration.acts.flatMap((a) => [a.title, ...a.words]),
      SITE.declaration.acts[0].line,
      SITE.declaration.acts[1].line,
      "Que no solo te vean.",
      SITE.declaration.close,
      SITE.cta.title,
      SITE.cta.fields.brief,
    ];
    for (const m of must) expect(html, `index.html misses «${m}»`).toContain(escapeHtml(m));
  });

  it.each(PROJECTS.map((p) => [p.id, p] as const))("trabajo/%s.html is readable without JS: the whole case is in the document", (id, p) => {
    const html = readFileSync(join(APP, `trabajo/${id}.html`), "utf8");
    const must = [
      "Franco Núñez",
      p.name,
      proofCaption(p),
      p.microCase,
      p.role,
      ...(p.relationLine ? [p.relationLine] : []),
      ...(p.credit ? [`${p.credit.label} · ${p.credit.holder}`] : []),
      ...Object.values(p.worldCopy),
      // its way back to the reel and on to the next case
      SITE.world.back,
      SITE.world.next,
    ];
    for (const m of must) expect(html, `trabajo/${id}.html misses «${m}»`).toContain(escapeHtml(m));
    // a case is one case: no other project's world, no home section
    for (const other of PROJECTS.filter((o) => o.id !== id)) expect(html).not.toContain(`id="${other.id}"`);
    for (const section of ["inicio", "shift", "capacidades", "propuesta", "perfil", "contacto"]) expect(html).not.toContain(`id="${section}"`);
  });
});

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Phase 12 · privacy of the payload and of public/ ─────────────────────────

describe("rule 7 · internal notes and unapproved media never reach the client", () => {
  it("resolved assets carry no production notes and no candidate files", () => {
    for (const a of ASSETS) {
      const r = resolveAsset(a.key);
      expect(r.meta, a.key).not.toHaveProperty("source");
      expect(r.meta, a.key).not.toHaveProperty("candidates");
    }
  });
  it("the built HTML names none of the unapproved TravelSuite360 captures", () => {
    const html = join(process.cwd(), ".next/server/app/index.html");
    if (!existsSync(html)) return;
    expect(readFileSync(html, "utf8")).not.toMatch(/projects\/travelsuite360\//);
  });
});

// ── provisional launch (src/data/launch.ts, authorized 2026-10-12) ───────────

describe("rule 8 · the provisional launch is explicit and closed", () => {
  it("lists exactly the launch-blocking slots still on placeholder, with who authorized it and when", () => {
    expect(PROVISIONAL_LAUNCH.authorizedBy).toBe("Franco Núñez");
    expect(PROVISIONAL_LAUNCH.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect([...PROVISIONAL_LAUNCH.slots].sort()).toEqual(launchBlockers().map((c) => c.key).sort());
  });
  it("never publishes TravelSuite360 media: a listed TS slot stays a placeholder without the §23 sign-off", () => {
    for (const k of PROVISIONAL_LAUNCH.slots.filter((k) => k.startsWith("ts."))) {
      expect(resolveAsset(k).status).toBe("placeholder");
      expect(ASSETS.find((a) => a.key === k)?.privacyChecked).not.toBe(true);
    }
  });
  it("the production checker accepts the listed slots and the final launch check still fails", () => {
    const run = (flag: string) => {
      try {
        execFileSync(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "scripts/check-assets.mjs", flag], { encoding: "utf8", stdio: "pipe" });
        return 0;
      } catch (e) {
        return (e as { status: number }).status;
      }
    };
    expect(run("--production")).toBe(0);
    expect(run("--launch")).toBe(1);
  });
  it("the built HTML never prints asset keys on placeholders", () => {
    const html = join(process.cwd(), ".next/server/app/index.html");
    if (!existsSync(html)) return;
    expect(readFileSync(html, "utf8")).not.toMatch(/class="placeholder-key"/);
  });
});
