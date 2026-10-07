import Link from "next/link";
import { SITE } from "@/data/site";

/** "No existe. ← Trabajo" — two lines, no joke (Content Master 16). */
export default function NotFound() {
  return (
    <main id="contenido" className="not-found">
      <h1 className="not-found-title">{SITE.notFound.title}</h1>
      <p>
        <Link href="/#trabajo" className="link">
          {SITE.notFound.back}
        </Link>
      </p>
    </main>
  );
}
