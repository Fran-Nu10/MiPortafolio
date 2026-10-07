"use client";

import Link from "next/link";
import { useJourney } from "@/lib/journey-store";
import { indexLabel } from "@/lib/content";

export interface HeaderView {
  brand: string;
  firma: string;
  work: string;
  profile: string;
  cta: string;
  projects: { id: string; index: number; name: string }[];
}

/**
 * S0 · Shell (Spec §02, Content Master 03): marca, firma, Trabajo, the "0n / 04" state while a
 * world is in view, Perfil and "Ahora, el tuyo". Hidden during End. Phase 4 turns "Trabajo"
 * into the 01–04 overlay trigger (ReelOverlay) and intercepts the links with pushState.
 */
export function SiteHeader({ view }: { view: HeaderView }) {
  const section = useJourney((s) => s.section);
  const revealed = useJourney((s) => s.heroRevealed);
  const ended = useJourney((s) => s.endActive);
  const current = view.projects.find((p) => p.id === section);
  return (
    <header className="site-header" data-revealed={revealed} data-ended={ended} hidden={ended || undefined}>
      <div className="site-header-id">
        <Link href="/" className="site-brand">
          {view.brand}
        </Link>
        <span className="site-firma micro muted">{view.firma}</span>
      </div>
      <nav className="site-nav">
        <a href="#trabajo" className="link">
          {view.work}
        </a>
        <span className="site-index micro muted">
          {current ? indexLabel(current.index, view.projects.length) : null}
        </span>
        <a href="#perfil" className="link">
          {view.profile}
        </a>
        <a href="#contacto" className="link site-cta">
          {view.cta}
        </a>
      </nav>
    </header>
  );
}
