import { expect, test, type Page } from "@playwright/test";
import { watchConsole } from "./console";
import { jump } from "./scroll";

/**
 * Phase 2 acceptance (Spec §26): first paint < 1 s · scroll during O0–O2 jumps to O3 ·
 * FRANCO behind / NÚÑEZ in front at 320, 390, 768, 1024, 1440, 1920 · no horizontal overflow ·
 * reduced motion · no-JS · reload · deep link. (The 2.5 s decode fallback is unit tested in
 * tests/opening.test.ts; it needs the real portrait to be exercised end to end.)
 */

// viewports and preferences are set per test: run once, on the reference project
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "xl-1440", "viewport set per test");
});

const GESTURE = (w: number) => (w >= 1024 ? 80 : w >= 768 ? 70 : 60);
const phase = (page: Page) => page.locator('#inicio [data-part="stage"]').getAttribute("data-phase");
const headerOpacity = (page: Page) => page.evaluate(() => Number(getComputedStyle(document.querySelector(".site-header")!).opacity));

/** scroll position of a hero label (units: O2 0 · O3 1 · H1 2 · H2 3 of 3.25) */
async function scrollToLabel(page: Page, at: number, units = 3.25, rm = false) {
  const { w, h } = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
  const pin = ((units * (rm ? 50 : GESTURE(w))) / 100) * h;
  await jump(page, Math.round((at / units) * pin));
}


test.describe("opening", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("O0 → O1 → O2 in time; first paint < 1 s; header only after O2", async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto("/");
    await expect.poll(() => phase(page)).toMatch(/O0|O1/);
    expect(await headerOpacity(page)).toBeLessThan(0.05);
    await expect(page.locator('[data-part="index-0"]')).toBeHidden();
    await expect.poll(() => phase(page), { timeout: 4000 }).toBe("O2");
    await expect(page.locator('[data-part="index-0"]')).toBeVisible();
    await expect.poll(() => headerOpacity(page)).toBeGreaterThan(0.95);
    // the band is a 14vh window
    const clip = await page.evaluate(() => getComputedStyle(document.querySelector('[data-part="aperture"]')!).clipPath);
    expect(clip).toMatch(/inset\(43% 0%/);
    const fp = await page.evaluate(() => performance.getEntriesByName("first-paint")[0]?.startTime ?? Infinity);
    expect(fp).toBeLessThan(1000);
    expect(problems).toEqual([]);
  });

  test("scrolling during O0–O2 jumps straight to the scroll states", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#inicio")).toHaveAttribute("data-built", "");
    // the pin is measured on the frame after the build (one coalesced refresh)
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    expect(await phase(page)).toMatch(/O0|O1/);
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 700);
    await expect.poll(() => phase(page), { timeout: 5000 }).toMatch(/O3|H1|H2/);
    expect(await headerOpacity(page)).toBeGreaterThan(0.5);
  });

  test("O3 opens the band and ticks 00 → 01; H1 shows the composition; H2 parts it", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => phase(page), { timeout: 4000 }).toBe("O2");
    await scrollToLabel(page, 1);
    await expect.poll(() => phase(page)).toBe("O3");
    await expect(page.locator('[data-part="index-1"]')).toBeVisible();
    await expect(page.locator('[data-part="index-0"]')).toBeHidden();
    await scrollToLabel(page, 2);
    await expect.poll(() => phase(page)).toBe("H1");
    await page.waitForTimeout(900);
    const shown = await page.evaluate(() =>
      ["first", "last", "firma", "support"].map((p) => getComputedStyle(document.querySelector(`#inicio [data-part="${p}"]`)!).transform),
    );
    for (const t of shown) expect(t === "none" || /matrix\(1, 0, 0, 1, 0, 0\)/.test(t)).toBe(true);
    const before = await page.locator('[data-part="portrait"]').boundingBox();
    await scrollToLabel(page, 3);
    await expect.poll(() => phase(page)).toBe("H2");
    await page.waitForTimeout(900);
    const after = await page.locator('[data-part="portrait"]').boundingBox();
    expect(before!.y - after!.y).toBeGreaterThan(900 * 0.1);
    const op = await page.evaluate(() => Number(getComputedStyle(document.querySelector('[data-part="portrait"]')!).opacity));
    expect(op).toBeCloseTo(0.55, 1);
  });
});

for (const [w, h] of [
  [320, 568],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1440, 900],
  [1920, 1080],
] as const) {
  test(`${w}×${h} · FRANCO behind the body, NÚÑEZ in front, no overflow`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const problems = watchConsole(page);
    await page.goto("/");
    const tiny = w < 360 || h < 560;
    if (tiny) {
      // very small viewports: no pin, the static composition (Spec §24)
      await expect(page.locator("#inicio")).not.toHaveAttribute("data-anim", /.*/);
    } else {
      await expect.poll(() => phase(page), { timeout: 4000 }).toBe("O2");
      await scrollToLabel(page, 2);
      await expect.poll(() => phase(page)).toBe("H1");
      await page.waitForTimeout(1000);
    }
    const result = await page.evaluate(() => {
      const box = (p: string) => document.querySelector(`#inicio [data-part="${p}"]`)!.getBoundingClientRect();
      const portrait = box("portrait");
      const probe = (name: "first" | "last") => {
        const r = box(name);
        const x0 = Math.max(r.left, portrait.left), x1 = Math.min(r.right, portrait.right, innerWidth - 1);
        const y0 = Math.max(r.top, portrait.top), y1 = Math.min(r.bottom, portrait.bottom);
        if (x1 <= x0 || y1 <= y0) return "no-overlap";
        const hit = document.elementFromPoint((x0 + x1) / 2, (y0 + y1) / 2);
        if (hit?.closest('[data-part="last"]')) return "last";
        if (hit?.closest('[data-part="portrait"]')) return "portrait";
        if (hit?.closest('[data-part="first"]')) return "first";
        return hit?.className ?? "nothing";
      };
      return { first: probe("first"), last: probe("last"), overflow: document.documentElement.scrollWidth };
    });
    result.overflow -= w;
    expect(result.first, "the body covers FRANCO").toBe("portrait");
    expect(result.last, "NÚÑEZ covers the body").toBe("last");
    expect(result.overflow).toBeLessThanOrEqual(0);
    expect(problems).toEqual([]);
  });
}

test.describe("reduced motion", () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });

  test("two states, no band, header at once", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#inicio")).toHaveAttribute("data-built", "");
    expect(await phase(page)).toBe("O2");
    const clip = await page.evaluate(() => getComputedStyle(document.querySelector('[data-part="aperture"]')!).clipPath);
    expect(clip).toMatch(/none|inset\(0(%|px)/);
    await expect.poll(() => headerOpacity(page)).toBeGreaterThan(0.95);
    await expect(page.locator('#inicio [data-part="first"]')).toBeHidden();
    await scrollToLabel(page, 0.5, 1, true);
    await expect.poll(() => phase(page)).toBe("H1");
    await expect(page.locator('#inicio [data-part="first"]')).toBeVisible();
    await expect(page.locator('#inicio [data-part="support"]')).toBeVisible();
    await expect(page.locator('[data-part="line"]')).toBeHidden();
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });

  test("the hero is the readable static composition", async ({ page }) => {
    await page.goto("/");
    for (const p of ["first", "last", "firma", "support"]) await expect(page.locator(`#inicio [data-part="${p}"]`)).toBeVisible();
    const clip = await page.evaluate(() => getComputedStyle(document.querySelector('[data-part="aperture"]')!).clipPath);
    expect(clip).toBe("none");
    expect(await headerOpacity(page)).toBe(1);
  });
});

test.describe("reload and deep links", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("reloading mid-hero never replays the opening over a scrolled page", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => phase(page), { timeout: 4000 }).toBe("O2");
    await scrollToLabel(page, 2);
    await expect.poll(() => phase(page)).toBe("H1");
    await page.reload();
    await expect(page.locator("#inicio")).toHaveAttribute("data-built", "");
    const y = await page.evaluate(() => window.scrollY);
    if (y > 0) {
      await expect.poll(() => phase(page)).toMatch(/O2|O3|H1|H2/);
      await expect.poll(() => headerOpacity(page)).toBeGreaterThan(0.95);
    } else {
      await expect.poll(() => phase(page), { timeout: 4000 }).toBe("O2");
    }
  });

  test("a deep link starts at the world: no hero, no opening, the header shown", async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto("/trabajo/santi-nuca");
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    await expect.poll(() => page.evaluate(() => Math.abs(document.getElementById("santi-nuca")!.getBoundingClientRect().top))).toBeLessThan(4);
    // a case is its own document (docs/25): the opening belongs to the home journey only
    await expect(page.locator("#inicio")).toHaveCount(0);
    await expect.poll(() => headerOpacity(page)).toBeGreaterThan(0.95);
    expect(problems).toEqual([]);
  });
});
