"use client";

import { useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";

export interface ServicesView {
  /** the section's name (its eyebrow and its anchor's word) */
  label: string;
  heading: string;
  sub: string;
  items: { index: number; name: string; line: string }[];
}

const ID = "servicios";
const pad = (n: number) => String(n).padStart(2, "0");

/** false in the server's HTML and while hydrating, true once the page can open and close panels */
const noop = () => () => {};
const useLive = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

/**
 * S12 · Servicios (docs/28 §1, Content Master 26): an essential index — eight services, each a
 * number, a name and a hairline; the name is enough to recognise the service without touching
 * anything. One line of description opens under its name, one at a time (an accordion: a button
 * per service with `aria-expanded` and `aria-controls`; ↑ ↓ Home End move between them). Two
 * columns of four on wide screens, one on narrow ones. No pictures, no panels, no pin.
 *
 * Without JavaScript every description is shown: the panels collapse only under `html.js`, and the
 * buttons get their `aria-expanded` once the page can actually open and close them.
 */
export function Services({ view }: { view: ServicesView }) {
  const [open, setOpen] = useState<number | null>(0);
  const live = useLive();
  const listRef = useRef<HTMLDivElement>(null);

  const half = Math.ceil(view.items.length / 2);
  const columns = [view.items.slice(0, half), view.items.slice(half)];

  /** ↑ ↓ Home End between the services' buttons (the accordion pattern's optional keys) */
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("[data-service]") ?? []);
    const at = buttons.indexOf(e.currentTarget);
    const to = e.key === "ArrowDown" ? at + 1 : e.key === "ArrowUp" ? at - 1 : e.key === "Home" ? 0 : e.key === "End" ? buttons.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    buttons[(to + buttons.length) % buttons.length]?.focus();
  };

  return (
    <section id={ID} aria-labelledby="servicios-h" data-section={ID} className="svc">
      <header className="svc-head">
        <p className="micro svc-eyebrow">{view.label}</p>
        <h2 id="servicios-h" className="svc-title">
          {view.heading}
        </h2>
        <p className="svc-sub">{view.sub}</p>
      </header>
      <div ref={listRef} className="svc-cols">
        {columns.map((col, c) => (
          <ol key={c} className="svc-list" start={col[0]?.index}>
            {col.map((s) => {
              const i = s.index - 1;
              const isOpen = open === i;
              return (
                <li key={s.index} className="svc-item" data-open={isOpen ? "" : undefined}>
                  <h3 className="svc-h">
                    <button
                      type="button"
                      id={`svc-b-${s.index}`}
                      className="svc-btn"
                      data-service={s.index}
                      aria-expanded={live ? isOpen : undefined}
                      aria-controls={`svc-p-${s.index}`}
                      onClick={() => setOpen(isOpen ? null : i)}
                      onKeyDown={onKey}
                    >
                      <span className="svc-n" aria-hidden="true">
                        {pad(s.index)}
                      </span>
                      <span className="svc-name">{s.name}</span>
                      <span className="svc-ind" aria-hidden="true" />
                    </button>
                  </h3>
                  <div id={`svc-p-${s.index}`} className="svc-panel">
                    <div className="svc-panel-in">
                      <p className="svc-line">{s.line}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        ))}
      </div>
    </section>
  );
}
