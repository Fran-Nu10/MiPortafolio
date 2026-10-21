"use client";

import { useRef, type MouseEvent as ReactMouseEvent } from "react";
import { useJourney } from "@/lib/journey-store";
import type { ResolvedAsset } from "@/lib/resolved";
import { Still } from "@/components/media/Still";

export interface OverlayItem {
  id: string;
  /** "01 · TravelSuite360" */
  label: string;
  href: string;
  poster: ResolvedAsset;
}

/**
 * The compact 01–04 overlay (Spec §19, Revelado 2.2 §7, Content Master 03): "Trabajo" opens the
 * reel as four thumbnails in a row; Esc or "Cerrar" closes it. A native <dialog> with
 * showModal() — focus trap, Esc and an inert page for free. Focus goes to the current project
 * and returns to the trigger on close. Choosing a project closes it and navigates (the journey's
 * own link handling: pushState + the jump to the world). Without JavaScript the trigger is a
 * plain link to the reel.
 */
export function ReelOverlay({ trigger, title, close, items }: { trigger: string; title: string; close: string; items: OverlayItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const section = useJourney((s) => s.section);

  const open = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    const d = dialogRef.current;
    if (!d || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    d.showModal();
    const current = d.querySelector<HTMLElement>('[aria-current="true"]') ?? d.querySelector<HTMLElement>(".overlay-item");
    current?.focus();
  };

  return (
    <>
      {/* without JS (or opened in a new tab): the reel of the home journey, from a case too (docs/25) */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a ref={triggerRef} href="/#trabajo" aria-haspopup="dialog" className="link" onClick={open}>
        {trigger}
      </a>
      <dialog ref={dialogRef} aria-labelledby="overlay-h" className="overlay" onClose={() => triggerRef.current?.focus()}>
        <div className="overlay-head">
          <p id="overlay-h" className="micro muted">
            {title}
          </p>
          <button type="button" className="link overlay-close" onClick={() => dialogRef.current?.close()}>
            {close}
          </button>
        </div>
        <ol className="overlay-list">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                className="overlay-item"
                aria-current={item.id === section ? "true" : undefined}
                onClick={() => dialogRef.current?.close()}
              >
                <span className="overlay-thumb">
                  <Still asset={item.poster} sizes="(max-width: 767.98px) 44vw, 240px" fill />
                </span>
                <span className="micro">{item.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </dialog>
    </>
  );
}
