import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { BriefForm, type BriefFormCopy } from "./BriefForm";

export interface FinalCtaView {
  title: string;
  support: string;
  footer: string;
  form: BriefFormCopy;
}

/**
 * S15 · "Ahora, el tuyo." (Spec §14). The invitation after the selected work. Never pinned: inputs,
 * keyboard and focus scrolling behave natively. The minimal footer sits above the form.
 */
export function FinalCta({ view, renderedAt }: { view: FinalCtaView; renderedAt: number }) {
  return (
    <section id="contacto" aria-labelledby="contacto-h" data-section="contacto" className="cta">
      <h2 id="contacto-h" className="cta-title">
        {view.title}
      </h2>
      <p className="cta-support">{view.support}</p>
      <MinimalFooter line={view.footer} />
      <BriefForm copy={view.form} renderedAt={renderedAt} />
    </section>
  );
}
