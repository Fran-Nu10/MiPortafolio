# ASSETS MANIFEST · Selected Work

Fuente de verdad de los assets reales del portfolio. Complementa `01-documento-maestro-v1.md` y `02-selected-work-content-map-v2.md`.

Convención de nombres: `public/projects/<proyecto>/<proyecto>-<pantalla-o-momento>[-<estado>].png`
Todas las capturas son desktop, ~2550 × 1320 px, PNG original (sin recomprimir). Las versiones optimizadas (WebP, 1440 / 2×) se generan en build, no se versionan.

Regla: **ningún asset se inventa**. Si una pantalla no está capturada, se marca como pendiente y en el diseño queda como placeholder etiquetado.

---

## 01 · TravelSuite360 — `public/projects/travelsuite360/`

**Estado: PENDIENTE — sin capturas en el repo.**

Capturas necesarias (según Content Map V2, en orden de prioridad):

| Archivo esperado | Pantalla | Uso en el diseño |
|---|---|---|
| `travelsuite360-dashboard.png` | Dashboard | Slab frontal · Elevation (W-T2) · rack · mobile pan window |
| `travelsuite360-travelchat.png` | TravelChat / inbox | Módulo activo del rack (W-T3) |
| `travelsuite360-crm.png` | CRM | Rack |
| `travelsuite360-cotizaciones.png` | Cotizaciones | Rack |
| `travelsuite360-viajes-reservas.png` | Viajes / reservas | Rack |
| `travelsuite360-reportes-financieros.png` | Reportes financieros (Master Prompt V2) | Módulo 05 de la ventana |
| `travelsuite360-automations.png` | Automations | Módulo 06 de la ventana |
| `travelsuite360-usuarios-permisos.png` | Usuarios · permisos (opcional) | Capa 04 · data |

**V2:** cada captura se conecta en `src/data/projects.ts` → `modules[].capture` (import estático como
las demás). La ventana de Sheet 01 y la cara del hero la muestran en lugar del dibujo del módulo.
`travelsuite360-cotizaciones.png` puede ser la vista del AI assistant de cotizaciones.

También pendiente: stack real, rol exacto de Franco, nombre público, URL.

---

## 02 · Prospector — `public/projects/prospector/`

Demo real del template hamburguesería (marca demo: **RAYO SMASH**).

| Archivo | Original | Contenido | Uso en el diseño |
|---|---|---|---|
| `prospector-hero-exploded.png` | 144127 | Hero · hamburguesa explotada por capas · "CAPA POR CAPA" | W-P2 signature · mobile |
| `prospector-hero-exploded-scroll.png` | 144134 | Hero en scroll · capas separadas · aparece "CLÁSICA · $ 490" | W-P1/P2 estados intermedios |
| `prospector-hero-layer-detail.png` | 144146 | Capa (medallón + cheddar) a gran escala durante el scroll | W-P2 detalle · lens |
| `prospector-menu-tracklist.png` | 144152 | Menú "Hamburguesas" · tracklist 01–05 · producto activo CLÁSICA armada · Agregar | W-P3 proof |
| `prospector-product-clasica.png` | 144201 | Ficha de producto CLÁSICA · ingredientes · cantidad · Agregar · "También te puede gustar" | W-P3 (estado 2) |
| `prospector-section-plancha.png` | 144212 | Sección "Todo empieza en la plancha" · video/foto full bleed | Opcional · immersion |

Orden real de capas del hero (de arriba a abajo, según captura 144127): pan superior · bacon · medallón con cheddar · cebolla · medallón con cheddar · pan inferior. **Este orden reemplaza al esquema provisional del canvas.**

---

## 03 · Santi Nuca — `public/projects/santi-nuca/`

| Archivo | Original | Contenido | Uso en el diseño |
|---|---|---|---|
| `santi-nuca-opening.png` | 144644 | Apertura · "SANTI / NUCA" · retrato B&W · división vertical · "01/12 — Apertura · Índice" | W-S1 |
| `santi-nuca-work-01.png` | 144702 | Trabajo 01 · numeral + retrato B&W | W-S1 / mobile |
| `santi-nuca-work-02-diptych.png` | 144713 | Trabajo 02 · díptico B&W + color · "Editorial · Backstage" | W-S3 composición |
| `santi-nuca-work-03-detail.png` | 144727 | Trabajo 03 · "Detalle · Macro" · color | W-S3 |
| `santi-nuca-editorial-forma-linea-textura.png` | 144802 | Tríptico FORMA / LÍNEA / TEXTURA · "Estudio de corte" | W-S2 signature |
| `santi-nuca-work-04.png` | 144817 | Trabajo 04 · numeral naranja · "Retrato · Largo" | W-S3 índice |
| `santi-nuca-work-05.png` | 144824 | Trabajo 05 · "Noche · Flash" | W-S3 índice |
| `santi-nuca-work-06.png` | 144829 | Trabajo 06 · "Corte · Volumen" | W-S4 (última foto que viaja) |

Tipografía real: grotesca pesada para identidad/numerales (a confirmar el nombre de la fuente).

---

## 04 · Chef Arturo — `public/projects/chef-arturo/`

Marca: **CHEF Arturo · by Julia Montserrat**. Florida, Uruguay · retiro y entrega.

| Archivo | Original | Contenido | Uso en el diseño |
|---|---|---|---|
| `chef-arturo-hero.png` | 145231 | Hero · "Pastelería, merienda y *lunch* para fiestas" · CTAs · imagen arqueada pequeña | W-C1 |
| `chef-arturo-hero-expansion.png` | 145239 | Hero · la imagen crece, el copy retrocede | W-C2 (mid) |
| `chef-arturo-hero-fullbleed.png` | 145251 | Hero · fotografía de torta full viewport | W-C2 (end) |
| `chef-arturo-detalle-intro.png` | 145747 | "El detalle también forma parte del pedido" · imagen pequeña | W-C2 → C3 |
| `chef-arturo-detalle-expansion.png` | 145753 | Sección detalle · imagen creciendo | — |
| `chef-arturo-detalle-fullbleed.png` | 145758 | Sección detalle · full bleed con copy superpuesto | W-C2 alternativa |
| `chef-arturo-fechas-que-importan.png` | 145811 | "Fechas que importan" · Compra del día · Encargo con fecha · Lunch para eventos | W-C3 |
| `chef-arturo-elegi-tu-ocasion.png` | 150109 | "Elegí tu ocasión" · Pastelería · Merienda · Salados · Lunch para eventos | W-C3 (estado 2) |
| `chef-arturo-catalogo-merienda.png` | 150123 | Catálogo · Merienda · cookies · precios · Agregar | W-C4 (previo) |
| `chef-arturo-pdp-cookie-levain.png` | 150141 | PDP · Cookie Levain de pistacho y chocolate blanco · $ 120 · cantidad · stock del día · Mercado Pago · Agregar al carrito · Consultar por WhatsApp · Retiro y entrega | W-C4 · mobile |

Pendiente: captura del carrito (W-C5 sigue con placeholder), stack real.

---

## Pendientes globales

- TravelSuite360: todo.
- Carrito de Chef Arturo.
- Portrait real para About (`public/about/franco-portrait.png`, a definir).
- Nombres públicos definitivos, descripciones factuales, URLs y rol por proyecto.
