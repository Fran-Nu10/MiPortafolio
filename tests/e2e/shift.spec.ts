import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { SHIFT_AT, SHIFT_STATES, SHIFT_UNITS, type ShiftState } from "../../src/lib/shift";
import { watchConsole } from "./console";
import { jump, scenesBuilt, settled } from "./scroll";

/**
 * THE SHIFT (docs/25, Content Master 23): between the reel and the capabilities, how complexity
 * becomes product. Pinned on every tier with motion (its own drawing per variant), four resting
 * states forward and back, the fragments are the interface (FLIP: at rest they sit exactly where the
 * finished interface has them), one gesture works, no jump in or out; a static page under reduced
 * motion, on tiny viewports and without JavaScript. The home journey carries no world any more.
 */

const LINES = ["Una idea no alcanza.", "Necesita dirección.", "Y ejecución.", "De la idea al producto."];

const reduced = (page: Page) => page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
const tiny = (page: Page) => page.evaluate(() => matchMedia("(max-width: 359.98px), (max-height: 559.98px)").matches);

async function open(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toHaveAttribute("data-started", "");
  await scenesBuilt(page);
}

const pin = (page: Page) =>
  page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>("#shift [data-part=stage]")!;
    const holder = stage.parentElement!;
    return { top: Math.ceil(holder.getBoundingClientRect().top + window.scrollY), len: holder.offsetHeight - stage.offsetHeight, sticky: getComputedStyle(stage).position === "sticky" };
  });

/** jump onto a state's label, repeated if a late snap carried it back (as tests/e2e/declaration) */
async function toState(page: Page, s: ShiftState) {
  const p = await pin(page);
  const y = Math.round(p.top + (SHIFT_AT[s] / SHIFT_UNITS) * p.len);
  const state = () => page.locator("#shift [data-part=stage]").getAttribute("data-state");
  await jump(page, y);
  await expect
    .poll(
      async () => {
        await settled(page);
        if ((await state()) !== s) {
          await page.waitForTimeout(400);
          if ((await state()) !== s) await jump(page, y);
        }
        return state();
      },
      { timeout: 10_000 },
    )
    .toBe(s);
  // scrub 0.6: the playhead settles after the scroll
  await page.waitForTimeout(900);
  await settled(page);
  await expect(page.locator("#shift [data-part=stage]")).toHaveAttribute("data-state", s);
}

/** painted opacity (the element's and its ancestors') and the rect */
const look = (page: Page, sel: string) =>
  page.evaluate((sel) => {
    const e = document.querySelector<HTMLElement>(sel)!;
    const r = e.getBoundingClientRect();
    let o = 1;
    for (let n: HTMLElement | null = e; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height, o, transform: getComputedStyle(e).transform };
  }, sel);

/** an act line is shown when both its halves sit in their masks (docs/26 §B), hidden when both are out */
const lineShown = (page: Page, n: number) =>
  page.evaluate((n) => {
    const act = document.querySelectorAll<HTMLElement>("#shift [data-part=act]")[n];
    const inMask = (sel: string) => {
      const el = act.querySelector<HTMLElement>(sel)!;
      return Math.abs(el.getBoundingClientRect().top - el.parentElement!.getBoundingClientRect().top) < 2;
    };
    return inMask("[data-part=lead]") && inMask("[data-part=accent]");
  }, n);

/** every drawn fragment: how far its painted box is from its laid-out box (FLIP at rest = 0) */
const drift = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("#shift [data-part=el]"))
      .filter((e) => e.offsetWidth > 0)
      .map((e) => {
        const t = getComputedStyle(e).transform;
        const m = t === "none" ? new DOMMatrix() : new DOMMatrix(t);
        return { k: e.dataset.k, d: Math.max(Math.abs(m.m41), Math.abs(m.m42), Math.abs(m.m43), Math.abs(m.a - 1) * 100, Math.abs(m.b) * 100) };
      }),
  );

test.describe("place in the journey", () => {
  test("hero → reel → THE SHIFT → vision → capabilities → declaration → profile → contact; no world in the home", async ({ page }) => {
    await open(page);
    const ids = await page.evaluate(() => [...new Set(Array.from(document.querySelectorAll<HTMLElement>("main [data-section]")).map((e) => e.dataset.section))]);
    // «Una sola visión» between THE SHIFT and the capabilities since docs/27 §3
    expect(ids).toEqual(["inicio", "trabajo", "shift", "vision", "capacidades", "propuesta", "perfil", "contacto"]);
    for (const slug of ["travelsuite360", "rayo-smash", "santi-nuca", "chef-arturo"]) await expect(page.locator(`#${slug}`)).toHaveCount(0);
    await expect(page.locator("#shift h2")).toHaveText("De la complejidad al producto.");
    await expect(page.locator("#shift .shift-line")).toHaveText(LINES);
    // the interface is one described image: nothing in it takes focus, nothing pretends to be a control
    await expect(page.locator("#shift [role=img]")).toHaveAttribute("aria-label", /Interfaz conceptual/);
    expect(await page.locator("#shift a, #shift button, #shift input, #shift [tabindex]").count()).toBe(0);
  });
});

test.describe("the transformation (pinned, with motion)", () => {
  test("four resting states in order, forward and back; one line at a time; the fragments become the interface", async ({ page }) => {
    const problems = watchConsole(page);
    await open(page);
    test.skip((await reduced(page)) || (await tiny(page)), "static page");
    const p = await pin(page);
    expect(p.sticky).toBe(true);
    const vh = page.viewportSize()!.height;
    // compact: one gesture per act (60–80vh), 2.6 gestures in all
    expect(p.len / vh).toBeGreaterThan(1.5);
    expect(p.len / vh).toBeLessThan(2.2);

    // act I: the disorder — the fragments are away from their places, turned
    await toState(page, "DESORDEN");
    const scattered = await drift(page);
    expect(scattered.filter((f) => f.d > 20).length / scattered.length).toBeGreaterThan(0.8);

    for (const s of SHIFT_STATES) {
      await toState(page, s);
      const i = SHIFT_STATES.indexOf(s);
      for (let n = 0; n < LINES.length; n++) expect(await lineShown(page, n), `${s}: line ${n + 1}`).toBe(n === i);
    }
    // the protagonist reads first: the line is larger than any fragment's type, its accent in the blue (docs/27)
    await toState(page, "DESORDEN");
    const lineSize = await page.locator("#shift [data-part=act] .shift-line").first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    const fragSize = await page.locator("#shift .sh-h1a").evaluate((e) => parseFloat(getComputedStyle(e).fontSize) * new DOMMatrix(getComputedStyle(e).transform).a);
    expect(lineSize).toBeGreaterThan(fragSize * 1.15);
    expect(await page.locator("#shift [data-part=accent]").first().evaluate((e) => getComputedStyle(e).color)).toBe("rgb(100, 136, 255)");

    // act III and IV: every fragment on its place in the finished interface (FLIP, nothing swapped)
    await toState(page, "EJECUCION");
    const placed = await drift(page);
    expect(placed.filter((f) => f.k !== "card2").every((f) => f.d < 1.5), JSON.stringify(placed)).toBe(true);
    // the gesture: «Publicar» is on, the state reads «Publicado», the bar is full
    expect((await look(page, "#shift [data-part=on]")).o).toBeGreaterThan(0.99);
    expect((await look(page, "#shift [data-part=live]")).o).toBeGreaterThan(0.99);
    expect((await look(page, "#shift [data-part=draft]")).o).toBeLessThan(0.01);
    const fill = await look(page, "#shift [data-part=fill]");
    const meter = await look(page, "#shift .sh-done .sh-meter");
    expect(fill.width).toBeGreaterThan(meter.width - 1);

    // the result: the camera steps back, the caption says what the interface is
    await toState(page, "RESULTADO");
    expect((await look(page, "#shift [data-part=concept]")).o).toBeGreaterThan(0.99);
    await expect(page.locator("#shift [data-part=concept]")).toHaveText("Interfaz conceptual, diseñada para esta sección.");
    const ui = await look(page, "#shift [data-part=plane]");
    const vw = page.viewportSize()!.width;
    expect(ui.left).toBeGreaterThanOrEqual(0);
    expect(ui.right).toBeLessThanOrEqual(vw);
    expect(ui.bottom).toBeLessThanOrEqual(vh);
    // the act line and the interface never overlap
    const line = await look(page, "#shift [data-part=act]:nth-child(4) .shift-line");
    const disjoint = line.right <= ui.left + 1 || line.bottom <= ui.top + 1;
    expect(disjoint).toBe(true);

    // back, state by state, to the disorder again
    for (const s of [...SHIFT_STATES].reverse()) await toState(page, s);
    expect((await look(page, "#shift [data-part=concept]")).o).toBeLessThan(0.01);
    expect((await look(page, "#shift [data-part=on]")).o).toBeLessThan(0.01);
    const again = await drift(page);
    expect(again.filter((f) => f.d > 20).length / again.length).toBeGreaterThan(0.8);

    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    expect(problems).toEqual([]);
  });

  test("the disorder never covers the act line and never leaves the viewport", async ({ page }) => {
    await open(page);
    test.skip((await reduced(page)) || (await tiny(page)), "static page");
    await toState(page, "DESORDEN");
    const vw = page.viewportSize()!.width;
    const vh = page.viewportSize()!.height;
    const line = await look(page, "#shift [data-part=act]:nth-child(1) .shift-line");
    expect(await lineShown(page, 0)).toBe(true);
    const boxes = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("#shift [data-part=el]"))
        .filter((e) => e.offsetWidth > 0)
        .map((e) => ({ k: e.dataset.k, ...e.getBoundingClientRect().toJSON() })),
    );
    for (const b of boxes) {
      expect(b.left, b.k).toBeGreaterThanOrEqual(-2);
      expect(b.right, b.k).toBeLessThanOrEqual(vw + 2);
      expect(b.bottom, b.k).toBeLessThanOrEqual(vh + 2);
      const over = b.left < line.right && b.right > line.left && b.top < line.bottom && b.bottom > line.top;
      expect(over, `${b.k} over the line`).toBe(false);
    }
  });

  test("no jump on the way in or out; the vertical wheel is never captured", async ({ page }) => {
    await open(page);
    test.skip((await reduced(page)) || (await tiny(page)), "static page");
    const p = await pin(page);
    await jump(page, p.top - 40);
    await settled(page);
    const before = await look(page, "#shift .shift-title");
    await jump(page, p.top);
    await settled(page);
    const at = await look(page, "#shift .shift-title");
    expect(Math.abs(at.top - (before.top - 40))).toBeLessThanOrEqual(1);

    await jump(page, p.top + p.len);
    await settled(page);
    await page.waitForTimeout(900);
    const end = await look(page, "#shift .shift-title");
    await jump(page, p.top + p.len + 40);
    await settled(page);
    const after = await look(page, "#shift .shift-title");
    expect(Math.abs(after.top - (end.top - 40))).toBeLessThanOrEqual(1);

    // a wheel over the stage scrolls the document (Spec §05)
    if (!page.viewportSize() || (await page.evaluate(() => matchMedia("(pointer: fine)").matches))) {
      await jump(page, p.top + Math.round(p.len / 3));
      await settled(page);
      const y0 = await page.evaluate(() => window.scrollY);
      await page.mouse.move(page.viewportSize()!.width / 2, page.viewportSize()!.height / 2);
      await page.mouse.wheel(0, 300);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y0 + 100);
    }
  });

  test("a reload inside the sequence returns to the same state (the scene builds on approach)", async ({ page }) => {
    await open(page);
    test.skip((await reduced(page)) || (await tiny(page)), "static page");
    await toState(page, "DIRECCION");
    await page.waitForTimeout(500);
    const y = await page.evaluate(() => Math.round(window.scrollY));
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 8000 }).toBeGreaterThan(y - 3);
    expect(Math.abs((await page.evaluate(() => Math.round(window.scrollY))) - y)).toBeLessThanOrEqual(3);
    await expect(page.locator("#shift [data-part=stage]")).toHaveAttribute("data-state", "DIRECCION", { timeout: 8000 });
  });

  test("a width change rebuilds the scene where the visitor was (resize)", async ({ page }) => {
    await open(page);
    test.skip((await reduced(page)) || (await tiny(page)), "static page");
    await toState(page, "EJECUCION");
    const size = page.viewportSize()!;
    // narrower within the same variant (phones stay above the 360 px tiny limit)
    await page.setViewportSize({ width: size.width - (size.width < 768 ? 24 : 80), height: size.height });
    await page.waitForTimeout(900);
    await settled(page);
    await expect(page.locator("#shift [data-part=stage]")).toHaveAttribute("data-state", "EJECUCION", { timeout: 6000 });
    const placed = await drift(page);
    expect(placed.filter((f) => f.k !== "card2").every((f) => f.d < 1.5)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test("axe at the result", async ({ page }) => {
    await open(page);
    test.skip((await reduced(page)) || (await tiny(page)), "static page");
    await toState(page, "RESULTADO");
    const results = await new AxeBuilder({ page }).include("#shift").analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

test.describe("static page", () => {
  test("reduced motion and tiny viewports: no pin, the four lines and the finished interface", async ({ page }) => {
    const problems = watchConsole(page);
    await open(page);
    test.skip(!(await reduced(page)) && !(await tiny(page)), "the pinned transformation");
    const p = await pin(page);
    expect(p.sticky).toBe(false);
    expect(p.len).toBe(0);
    let last = -Infinity;
    for (let n = 1; n <= 4; n++) {
      const r = await look(page, `#shift [data-part=act]:nth-child(${n}) .shift-line`);
      expect(r.o).toBeGreaterThan(0.99);
      const y = r.top + (await page.evaluate(() => window.scrollY));
      expect(y).toBeGreaterThan(last);
      last = y;
    }
    // the finished interface, at rest: the switch on, «Publicado», the caption
    expect((await look(page, "#shift .sh-frame .sh-done")).o).toBeGreaterThan(0.99);
    expect((await look(page, "#shift [data-part=live]")).o).toBeGreaterThan(0.99);
    expect((await look(page, "#shift [data-part=draft]")).o).toBeLessThan(0.01);
    expect((await look(page, "#shift [data-part=concept]")).o).toBeGreaterThan(0.99);
    expect(await page.locator("#shift .sh-note:visible").count()).toBe(0);
    const results = await new AxeBuilder({ page }).include("#shift").analyze();
    expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    expect(problems).toEqual([]);
  });

  test("without JavaScript: the four lines, the interface and its caption", async ({ browser }, info) => {
    const ctx = await browser.newContext({ ...info.project.use, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/");
    const s = page.locator("#shift");
    await expect(s.locator(".shift-line")).toHaveText(LINES);
    await expect(s.locator("[role=img]")).toHaveAttribute("aria-label", /Interfaz conceptual/);
    await expect(s.locator("figcaption")).toHaveText("Interfaz conceptual, diseñada para esta sección.");
    for (const sel of [".shift-line", ".sh-frame .sh-done", ".sh-h1a .sh-done", "figcaption"]) {
      const o = await s.locator(sel).first().evaluate((e) => Number(getComputedStyle(e).opacity));
      expect(o, sel).toBe(1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await ctx.close();
  });
});
