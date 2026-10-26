import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { watchConsole } from "./console";
import { scenesBuilt, settled } from "./scroll";

/**
 * Servicios (docs/28 §1, Content Master 26): an essential index of eight services — number, name,
 * hairline, indicator; two columns of four on wide screens, one on narrow ones; an accordion with one
 * description open at a time; no pictures, no panels, no pin. Replaces the capabilities index.
 */

const NAMES = ["Páginas web", "Tiendas online", "Sistemas a medida", "Diseño y experiencia", "Inteligencia artificial", "Aplicaciones web", "Publicidad en Meta Ads", "Estrategia digital"];
const FIRST = "Sitios profesionales, landing pages, portfolios y páginas para marcas, negocios y profesionales.";

const wide = (page: Page) => page.viewportSize()!.width >= 1024;
const reduced = (page: Page) => page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

async function open(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toHaveAttribute("data-started", "");
  await scenesBuilt(page);
  await page.locator("#servicios").scrollIntoViewIfNeeded();
  await settled(page);
}

const buttons = (page: Page) => page.locator("#servicios .svc-btn");
/** which panels can be seen (open, laid out, visible) */
const openPanels = (page: Page) =>
  page.locator("#servicios .svc-panel").evaluateAll((ps) => ps.map((p, i) => (getComputedStyle(p).visibility === "visible" && p.getBoundingClientRect().height > 4 ? i : -1)).filter((i) => i >= 0));

test.describe("the index", () => {
  test("in its place, in the approved words: Servicios, the headline, the subtitle, eight numbered services", async ({ page }) => {
    const problems = watchConsole(page);
    await open(page);
    const order = await page.evaluate(() => Array.from(document.querySelectorAll("main > section[id]")).map((s) => s.id));
    expect(order.slice(order.indexOf("vision"), order.indexOf("vision") + 3)).toEqual(["vision", "servicios", "propuesta"]);
    expect(order).not.toContain("capacidades");
    await expect(page.locator("#servicios .svc-eyebrow")).toHaveText("Servicios");
    await expect(page.locator("#servicios h2")).toHaveText("Lo que puedo crear para vos.");
    await expect(page.locator("#servicios .svc-sub")).toHaveText("De una página web a un sistema completo para tu negocio.");
    await expect(page.locator("#servicios .svc-name")).toHaveText(NAMES);
    await expect(page.locator("#servicios .svc-n")).toHaveText(["01", "02", "03", "04", "05", "06", "07", "08"]);
    // the numbers are the accent; the names are large and paper
    expect(await page.locator("#servicios .svc-n").first().evaluate((e) => getComputedStyle(e).color)).toBe("rgb(100, 136, 255)");
    expect(await page.locator("#servicios .svc-name").first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(24);
    // nothing of the old index: no pictures, videos, scenes or project references
    expect(await page.locator("#servicios img, #servicios video, #servicios picture, #servicios a").count()).toBe(0);
    expect(await page.locator(".cx, .cx-stage, .cx-plate, [data-row]").count()).toBe(0);
    expect(problems).toEqual([]);
  });

  test("layout: two columns of four (wide), one column (narrow); every row the usable width; no overflow", async ({ page }) => {
    await open(page);
    const rows = await page.locator("#servicios .svc-item").evaluateAll((e) => e.map((x) => x.getBoundingClientRect().toJSON() as DOMRect));
    const vw = page.viewportSize()!.width;
    if (wide(page)) {
      const lefts = [...new Set(rows.map((r) => Math.round(r.left)))];
      expect(lefts).toHaveLength(2);
      expect(rows.slice(0, 4).every((r) => Math.round(r.left) === lefts[0])).toBe(true);
      expect(rows.slice(4).every((r) => Math.round(r.left) === lefts[1])).toBe(true);
    } else {
      expect(new Set(rows.map((r) => Math.round(r.left))).size).toBe(1);
      for (let i = 1; i < rows.length; i++) expect(rows[i].top).toBeGreaterThanOrEqual(rows[i - 1].bottom - 1);
      const head = await page.locator("#servicios .svc-head").boundingBox();
      for (const r of rows) expect(Math.abs(r.width - head!.width)).toBeLessThan(2);
    }
    for (const r of rows) expect(r.right).toBeLessThanOrEqual(vw + 1);
    // touch targets
    for (const b of await buttons(page).evaluateAll((e) => e.map((x) => x.getBoundingClientRect().height))) expect(b).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});

test.describe("the accordion", () => {
  test("the first starts open; a click opens another and closes it; one at a time; aria-expanded and aria-controls follow", async ({ page }) => {
    await open(page);
    await expect(buttons(page).first()).toHaveAttribute("aria-expanded", "true");
    expect(await openPanels(page)).toEqual([0]);
    await expect(page.locator("#svc-p-1 .svc-line")).toHaveText(FIRST);
    for (let i = 0; i < 8; i++) await expect(buttons(page).nth(i)).toHaveAttribute("aria-controls", `svc-p-${i + 1}`);

    await buttons(page).nth(4).click();
    await expect(buttons(page).nth(4)).toHaveAttribute("aria-expanded", "true");
    await expect(buttons(page).first()).toHaveAttribute("aria-expanded", "false");
    await expect.poll(() => openPanels(page), { timeout: 2000 }).toEqual([4]);
    // the open one closes on its own button: none open
    await buttons(page).nth(4).click();
    await expect(buttons(page).nth(4)).toHaveAttribute("aria-expanded", "false");
    await expect.poll(() => openPanels(page), { timeout: 2000 }).toEqual([]);
    // a closed panel leaves the accessibility tree once its 260 ms close is over
    await expect.poll(() => page.locator("#svc-p-5").evaluate((e) => getComputedStyle(e).visibility), { timeout: 2000 }).toBe("hidden");
  });

  test("keyboard: Enter and Space toggle, ↑ ↓ Home End move between services, focus visible", async ({ page }) => {
    await open(page);
    await buttons(page).first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(buttons(page).nth(1)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(buttons(page).nth(1)).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("End");
    await expect(buttons(page).nth(7)).toBeFocused();
    await page.keyboard.press("Space");
    await expect(buttons(page).nth(7)).toHaveAttribute("aria-expanded", "true");
    await expect(buttons(page).nth(1)).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Home");
    await expect(buttons(page).first()).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(buttons(page).nth(7)).toBeFocused();
    const outline = await buttons(page).nth(7).evaluate((e) => getComputedStyle(e).outlineStyle);
    expect(outline).not.toBe("none");
  });

  test("opening takes 200–300 ms with motion, none under reduced motion", async ({ page }) => {
    await open(page);
    const duration = await page.locator("#svc-p-2").evaluate((e) => getComputedStyle(e).transitionDuration);
    if (await reduced(page)) expect(duration.split(",").every((d) => parseFloat(d) === 0)).toBe(true);
    else expect(parseFloat(duration)).toBeGreaterThanOrEqual(0.2);
    if (!(await reduced(page))) expect(parseFloat(duration)).toBeLessThanOrEqual(0.3);
  });

  test("axe with one open and with all closed", async ({ page }) => {
    await open(page);
    const check = async () => {
      const r = await new AxeBuilder({ page }).include("#servicios").analyze();
      expect(r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
    };
    await check();
    await buttons(page).first().click();
    await page.waitForTimeout(400);
    await check();
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("every service and every description reads in order", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#servicios .svc-line")).toHaveCount(8);
    for (const l of await page.locator("#servicios .svc-line").all()) await expect(l).toBeVisible();
    const text = (await page.locator("#servicios").textContent()) ?? "";
    let at = -1;
    for (const o of ["Servicios", "Lo que puedo crear para vos.", ...NAMES]) {
      const i = text.indexOf(o, at + 1);
      expect(i, o).toBeGreaterThan(at);
      at = i;
    }
  });
});
