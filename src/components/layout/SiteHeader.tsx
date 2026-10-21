"use client";

import { useJourney } from "@/lib/journey-store";
import { indexLabel } from "@/lib/content";
import { ReelOverlay, type OverlayItem } from "./ReelOverlay";

export interface HeaderView {
  brand: string;
  firma: string;
  work: string;
  profile: string;
  cta: string;
  projects: { id: string; index: number; name: string }[];
  overlay: { title: string; close: string; items: OverlayItem[] };
}

/**
 * S0 · Shell (Spec §02, Content Master 03): marca, firma, Trabajo, the "0n / 04" state while a
 * world is in view, Perfil and "Ahora, el tuyo". Hidden during End. "Trabajo" opens the 01–04
 * overlay; the links are in-journey navigation (pushState + jump, see JourneyClient) when their section
 * is in this document, a page navigation when it is not (a case and the home, docs/25).
 */
export function SiteHeader({ view }: { view: HeaderView }) {
  const section = useJourney((s) => s.section);
  const revealed = useJourney((s) => s.heroRevealed);
  const ended = useJourney((s) => s.endActive);
  const current = view.projects.find((p) => p.id === section);
  return (
    <header className="site-header" data-revealed={revealed} data-ended={ended} hidden={ended || undefined}>
      <div className="site-header-id">
        {/* a plain link: the journey handles it in place (pushState + jump), never router.push */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="site-brand">
          {view.brand}
        </a>
        <span className="site-firma micro muted">{view.firma}</span>
      </div>
      <nav className="site-nav">
        <ReelOverlay trigger={view.work} title={view.overlay.title} close={view.overlay.close} items={view.overlay.items} />
        <span className="site-index micro muted">
          {current ? indexLabel(current.index, view.projects.length) : null}
        </span>
        {/* the home's sections: in place on `/`, a page navigation from a case (docs/25) */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/#perfil" className="link">
          {view.profile}
        </a>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/#contacto" className="link site-cta">
          {view.cta}
        </a>
      </nav>
    </header>
  );
}
