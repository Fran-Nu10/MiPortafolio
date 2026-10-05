import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const archivo = localFont({
  variable: "--font-archivo",
  display: "swap",
  src: [
    { path: "../fonts/archivo-narrow-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/archivo-narrow-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});

const plexSans = localFont({
  variable: "--font-plex-sans",
  display: "swap",
  src: [
    { path: "../fonts/ibm-plex-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
});

const plexMono = localFont({
  variable: "--font-plex-mono",
  display: "swap",
  src: [
    { path: "../fonts/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
});

const title = "Franco Núñez — Diseño y desarrollo de productos digitales";
const description =
  "Productos digitales, de la idea a producción: estrategia, diseño, ingeniería y lanzamiento. Desde Montevideo, Uruguay, para proyectos en cualquier país.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description: "Productos digitales, de la idea a producción. Estrategia, diseño, ingeniería y lanzamiento, ensamblados por una sola persona.",
    type: "website",
    locale: "es_UY",
  },
  twitter: {
    card: "summary",
    title,
    description: "Productos digitales, de la idea a producción.",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f2220",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
