import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE } from "@/data/site";
import "./globals.css";

/**
 * Schibsted Grotesk, one variable file (latin, wght 400–900, OFL): 900 display, 500 editorial,
 * 400 UI (Revelado 2.2 §3). The metric-adjusted fallback keeps the swap from shifting layout.
 */
const schibsted = localFont({
  variable: "--font-schibsted",
  display: "swap",
  weight: "400 900",
  adjustFontFallback: "Arial",
  src: "../fonts/schibsted-grotesk-latin-wght-normal.woff2",
});

/** IBM Plex Mono 400 for labels and metadata (Spec §29 Q6: kept, non-blocking) */
const plexMono = localFont({
  variable: "--font-plex-mono",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
  src: [{ path: "../fonts/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" }],
});

export const metadata: Metadata = {
  title: SITE.meta.title,
  description: SITE.meta.description,
  openGraph: {
    title: SITE.meta.ogTitle,
    description: SITE.meta.ogDescription,
    type: "website",
    locale: "es",
  },
  twitter: {
    card: "summary",
    title: SITE.meta.ogTitle,
    description: SITE.meta.ogDescription,
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * `.js` on <html> before first paint (Spec §24): CSS switches from the static layout to the
 * animated initial states only when it is present — without it nothing is ever hidden.
 * suppressHydrationWarning covers exactly that one attribute on <html>.
 */
const JS_GATE = "document.documentElement.classList.add('js')";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={SITE.lang} className={`${schibsted.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_GATE }} />
      </head>
      <body>
        <a href="#contenido" className="skip-link">
          {SITE.nav.skip}
        </a>
        {children}
      </body>
    </html>
  );
}
