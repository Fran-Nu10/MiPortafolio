import { expect, test, type Page } from "@playwright/test";
import { watchConsole } from "./console";
import { scenesBuilt, settled } from "./scroll";

/**
 * Discovery and evaluation (docs/25): the home journey opens each project's case at its own
 * document, `/trabajo/{slug}` — the URLs the reel always used. Every card still opens its project;
 * a case starts with its world, ends with «← Trabajo» (back to the reel) and «Siguiente →» (the next
 * case; after the last, Capacidades); Back returns to where the visitor left the reel.
 */

const CASES = [
  { slug: "travelsuite360", name: "TravelSuite360", next: "/trabajo/rayo-smash" },
  { slug: "rayo-smash", name: "Rayo Smash", next: "/trabajo/santi-nuca" },
  { slug: "santi-nuca", name: "Santi Nuca", next: "/trabajo/chef-arturo" },
  { slug: "chef-arturo", name: "Chef Arturo", next: "/#capacidades" },
] as const;

async function open(page: Page, url = "/") {
  await page.goto(url, { waitUntil: "networkidle" });
  await expect(page.locator("main")).toHaveAttribute("data-started", "");
  await scenesBuilt(page);
}

/** the reel's stage top, as the visitor sees it */
const reelTop = (page: Page) => page.evaluate(() => document.querySelector("#trabajo [data-part=stage]")!.getBoundingClientRect().top);

test.describe("from the reel to each case", () => {
  for (const [i, c] of CASES.entries()) {
    test(`«Ver caso» of ${c.name} opens /trabajo/${c.slug}, its world first`, async ({ page }) => {
      const problems = watchConsole(page);
      await open(page);
      await page.evaluate(() => document.getElementById("trabajo")!.scrollIntoView({ behavior: "instant" }));
      await settled(page);
      // bring the card to the center with its 01–04 button (a neighbour's first tap only centers it)
      await page.locator("#trabajo .reel-nav-item").nth(i).click();
      await expect(page.locator(`.reel-item[data-index="${i}"]`)).toHaveAttribute("data-active", "");
      const enter = page.locator(`.reel-item[data-index="${i}"] [data-enter]`);
      await expect(enter).toHaveAttribute("href", `/trabajo/${c.slug}`);
      await enter.click();
      await expect(page).toHaveURL(new RegExp(`/trabajo/${c.slug}$`));
      await expect(page).toHaveTitle(`${c.name} — Franco Núñez`);
      await expect(page.locator("main")).toHaveAttribute("data-started", "");
      // one case per document: its world and its proof, nothing of the home journey
      await expect(page.locator(`#${c.slug}`)).toHaveCount(1);
      await expect(page.locator("#shift, #capacidades, #perfil, #contacto, #inicio")).toHaveCount(0);
      // the world starts at the top of the case
      await expect.poll(() => page.evaluate((id) => Math.round(document.getElementById(id)!.getBoundingClientRect().top), c.slug)).toBeLessThanOrEqual(4);
      // the header is there from the start (there is no opening to reveal it)
      await expect(page.locator(".site-header")).toHaveAttribute("data-revealed", "true");
      expect(problems).toEqual([]);
    });
  }

  test("the whole active card is the door to its case (a click on its picture)", async ({ page }) => {
    await open(page);
    test.skip(await page.evaluate(() => matchMedia("(max-width: 359.98px), (max-height: 559.98px)").matches), "tiny viewports: the static reel list");
    await page.evaluate(() => document.getElementById("trabajo")!.scrollIntoView({ behavior: "instant" }));
    await settled(page);
    await page.locator('.reel-item[data-index="0"] .reel-frame').click();
    await expect(page).toHaveURL(/\/trabajo\/travelsuite360$/);
  });
});

test.describe("inside a case", () => {
  for (const c of CASES) {
    test(`${c.name}: «← Trabajo» and «Siguiente →» close the proof`, async ({ page }) => {
      await open(page, `/trabajo/${c.slug}`);
      const links = page.locator(`[data-proof="${c.slug}"] .proof-links a:not([target])`);
      await expect(links).toHaveText(["← Trabajo", /^Siguiente →/]);
      await expect(links.nth(0)).toHaveAttribute("href", "/#trabajo");
      await expect(links.nth(1)).toHaveAttribute("href", c.next);
    });
  }

  test("«← Trabajo» lands on the reel of the home journey", async ({ page }) => {
    await open(page, "/trabajo/santi-nuca");
    await page.locator('[data-proof="santi-nuca"] .proof-links a', { hasText: "← Trabajo" }).click();
    await expect(page).toHaveURL(/\/#trabajo$|\/$/);
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    await expect.poll(() => reelTop(page), { timeout: 8000 }).toBeLessThan(80);
    expect(await reelTop(page)).toBeGreaterThan(-80);
  });

  test("«Siguiente →» chains the cases, then returns to Capacidades", async ({ page }) => {
    await open(page, "/trabajo/travelsuite360");
    for (const c of CASES) {
      await expect(page).toHaveURL(new RegExp(`/trabajo/${c.slug}$`));
      await page.locator(`[data-proof="${c.slug}"] .proof-links a`, { hasText: "Siguiente →" }).click();
    }
    await expect(page).toHaveURL(/\/#capacidades$/);
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    await expect
      .poll(() => page.evaluate(() => Math.round(document.getElementById("capacidades")!.getBoundingClientRect().top)), { timeout: 8000 })
      .toBeLessThan(120);
  });

  test("the header leads home: Perfil and «Ahora, el tuyo» are the home's sections", async ({ page }) => {
    await open(page, "/trabajo/chef-arturo");
    await expect(page.locator(".site-nav a", { hasText: "Perfil" })).toHaveAttribute("href", "/#perfil");
    await page.locator(".site-nav a", { hasText: "Perfil" }).click();
    await expect(page).toHaveURL(/\/#perfil$/);
    await expect
      .poll(() => page.evaluate(() => Math.abs(Math.round(document.getElementById("perfil")!.getBoundingClientRect().top))), { timeout: 8000 })
      .toBeLessThan(120);
  });
});

test.describe("back to the reel", () => {
  test("Back from a case returns to the reel where the visitor left it", async ({ page }) => {
    await open(page);
    await page.evaluate(() => document.getElementById("trabajo")!.scrollIntoView({ behavior: "instant" }));
    await settled(page);
    // where the visitor leaves from: the door in view, the position remembered once scrolling settles
    const enter = page.locator('.reel-item[data-index="0"] [data-enter]');
    await enter.scrollIntoViewIfNeeded();
    await settled(page);
    await page.waitForTimeout(500);
    const y = await page.evaluate(() => Math.round(window.scrollY));
    await enter.click();
    await expect(page).toHaveURL(/\/trabajo\/travelsuite360$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/$|\/#trabajo$/);
    // the journey lands on the remembered place once its scenes are built
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    await expect.poll(() => page.evaluate((y) => Math.abs(Math.round(window.scrollY) - y), y), { timeout: 8000 }).toBeLessThanOrEqual(2);
  });
});

test.describe("without JavaScript", () => {
  test("a case is readable from its first line: the world's copy, the proof and its links", async ({ browser }, info) => {
    const ctx = await browser.newContext({ ...info.project.use, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/trabajo/chef-arturo");
    await expect(page.locator("#chef-arturo")).toHaveCount(1);
    await expect(page.locator('[data-proof="chef-arturo"] .proof-links a', { hasText: "← Trabajo" })).toBeVisible();
    await expect(page.getByText("Tienda real, en línea.")).toBeVisible();
    // the reel in the home offers every case as a plain link
    await page.goto("/");
    for (const c of CASES) await expect(page.locator(`#trabajo a[href="/trabajo/${c.slug}"]`).first()).toHaveCount(1);
    await ctx.close();
  });
});
