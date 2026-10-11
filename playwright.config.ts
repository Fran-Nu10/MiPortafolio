import { defineConfig, devices } from "@playwright/test";

/**
 * e2e against the production build (`npm run build` first). Phase 1 runs Chromium on the
 * reference viewports; WebKit and Firefox join in Phase 11 (Spec §27 automation).
 */
const PORT = 3100;
export const MOCK_PORT = 3101;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: [
    {
      // a stand-in for Resend: no real email leaves the suite (Spec §26 Phase 10)
      command: `node tests/e2e/mock-resend.mjs`,
      url: `http://localhost:${MOCK_PORT}/`,
      reuseExistingServer: false,
      timeout: 15_000,
      env: { MOCK_RESEND_PORT: String(MOCK_PORT) },
    },
    {
      command: `npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: false,
      timeout: 60_000,
      // the contact route delivers to the mock; "[fail]" in a brief makes it answer 500
      env: { RESEND_API_KEY: "re_test", CONTACT_TO: "to@example.test", CONTACT_FROM: "Franco <brief@example.test>", RESEND_API_URL: `http://localhost:${MOCK_PORT}/emails` },
    },
  ],
  projects: [
    { name: "xl-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "lg-1366", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } } },
    { name: "md-820", use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: "sm-390", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
    { name: "sm-320", use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true } },
    { name: "rm-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" } },
  ],
});
