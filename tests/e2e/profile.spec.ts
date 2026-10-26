import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { scenesBuilt, settled } from "./scroll";

/**
 * Perfil (Spec §12; copy Content Master 13, 21 and 25; composition docs/27 §3): the declaration, each
 * paragraph beside its visual, Meta Ads' chapter, the motion that plays once, axe and no-JS. (Moved
 * out of the capabilities spec when the capabilities became Servicios, docs/28 §1.)
 */

const CORE = "Diseño y desarrollo productos digitales donde la estrategia, la experiencia de usuario y la ingeniería trabajan con un mismo propósito: crear valor real para cada negocio.";
const BODY = ["Mi trabajo va más allá de construir una interfaz. Me involucro en cómo se presenta una marca, cómo interactúan sus clientes, cómo funcionan sus procesos y cómo convertir una idea en un producto digital sólido, escalable y preparado para crecer.", "Desde Uruguay, trabajo en proyectos de comercio electrónico, plataformas y sistemas de gestión, combinando criterio de producto, diseño y desarrollo con una visión comercial."];
const ADS_TITLE = "Construirlo es una parte. Hacer que lo descubran es la otra.";
const ADS = "Además de diseñar y desarrollar productos digitales, creo campañas en Meta Ads para conectar marcas con personas interesadas en sus productos y servicios.";
const STEPS = ["Producto", "Descubrimiento", "Acción"];
const PHRASES = ["una marca", "sus clientes", "sus procesos", "un producto digital"];

const wide = (page: Page) => page.viewportSize()!.width >= 1024;
const reduced = (page: Page) => page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

async function open(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toHaveAttribute("data-started", "");
  await scenesBuilt(page);
}

test.describe("profile (Spec §12, Content Master 13, 21 and 25; docs/27 §3)", () => {
  test("the copy is exact; the visuals are real material and the paragraphs' own words; no portrait, no TravelSuite360 name, pending stack and contacts absent", async ({ page }) => {
    await open(page);
    const s = page.locator("#perfil");
    await expect(s.locator("h2")).toHaveText("Perfil");
    await expect(s.locator(".profile-core")).toHaveText(CORE);
    await expect(s.locator(".profile-p")).toHaveText(BODY);
    await expect(s.locator(".profile-phrase")).toHaveText(PHRASES);
    await expect(s.locator(".profile-shot-caption")).toHaveText(["Comercio electrónico", "Plataforma y sistema de gestión"]);
    // the fragments are the projects' real, final or derived material — never a placeholder, never a portrait
    expect(await s.locator("[data-placeholder]").count()).toBe(0);
    expect(await s.locator(".profile-shot [data-asset]").evaluateAll((e) => e.map((x) => x.getAttribute("data-asset")))).toEqual(["chef.product", "ts.reel.film.poster"]);
    expect(await s.locator('[data-asset^="franco"]').count()).toBe(0);
    // Meta Ads, a chapter of its own: the headline, three steps, one paragraph with the term in emphasis
    await expect(s.locator("h3")).toHaveText(ADS_TITLE);
    await expect(s.locator(".profile-step-word")).toHaveText(STEPS);
    await expect(s.locator(".profile-ads-p")).toHaveText(ADS);
    await expect(s.locator(".profile-ads-em")).toHaveText("Meta Ads");
    expect(await s.locator(".profile-meta").count()).toBe(0);
    expect(await s.innerText()).not.toMatch(/fundador|solo\b|por mi cuenta|CONFIRMAR|hola@|TravelSuite|agencias de viaje|\d+ ?%|ROAS/i);
  });

  test("composition: the declaration leads; each paragraph has its visual beside it (wide) or right before it (narrow); Meta Ads below, set off by a rule", async ({ page }) => {
    await open(page);
    const s = page.locator("#perfil");
    const size = (sel: string) => s.locator(sel).first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    expect(await size(".profile-core")).toBeGreaterThan((await size(".profile-p")) * 1.35);
    expect(await size(".profile-ads-title")).toBeGreaterThan((await size(".profile-ads-p")) * 1.3);
    const box = (sel: string) => s.locator(sel).boundingBox().then((b) => b!);
    const [core, phrases, p1, projects, p2, ads] = await Promise.all([".profile-core", ".profile-phrases", ".profile-p1", ".profile-projects", ".profile-p2", ".profile-ads"].map(box));
    expect(core.y).toBeLessThan(phrases.y);
    if (wide(page)) {
      // beside: the phrases left of the first paragraph, the fragments right of the second (alignment alternates)
      expect(phrases.x + phrases.width).toBeLessThanOrEqual(p1.x + 1);
      expect(p2.x + p2.width).toBeLessThanOrEqual(projects.x + 1);
      expect(Math.abs(phrases.y + phrases.height / 2 - (p1.y + p1.height / 2))).toBeLessThan(Math.max(phrases.height, p1.height));
    } else {
      // reading order: declaration → phrases → paragraph → fragments → paragraph, no overlap
      for (const [a, b] of [[phrases, p1], [p1, projects], [projects, p2]] as const) expect(a.y + a.height).toBeLessThanOrEqual(b.y + 1);
    }
    expect(p2.y + p2.height).toBeLessThan(ads.y);
    expect(await s.locator(".profile-ads").evaluate((e) => getComputedStyle(e).borderTopWidth)).toBe("1px");
    // the steps: one row on wide screens, a column on narrow ones; nothing leaves the viewport
    const steps = await s.locator(".profile-step").evaluateAll((e) => e.map((x) => x.getBoundingClientRect().toJSON() as DOMRect));
    if (wide(page)) expect(new Set(steps.map((r) => Math.round(r.top))).size).toBe(1);
    else for (let i = 1; i < steps.length; i++) expect(steps[i].top).toBeGreaterThanOrEqual(steps[i - 1].bottom);
    for (const r of steps) expect(r.right).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
    const em = await s.locator(".profile-ads-em").evaluate((e) => ({ w: Number(getComputedStyle(e).fontWeight), p: Number(getComputedStyle(e.parentElement!).fontWeight), tag: e.tagName }));
    expect(em.w).toBeGreaterThan(em.p);
    expect(em.tag).toBe("STRONG");
    // the sixth capability's card is not duplicated here: the profile adds the human side only
    expect(await s.innerText()).not.toContain("Un buen producto merece ser descubierto");
  });

  test("motion (docs/26 §E, docs/27 §3): the declaration by lines, the rest once as it comes; never hidden again", async ({ page }) => {
    await open(page);
    const s = page.locator("#perfil");
    if (await reduced(page)) {
      expect(await s.getAttribute("data-reveal")).toBeNull();
      expect(await s.locator(".profile-core").evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
      expect(await s.locator(".profile-shot-frame").first().evaluate((e) => getComputedStyle(e).clipPath)).toBe("none");
      return;
    }
    await expect(s).toHaveAttribute("data-reveal", "pending");
    await page.evaluate(() => {
      const r = document.querySelector("#perfil .profile-core")!.getBoundingClientRect();
      window.scrollTo({ top: r.top + window.scrollY - window.innerHeight * 0.5, behavior: "instant" });
    });
    await expect(s).toHaveAttribute("data-reveal", "shown");
    // once in, the split is reverted: one plain paragraph, the exact text
    await expect.poll(() => s.locator(".profile-core").evaluate((e) => e.children.length), { timeout: 4000 }).toBe(0);
    await expect(s.locator(".profile-core")).toHaveText(CORE);
    // down to Meta Ads' paragraph: everything on the way is in, the last step's accent module arrived
    await page.evaluate(() => {
      const r = document.querySelector("#perfil .profile-ads-p")!.getBoundingClientRect();
      window.scrollTo({ top: r.top + window.scrollY - window.innerHeight * 0.5, behavior: "instant" });
    });
    await expect.poll(() => s.locator(".profile-ads-p").evaluate((e) => Number(getComputedStyle(e).opacity)), { timeout: 4000 }).toBe(1);
    await expect.poll(() => s.locator('.profile-step [data-part="act"]').evaluate((e) => Number(getComputedStyle(e).opacity)), { timeout: 4000 }).toBe(1);
    // the visitor goes back up: nothing hides again
    await page.evaluate(() => {
      const r = document.querySelector("#perfil .profile-p1")!.getBoundingClientRect();
      window.scrollTo({ top: r.top + window.scrollY - window.innerHeight * 0.5, behavior: "instant" });
    });
    await page.waitForTimeout(400);
    for (const sel of [".profile-p1", ".profile-p2", ".profile-phrase", ".profile-step-word"]) {
      expect(await s.locator(sel).first().evaluate((e) => Number(getComputedStyle(e).opacity)), sel).toBe(1);
    }
    expect(await s.locator(".profile-shot-frame").last().evaluate((e) => getComputedStyle(e).clipPath)).toBe("none");
  });
});

test.describe("accessibility", () => {
  test("axe on the profile and Meta Ads' chapter, at rest", async ({ page }) => {
    await open(page);
    await page.locator("#perfil .profile-ads").scrollIntoViewIfNeeded();
    await settled(page);
    await page.waitForTimeout(1800);
    const results = await new AxeBuilder({ page }).include("#perfil").analyze();
    expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the declaration, the paragraphs and Meta Ads read in order, nothing clipped", async ({ page }) => {
    await page.goto("/");
    const text = (await page.locator("#perfil").textContent()) ?? "";
    let at = -1;
    for (const o of [CORE, BODY[0], BODY[1], "Construirlo es una parte.", ...STEPS, "creo campañas en"]) {
      const i = text.indexOf(o, at + 1);
      expect(i, o).toBeGreaterThan(at);
      at = i;
    }
    expect(await page.locator("#perfil .profile-core").evaluate((e) => getComputedStyle(e).clipPath)).toBe("none");
  });
});
