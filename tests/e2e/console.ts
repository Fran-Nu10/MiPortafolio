import type { Page } from "@playwright/test";

/**
 * Console watcher shared by the e2e specs (Phase 11): every error, warning and page error is a
 * problem — except browser advisories that are not about this site's code:
 * - Firefox's "scroll-linked positioning effect" notice: ScrollTrigger scrubs are scroll-linked by
 *   design (Spec §05); the notice is informational and fires on every page with a pinned scene.
 */
const ADVISORIES = [/scroll-linked positioning effect/];

export function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error" && m.type() !== "warning") return;
    const text = m.text();
    if (ADVISORIES.some((re) => re.test(text))) return;
    problems.push(`${m.type()}: ${text}`);
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}
