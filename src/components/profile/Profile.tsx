import { Fragment } from "react";
import { ProfileReveal } from "./ProfileReveal";

export interface ProfileView {
  label: string;
  /** the declaration: set apart, larger */
  core: string;
  /** the explanation: body copy under a hairline */
  body: string[];
  /** Meta Ads in its own space: a headline, its paragraphs, and the term set in discreet emphasis */
  ads: { title: string; paragraphs: string[]; emphasis: string };
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

/**
 * S13 · Perfil (Spec §12, Content Master 13 and 21). Editorial, not corporate: the first paragraph is
 * the declaration of authority (large, alone), the next two explain it (body copy under a hairline),
 * and Meta Ads has a space of its own below — a headline and three short paragraphs. The only
 * first-person text on the site besides the declaration's conclusion; no photo, no cards, no icons.
 * The text is server HTML, readable without JavaScript; two single reveals on entry (ProfileReveal).
 */
export function Profile({ view }: { view: ProfileView }) {
  return (
    <section id="perfil" aria-labelledby="perfil-h" data-section="perfil" className="profile">
      <h2 id="perfil-h" className="micro muted profile-label">
        {view.label}
      </h2>
      <div className="profile-body">
        <p className="profile-core">{view.core}</p>
        <div className="profile-detail">
          {view.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
      <section aria-labelledby="perfil-ads-h" className="profile-ads">
        <h3 id="perfil-ads-h" className="profile-ads-title">
          {view.ads.title}
        </h3>
        <div className="profile-ads-body">
          {view.ads.paragraphs.map((p) => (
            <p key={p}>{emphasize(p, view.ads.emphasis)}</p>
          ))}
        </div>
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
