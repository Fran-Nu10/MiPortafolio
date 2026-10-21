import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { watchConsole } from "./console";
import { jump } from "./scroll";

/**
 * Phase 5 acceptance (Spec §26): every TS state matches §08 at 1440×900 (one screenshot per
 * label, attached) · no Math.random at runtime (unit) · 3D only on lg/xl · the reduced-motion
 * sequence is complete. Plus phones, reversal, the sr-only summary, no-JS. The TS12 red seam led
 * into Rayo's world in the same document; since THE SHIFT (docs/25) the case ends on its proof and
 * its links, so the seam is not drawn.
 * (Frame rate is measured separately, in a real browser: docs/11 §5.)
 */

const U = 7.5;
const U_RM = 6;

const tiny = (page: Page) => {
  const v = page.viewportSize()!;
  return v.width < 360 || v.height < 560;
};
/** translateZ of a computed transform (matrix3d m43), 0 for a 2D matrix */
const z = (t: string) => (t.startsWith("matrix3d(") ? Number(t.slice(9, -1).split(",")[14]) : 0);
const state = (page: Page) => page.locator("#travelsuite360").getAttribute("data-state");


async function open(page: Page) {
  await page.goto("/trabajo/travelsuite360", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toHaveAttribute("data-started", "");
}

/** scroll to timeline time t of the TS pin (whole pixels) */
async function to(page: Page, t: number, units = U) {
  const y = await page.evaluate(
    ([t, units]) => {
      const stage = document.querySelector<HTMLElement>('#travelsuite360 [data-part="stage"]')!;
      const holder = stage.parentElement!;
      const top = holder.getBoundingClientRect().top + window.scrollY;
      return Math.round(top + (t / units) * (holder.offsetHeight - stage.offsetHeight));
    },
    [t, units] as const,
  );
  await jump(page, y);
}

/** a part of the TS world: opacity, rect, transform and clip */
const part = (page: Page, name: string) =>
  page.evaluate((name) => {
    const el = document.querySelector<HTMLElement>(`#travelsuite360 [data-part="${name}"]`)!;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { opacity: Number(cs.opacity), visibility: cs.visibility, x: r.x, y: r.y, w: r.width, h: r.height, transform: cs.transform, clip: cs.clipPath };
  }, name);

/** the space's top-left and scale, to compare with design coordinates */
const space = (page: Page) =>
  page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = document.querySelector<HTMLElement>('#travelsuite360 [data-part="stage"]')!.clientHeight;
    const [w, h] = vw < 768 ? [390, 844] : [1440, 900];
    const s = Math.min(vw / w, vh / h);
    return { x: (vw - w * s) / 2, y: (vh - h * s) / 2, s };
  });

async function shot(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot(), contentType: "image/png" });
}

test.describe("TS00–TS12 at the reference viewport", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.skip(({ browserName }) => browserName !== "chromium");

  test("every state in order, with its composition (Spec §08)", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440", "the reference viewport, once");
    const problems = watchConsole(page);
    await open(page);
    const sp = await space(page);
    expect(await state(page)).toBe("SCREEN");
    await shot(page, "TS00 SCREEN");

    await to(page, 1);
    await expect.poll(() => state(page)).toBe("ISOLATE");
    await shot(page, "TS00b ISOLATE");

    await to(page, 2);
    await expect.poll(() => state(page)).toBe("TS01");
    await expect.poll(async () => (await part(page, "msg")).opacity).toBe(1);
    expect((await part(page, "object")).visibility).toBe("hidden");
    const msg = await part(page, "msg");
    // the handoff: the escaping object (hidden at TS01, still at its final pose) and the
    // sentence that takes over are the same rectangle
    const object = await page.evaluate(() => {
      const r = document.querySelector('#travelsuite360 [data-part="object"] p')!.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    for (const k of ["x", "y", "w", "h"] as const) expect(Math.abs(msg[k] - object[k]), `handoff ${k}`).toBeLessThan(1.5);
    expect(Math.abs(msg.x - (sp.x + 160 * sp.s))).toBeLessThan(2);
    expect(Math.abs(msg.y + msg.h / 2 - (sp.y + 450 * sp.s))).toBeLessThan(3);
    await shot(page, "TS01 RAW");

    await to(page, 3);
    await expect.poll(() => state(page)).toBe("TS03");
    await expect.poll(async () => (await part(page, "f-dest")).opacity).toBe(1);
    expect((await part(page, "f-date")).opacity).toBeCloseTo(0.85, 2);
    expect((await part(page, "f-pax")).opacity).toBeCloseTo(0.6, 2);
    // depth is translateZ: the fields carry 3D matrices, the camera leans in by +200
    expect((await part(page, "f-pax")).transform).toMatch(/^matrix3d/);
    expect(z((await part(page, "camera")).transform)).toBeCloseTo(200, 0);
    expect((await part(page, "msg")).opacity).toBeCloseTo(0.45, 2);
    await shot(page, "TS03 FIELDS");

    await to(page, 4);
    await expect.poll(() => state(page)).toBe("TS04");
    await expect.poll(async () => (await part(page, "q1")).opacity).toBe(1);
    expect((await part(page, "q2")).opacity).toBeCloseTo(0.4, 2);
    expect(z((await part(page, "camera")).transform)).toBeCloseTo(0, 0);
    await shot(page, "TS04 QUOTE");

    await to(page, 4.6);
    await expect.poll(() => state(page)).toBe("TS05");
    await expect.poll(async () => (await part(page, "q2")).opacity).toBe(0);
    await expect.poll(async () => (await part(page, "tag")).clip).toMatch(/inset\(0(px|%)?\)|inset\(0% 0% 0% 0%\)/);
    await shot(page, "TS05 SELECTED");

    await to(page, 5.1);
    await expect.poll(() => state(page)).toBe("TS06");
    await expect.poll(async () => (await part(page, "trip")).opacity).toBe(1);
    const trip = await part(page, "trip");
    expect(Math.abs(trip.x - (sp.x + 760 * sp.s))).toBeLessThan(3);
    await shot(page, "TS06 TRIP");
    // TS07 → TS08, automatic: the signal crosses the bar and leaves; the report marks itself
    await expect.poll(async () => (await part(page, "report")).opacity, { timeout: 4000 }).toBe(1);
    await expect.poll(async () => (await part(page, "signal")).opacity).toBe(0);
    expect((await part(page, "res-text")).opacity).toBe(1);
    await shot(page, "TS07–08 RESERVATION · REPORT");

    // TS09: the camera retreats; the fragments were there all along
    await to(page, 5.1 + 1.6 * Math.cbrt(3 / 8));
    await expect.poll(() => state(page)).toBe("TS09a");
    await expect.poll(async () => z((await part(page, "camera")).transform)).toBeCloseTo(-300, -1);
    expect(await page.locator("#travelsuite360 .ts-frag").count()).toBe(64);
    await shot(page, "TS09a");
    await to(page, 6.7);
    await expect.poll(() => state(page)).toBe("TS09b");
    await expect.poll(async () => z((await part(page, "camera")).transform)).toBeCloseTo(-800, 0);
    // the followed trip at perceived .7, centered
    const far = await part(page, "trip");
    expect(far.w / (600 * sp.s)).toBeCloseTo(0.7, 1);
    expect(Math.abs(far.x + far.w / 2 - 720 * sp.s - sp.x)).toBeLessThan(4);
    await shot(page, "TS09b");

    // TS10, automatic: the drift stops, the name comes up, the fragments halve
    await expect.poll(async () => (await part(page, "name-title")).clip, { timeout: 5000 }).toMatch(/inset\(0(px|%)?\)|inset\(0% 0% 0% 0%\)/);
    await expect.poll(async () => Number(await page.locator('#travelsuite360 [data-part="drift"]').first().evaluate((d) => getComputedStyle(d).opacity))).toBeCloseTo(0.5, 2);
    await shot(page, "TS10 NAME");

    // TS11 · the proof in flow; the case ends there: its links, no red seam over them (docs/25)
    const proof = page.locator('[data-proof="travelsuite360"]');
    await proof.scrollIntoViewIfNeeded();
    await expect(proof.getByText("Producto real, en uso en tres agencias.")).toBeVisible();
    await expect(proof.getByText("Socio · Producto e ingeniería")).toBeVisible();
    await shot(page, "TS11 PROOF");
    await expect(page.locator('[data-part="seam"]')).toHaveCount(0);
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    await expect(proof.getByRole("link", { name: "← Trabajo" })).toBeInViewport();
    await shot(page, "TS11 END OF THE CASE");
    expect(problems).toEqual([]);
  });

  test("scrolling back undoes every state", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440", "the reference viewport, once");
    await open(page);
    await to(page, 6.7);
    await expect.poll(async () => (await part(page, "name-title")).clip, { timeout: 5000 }).toMatch(/inset\(0/);
    await to(page, 3);
    await expect.poll(() => state(page)).toBe("TS03");
    await expect.poll(async () => (await part(page, "name-title")).clip).toMatch(/100%/);
    // the scrubbed playhead eases back to the label: wait for it to arrive
    await expect.poll(async () => (await part(page, "trip")).opacity).toBe(0);
    await expect.poll(async () => (await part(page, "q1")).opacity).toBe(0);
    await expect.poll(async () => (await part(page, "f-dest")).opacity).toBe(1);
    await to(page, 2);
    await expect.poll(() => state(page)).toBe("TS01");
    await expect.poll(async () => (await part(page, "f-dest")).opacity).toBe(0);
    expect((await part(page, "msg")).opacity).toBe(1);
    await to(page, 0);
    await expect.poll(() => state(page)).toBe("SCREEN");
    await expect.poll(async () => (await part(page, "msg")).opacity).toBe(0);
  });
});

test.describe("tiers", () => {
  test("3D only on lg/xl: md, phones and reduced motion draw the depth in 2D", async ({ page }, info) => {
    test.skip(tiny(page), "tiny viewports read the world as text");
    await open(page);
    const w = page.viewportSize()!.width;
    await to(page, 6.7);
    await expect.poll(() => state(page)).toBe("TS09b");
    const threeD = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("#travelsuite360 .ts-layer *")).filter((el) => getComputedStyle(el).transform.startsWith("matrix3d")).length,
    );
    const persp = await page.evaluate(() => getComputedStyle(document.querySelector('#travelsuite360 [data-part="persp"]')!).perspective);
    const frags = await page.locator("#travelsuite360 .ts-frag").count();
    const rm = info.project.use.reducedMotion === "reduce";
    if (w >= 1024 && !rm) {
      expect(threeD).toBeGreaterThan(0);
      expect(persp).toBe("1400px");
      expect(frags).toBe(64);
    } else {
      expect(threeD).toBe(0);
      expect(persp).toBe("none");
      // reduced motion on lg/xl keeps all 64, flattened; tablets and phones draw 32
      expect(frags).toBe(w >= 1024 ? 64 : 32);
    }
  });

  test("phones: the sm column of §08 and no drift", async ({ page, isMobile }) => {
    test.skip(!isMobile || tiny(page), "phones");
    await open(page);
    const sp = await space(page);
    await to(page, 3);
    await expect.poll(() => state(page)).toBe("TS03");
    await expect.poll(async () => (await part(page, "f-pax")).opacity).toBeCloseTo(0.6, 2);
    for (const [k, y] of [["f-dest", 120], ["f-date", 200], ["f-pax", 280]] as const) {
      const f = await part(page, k);
      expect(Math.abs(f.x - (sp.x + 24 * sp.s)), k).toBeLessThan(2);
      expect(Math.abs(f.y - (sp.y + y * sp.s)), k).toBeLessThan(2);
    }
    await to(page, 6.7);
    await expect.poll(() => state(page)).toBe("TS09b");
    await expect.poll(async () => (await part(page, "name-title")).clip, { timeout: 5000 }).toMatch(/inset\(0/);
    const drift = await page.locator('#travelsuite360 [data-part="drift"]').first().evaluate((d) => getComputedStyle(d).transform);
    expect(drift === "none" || drift === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
  });

  test("tiny viewports read the world as text", async ({ page }) => {
    test.skip(!tiny(page), "tiny only");
    await open(page);
    await expect(page.locator("#travelsuite360 .world-copy")).toBeVisible();
    await expect(page.locator("#travelsuite360 .ts-layer")).toBeHidden();
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the full sequence, as cuts: no travel between states", async ({ page }) => {
    test.skip(tiny(page), "tiny viewports read the world as text");
    await open(page);
    const steps: [number, string][] = [
      [0.5, "TS01"],
      [1.5, "TS03"],
      [2.5, "TS04"],
      [3.1, "TS05"],
      [3.6, "TS06"],
      [5.2, "TS09b"],
    ];
    for (const [t, name] of steps) {
      await to(page, t, U_RM);
      await expect.poll(() => state(page)).toBe(name);
      // a cut: two looks 150 ms apart are the same picture
      const a = await part(page, "trip");
      await page.waitForTimeout(150);
      const b = await part(page, "trip");
      expect([b.x, b.y, b.opacity]).toEqual([a.x, a.y, a.opacity]);
    }
    // the signal is shown at the bar's end, not travelling; the name is there
    expect((await part(page, "signal")).opacity).toBe(1);
    expect((await part(page, "report")).opacity).toBe(1);
    await expect.poll(async () => (await part(page, "name-title")).clip).toMatch(/inset\(0/);
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('#travelsuite360 [data-part="persp"]')!).perspective)).toBe("none");
    // the case ends on its proof: no seam (docs/25)
    await expect(page.locator('[data-part="seam"]')).toHaveCount(0);
  });
});

test.describe("accessibility", () => {
  test("the states are summarized once; every sentence is in the tree once", async ({ page }) => {
    test.skip(tiny(page), "tiny viewports read the copy list instead");
    await open(page);
    const summary = page.locator("#travelsuite360 ol.world-summary li");
    await expect(summary).toHaveCount(5);
    await expect(summary.first()).toHaveText("mensaje recibido");
    await expect(page.locator("#travelsuite360 > .world-copy")).toBeHidden();
    const exposed = await page.evaluate(() => {
      const visibleToAT = (el: Element) => !el.closest('[aria-hidden="true"]') && getComputedStyle(el).display !== "none" && !el.closest(".world-copy");
      const texts = ["Necesito viajar a Punta Cana en julio, somos cuatro.", "Una agencia entera, operando.", "interpretado", "reserva confirmada"];
      return texts.map((t) => Array.from(document.querySelectorAll("#travelsuite360 p")).filter((p) => p.textContent?.trim() === t && visibleToAT(p)).length);
    });
    // message and close line once; the visual-only labels are summarized instead
    expect(exposed).toEqual([1, 1, 0, 0]);
    await expect(page.locator("#travelsuite360").getByRole("heading", { level: 2, name: "TravelSuite360" })).toHaveCount(1);
  });

  test("axe: no serious or critical violations at TS10", async ({ page }) => {
    test.skip(tiny(page), "tiny viewports read the copy list instead");
    await open(page);
    await to(page, 6.7);
    await page.waitForTimeout(2200);
    // the 64 fragments are decorative (aria-hidden, no information; Spec §19 "TS fragments excluded"):
    // axe still measures the contrast of their visible text (WebKit rendered them lighter)
    const results = await new AxeBuilder({ page }).include("#travelsuite360").exclude("#travelsuite360 .ts-frag").analyze();
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  });

  test("the fragments exist only near the world", async ({ page }) => {
    test.skip(tiny(page), "tiny viewports read the copy list instead");
    await page.goto("/", { waitUntil: "networkidle" });
    expect(await page.locator("#travelsuite360 .ts-frag").count()).toBe(0);
    await open(page);
    await expect.poll(() => page.locator("#travelsuite360 .ts-frag").count()).toBeGreaterThan(0);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the world reads as its copy; the scene and its summary stay out", async ({ page }) => {
    await page.goto("/trabajo/travelsuite360");
    const world = page.locator("#travelsuite360");
    const copy = world.locator(".world-copy");
    await expect(copy.getByText("Necesito viajar a Punta Cana en julio, somos cuatro.")).toBeVisible();
    await expect(copy.getByText("Una agencia entera, operando.")).toBeVisible();
    await expect(world.getByText("Necesito viajar a Punta Cana en julio, somos cuatro.", { exact: true }).filter({ visible: true })).toHaveCount(1);
    await expect(world.locator(".ts-layer")).toBeHidden();
    await expect(world.locator("ol.world-summary")).toBeHidden();
    expect(await world.locator(".ts-frag").count()).toBe(0);
  });
});
