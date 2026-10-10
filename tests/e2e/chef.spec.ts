import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 8 acceptance (Spec §26): C00–C07 + reduced motion · the image element is the same DOM
 * node from C02 to C06 · the DOM commerce UI has no focusable fake controls. Plus continuity
 * from Santi and toward Capacidades, tiers, reversal, the facts, accessibility and no-JS.
 */

const U = 6.4;
const U_RM = 5;

const tiny = (page: Page) => {
  const v = page.viewportSize()!;
  return v.width < 360 || v.height < 560;
};
const state = (page: Page) => page.locator("#chef-arturo").getAttribute("data-state");
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
  await page.goto("/trabajo/chef-arturo", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toHaveAttribute("data-started", "");
}

async function to(page: Page, t: number, units = U) {
  const y = await page.evaluate(
    ([t, units]) => {
      const stage = document.querySelector<HTMLElement>('#chef-arturo [data-part="stage"]')!;
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
      const el = document.querySelectorAll<HTMLElement>(`#chef-arturo [data-part="${name}"]`)[nth]!;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { opacity: Number(cs.opacity), visibility: cs.visibility, x: r.x, y: r.y, w: r.width, h: r.height, transform: cs.transform, clip: cs.clipPath, color: cs.color, bg: cs.backgroundColor };
    },
    [name, nth] as const,
  );

/** the visible box of the product figure (its clip window), and whether its transform is uniform */
const productBox = (page: Page) =>
  page.evaluate(() => {
    const f = document.querySelector<HTMLElement>('#chef-arturo [data-part="product"]')!;
    const sp = document.querySelector<HTMLElement>('#chef-arturo [data-part="space"]')!;
    const num = (t: string) => Number((t.match(/^matrix\(([^,]+)/) ?? [0, "1"])[1]) || 1;
    const scale = num(getComputedStyle(f).transform) * num(getComputedStyle(sp).transform);
    const m = getComputedStyle(f).transform.match(/^matrix\(([^)]+)\)$/);
    const [a, b, c, d] = m ? m[1].split(",").map(Number) : [1, 0, 0, 1];
    const parts = (getComputedStyle(f).clipPath.match(/inset\(([^)]+)\)/)?.[1] ?? "0").trim().split(/\s+/).map(parseFloat);
    const iT = parts[0];
    const iR = parts[1] ?? iT;
    const iB = parts[2] ?? iT;
    const iL = parts[3] ?? iR;
    const r = f.getBoundingClientRect();
    return { x: r.x + iL * scale, y: r.y + iT * scale, w: r.width - (iL + iR) * scale, h: r.height - (iT + iB) * scale, uniform: Math.abs(b) < 1e-3 && Math.abs(c) < 1e-3 && Math.abs(a - d) < 1e-3 * Math.max(1, Math.abs(a)), opacity: Number(getComputedStyle(f).opacity) };
  });

/** at C02, resting on the label: the shell's object or the world's figure, whichever shows */
async function macroBox(page: Page) {
  const f = await productBox(page);
  if (f.opacity === 1) return f;
  const o = await part(page, "object");
  return { x: o.x, y: o.y, w: o.w, h: o.h, uniform: true, opacity: o.opacity };
}

async function shot(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot(), contentType: "image/png" });
}

test.describe("C00–C07 at the reference viewport", () => {
  test("every state in order, with its composition (Spec §11)", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440", "the reference viewport, once");
    const problems = watchConsole(page);
    await open(page);
    expect(await state(page)).toBe("SCREEN");
    expect((await part(page, "object")).opacity).toBe(0);
    await shot(page, "C00 SCREEN");

    await to(page, 1);
    await expect.poll(() => state(page)).toBe("ISOLATE");
    await expect.poll(async () => (await part(page, "screen-dim")).opacity).toBeCloseTo(0.75, 2);
    await shot(page, "C01 ISOLATE");

    // C02 · macro: the photograph covers the viewport
    await to(page, 2);
    await expect.poll(() => state(page)).toBe("WORLD");
    await expect.poll(async () => (await part(page, "screen")).opacity).toBe(0);
    const vw = page.viewportSize()!.width;
    const vh = page.viewportSize()!.height;
    await page.waitForTimeout(800);
    const mac = await macroBox(page);
    expect(mac.opacity).toBe(1);
    expect(mac.w).toBeGreaterThanOrEqual(vw - 2);
    expect(mac.h).toBeGreaterThanOrEqual(vh - 2);
    expect(mac.uniform).toBe(true);
    // the same node from here on: tag it
    await page.evaluate(() => ((document.querySelector('#chef-arturo [data-part="product"]') as HTMLElement & { __tag?: string }).__tag = "food"));
    await shot(page, "C02 MACRO");

    // C03 · pull back: the whole product at its card slot, on the store's cream
    await to(page, 3);
    await expect.poll(() => state(page)).toBe("C03");
    await expect.poll(async () => (await part(page, "field")).opacity).toBe(1);
    expect((await part(page, "field")).bg).toBe("rgb(247, 243, 234)");
    const whole = await productBox(page);
    expect(whole.w).toBeLessThan(vw * 0.3);
    expect(whole.uniform).toBe(true);
    await shot(page, "C03 RETROCEDE");

    // C04 · the catalog composition: heading, four cards (the product is the second), chrome
    await to(page, 4);
    await expect.poll(() => state(page)).toBe("C04");
    await expect.poll(async () => (await part(page, "heading")).clip).toMatch(SHOWN);
    for (let i = 0; i < 3; i++) await expect.poll(async () => (await part(page, "sibling", i)).clip).toMatch(SHOWN);
    await expect(page.locator('#chef-arturo [data-part="heading"] .chef-heading-title')).toHaveText("Merienda");
    await expect(page.locator('#chef-arturo [data-part="heading"] .chef-heading-line')).toHaveText("cookies, brownies y boxes dulces");
    await expect(page.locator('#chef-arturo [data-part="chrome"] .chef-card-label')).toHaveText([
      "Cookie Levain clásica con chips",
      "Cookie Levain de pistacho y chocolate blanco",
      "Cookie Levain red velvet con chocolate blanco",
      "Cookie Levain cacao al 100%",
    ]);
    const card = await productBox(page);
    const sib0 = await part(page, "sibling", 0);
    const sib1 = await part(page, "sibling", 1);
    expect(card.x).toBeGreaterThan(sib0.x + sib0.w - 2);
    expect(card.x + card.w).toBeLessThan(sib1.x + 2);
    expect(Math.abs(card.y - sib0.y)).toBeLessThan(2);
    expect(Math.abs(card.w - sib0.w)).toBeLessThan(2);
    expect(card.uniform).toBe(true);
    await shot(page, "C04 COMPOSICIÓN");

    // C05 · the product view: the same element grows, the information beside it
    await to(page, 5);
    await expect.poll(() => state(page)).toBe("C05");
    await expect.poll(async () => (await part(page, "info-tag")).clip).toMatch(SHOWN);
    await expect.poll(async () => (await part(page, "sibling", 0)).opacity).toBe(0);
    const view = await productBox(page);
    expect(view.w).toBeGreaterThan(card.w * 1.4);
    expect(view.uniform).toBe(true);
    await expect(page.locator('#chef-arturo [data-part="info-name"]')).toHaveText("Cookie levain de pistacho y chocolate blanco");
    await expect(page.locator('#chef-arturo [data-part="info-price"]')).toHaveText("$ 120");
    await expect(page.locator('#chef-arturo [data-part="info-tag"]')).toHaveText("compra directa");
    const infoBox = await part(page, "info");
    expect(infoBox.x).toBeGreaterThan(view.x + view.w);
    expect(await page.locator('#chef-arturo [data-part="control"]').evaluateAll((els) => els.every((e) => getComputedStyle(e).clipPath.includes("100%")))).toBe(true);
    await shot(page, "C05 INFORMACIÓN");

    // C06 · the purchase controls
    await to(page, 5.6);
    await expect.poll(() => state(page)).toBe("C06");
    await expect.poll(async () => (await part(page, "control", 3)).clip).toMatch(SHOWN);
    await expect(page.locator("#chef-arturo .chef-stepper")).toHaveText("−1+");
    await expect(page.locator("#chef-arturo .chef-btn-primary")).toHaveText("Agregar al carrito");
    await expect(page.locator("#chef-arturo .chef-pay")).toHaveText("Mercado Pago");
    await expect(page.locator("#chef-arturo .chef-btn-secondary")).toHaveText("consultar por WhatsApp");
    // the same DOM node as the food of C02
    expect(await page.evaluate(() => (document.querySelector('#chef-arturo [data-part="product"]') as HTMLElement & { __tag?: string }).__tag)).toBe("food");
    expect(await page.locator('#chef-arturo [data-part="product"]').count()).toBe(1);
    await shot(page, "C06 COMPRA");

    // C07 · the closing line; the UI dims
    await to(page, 6.2);
    await expect.poll(() => state(page)).toBe("C07");
    await expect.poll(async () => (await part(page, "close")).clip).toMatch(SHOWN);
    await expect.poll(async () => (await part(page, "commerce")).opacity).toBeCloseTo(0.4, 2);
    await expect(page.locator('#chef-arturo [data-part="close"]')).toHaveText("Primero el deseo. Después, la compra.");
    const closeBox = await part(page, "close");
    const photo = await productBox(page);
    expect(closeBox.y).toBeGreaterThanOrEqual(photo.y + photo.h - 1);
    await shot(page, "C07 CIERRE");

    // the proof: the honest line, the role, "Siguiente → Capacidades"
    const proof = page.locator('[data-proof="chef-arturo"]');
    await proof.scrollIntoViewIfNeeded();
    await expect(proof.getByText("Tienda real, en línea.")).toBeVisible();
    await expect(proof.getByText("pagos en producción")).toHaveCount(0);
    await expect(proof.getByText("Producto, diseño y desarrollo")).toBeVisible();
    await expect(proof.getByRole("link", { name: /Siguiente/ })).toHaveText(/Capacidades/);
    expect(problems).toEqual([]);
  });

  test("the commerce UI is a depiction: one role=img, no focusable fake controls", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440", "the reference viewport, once");
    await open(page);
    const commerce = page.locator('#chef-arturo [data-part="commerce"]');
    await expect(commerce).toHaveAttribute("role", "img");
    await expect(commerce).toHaveAttribute("aria-label", /Vista de compra de Chef Arturo: Cookie levain de pistacho y chocolate blanco, \$ 120, agregar al carrito, Mercado Pago o WhatsApp/);
    expect(await commerce.locator("button, a, input, select, textarea, [tabindex]").count()).toBe(0);
    expect(await page.locator("#chef-arturo .chef-layer button, #chef-arturo .chef-layer a, #chef-arturo .chef-layer [tabindex]").count()).toBe(0);
    // the world itself has no focusable element (Spec §19): only the proof's links
    const focusables = await page.locator("#chef-arturo").locator("a, button, input, [tabindex]:not([tabindex='-1'])").count();
    expect(focusables).toBe(0);
  });

  test("scrolling back undoes every state", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440", "the reference viewport, once");
    await open(page);
    await to(page, 6.2);
    await expect.poll(() => state(page)).toBe("C07");
    await expect.poll(async () => (await part(page, "close")).clip).toMatch(SHOWN);
    await to(page, 4);
    await expect.poll(() => state(page)).toBe("C04");
    await expect.poll(async () => (await part(page, "close")).clip).not.toMatch(SHOWN);
    await expect.poll(async () => (await part(page, "sibling", 0)).opacity).toBe(1);
    await expect.poll(async () => (await part(page, "commerce")).opacity).toBe(1);
    await to(page, 2);
    await expect.poll(() => state(page)).toBe("WORLD");
    await expect.poll(async () => (await part(page, "field")).opacity).toBe(0);
    await expect.poll(async () => (await macroBox(page)).w).toBeGreaterThanOrEqual(page.viewportSize()!.width - 2);
    await to(page, 1);
    await expect.poll(() => state(page)).toBe("ISOLATE");
    await expect.poll(async () => (await part(page, "object")).opacity).toBe(1);
  });

  test("continuity: Santi's paper proof dims into Chef's SCREEN; the cream arrives with the pull-back; the proof leads to Capacidades", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440", "the reference viewport, once");
    await page.goto("/trabajo/santi-nuca", { waitUntil: "networkidle" });
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
    await proofAt("santi-nuca", 0.95);
    expect(await page.locator('[data-proof="santi-nuca"] [data-part="window"]').evaluate((w) => Number(getComputedStyle(w).opacity))).toBeLessThan(0.75);
    await proofAt("santi-nuca", 1.0);
    await expect.poll(() => state(page)).toBe("SCREEN");
    expect((await part(page, "field")).opacity).toBe(0);
    await to(page, 3);
    await expect.poll(() => state(page)).toBe("C03");
    await expect.poll(async () => (await part(page, "field")).opacity).toBe(1);
    await proofAt("chef-arturo", 1.0);
    await expect(page.locator("#capacidades")).toBeVisible();
  });
});

test.describe("tiers", () => {
  test("2D everywhere; phones: a full-bleed macro, a 2×2 catalog, the information under the photograph", async ({ page, isMobile }, info) => {
    test.skip(tiny(page), "tiny viewports read the world as text");
    test.skip(info.project.use.reducedMotion === "reduce", "reduced motion has its own test");
    await open(page);
    await to(page, 2);
    await expect.poll(() => state(page)).toBe("WORLD");
    await page.waitForTimeout(800);
    const vp = page.viewportSize()!;
    const mac = await macroBox(page);
    expect(mac.w).toBeGreaterThanOrEqual(vp.width - 2);
    expect(mac.h).toBeGreaterThanOrEqual(vp.height - 2);
    expect(await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("#chef-arturo .chef-layer *")).filter((el) => getComputedStyle(el).transform.startsWith("matrix3d")).length)).toBe(0);
    await to(page, 4);
    await expect.poll(() => state(page)).toBe("C04");
    await page.waitForTimeout(900);
    const rows = new Set([0, 1, 2].map(() => 0));
    rows.clear();
    for (let i = 0; i < 3; i++) rows.add(Math.round((await part(page, "sibling", i)).y / 8));
    expect(rows.size).toBe(isMobile ? 2 : 1);
    await to(page, 5.6);
    await expect.poll(() => state(page)).toBe("C06");
    await page.waitForTimeout(900);
    const photo = await productBox(page);
    const infoBox = await part(page, "info");
    if (isMobile) expect(infoBox.y).toBeGreaterThan(photo.y + photo.h - 2);
    else expect(infoBox.x).toBeGreaterThan(photo.x + photo.w - 2);
    expect(photo.uniform).toBe(true);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("five stills as cuts; no video", async ({ page }) => {
    test.skip(tiny(page), "tiny viewports read the world as text");
    await open(page);
    await to(page, 0.5, U_RM);
    await expect.poll(() => state(page)).toBe("WORLD");
    const vp = page.viewportSize()!;
    await page.waitForTimeout(300);
    expect((await macroBox(page)).w).toBeGreaterThanOrEqual(vp.width - 2);
    for (const [t, name] of [
      [1.5, "C03"],
      [2.5, "C04"],
      [3.5, "C06"],
      [4.5, "C07"],
    ] as const) {
      await to(page, t, U_RM);
      await expect.poll(() => state(page)).toBe(name);
      const a = await productBox(page);
      await page.waitForTimeout(150);
      expect(await productBox(page)).toEqual(a);
    }
    expect((await part(page, "field")).opacity).toBe(1);
    expect((await part(page, "close")).clip).toMatch(SHOWN);
    expect((await part(page, "commerce")).opacity).toBeCloseTo(0.4, 2);
    expect(await page.locator("#chef-arturo video").count()).toBe(0);
  });
});

test.describe("accessibility", () => {
  test("the depiction is one image for AT; the real copy exists once; the siblings carry the store's names; axe at C07", async ({ page }) => {
    test.skip(tiny(page), "tiny viewports read the copy instead");
    await open(page);
    await to(page, 6.2);
    await page.waitForTimeout(1100);
    const alts = await page.locator('#chef-arturo [data-part="sibling"] img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt") ?? ""));
    expect(alts).toEqual([
      "Cookie Levain clásica con chips, del catálogo de Chef Arturo",
      "Cookie Levain red velvet con chocolate blanco, del catálogo de Chef Arturo",
      "Cookie Levain cacao al 100%, del catálogo de Chef Arturo",
    ]);
    await expect(page.locator('#chef-arturo [data-part="product"] img')).toHaveAttribute("alt", "Cookie levain de pistacho y chocolate blanco");
    const closes = await page.evaluate(() => {
      const visibleToAT = (el: Element) => !el.closest('[aria-hidden="true"]') && !el.closest(".world-copy");
      return Array.from(document.querySelectorAll("#chef-arturo p")).filter((p) => p.textContent?.trim() === "Primero el deseo. Después, la compra." && visibleToAT(p)).length;
    });
    expect(closes).toBe(1);
    await expect(page.locator("#chef-arturo > .world-copy")).toBeHidden();
    await expect(page.locator("#chef-arturo").getByRole("heading", { level: 2, name: "Chef Arturo" })).toHaveCount(1);
    // at C07 the depiction is dimmed to .4 by design (Spec §11) and is one image for AT (its
    // label carries the information): axe runs on the closing line here, and on the full UI at C06
    const atC07 = await new AxeBuilder({ page }).include("#chef-arturo").exclude('#chef-arturo [data-part="commerce"]').analyze();
    const badC07 = atC07.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(badC07.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
    await to(page, 5.6);
    await expect.poll(() => state(page)).toBe("C06");
    await page.waitForTimeout(900);
    const atC06 = await new AxeBuilder({ page }).include("#chef-arturo").analyze();
    const badC06 = atC06.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(badC06.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the world reads as its copy; no compositions, no video", async ({ page }) => {
    await page.goto("/trabajo/chef-arturo");
    const world = page.locator("#chef-arturo");
    const copy = world.locator(".world-copy");
    await expect(copy.getByText("Merienda · cookies, brownies y boxes dulces")).toBeVisible();
    await expect(copy.getByText("Primero el deseo. Después, la compra.")).toBeVisible();
    await expect(world.locator(".chef-layer")).toBeHidden();
    expect(await world.locator("video").count()).toBe(0);
  });
});
