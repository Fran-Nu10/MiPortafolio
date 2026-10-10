import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

/**
 * Phase 6 acceptance (Spec §26): R00–R07 · the DOM ↔ video handoff invisible with the test
 * clip (screenshot diff) · a failing clip skips R05 cleanly. Plus the seam from TravelSuite360,
 * tiers (3D only on lg/xl, R05 only where the clip's composition matches), reduced motion,
 * reversal, accessibility and no-JS.
 */

const U = 5.7;
const U_RM = 3.5;

const tiny = (page: Page) => {
  const v = page.viewportSize()!;
  return v.width < 360 || v.height < 560;
};
const state = (page: Page) => page.locator("#rayo-smash").getAttribute("data-state");
/** translateZ of a computed transform (matrix3d m43), 0 for a 2D matrix */
const z = (t: string) => (t.startsWith("matrix3d(") ? Number(t.slice(9, -1).split(",")[14]) : 0);

function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") problems.push(m.text());
  });
  page.on("pageerror", (e) => problems.push(e.message));
  return problems;
}

async function open(page: Page) {
  await page.goto("/trabajo/rayo-smash", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toHaveAttribute("data-started", "");
}

async function to(page: Page, t: number, units = U) {
  const y = await page.evaluate(
    ([t, units]) => {
      const stage = document.querySelector<HTMLElement>('#rayo-smash [data-part="stage"]')!;
      const holder = stage.parentElement!;
      const top = holder.getBoundingClientRect().top + window.scrollY;
      return Math.round(top + (t / units) * (holder.offsetHeight - stage.offsetHeight));
    },
    [t, units] as const,
  );
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
}

const part = (page: Page, name: string, nth = 0) =>
  page.evaluate(
    ([name, nth]) => {
      const el = document.querySelectorAll<HTMLElement>(`#rayo-smash [data-part="${name}"]`)[nth]!;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { opacity: Number(cs.opacity), visibility: cs.visibility, x: r.x, y: r.y, w: r.width, h: r.height, transform: cs.transform, clip: cs.clipPath, perspective: cs.perspective };
    },
    [name, nth] as const,
  );

/** the union box of the six layers */
const pieces = (page: Page) =>
  page.evaluate(() => {
    const rs = Array.from(document.querySelectorAll<HTMLElement>('#rayo-smash [data-part="piece"]')).map((p) => p.getBoundingClientRect());
    const top = Math.min(...rs.map((r) => r.top));
    const bottom = Math.max(...rs.map((r) => r.bottom));
    const left = Math.min(...rs.map((r) => r.left));
    const right = Math.max(...rs.map((r) => r.right));
    return { top, bottom, h: bottom - top, w: right - left, cx: (left + right) / 2, n: rs.length, tops: rs.map((r) => r.top) };
  });

const space = (page: Page) =>
  page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = document.querySelector<HTMLElement>('#rayo-smash [data-part="stage"]')!.clientHeight;
    const [w, h] = vw < 768 ? [390, 844] : [1440, 900];
    const s = Math.min(vw / w, vh / h);
    return { s, h: h * s, w: w * s, vw, vh };
  });

const SHOWN = /inset\(0(px|%)?\)|inset\(0% 0% 0% 0%\)/;

async function shot(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot(), contentType: "image/png" });
}

/** share of pixels whose largest channel difference passes 24/255 */
async function diffShare(a: Buffer, b: Buffer) {
  const [ra, rb] = await Promise.all([a, b].map((x) => sharp(x).removeAlpha().raw().toBuffer({ resolveWithObject: true })));
  let off = 0;
  for (let i = 0; i < ra.data.length; i += 3) {
    const d = Math.max(Math.abs(ra.data[i] - rb.data[i]), Math.abs(ra.data[i + 1] - rb.data[i + 1]), Math.abs(ra.data[i + 2] - rb.data[i + 2]));
    if (d > 24) off++;
  }
  return off / (ra.data.length / 3);
}

test.describe("R00–R07 at the reference viewport", () => {
  test("every state in order, with its composition (Spec §09)", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440", "the reference viewport, once");
    const problems = watchConsole(page);
    await open(page);
    const sp = await space(page);
    expect(await state(page)).toBe("SCREEN");
    expect((await part(page, "object")).opacity).toBe(0);
    await shot(page, "R00 SCREEN");

    await to(page, 1);
    await expect.poll(() => state(page)).toBe("ISOLATE");
    await expect.poll(async () => (await part(page, "screen-dim")).opacity).toBeCloseTo(0.75, 2);
    expect((await part(page, "object")).opacity).toBe(1);
    await shot(page, "R01 ISOLATE");

    // R02 · the stack escapes and grows to the center; the red field fills
    await to(page, 2);
    await expect.poll(() => state(page)).toBe("WORLD");
    await expect.poll(async () => (await part(page, "env")).opacity).toBe(1);
    const o = await part(page, "object");
    expect(Math.abs(o.h - 0.62 * sp.h)).toBeLessThan(3);
    expect(Math.abs(o.x + o.w / 2 - sp.vw / 2)).toBeLessThan(2);
    expect((await part(page, "group")).visibility).toBe("hidden");
    await shot(page, "R02 ENTERA");

    // R03 · the stack is swapped for its six layers; the title masks up
    await to(page, 2.6);
    await expect.poll(() => state(page)).toBe("R03");
    await expect.poll(async () => (await part(page, "title")).clip).toMatch(SHOWN);
    expect((await part(page, "object")).visibility).toBe("hidden");
    expect((await part(page, "group")).visibility).toBe("visible");
    const r03 = await pieces(page);
    expect(r03.n).toBe(6);
    // the layers sit where the stack was
    expect(Math.abs(r03.h - o.h)).toBeLessThan(3);
    expect(Math.abs(r03.cx - sp.vw / 2)).toBeLessThan(2);
    await expect(page.locator('#rayo-smash [data-part="title"]')).toHaveText("Capa por capa.");
    await shot(page, "R03 CAPA POR CAPA");

    // R04 · the layers separate, with depth and the tilt
    await to(page, 3.6);
    await expect.poll(() => state(page)).toBe("R04");
    await expect.poll(async () => z((await part(page, "piece", 5)).transform)).toBeCloseTo(-320, 0);
    const r04 = await pieces(page);
    expect(r04.tops[0]).toBeLessThan(r03.tops[0] - 20);
    expect(r04.bottom).toBeGreaterThan(r03.bottom + 10);
    expect((await part(page, "persp")).perspective).toBe("1200px");
    expect((await part(page, "group")).transform).toMatch(/^matrix3d/);
    await shot(page, "R04 EXPLODE");

    // R05 · the clip: the video shows over the layers, then the layers come back
    await to(page, 3.9);
    await expect.poll(() => state(page)).toBe("R05");
    const video = page.locator("#rayo-smash video");
    await expect(video).toHaveCount(1);
    await expect.poll(async () => Number(await video.evaluate((v) => getComputedStyle(v).opacity)), { timeout: 4000 }).toBe(1);
    await expect.poll(async () => (await part(page, "group")).visibility).toBe("hidden");
    await shot(page, "R05 THROUGH");
    await expect.poll(async () => (await part(page, "group")).visibility, { timeout: 6000 }).toBe("visible");
    await expect.poll(async () => Number(await video.evaluate((v) => getComputedStyle(v).opacity))).toBe(0);

    // R06 · assembly: the whole burger, at 62% of the space, centered
    await to(page, 4.9);
    await expect.poll(() => state(page)).toBe("R06");
    // the whole burger: as tall as the stack was (62%), and far wider than its thin column
    await expect.poll(async () => (await pieces(page)).w, { timeout: 3000 }).toBeGreaterThan(r03.w * 1.8);
    await page.waitForTimeout(400);
    const r06 = await pieces(page);
    expect(Math.abs(r06.h - 0.62 * sp.h)).toBeLessThan(6);
    expect(Math.abs(r06.cx - sp.vw / 2)).toBeLessThan(3);
    expect(r06.bottom - r06.top).toBeLessThan(r03.bottom - r03.top + 6);
    await expect.poll(async () => (await part(page, "title")).clip).not.toMatch(SHOWN);
    expect(z((await part(page, "piece", 5)).transform)).toBeCloseTo(0, 0);
    await shot(page, "R06 ASSEMBLY");

    // R07 · the real menu line under the burger
    await to(page, 5.5);
    await expect.poll(() => state(page)).toBe("R07");
    await expect.poll(async () => (await part(page, "menu-price")).clip).toMatch(SHOWN);
    await expect(page.locator('#rayo-smash [data-part="menu-name"]')).toHaveText("Clásica");
    await expect(page.locator('#rayo-smash [data-part="menu-detail"]')).toHaveText("doble medallón smash, cheddar fundido, salsa de la casa, pan brioche");
    await expect(page.locator('#rayo-smash [data-part="menu-price"]')).toHaveText("$ 490");
    const menu = await part(page, "menu");
    expect(menu.y).toBeGreaterThan(r06.bottom);
    await shot(page, "R07 HERO LINE");

    // the proof, in flow: the relation line and the role, never a client
    const proof = page.locator('[data-proof="rayo-smash"]');
    await proof.scrollIntoViewIfNeeded();
    await expect(proof.getByText("Rayo Smash no es un cliente: es la demo que Prospector construye para vender.")).toBeVisible();
    await expect(proof.getByText("Diseño, motion y desarrollo")).toBeVisible();
    await expect(proof.getByText("Demo real, navegable.")).toBeVisible();
    await expect(proof.getByText("Cada negocio recibe la suya.")).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test("the DOM ↔ video handoff: the clip's first frame is the R04 composition", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440", "the reference viewport, once");
    await open(page);
    await to(page, 3.6);
    await expect.poll(() => state(page)).toBe("R04");
    await page.waitForTimeout(1200);
    const clip = { x: 0, y: 64, width: 1440, height: 836 };
    const dom = await page.screenshot({ clip, animations: "disabled" });
    await to(page, 3.9);
    const video = page.locator("#rayo-smash video");
    await expect.poll(async () => Number(await video.evaluate((v) => getComputedStyle(v).opacity)), { timeout: 4000 }).toBe(1);
    await expect.poll(async () => (await part(page, "group")).visibility).toBe("hidden");
    // hold the clip on its first frame (the test's own pause), then compare
    await video.evaluate(async (v) => {
      const el = v as HTMLVideoElement;
      el.pause();
      el.currentTime = 0;
      await new Promise((r) => (el.onseeked = r));
    });
    const shown = await page.screenshot({ clip, animations: "disabled" });
    const share = await diffShare(dom, shown);
    info.annotations.push({ type: "handoff", description: `${(share * 100).toFixed(2)}% of pixels differ (codec noise inside the layers; see docs/12 §6)` });
    expect(share).toBeLessThanOrEqual(0.03);
  });

  test("a clip that cannot play skips R05 cleanly: R04 → R06", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440", "the reference viewport, once");
    const problems = watchConsole(page);
    // the test's own abort: the browser logs the failed resource (expected)
    await page.route("**/*.mp4", (r) => r.abort());
    await open(page);
    await to(page, 3.6);
    await expect.poll(() => state(page)).toBe("R04");
    await to(page, 3.9);
    await expect.poll(() => state(page)).toBe("R05");
    await page.waitForTimeout(1500);
    expect((await part(page, "group")).visibility).toBe("visible");
    const op = await page.locator("#rayo-smash video").evaluateAll((vs) => vs.map((v) => getComputedStyle(v).opacity));
    expect(op.every((o) => o === "0")).toBe(true);
    await to(page, 4.9);
    await expect.poll(() => state(page)).toBe("R06");
    await expect.poll(async () => (await part(page, "title")).clip).not.toMatch(SHOWN);
    expect(problems.filter((m) => !/Failed to load resource: net::ERR_FAILED/.test(m))).toEqual([]);
  });

  test("scrolling back undoes every state, the clip included", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440", "the reference viewport, once");
    await open(page);
    await to(page, 3.9);
    const video = page.locator("#rayo-smash video");
    await expect.poll(async () => Number(await video.evaluate((v) => getComputedStyle(v).opacity)), { timeout: 4000 }).toBe(1);
    await to(page, 3.6);
    await expect.poll(() => state(page)).toBe("R04");
    await expect.poll(async () => (await part(page, "group")).visibility).toBe("visible");
    await expect.poll(async () => Number(await video.evaluate((v) => getComputedStyle(v).opacity))).toBe(0);
    expect(await video.evaluate((v) => (v as HTMLVideoElement).paused)).toBe(true);
    await to(page, 2.6);
    await expect.poll(() => state(page)).toBe("R03");
    await expect.poll(async () => z((await part(page, "piece", 5)).transform)).toBeCloseTo(0, 0);
    await to(page, 2);
    await expect.poll(() => state(page)).toBe("WORLD");
    await expect.poll(async () => (await part(page, "group")).visibility).toBe("hidden");
    expect((await part(page, "object")).opacity).toBe(1);
    await to(page, 0);
    await expect.poll(() => state(page)).toBe("SCREEN");
    await expect.poll(async () => (await part(page, "env")).opacity).toBe(0);
  });

  test("the seam from TravelSuite360: red to the edges, then Rayo's real interface, then red again", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440", "the reference viewport, once");
    await page.goto("/trabajo/travelsuite360", { waitUntil: "networkidle" });
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    const seamAt = async (f: number) => {
      await page.evaluate((f) => {
        const s = document.querySelector<HTMLElement>('[data-proof="travelsuite360"]')!;
        const top = s.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.round(top - innerHeight + f * (s.offsetHeight + innerHeight)), behavior: "instant" });
      }, f);
      await page.waitForTimeout(700);
      return page.evaluate(() => getComputedStyle(document.querySelector('[data-part="seam"]')!).visibility);
    };
    expect(await seamAt(0.9)).toBe("visible");
    // Rayo's stage rises over the red: its SCREEN is the hero on black (the reel's own ground)
    expect(await seamAt(1.0)).toBe("hidden");
    await expect.poll(() => state(page)).toBe("SCREEN");
    expect((await part(page, "env")).opacity).toBe(0);
    // one gesture in, the red is back as Rayo's own field
    await to(page, 2);
    await expect.poll(() => state(page)).toBe("WORLD");
    await expect.poll(async () => (await part(page, "env")).opacity).toBe(1);
  });
});

test.describe("tiers", () => {
  test("3D and the clip only on lg/xl; tablets and phones separate the layers on y alone", async ({ page }, info) => {
    test.skip(tiny(page), "tiny viewports read the world as text");
    test.skip(info.project.use.reducedMotion === "reduce", "reduced motion has its own test");
    await open(page);
    const w = page.viewportSize()!.width;
    await to(page, 3.6);
    await expect.poll(() => state(page)).toBe("R04");
    await page.waitForTimeout(600);
    const persp = (await part(page, "persp")).perspective;
    const depth = z((await part(page, "piece", 5)).transform);
    const videos = await page.locator("#rayo-smash video").count();
    const r04 = await pieces(page);
    if (w >= 1024) {
      expect(persp).toBe("1200px");
      expect(depth).toBeCloseTo(-320, 0);
      expect(videos).toBe(1);
    } else {
      expect(persp).toBe("none");
      expect(depth).toBe(0);
      expect(videos).toBe(0);
      // y only: the layers still separate
      expect(r04.tops[0]).toBeLessThan(r04.tops[1] - 10);
    }
    // R05 (with or without a clip), then the whole burger and its line
    await to(page, 3.9);
    await expect.poll(() => state(page)).toBe("R05");
    await to(page, 5.5);
    await expect.poll(() => state(page)).toBe("R07");
    await expect.poll(async () => (await part(page, "menu-price")).clip, { timeout: 5000 }).toMatch(SHOWN);
  });

  test("phones: the stack at 70% of the width, the whole burger fits with its line", async ({ page, isMobile }) => {
    test.skip(!isMobile || tiny(page), "phones");
    await open(page);
    const sp = await space(page);
    await to(page, 2);
    await expect.poll(() => state(page)).toBe("WORLD");
    const o = await part(page, "object");
    expect(Math.abs(o.w - 0.7 * sp.w)).toBeLessThan(3);
    await to(page, 5.5);
    await expect.poll(() => state(page)).toBe("R07");
    await page.waitForTimeout(600);
    const r = await pieces(page);
    const menu = await part(page, "menu");
    expect(r.top).toBeGreaterThan(0);
    expect(menu.y + menu.h).toBeLessThan(sp.vh);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("three stills: the stack in the red field → the layers apart with the title → the whole burger with its line; no clip", async ({ page }) => {
    test.skip(tiny(page), "tiny viewports read the world as text");
    await open(page);
    await to(page, 0.5, U_RM);
    await expect.poll(() => state(page)).toBe("WORLD");
    expect((await part(page, "env")).opacity).toBe(1);
    expect((await part(page, "group")).visibility).toBe("hidden");
    await to(page, 1.5, U_RM);
    await expect.poll(() => state(page)).toBe("R04");
    expect((await part(page, "group")).visibility).toBe("visible");
    expect((await part(page, "title")).clip).toMatch(SHOWN);
    expect((await part(page, "persp")).perspective).toBe("none");
    const a = await pieces(page);
    await page.waitForTimeout(150);
    expect((await pieces(page)).tops).toEqual(a.tops);
    await to(page, 2.5, U_RM);
    await expect.poll(() => state(page)).toBe("R06");
    expect((await part(page, "menu")).clip).toMatch(SHOWN);
    expect((await part(page, "title")).clip).not.toMatch(SHOWN);
    expect(await page.locator("#rayo-smash video").count()).toBe(0);
  });
});

test.describe("accessibility", () => {
  test("the title and the menu line exist once; the layers are silent; axe at R07", async ({ page }) => {
    test.skip(tiny(page), "tiny viewports read the copy list instead");
    await open(page);
    await to(page, 5.5);
    await page.waitForTimeout(900);
    const counts = await page.evaluate(() => {
      const visibleToAT = (el: Element) => !el.closest('[aria-hidden="true"]') && getComputedStyle(el).display !== "none" && !el.closest(".world-copy");
      return ["Capa por capa.", "Clásica"].map((t) => Array.from(document.querySelectorAll("#rayo-smash p")).filter((p) => p.textContent?.trim() === t && visibleToAT(p)).length);
    });
    expect(counts).toEqual([1, 1]);
    expect(await page.locator('#rayo-smash [data-part="piece"] img').evaluateAll((imgs) => imgs.every((i) => i.getAttribute("alt") === ""))).toBe(true);
    await expect(page.locator("#rayo-smash").getByRole("heading", { level: 2, name: "Rayo Smash" })).toHaveCount(1);
    const results = await new AxeBuilder({ page }).include("#rayo-smash").analyze();
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the world reads as its copy; no layers, no video", async ({ page }) => {
    await page.goto("/trabajo/rayo-smash");
    const world = page.locator("#rayo-smash");
    const copy = world.locator(".world-copy");
    await expect(copy.getByText("Capa por capa.")).toBeVisible();
    await expect(copy.getByText("Clásica · doble medallón smash, cheddar fundido, salsa de la casa, pan brioche · $ 490")).toBeVisible();
    await expect(world.locator(".rayo-layer")).toBeHidden();
    expect(await world.locator("video").count()).toBe(0);
  });
});
