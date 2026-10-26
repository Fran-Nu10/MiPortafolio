import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 3 acceptance (Spec §26): vertical wheel over the reel scrolls the page (synthetic
 * wheel events) · one piece per gesture · only one <video> playing · keyboard-only operation ·
 * axe clean. Plus drag, touch swipe, buttons, live region, focus, cursor, RM and no-JS.
 */

const activeIndex = (page: Page) => page.locator("#trabajo .reel-item[data-active]").getAttribute("data-index").then(Number);
const trackX = (page: Page) =>
  page.evaluate(() => new DOMMatrixReadOnly(getComputedStyle(document.querySelector('#trabajo [data-part="track"]')!).transform).m41);

/** bring the reel stage to the top of the viewport: the frame then sits at reel geometry */
async function toReel(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const stage = document.querySelector('#trabajo [data-part="stage"]')!;
    window.scrollTo({ top: stage.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
  });
  await page.waitForTimeout(400);
}

/** settle wait: the 420 ms tween plus a margin */
const settle = (page: Page) => page.waitForTimeout(650);

test.describe("geometry", () => {
  test("heading and cards are one composition (docs/26 §A1): the title just above the film; the card centered (phones: from the gutter, the usable width, docs/28 §2)", async ({ page }) => {
    await toReel(page);
    const g = await page.evaluate(() => {
      const f = document.querySelector('#trabajo .reel-item[data-active] [data-part="frame"]')!.getBoundingClientRect();
      const h = document.querySelector("#trabajo .reel-header")!.getBoundingClientRect();
      const m = document.querySelector("#trabajo .reel-item[data-active] .reel-meta")!.getBoundingClientRect();
      const st = document.querySelector('#trabajo [data-part="stage"]')!.getBoundingClientRect();
      return { vw: innerWidth, vh: innerHeight, f: [f.x, f.y, f.width, f.height], gap: f.top - h.bottom, metaBottom: m.bottom, stageBottom: st.bottom, headerTop: h.top };
    });
    // tablets and up: the card centered across the viewport; phones: it starts at the gutter (16 px) and
    // takes the usable width, a sliver of the next one left at the right — never a narrow centred card
    if (g.vw >= 768) expect(Math.abs(g.f[0] - (g.vw - g.f[2]) / 2)).toBeLessThan(1.5);
    else {
      expect(Math.abs(g.f[0] - 16)).toBeLessThan(1.5);
      expect(g.f[2]).toBeGreaterThanOrEqual(g.vw - 32 - 28);
    }
    // the heading 16–40 px above it
    expect(g.gap).toBeGreaterThanOrEqual(12);
    expect(g.gap).toBeLessThanOrEqual(40);
    // the stage ends with its meta: no block of black under it
    expect(g.stageBottom - g.metaBottom).toBeLessThan(g.vw < 768 ? 140 : 80);
    // tablets and up: the heading clears the site header, and heading + card + meta fit one screen
    if (g.vw >= 768) {
      expect(g.headerTop).toBeGreaterThanOrEqual(56);
      expect(g.metaBottom).toBeLessThanOrEqual(g.vh + 1);
    }
  });

  test("no horizontal overflow with the reel laid out", async ({ page }) => {
    await toReel(page);
    const w = page.viewportSize()!.width;
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  });
});

test.describe("pointer and wheel", () => {
  test.beforeEach(({ isMobile }) => test.skip(isMobile, "mouse and trackpad are desktop inputs"));

  test("the vertical wheel over the reel scrolls the page; the reel stays", async ({ page }) => {
    await toReel(page);
    const y0 = await page.evaluate(() => window.scrollY);
    const box = (await page.locator('#trabajo [data-part="viewport"]').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y0 + 300);
    expect(await activeIndex(page)).toBe(0);
  });

  test("a horizontal trackpad gesture moves exactly one piece", async ({ page }) => {
    await toReel(page);
    /**
     * One trackpad gesture, dispatched in-page as a burst: a synthetic event's timeStamp is its
     * creation time, so a loaded test machine would otherwise open gaps a real trackpad never has
     * (real input carries OS timestamps). The timing rules themselves are unit tested.
     */
    const gesture = (dx: number, events: number) =>
      page.evaluate(
        ([dx, events]) => {
          const v = document.querySelector('#trabajo [data-part="viewport"]')!;
          for (let n = 0; n < events; n++) v.dispatchEvent(new WheelEvent("wheel", { deltaX: dx, deltaY: 1, bubbles: true, cancelable: true }));
        },
        [dx, events],
      );
    const y0 = await page.evaluate(() => window.scrollY);
    await gesture(30, 25);
    await settle(page);
    expect(await activeIndex(page)).toBe(1);
    expect(await page.evaluate(() => window.scrollY)).toBe(y0);
    await page.waitForTimeout(350);
    await gesture(30, 6);
    await settle(page);
    expect(await activeIndex(page)).toBe(2);
    await page.waitForTimeout(350);
    await gesture(-30, 6);
    await settle(page);
    expect(await activeIndex(page)).toBe(1);
  });

  test("drag: past 20% moves one piece, a short drag returns, a flick moves", async ({ page }) => {
    await toReel(page);
    const frame = (await page.locator('#trabajo .reel-item[data-active] [data-part="frame"]').boundingBox())!;
    const cy = frame.y + frame.height / 2;
    const cx = frame.x + frame.width / 2;
    const restX = await trackX(page);

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 0.05 * frame.width, cy, { steps: 8 });
    await page.waitForTimeout(120); // slow: no flick
    await page.mouse.up();
    await settle(page);
    expect(await activeIndex(page)).toBe(0);
    expect(Math.abs((await trackX(page)) - restX)).toBeLessThan(1);
    await expect(page).toHaveURL(/\/$/); // the drag was not a click on the active frame

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 0.3 * frame.width, cy, { steps: 12 });
    await page.waitForTimeout(150);
    await page.mouse.up();
    await settle(page);
    expect(await activeIndex(page)).toBe(1);

    // a flick: 15% of the width (under the 20% distance rule), released while still moving —
    // dispatched in-page 12 ms apart so runner latency cannot turn it into a stopped finger
    await page.evaluate(
      ([cx, cy, dist]) => {
        const v = document.querySelector<HTMLElement>('#trabajo [data-part="viewport"]')!;
        const spin = (ms: number) => {
          const end = performance.now() + ms;
          while (performance.now() < end);
        };
        const ev = (type: string, x: number) =>
          v.dispatchEvent(new PointerEvent(type, { pointerId: 3, pointerType: "mouse", isPrimary: true, button: 0, clientX: x, clientY: cy, bubbles: true }));
        ev("pointerdown", cx);
        for (let i = 1; i <= 4; i++) {
          spin(12);
          ev("pointermove", cx - (dist * i) / 4);
        }
        spin(12);
        ev("pointerup", cx - dist);
      },
      [cx, cy, 0.15 * frame.width],
    );
    await settle(page);
    expect(await activeIndex(page)).toBe(2);
  });

  test("click: a neighbour comes to the center, the active frame enters its world", async ({ page }) => {
    await toReel(page);
    const vw = page.viewportSize()!.width;
    const frame = (await page.locator('#trabajo .reel-item[data-active] [data-part="frame"]').boundingBox())!;
    await page.mouse.click(Math.min(vw - 20, frame.x + frame.width + 60), frame.y + frame.height / 2);
    await settle(page);
    expect(await activeIndex(page)).toBe(1);
    const active = (await page.locator('#trabajo .reel-item[data-active] [data-part="frame"]').boundingBox())!;
    await page.mouse.click(active.x + active.width / 2, active.y + active.height / 2);
    await expect(page).toHaveURL(/\/trabajo\/rayo-smash$/);
  });

  test("the whole active card is the door: a click on its metadata enters the project too (docs/23 §6)", async ({ page }) => {
    await toReel(page);
    // the active card: TravelSuite360. Its name, not its frame
    const name = page.locator('#trabajo .reel-item[data-active] .reel-name');
    await expect(name).toHaveText("TravelSuite360");
    const box = (await name.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page).toHaveURL(/\/trabajo\/travelsuite360$/);
    // one door per card: the card itself holds no nested interactive control besides its links
    await page.goto("/", { waitUntil: "networkidle" });
    const piece = page.locator("#trabajo .reel-item").first().locator(".reel-piece");
    expect(await piece.locator("button, [role=button], [tabindex='0']:not(a)").count()).toBe(0);
    expect(await piece.locator("a a").count()).toBe(0);
  });

  test("the cursor names the action: Ver on the active frame, an arrow on a neighbour", async ({ page, hasTouch }, testInfo) => {
    test.skip(hasTouch || testInfo.project.use.reducedMotion === "reduce", "fine pointers with motion only (Spec §06, §16)");
    await toReel(page);
    const cursor = page.locator(".reel-cursor");
    await expect(cursor).toHaveCount(1);
    const frame = (await page.locator('#trabajo .reel-item[data-active] [data-part="frame"]').boundingBox())!;
    await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2, { steps: 4 });
    await expect(cursor.locator(".reel-cursor-word")).toHaveText("Ver");
    // over the card's metadata too: the whole card is the door
    const meta = (await page.locator('#trabajo .reel-item[data-active] .reel-name').boundingBox())!;
    await page.mouse.move(meta.x + meta.width / 2, meta.y + meta.height / 2, { steps: 4 });
    await expect(cursor.locator(".reel-cursor-word")).toHaveText("Ver");
    const vw = page.viewportSize()!.width;
    await page.mouse.move(Math.min(vw - 20, frame.x + frame.width + 60), frame.y + frame.height / 2, { steps: 4 });
    await expect(cursor.locator(".reel-cursor-word")).toHaveText("→");
  });
});

test.describe("touch", () => {
  test.beforeEach(({ isMobile }) => test.skip(!isMobile, "touch projects only"));

  /** synthetic touch pointer stream on the viewport (what a finger produces) */
  async function swipe(page: Page, dx: number, dy: number) {
    await page.evaluate(
      ([dx, dy]) => {
        const v = document.querySelector<HTMLElement>('#trabajo [data-part="viewport"]')!;
        const r = v.getBoundingClientRect();
        const x0 = r.left + r.width / 2;
        const y0 = r.top + r.height * 0.4;
        const ev = (type: string, x: number, y: number, t: number) =>
          v.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: "touch", isPrimary: true, clientX: x, clientY: y, bubbles: true, timeStamp: t } as PointerEventInit));
        ev("pointerdown", x0, y0, 0);
        for (let i = 1; i <= 10; i++) ev("pointermove", x0 + (dx * i) / 10, y0 + (dy * i) / 10, i * 16);
        ev("pointerup", x0 + dx, y0 + dy, 180);
      },
      [dx, dy],
    );
    await settle(page);
  }

  test("a horizontal swipe moves one piece; a vertical one leaves the reel alone", async ({ page }) => {
    await toReel(page);
    const w = page.viewportSize()!.width;
    await swipe(page, -0.4 * w, 6);
    expect(await activeIndex(page)).toBe(1);
    await swipe(page, 8, -200);
    expect(await activeIndex(page)).toBe(1);
    await swipe(page, 0.4 * w, -4);
    expect(await activeIndex(page)).toBe(0);
  });

  test("four marks, labels kept for screen readers", async ({ page }) => {
    await toReel(page);
    const nav = page.getByRole("navigation", { name: "Proyectos" });
    await expect(nav.getByRole("button")).toHaveCount(4);
    await expect(nav.getByRole("button", { name: "02 · Rayo Smash" })).toBeVisible();
  });
});

test.describe("keyboard and buttons", () => {
  test("keyboard only: arrows, digits, Home/End, focus follows to the new Ver caso", async ({ page }) => {
    await toReel(page);
    const enter0 = page.locator('#trabajo .reel-item[data-index="0"] [data-enter]');
    await enter0.focus();
    await page.keyboard.press("ArrowRight");
    await settle(page);
    expect(await activeIndex(page)).toBe(1);
    await expect(page.locator('#trabajo .reel-item[data-index="1"] [data-enter]')).toBeFocused();
    await page.keyboard.press("4");
    await settle(page);
    expect(await activeIndex(page)).toBe(3);
    await page.keyboard.press("Home");
    await settle(page);
    expect(await activeIndex(page)).toBe(0);
    await page.keyboard.press("End");
    await settle(page);
    expect(await activeIndex(page)).toBe(3);
    await expect(page.locator("#trabajo [data-part=live]")).toHaveText("04 de 04 · Chef Arturo");
    // Enter on the active "Ver caso" enters its world
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/trabajo\/chef-arturo$/);
  });

  test("only the active piece's links are in the tab order", async ({ page }) => {
    await toReel(page);
    const tabs = await page.$$eval("#trabajo .reel-item a", (as) => as.map((a) => [a.closest(".reel-item")!.hasAttribute("data-active"), a.tabIndex]));
    for (const [isActive, tab] of tabs) expect(tab).toBe(isActive ? 0 : -1);
  });

  test("the 01–04 buttons jump, mark the current one and announce the settle", async ({ page }) => {
    await toReel(page);
    const nav = page.getByRole("navigation", { name: "Proyectos" });
    await nav.getByRole("button", { name: "03 · Santi Nuca" }).click();
    await settle(page);
    expect(await activeIndex(page)).toBe(2);
    await expect(nav.getByRole("button", { name: "03 · Santi Nuca" })).toHaveAttribute("aria-current", "true");
    await expect(page.locator("#trabajo [data-part=live]")).toHaveText("03 de 04 · Santi Nuca");
  });

  test("arrow keys elsewhere on the page do nothing to the reel", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(500);
    expect(await activeIndex(page)).toBe(0);
  });
});

test.describe("media and accessibility", () => {
  test("never more than one video playing", async ({ page }) => {
    await toReel(page);
    // on arrival: the active film and, at most, its neighbour's metadata — never the four films
    expect(await page.locator("#trabajo video").count()).toBeLessThanOrEqual(2);
    for (const n of ["02", "03", "04"]) {
      await page.getByRole("navigation", { name: "Proyectos" }).getByRole("button", { name: new RegExp(`^${n} ·`) }).click();
      await settle(page);
      const playing = await page.evaluate(() => Array.from(document.querySelectorAll("video")).filter((v) => !v.paused && !v.ended).length);
      expect(playing).toBeLessThanOrEqual(1);
    }
    // the films (docs/26 §F): a card seen recently keeps its paused <video> for 10 s (the Phase 3 lifecycle);
    // the TravelSuite360 card shows its signed-off film, never an unapproved capture
    await expect(page.locator('#trabajo .reel-item[data-project="travelsuite360"] [data-placeholder]')).toHaveCount(0);
    expect(await page.locator('#trabajo img[src*="projects/travelsuite360"]').count()).toBe(0);
  });

  test("the active film plays: its time advances (AV1 first; H.264 where AV1 fails to decode, as in WebKit)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.use.reducedMotion === "reduce", "no <video> under reduced motion");
    await toReel(page);
    const film = () =>
      page.evaluate(() => {
        const v = document.querySelector<HTMLVideoElement>("#trabajo .reel-item[data-active] video");
        return v ? { t: v.currentTime, src: v.currentSrc } : null;
      });
    await expect.poll(async () => (await film())?.t ?? -1, { timeout: 15000 }).toBeGreaterThan(0.5);
    expect((await film())!.src).toMatch(/\/media\/reel\/travelsuite360-(desktop|mobile)\.(av1|h264)\.mp4$/);
  });

  test("axe: no serious or critical violations on the page", async ({ page }) => {
    await toReel(page);
    const results = await new AxeBuilder({ page }).analyze();
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("index changes are instant; prev/next are visible; no cursor", async ({ page }) => {
    await toReel(page);
    const next = page.getByRole("button", { name: "Proyecto siguiente" });
    await expect(next).toBeVisible();
    await expect(page.getByRole("button", { name: "Proyecto anterior" })).toBeDisabled();
    const before = await trackX(page);
    await next.click();
    await page.waitForTimeout(60);
    const after = await trackX(page);
    const w = await page.evaluate(() => document.querySelector("#trabajo .reel-item")!.getBoundingClientRect().width);
    expect(before - after).toBeGreaterThan(w * 0.9);
    expect(await activeIndex(page)).toBe(1);
    await expect(page.locator(".reel-cursor")).toHaveCount(0);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the reel is a readable list of the four products", async ({ page }) => {
    await page.goto("/");
    for (const name of ["TravelSuite360", "Rayo Smash", "Santi Nuca", "Chef Arturo"]) {
      await expect(page.locator("#trabajo").getByRole("heading", { level: 3, name })).toBeVisible();
    }
    await expect(page.locator("#trabajo").getByRole("link", { name: "Ver caso" })).toHaveCount(4);
    await expect(page.locator("#trabajo .reel-controls")).toBeHidden();
  });
});
