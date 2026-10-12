import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { scenesBuilt } from "./scroll";

/**
 * Phase 10: Franco at work (Spec §13) and the human moment (Spec §02 S7). Both ship behind
 * flags (off until their media is approved); a preview build (`PREVIEW_MOMENTS=1` at build
 * time) renders their placeholders, and only then do these tests run — otherwise they skip
 * and the journey must simply go on without them.
 */

const reduced = (page: Page) => page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
const tiny = (page: Page) => {
  const v = page.viewportSize()!;
  return v.width < 360 || v.height < 560;
};

async function open(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toHaveAttribute("data-started", "");
  await scenesBuilt(page);
}

const pin = (page: Page, sel: string) =>
  page.evaluate((sel) => {
    const stage = document.querySelector<HTMLElement>(`${sel} [data-part=stage]`)!;
    const holder = stage.parentElement!;
    return { top: holder.getBoundingClientRect().top + window.scrollY, len: holder.offsetHeight - stage.offsetHeight };
  }, sel);

const frame = (page: Page) =>
  page.evaluate(() => {
    const f = document.querySelector<HTMLElement>('[data-moment="at-work"] [data-part="frame"]')!;
    const r = f.getBoundingClientRect();
    const cs = getComputedStyle(f);
    const m = cs.transform.match(/^matrix\(([^)]+)\)$/);
    const [a, b, c, d] = m ? m[1].split(",").map(Number) : [1, 0, 0, 1];
    return { x: r.x, y: r.y, w: r.width, h: r.height, clip: cs.clipPath, scale: a, uniform: Math.abs(b) < 1e-3 && Math.abs(c) < 1e-3 && Math.abs(a - d) < 1e-3, visW: 0, visH: 0 };
  });

test.describe("Franco at work (Spec §13)", () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
    test.skip((await page.locator('[data-moment="at-work"]').count()) === 0, "features.francoAtWork is off (no preview build)");
  });

  test("silent and decorative; the placeholder carries no imagery or text; 200vh of pin", async ({ page }) => {
    const s = page.locator('[data-moment="at-work"]');
    await expect(s).toHaveAttribute("aria-label", "Franco trabajando");
    await expect(s).toHaveAttribute("aria-hidden", "true");
    expect(await s.locator("a, button, input, [tabindex]").count()).toBe(0);
    expect(await s.locator("img, video").count()).toBe(0);
    expect((await s.innerText()).trim()).toBe("");
    expect(await s.locator("[data-placeholder]").count()).toBe(1);
    expect(await s.locator('[data-part="monitor-block"]').count()).toBe(1);
    const p = await pin(page, '[data-moment="at-work"]');
    const vh = page.viewportSize()!.height;
    if ((await reduced(page)) || tiny(page)) expect(p.len).toBe(0);
    else expect(p.len / vh).toBeCloseTo(2, 1);
  });

  test("the frame grows from its start size to ≈ 95% with a uniform scale + clip (never width/height), holds, then closes to the monitor", async ({ page }, info) => {
    test.skip((await reduced(page)) || tiny(page), "no growth under reduced motion / tiny viewports");
    const p = await pin(page, '[data-moment="at-work"]');
    const vw = page.viewportSize()!.width;
    const vh = page.viewportSize()!.height;
    const at = async (f: number) => {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(p.top + f * p.len));
      await page.waitForTimeout(900);
    };
    // the layout box never changes: only transform and clip
    const box0 = await page.evaluate(() => {
      const f = document.querySelector<HTMLElement>('[data-moment="at-work"] [data-part="frame"]')!;
      return { w: f.offsetWidth, h: f.offsetHeight };
    });
    expect(Math.abs(box0.w - 0.95 * vw)).toBeLessThan(1.5);
    expect(Math.abs(box0.h - (vw < 768 ? 0.92 : 0.95) * vh)).toBeLessThan(1.5);

    await at(0);
    const s0 = await frame(page);
    expect(s0.uniform).toBe(true);
    expect(s0.scale).toBeLessThan(1);
    expect(s0.clip).toMatch(/inset\(/);
    await expect(page.locator('[data-moment="at-work"] [data-part="stage"]')).toHaveAttribute("data-state", "START");
    await info.attach("start", { body: await page.screenshot(), contentType: "image/png" });

    await at(0.3);
    const s3 = await frame(page);
    expect(s3.scale).toBeGreaterThan(s0.scale);
    expect(s3.scale).toBeLessThan(1);
    expect(s3.uniform).toBe(true);

    await at(0.62);
    const s6 = await frame(page);
    expect(s6.scale).toBeCloseTo(1, 1);
    expect(s6.w).toBeCloseTo(0.95 * vw, -1);
    expect(s6.clip).toMatch(/inset\(0px(\s0px)*\)|none/);
    await expect(page.locator('[data-moment="at-work"] [data-part="stage"]')).toHaveAttribute("data-state", "FULL");
    expect(await page.locator('[data-moment="at-work"] [data-part="monitor"]').evaluate((e) => getComputedStyle(e).visibility)).toBe("hidden");
    await info.attach("full", { body: await page.screenshot(), contentType: "image/png" });

    // the hold
    await at(0.8);
    expect((await frame(page)).scale).toBeCloseTo(1, 1);

    // the transition boundary: the black plane's hole closes to the monitor
    await at(1);
    const plane = await page.locator('[data-moment="at-work"] [data-part="monitor"]').evaluate((e) => ({ vis: getComputedStyle(e).visibility, clip: getComputedStyle(e).clipPath }));
    expect(plane.vis).toBe("visible");
    expect(plane.clip).toMatch(/polygon\(evenodd/);
    // the hole is the contract's monitorFocus: desktop x 34% / mobile x 20%
    expect(plane.clip).toMatch(vw < 768 ? /20(\.0+)?% 36(\.0+)?%/ : /34(\.0+)?% 30(\.0+)?%/);
    await expect(page.locator('[data-moment="at-work"] [data-part="stage"]')).toHaveAttribute("data-state", "CLOSE");
    await info.attach("close", { body: await page.screenshot(), contentType: "image/png" });
    // after the pin the CTA follows on black
    const cta = await page.evaluate(() => document.getElementById("contacto")!.getBoundingClientRect().top);
    expect(cta).toBeLessThan(vh * 2);
  });

  test("reduced motion: the frame at 95% as a still, no growth, the close is a cut", async ({ page }) => {
    test.skip(!(await reduced(page)), "reduced motion project only");
    await page.locator('[data-moment="at-work"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const f = await frame(page);
    expect(f.scale).toBe(1);
    expect(f.w).toBeCloseTo(0.95 * page.viewportSize()!.width, -1);
    expect(await page.locator('[data-moment="at-work"] [data-part="monitor"]').evaluate((e) => getComputedStyle(e).visibility)).toBe("hidden");
  });
});

test.describe("human moment (Spec §02 S7)", () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
    test.skip((await page.locator('[data-moment="human"]').count()) === 0, "features.humanMoment is off (no preview build)");
  });

  test("silent, aria-hidden, nothing focusable; between the Rayo proof and the Santi world", async ({ page }) => {
    const s = page.locator('[data-moment="human"]');
    await expect(s).toHaveAttribute("aria-hidden", "true");
    expect(await s.locator("a, button, [tabindex]").count()).toBe(0);
    expect((await s.innerText()).trim()).toBe("");
    const order = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll("main > section, main > div > section")).map((e) => e.id || e.getAttribute("data-moment") || e.getAttribute("aria-labelledby") || "");
      return ids.filter(Boolean);
    });
    const i = order.indexOf("human");
    expect(order[i - 1]).toBe("rayo-smash-proof-h");
    expect(order[i + 1]).toBe("santi-nuca");
  });

  test("the aperture: a centered band opens to full over the first half of the pass and closes to black over the end; full under reduced motion", async ({ page }) => {
    const win = page.locator('[data-moment="human"] [data-part="window"]');
    const clip = () => win.evaluate((e) => getComputedStyle(e).clipPath);
    const sec = await page.evaluate(() => {
      const r = document.querySelector('[data-moment="human"]')!.getBoundingClientRect();
      return { top: r.top + window.scrollY, h: r.height };
    });
    const vh = page.viewportSize()!.height;
    const at = async (p: number) => {
      // the flow scene's pass: top at 80% of the viewport → bottom at 20%
      const start = sec.top - 0.8 * vh;
      const end = sec.top + sec.h - 0.2 * vh;
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(start + p * (end - start)));
      await page.waitForTimeout(800);
    };
    if (await reduced(page)) {
      await at(0.5);
      expect(await clip()).toMatch(/none/);
      return;
    }
    await at(0.05);
    expect(await clip()).toMatch(/inset\((3\d|4\d)(\.\d+)?%/);
    await at(0.6);
    expect(await clip()).toMatch(/inset\(0(%|px)?( 0(%|px)?)*\)/);
    await at(1);
    expect(await clip()).toMatch(/inset\((4\d|50)(\.\d+)?%/);
    expect(await page.locator('[data-moment="human"] [data-part="frame"]').evaluate((e) => getComputedStyle(e).position)).toBe("sticky");
  });
});

test.describe("both moments", () => {
  test("axe clean; nothing in the moments reaches the accessibility tree", async ({ page }) => {
    await open(page);
    test.skip((await page.locator("[data-moment]").count()) === 0, "flags off");
    const results = await new AxeBuilder({ page }).include("[data-moment]").analyze();
    expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
  });
});
