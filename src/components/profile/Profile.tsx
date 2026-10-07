export interface ProfileView {
  label: string;
  core: string;
  extension: string;
  /** only when confirmed */
  stack?: string;
  /** only the routes that exist */
  contacts: { label: string; href: string }[];
}

/**
 * S13 · Perfil (Spec §12, Content Master 13). The only first-person text on the site; no
 * photo, no title beyond the small nav label. Phase 9 adds the one reveal on entry.
 */
export function Profile({ view }: { view: ProfileView }) {
  return (
    <section id="perfil" aria-labelledby="perfil-h" data-section="perfil" className="profile">
      <h2 id="perfil-h" className="micro muted profile-label">
        {view.label}
      </h2>
      <div className="profile-body">
        <p className="profile-core">{view.core}</p>
        <p className="profile-extension">{view.extension}</p>
        {view.stack ? <p className="micro muted profile-meta">{view.stack}</p> : null}
        {view.contacts.length ? (
          <p className="micro profile-meta">
            {view.contacts.map((c, i) => (
              <span key={c.href}>
                {i > 0 ? " · " : null}
                <a href={c.href} className="link">
                  {c.label}
                </a>
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </section>
  );
}
