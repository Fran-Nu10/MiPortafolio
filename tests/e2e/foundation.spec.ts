import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 1 acceptance (Spec §26): no-JS page readable end to end · 0 console errors ·
 * 0 hydration warnings · CLS ≤ 0.02 · no horizontal overflow · routes · honest form.
 */

const ROUTES = ["/", "/trabajo/travelsuite360", "/trabajo/rayo-smash", "/trabajo/santi-nuca", "/trabajo/chef-arturo"];

function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") problems.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

/** walk the whole document like a visitor would, sampling at each step */
async function scrollThrough(page: Page, each?: () => Promise<void>) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.max(300, Math.round((page.viewportSize()?.height ?? 800) * 0.75));
  for (let y = 0; y <= height; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(40);
    if (each) await each();
  }
}

test.describe("console, hydration, overflow, layout shift", () => {
  for (const route of ROUTES) {
    test(`${route} · no console errors or warnings, no horizontal overflow`, async ({ page }) => {
      const problems = watchConsole(page);
      await page.goto(route, { waitUntil: "networkidle" });
      await scrollThrough(page, async () => {
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `horizontal overflow at y=${await page.evaluate(() => window.scrollY)}`).toBeLessThanOrEqual(0);
      });
      expect(problems).toEqual([]);
    });
  }

  test("CLS ≤ 0.02 on / through a full scroll", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/", { waitUntil: "networkidle" });
    await scrollThrough(page);
    await page.waitForTimeout(300);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls).toBeLessThanOrEqual(0.02);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the whole journey is readable", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/\bjs\b/);
    await expect(page.getByRole("heading", { level: 1, name: "Franco Núñez" })).toBeAttached();
    for (const text of [
      "Producto × Diseño × Ingeniería",
      "Diseña y construye productos digitales, de la idea al sistema en producción.",
      "Cuatro productos.",
      "Producto real, en uso en tres agencias.",
      "Demo real, navegable.",
      "Sitio real, en línea.",
      "Tienda real, en línea.",
      "Fotografía · Santi Nuca",
      "Todo lo anterior pasó por las mismas manos.",
      "Publicidad en Meta Ads, orientada a ventas.",
      "Ahora, el tuyo.",
    ]) {
      await expect(page.getByText(text, { exact: true }).filter({ visible: true }).first(), text).toBeVisible();
    }
    for (const name of ["TravelSuite360", "Rayo Smash", "Santi Nuca", "Chef Arturo"]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
  });

  test("the form posts and fails honestly when delivery is not configured", async ({ page }) => {
    await page.goto("/#contacto");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("Falta esto.").first()).toBeVisible();

    await page.getByLabel("Nombre").fill("Ana");
    await page.getByLabel("Email").fill("ana@example.com");
    await page.getByLabel("¿Qué estamos construyendo?").fill("Una tienda para mi pastelería.");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.locator(".brief-route-error")).toHaveText("No se envió. Probá de nuevo.");
    await expect(page.getByText("Brief recibido.")).toHaveCount(0);
    // values are kept
    await expect(page.getByLabel("Nombre")).toHaveValue("Ana");
  });

  test("a project route without JS offers the in-page jump", async ({ page }) => {
    await page.goto("/trabajo/chef-arturo");
    await expect(page.getByRole("link", { name: "Ir a Chef Arturo" })).toBeVisible();
  });
});

test.describe("routes", () => {
  test("project routes carry their metadata and start at the world", async ({ page }) => {
    await page.goto("/trabajo/rayo-smash");
    await expect(page).toHaveTitle("Rayo Smash — Franco Núñez");
    await expect
      .poll(async () => page.evaluate(() => Math.abs(document.getElementById("rayo-smash")!.getBoundingClientRect().top)))
      .toBeLessThan(4);
    await expect(page.getByRole("link", { name: "Ir a Rayo Smash" })).toBeHidden();
  });

  test("unknown slug → 404 «No existe.»", async ({ page }) => {
    const res = await page.goto("/trabajo/nope");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "No existe." })).toBeVisible();
    await expect(page.getByRole("link", { name: "← Trabajo" })).toBeVisible();
  });

  test("scrolling replaces the URL without adding history entries", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const before = await page.evaluate(() => history.length);
    await page.evaluate(() => document.getElementById("santi-nuca")!.scrollIntoView({ behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => location.pathname)).toBe("/trabajo/santi-nuca");
    await expect(page).toHaveTitle("Santi Nuca — Franco Núñez");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => page.evaluate(() => location.pathname)).toBe("/");
    expect(await page.evaluate(() => history.length)).toBe(before);
  });
});

test.describe("with JavaScript", () => {
  test("the vertical wheel is never captured", async ({ page, isMobile }) => {
    test.skip(isMobile, "wheel is a desktop input");
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => document.getElementById("trabajo")!.scrollIntoView({ behavior: "instant" }));
    const y0 = await page.evaluate(() => window.scrollY);
    await page.mouse.move(400, 400);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y0 + 300);
  });

  test("client validation, focus on the first error, honest route error", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => document.getElementById("contacto")!.scrollIntoView({ behavior: "instant" }));
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("Falta esto.")).toHaveCount(3);
    await expect(page.getByLabel("Nombre")).toBeFocused();
    await expect(page.getByLabel("Nombre")).toHaveAttribute("aria-invalid", "true");

    await page.getByLabel("Nombre").fill("Ana");
    await page.getByLabel("Email").fill("ana@");
    await page.getByLabel("¿Qué estamos construyendo?").fill("Una tienda para mi pastelería.");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("Revisá el email.")).toBeVisible();

    await page.getByLabel("Email").fill("ana@example.com");
    // the timing check needs > 3 s between hydration and submit
    await page.waitForTimeout(3100);
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.locator(".brief-route-error")).toHaveText("No se envió. Probá de nuevo.");
    await expect(page.getByText("Brief recibido.")).toHaveCount(0);
    await expect(page.getByLabel("Nombre")).toHaveValue("Ana");
  });

  test("placeholders never carry imagery", async ({ page }) => {
    await page.goto("/");
    const inside = await page.locator("[data-placeholder] img, [data-placeholder] video").count();
    expect(inside).toBe(0);
    // TravelSuite360: no capture is published before the privacy sign-off
    expect(await page.locator('img[src*="travelsuite360"]').count()).toBe(0);
  });
});
