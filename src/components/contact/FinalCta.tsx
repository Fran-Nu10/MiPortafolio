import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { BriefForm, type BriefFormCopy } from "./BriefForm";

export interface FinalCtaView {
  eyebrow: string;
  title: string;
  support: string;
  aside: string;
  footer: string;
  form: BriefFormCopy;
}

/**
 * S15 · "Ahora, el tuyo." (Spec §14). The invitation after the selected work, and the page's closing
 * argument: the headline and its text on one side, the brief on the other (docs/23 §5). Never pinned:
 * inputs, keyboard and focus scrolling behave natively. The minimal footer closes the section.
 */
export function FinalCta({ view, renderedAt }: { view: FinalCtaView; renderedAt: number }) {
  return (
    <section id="contacto" aria-labelledby="contacto-h" data-section="contacto" className="cta">
      <div className="cta-grid">
        <div className="cta-intro">
          <p className="micro cta-eyebrow">{view.eyebrow}</p>
          <h2 id="contacto-h" className="cta-title">
            {view.title}
          </h2>
          <p className="cta-support">{view.support}</p>
          <p className="cta-aside">{view.aside}</p>
        </div>
        <BriefForm copy={view.form} renderedAt={renderedAt} />
      </div>
      <MinimalFooter line={view.footer} />
    </section>
  );
}
