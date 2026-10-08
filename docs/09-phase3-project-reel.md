# 09 · Phase 3 — Project Reel

Fecha: 2026-10-08 · Base: `main` @ `2cd753f` · Spec: *REVELADO — Master Implementation Spec* rev 37 (MIS), §26 fila "3 · Project Reel" (capítulo §06; además §04 estado, §05 scroll, §15 tiers, §16 RM, §17 media, §19 a11y). Copy: Content Master rev 26 §03 (nav), §05 (Selected Work), §16 (microcopy). Dirección: REVELADO 2.2 §7 (reel), §8 (cursor).

## 1. Resultado

El reel de cuatro piezas reales (TravelSuite360 · Rayo Smash · Santi Nuca · Chef Arturo):

- **Pieza activa protagonista** a la geometría compartida del Spec: 1094 px (76vw) a 1440, con un tope de 72svh de alto que reduce el ancho manteniendo el aspecto.
- **Vecinas** al 55 % y en gris, asomando 141 px a 1440.
- **Una pieza por gesto.**

Se navega con drag (mouse, pen, touch con bloqueo de eje), trackpad horizontal / Shift+rueda, teclado (← →, 1–4, Home/End, Enter), botones 01–04 y click en la vecina. La rueda vertical nunca se captura. El reel no sincroniza su índice en la URL (navegar el reel no es navegar, Spec §04); al pasar por la sección, la URL queda en `/`. Sin JS: la lista vertical de Phase 1. Con reduced motion: cambios instantáneos y flechas ← → visibles.

| Criterio de aceptación (MIS §26) | Cómo se verificó | Estado |
|---|---|---|
| La rueda vertical sobre el reel scrollea la página | e2e con eventos de rueda reales (`mouse.wheel(0, …)`): la página baja, el índice no cambia; unidad `horizontalDelta` | ✅ |
| Una pieza por gesto | e2e: un gesto de trackpad de 25 eventos mueve 1 pieza; drag largo, flick y swipe mueven 1; unidades `createWheelGesture`, `releaseIndex` | ✅ |
| Un solo `<video>` reproduciéndose | e2e cuenta `!paused` en cada pieza (≤ 1); unidad `reelVideoPlan` (ver §5: hoy no hay loops) | ✅ |
| Operación solo con teclado | e2e: foco en "Ver caso", →, "4", Home, End, Enter entra al mundo; el foco sigue al nuevo "Ver caso"; las vecinas quedan fuera del tab order | ✅ |
| axe limpio | e2e `@axe-core/playwright` en `/`, 0 violaciones serias/críticas en los 6 proyectos | ✅ |

## 2. Qué se hizo

**`components/reel/ProjectReel.tsx`** (cliente). `activeIndex` es estado React, porque cambia estructura: tab order, ciclo de vida del video y etiquetas. La posición del track es de GSAP. Cada asentamiento dura 420 ms con ease `settle` y lleva el atenuado de las vecinas (1 ↔ .55) en el mismo tween. Al completarse, el gris (`grayscale .6`, transición CSS de 200 ms) y el anuncio en la live region ("02 de 04 · Rayo Smash").

Entradas (Spec §06):
- **drag:** sigue al dedo 1:1, con resistencia .35 pasados los extremos; se suelta con 20 % del ancho o > 0,4 px/ms, una pieza como máximo;
- **touch:** `touch-action: pan-y` y bloqueo de eje a los 8 px; si el gesto es vertical, el reel lo suelta y la página scrollea;
- **rueda:** listener no pasivo que solo actúa con delta horizontal (o Shift + rueda);
- **click:** en la vecina la centra; en el frame activo entra al mundo; se ignora si el puntero se movió más de 6 px;
- **teclado:** escuchado en `document` solo con foco dentro del reel, o con foco en el body y el reel visible al ≥ 50 %; nunca en inputs, textareas, contenteditable ni dialogs;
- **botones 01–04.**

**`components/reel/ReelItem.tsx`.** Frame con `LoopVideo` sobre el poster real y meta compacta en dos líneas: "01 / 04" + nombre; categoría · rol + "Ver caso" / "Abrir ↗" (solo con URL confirmada). En Rayo va además la línea de relación. Las vecinas muestran "02 · Rayo Smash" (Content Master 05).

**Ciclo de vida del video** (`lib/reel.ts → reelVideoPlan`, tabla de §06):
- el `<video>` existe solo con el reel a menos de un viewport;
- la activa usa `preload="auto"` y reproduce solo con el snap completo; la siguiente usa `metadata`;
- una pieza a 2 o más de distancia conserva el video pausado 10 s y luego lo desmonta;
- nunca con RM ni Save-Data.

`LoopVideo` ganó el prop `mount`. El registro de un solo loop activo (`lib/media.ts`) sigue vigente.

**Geometría** en CSS desde el primer paint: el ancho por tier, el tope de alto por aspecto, el gap 8/24/32/32 y el centrado inicial del track. Así la hidratación solo mide y nunca mueve nada (el CLS sigue ≤ 0,02). El JS mide los anchos reales y aplica `trackOffset` (lib/reel), que coincide con `reelRect` de `lib/geometry`. El e2e verifica que el frame activo sea exactamente ese rectángulo en los 6 viewports.

**`components/reel/ReelCursor.tsx`.** Aro de 22 px + palabra: "Arrastrá" sobre el reel, "Ver" sobre el frame activo, → / ← sobre las vecinas. Es un solo elemento movido con `gsap.quickTo`, sin estado React por frame. Solo para punteros finos; nunca en touch ni con RM. Reemplaza al `components/system/Cursor.tsx` de ENSAMBLE, del que se tomó el patrón rAF/quickTo; ese archivo se retiró.

**Heading "Cuatro productos."**: mask-up de 600 ms, una sola vez, cuando el tope del reel llega al 80 % del viewport (sin animación en RM).

**Mobile (sm).**
- Una pieza por pantalla, frame 358×420 a 18svh, vecinas de 8 px.
- Swipe, tap para entrar e indicador de cuatro marcas; las etiquetas quedan para lectores de pantalla.
- La meta va en flujo bajo el frame; en teléfonos bajos el escenario crece en vez de recortarla.

## 3. Correcciones de QA hechas en esta fase

1. **axe `list`**: el Spec pone `role="group"` en el `<li>`, y eso rompe la lista ordenada. El grupo pasó a un contenedor dentro del `<li>`, así se conservan la lista y el grupo.
2. **Drag corto contado como flick**: la velocidad ahora se mide sobre los últimos 100 ms *hasta el instante de soltar*. Un dedo que se detuvo antes de levantar no tiene velocidad.
3. **Hint vs "Ver caso" en md**: el hint de teclas se muestra solo desde lg y con puntero fino.
4. **Mini-labels de vecinas**: se rompían en la franja de 37 px de md y asomaban cortados en los 8 px de sm. Ahora solo aparecen desde lg y se ajustan al ancho de la franja.
5. **Meta recortada en teléfonos bajos** (375×667, Rayo con su línea de relación): meta y marcas en flujo, con el escenario en `min-height: 100svh`.
6. **`REEL_SIZES` exportado desde un módulo cliente**: los componentes de servidor (mundos, pruebas) habrían recibido una referencia de cliente en vez del string. Se movió a `lib/reel.ts`.
7. **Preload de imagen sin usar en deep links a 320 px** (warning intermitente de producción): el poster del mundo de destino queda con `loading="eager"`, sin `fetchPriority`.
8. **`setPointerCapture`** protegido para punteros que ya no están activos.

## 4. Decisiones

1. **Cursor "Arrastrá" en vez de "DRAG"** (REVELADO 2.2 §8). El Content Master §03 no admite etiquetas de interfaz en inglés y gana en copy; "arrastrá" es su propio verbo para esa acción (§05, §16). "Ver" y las flechas no cambian.
2. **El índice 01–04 a la derecha, bajo el frame activo**, alineado a su borde y en la fila del nombre: "abajo" (REVELADO 2.2 §7) sin chocar con la meta en pantallas bajas (1366×768 deja 107 px). El nombre del proyecto aparece al hover/foco (Content Master 03) y siempre forma parte del nombre accesible del botón ("02 · Rayo Smash").
3. **Hints**: "Arrastrá o usá ← →" hasta la primera interacción (Content Master 16) y "arrastrá · ← → · 1–4" después (Content Master 05, "reposo").
4. **Entrar al mundo** desde el frame activo o "Ver caso" navega por ahora a `/trabajo/{slug}`: carga completa y salto del deep link. El salto continuo en el journey (`pushState` + estado SCREEN, sin corte) es Phase 4.
5. **Fin de gesto de trackpad: 240 ms de silencio** (las colas de inercia emiten de forma continua). La temporización se prueba con unidades. El e2e despacha el gesto en ráfaga dentro de la página, porque los eventos sintéticos llevan la hora de creación y una máquina cargada abriría huecos que un trackpad real no tiene.
6. **Flechas ← → solo en reduced motion** (Spec §06). Fuera de RM las cubren el teclado y los botones 01–04.

## 5. Pruebas

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` / `npx eslint` | ✅ 0 / 0 |
| `npm run build` | ✅ |
| `npx vitest run` | ✅ 83/83 (`reel` 11 nuevos) |
| `npx playwright test` | ✅ 183 passed · 87 skipped (pruebas que no aplican a un proyecto: rueda/mouse en touch, swipe en desktop, cursor en touch/RM, opening fuera del proyecto de referencia) |
| Dev server | sin warnings de hidratación. El aviso de LCP que aparece al scrollear toda la página por script es un artefacto: sin input real, el navegador sigue actualizando el LCP |

`tests/reel.test.ts`: offsets del track (incluida la igualdad con `reelRect`), resistencia, velocidad hasta el release, umbrales de soltado, delta horizontal (la rueda vertical nunca), un gesto = un paso y ciclo de vida del video.

`tests/e2e/reel.spec.ts`:
- geometría y overflow;
- rueda vertical, gesto de trackpad, drag (corto, largo y flick) y click en vecina/activa;
- cursor;
- swipe táctil (horizontal y vertical) y cuatro marcas;
- teclado, tab order, botones 01–04 y live region;
- videos ≤ 1, placeholder de TS sin capturas;
- axe, RM y sin JS.

QA visual y grabaciones locales en `qa/phase3/` (fuera de git): 1920, 1440, 1366, 768, 390 y 375, más RM, sin JS y el cursor.

## 6. Assets pendientes

| Clave | Falta | Efecto hoy |
|---|---|---|
| `ts.reel.poster` | captura de TravelSuite360 con datos demo + checklist §23 (dos firmas) | la pieza 01 es el placeholder honesto (**bloquea el lanzamiento**) |
| `{ts,rayo,santi,chef}.reel.loop` | loops de 3–6 s, seamless, muted, primer frame = poster | posters solos (permitido en producción). El ciclo de vida del video está implementado y probado por unidad, pero no se pudo ejercitar con un video real |
| posters mobile 358:420 propios | recortes verticales | se usa la misma captura con `object-position` centrado |

## 7. Próximo paso

**Phase 4 · World system** (MIS §07, §20): `WorldScene` con SCREEN → ISOLATE → ESCAPE → EXPAND, `ProjectProof`, `ProofMedia`, el salto continuo reel → mundo con `pushState`, Back al reel, `/trabajo/[slug]` sin flash y `ReelOverlay` (01–04).
