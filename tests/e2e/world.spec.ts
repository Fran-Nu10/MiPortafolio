import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

/**
 * Phase 4 acceptance (Spec §26): the reel frame and every world's SCREEN state are the same
 * picture at the same rectangle (screenshot diff ≤ 1% of pixels) · Back from a world returns to
 * the reel at the piece that was active · deep links, history and reload. Plus the shared
 * SCREEN → ISOLATE → WORLD grammar, the 01–04 overlay, reduced motion and no-JS.
 */

const SLUGS = ["travelsuite360", "rayo-smash", "santi-nuca", "chef-arturo"] as const;
type Slug = (typeof SLUGS)[number];

const activeIndex = (page: Page) => page.locator("#trabajo .reel-item[data-active]").getAttribute("data-index").then(Number);
const state = (page: Page, slug: Slug) => page.locator(`#${slug}`).getAttribute("data-state");
const tiny = (page: Page) => {
  const v = page.viewportSize()!;
  return v.width < 360 || v.height < 560;
};

const reduced = (page: Page) => page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

/** a world's start: its pinned stage at the top (tiny viewports: its name under the header) */
const atWorld = (page: Page, slug: Slug) =>
  expect
    .poll(() =>
      page.evaluate((slug) => {
        const tiny = innerWidth < 360 || innerHeight < 560;
        const el = document.querySelector(tiny ? `#${slug}` : `#${slug} [data-part="stage"]`)!;
        const want = tiny ? parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0 : 0;
        return Math.abs(el.getBoundingClientRect().top - want) < 2;
      }, slug),
    )
    .toBe(true);

function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") problems.push(m.text());
  });
  page.on("pageerror", (e) => problems.push(e.message));
  return problems;
}

/**
 * The reel stage at the top of the viewport (to the nearest pixel): the frame at the shared
 * rectangle. `onGrid`: the reel scrolls freely and its document top is fractional, while a
 * world's stage sticks exactly at 0; Chrome snaps each image's rows to device pixels, so a
 * frame 0.2 px off the grid draws its picture one row taller. For the pixel comparison the
 * reel section is nudged (< 1 px, test only) so its stage starts on a whole pixel too.
 */
async function toReel(page: Page, { onGrid = false } = {}) {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate((onGrid) => {
    const reel = document.getElementById("trabajo")!;
    const stage = reel.querySelector('[data-part="stage"]')!;
    if (onGrid) {
      const top = stage.getBoundingClientRect().top + window.scrollY;
      reel.style.marginTop = `${Math.ceil(top) - top}px`;
    }
    window.scrollTo({ top: Math.round(stage.getBoundingClientRect().top + window.scrollY), behavior: "instant" });
  }, onGrid);
  await page.waitForTimeout(400);
}

async function pick(page: Page, index: number) {
  await page.locator("#trabajo .reel-nav-item").nth(index).click();
  await page.waitForTimeout(650);
  expect(await activeIndex(page)).toBe(index);
}

/** the scroll position of a fraction of a world's pin (0 SCREEN · .4 ISOLATE · .8 WORLD) */
const worldY = (page: Page, slug: Slug, f: number) =>
  page.evaluate(
    ([slug, f]) => {
      const stage = document.querySelector<HTMLElement>(`#${slug} [data-part="stage"]`)!;
      const spacer = stage.parentElement!;
      const top = spacer.getBoundingClientRect().top + window.scrollY;
      return Math.round(top + f * (spacer.offsetHeight - stage.offsetHeight));
    },
    [slug, f] as const,
  );

async function scrollToFraction(page: Page, slug: Slug, f: number) {
  const y = await worldY(page, slug, f);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
}

/** every image inside `selector` decoded */
const imagesReady = (page: Page, selector: string) =>
  expect
    .poll(() =>
      page.evaluate(async (sel) => {
        const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(`${sel} img`));
        await Promise.all(imgs.map((i) => i.decode().catch(() => undefined)));
        return imgs.every((i) => i.complete && i.naturalWidth > 0);
      }, selector),
    )
    .toBe(true);

async function grab(page: Page, selector: string) {
  const r = await page.locator(selector).boundingBox();
  const clip = { x: Math.round(r!.x), y: Math.round(r!.y), width: Math.round(r!.width), height: Math.round(r!.height) };
  return { clip, png: await page.screenshot({ clip, animations: "disabled" }) };
}

/** share of pixels whose largest channel difference passes 24/255 */
async function diffShare(a: Buffer, b: Buffer) {
  const [ra, rb] = await Promise.all([a, b].map((x) => sharp(x).removeAlpha().raw().toBuffer({ resolveWithObject: true })));
  expect(rb.info.width).toBe(ra.info.width);
  expect(rb.info.height).toBe(ra.info.height);
  let off = 0;
  for (let i = 0; i < ra.data.length; i += 3) {
    const d = Math.max(Math.abs(ra.data[i] - rb.data[i]), Math.abs(ra.data[i + 1] - rb.data[i + 1]), Math.abs(ra.data[i + 2] - rb.data[i + 2]));
    if (d > 24) off++;
  }
  return off / (ra.data.length / 3);
}

test.describe("the shared rectangle", () => {
  test("each world's SCREEN is its reel frame: ≤ 1% of pixels differ", async ({ page }) => {
    test.skip(tiny(page), "tiny viewports read the worlds as static layout");
    for (const [i, slug] of SLUGS.entries()) {
      await toReel(page, { onGrid: true });
      await pick(page, i);
      // the cursor follows the pointer over the reel: keep it away
      await page.mouse.move(0, 0);
      const frame = `#trabajo .reel-item[data-index="${i}"] [data-part="frame"]`;
      await imagesReady(page, frame);
      const reel = await grab(page, frame);

      await page.goto(`/trabajo/${slug}`, { waitUntil: "networkidle" });
      await expect(page.locator("main")).toHaveAttribute("data-started", "");
      expect(await state(page, slug)).toBe("SCREEN");
      const screen = `#${slug} [data-part="screen"]`;
      await imagesReady(page, screen);
      const world = await grab(page, screen);

      // the same rectangle (Spec §07): within a pixel, at the same size
      for (const k of ["x", "y", "width", "height"] as const) expect(Math.abs(world.clip[k] - reel.clip[k]), `${slug} ${k}`).toBeLessThanOrEqual(1);
      world.clip.width = reel.clip.width;
      world.clip.height = reel.clip.height;
      const again = await page.screenshot({ clip: world.clip, animations: "disabled" });
      const share = await diffShare(reel.png, again);
      test.info().annotations.push({ type: "diff", description: `${slug}: ${(share * 100).toFixed(2)}%` });
      expect(share, slug).toBeLessThanOrEqual(0.01);
      // control: the same picture 3 px lower is not the same rectangle
      if (slug !== "travelsuite360") {
        const shifted = await page.screenshot({ clip: { ...world.clip, y: world.clip.y - 3 }, animations: "disabled" });
        const control = await diffShare(reel.png, shifted);
        test.info().annotations.push({ type: "control", description: `${slug} 3 px lower: ${(control * 100).toFixed(2)}%` });
        expect(control, `${slug} control`).toBeGreaterThan(0.01);
      }
    }
  });
});

test.describe("entering and leaving", () => {
  test("the jump keeps the rectangle where the visitor sees it, even off the reel's rest", async ({ page }) => {
    test.skip(tiny(page), "tiny viewports read the worlds as static layout");
    test.skip(test.info().project.use.reducedMotion === "reduce", "reduced motion cuts to WORLD");
    await toReel(page);
    await pick(page, 1);
    await page.evaluate(() => window.scrollBy({ top: -90, behavior: "instant" }));
    await page.waitForTimeout(100);
    // read both rectangles in the same task: the jump is synchronous, the smooth scroll follows
    const { reel, world } = await page.evaluate(() => {
      const box = (el: Element) => {
        const r = el.getBoundingClientRect();
        return [r.x, r.y, r.width, r.height];
      };
      const reel = box(document.querySelector('#trabajo .reel-item[data-active] [data-part="frame"]')!);
      document.querySelector<HTMLAnchorElement>("#trabajo .reel-item[data-active] [data-enter]")!.click();
      return { reel, world: box(document.querySelector('#rayo-smash [data-part="screen"]')!) };
    });
    expect(reel[1]).toBeGreaterThan(60);
    world.forEach((v, i) => expect(Math.abs(v - reel[i]), `rect[${i}]`).toBeLessThan(1.5));
  });

  test("Ver caso → one history entry, the world; Back → the reel at the same piece, no reload", async ({ page, isMobile }) => {
    const problems = watchConsole(page);
    await toReel(page);
    await pick(page, 2);
    await page.evaluate(() => ((window as unknown as { __marker: number }).__marker = 1));
    const reelY = await page.evaluate(() => window.scrollY);
    const stageTop = () => page.evaluate(() => document.querySelector('#trabajo [data-part="stage"]')!.getBoundingClientRect().top);
    const reelTop = await stageTop();
    const length = await page.evaluate(() => history.length);

    await page.locator("#trabajo .reel-item[data-active] [data-enter]").click();
    await expect(page).toHaveURL(/\/trabajo\/santi-nuca$/);
    await expect(page).toHaveTitle("Santi Nuca — Franco Núñez");
    expect(await page.evaluate(() => history.length)).toBe(length + 1);
    if (!tiny(page)) {
      // one gesture's smooth scroll to ISOLATE (reduced motion: a cut to WORLD)
      await expect.poll(() => state(page, "santi-nuca")).toBe((await reduced(page)) ? "WORLD" : "ISOLATE");
      // the second gesture: into the world (Santi's own states follow s:WORLD since Phase 7)
      if (isMobile) await scrollToFraction(page, "santi-nuca", 2 / 5.4);
      else for (let n = 0; n < 6; n++) await page.mouse.wheel(0, 120);
      await expect.poll(async () => ["SCREEN", "ISOLATE"].includes((await state(page, "santi-nuca")) ?? "")).toBe(false);
    }

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(reelY);
    expect(await activeIndex(page)).toBe(2);
    expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(1);
    // pinned: the stage at the top (tiny viewports: the list exactly where it was)
    expect(Math.abs((await stageTop()) - reelTop)).toBeLessThan(2);

    await page.goForward();
    await expect(page).toHaveURL(/\/trabajo\/santi-nuca$/);
    await atWorld(page, "santi-nuca");
    expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(1);
    expect(problems).toEqual([]);
  });

  test("a deep link lands at SCREEN with the hero out of sight; reload keeps the place", async ({ page }) => {
    test.skip(tiny(page), "tiny viewports read the worlds as static layout");
    const problems = watchConsole(page);
    await page.goto("/trabajo/chef-arturo");
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    await expect.poll(() => page.evaluate(() => Math.abs(document.querySelector('#chef-arturo [data-part="stage"]')!.getBoundingClientRect().top))).toBeLessThan(2);
    expect(await state(page, "chef-arturo")).toBe("SCREEN");

    // Chef's pin is 6.4 units long since Phase 8 (5 under reduced motion): WORLD (C02) at 2 (0.5)
    await scrollToFraction(page, "chef-arturo", (await reduced(page)) ? 0.5 / 5 : 2 / 6.4);
    await expect.poll(() => state(page, "chef-arturo")).toBe("WORLD");
    const y = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(400); // the position is remembered once scrolling settles
    await page.reload();
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    await expect.poll(() => page.evaluate((y) => Math.abs(window.scrollY - y), y)).toBeLessThan(3);
    await expect.poll(() => state(page, "chef-arturo")).toBe("WORLD");
    expect(problems).toEqual([]);
  });

  test("Siguiente → enters the next world with a history entry", async ({ page }) => {
    await page.goto("/trabajo/rayo-smash", { waitUntil: "networkidle" });
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    const length = await page.evaluate(() => history.length);
    const next = page.locator('[data-proof="rayo-smash"]').getByRole("link", { name: /Siguiente/ });
    await next.scrollIntoViewIfNeeded();
    await next.click();
    await expect(page).toHaveURL(/\/trabajo\/santi-nuca$/);
    expect(await page.evaluate(() => history.length)).toBe(length + 1);
    await atWorld(page, "santi-nuca");
    await page.goBack();
    await expect(page).toHaveURL(/\/trabajo\/rayo-smash$/);
  });

  test("scrolling through the worlds never adds history entries", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const length = await page.evaluate(() => history.length);
    for (const slug of SLUGS) {
      await page.evaluate((s) => document.getElementById(s)!.scrollIntoView({ behavior: "instant" }), slug);
      await expect.poll(() => page.evaluate(() => location.pathname)).toBe(`/trabajo/${slug}`);
    }
    expect(await page.evaluate(() => history.length)).toBe(length);
  });
});

test.describe("the world grammar", () => {
  test("SCREEN → ISOLATE → WORLD: the screen darkens, the object escapes, the environment fills", async ({ page }) => {
    test.skip(tiny(page), "tiny viewports read the worlds as static layout");
    test.skip(test.info().project.use.reducedMotion === "reduce", "reduced motion has its own test");
    await page.goto("/trabajo/rayo-smash", { waitUntil: "networkidle" });
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    const look = () =>
      page.evaluate(() => {
        const q = (p: string) => document.querySelector<HTMLElement>(`#rayo-smash [data-part="${p}"]`)!;
        const o = q("object").getBoundingClientRect();
        return {
          object: Number(getComputedStyle(q("object")).opacity),
          dim: Number(getComputedStyle(q("screen-dim")).opacity),
          env: Number(getComputedStyle(q("env")).opacity),
          screen: Number(getComputedStyle(q("screen")).opacity),
          cx: o.x + o.width / 2,
          cy: o.y + o.height / 2,
          h: o.height,
        };
      });
    const s0 = await look();
    expect(s0.object).toBe(0);
    expect(s0.env).toBe(0);

    // Rayo's pin is 5.7 units long since Phase 6: ISOLATE at 1, WORLD (R02) at 2
    await scrollToFraction(page, "rayo-smash", 1 / 5.7);
    await expect.poll(() => state(page, "rayo-smash")).toBe("ISOLATE");
    await expect.poll(async () => (await look()).dim).toBeCloseTo(0.75, 2);
    expect((await look()).object).toBe(1);

    await scrollToFraction(page, "rayo-smash", 2 / 5.7);
    await expect.poll(() => state(page, "rayo-smash")).toBe("WORLD");
    await expect.poll(async () => (await look()).env).toBe(1);
    const w = await look();
    const vp = page.viewportSize()!;
    expect(w.screen).toBe(0);
    expect(Math.abs(w.cx - vp.width / 2)).toBeLessThan(2);
    expect(Math.abs(w.cy - vp.height / 2)).toBeLessThan(2);
    // the burger at 62% of the design-space height (sm: 70% of its width)
    if (vp.width >= 768) {
      const s = Math.min(vp.width / 1440, vp.height / 900);
      expect(Math.abs(w.h - 0.62 * 900 * s)).toBeLessThan(2);
    }
  });

  test("axe on a project route: no serious or critical violations", async ({ page }) => {
    await page.goto("/trabajo/santi-nuca", { waitUntil: "networkidle" });
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    const results = await new AxeBuilder({ page }).analyze();
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  });
});

test.describe("the 01–04 overlay", () => {
  test("Trabajo opens it at the current project; Esc returns focus; a choice enters that world", async ({ page }) => {
    await page.goto("/trabajo/santi-nuca", { waitUntil: "networkidle" });
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    const trigger = page.getByRole("banner").getByRole("link", { name: "Trabajo" });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: /03 · Santi Nuca/ })).toBeFocused();
    await expect(dialog.getByRole("link", { name: /03 · Santi Nuca/ })).toHaveAttribute("aria-current", "true");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    const length = await page.evaluate(() => history.length);
    await trigger.click();
    await dialog.getByRole("link", { name: /02 · Rayo Smash/ }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/trabajo\/rayo-smash$/);
    expect(await page.evaluate(() => history.length)).toBe(length + 1);
    await atWorld(page, "rayo-smash");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("entering a world is a cut to WORLD; nothing tweens", async ({ page }) => {
    test.skip(tiny(page), "tiny viewports read the worlds as static layout");
    await toReel(page);
    await pick(page, 1);
    await page.locator("#trabajo .reel-item[data-active] [data-enter]").click();
    await expect(page).toHaveURL(/\/trabajo\/rayo-smash$/);
    await expect.poll(() => state(page, "rayo-smash")).toBe("WORLD");
    const env = await page.evaluate(() => Number(getComputedStyle(document.querySelector('#rayo-smash [data-part="env"]')!).opacity));
    expect(env).toBe(1);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    expect(await activeIndex(page)).toBe(1);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("worlds are readable sections; links are real URLs; Trabajo goes to the reel", async ({ page }) => {
    await page.goto("/trabajo/santi-nuca");
    const world = page.locator("#santi-nuca");
    await expect(world.getByRole("heading", { level: 2, name: "Santi Nuca" })).toBeVisible();
    await expect(world.locator(".world-credit")).toHaveText("Fotografía · Santi Nuca");
    await expect(world.locator(".world-credit")).toBeVisible();
    await expect(world.locator('[data-part="object"]')).toBeHidden();
    await expect(page.locator("#trabajo .reel-item [data-enter]").first()).toHaveAttribute("href", "/trabajo/travelsuite360");
    await expect(page.getByRole("banner").getByRole("link", { name: "Trabajo" })).toHaveAttribute("href", "#trabajo");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
