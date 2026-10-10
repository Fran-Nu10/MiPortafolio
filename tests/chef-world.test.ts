/**
 * Phase 8 units: Chef Arturo world (Spec §11) — the provisional photographs and their check,
 * the factual guards (role, proof line, payments, brand / photography not attributed), the
 * compositions per variant, the copy split and the time budget.
 */
import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getProject } from "@/data/projects";
import { CHEF_ANCHOR, CHEF_CREAM, CHEF_PHOTOS } from "@/data/chef-photos.ts";
import { getContract, resolveAsset } from "@/lib/assets";
import { CHEF_PAYMENTS_PROOF, proofCaption } from "@/lib/content";
import {
  C04_STAGGER,
  C06_STAGGER,
  C07_DIM,
  C_T,
  CHEF_UNITS,
  CHEF_UNITS_RM,
  catalog,
  chefVariant,
  field,
  fit,
  macro,
  product,
  splitCatalogLine,
  splitProductLine,
  splitPurchaseLine,
  type Box,
} from "@/lib/chef-world";
import { pinLengthVh } from "@/lib/tiers";

const chef = getProject("chef-arturo")!;
const inside = (b: Box, f: Box) => b.x >= f.x - 1e-6 && b.y >= f.y - 1e-6 && b.x + b.w <= f.x + f.w + 1e-6 && b.y + b.h <= f.y + f.h + 1e-6;

describe("the provisional photographs (scripts/derive-chef-photos.mjs)", () => {
  it("the committed geometry is the script's output for the real captures", () => {
    const out = execFileSync(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "scripts/derive-chef-photos.mjs", "--check"], { encoding: "utf8" });
    expect(out).toContain("up to date");
  });
  it("the product and three catalog siblings, with the store's own names and prices, inside the budget", () => {
    expect(CHEF_PHOTOS.map((p) => p.key)).toEqual(["chef.product", "chef.catalog.1", "chef.catalog.2", "chef.catalog.3"]);
    expect(CHEF_PHOTOS[0].label).toBe("Cookie Levain de pistacho y chocolate blanco");
    for (const p of CHEF_PHOTOS) {
      expect(p.price).toBe("$ 120");
      expect(p.label).toMatch(/^Cookie Levain/);
      for (const f of [p.files.avif["1x"], p.files.avif["2x"], p.files.webp["1x"], p.files.webp["2x"]]) expect(statSync(join("public", f)).size).toBeLessThanOrEqual(250 * 1024);
      expect(p.aspect[0]).toBeGreaterThan(500);
      expect(p.aspect[1]).toBeGreaterThan(500);
    }
    expect(CHEF_CREAM).toBe("#f7f3ea");
  });
  it("the product sits inside both reel frames of the product-page poster", () => {
    for (const a of [CHEF_ANCHOR.desktop, CHEF_ANCHOR.mobile]) {
      expect(a.x).toBeGreaterThanOrEqual(0);
      expect(a.y).toBeGreaterThanOrEqual(0);
      expect(a.x + a.w).toBeLessThanOrEqual(1);
      expect(a.y + a.h).toBeLessThanOrEqual(1);
    }
    const poster = getContract("chef.reel.poster");
    expect(poster.meta?.anchorRect).toEqual(CHEF_ANCHOR);
    expect(poster.files?.desktop && "src" in poster.files.desktop ? poster.files.desktop.src : "").toContain("pdp-cookie-levain");
  });
});

describe("the facts (Content Master 09, Spec §11)", () => {
  it("role, proof line without live payments, no brand or photography credit to Franco, the product is the cookie", () => {
    expect(chef.role).toBe("Producto, diseño y desarrollo");
    expect(chef.proofLine).toBe("Tienda real, en línea.");
    expect(proofCaption(chef)).not.toContain(CHEF_PAYMENTS_PROOF);
    expect(proofCaption(chef)).not.toMatch(/pagos en producción/);
    expect(chef.credit).toBeUndefined();
    expect(chef.microCase).not.toMatch(/marca|fotograf/i);
    expect(chef.screen.object).toBe("chef.product");
    const product = resolveAsset("chef.product");
    expect(product.status).toBe("derived");
    expect(product.alt).toBe("Cookie levain de pistacho y chocolate blanco");
    expect(product.meta.source).toMatch(/provisional/i);
    for (const n of [1, 2, 3]) expect(resolveAsset(`chef.catalog.${n}`).status).toBe("derived");
    expect(resolveAsset("chef.macro.loop").status).toBe("placeholder");
  });
  it("the world shows only the store's copy and the one closing line", () => {
    expect(Object.keys(chef.worldCopy)).toEqual(["C04.catalog", "C05.product", "C06.purchase", "C07.close"]);
    expect(splitCatalogLine(chef.worldCopy["C04.catalog"])).toEqual({ title: "Merienda", line: "cookies, brownies y boxes dulces" });
    expect(splitProductLine(chef.worldCopy["C05.product"])).toEqual({ name: "Cookie levain de pistacho y chocolate blanco", price: "$ 120", tag: "compra directa" });
    expect(splitPurchaseLine(chef.worldCopy["C06.purchase"])).toEqual({ stepper: ["−", "1", "+"], add: "Agregar al carrito", pay: "Mercado Pago", chat: "consultar por WhatsApp" });
    expect(chef.worldCopy["C07.close"]).toBe("Primero el deseo. Después, la compra.");
  });
});

describe("compositions", () => {
  const aspect = CHEF_PHOTOS[0].aspect[0] / CHEF_PHOTOS[0].aspect[1];
  for (const v of ["desktop", "sm"] as const) {
    it(`${v}: the macro covers the space; the catalog cards and the product view fit the field without overlap`, () => {
      const sp = v === "sm" ? { w: 390, h: 844 } : { w: 1440, h: 900 };
      const m = macro(v, aspect);
      expect(m.w).toBeGreaterThanOrEqual(sp.w - 1e-6);
      expect(m.h).toBeGreaterThanOrEqual(sp.h - 1e-6);
      expect(Math.abs(m.w / m.h - aspect)).toBeLessThan(1e-6);
      // a wider stage (lg) or a taller one (md) is covered too, still centered on the space
      const wide = macro(v, aspect, { w: sp.w * 1.12, h: sp.h });
      expect(wide.w).toBeGreaterThanOrEqual(sp.w * 1.12 - 1e-6);
      expect(wide.x + wide.w / 2).toBeCloseTo(sp.w / 2, 6);
      const f = field(v);
      const cat = catalog(v, aspect);
      expect(cat.slots).toHaveLength(4);
      expect(cat.productSlot).toBe(1);
      for (const b of cat.slots) {
        expect(inside(b, f)).toBe(true);
        expect(Math.abs(b.w / b.h - aspect)).toBeLessThan(1e-6);
      }
      for (let i = 0; i < 4; i++)
        for (let j = i + 1; j < 4; j++) {
          const a = cat.slots[i];
          const b = cat.slots[j];
          expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h, `${i}/${j}`).toBe(false);
        }
      const pv = product(v, aspect);
      expect(inside(pv.photo, f)).toBe(true);
      expect(Math.abs(pv.photo.w / pv.photo.h - aspect)).toBeLessThan(1e-6);
      // the closing line never crosses the photograph or the controls
      expect(pv.close.y).toBeGreaterThanOrEqual(pv.photo.y + pv.photo.h);
      expect(pv.close.y).toBeGreaterThanOrEqual(pv.purchase.y + pv.purchase.h - 1e-6);
    });
  }
  it("desktop: one row of four; phones: a 2×2 grid, the information under the photograph", () => {
    expect(new Set(catalog("desktop", aspect).slots.map((b) => b.y)).size).toBe(1);
    expect(new Set(catalog("sm", aspect).slots.map((b) => b.y)).size).toBe(2);
    const d = product("desktop", aspect);
    expect(d.info.x).toBeGreaterThan(d.photo.x + d.photo.w);
    const m = product("sm", aspect);
    expect(m.info.y).toBeGreaterThan(m.photo.y + m.photo.h);
  });
  it("the figure only ever scales down from the macro, with a uniform scale (fit)", () => {
    const m = macro("desktop", aspect);
    for (const target of [catalog("desktop", aspect).slots[1], product("desktop", aspect).photo]) {
      const p = fit(m, target);
      expect(p.scale).toBeLessThan(1);
      expect(p.clip.every((c) => c >= -1e-9)).toBe(true);
      expect((m.w - p.clip[1] - p.clip[3]) * p.scale).toBeCloseTo(target.w, 6);
    }
  });
});

describe("time", () => {
  it("6.4 units → 512vh at 80vh; tablets capped at 450vh; reduced motion 5 × 50vh; staggers and the dim", () => {
    expect(CHEF_UNITS).toBe(6.4);
    expect(pinLengthVh(CHEF_UNITS, "xl", false)).toBe(512);
    expect(pinLengthVh(CHEF_UNITS, "md", false)).toBe(448);
    expect(pinLengthVh(CHEF_UNITS_RM, "xl", true)).toBe(250);
    expect([C_T.C02, C_T.C03, C_T.C04, C_T.C05, C_T.C06, C_T.C07, C_T.END]).toEqual([2, 3, 4, 5, 5.6, 6.2, 6.4]);
    expect([C04_STAGGER, C06_STAGGER, C07_DIM]).toEqual([0.08, 0.06, 0.4]);
    expect([chefVariant("xl"), chefVariant("md"), chefVariant("sm")]).toEqual(["desktop", "desktop", "sm"]);
  });
});
