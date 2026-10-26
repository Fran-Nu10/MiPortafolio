/**
 * Servicios (Content Master 26, approved by Franco on 2026-10-26): what can be built for the visitor,
 * eight services in his own words. They replace the six capabilities and their demonstration scenes
 * (docs/28 §1). Copy as approved: no technology, figure or result beyond what each line says.
 */
export interface Service {
  index: number;
  name: string;
  line: string;
}

export const SERVICES: readonly Service[] = [
  { index: 1, name: "Páginas web", line: "Sitios profesionales, landing pages, portfolios y páginas para marcas, negocios y profesionales." },
  { index: 2, name: "Tiendas online", line: "Shopify, tiendas de ropa, ecommerce, catálogos digitales y experiencias de compra." },
  { index: 3, name: "Sistemas a medida", line: "Plataformas de reservas, gestión de clientes, pedidos, ventas y procesos internos." },
  { index: 4, name: "Diseño y experiencia", line: "Identidad visual digital, interfaces modernas, diseño responsive y experiencias interactivas." },
  { index: 5, name: "Inteligencia artificial", line: "Asistentes inteligentes, automatizaciones, chatbots e integraciones para ahorrar tiempo." },
  { index: 6, name: "Aplicaciones web", line: "Aplicaciones y plataformas digitales personalizadas, con usuarios, paneles y funcionalidades propias." },
  { index: 7, name: "Publicidad en Meta Ads", line: "Campañas en Instagram y Facebook para llegar a personas interesadas en tus productos o servicios." },
  { index: 8, name: "Estrategia digital", line: "Planificación y mejora de la presencia digital, desde la idea inicial hasta el lanzamiento." },
];
