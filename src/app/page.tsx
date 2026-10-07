import { SITE } from "@/data/site";
import { Journey } from "@/components/journey/Journey";

/** JSON-LD `Person`, home only (Content Master 17). url and sameAs stay out until confirmed. */
const PERSON = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE.meta.person.name,
  jobTitle: SITE.meta.person.jobTitle,
  address: { "@type": "PostalAddress", addressCountry: SITE.meta.person.addressCountry },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON) }} />
      <Journey initial={null} />
    </>
  );
}
