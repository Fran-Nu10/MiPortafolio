# 28 · Servicios, showreel y hero mobile, copy de producción

**Datos de la intervención:**
- **Fecha:** 2026-10-26.
- **Pedido de Franco:** «REVELADO 2.2 — FINAL UX & SERVICES REBUILD».
- **Base:** `a88ec35`, que es `HEAD` y también `origin/main`.
- **Entrega:** commits locales, sin push ni deploy.
- **Copy:** Content Master §26.

## 1. Servicios (reemplaza a Capacidades)

**Retirado por completo:**
- el índice editorial: `CapabilitiesIndex`, `lib/capabilities-index.ts` y `data/capabilities.ts`;
- los tipos `Capability`, `EvidenceSlotVariant` y `EvidenceElement`;
- el escenario compartido y las seis escenas con material de los proyectos;
- las referencias a proyectos dentro de cada capacidad;
- todo su CSS (`.cx-*`, `.cs-*` y sus keyframes, ≈ 740 líneas);
- su lógica de scroll (la línea de lectura y `useWide`);
- `tests/capabilities.test.ts` y `tests/e2e/capabilities.spec.ts`. Las pruebas del Perfil que vivían ahí pasan a `tests/profile.test.ts` y `tests/e2e/profile.spec.ts`.

Las utilidades que usan otras secciones quedan: `splitPurchaseLine`, `TS_KEY_WORDS`, las capas de Rayo, `Cutout` y `Still`. No había ScrollTriggers propios que limpiar, porque el índice usaba un listener de scroll que se fue con el componente.

**Nueva sección** (`#servicios`, `components/services/Services.tsx`, `data/services.ts`):
- **Copy:** «Servicios» como eyebrow, el titular «Lo que puedo crear para vos.», el subtítulo y los ocho servicios con el texto aprobado, sin agregados.
- **Cada fila:**
  - un número pequeño en azul (mono);
  - un nombre grande (24–30 px en teléfono, 28–40 px en desktop);
  - un separador fino;
  - un indicador «+» que pasa a «−».
- **Lo que no tiene:** imágenes, videos, tarjetas, paneles, 3D, scroll horizontal ni pin.
- **Disposición:**
  - **Desktop:** dos columnas de cuatro (dos `<ol>`, el segundo con `start="5"`). Así, al abrir una fila no se reacomodan las de la otra columna.
  - **Teléfono y tablet:** una columna a todo el ancho útil.
- **Acordeón:**
  - un botón por servicio con `aria-expanded` y `aria-controls`;
  - uno abierto a la vez, el primero abierto al llegar;
  - click o tap para abrir o cerrar; Enter y Espacio nativos; ↑ ↓ Home End para moverse entre servicios;
  - foco visible (outline azul de 2 px);
  - **Apertura y cierre:** el alto se anima con `grid-template-rows` en 260 ms. El panel cerrado queda con `visibility: hidden`, así sale del árbol de accesibilidad. Bajo `prefers-reduced-motion` no hay transición.
  - Los objetivos táctiles miden al menos 64 px en teléfono y 80 px en desktop.
- **Sin JavaScript:** todas las descripciones se ven, porque los paneles colapsan sólo bajo `html.js`. `aria-expanded` se emite recién cuando la página puede abrir y cerrar, mediante `useSyncExternalStore` con snapshot de servidor en `false`. Así nunca anuncia «colapsado» un contenido visible.
- **Integración:**
  - va en el mismo lugar del recorrido: Una sola visión → Servicios → Propuesta;
  - el ancla es `/#servicios`, y la vieja `/#capacidades` sigue llevando ahí (`route-sync`);
  - el último caso cierra con «Siguiente → Servicios»;
  - `SectionId`, `projects.next` y los tipos están actualizados.

## 2. Showreel mobile: la primera tarjeta

- **Síntoma:** en la captura de iPhone, la tarjeta de TravelSuite360 quedaba angosta y corrida a la derecha, con una banda negra a la izquierda.
- **Causa raíz:**
  - en teléfono la pista centraba la tarjeta activa: `trackOffset` es `(vw − W)/2 − Σ`, y la posición inicial en CSS es `translateX((100vw − W0)/2)`;
  - además, el ancho de la tarjeta lo limitaba un tope de alto (64 svh);
  - en el Safari real, con sus barras, svh es mucho menor que el alto de la ventana: una película 9:16 quedaba de ~240 px de ancho en 390, centrada.
- **Corrección estructural**, sin márgenes negativos:
  - en teléfono la tarjeta arranca en el gutter: `trackOffset(…, inset)` en `lib/reel.ts`, con el inset leído de `--reel-inset` en `ProjectReel.measure`, y `translateX(var(--reel-inset))` en CSS;
  - ocupa el ancho útil: `--reel-w: 100vw − 2·gutter − 24 px`, con el aspecto de su película y sin tope de alto. Queda a la vista una franja de la siguiente.
  - Las variables se redefinen sólo dentro de `.reel`, así el rectángulo compartido del SCREEN de los casos no cambia.
- **El título** va en flujo, 16 px sobre la tarjeta. Antes estaba en una banda de 18 svh. Ahora tiene 40–72 px de aire desde el hero.
- **Medido** (tarjeta 1 y tarjeta 2, borde izquierdo y ancho):

| Viewport | Borde izquierdo | Ancho | Alto |
|---|---|---|---|
| 320 × 568 | 16 px | 264 px | 469 px |
| 375 × 667 | 16 px | 319 px | 567 px |
| 390 × 844 | 16 px | 334 px | 594 px |
| 430 × 932 | 16 px | 374 px | 665 px |

- **Sin cambios:** los videos (ni recodificados ni recortados), el Chef 716 × 840 con su propio aspecto, la navegación táctil, el teclado, los 01–04 y desktop.

## 3. Hero mobile

**Causa:**
- el nombre medía 26vw en cualquier alto;
- FRA/NCO arrancaba a header + 6 svh y en H2 subía 6 % del alto: en el iPhone terminaba bajo el header, cortado;
- NÚ/ÑEZ dependía del alto del retrato, y en teléfonos con svh corto chocaba con el descriptor y la propuesta;
- el título del reel quedaba a ~14 px de la propuesta.

**Composición nueva** (sólo teléfono, `max-width: 767.98px`; desktop sin cambios):
- **El nombre se dimensiona por el alto disponible:** `--hero-size: min(26vw, (100svh − header − 300px) / 3,9)`. Los cuatro renglones caben bajo el header y dejan ~300 px para el descriptor y la propuesta.
- **FRA/NCO** arranca a header + 2 svh + 14 px.
- **NÚ/ÑEZ** va justo bajo NCO (`first-top + 2,02 em`).
- **El retrato** cubre de NCO al pie de ÑEZ.
- **H2:** en teléfono los nombres se separan menos (sube 2 % y baja 1,5 %, contra 6 % y 4 % en desktop). La propuesta sigue creciendo sólo hasta donde no toca a ÑEZ (`headroom`).
- **Validado** a 320 × 568 (composición estática, viewport tiny), 375 × 667, 390 × 844 y 430 × 932, en O2, H1, H2 y la salida (`docs/assets/services/hero-all.jpg`).
- El retrato sigue siendo el placeholder honesto, que es bloqueante de lanzamiento.

## 4. Copy de producción

**Auditoría:** un script recorrió la home y los cuatro casos a 1440 y 390, cada medio viewport. Juntó todo texto visible con su sección y su tipografía (`qa/svc` y `qa/blue/copy-*.txt`, no versionados).

**Retirado:**
- de THE SHIFT, la leyenda «Interfaz conceptual, diseñada para esta sección.»;
- de THE SHIFT, las tres anotaciones del acto IV: «Retícula de N columnas», «Tipografía: Schibsted Grotesk» y «Estado: publicado». Se fueron con sus tweens, su CSS y su copy;
- de la interfaz conceptual, su numeración decorativa: el eyebrow pasa de «01 — Producto» a «Producto», y salen el «01» del póster y los 01/02/03 de los módulos;
- el «01» del hero como etiqueta permanente. El índice es la señal de la apertura («00» en O2, «01» en el tic de O3) y se retira en H1. La composición estática (sin JS, reduced motion, tiny) no lo muestra.

**Se conserva**, porque cumple una función:
- los estados de las interfaces de TravelSuite360 («interpretado», «reserva confirmada», «→ reporte actualizado · sin intervención»);
- los créditos («Fotografía · Santi Nuca»), los roles y el stack de Prospector;
- los placeholders honestos de las pruebas pendientes, que describen qué falta;
- la ayuda del reel («Arrastrá o usá ← →»), el índice «01 / 04» de las tarjetas y los 01–04 de navegación;
- las etiquetas del formulario;
- el `aria-label` que describe la interfaz conceptual a quien usa lector de pantalla.

**Sin huecos:** en teléfono, sin la leyenda de THE SHIFT quedaba un tramo negro antes de «Una sola visión». Su aire superior baja a 8 svh en teléfono; desde tablet sigue en 16 svh.

## 5. QA

| Verificación | Resultado |
|---|---|
| `tsc --noEmit` | ok, también en cada commit intermedio |
| ESLint (`src`, `tests`, `scripts`) | 0 problemas |
| `next build` + `check:assets` | ok. Sólo los avisos de siempre (pósters crudos y slots de `check:launch`) |
| Vitest | 214 / 214 |
| Playwright Chromium (15 proyectos) | 705 pasan y 1 falla en la corrida final; la falla pasó 6 / 6 aislada (ver abajo) |
| Playwright WebKit 1440 / 390 + Firefox 1440 (un worker) | 356 pasan y 1 falla; la falla pasó 6 / 6 aislada. La corrida anterior dio 357 / 357 |
| axe | sin violaciones serias ni críticas en Servicios (con un panel abierto y con todos cerrados), Perfil, THE SHIFT y casos |

**Matriz de los ocho viewports** (1920, 1440, 1024, 820, 430, 390, 375 y 320; con y sin reduced motion; `qa/svc/matrix.jsonl`):
- 0 errores de consola;
- 0 px de overflow, también después de un resize que cruza tier;
- CLS 0;
- la recarga en mitad de THE SHIFT conserva el lugar.
- **Falso negativo del chequeo:** con reduced motion, a 820, 430 y 390, el chequeo marcó falso. La sección estática, ya sin leyenda, mide 1,2 viewports y el punto de prueba caía fuera. Medido directo, la recarga conserva el `scrollY` exacto.

**Capturas** (`docs/assets/services/`):
- el hero en los cuatro teléfonos y en cuatro momentos;
- el reel en los cuatro teléfonos, con la primera y la segunda tarjeta;
- Servicios a 1440, 820 y 390;
- el estado final de THE SHIFT a 1440 y 390.

**Errores encontrados y corregidos:**
- la tarjeta del reel angosta y centrada en teléfono (§2);
- el nombre del hero bajo el header y contra el texto (§3);
- el hueco negro bajo THE SHIFT al retirar su leyenda (§4).

**Tests actualizados por la estructura nueva:**
- Capacidades → Servicios en anclas, orden de secciones, textos sin JS y el «Siguiente →» del último caso;
- el reel en teléfono, que ahora va alineado al gutter en lugar de centrado;
- THE SHIFT sin leyenda.
- Ninguna aserción se relajó.
- **Pruebas nuevas:** `services.spec`, `services.test` y la comprobación de que el índice viejo no deja rastros.

**Intermitentes** (registrados; pasan 6 / 6 en repetición aislada):
- «the address follows the visitor» (Propuesta, `rm-1440`), ya visto una vez en docs/27;
- «click: a neighbour comes to the center» (reel, `webkit-1440`), bajo la carga de la corrida cruzada.


## 6. Pendientes reales

1. **Safari e iOS reales:** las correcciones del reel y del hero se derivaron de las capturas de iPhone, pero se validaron en Chromium móvil y en el WebKit de Playwright. Falta mirarlas en un iPhone.
2. **El retrato del hero** sigue en placeholder: el bloque oscuro que se ve detrás del nombre es el lugar reservado.

## 7. Commits

Locales, sobre `a88ec35`, sin push ni deploy. Uno por intervención. El copy va primero porque `Journey.tsx` comparte una importación entre esa limpieza y Servicios; así cada commit compila por sí solo.

| Commit | Intervención |
|---|---|
| `978724d` | 4 · copy de producción: leyenda, anotaciones y numeración decorativa |
| `2c9fe7b` | 1 · Servicios reemplaza a Capacidades |
| `4f46cc9` | 2 · reel en teléfono: la primera tarjeta en el gutter, al ancho útil |
| `8ee44c6` | 3 · hero en teléfono |
| siguiente | documentación: este informe, capturas, Content Master §26, `CLAUDE.md`, `README.md` |

