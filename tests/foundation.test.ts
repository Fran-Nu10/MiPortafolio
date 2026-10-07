/**
 * Phase 1 foundation units: geometry (Spec §06/§07), label snapping (§05), tiers (§15),
 * route mapping (§20) and the brief's server logic (§14).
 */
import { describe, expect, it, vi } from "vitest";
import { designScale, neighbourVisible, reelRect, reelTrackX, zForScale } from "@/lib/geometry";
import { labelStops, pinLengthVh, snapToStop, stepToStop, tierForWidth } from "@/lib/tiers";
import { pathForSection, sectionForLocation } from "@/lib/route-sync";
import { briefCompletion, createRateLimiter, processBrief, validateBrief, type BriefDeps } from "@/lib/brief";

const TS = { desktop: [1094, 616] as [number, number], mobile: [358, 420] as [number, number] };
const SANTI = { desktop: [1094, 700] as [number, number], mobile: [358, 420] as [number, number] };

describe("tiers", () => {
  it("four tiers at 768 / 1024 / 1440", () => {
    expect([320, 767, 768, 1023, 1024, 1439, 1440, 2560].map(tierForWidth)).toEqual(["sm", "sm", "md", "md", "lg", "lg", "xl", "xl"]);
  });
  it("pin length = units × gesture (80/70/60), 50vh per unit under reduced motion", () => {
    expect(pinLengthVh(7.5, "xl", false)).toBe(600);
    expect(pinLengthVh(1, "md", false)).toBe(70);
    expect(pinLengthVh(1, "sm", false)).toBe(60);
    expect(pinLengthVh(7.5, "xl", true)).toBe(375);
  });
});

describe("geometry · reelRect", () => {
  it("1440×900: 1094 × 616, centered (x 173)", () => {
    const r = reelRect(TS, { width: 1440, height: 900 });
    expect(r.w).toBeCloseTo(1094);
    expect(r.h).toBeCloseTo(616);
    expect(r.x).toBeCloseTo(173);
    expect(r.y).toBeCloseTo(142);
    expect(neighbourVisible(r.w, 1440, "xl")).toBeCloseTo(141);
  });
  it("height cap 72svh shrinks the width and keeps the aspect", () => {
    const r = reelRect(SANTI, { width: 1440, height: 800 });
    expect(r.h).toBeCloseTo(576);
    expect(r.w / r.h).toBeCloseTo(1094 / 700);
  });
  it("lg 76vw, md 84vw", () => {
    expect(reelRect(TS, { width: 1280, height: 1000 }).w).toBeCloseTo(972.8);
    expect(reelRect(TS, { width: 820, height: 1180 }).w).toBeCloseTo(688.8);
  });
  it("sm 390×844: 358 × 420 portrait frame, top at 18svh", () => {
    const r = reelRect(TS, { width: 390, height: 844 });
    expect(r.w).toBeCloseTo(358);
    expect(r.h).toBeCloseTo(420);
    expect(r.x).toBeCloseTo(16);
    expect(r.y).toBeCloseTo(151.92);
  });
  it("track offset x(i) = (vw − W)/2 − i·(W + gap)", () => {
    expect(reelTrackX(0, 1094, 1440, "xl")).toBeCloseTo(173);
    expect(reelTrackX(2, 1094, 1440, "xl")).toBeCloseTo(173 - 2 * 1126);
  });
  it("design space scale and z = P·(1 − 1/scale)", () => {
    expect(designScale({ width: 1440, height: 900 })).toBe(1);
    expect(designScale({ width: 1280, height: 900 })).toBeCloseTo(0.8889, 3);
    expect(zForScale(1.25)).toBeCloseTo(280);
    expect(zForScale(0.7)).toBeCloseTo(-600);
  });
});

describe("label snapping", () => {
  const labels = { "s:SCREEN": 0, "s:ISOLATE": 1, "m:TS02": 2.4, "s:TS03": 3, "s:END": 5 };
  const stops = labelStops(labels, 5);
  it("only s: labels are stops (m: markers skipped)", () => {
    expect(stops).toEqual([0, 0.2, 0.6, 1]);
  });
  it("snaps to the next stop in the direction of travel", () => {
    expect(snapToStop(stops, 0.25, 1)).toBe(0.6);
    expect(snapToStop(stops, 0.5, -1)).toBe(0.2);
    expect(snapToStop(stops, 0.6, 1)).toBe(0.6);
    expect(snapToStop(stops, 0.99, 1)).toBe(1);
  });
  it("stepping shows the last stop reached", () => {
    expect(stepToStop(stops, 0.59)).toBe(0.2);
    expect(stepToStop(stops, 0.6)).toBe(0.6);
  });
});

describe("route sync mapping", () => {
  it("worlds → /trabajo/{slug}; anchors → /#id; the rest → /", () => {
    expect(pathForSection("rayo-smash")).toBe("/trabajo/rayo-smash");
    expect(pathForSection("perfil")).toBe("/#perfil");
    expect(pathForSection("trabajo")).toBe("/");
    expect(pathForSection("inicio")).toBe("/");
  });
  it("parses locations back to sections", () => {
    expect(sectionForLocation("/trabajo/santi-nuca")).toBe("santi-nuca");
    expect(sectionForLocation("/trabajo/nope")).toBeNull();
    expect(sectionForLocation("/", "#contacto")).toBe("contacto");
    expect(sectionForLocation("/")).toBe("inicio");
  });
});

// ── the brief ────────────────────────────────────────────────────────────────

const NOW = 1_800_000_000_000;
const ENV = { RESEND_API_KEY: "re_test", CONTACT_TO: "to@example.com", CONTACT_FROM: "Brief <brief@example.com>" };

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ t: String(NOW - 10_000), company: "", ...values })) fd.set(k, v);
  return fd;
}
const VALID = { name: "Ana", email: "ana@example.com", brief: "Una tienda para mi pastelería." };

function deps(over: Partial<BriefDeps> = {}): BriefDeps {
  return {
    env: ENV,
    ip: "1.2.3.4",
    now: NOW,
    fetch: vi.fn(async () => new Response("{}", { status: 200 })) as unknown as typeof fetch,
    limiter: createRateLimiter(),
    ...over,
  };
}

describe("brief · validation", () => {
  it("missing / invalid fields", () => {
    expect(validateBrief({ name: "", email: "", brief: "" })).toEqual({ name: "missing", email: "missing", brief: "missing" });
    expect(validateBrief({ ...VALID, email: "ana@" })).toEqual({ email: "invalid" });
    expect(validateBrief(VALID)).toBeUndefined();
  });
  it("completion: name 20 · email 20 · brief 60 up to 140 chars", () => {
    expect(briefCompletion({ name: "", email: "", brief: "" })).toBe(0);
    expect(briefCompletion({ ...VALID, brief: "x".repeat(140) })).toBe(100);
    expect(briefCompletion({ ...VALID, brief: "x".repeat(70) })).toBe(70);
  });
});

describe("brief · delivery (success only after a 2xx)", () => {
  it("delivers through Resend and succeeds on 2xx", async () => {
    const d = deps();
    expect(await processBrief(form(VALID), d)).toEqual({ status: "success" });
    const [url, init] = (d.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toMatchObject({ to: ["to@example.com"], reply_to: "ana@example.com", subject: "Brief · Ana" });
    expect(body.html).toBeUndefined();
  });

  it("Resend non-2xx → route error, values kept, never success", async () => {
    const r = await processBrief(form(VALID), deps({ fetch: (async () => new Response("", { status: 500 })) as unknown as typeof fetch }));
    expect(r).toMatchObject({ status: "error", route: true, values: VALID });
  });

  it("network failure → route error", async () => {
    const r = await processBrief(form(VALID), deps({ fetch: (async () => { throw new Error("offline"); }) as unknown as typeof fetch }));
    expect(r).toMatchObject({ status: "error", route: true });
  });

  it("missing configuration is an error, not a silent success", async () => {
    for (const missing of ["RESEND_API_KEY", "CONTACT_TO", "CONTACT_FROM"] as const) {
      const d = deps({ env: { ...ENV, [missing]: undefined } });
      expect(await processBrief(form(VALID), d)).toMatchObject({ status: "error", route: true });
      expect(d.fetch).not.toHaveBeenCalled();
    }
  });

  it("errors echo the original timestamp (a no-JS re-render must not restart the timing check)", async () => {
    const t = NOW - 10_000;
    expect(await processBrief(form({ ...VALID, name: "" }), deps())).toMatchObject({ status: "error", t });
    expect(await processBrief(form(VALID), deps({ env: {} }))).toMatchObject({ status: "error", route: true, t });
  });

  it("field errors come back with the values", async () => {
    const d = deps();
    expect(await processBrief(form({ ...VALID, email: "nope" }), d)).toMatchObject({ status: "error", fields: { email: "invalid" }, values: { email: "nope" } });
    expect(d.fetch).not.toHaveBeenCalled();
  });

  it("honeypot and timing: silent success, nothing sent", async () => {
    const d1 = deps();
    expect(await processBrief(form({ ...VALID, company: "ACME" }), d1)).toEqual({ status: "success" });
    expect(d1.fetch).not.toHaveBeenCalled();
    const d2 = deps();
    expect(await processBrief(form({ ...VALID, t: String(NOW - 1000) }), d2)).toEqual({ status: "success" });
    expect(d2.fetch).not.toHaveBeenCalled();
    const d3 = deps();
    expect(await processBrief(form({ ...VALID, t: "" }), d3)).toEqual({ status: "success" });
    expect(d3.fetch).not.toHaveBeenCalled();
  });

  it("rate limit: 5 per 10 minutes per IP, then the route error", async () => {
    const d = deps();
    for (let i = 0; i < 5; i++) expect(await processBrief(form(VALID), d)).toEqual({ status: "success" });
    expect(await processBrief(form(VALID), d)).toMatchObject({ status: "error", route: true });
    expect(await processBrief(form(VALID), { ...d, ip: "5.6.7.8" })).toEqual({ status: "success" });
    expect(await processBrief(form(VALID), { ...d, now: NOW + 11 * 60 * 1000 })).toEqual({ status: "success" });
  });

  it("length caps", async () => {
    const d = deps();
    await processBrief(form({ ...VALID, brief: "x".repeat(5000) }), d);
    const body = JSON.parse(((d.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit).body as string);
    expect(body.text.length).toBeLessThan(2100);
  });
});
