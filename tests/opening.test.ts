/**
 * Phase 2 units: the opening's timing rules (Spec §02 S1) and the media pipeline (§17).
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it, vi } from "vitest";
import { BAND_INSET, OPENING, focusWhenReady, inset, parseInsetTop, splitName } from "@/lib/opening";
import { snapToStop } from "@/lib/tiers";

describe("opening helpers", () => {
  it("the band is 14vh: inset 43% top and bottom", () => {
    expect(100 - 2 * BAND_INSET).toBe(14);
    expect(inset(BAND_INSET)).toBe("inset(43% 0% 43% 0%)");
  });

  it("reads the band's computed inset", () => {
    expect(parseInsetTop("inset(46.04% 0%)")).toBeCloseTo(46.04);
    expect(parseInsetTop("inset(50% 0% 50% 0%)")).toBe(50);
    expect(parseInsetTop("none")).toBeNull();
  });

  it("splits the names for the mobile crop: FRA / NCO, NÚ / ÑEZ", () => {
    expect(splitName("FRANCO")).toEqual(["FRA", "NCO"]);
    expect(splitName("NÚÑEZ")).toEqual(["NÚ", "ÑEZ"]);
    // decomposed input (N + combining tilde) splits the same way
    expect(splitName("NÚÑEZ")).toEqual(["NÚ", "ÑEZ"]);
  });

  it("the end of the pin is a snap stop: forward past the last state releases the pin", () => {
    const stops = [0, 1 / 3.25, 2 / 3.25, 3 / 3.25, 1];
    expect(snapToStop(stops, 0.95, 1)).toBe(1);
    expect(snapToStop(stops, 0.95, -1)).toBeCloseTo(3 / 3.25);
  });
});

describe("O2 · decode vs the 2.5 s deadline", () => {
  const deferred = () => {
    let resolve!: () => void;
    let reject!: () => void;
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };

  it("decoded before the deadline → focus on the sharp image", async () => {
    vi.useFakeTimers();
    const d = deferred();
    const on = { focus: vi.fn(), sharp: vi.fn() };
    focusWhenReady(d.promise, OPENING.decodeDeadline, on);
    d.resolve();
    await Promise.resolve();
    expect(on.focus).toHaveBeenCalledWith(true);
    vi.advanceTimersByTime(3000);
    expect(on.focus).toHaveBeenCalledTimes(1);
    expect(on.sharp).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("deadline first → O2 completes on the LQIP, the sharp image swaps in when ready", async () => {
    vi.useFakeTimers();
    const d = deferred();
    const on = { focus: vi.fn(), sharp: vi.fn() };
    focusWhenReady(d.promise, OPENING.decodeDeadline, on);
    vi.advanceTimersByTime(2499);
    expect(on.focus).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(on.focus).toHaveBeenCalledWith(false);
    d.resolve();
    await Promise.resolve();
    expect(on.sharp).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("decode fails → O2 completes at once on the LQIP, no swap", async () => {
    vi.useFakeTimers();
    const d = deferred();
    const on = { focus: vi.fn(), sharp: vi.fn() };
    focusWhenReady(d.promise, OPENING.decodeDeadline, on);
    d.reject();
    await Promise.resolve();
    await Promise.resolve();
    expect(on.focus).toHaveBeenCalledWith(false);
    vi.advanceTimersByTime(3000);
    expect(on.focus).toHaveBeenCalledTimes(1);
    expect(on.sharp).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("a deadline already passed focuses immediately; cancel stops everything", async () => {
    vi.useFakeTimers();
    const on = { focus: vi.fn(), sharp: vi.fn() };
    focusWhenReady(new Promise(() => {}), -200, on);
    vi.advanceTimersByTime(0);
    expect(on.focus).toHaveBeenCalledWith(false);

    const on2 = { focus: vi.fn(), sharp: vi.fn() };
    const d = deferred();
    const cancel = focusWhenReady(d.promise, 1000, on2);
    cancel();
    d.resolve();
    await Promise.resolve();
    vi.advanceTimersByTime(2000);
    expect(on2.focus).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe("scripts/media.mjs", () => {
  sharp.cache(false);
  const dir = mkdtempSync(join(tmpdir(), "revelado-media-"));
  afterAll(() => {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Windows may hold a handle for a moment; the OS temp folder is cleaned anyway
    }
  });
  const run = (...args: string[]) => execFileSync(process.execPath, ["scripts/media.mjs", ...args], { encoding: "utf8" });
  const hash = (f: string) => createHash("sha256").update(readFileSync(f)).digest("hex");

  it("grain: a deterministic 256×256 tile under 8 KB", async () => {
    const a = join(dir, "a.png");
    const b = join(dir, "b.png");
    run("grain", "--out", a);
    run("grain", "--out", b);
    expect(statSync(a).size).toBeLessThanOrEqual(8 * 1024);
    expect(hash(a)).toBe(hash(b));
    const meta = await sharp(a).metadata();
    expect([meta.width, meta.height]).toEqual([256, 256]);
  });

  it("the committed grain tile is the generated one", () => {
    const out = join(dir, "committed.png");
    run("grain", "--out", out);
    expect(hash("public/media/site/grain.png")).toBe(hash(out));
  });

  it("cutout: AVIF + WebP at 1x/2x with alpha and a < 1 KB LQIP", async () => {
    // a synthetic master (flat shapes with transparency) — never a picture of anyone
    const master = join(dir, "master.png");
    const svg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="1200"><ellipse cx="480" cy="420" rx="220" ry="260" fill="#8e8b84"/><rect x="200" y="640" width="560" height="560" fill="#ede8de"/></svg>`,
    );
    await sharp(svg).png().toFile(master);
    const web = join(dir, "public");
    const outBase = join(web, "media", "franco", "hero");
    const json = JSON.parse(
      run("cutout", "--key", "franco.hero", "--tier", "desktop", "--in", master, "--out", outBase, "--height", "500", "--public", web),
    );
    expect(json.files.desktop.avif["1x"]).toBe("/media/franco/hero-desktop@1x.avif");
    expect(json.files.desktop.webp["2x"]).toBe("/media/franco/hero-desktop@2x.webp");
    expect(json.files.desktop.height).toBe(500);
    expect(json.lqip).toMatch(/^data:image\/webp;base64,/);
    expect(json.lqipBytes).toBeLessThan(1024);
    const webp = await sharp(join(web, json.files.desktop.webp["1x"])).metadata();
    expect(webp.hasAlpha).toBe(true);
    expect(webp.height).toBe(500);
  });
});
