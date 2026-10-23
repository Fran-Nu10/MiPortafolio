import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { GRID, LOOSE } from "../../src/lib/vision";
import { watchConsole } from "./console";
import { jump, scenesBuilt, settled } from "./scroll";

/**
 * «Distintas disciplinas. Una sola visión.» (docs/27 §3, Content Master 25): between THE SHIFT and
 * the capabilities. Three stages — Pensar → Diseñar → Construir — show one figure in three states
 * joined by one accent conductor; the static page is the finished transformation, the scene plays it
 * with the scroll (scrubbed, reversible, no pin). Narrow screens: one column; wide: three.
 */

const TITLE = ["Distintas disciplinas.", "Una sola visión."];
const WORDS = ["Pensar", "Diseñar", "Construir"];
const LINES = [
  "Entender el problema, el negocio y las oportunidades.",
  "Dar estructura, identidad y experiencia a la solución.",
  "Convertir las decisiones en un producto digital real y funcional.",
];
const CLOSE = "Una sola dirección, desde la primera decisión hasta el producto funcionando.";

const wide = (page: Page) => page.viewportSize()!.width >= 1024;
const reduced = (page: Page) => page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

async function open(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toHaveAttribute("data-started", "");
  await scenesBuilt(page);
}

const top = (page: Page) => page.evaluate(() => Math.round(document.getElementById("vision")!.getBoundingClientRect().top + window.scrollY));
const height = (page: Page) => page.evaluate(() => document.getElementById("vision")!.offsetHeight);

/** painted opacity of each stage's words, and of the close */
const shown = (page: Page) =>
  page.evaluate(() => {
    const op = (e: Element) => Number(getComputedStyle(e).opacity);
    return {
      words: Array.from(document.querySelectorAll("#vision .vision-word")).map(op),
      close: op(document.querySelector("#vision .vision-close")!),
    };
  });

/** the figures' geometry: the points' centres per stage and the modules' scale */
const figures = (page: Page) =>
  page.evaluate(() => {
    const pts = (k: number) => Array.from(document.querySelectorAll(`#vision [data-stage="${k}"] [data-point]`)).map((c) => [Number(c.getAttribute("cx")), Number(c.getAttribute("cy"))]);
    const scale = Array.from(document.querySelectorAll("#vision [data-module]")).map((m) => new DOMMatrix(getComputedStyle(m).transform).a);
    return { think: pts(0), design: pts(1), scale };
  });

test.describe("place and copy", () => {
  test("THE SHIFT → Una sola visión → Capacidades; the title, three stages and the close, exact", async ({ page }) => {
    await open(page);
    const order = await page.evaluate(() => Array.from(document.querySelectorAll("main > section[id]")).map((s) => s.id));
    expect(order.slice(order.indexOf("shift"), order.indexOf("shift") + 3)).toEqual(["shift", "vision", "capacidades"]);
    await expect(page.locator("#vision h2 .vision-title-line")).toHaveText(TITLE);
    await expect(page.locator("#vision h3")).toHaveText(WORDS);
    await expect(page.locator("#vision .vision-line")).toHaveText(LINES);
    await expect(page.locator("#vision .vision-close")).toHaveText(CLOSE);
    // the second line is the accent; no claim beyond the brief's words, no figure, no number
    expect(await page.locator("#vision .vision-accent").evaluate((e) => getComputedStyle(e).color)).toBe("rgb(100, 136, 255)");
    expect(await page.locator("#vision").innerText()).not.toMatch(/\d|mismas manos|fotograf/i);
    // the figures are decorative: the words carry the meaning
    expect(await page.locator("#vision svg").evaluateAll((s) => s.every((x) => x.getAttribute("aria-hidden") === "true"))).toBe(true);
  });

  test("composition: one column with the conductor down it (narrow), three columns with it across (wide); nothing overlaps or leaves the viewport", async ({ page }) => {
    const problems = watchConsole(page);
    await open(page);
    await jump(page, (await top(page)) + 40);
    await settled(page);
    const stages = await page.locator("#vision .vision-stage").evaluateAll((e) => e.map((x) => x.getBoundingClientRect().toJSON() as DOMRect));
    const vw = page.viewportSize()!.width;
    if (wide(page)) {
      expect(new Set(stages.map((r) => Math.round(r.top))).size).toBe(1);
      for (let i = 1; i < 3; i++) expect(stages[i].left).toBeGreaterThanOrEqual(stages[i - 1].right);
    } else {
      for (let i = 1; i < 3; i++) expect(stages[i].top).toBeGreaterThanOrEqual(stages[i - 1].bottom);
    }
    for (const r of stages) expect(r.right).toBeLessThanOrEqual(vw + 1);
    // each word fits its stage on one line (no CONSTRUIR broken in two)
    const words = await page.locator("#vision .vision-word").evaluateAll((e) => e.map((x) => ({ h: x.getBoundingClientRect().height, lh: parseFloat(getComputedStyle(x).fontSize) })));
    for (const w of words) expect(w.h).toBeLessThan(w.lh * 1.6);
    // the conductor: a stretch from each node toward the next (along the column or across the row)
    // (its layout box: the scene scales it from 0 as it draws)
    const segs = await page.locator("#vision .vision-seg").evaluateAll((e) => e.map((x) => ({ w: (x as HTMLElement).offsetWidth, h: (x as HTMLElement).offsetHeight })));
    for (const s of segs) {
      if (wide(page)) expect(s.w).toBeGreaterThan(s.h * 20);
      else expect(s.h).toBeGreaterThan(s.w * 20);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    expect(problems).toEqual([]);
  });
});

test.describe("the transformation (motion allowed)", () => {
  test("scrubbed with the section's own pass, no pin: the idea finds its places, the grid takes them, the modules close; backwards it undoes", async ({ page }) => {
    await open(page);
    test.skip(await reduced(page), "reduced motion: the static page");
    const t = await top(page);
    const vh = page.viewportSize()!.height;
    // no pin: the section is as tall as its content, nothing sticky inside
    expect(await page.locator("#vision *").evaluateAll((e) => e.filter((x) => getComputedStyle(x).position === "sticky").length)).toBe(0);
    expect(await height(page)).toBeLessThan(vh * 3);

    // before it: the stages wait (words not in, the idea's points still at the centre)
    await jump(page, t - vh);
    await settled(page);
    await page.waitForTimeout(700);
    const before = await shown(page);
    expect(before.words.every((o) => o < 0.05)).toBe(true);
    const f0 = await figures(page);
    expect(f0.think.every(([x, y]) => Math.abs(x - 60) < 1 && Math.abs(y - 60) < 1)).toBe(true);

    // past it: every stage in, each figure in its own state, the close
    await jump(page, t + (await height(page)));
    await settled(page);
    await expect.poll(async () => (await shown(page)).close, { timeout: 4000 }).toBe(1);
    const after = await shown(page);
    expect(after.words).toEqual([1, 1, 1]);
    const f1 = await figures(page);
    f1.think.forEach(([x, y], i) => expect(Math.hypot(x - LOOSE[i][0], y - LOOSE[i][1])).toBeLessThan(0.5));
    f1.design.forEach(([x, y], i) => expect(Math.hypot(x - GRID[i][0], y - GRID[i][1])).toBeLessThan(0.5));
    f1.scale.forEach((s) => expect(Math.abs(s - 1)).toBeLessThan(0.01));

    // back up: it undoes (scrubbed, reversible)
    await jump(page, t - vh);
    await settled(page);
    await expect.poll(async () => (await shown(page)).words[2], { timeout: 4000 }).toBeLessThan(0.05);

    // the vertical wheel over it scrolls the document (never captured)
    if (await page.evaluate(() => matchMedia("(pointer: fine)").matches)) {
      await jump(page, t);
      await settled(page);
      const y0 = await page.evaluate(() => window.scrollY);
      await page.mouse.move(page.viewportSize()!.width / 2, vh / 2);
      await page.mouse.wheel(0, 300);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y0 + 100);
    }
  });

  test("axe at the finished state", async ({ page }) => {
    await open(page);
    await jump(page, (await top(page)) + (await height(page)) - page.viewportSize()!.height / 2);
    await settled(page);
    await page.waitForTimeout(900);
    const results = await new AxeBuilder({ page }).include("#vision").analyze();
    expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  });
});

test.describe("static page", () => {
  test.use({ reducedMotion: "reduce" });
  test("reduced motion: the three states as they are, everything in, nothing moves", async ({ page }) => {
    await open(page);
    await jump(page, (await top(page)) - page.viewportSize()!.height);
    await settled(page);
    const s = await shown(page);
    expect(s.words).toEqual([1, 1, 1]);
    expect(s.close).toBe(1);
    const f = await figures(page);
    f.think.forEach(([x, y], i) => expect([x, y]).toEqual(LOOSE[i]));
    f.design.forEach(([x, y], i) => expect([x, y]).toEqual(GRID[i]));
    f.scale.forEach((v) => expect(v).toBe(1));
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the title, the three stages with their figures and the close read in order", async ({ page }) => {
    await page.goto("/");
    const text = (await page.locator("#vision").textContent()) ?? "";
    let at = -1;
    for (const o of [...TITLE, ...WORDS.flatMap((w, i) => [w, LINES[i]]), CLOSE]) {
      const i = text.indexOf(o, at + 1);
      expect(i, o).toBeGreaterThan(at);
      at = i;
    }
    await expect(page.locator("#vision [data-module]")).toHaveCount(9);
    expect(await page.locator("#vision .vision-close").evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
  });
});
