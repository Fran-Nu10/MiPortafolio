import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { watchConsole } from "./console";
import { settled, scenesBuilt } from "./scroll";
import { READING_LINE } from "../../src/lib/capabilities-index";

/**
 * Capabilities as a live editorial index (docs/26 §C, replacing the Phase 9 rail): six numbered rows
 * and one shared stage. Wide screens: the rows scroll natively, the stage is sticky beside them (no
 * pinned section), the active capability follows the reading line both ways and its scene is the
 * one shown; hover and focus activate too. Narrow screens: each capability is one unit, its scene
 * right under its words. Plus the profile (Content Master 13/21/25, composition docs/27 §3), axe and no-JS.
 */

const CORE = "Diseño y desarrollo productos digitales donde la estrategia, la experiencia de usuario y la ingeniería trabajan con un mismo propósito: crear valor real para cada negocio.";
const BODY = ["Mi trabajo va más allá de construir una interfaz. Me involucro en cómo se presenta una marca, cómo interactúan sus clientes, cómo funcionan sus procesos y cómo convertir una idea en un producto digital sólido, escalable y preparado para crecer.", "Desde Uruguay, trabajo en proyectos de comercio electrónico, plataformas y sistemas de gestión, combinando criterio de producto, diseño y desarrollo con una visión comercial."];
const ADS_TITLE = "Construirlo es una parte. Hacer que lo descubran es la otra.";
const ADS = "Además de diseñar y desarrollar productos digitales, creo campañas en Meta Ads para conectar marcas con personas interesadas en sus productos y servicios.";
const STEPS = ["Producto", "Descubrimiento", "Acción"];
const PHRASES = ["una marca", "sus clientes", "sus procesos", "un producto digital"];
const NAMES = ["Producto", "Ingeniería web", "Comercio digital", "IA y automatización", "Experiencias interactivas", "Meta Ads y crecimiento"];
const SCENES = ["product", "engineering", "commerce", "ai", "interactive", "growth"];

const wide = (page: Page) => page.viewportSize()!.width >= 1024;
const reduced = (page: Page) => page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

async function open(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toHaveAttribute("data-started", "");
  await scenesBuilt(page);
}

/** bring row n (1-based) onto the reading line */
async function toRow(page: Page, n: number) {
  await page.evaluate(
    ([n, line]) => {
      const r = document.querySelector(`#capacidades [data-row="${n}"]`)!.getBoundingClientRect();
      window.scrollTo({ top: Math.round(r.top + window.scrollY + r.height / 2 - innerHeight * line), behavior: "instant" });
    },
    [n, READING_LINE] as const,
  );
  await settled(page);
  await page.waitForTimeout(200);
}

const activeRow = (page: Page) => page.locator("#capacidades [data-row][data-active]").getAttribute("data-row").then(Number);
const shownScene = (page: Page) => page.locator("#capacidades .cx-stage-scene[data-on] .cx-plate").getAttribute("data-scene");

test.describe("the live index (docs/26 §C)", () => {
  test("six numbered rows: name, value and reference always in the document, in the approved words", async ({ page }) => {
    await open(page);
    // the section's own title (its opening line became «Una sola visión», docs/27 §3)
    await expect(page.locator("#capacidades h2")).toHaveText("Capacidades");
    expect(await page.locator("#capacidades h2").evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThan(30);
    expect(await page.locator("#capacidades").innerText()).not.toContain("Todo lo anterior pasó por las mismas manos.");
    await expect(page.locator("#capacidades h3")).toHaveText(NAMES);
    await expect(page.locator("#capacidades .cx-row .cx-value")).toHaveCount(6);
    await expect(page.locator("#capacidades .cx-n")).toHaveText(["01", "02", "03", "04", "05", "06"]);
    // no cards any more: one stage with six scenes (wide) or one scene per unit (narrow)
    expect(await page.locator("#capacidades .capability, #capacidades [data-capability]").count()).toBe(0);
    await expect(page.locator("#capacidades .cx-stage-scene .cx-plate")).toHaveCount(6);
    expect(await page.locator("#capacidades .cx-stage-scene .cx-plate").evaluateAll((e) => e.map((x) => x.getAttribute("data-scene")))).toEqual(SCENES);
  });

  test("wide: the stage stays beside the rows; the active capability follows the reading line down and back up", async ({ page }) => {
    test.skip(!wide(page), "the shared stage is a wide-screen layout");
    const problems = watchConsole(page);
    await open(page);
    // no pinned section: the stage is sticky inside the index's own column
    expect(await page.locator("#capacidades .cx-stage").evaluate((e) => getComputedStyle(e).position)).toBe("sticky");
    expect(await page.locator("#capacidades [data-part=pin]").count()).toBe(0);
    for (let n = 1; n <= 6; n++) {
      await toRow(page, n);
      await expect.poll(() => activeRow(page)).toBe(n);
      await expect.poll(() => shownScene(page)).toBe(SCENES[n - 1]);
      // the active scene's plate is in view beside the row, and it is the only scene shown
      const plate = await page.locator("#capacidades .cx-stage-scene[data-on] .cx-plate").boundingBox();
      expect(plate!.y).toBeGreaterThanOrEqual(0);
      expect(plate!.y + plate!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
      expect(await page.locator("#capacidades .cx-stage-scene[data-on]").count()).toBe(1);
    }
    for (let n = 5; n >= 1; n--) {
      await toRow(page, n);
      await expect.poll(() => activeRow(page)).toBe(n);
      await expect.poll(() => shownScene(page)).toBe(SCENES[n - 1]);
    }
    // the inactive rows step back but stay legible (muted on black is AA)
    const muted = await page.locator('#capacidades [data-row="4"] .cx-name').evaluate((e) => getComputedStyle(e).color);
    expect(muted).toBe("rgb(142, 139, 132)");
    expect(problems).toEqual([]);
  });

  test("wide: hover and keyboard focus activate a row too (nothing is revealed by hover alone)", async ({ page }) => {
    test.skip(!wide(page), "the shared stage is a wide-screen layout");
    await open(page);
    await toRow(page, 1);
    await page.locator('#capacidades [data-row="3"] a').focus();
    await expect.poll(() => activeRow(page)).toBe(3);
    await expect.poll(() => shownScene(page)).toBe("commerce");
  });

  test("narrow: each capability is one unit — phones: its scene right under its words; tablets: beside them; no carousel", async ({ page }) => {
    test.skip(wide(page), "wide screens share one stage");
    await open(page);
    expect(await page.locator("#capacidades .cx-stage").evaluate((e) => getComputedStyle(e).display)).toBe("none");
    const tablet = page.viewportSize()!.width >= 768;
    for (let n = 1; n <= 6; n++) {
      const row = page.locator(`#capacidades [data-row="${n}"]`);
      const name = await row.locator(".cx-name").boundingBox();
      const value = await row.locator(".cx-value").boundingBox();
      const scene = await row.locator(".cx-unit-scene").boundingBox();
      if (tablet) {
        // the words on the left, the demonstration in the column beside them, starting with them
        expect(scene!.x).toBeGreaterThanOrEqual(value!.x + value!.width - 1);
        expect(Math.abs(scene!.y - name!.y)).toBeLessThan(40);
      } else {
        expect(scene!.y).toBeGreaterThan(value!.y);
        expect(scene!.y - (value!.y + value!.height)).toBeLessThan(120);
      }
      expect(scene!.x + scene!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test("scenes show real material and the approved words only — no metric, no figure", async ({ page }) => {
    await open(page);
    const text = (await page.locator("#capacidades").textContent()) ?? "";
    expect(text).toContain("Necesito viajar a Punta Cana en julio, somos cuatro.");
    expect(text).toContain("reserva confirmada");
    expect(text).toContain("Agregar al carrito");
    expect(text).toContain("Próximos clientes");
    expect(text).not.toMatch(/%|ROAS|conversi[oó]n|CTR/i);
  });

  test("reduced motion: the scenes show their final state, nothing animates", async ({ page }) => {
    await open(page);
    test.skip(!(await reduced(page)), "motion allowed");
    await page.locator("#capacidades").scrollIntoViewIfNeeded();
    const anims = await page.evaluate(() => document.getAnimations().filter((a) => ((a.effect as KeyframeEffect | null)?.target as Element | null)?.closest?.("#capacidades")).length);
    expect(anims).toBe(0);
  });
});

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
  test("axe on the index and the profile; every attribution link reaches its case; headings in order", async ({ page }) => {
    await open(page);
    await page.locator("#capacidades").scrollIntoViewIfNeeded();
    // the stage's cross-fade (360 ms) and the scenes' sequences settle first: axe reads the resting page
    await settled(page);
    await page.waitForTimeout(1800);
    const results = await new AxeBuilder({ page }).include("#capacidades").include("#perfil").analyze();
    expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
    const links = await page.locator("#capacidades .cx-ref[href]").evaluateAll((l) => l.map((a) => (a as HTMLAnchorElement).getAttribute("href")));
    expect(links).toEqual(["/trabajo/travelsuite360", "/trabajo/chef-arturo", "/trabajo/rayo-smash"]);
    expect(await page.locator("#capacidades h2").innerText()).toMatch(/Capacidades/i);
    expect(await page.locator("#capacidades h3").allInnerTexts()).toEqual(NAMES);
  });

  test("an attribution link opens its project's case (its own document since docs/25), at its world", async ({ page }) => {
    await open(page);
    // on the rail the card travels with the scroll: bring it in through the rail's own focus rule
    // (it centers the card), let the document rest, then click — a click while the rail still
    // moves (scrub 0.8 s) can miss under load
    const link = page.locator('#capacidades [data-row="3"] a');
    await link.scrollIntoViewIfNeeded();
    await link.focus();
    await settled(page);
    await link.press("Enter");
    // a page navigation now: the URL, not an evaluate across the unload
    await expect(page).toHaveURL(/\/trabajo\/chef-arturo$/);
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    await expect(page).toHaveTitle("Chef Arturo — Franco Núñez");
    // the case starts with its world at the top of the document
    await expect.poll(() => page.evaluate(() => Math.abs(Math.round(document.getElementById("chef-arturo")!.getBoundingClientRect().top)))).toBeLessThanOrEqual(2);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the title, the kicker, the six capabilities and the profile read in order", async ({ page }) => {
    await page.goto("/");
    // textContent: the mono labels are uppercased by CSS
    const text = (await page.locator("#capacidades").textContent()) ?? "";
    const order = ["Capacidades", "Cinco cosas que se repiten", "Producto", "Ingeniería web", "Comercio digital", "IA y automatización", "Experiencias interactivas", "Después de publicar", "Meta Ads y crecimiento", "Meta Ads"];
    let at = -1;
    for (const o of order) {
      const i = text.indexOf(o, at + 1);
      expect(i, o).toBeGreaterThan(at);
      at = i;
    }
    await expect(page.locator("#perfil .profile-core")).toHaveText(CORE);
    expect(await page.locator("#perfil .profile-core").evaluate((e) => getComputedStyle(e).clipPath)).toBe("none");
    // without JS: the units in flow, each with its scene; no shared stage
    expect(await page.locator("#capacidades .cx-stage").evaluate((e) => getComputedStyle(e).display)).toBe("none");
    expect(await page.locator("#capacidades .cx-unit-scene").first().evaluate((e) => getComputedStyle(e).display)).toBe("block");
  });
});
