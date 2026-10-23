import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { watchConsole } from "./console";
import { jump, scenesBuilt, settled } from "./scroll";

/**
 * The commercial declaration (Content Master 20, docs/22): MOSTRAR → CONVENCER → CONVERTIR between
 * the capabilities and the profile. Pinned choreography on every tier with motion (its own drawing
 * per variant), eight resting states forward and back, no jump in or out, the URL in step; a
 * static editorial page under reduced motion, on tiny viewports and without JavaScript.
 */

const AT = { CAMPO: 0, DESCUBRE: 0.8, MOSTRAR: 1.8, ORDEN: 2.8, CONVENCER: 3.6, ACCION: 4.6, CONVERTIR: 5.5, ELIJAN: 6.4 } as const;
const UNITS = 6.9;
const STATES = Object.keys(AT) as (keyof typeof AT)[];
const TITLES = ["MOSTRAR.", "CONVENCER.", "CONVERTIR."];
const LINES = ["Tenés algo que vale la pena mostrar.", "Hagamos que tus clientes descubran por qué elegirte.", "Que no solo te vean. Que te elijan."];
const CLOSE = "Diseño y desarrollo productos digitales pensados para mostrar lo mejor de tu negocio y convertir el interés en acción.";

const reduced = (page: Page) => page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
const tiny = (page: Page) => page.evaluate(() => matchMedia("(max-width: 359.98px), (max-height: 559.98px)").matches);

async function open(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toHaveAttribute("data-started", "");
  await scenesBuilt(page);
}

const pin = (page: Page) =>
  page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>("#propuesta [data-part=stage]")!;
    const holder = stage.parentElement!;
    return { top: Math.ceil(holder.getBoundingClientRect().top + window.scrollY), len: holder.offsetHeight - stage.offsetHeight, sticky: getComputedStyle(stage).position === "sticky" };
  });

/**
 * Jump onto a state's label. Under load the 1 px snap that settles the previous jump can start after
 * the document looked at rest and carry this jump back to the previous label (tests/e2e/scroll.ts):
 * the jump is repeated until the state is reached, then the snap is let finish before going on.
 */
async function toState(page: Page, s: keyof typeof AT) {
  const p = await pin(page);
  const y = Math.round(p.top + (AT[s] / UNITS) * p.len);
  const state = () => page.locator("#propuesta [data-part=stage]").getAttribute("data-state");
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
  await page.waitForTimeout(450);
  await settled(page);
  await expect(page.locator("#propuesta [data-part=stage]")).toHaveAttribute("data-state", s);
}

/** what the visitor sees of an element: its rect and its painted opacity */
const look = (page: Page, sel: string) =>
  page.evaluate((sel) => {
    const e = document.querySelector<HTMLElement>(sel)!;
    const r = e.getBoundingClientRect();
    let o = 1;
    for (let n: HTMLElement | null = e; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height, o, clip: getComputedStyle(e).clipPath };
  }, sel);

test.describe("place in the journey", () => {
  test("between the capabilities and the profile", async ({ page }) => {
    await open(page);
    // the home journey since THE SHIFT (docs/25): the worlds are their projects' cases
    const ids = await page.evaluate(() => [...new Set(Array.from(document.querySelectorAll<HTMLElement>("[data-section]")).map((e) => e.dataset.section))]);
    // «Una sola visión» between THE SHIFT and the capabilities since docs/27 §3
    expect(ids).toEqual(["inicio", "trabajo", "shift", "vision", "capacidades", "propuesta", "perfil", "contacto"]);
    await expect(page.locator("#propuesta h2")).toHaveText("MOSTRAR. CONVENCER. CONVERTIR.");
    await expect(page.locator("#propuesta h3")).toHaveText(TITLES);
  });
});

test.describe("the choreography (pinned, with motion)", () => {
  test("eight resting states in order, forward and back; each act lands its word and its line", async ({ page }) => {
    const problems = watchConsole(page);
    await open(page);
    test.skip((await reduced(page)) || (await tiny(page)), "static editorial page");
    const p = await pin(page);
    expect(p.sticky).toBe(true);
    const vh = page.viewportSize()!.height;
    // one gesture per state (60–80vh), the md cap at 450vh
    expect(p.len / vh).toBeGreaterThan(3.9);
    expect(p.len / vh).toBeLessThan(5.7);

    for (const s of STATES) await toState(page, s);

    // the last state: the running index holds the three words, the phrase and the conclusion are in
    for (const n of [1, 2, 3]) {
      const w = await look(page, `#propuesta [data-part=word][data-w="${n}"]`);
      expect(w.o).toBeGreaterThan(0.99);
      expect(w.top).toBeLessThan(vh * 0.25);
      expect(w.height).toBeLessThan(vh * 0.06);
    }
    const fin = await look(page, "#propuesta [data-part=final-in]");
    const mask = await look(page, "#propuesta [data-part=final-b]");
    expect(Math.abs(fin.top - mask.top)).toBeLessThan(2);
    expect((await look(page, "#propuesta [data-part=final-a]")).o).toBeGreaterThan(0.99);
    const close = await look(page, "#propuesta [data-part=close]");
    expect(close.o).toBeGreaterThan(0.99);
    // nothing of the final composition leaves the viewport
    for (const r of [fin, close, await look(page, "#propuesta [data-part=final-a]")]) {
      expect(r.left).toBeGreaterThanOrEqual(0);
      expect(r.right).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
      expect(r.bottom).toBeLessThanOrEqual(vh + 1);
    }

    // back, state by state
    for (const s of [...STATES].reverse()) await toState(page, s);
    // at the start again: nothing of the later acts shows
    expect((await look(page, '#propuesta [data-part=word][data-w="1"]')).clip).toMatch(/inset\(50%/);
    expect((await look(page, "#propuesta [data-part=close]")).o).toBe(0);

    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    expect(problems).toEqual([]);
  });

  test("each act's protagonist and line are shown in full at its state", async ({ page }) => {
    await open(page);
    test.skip((await reduced(page)) || (await tiny(page)), "static editorial page");
    const vw = page.viewportSize()!.width;
    for (const [s, n] of [["MOSTRAR", 1], ["CONVENCER", 2], ["CONVERTIR", 3]] as const) {
      await toState(page, s);
      const w = await look(page, `#propuesta [data-part=word][data-w="${n}"]`);
      expect(w.o).toBeGreaterThan(0.99);
      expect(w.left).toBeGreaterThanOrEqual(0);
      expect(w.right).toBeLessThanOrEqual(vw);
      if (n !== 2) expect(w.clip).toMatch(/none|inset\(0(px|%)?( 0(px|%)?)*\)/);
      if (n < 3) {
        const line = await look(page, `#propuesta [data-part=statement][data-l="${n}"]`);
        expect(line.o).toBeGreaterThan(0.99);
        expect(line.right).toBeLessThanOrEqual(vw);
      }
    }
    // act II: the six words rest in their grid; act III: the four actions on their track
    await toState(page, "CONVENCER");
    const cells = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("#propuesta [data-part=gw]")).map((e) => e.getBoundingClientRect().left));
    expect(new Set(cells.map((x) => Math.round(x))).size).toBeLessThanOrEqual(3);
    await toState(page, "ACCION");
    const actions = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("#propuesta [data-part=action]")).map((e) => Number(getComputedStyle(e).opacity)));
    expect(actions.every((o) => o > 0.99)).toBe(true);
  });

  test("no jump on the way in or out: the stage moves with the scroll at both ends of the pin", async ({ page }) => {
    await open(page);
    test.skip((await reduced(page)) || (await tiny(page)), "static editorial page");
    const p = await pin(page);
    const word = "#propuesta [data-part=fw]";
    await jump(page, p.top - 40);
    await settled(page);
    const before = await look(page, word);
    await jump(page, p.top);
    await settled(page);
    const at = await look(page, word);
    expect(Math.abs(at.top - (before.top - 40))).toBeLessThanOrEqual(1);
    expect(Math.abs(at.o - before.o)).toBeLessThan(0.01);

    await jump(page, p.top + p.len);
    await settled(page);
    const end = await look(page, "#propuesta [data-part=final-b]");
    await jump(page, p.top + p.len + 40);
    await settled(page);
    const after = await look(page, "#propuesta [data-part=final-b]");
    expect(Math.abs(after.top - (end.top - 40))).toBeLessThanOrEqual(1);
    expect(after.o).toBeGreaterThan(0.99);
  });

  test("the address follows the visitor: capacidades → propuesta → perfil, without history entries", async ({ page }) => {
    await open(page);
    test.skip(await tiny(page), "tiny viewports: covered by the static layout");
    const length = await page.evaluate(() => history.length);
    const p = await pin(page);
    await jump(page, p.top + Math.round(p.len / 2));
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#propuesta");
    await page.evaluate(() => document.getElementById("perfil")!.scrollIntoView({ behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#perfil");
    await page.evaluate(() => document.getElementById("capacidades")!.scrollIntoView({ behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#capacidades");
    expect(await page.evaluate(() => history.length)).toBe(length);
  });

  test("a reload inside the sequence returns to the same state (the scene builds on approach)", async ({ page }) => {
    await open(page);
    test.skip((await reduced(page)) || (await tiny(page)), "static editorial page");
    await toState(page, "CONVENCER");
    // the remembered position is written once scrolling settles (journey-nav)
    await page.waitForTimeout(500);
    const y = await page.evaluate(() => Math.round(window.scrollY));
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 8000 }).toBeGreaterThan(y - 3);
    expect(Math.abs((await page.evaluate(() => Math.round(window.scrollY))) - y)).toBeLessThanOrEqual(3);
    await expect(page.locator("#propuesta [data-part=stage]")).toHaveAttribute("data-state", "CONVENCER", { timeout: 8000 });
    await expect.poll(async () => (await look(page, "#propuesta [data-part=word][data-w=\"2\"] [data-part=word-in]")).top - (await look(page, "#propuesta [data-part=word][data-w=\"2\"]")).top, { timeout: 4000 }).toBeLessThan(2);
  });

  test("axe at the final state", async ({ page }) => {
    await open(page);
    test.skip((await reduced(page)) || (await tiny(page)), "static editorial page");
    await toState(page, "ELIJAN");
    const results = await new AxeBuilder({ page }).include("#propuesta").analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

test.describe("static editorial page", () => {
  test("reduced motion and tiny viewports: no pin, the three acts stacked and legible", async ({ page }) => {
    const problems = watchConsole(page);
    await open(page);
    test.skip(!(await reduced(page)) && !(await tiny(page)), "the pinned choreography");
    const p = await pin(page);
    expect(p.sticky).toBe(false);
    expect(p.len).toBe(0);
    let last = -Infinity;
    for (const sel of [".dec-word[data-w='1']", ".dec-line[data-l='1']", ".dec-word[data-w='2']", ".dec-line[data-l='2']", ".dec-word[data-w='3']", ".dec-final", "[data-part=close]"]) {
      const r = await look(page, `#propuesta ${sel}`);
      expect(r.o, sel).toBeGreaterThan(0.99);
      expect(r.clip, sel).toBe("none");
      // document order is reading order
      const y = r.top + (await page.evaluate(() => window.scrollY));
      expect(y, sel).toBeGreaterThan(last);
      last = y;
    }
    const results = await new AxeBuilder({ page }).include("#propuesta").analyze();
    expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    expect(problems).toEqual([]);
  });

  test("without JavaScript: every word of the declaration is in the document, in order", async ({ browser }, info) => {
    const ctx = await browser.newContext({ ...info.project.use, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/");
    const s = page.locator("#propuesta");
    await expect(s.locator("h3")).toHaveText(TITLES);
    await expect(s.locator(".dec-line")).toHaveText(LINES.slice(0, 2));
    await expect(s.locator(".dec-final")).toHaveText(LINES[2]);
    await expect(s.locator(".dec-close")).toHaveText(CLOSE);
    await expect(s.locator(".dec-fw")).toHaveCount(10);
    await expect(s.locator(".dec-gw")).toHaveCount(6);
    await expect(s.locator(".dec-action")).toHaveCount(4);
    for (const sel of [".dec-word", ".dec-line", ".dec-final-b", ".dec-close", ".dec-fw"]) {
      const o = await s.locator(sel).first().evaluate((e) => Number(getComputedStyle(e).opacity));
      expect(o, sel).toBe(1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await ctx.close();
  });
});
