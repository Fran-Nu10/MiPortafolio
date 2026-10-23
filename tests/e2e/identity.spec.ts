import { expect, test, type Page } from "@playwright/test";
import { settled } from "./scroll";

/**
 * Blue Edition (docs/27 §1, Content Master 25): the portfolio's one decorative accent is #6488FF.
 * The old red survives only as two things that are not the portfolio's identity: the form's error
 * (a semantic convention) and Rayo Smash's own field (the project's brand). Project media — films,
 * photographs, captures — are never recoloured, so they are not inspected here.
 */

const RED = "rgb(230, 59, 46)";
const ACCENT = "rgb(100, 136, 255)";

/** every painted colour of every element and its ::before/::after, outside project media */
const redPaint = (page: Page) =>
  page.evaluate((red) => {
    const props = ["color", "backgroundColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "outlineColor", "fill", "stroke", "boxShadow", "textDecorationColor", "caretColor"] as const;
    const hits: string[] = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      if (el.closest("img, video, picture, .still, .cutout")) continue;
      // only what is painted: an element without a box (display none, an empty route error) paints nothing
      if (!el.getClientRects().length) continue;
      for (const pseudo of [null, "::before", "::after"]) {
        const cs = getComputedStyle(el, pseudo);
        if (pseudo && (cs.content === "none" || cs.content === "normal")) continue;
        for (const p of props) {
          const v = String(cs[p]);
          if (v.includes(red) || v.includes("230 59 46")) hits.push(`${el.tagName.toLowerCase()}.${el.getAttribute("class") ?? ""}${pseudo ?? ""} ${p}`);
        }
      }
    }
    return hits;
  }, RED);

test.describe("Blue Edition", () => {
  test("the accent token is #6488FF; the home paints no red anywhere, top to bottom", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440" && info.project.name !== "sm-390" && info.project.name !== "rm-1440", "three passes are enough");
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim().toLowerCase())).toBe("#6488ff");
    // the scenes set their colours as they play: look at rest at several places of the journey
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const vh = page.viewportSize()!.height;
    const hits = new Set<string>();
    for (let y = 0; y < total; y += vh * 1.5) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(y));
      await settled(page);
      await page.waitForTimeout(250);
      for (const h of await redPaint(page)) hits.add(h);
    }
    expect([...hits]).toEqual([]);
    // the accent is there, where it marks: THE SHIFT's protagonists, the vision's line, the CTA
    for (const sel of ["#shift .shift-accent", "#vision .vision-accent", "#contacto .cta-title"]) {
      expect(await page.locator(sel).first().evaluate((e) => getComputedStyle(e).color), sel).toBe(ACCENT);
    }
  });

  test("red stays semantic: a form error's mark and border", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440" && info.project.name !== "sm-390", "twice");
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    await page.locator("#contacto").scrollIntoViewIfNeeded();
    await page.locator(".brief-submit").click();
    // focus goes to the first error (and focus wins its border): read an invalid field that is not focused
    const field = page.locator('.field-input[aria-invalid="true"]:not(:focus)').first();
    await expect(field).toBeVisible();
    await page.waitForTimeout(300);
    expect(await field.evaluate((e) => getComputedStyle(e).borderTopColor)).toBe(RED);
    const mark = await page.locator(".field-error").first().evaluate((e) => getComputedStyle(e, "::before").backgroundColor);
    expect(mark).toBe(RED);
    // the message itself reads in paper, not in red
    expect(await page.locator(".field-error").first().evaluate((e) => getComputedStyle(e).color)).toBe("rgb(237, 232, 222)");
  });

  test("a project keeps its own colours: Rayo Smash's field is its red", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440", "once");
    await page.goto("/trabajo/rayo-smash", { waitUntil: "networkidle" });
    expect(await page.locator('.world[data-env="red"] .world-env').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(RED);
  });
});
