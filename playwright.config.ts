import { defineConfig, devices } from "@playwright/test";

/**
 * e2e against the production build (`npm run build` first). Phase 1 runs Chromium on the
 * reference viewports; WebKit and Firefox join in Phase 11 (Spec §27 automation).
 */
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    // the contact route must be unconfigured here: the form has to fail honestly
    env: { RESEND_API_KEY: "", CONTACT_TO: "", CONTACT_FROM: "" },
  },
  projects: [
    { name: "xl-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "lg-1366", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } } },
    { name: "md-820", use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: "sm-390", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
    { name: "sm-320", use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true } },
    { name: "rm-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" } },
  ],
});
