# 08 · Phase 2 — Opening + Hero

Fecha: 2026-10-08 · Base: `main` @ `2a12fcf` · Spec: *REVELADO — Master Implementation Spec* rev 37 (MIS), §26 fila "2 · Opening + Hero" (capítulos §02 S1, §03 hero stack, §15, §16). Copy: Content Master rev 26 §04 (hero) y §03 (nav). Dirección: REVELADO 2.2 §6 (hero), §13 (mobile), §14 (reduced motion).

## 1. Resultado

La escena S1 completa, sobre el markup estático de Phase 1, con el retrato todavía en placeholder (no existe material de Franco):

| Estado | Disparo | Qué pasa |
|---|---|---|
| **O0** | primer paint | negro + grano (tile 256 px, opacidad .06, `screen`, estático) |
| **O1** | tiempo (0,3 s) | se abre una banda de luz de 14 svh (`clip-path: inset(50%) → inset(43%)`, 0,9 s, ease `reveal`) |
| **O2** | tiempo | foco: LQIP → retrato nítido al decodificar (o LQIP a los 2,5 s del primer paint y cambio silencioso después); índice `00`; el header aparece |
| **O3** | gesto 1 | la banda se abre a pantalla completa; la línea roja (2 px) cruza una vez por el borde inferior; `00 → 01` con `steps(1)` |
| **H1** | gesto 2 | FRANCO detrás del cuerpo, NÚÑEZ delante y cortado por el borde; firma y línea de apoyo entran con mask-up escalonado |
| **H2** | gesto 3 | posicionamiento: retrato −12vh a .55, FRANCO −6vh, NÚÑEZ +4vh, la línea de apoyo crece hacia tamaño statement; luego se libera el pin |

Mobile (sm) es otro corte, no un reflow: FRA / NCO arriba, NÚ / ÑEZ abajo (REVELADO 2.2 §6), retrato 4:5. Reduced motion: dos estados (retrato nítido completo → nombres, firma, apoyo, índice 01), sin banda, sin línea roja, pin de 50vh. Sin JavaScript: la composición estática H1, legible.

| Criterio de aceptación (MIS §26) | Cómo se verificó | Estado |
|---|---|---|
| Primer paint < 1 s | e2e `opening.spec.ts` lee `first-paint` en el build de producción (más exigente que el "dev build" del Spec) | ✅ |
| Scroll durante O0–O2 salta a O3 | e2e + verificación manual con gestos en O0 y en O1: asienta exactamente en el label O3 | ✅ |
| Fallback de decode a 2,5 s | unidades (`tests/opening.test.ts`, timers falsos): decode antes / deadline primero + cambio tardío / decode fallido / cancelación | ✅ (ver §5: e2e real pendiente del retrato) |
| FRANCO detrás / NÚÑEZ delante en 320, 390, 768, 1024, 1440, 1920 | e2e con `elementFromPoint` en la intersección de cada nombre con el retrato | ✅ 6/6 |
| Sin overflow horizontal | e2e por viewport y estado, medido contra el ancho configurado | ✅ |

## 2. Qué se hizo

**Escena** — `components/opening/OpeningHero.tsx` pasa a cliente: un `useScene` con `gsap.matchMedia` (tiers + RM), labels `s:O2 · s:O3 · s:H1 · s:H2` y un hold final; 3,25 unidades de gesto (260vh en xl/lg, 227 en md, 195 en sm; 50vh en RM). `data-phase` en el stage refleja O0…H2 (Spec §04).

**Ventana en dos recortes** — la ventana del retrato son dos `clip-path` anidados: la banda (O0 → O1, por tiempo) recorta `[data-part=band]`; la apertura (O2 → O3, por scroll) recorta `[data-part=aperture]`. Lo visible es la intersección. Así nunca hay dos animaciones sobre la misma propiedad (ver §4.1).

**Primer paint sin JS** — la banda empieza como animación CSS en el primer paint (`html.js … [data-opening]:not([data-built]) .hero-band`). La escena lee el valor actual, lo fija inline y sigue en GSAP desde el mismo punto. Si la escena no se construye nunca, CSS muestra todo a los 4 s (nombres, copy, retrato, header): nunca una pantalla negra muerta.

**Línea de apoyo en H2** — se renderiza al tamaño lead y crece con `scale` hasta el tamaño statement del tier, limitado por el ancho del viewport y por el espacio libre bajo NÚÑEZ (medido en el build). Así no choca en pantallas bajas (1366×768). En mobile ya ocupa el ancho completo y solo sube.

**Header** — aparece en O2 (`heroRevealed` en el store, `opacity` 600 ms; 200 ms en RM). Si recibe foco por teclado se muestra siempre. Rescate a los 4 s.

**Deep links** — en `/trabajo/{slug}` el opening no se reproduce y el hero queda oculto (`visibility`) hasta el salto. Termina en H2, fuera de pantalla. Es lo mínimo para que no haya flash del opening; Phase 4 completa el arranque.

**Pipeline de media** — `scripts/media.mjs`:
- `grain`: tile 1-bit determinístico (mulberry32, semilla 360) de 7,3 KB, commiteado en `public/media/site/grain.png`; contrato `site.grain` → `derived`, con presupuesto de 8 KB en el checker.
- `cutout`: AVIF q50 + WebP q78 en 1x/2x con alpha, metadatos eliminados, más LQIP de 16 px (< 1 KB). Imprime el fragmento de contrato para pegar en `data/assets.ts`.

`media-src/` (masters) queda ignorado por git.

**Preload del retrato** — cuando `franco.hero` sea final, `<link rel="preload" as="image" type="image/avif" imagesrcset media fetchpriority="high">` por tier (React lo sube a `<head>`). El LQIP va inline bajo el cutout.

**`useScene`** (extensiones que la escena necesitó):
- `units(tier, rm)`;
- `onUpdate(progress)`;
- `api.onRevert(fn)`;
- el final del pin cuenta como parada del snap (pasado el último estado, un gesto libera el pin);
- tolerancia de labels ≈ 2 px de scroll (el snap aterriza en píxeles enteros);
- tras cada refresh de ScrollTrigger, si el visitante quedó quieto entre dos estados, completa el snap direccional (ver §4.3).

## 3. Correcciones de QA hechas en esta fase

1. **Tilde de Ñ y acento de Ú recortados** por la máscara (interlineado .82). La región de máscara se extiende un 30 % por arriba de la caja de línea.
2. **Línea de apoyo en 1366×768**: su crecimiento en H2 se limita por el espacio medido bajo NÚÑEZ.
3. **FRANCO en md/lg bajo el header en H2**: el arranque de FRANCO baja a header + 8svh (6svh en sm), así su subida de 6vh nunca llega al header.
4. **Índice "00" visible en O0**: ningún tween del timeline de scroll empieza en t=0.
5. **Tilde de NÚ/ÑEZ apilado en mobile**: interlineado .94 en sm.
6. **Overflow de 36 px a 320 px**: era el título "TravelSuite360" del esqueleto de mundos (Phase 1). El test de Phase 1 no lo veía porque la emulación mobile agranda `innerWidth`. Se corrigió el tamaño (`min(display, ancho/8.6)`) y el test de overflow ahora mide contra el ancho configurado.
7. **Retrato completo durante ~280 ms en O0 (mobile)**: la banda se fija inline antes de marcar `data-built`.
8. **Snap perdido si el gesto llega en los primeros ~100 ms** (lo cancelaba el refresh coalescido): ver §4.3.
9. **Timeline de 3,2 en vez de 3,25 unidades**: el hold quedaba fuera de su label.
10. **Warning de LCP en deep links**: el poster del mundo de destino carga `eager` + `fetchPriority="high"`. En Next 16 `priority` está deprecado.

## 4. Decisiones técnicas

1. **Por qué dos recortes anidados.** Probé dos variantes. (a) Banda y apertura en el mismo elemento, banda en GSAP: el tween de la banda reescribía `inset(43%)` después del render del scrub y la apertura quedaba cerrada aunque el scroll avanzara (bug reproducible). (b) Banda solo en CSS: ScrollTrigger re-parenta la sección al crear o refrescar el pin (pin-spacer), y eso **reinicia las animaciones CSS** de sus hijos (`AbortError`): la banda se reiniciaba o el opening se saltaba. Con dos elementos, cada uno tiene un único dueño.
2. **"Rises to statement size" (Spec §02 H2)**: lo interpreté como crecimiento por `scale` hasta el tamaño statement del tier, limitado por el espacio disponible. Escalar a ciegas 2,9× desbordaría el viewport o chocaría con NÚÑEZ. En mobile solo sube.
3. **Snap tras refresh.** Un `ScrollTrigger.refresh()` cancela el snap pendiente. Si al terminar el visitante quedó entre dos estados y lleva 200 ms sin scrollear, `useScene` hace `scrollTo` suave al estado siguiente en la dirección del gesto. Nunca interviene durante un gesto ni toca la rueda.
4. **Viewports diminutos** (< 360 de ancho o < 560 de alto, incluidos teléfonos apaisados): sin pin ni opening, composición estática (Spec §24).
5. **El opening se reproduce una vez por carga.** Si la página carga ya scrolleada (reload a mitad del hero) o es un deep link, el hero arranca en O2 sin reproducirse sobre la página.
6. **Longitud del gesto**: con `GESTURE_VH` sm = 60, un swipe largo en mobile (> 60 % de alto) pasa un estado, que es el comportamiento direccional del Spec (§05). El valor lo aprueba Franco en dispositivo (Spec §29 Q8).
7. **Índice**: "00" en gris (opening) y "01" en rojo (Content Master 04). Ambos son decorativos (`aria-hidden`); el nombre accesible es el `<h1>` sr-only.

## 5. Pruebas

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` / `npx eslint` | ✅ 0 / 0 |
| `npm run build` | ✅ (`check-assets`: 40 contratos · 4 derived · 36 placeholder) |
| `npx vitest run` | ✅ 72/72 (`content` 37 · `foundation` 24 · `opening` 11) |
| `npx playwright test` | ✅ 101 passed · 67 skipped (el spec de opening fija su propio viewport y corre solo en el proyecto de referencia; rueda en mobile no aplica) |
| Dev server: `/`, `/` 390, `/` RM, deep link | sin warnings de hidratación. Un aviso de LCP solo en dev en deep links es un falso positivo: el poster del mundo comparte `src` con el del reel y la prueba, y Next indexa el chequeo por `src` |

`tests/opening.test.ts` cubre:
- helpers del opening;
- carrera decode/deadline;
- grano determinístico e igual al commiteado;
- cutout AVIF/WebP con alpha y LQIP < 1 KB, sobre un master sintético de formas planas (nunca una foto).

`tests/e2e/opening.spec.ts` cubre:
- O0 → O1 → O2 en tiempo, el header solo después de O2 y el primer paint;
- el scroll durante el opening;
- O3, H1 y H2;
- las capas en 6 anchos;
- RM, sin JS, reload a mitad del hero y deep link.

**Pendiente con el retrato real**: el fallback de 2,5 s solo se puede ejercitar de punta a punta con un cutout real (throttling de red). Hoy la lógica está probada con timers falsos y el placeholder no tiene nada que decodificar.

QA visual (capturas y grabaciones locales en `qa/phase2/`, fuera de git): 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 390×844, 375×667 y 320×568, más RM y sin JS.

## 6. Assets pendientes

| Clave | Falta | Efecto hoy |
|---|---|---|
| `franco.hero` (desktop + mobile 4:5) | cutout con alpha ≥ 2400 px, B&N, luz dura, fondo negro (REVELADO 2.2 §15) | **bloquea el lanzamiento**. La banda muestra una franja del placeholder; el "foco" O2 no tiene nada que enfocar; con el placeholder opaco, FRANCO queda tapado donde el cuerpo real dejaría verlo por su alpha |
| `og.home` | 1200×630 FRANCO / NÚÑEZ | sin og:image |

Para integrar el retrato: `node scripts/media.mjs cutout --key franco.hero --tier desktop --in <master> --out public/media/franco/hero --height 1100` (y `--tier mobile`). Después se pegan `files` + `lqip` en el contrato y su `status` pasa a `"final"`. Ni la escena ni el CSS cambian.

## 7. Próximo paso

Revisión visual de Franco de esta fase (grabaciones en `qa/phase2/`). Después, **Phase 3 · Project Reel** (MIS §06): `ProjectReel`, `ReelItem`, `LoopVideo` en el reel, cursor.
