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
 * right under its words. Plus the profile copy (Content Master 13/21), axe and no-JS.
 */

const CORE = "Diseño y desarrollo productos digitales donde la estrategia, la experiencia de usuario y la ingeniería trabajan con un mismo propósito: crear valor real para cada negocio.";
const BODY = ["Mi trabajo va más allá de construir una interfaz. Me involucro en cómo se presenta una marca, cómo interactúan sus clientes, cómo funcionan sus procesos y cómo convertir una idea en un producto digital sólido, escalable y preparado para crecer.", "Desde Uruguay, trabajo en proyectos de comercio electrónico, plataformas y sistemas de gestión, combinando criterio de producto, diseño y desarrollo con una visión comercial."];
const ADS_TITLE = "Un gran producto también necesita llegar a las personas correctas.";
const ADS = ["Me gusta pensar en todo el recorrido: desde la primera vez que alguien descubre un negocio hasta el momento en que decide consultar, reservar o comprar.", "Por eso, además de diseñar y desarrollar productos digitales, también trabajo con publicidad en Meta Ads. Campañas en Instagram y Facebook que ayudan a dar a conocer una marca, atraer personas interesadas y aprovechar mejor cada oportunidad.", "Porque una buena experiencia digital importa. Pero también importa que la gente llegue a descubrirla."];
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
    await expect(page.locator("#capacidades h2")).toHaveText("Capacidades");
    await expect(page.locator("#capacidades .cx-seam")).toHaveText("Todo lo anterior pasó por las mismas manos.");
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

test.describe("profile (Spec §12, Content Master 13)", () => {
  test("the copy is exact; no photo, no title beyond «Perfil»; pending stack and contacts are absent", async ({ page }) => {
    await open(page);
    const s = page.locator("#perfil");
    await expect(s.locator("h2")).toHaveText("Perfil");
    await expect(s.locator(".profile-core")).toHaveText(CORE);
    await expect(s.locator(".profile-detail p")).toHaveText(BODY);
    // Meta Ads has a space of its own: a headline, three paragraphs, and the term in emphasis
    await expect(s.locator("h3")).toHaveText(ADS_TITLE);
    await expect(s.locator(".profile-ads-body p")).toHaveText(ADS);
    await expect(s.locator(".profile-ads-em")).toHaveText("Meta Ads");
    expect(await s.locator("img, video, [data-placeholder]").count()).toBe(0);
    expect(await s.locator(".profile-meta").count()).toBe(0);
    expect(await s.innerText()).not.toMatch(/fundador|solo\b|por mi cuenta|CONFIRMAR|hola@|TravelSuite|agencias de viaje/i);
  });

  test("hierarchy: the declaration is larger than the explanation, which is larger than nothing it replaced; Meta Ads sits below, set off by a rule", async ({ page }) => {
    await open(page);
    const s = page.locator("#perfil");
    const size = (sel: string) => s.locator(sel).first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    const core = await size(".profile-core");
    const detail = await size(".profile-detail p");
    const adsTitle = await size(".profile-ads-title");
    const adsBody = await size(".profile-ads-body p");
    expect(core).toBeGreaterThan(detail * 1.35);
    expect(adsTitle).toBeGreaterThan(adsBody * 1.3);
    expect(core).toBeGreaterThanOrEqual(adsTitle);
    // order down the page: declaration → explanation → Meta Ads
    const tops = await s.evaluate((root) => [".profile-core", ".profile-detail", ".profile-ads"].map((q) => root.querySelector(q)!.getBoundingClientRect().top + window.scrollY));
    expect(tops[0]).toBeLessThan(tops[1]);
    expect(tops[1]).toBeLessThan(tops[2]);
    expect(await s.locator(".profile-ads").evaluate((e) => getComputedStyle(e).borderTopWidth)).toBe("1px");
    // the emphasis is heavier than the text around it, never a link or an image
    const em = await s.locator(".profile-ads-em").evaluate((e) => ({ w: Number(getComputedStyle(e).fontWeight), p: Number(getComputedStyle(e.parentElement!).fontWeight), tag: e.tagName }));
    expect(em.w).toBeGreaterThan(em.p);
    expect(em.tag).toBe("STRONG");
    // the sixth capability's rail card is not duplicated here: the profile adds the human side only
    expect(await s.innerText()).not.toContain("Un buen producto merece ser descubierto");
  });

  test("one reveal on entry: blocks clipped until the section reaches 75% of the viewport, then shown whole; none under reduced motion", async ({ page }) => {
    await open(page);
    const s = page.locator("#perfil");
    if (await reduced(page)) {
      expect(await s.getAttribute("data-reveal")).toBeNull();
      return;
    }
    await expect(s).toHaveAttribute("data-reveal", "pending");
    const ads = page.locator("#perfil .profile-ads");
    await expect(ads).toHaveAttribute("data-reveal", "pending");
    const clipped = await s.locator(".profile-core").evaluate((e) => getComputedStyle(e).clipPath);
    expect(clipped).toMatch(/inset\(0(px)? 0(px)? 100%( 0(px)?)?\)/);
    await page.evaluate(() => {
      const r = document.getElementById("perfil")!.getBoundingClientRect();
      window.scrollTo({ top: r.top + window.scrollY - window.innerHeight * 0.6, behavior: "instant" });
    });
    await expect(s).toHaveAttribute("data-reveal", "shown");
    await expect.poll(() => s.locator(".profile-core").evaluate((e) => getComputedStyle(e).clipPath), { timeout: 3000 }).toMatch(/none|inset\(0(px|%)?( 0(px|%)?)*\)/);
    // the text was never removed from the tree
    await expect(s.locator(".profile-core")).toHaveText(CORE);
    // Meta Ads waits for the visitor: still clipped while it is far below, then revealed once on its own
    await expect(ads).toHaveAttribute("data-reveal", "pending");
    expect(await ads.locator(".profile-ads-title").evaluate((e) => getComputedStyle(e).clipPath)).toMatch(/inset\(0(px)? 0(px)? 100%( 0(px)?)?\)/);
    await page.evaluate(() => {
      const r = document.querySelector("#perfil .profile-ads")!.getBoundingClientRect();
      window.scrollTo({ top: r.top + window.scrollY - window.innerHeight * 0.6, behavior: "instant" });
    });
    await expect(ads).toHaveAttribute("data-reveal", "shown");
    await expect.poll(() => ads.locator(".profile-ads-title").evaluate((e) => getComputedStyle(e).clipPath), { timeout: 3000 }).toMatch(/none|inset\(0(px|%)?( 0(px|%)?)*\)/);
    await expect(ads.locator(".profile-ads-body p")).toHaveText(ADS);
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
  test("the opening line, the kicker, the six capabilities and the profile read in order", async ({ page }) => {
    await page.goto("/");
    // textContent: the mono labels are uppercased by CSS
    const text = (await page.locator("#capacidades").textContent()) ?? "";
    const order = ["Todo lo anterior pasó por las mismas manos.", "Cinco cosas que se repiten", "Producto", "Ingeniería web", "Comercio digital", "IA y automatización", "Experiencias interactivas", "Después de publicar", "Meta Ads y crecimiento", "Meta Ads"];
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
