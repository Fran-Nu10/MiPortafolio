import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 7 acceptance (Spec §26): N00–N05 + reduced motion · no non-uniform scaling (the
 * figures' transforms are asserted at every sampled moment) · the credit visible from N02
 * through the proof · the paper tone switch. Plus continuity from Rayo and toward Chef, tiers,
 * reversal, accessibility and no-JS.
 */

const U = 5.4;
const U_RM = 4;

const tiny = (page: Page) => {
  const v = page.viewportSize()!;
  return v.width < 360 || v.height < 560;
};
const state = (page: Page) => page.locator("#santi-nuca").getAttribute("data-state");
const SHOWN = /inset\(0(px|%)?\)|inset\(0% 0% 0% 0%\)/;

function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") problems.push(m.text());
  });
  page.on("pageerror", (e) => problems.push(e.message));
  return problems;
}

async function open(page: Page) {
  await page.goto("/trabajo/santi-nuca", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toHaveAttribute("data-started", "");
}

async function to(page: Page, t: number, units = U) {
  const y = await page.evaluate(
    ([t, units]) => {
      const stage = document.querySelector<HTMLElement>('#santi-nuca [data-part="stage"]')!;
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
      const el = document.querySelectorAll<HTMLElement>(`#santi-nuca [data-part="${name}"]`)[nth]!;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { opacity: Number(cs.opacity), visibility: cs.visibility, x: r.x, y: r.y, w: r.width, h: r.height, transform: cs.transform, clip: cs.clipPath, color: cs.color };
    },
    [name, nth] as const,
  );

/** every figure's transform: a uniform scale with no skew, or the test fails */
async function assertUniform(page: Page, where: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll<HTMLElement>('#santi-nuca [data-part="figure"]').forEach((f) => {
      const t = getComputedStyle(f).transform;
      if (t === "none") return;
      const m = t.match(/^matrix\(([^)]+)\)$/);
      if (!m) return out.push(`${f.dataset.photo}: ${t}`);
      const [a, b, c, d] = m[1].split(",").map(Number);
      if (Math.abs(b) > 1e-3 || Math.abs(c) > 1e-3 || Math.abs(a - d) > 1e-3 * Math.max(1, Math.abs(a))) out.push(`${f.dataset.photo}: ${t}`);
    });
    return out;
  });
  expect(bad, `non-uniform transforms at ${where}`).toEqual([]);
}

/** the visible boxes of the figures that are showing (their clip windows) */
const visibleFigures = (page: Page) =>
  page.evaluate(() => {
    // the clip insets are the figure's own pixels: scaled by its transform and by the space's
    const sp = document.querySelector<HTMLElement>('#santi-nuca [data-part="space"]')!;
    const spaceScale = Number((getComputedStyle(sp).transform.match(/^matrix\(([^,]+)/) ?? [0, "1"])[1]) || 1;
    return Array.from(document.querySelectorAll<HTMLElement>('#santi-nuca [data-part="figure"]'))
      .filter((f) => getComputedStyle(f).opacity === "1" && getComputedStyle(f).visibility !== "hidden")
      .map((f) => {
        const r = f.getBoundingClientRect();
        // the computed inset() collapses symmetric values like CSS shorthand: expand it
        const m = getComputedStyle(f).clipPath.match(/inset\(([^)]+)\)/);
        const parts = m ? m[1].trim().split(/\s+/).map(parseFloat) : [0];
        const iT = parts[0];
        const iR = parts[1] ?? iT;
        const iB = parts[2] ?? iT;
        const iL = parts[3] ?? iR;
        const ins = [iT, iR, iB, iL];
        const scale = Number((getComputedStyle(f).transform.match(/^matrix\(([^,]+)/) ?? [0, "1"])[1]) * spaceScale;
        return { n: Number(f.dataset.photo), x: r.x + ins[3] * scale, y: r.y + ins[0] * scale, w: r.width - (ins[1] + ins[3]) * scale, h: r.height - (ins[0] + ins[2]) * scale };
      });
  });

/** the single image at N02: figure 1 once swapped in, or the shell's object resting on the label */
const singleBox = async (page: Page) => {
  const f = (await visibleFigures(page)).find((x) => x.n === 1);
  if (f) return f;
  const o = await part(page, "object");
  return o.opacity > 0 ? { n: 1, x: o.x, y: o.y, w: o.w, h: o.h } : null;
};

/** distinct positions, 6 px apart or more (one per column / row) */
const clusters = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.filter((v, i) => i === 0 || v - sorted[i - 1] > 6).length;
};

const space = (page: Page) =>
  page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = document.querySelector<HTMLElement>('#santi-nuca [data-part="stage"]')!.clientHeight;
    const [w, h] = vw < 768 ? [390, 844] : [1440, 900];
    const s = Math.min(vw / w, vh / h);
    return { s, vw, vh, x: (vw - w * s) / 2, y: (vh - h * s) / 2 };
  });

async function shot(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot(), contentType: "image/png" });
}

test.describe("N00–N05 at the reference viewport", () => {
  test("every state in order, with its composition (Spec §10)", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440", "the reference viewport, once");
    const problems = watchConsole(page);
    await open(page);
    const sp = await space(page);
    expect(await state(page)).toBe("SCREEN");
    expect((await part(page, "space")).opacity).toBeGreaterThan(0);
    expect(await page.locator('#santi-nuca [data-part="space"]').getAttribute("data-paper")).toBe("no");
    await shot(page, "N00 SCREEN");

    await to(page, 1);
    await expect.poll(() => state(page)).toBe("ISOLATE");
    await expect.poll(async () => (await part(page, "screen-dim")).opacity).toBeCloseTo(0.75, 2);
    expect((await part(page, "env")).opacity).toBe(0);
    await shot(page, "N01 ISOLATE");

    // N02 · rupture + single: paper, the photograph at 78% of the height, the credit
    await to(page, 2);
    await expect.poll(() => state(page)).toBe("WORLD");
    await expect.poll(async () => (await part(page, "env")).opacity).toBe(1);
    await expect.poll(() => page.locator('#santi-nuca [data-part="space"]').getAttribute("data-paper")).toBe("yes");
    await expect.poll(async () => (await part(page, "credit")).opacity).toBe(1);
    const one = (await singleBox(page))!;
    expect(Math.abs(one.h - 0.78 * 900 * sp.s)).toBeLessThan(3);
    expect(Math.abs(one.x + one.w / 2 - sp.vw / 2)).toBeLessThan(2);
    const credit = page.locator("#santi-nuca .santi-credit");
    await expect(credit).toHaveText("Fotografía · Santi Nuca");
    expect((await part(page, "credit")).color).toBe("rgba(20, 20, 20, 0.7)");
    await assertUniform(page, "N02");
    await shot(page, "N02 RUPTURE · SINGLE");

    // N03 · diptych: photo 1 in the left half, photo 2 in the right
    await to(page, 2.5);
    await page.waitForTimeout(300);
    await assertUniform(page, "between N02 and N03");
    await to(page, 3);
    await expect.poll(() => state(page)).toBe("N03");
    await page.waitForTimeout(900);
    const dip = await visibleFigures(page);
    expect(dip.map((f) => f.n).sort()).toEqual([1, 2]);
    const [d1, d2] = [dip.find((f) => f.n === 1)!, dip.find((f) => f.n === 2)!];
    expect(d1.x + d1.w).toBeLessThanOrEqual(d2.x + 1);
    expect(Math.abs(d1.y - d2.y)).toBeLessThan(2);
    expect(Math.abs(d1.w - d2.w)).toBeLessThan(2);
    await assertUniform(page, "N03");
    expect((await part(page, "credit")).opacity).toBe(1);
    await shot(page, "N03 DIPTYCH");

    // N04 · triptych: three equal columns, Forma · Línea · Textura, 01 · 02 · 03
    await to(page, 4);
    await expect.poll(() => state(page)).toBe("N04");
    await page.waitForTimeout(1100);
    const tri = await visibleFigures(page);
    expect(tri.map((f) => f.n).sort()).toEqual([1, 2, 3]);
    const widths = tri.map((f) => f.w);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(2);
    expect(clusters(tri.map((f) => f.y))).toBe(1);
    for (let i = 0; i < 3; i++) {
      await expect.poll(async () => (await part(page, "label", i)).clip).toMatch(SHOWN);
      const l = page.locator('#santi-nuca [data-part="label"]').nth(i);
      await expect(l.locator(".santi-label-view")).toHaveText(["Forma", "Línea", "Textura"][i]);
      await expect(l.locator(".santi-label-page")).toHaveText(["01", "02", "03"][i]);
      expect((await part(page, "label", i)).color).toBe("rgb(20, 20, 20)");
    }
    await assertUniform(page, "N04");
    expect((await part(page, "credit")).opacity).toBe(1);
    await shot(page, "N04 TRIPTYCH");

    // N05 · the system: six works in the grid, numbered
    await to(page, 4.5);
    await page.waitForTimeout(300);
    await assertUniform(page, "between N04 and N05");
    await to(page, 5);
    await expect.poll(() => state(page)).toBe("N05");
    await page.waitForTimeout(1300);
    const grid = await visibleFigures(page);
    expect(grid.map((f) => f.n).sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(clusters(grid.map((f) => f.y))).toBe(2);
    expect(clusters(grid.map((f) => f.x))).toBe(3);
    for (let i = 0; i < 6; i++) await expect.poll(async () => (await part(page, "index", i)).opacity).toBe(1);
    await expect(page.locator('#santi-nuca [data-part="index"]')).toHaveText(["01", "02", "03", "04", "05", "06"]);
    await expect.poll(async () => (await part(page, "label", 0)).clip).not.toMatch(SHOWN);
    await assertUniform(page, "N05");
    expect((await part(page, "credit")).opacity).toBe(1);
    await shot(page, "N05 SYSTEM");

    // the proof, on paper, with the credit and the role
    const proof = page.locator('[data-proof="santi-nuca"]');
    await proof.scrollIntoViewIfNeeded();
    await expect(proof.getByText("Fotografía · Santi Nuca")).toBeVisible();
    await expect(proof.getByText("Diseño y desarrollo")).toBeVisible();
    await expect(proof.getByText("Sitio real, en línea.")).toBeVisible();
    expect(await proof.evaluate((p) => getComputedStyle(p).backgroundColor)).toBe("rgb(237, 232, 222)");
    expect(problems).toEqual([]);
  });

  test("scrolling back undoes every composition, the tone included", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440", "the reference viewport, once");
    await open(page);
    await to(page, 5);
    await expect.poll(() => state(page)).toBe("N05");
    await page.waitForTimeout(1200);
    await to(page, 3);
    await expect.poll(() => state(page)).toBe("N03");
    await expect.poll(async () => (await visibleFigures(page)).map((f) => f.n).sort()).toEqual([1, 2]);
    await assertUniform(page, "back at N03");
    await to(page, 2);
    await expect.poll(() => state(page)).toBe("WORLD");
    await expect.poll(async () => (await visibleFigures(page)).filter((f) => f.n > 1)).toEqual([]);
    expect(await singleBox(page)).not.toBeNull();
    await to(page, 1);
    await expect.poll(() => state(page)).toBe("ISOLATE");
    await expect.poll(() => page.locator('#santi-nuca [data-part="space"]').getAttribute("data-paper")).toBe("no");
    await expect.poll(async () => (await part(page, "env")).opacity).toBe(0);
    expect((await part(page, "object")).opacity).toBe(1);
  });

  test("continuity: Rayo's proof dims into Santi's black SCREEN; the rupture makes it paper; Santi's proof dims toward Chef", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440", "the reference viewport, once");
    await page.goto("/trabajo/rayo-smash", { waitUntil: "networkidle" });
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    const proofAt = async (id: string, f: number) => {
      await page.evaluate(
        ([id, f]) => {
          const s = document.querySelector<HTMLElement>(`[data-proof="${id}"]`)!;
          const top = s.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: Math.round(top - innerHeight + f * (s.offsetHeight + innerHeight)), behavior: "instant" });
        },
        [id, f] as const,
      );
      await page.waitForTimeout(800);
    };
    await proofAt("rayo-smash", 0.9);
    const win = await page.locator('[data-proof="rayo-smash"] [data-part="window"]').evaluate((w) => Number(getComputedStyle(w).opacity));
    expect(win).toBeLessThan(0.75);
    expect(await page.evaluate(() => document.querySelectorAll('[data-proof] [data-part="seam"]').length)).toBe(1); // only TS's proof has a seam
    await proofAt("rayo-smash", 1.0);
    await expect.poll(() => state(page)).toBe("SCREEN");
    expect((await part(page, "env")).opacity).toBe(0);
    await to(page, 2);
    await expect.poll(() => state(page)).toBe("WORLD");
    await expect.poll(async () => (await part(page, "env")).opacity).toBe(1);
    // out: Santi's proof dims to .55 and Chef's SCREEN follows, no seam
    await proofAt("santi-nuca", 0.95);
    const out = await page.locator('[data-proof="santi-nuca"] [data-part="window"]').evaluate((w) => Number(getComputedStyle(w).opacity));
    expect(out).toBeLessThan(0.75);
    await proofAt("santi-nuca", 1.0);
    await expect.poll(() => page.locator("#chef-arturo").getAttribute("data-state")).toBe("SCREEN");
  });
});

test.describe("tiers", () => {
  test("2D everywhere: no perspective, uniform transforms; phones stack the compositions", async ({ page, isMobile }, info) => {
    test.skip(tiny(page), "tiny viewports read the world as text");
    test.skip(info.project.use.reducedMotion === "reduce", "reduced motion has its own test");
    await open(page);
    await to(page, 3);
    await expect.poll(() => state(page)).toBe("N03");
    await page.waitForTimeout(900);
    expect(await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("#santi-nuca .santi-layer *")).filter((el) => getComputedStyle(el).transform.startsWith("matrix3d")).length)).toBe(0);
    const dip = await visibleFigures(page);
    const [d1, d2] = [dip.find((f) => f.n === 1)!, dip.find((f) => f.n === 2)!];
    if (isMobile) expect(d2.y).toBeGreaterThan(d1.y + d1.h - 2);
    else expect(d2.x).toBeGreaterThan(d1.x + d1.w - 2);
    await assertUniform(page, "N03");
    await to(page, 5);
    await expect.poll(() => state(page)).toBe("N05");
    await page.waitForTimeout(1300);
    const grid = await visibleFigures(page);
    expect(grid).toHaveLength(6);
    expect(clusters(grid.map((f) => f.x))).toBe(isMobile ? 2 : 3);
    await assertUniform(page, "N05");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("four compositions as cuts; the paper set at once; the credit from the first", async ({ page }) => {
    test.skip(tiny(page), "tiny viewports read the world as text");
    await open(page);
    await to(page, 0.5, U_RM);
    await expect.poll(() => state(page)).toBe("WORLD");
    expect((await part(page, "env")).opacity).toBe(1);
    await expect.poll(() => page.locator('#santi-nuca [data-part="space"]').getAttribute("data-paper")).toBe("yes");
    expect((await part(page, "credit")).opacity).toBe(1);
    for (const [t, name, count] of [
      [1.5, "N03", 2],
      [2.5, "N04", 3],
      [3.5, "N05", 6],
    ] as const) {
      await to(page, t, U_RM);
      await expect.poll(() => state(page)).toBe(name);
      await expect.poll(async () => (await visibleFigures(page)).length).toBe(count);
      const a = await visibleFigures(page);
      await page.waitForTimeout(150);
      expect(await visibleFigures(page)).toEqual(a);
      await assertUniform(page, name);
    }
    expect((await part(page, "label", 0)).clip).not.toMatch(SHOWN);
  });
});

test.describe("accessibility", () => {
  test("the photographs are Santi Nuca's in every alt; the credit is real text once in the world and again in the proof; axe", async ({ page }) => {
    test.skip(tiny(page), "tiny viewports read the copy instead");
    await open(page);
    await to(page, 5);
    await page.waitForTimeout(1300);
    const alts = await page.locator('#santi-nuca [data-part="figure"] img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt") ?? ""));
    expect(alts).toHaveLength(6);
    for (const a of alts) {
      expect(a.endsWith("— fotografía de Santi Nuca")).toBe(true);
      expect(a).not.toMatch(/franco/i);
    }
    const credits = await page.evaluate(() => {
      const visibleToAT = (el: Element) => !el.closest('[aria-hidden="true"]') && getComputedStyle(el).display !== "none";
      return Array.from(document.querySelectorAll("#santi-nuca p, [data-proof='santi-nuca'] p")).filter((p) => p.textContent?.trim() === "Fotografía · Santi Nuca" && visibleToAT(p)).length;
    });
    expect(credits).toBe(2);
    await expect(page.locator("#santi-nuca").getByRole("heading", { level: 2, name: "Santi Nuca" })).toHaveCount(1);
    const results = await new AxeBuilder({ page }).include("#santi-nuca").analyze();
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the world reads as its copy with the credit; no compositions", async ({ page }) => {
    await page.goto("/trabajo/santi-nuca");
    const world = page.locator("#santi-nuca");
    await expect(world.locator(".world-copy").getByText("Forma · Línea · Textura")).toBeVisible();
    await expect(world.locator(".world-credit")).toHaveText("Fotografía · Santi Nuca");
    await expect(world.locator(".world-credit")).toBeVisible();
    await expect(world.locator(".santi-layer")).toBeHidden();
  });
});
