import { PROJECTS } from "@/data/projects";
import { SITE } from "@/data/site";
import type { Project } from "@/data/types";
import { resolveAsset } from "@/lib/assets";
import { confirmed, miniLabel, rangeLabel } from "@/lib/content";
import { pathForSection } from "@/lib/route-sync";
import type { HeaderView } from "@/components/layout/SiteHeader";

/**
 * What the two documents share (docs/25): the home journey (`/`) and each project's case
 * (`/trabajo/{slug}`) carry the same header, and a project's «Abrir ↗» reads the same everywhere.
 */

/** "Trabajo · 01–NN": the range follows the real number of projects */
export const reelName = () => rangeLabel(SITE.reel.label, PROJECTS.length);

export function headerView(): HeaderView {
  return {
    brand: SITE.nav.brand,
    firma: SITE.nav.firma,
    work: SITE.nav.work,
    profile: SITE.nav.profile,
    cta: SITE.nav.cta,
    projects: PROJECTS.map((p) => ({ id: p.id, index: p.index, name: p.name })),
    overlay: {
      title: reelName(),
      close: SITE.nav.close,
      items: PROJECTS.map((p) => ({ id: p.id, label: miniLabel(p.index, p.name), href: pathForSection(p.id), poster: resolveAsset(p.reel.poster) })),
    },
  };
}

/** "Abrir ↗" only when the live URL is confirmed */
export function openLink(p: Project) {
  const href = confirmed(p.liveUrl);
  return href ? { href, label: SITE.reel.open, aria: p.a11y.openLabel } : undefined;
}
