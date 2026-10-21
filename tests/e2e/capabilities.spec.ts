import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { watchConsole } from "./console";
import { settled, scenesBuilt } from "./scroll";
import { RAIL_ENTER_AT, SEAM_IN, SEAM_LEN } from "../../src/lib/capabilities-rail";

/**
 * Phase 9 acceptance (Spec §26): the rail pinned on lg/xl and stacked on md/sm · focus on an
 * off-screen card scrolls it into view · capability 06 renders the typographic variant ·
 * the profile copy matches the Content Master. Plus the seam, evidence lifecycle (loops only
 * in view, stills under reduced motion), the profile reveal, keyboard order, axe and no-JS.
 */

const CORE = "Diseño y desarrollo productos digitales donde la estrategia, la experiencia de usuario y la ingeniería trabajan con un mismo propósito: crear valor real para cada negocio.";
const BODY = ["Mi trabajo va más allá de construir una interfaz. Me involucro en cómo se presenta una marca, cómo interactúan sus clientes, cómo funcionan sus procesos y cómo convertir una idea en un producto digital sólido, escalable y preparado para crecer.", "Desde Uruguay, trabajo en proyectos de comercio electrónico, plataformas y sistemas de gestión, combinando criterio de producto, diseño y desarrollo con una visión comercial."];
const ADS_TITLE = "Un gran producto también necesita llegar a las personas correctas.";
const ADS = ["Me gusta pensar en todo el recorrido: desde la primera vez que alguien descubre un negocio hasta el momento en que decide consultar, reservar o comprar.", "Por eso, además de diseñar y desarrollar productos digitales, también trabajo con publicidad en Meta Ads. Campañas en Instagram y Facebook que ayudan a dar a conocer una marca, atraer personas interesadas y aprovechar mejor cada oportunidad.", "Porque una buena experiencia digital importa. Pero también importa que la gente llegue a descubrirla."];

const railTier = (page: Page) => {
  const v = page.viewportSize()!;
  return v.width >= 1024 && v.height >= 560;
};
const reduced = (page: Page) => page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);


async function open(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toHaveAttribute("data-started", "");
  await scenesBuilt(page);
}

/** the pin's span (holder minus stage): top of the section's pin and its scrollable length */
const pin = (page: Page) =>
  page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>("#capacidades [data-part=stage]")!;
    const holder = stage.parentElement!;
    return { top: holder.getBoundingClientRect().top + window.scrollY, len: holder.offsetHeight - stage.offsetHeight, rail: stage.hasAttribute("data-rail") };
  });

async function to(page: Page, fraction: number) {
  const p = await pin(page);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(p.top + fraction * p.len));
  await page.waitForTimeout(500);
}

const railX = (page: Page) =>
  page.evaluate(() => {
    const t = getComputedStyle(document.querySelector("#capacidades [data-part=rail]")!).transform;
    const m = t.match(/^matrix\(([^)]+)\)$/);
    return m ? Number(m[1].split(",")[4]) : 0;
  });

const cardRect = (page: Page, n: number) =>
  page.evaluate((n) => {
    const r = document.querySelector(`#capacidades [data-capability="${n}"]`)!.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
  }, n);

test.describe("the rail (Spec §12)", () => {
  test("lg/xl: the section pins; the seam holds its stretch (SEAM_LEN of a viewport); vertical scroll drives the rail horizontally to its end", async ({ page }, info) => {
    test.skip(!railTier(page), "the rail exists on lg/xl only");
    const problems = watchConsole(page);
    await open(page);
    if (await reduced(page)) {
      // reduced motion: the stacked list, no pin (Spec §16 alternative, docs/15 §7)
      const p = await pin(page);
      expect(p.rail).toBe(false);
      expect(p.len).toBe(0);
      return;
    }
    const p = await pin(page);
    expect(p.rail).toBe(true);
    const vh = page.viewportSize()!.height;
    expect(p.len / vh).toBeGreaterThan(2);
    expect(p.len / vh).toBeLessThan(3.5);

    // pin start: the seam is arriving, the kicker and the rail are not in yet
    await to(page, 0);
    await expect(page.locator("#capacidades [data-part=stage]")).toHaveAttribute("data-state", "SEAM");
    expect(await railX(page)).toBeGreaterThan(page.viewportSize()!.width * 0.9);
    // the seam holds between its arrival (SEAM_IN of a viewport) and the rail's entry (RAIL_ENTER_AT of the seam)
    await to(page, (((SEAM_IN + RAIL_ENTER_AT * SEAM_LEN) / 2) * vh) / p.len);
    const seamOf = () =>
      page.evaluate(() => {
        const el = document.querySelector<HTMLElement>("#capacidades [data-part=seam]")!;
        const r = el.getBoundingClientRect();
        return { opacity: Number(getComputedStyle(el).opacity), left: r.left, bottom: r.bottom };
      });
    // scrub 0.8: the playhead settles after the scroll
    await expect.poll(async () => (await seamOf()).opacity).toBe(1);
    const seam = await seamOf();
    expect(seam.left).toBeLessThan(page.viewportSize()!.width / 2);
    expect(seam.bottom).toBeLessThanOrEqual(vh);
    await expect(page.locator("#capacidades .seam-line")).toHaveText("Todo lo anterior pasó por las mismas manos.");
    await info.attach("seam", { body: await page.screenshot(), contentType: "image/png" });

    // the rail in: x = 0, the first card at the gutter; the kicker shown
    await to(page, (SEAM_LEN * vh) / p.len);
    await expect(page.locator("#capacidades [data-part=stage]")).toHaveAttribute("data-state", "RAIL");
    // scrub 0.8 and a pin rounded to whole vh: within a few pixels once the playhead settles
    await expect.poll(async () => Math.abs(await railX(page))).toBeLessThan(6);
    expect(Number(await page.locator("#capacidades [data-part=kicker]").evaluate((e) => getComputedStyle(e).opacity))).toBe(1);
    await expect(page.locator("#capacidades [data-part=kicker]")).toHaveText("Cinco cosas que se repiten en todos los productos. Y una sexta, después de publicar.");
    await info.attach("rail in", { body: await page.screenshot(), contentType: "image/png" });

    // 1:1: 300 px of scroll move the rail 300 px
    const x1 = await railX(page);
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: "instant" }));
    await page.waitForTimeout(600);
    expect(x1 - (await railX(page))).toBeCloseTo(300, -1);

    // the end: 06 fully visible, one gutter from the edge, after the 3× gap and its sub-kicker
    await to(page, 1);
    const vw = page.viewportSize()!.width;
    // the scrub settles after the jump: measure once the rail rests
    await expect.poll(async () => (await cardRect(page, 6)).right, { timeout: 4000 }).toBeLessThanOrEqual(vw);
    const six = await cardRect(page, 6);
    const five = await cardRect(page, 5);
    expect(six.right).toBeGreaterThan(vw - 64);
    expect(Math.abs(six.left - five.right - 96)).toBeLessThan(3);
    await expect(page.locator('#capacidades [data-capability="6"] .capability-sub')).toHaveText("Después de publicar");
    await info.attach("end", { body: await page.screenshot(), contentType: "image/png" });
    expect(problems).toEqual([]);
  });

  test("md/sm: no pin; seam, kicker and the six cards stacked in flow, 06 after the sub-kicker", async ({ page }) => {
    test.skip(railTier(page), "stacked layout is the tablet / phone form");
    await open(page);
    const p = await pin(page);
    expect(p.rail).toBe(false);
    expect(p.len).toBe(0);
    const tops = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("#capacidades [data-capability]")).map((c) => c.getBoundingClientRect().top + window.scrollY));
    for (let i = 1; i < tops.length; i++) expect(tops[i]).toBeGreaterThanOrEqual(tops[i - 1]);
    const seamTop = await page.evaluate(() => document.querySelector("#capacidades .seam")!.getBoundingClientRect().top + window.scrollY);
    expect(seamTop).toBeLessThan(tops[0]);
    await expect(page.locator('#capacidades [data-capability="6"] .capability-sub')).toHaveText("Después de publicar");
  });

  test("keyboard: focus on an off-screen card's link brings the card into view, centered", async ({ page }) => {
    test.skip(!railTier(page), "the rail exists on lg/xl only");
    await open(page);
    if (await reduced(page)) return;
    const p = await pin(page);
    await to(page, vhFraction(page, p));
    // card 05 (Rayo link) is off-screen to the right while the rail is at x = 0
    const before = await cardRect(page, 5);
    expect(before.left).toBeGreaterThan(page.viewportSize()!.width);
    await page.locator('#capacidades [data-capability="5"] a').focus();
    // a smooth scroll: wait for the card to settle at the viewport's center
    await expect
      .poll(async () => {
        const r = await cardRect(page, 5);
        return Math.abs((r.left + r.right) / 2 - page.viewportSize()!.width / 2);
      }, { timeout: 4000 })
      .toBeLessThan(24);
    const r = await cardRect(page, 5);
    expect(r.left).toBeGreaterThanOrEqual(0);
    expect(r.right).toBeLessThanOrEqual(page.viewportSize()!.width);
    await expect(page.locator('#capacidades [data-capability="5"] a')).toBeFocused();
    // Tab order follows the list: next is 06's content (no link) → the profile's links or the form
    await page.keyboard.press("Tab");
    const next = await page.evaluate(() => document.activeElement?.closest("section")?.id);
    expect(["capacidades", "perfil", "contacto"]).toContain(next);
  });
});

function vhFraction(page: Page, p: { len: number }) {
  return (SEAM_LEN * page.viewportSize()!.height) / p.len;
}

test.describe("evidence", () => {
  test("06 is typographic: statement at lead size, the mono tag «Meta Ads», no image, no numbers", async ({ page }) => {
    await open(page);
    const six = page.locator('#capacidades [data-capability="6"]');
    await expect(six).toHaveAttribute("data-evidence", "typographic");
    await expect(six.locator("h3")).toHaveText("Adquisición de clientes");
    await expect(six.locator(".capability-statement")).toHaveText("Publicidad en Meta Ads, orientada a ventas.");
    await expect(six.locator(".capability-attr")).toHaveText("Meta Ads");
    expect(await six.locator("img, video, [data-placeholder]").count()).toBe(0);
    expect(await six.innerText()).not.toMatch(/\d/);
    // and the section carries none of the banned terms
    expect(await page.locator("#capacidades").innerText()).not.toMatch(/ROAS|CPA|CPL|CTR|Google Ads|TikTok|growth|full-stack|end-to-end/i);
  });

  test("the five live elements show the worlds' own copy and material; loops run only in view (stills under reduced motion)", async ({ page }) => {
    await open(page);
    const rm = await reduced(page);
    const els = page.locator("#capacidades [data-evidence-el]");
    await expect(els).toHaveCount(5);
    expect(await els.evaluateAll((l) => l.map((e) => (e as HTMLElement).dataset.evidenceEl))).toEqual(["ts-flow", "posters", "chef-commerce", "ts-extraction", "rayo-layers"]);
    // inside aria-hidden evidence boxes, never focusable
    expect(await page.locator("#capacidades .capability-evidence a, #capacidades .capability-evidence button, #capacidades .capability-evidence [tabindex]").count()).toBe(0);
    await expect(page.locator('[data-evidence-el="ts-flow"] .ev-ts-msg')).toHaveText("Necesito viajar a Punta Cana en julio, somos cuatro.");
    await expect(page.locator('[data-evidence-el="ts-flow"] .ev-ts-res')).toHaveText("reserva confirmada");
    await expect(page.locator('[data-evidence-el="chef-commerce"] .ev-chef-btn')).toHaveText("Agregar al carrito");
    expect(await page.locator('[data-evidence-el="posters"] .ev-poster').count()).toBe(3);
    expect(await page.locator('[data-evidence-el="posters"] [data-placeholder]').count()).toBe(0);
    expect(await page.locator('[data-evidence-el="rayo-layers"] .ev-rayo-layer img').count()).toBe(6);

    // far from the section: nothing runs
    expect(await page.locator("#capacidades [data-running]").count()).toBe(0);
    const p = await pin(page);
    if (rm) {
      // final states as stills, no loop
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), p.top);
      await page.waitForTimeout(400);
      expect(await els.evaluateAll((l) => l.map((e) => (e as HTMLElement).dataset.step))).toEqual(["2", "2", "2", "3", "1"]);
      expect(await page.locator("#capacidades [data-running]").count()).toBe(0);
      return;
    }
    // the first card in view: its loop runs and advances
    if (p.rail) await to(page, (SEAM_LEN * page.viewportSize()!.height) / p.len + 0.02);
    else await page.locator('#capacidades [data-capability="1"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-evidence-el="ts-flow"]')).toHaveAttribute("data-running", "");
    const step = await page.locator('[data-evidence-el="ts-flow"]').getAttribute("data-step");
    await expect.poll(() => page.locator('[data-evidence-el="ts-flow"]').getAttribute("data-step"), { timeout: 3000 }).not.toBe(step);
    // the last card is out of view: its loop is idle
    const six = await cardRect(page, 5);
    if (six.left > page.viewportSize()!.width || six.top > page.viewportSize()!.height) {
      await expect(page.locator('[data-evidence-el="rayo-layers"]')).not.toHaveAttribute("data-running", "");
    }
    // leaving the section stops everything
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect.poll(() => page.locator("#capacidades [data-running]").count()).toBe(0);
  });

  test("on the rail, 05's layers separate with the scroll itself", async ({ page }) => {
    test.skip(!railTier(page), "scroll-tied separation is a rail behaviour");
    await open(page);
    if (await reduced(page)) return;
    const sep = () => page.locator('[data-evidence-el="rayo-layers"]').evaluate((e) => Number(getComputedStyle(e).getPropertyValue("--sep")) || 0);
    await to(page, 0.4);
    const a = await sep();
    await to(page, 1);
    const b = await sep();
    expect(b).toBeGreaterThan(a);
    expect(b).toBeCloseTo(1, 1);
    await expect(page.locator('[data-evidence-el="rayo-layers"]')).toHaveAttribute("data-scrub", "");
  });
});

test.describe("profile (Spec §12, Content Master 13)", () => {
  test("the copy is exact; no photo, no title beyond «Perfil»; pending stack and contacts are absent", async ({ page }) => {
    await open(page);
    const s = page.locator("#perfil");
    await expect(s.locator("h2")).toHaveText("Perfil");
    await expect(s.locator(".profile-core")).toHaveText(CORE);
    await expect(s.locator(".profile-detail p")).toHaveText(BODY);
    // Meta Ads has a space of its own: a headline, three paragraphs, and the term in emphasis
    await expect(s.locator("h3")).toHaveText(ADS_TITLE);
    await expect(s.locator(".profile-ads-body p")).toHaveText(ADS);
    await expect(s.locator(".profile-ads-em")).toHaveText("Meta Ads");
    expect(await s.locator("img, video, [data-placeholder]").count()).toBe(0);
    expect(await s.locator(".profile-meta").count()).toBe(0);
    expect(await s.innerText()).not.toMatch(/fundador|solo\b|por mi cuenta|CONFIRMAR|hola@|TravelSuite|agencias de viaje/i);
  });

  test("hierarchy: the declaration is larger than the explanation, which is larger than nothing it replaced; Meta Ads sits below, set off by a rule", async ({ page }) => {
    await open(page);
    const s = page.locator("#perfil");
    const size = (sel: string) => s.locator(sel).first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    const core = await size(".profile-core");
    const detail = await size(".profile-detail p");
    const adsTitle = await size(".profile-ads-title");
    const adsBody = await size(".profile-ads-body p");
    expect(core).toBeGreaterThan(detail * 1.35);
    expect(adsTitle).toBeGreaterThan(adsBody * 1.3);
    expect(core).toBeGreaterThanOrEqual(adsTitle);
    // order down the page: declaration → explanation → Meta Ads
    const tops = await s.evaluate((root) => [".profile-core", ".profile-detail", ".profile-ads"].map((q) => root.querySelector(q)!.getBoundingClientRect().top + window.scrollY));
    expect(tops[0]).toBeLessThan(tops[1]);
    expect(tops[1]).toBeLessThan(tops[2]);
    expect(await s.locator(".profile-ads").evaluate((e) => getComputedStyle(e).borderTopWidth)).toBe("1px");
    // the emphasis is heavier than the text around it, never a link or an image
    const em = await s.locator(".profile-ads-em").evaluate((e) => ({ w: Number(getComputedStyle(e).fontWeight), p: Number(getComputedStyle(e.parentElement!).fontWeight), tag: e.tagName }));
    expect(em.w).toBeGreaterThan(em.p);
    expect(em.tag).toBe("STRONG");
    // the sixth capability's rail card is not duplicated here: the profile adds the human side only
    expect(await s.innerText()).not.toContain("orientada a ventas");
  });

  test("one reveal on entry: blocks clipped until the section reaches 75% of the viewport, then shown whole; none under reduced motion", async ({ page }) => {
    await open(page);
    const s = page.locator("#perfil");
    if (await reduced(page)) {
      expect(await s.getAttribute("data-reveal")).toBeNull();
      return;
    }
    await expect(s).toHaveAttribute("data-reveal", "pending");
    const ads = page.locator("#perfil .profile-ads");
    await expect(ads).toHaveAttribute("data-reveal", "pending");
    const clipped = await s.locator(".profile-core").evaluate((e) => getComputedStyle(e).clipPath);
    expect(clipped).toMatch(/inset\(0(px)? 0(px)? 100%( 0(px)?)?\)/);
    await page.evaluate(() => {
      const r = document.getElementById("perfil")!.getBoundingClientRect();
      window.scrollTo({ top: r.top + window.scrollY - window.innerHeight * 0.6, behavior: "instant" });
    });
    await expect(s).toHaveAttribute("data-reveal", "shown");
    await expect.poll(() => s.locator(".profile-core").evaluate((e) => getComputedStyle(e).clipPath), { timeout: 3000 }).toMatch(/none|inset\(0(px|%)?( 0(px|%)?)*\)/);
    // the text was never removed from the tree
    await expect(s.locator(".profile-core")).toHaveText(CORE);
    // Meta Ads waits for the visitor: still clipped while it is far below, then revealed once on its own
    await expect(ads).toHaveAttribute("data-reveal", "pending");
    expect(await ads.locator(".profile-ads-title").evaluate((e) => getComputedStyle(e).clipPath)).toMatch(/inset\(0(px)? 0(px)? 100%( 0(px)?)?\)/);
    await page.evaluate(() => {
      const r = document.querySelector("#perfil .profile-ads")!.getBoundingClientRect();
      window.scrollTo({ top: r.top + window.scrollY - window.innerHeight * 0.6, behavior: "instant" });
    });
    await expect(ads).toHaveAttribute("data-reveal", "shown");
    await expect.poll(() => ads.locator(".profile-ads-title").evaluate((e) => getComputedStyle(e).clipPath), { timeout: 3000 }).toMatch(/none|inset\(0(px|%)?( 0(px|%)?)*\)/);
    await expect(ads.locator(".profile-ads-body p")).toHaveText(ADS);
  });
});

test.describe("accessibility", () => {
  test("axe on the rail and the profile; every attribution link reaches its world; headings in order", async ({ page }) => {
    await open(page);
    const p = await pin(page);
    if (p.rail && !(await reduced(page))) await to(page, (SEAM_LEN * page.viewportSize()!.height) / p.len + 0.05);
    else await page.locator("#capacidades").scrollIntoViewIfNeeded();
    const results = await new AxeBuilder({ page }).include("#capacidades").include("#perfil").analyze();
    expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
    const links = await page.locator("#capacidades .capability-attr[href]").evaluateAll((l) => l.map((a) => (a as HTMLAnchorElement).getAttribute("href")));
    expect(links).toEqual(["/trabajo/travelsuite360", "/trabajo/chef-arturo", "/trabajo/rayo-smash"]);
    expect(await page.locator("#capacidades h2").innerText()).toBe("Capacidades");
    expect(await page.locator("#capacidades h3").allInnerTexts()).toEqual(["Producto", "Ingeniería web", "Comercio digital", "IA + automatización", "Experiencias interactivas", "Adquisición de clientes"]);
  });

  test("an attribution link enters its world in place (pushState, no reload)", async ({ page }) => {
    await open(page);
    // on the rail the card travels with the scroll: bring it in through the rail's own focus rule
    // (it centers the card), let the document rest, then click — a click while the rail still
    // moves (scrub 0.8 s) can miss under load
    const link = page.locator('#capacidades [data-capability="3"] a');
    await link.scrollIntoViewIfNeeded();
    await link.focus();
    await settled(page);
    // activated from the keyboard: a pointer click on a card the rail is still carrying can land on
    // its neighbour (Playwright re-scrolls the target before clicking, which moves the rail)
    await link.press("Enter");
    await expect.poll(() => page.evaluate(() => location.pathname)).toBe("/trabajo/chef-arturo");
    await expect(page.locator("main")).toHaveAttribute("data-started", "");
    const v = page.viewportSize()!;
    // tiny viewports (320×568) show the world as a static section: no states to leave
    if (v.width >= 360 && v.height >= 560) await expect.poll(() => page.locator("#chef-arturo").getAttribute("data-state"), { timeout: 5000 }).not.toBe("SCREEN");
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the seam, the kicker, the six capabilities and the profile read in order", async ({ page }) => {
    await page.goto("/");
    // textContent: the mono labels are uppercased by CSS
    const text = (await page.locator("#capacidades").textContent()) ?? "";
    const order = ["Todo lo anterior pasó por las mismas manos.", "Cinco cosas que se repiten", "Producto", "Ingeniería web", "Comercio digital", "IA + automatización", "Experiencias interactivas", "Después de publicar", "Adquisición de clientes", "Meta Ads"];
    let at = -1;
    for (const o of order) {
      const i = text.indexOf(o, at + 1);
      expect(i, o).toBeGreaterThan(at);
      at = i;
    }
    await expect(page.locator("#perfil .profile-core")).toHaveText(CORE);
    expect(await page.locator("#perfil .profile-core").evaluate((e) => getComputedStyle(e).clipPath)).toBe("none");
    // no pin without JS: the stage is in flow
    expect(await page.locator("#capacidades [data-part=stage]").evaluate((e) => getComputedStyle(e).position)).toBe("static");
  });
});
