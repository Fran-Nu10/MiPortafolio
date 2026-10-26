import { expect, test, type Page } from "@playwright/test";
import { watchConsole } from "./console";

/**
 * Phase 1 acceptance (Spec §26): no-JS page readable end to end · 0 console errors ·
 * 0 hydration warnings · CLS ≤ 0.02 · no horizontal overflow · routes · honest form.
 */

const ROUTES = ["/", "/trabajo/travelsuite360", "/trabajo/rayo-smash", "/trabajo/santi-nuca", "/trabajo/chef-arturo"];


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
        // against the configured viewport: mobile emulation widens innerWidth to fit overflowing content
        const width = page.viewportSize()!.width;
        const overflow = await page.evaluate((w) => document.documentElement.scrollWidth - w, width);
        expect(overflow, `horizontal overflow at y=${await page.evaluate(() => window.scrollY)}`).toBeLessThanOrEqual(0);
      });
      // posters never add an image preload (the hero's AVIF preloads are typed); Phase 11, WebKit "preloaded but not used"
      expect(await page.locator('link[rel="preload"][as="image"]:not([type="image/avif"])').count()).toBe(0);
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
      "Producto × Diseño × Ingeniería × Crecimiento",
      "Transforma ideas y negocios en productos digitales que destacan, funcionan y generan oportunidades.",
      "Proyectos que construí.",
      // THE SHIFT (docs/25): its four lines (its title is for screen readers since docs/27 §4)
      "Una idea no alcanza.",
      "De la idea al producto.",
      // «Una sola visión» (docs/27 §3)
      "Una sola visión.",
      "Entender el problema, el negocio y las oportunidades.",
      "Una sola dirección, desde la primera decisión hasta el producto funcionando.",
      // Servicios (docs/28 §1)
      "Lo que puedo crear para vos.",
      "Publicidad en Meta Ads",
      "Ahora, el tuyo.",
    ]) {
      await expect(page.getByText(text, { exact: true }).filter({ visible: true }).first(), text).toBeVisible();
    }
    await expect(page.getByRole("heading", { level: 2, name: "De la complejidad al producto." })).toBeAttached();
    // the four projects: each a card of the reel, each a real link to its case
    for (const slug of ["travelsuite360", "rayo-smash", "santi-nuca", "chef-arturo"]) await expect(page.locator(`#trabajo a[href="/trabajo/${slug}"]`).first()).toBeVisible();
  });

  test("every case is readable: its world, its proof, its credit", async ({ page }) => {
    for (const [slug, name, proof] of [
      ["travelsuite360", "TravelSuite360", "Producto real, en uso en tres agencias."],
      ["rayo-smash", "Rayo Smash", "Demo real, navegable."],
      ["santi-nuca", "Santi Nuca", "Sitio real, en línea."],
      ["chef-arturo", "Chef Arturo", "Tienda real, en línea."],
    ] as const) {
      await page.goto(`/trabajo/${slug}`);
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
      await expect(page.getByText(proof, { exact: true }).filter({ visible: true }).first(), proof).toBeVisible();
      if (slug === "santi-nuca") await expect(page.getByText("Fotografía · Santi Nuca", { exact: true }).filter({ visible: true }).first()).toBeVisible();
    }
  });

  test("the form posts and fails honestly when delivery fails", async ({ page }) => {
    await page.goto("/#contacto");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("Falta esto.").first()).toBeVisible();

    await page.getByLabel("Nombre").fill("Ana");
    await page.getByLabel("Email").fill("ana@example.com");
    // "[fail]": the mocked Resend answers 500 (tests/e2e/mock-resend.mjs)
    await page.getByLabel("¿Qué estamos construyendo?").fill("Una tienda para mi pastelería. [fail]");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.locator(".brief-route-error")).toHaveText("No se envió. Probá de nuevo.");
    await expect(page.getByText("Brief recibido.")).toHaveCount(0);
    // values are kept
    await expect(page.getByLabel("Nombre")).toHaveValue("Ana");
  });

  test("a project route without JS starts with its case: no jump needed", async ({ page }) => {
    await page.goto("/trabajo/chef-arturo");
    // the case is its own document (docs/25): its world is the first thing under the header
    const first = await page.evaluate(() => document.querySelector("main")!.firstElementChild!.id);
    expect(first).toBe("chef-arturo");
    await expect(page.getByRole("link", { name: /^Ir a / })).toHaveCount(0);
  });
});

test.describe("routes", () => {
  test("project routes carry their metadata and start at the world", async ({ page }) => {
    await page.goto("/trabajo/rayo-smash");
    await expect(page).toHaveTitle("Rayo Smash — Franco Núñez");
    // the case is its own document: its world at the top
    await expect
      .poll(async () =>
        page.evaluate(() => {
          // the case starts with its world at the top of its document (tiny viewports too)
          return Math.abs(document.getElementById("rayo-smash")!.getBoundingClientRect().top);
        }),
      )
      .toBeLessThan(4);
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
    await page.evaluate(() => document.getElementById("perfil")!.scrollIntoView({ behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#perfil");
    // THE SHIFT and the reel are the home itself: no anchor of their own in the address
    await page.evaluate(() => document.getElementById("shift")!.scrollIntoView({ behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => `${location.pathname}${location.hash}`)).toBe("/");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => page.evaluate(() => location.pathname)).toBe("/");
    await expect(page).toHaveTitle(/Franco Núñez/);
    expect(await page.evaluate(() => history.length)).toBe(before);
  });

  test("a reload while the scroll is still settling returns to where the page was, not to the last rest (docs/26 QA)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    // a rest at the contact (its position settles into the history entry), then straight up to THE SHIFT
    await page.evaluate(() => document.getElementById("contacto")!.scrollIntoView({ behavior: "instant" }));
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      const s = document.getElementById("shift")!;
      window.scrollTo({ top: Math.round(s.getBoundingClientRect().top + window.scrollY + innerHeight * 0.5), behavior: "instant" });
    });
    await page.waitForTimeout(50);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    await expect
      .poll(() => page.evaluate(() => { const r = document.getElementById("shift")!.getBoundingClientRect(); return r.top < innerHeight / 2 && r.bottom > innerHeight / 2; }))
      .toBe(true);
  });
});

test.describe("a failed bundle (Spec §24 / §27 \"block GSAP chunk only\", Phase 13)", () => {
  test("if an app chunk fails to load, the page falls back to the static, readable document", async ({ page }, info) => {
    test.skip(info.project.name !== "xl-1440" && info.project.name !== "sm-390", "twice");
    // the home and a case are two documents (docs/25): each may carry GSAP in its own chunk
    const gsapChunks: string[] = [];
    for (const route of ["/", "/trabajo/travelsuite360"]) {
      const html = await (await page.request.get(route)).text();
      const chunks = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map((m) => m[1]);
      for (const c of chunks) if ((await (await page.request.get(c)).text()).includes("ScrollTrigger")) gsapChunks.push(c);
    }
    expect(gsapChunks.length, "the chunk carrying GSAP").toBeGreaterThan(0);
    await page.route("**/*", (r) => (gsapChunks.some((c) => r.request().url().endsWith(c)) ? r.abort() : r.continue()));
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-js-failed", "");
    expect(await page.locator("html").getAttribute("class")).not.toMatch(/\bjs\b/);
    // THE SHIFT reads as its static page: the four lines and the finished interface
    await expect(page.locator("#shift .shift-line").filter({ visible: true })).toHaveCount(4);
    expect(await page.locator("#shift .sh-frame .sh-done").evaluate((e) => Number(getComputedStyle(e).opacity))).toBe(1);
    expect(await page.evaluate((w) => document.documentElement.scrollWidth - w, page.viewportSize()!.width)).toBeLessThanOrEqual(0);
    // a case: the world reads as its static composition, names and copy visible, no stacked layers
    await page.goto("/trabajo/travelsuite360", { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-js-failed", "");
    await expect(page.getByRole("heading", { level: 2, name: "TravelSuite360" })).toBeVisible();
    await expect(page.locator("#travelsuite360").getByText("Necesito viajar a Punta Cana en julio, somos cuatro.", { exact: true }).filter({ visible: true }).first()).toBeVisible();
    expect(await page.evaluate((w) => document.documentElement.scrollWidth - w, page.viewportSize()!.width)).toBeLessThanOrEqual(0);
  });
});

test.describe("unpublished media (Spec §23, Phase 12)", () => {
  test("TravelSuite360's unapproved captures are never served, directly or through the optimizer", async ({ request }, info) => {
    test.skip(info.project.name !== "xl-1440", "once");
    for (const f of ["travelsuite360-crm.png", "travelsuite360-travelchat.png", "travelsuite360-ai-assistant.png", "travelsuite360-reportes-financieros.png"]) {
      expect((await request.get(`/projects/travelsuite360/${f}`)).status(), f).toBe(404);
      expect((await request.get(`/_next/image?url=${encodeURIComponent(`/projects/travelsuite360/${f}`)}&w=640&q=75`)).status(), f).toBeGreaterThanOrEqual(400);
    }
    // the approved captures still are
    expect((await request.get("/projects/santi-nuca/santi-nuca-opening.png")).status()).toBe(200);
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
    await page.getByLabel("¿Qué estamos construyendo?").fill("Una tienda para mi pastelería. [fail]");
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
    // TravelSuite360: the unapproved ENSAMBLE captures are never published; only the signed-off film
    // (its poster is its frame 0, docs/26 §F2) may show
    expect(await page.locator('img[src*="projects/travelsuite360"], img[srcset*="projects/travelsuite360"]').count()).toBe(0);
  });
});
