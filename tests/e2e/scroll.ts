import type { Page } from "@playwright/test";

/**
 * Scroll helpers shared by the e2e specs (Phase 11).
 *
 * `settled`: resolves once the document has not scrolled for 160 ms. A label snap (useScene:
 * delay 80 ms, tween ≤ 600 ms) keeps moving the page after a programmatic jump; a second jump
 * issued while that tween runs is overridden by it — the tween finishes on its own target and
 * the test reads the wrong state. Waiting for the document to rest is a condition, not a
 * timeout: it returns as soon as nothing moves.
 */
/** E2E_SETTLE=0 disables the wait (to reproduce the flakes it prevents) */
const ENABLED = process.env.E2E_SETTLE !== "0";

export async function settled(page: Page): Promise<void> {
  if (!ENABLED) return;
  await page.waitForFunction(
    () =>
      new Promise<boolean>((resolve) => {
        const y0 = window.scrollY;
        window.setTimeout(() => resolve(window.scrollY === y0), 160);
      }),
    undefined,
    { timeout: 5000, polling: 50 },
  );
}

/** an instant jump to `y`, after the document has settled */
export async function jump(page: Page, y: number): Promise<void> {
  await settled(page);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
}
