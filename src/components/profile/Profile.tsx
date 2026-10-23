import { Fragment } from "react";
import type { ResolvedAsset } from "@/lib/resolved";
import { Cutout } from "@/components/media/Cutout";
import { Still } from "@/components/media/Still";
import { ProfileReveal } from "./ProfileReveal";

export interface ProfileView {
  label: string;
  /** the declaration: set apart, larger */
  core: string;
  /** the explanation: two paragraphs, each beside its own visual */
  body: [string, string];
  /** beside the first paragraph: its own four phrases; beside the second: the projects it names, by kind */
  /** (the projects are not named here: the Perfil does not name TravelSuite360, Content Master 21) */
  facets: { phrases: string[]; projects: { kind: string; asset: ResolvedAsset }[] };
  /** Meta Ads, a chapter of its own: a two-line headline, three steps, one paragraph with the term in emphasis */
  ads: { title: [string, string]; steps: { word: string; line: string }[]; paragraph: string; emphasis: string };
  /** only when confirmed */
  stack?: string;
  /** only the routes that exist */
  contacts: { label: string; href: string }[];
}

/** the paragraph with `term` set in emphasis (text content unchanged: the sentence reads the same) */
function emphasize(text: string, term: string) {
  const at = text.indexOf(term);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <strong className="profile-ads-em">{term}</strong>
      {text.slice(at + term.length)}
    </>
  );
}

/** Meta Ads' three steps, drawn in the module language of «Una sola visión» (viewBox 120) */
function StepFig({ k }: { k: number }) {
  if (k === 0)
    // the product: one built module
    return <rect className="af-module" x={38} y={38} width={44} height={44} data-part="mod" />;
  // discovery: the module seen further and further (outlines around it, no figure, no number)
  const echoes = [64, 88, 112].map((size, i) => (
    <rect key={size} className="af-echo" x={60 - size / 2} y={60 - size / 2} width={size} height={size} data-echo={i} />
  ));
  if (k === 1)
    return (
      <>
        {echoes}
        <rect className="af-module" x={46} y={46} width={28} height={28} data-part="mod" />
      </>
    );
  // action: from all who see it, one comes to it — the accent module at the edge
  return (
    <>
      {echoes}
      <rect className="af-module" x={46} y={46} width={28} height={28} />
      <rect className="af-module af-accent" x={100} y={52} width={16} height={16} data-part="act" />
    </>
  );
}

/**
 * S13 · Perfil (Spec §12; copy Content Master 13, 21 and 25). An editorial composition, not a column
 * (docs/27 §3): the declaration of authority large and alone; then each paragraph of the explanation
 * beside a visual of its own — the first beside its four phrases (a brand, its clients, its processes,
 * a digital product, joined by the accent thread), the second beside real fragments of the projects
 * it names, by kind (a store's product, a platform's interface with demo data — captioned by kind only:
 * the Perfil does not name TravelSuite360, Content Master 21). On phones the visuals
 * sit between the paragraphs. Then Meta Ads, a chapter of its own: «Construirlo es una parte. Hacer
 * que lo descubran es la otra.», three steps — Producto → Descubrimiento → Acción — and one paragraph.
 * The only first-person text on the site besides the declaration's conclusion; no portrait, no
 * metric. Server HTML, readable without JavaScript; ProfileReveal plays each piece once.
 */
export function Profile({ view }: { view: ProfileView }) {
  return (
    <section id="perfil" aria-labelledby="perfil-h" data-section="perfil" className="profile">
      <h2 id="perfil-h" className="sr-only">
        {view.label}
      </h2>
      <div className="profile-grid">
        <p className="profile-core">{view.core}</p>
        {/* the first paragraph's own phrases: what the work reaches, joined into one */}
        <figure className="profile-phrases" aria-hidden="true">
          <ol>
            {view.facets.phrases.map((p, i) => (
              <li key={p} data-k={i} className="profile-phrase">
                <span className="profile-phrase-node" />
                {p}
              </li>
            ))}
          </ol>
        </figure>
        <p className="profile-p profile-p1">{view.body[0]}</p>
        {/* the second paragraph's kinds of project, as real fragments of them */}
        <figure className="profile-projects">
          {view.facets.projects.map((p, i) => (
            <div key={p.kind} className="profile-shot" data-k={i}>
              <div className="profile-shot-frame">{p.asset.kind === "cutout" ? <Cutout asset={p.asset} fill /> : <Still asset={p.asset} sizes="(min-width: 1024px) 22vw, 44vw" fill />}</div>
              <p className="micro profile-shot-caption">{p.kind}</p>
            </div>
          ))}
        </figure>
        <p className="profile-p profile-p2">{view.body[1]}</p>
      </div>

      <section aria-labelledby="perfil-ads-h" className="profile-ads">
        <h3 id="perfil-ads-h" className="profile-ads-title">
          <span className="profile-ads-line">{view.ads.title[0]}</span>{" "}
          <span className="profile-ads-line profile-ads-accent">{view.ads.title[1]}</span>
        </h3>
        <ol className="profile-steps">
          {view.ads.steps.map((s, k) => (
            <li key={s.word} className="profile-step" data-k={k}>
              <svg className="profile-step-fig" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
                <StepFig k={k} />
              </svg>
              <span className="profile-step-node" aria-hidden="true" />
              {k < view.ads.steps.length - 1 ? <span className="profile-step-seg" aria-hidden="true" /> : null}
              <p className="profile-step-word">{s.word}</p>
              <p className="profile-step-line">{s.line}</p>
            </li>
          ))}
        </ol>
        <p className="profile-ads-p">{emphasize(view.ads.paragraph, view.ads.emphasis)}</p>
      </section>
      {view.stack || view.contacts.length ? (
        <div className="profile-foot">
          {view.stack ? <p className="micro muted profile-meta">{view.stack}</p> : null}
          {view.contacts.length ? (
            <p className="micro profile-meta">
              {view.contacts.map((c, i) => (
                <Fragment key={c.href}>
                  {i > 0 ? " · " : null}
                  <a href={c.href} className="link">
                    {c.label}
                  </a>
                </Fragment>
              ))}
            </p>
          ) : null}
        </div>
      ) : null}
      <ProfileReveal />
    </section>
  );
}
