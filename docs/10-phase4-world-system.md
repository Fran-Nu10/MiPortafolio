# 10 · Phase 4 — World System

Fecha: 2026-10-08 · Base: `main` @ `b0ffd44` · Spec: *REVELADO — Master Implementation Spec* rev 37 (MIS), §26 fila "4 · World system" (capítulos §07 y §20, hoja de prueba de §02; además §05 scroll, §06 "Entering a world", §16 RM, §19 overlay 01–04, §22 contratos de assets). Copy: Content Master rev 26 (sin cambios de copy en esta fase). Dirección: REVELADO 2.2.

## 1. Resultado

La arquitectura compartida que lleva del Project Reel a cada mundo y de vuelta. Es **una sola** gramática para los cuatro proyectos (`WorldScene`), y cada mundo aporta sólo datos: su objeto, su ancla en el poster, su `escapeTo` y su entorno.

**Gramática.** SCREEN → ISOLATE → ESCAPE → EXPAND → WORLD, en dos gestos y sin cortes.

**Objeto de prueba por proyecto** (los objetos finales llegan en las Phases 5–8):
- TravelSuite360: el texto vivo del mensaje.
- Rayo, Santi y Chef: un recorte de su propio poster real, en el lugar exacto que ocupa en el poster.

**Navegación** (todo sobre el mismo documento, sin `router.push`):
- entrada desde el reel con `pushState` y salto invisible;
- Atrás/Adelante a la posición exacta;
- deep links `/trabajo/{slug}`, que arrancan en SCREEN sin flash del opening;
- `replaceState` mientras se scrollea;
- overlay 01–04 en el header;
- "Siguiente →" entre mundos.

Escenas completas de cada mundo (TS00–TS12, capas de Rayo, editorial de Santi, macro de Chef): **no** se adelantaron.

| Criterio de aceptación (MIS §26) | Cómo se verificó | Estado |
|---|---|---|
| "Ver caso" visualmente continuo: diff de screenshot frame del reel vs SCREEN ≤ 1 % de píxeles | e2e `world.spec.ts` · "the shared rectangle": por proyecto y tier, el frame activo del reel contra el SCREEN del deep link, comparación estricta (umbral 24/255 por canal, sin blur); el rectángulo coincide a ≤ 1 px; control negativo: la misma imagen 3 px más abajo **debe** fallar | ✅ peor caso 0,84 % (Santi, 1440); control 3–17 % |
| `/trabajo/{slug}` carga en el mundo sin flash del opening | e2e: `main[data-started]` sólo tras posicionar; stage en el top, `data-state=SCREEN`; e2e Phase 2 "a deep link starts at the world" sigue verde | ✅ |
| Atrás vuelve al reel | e2e: tras entrar y llegar a WORLD, `goBack()` → `/`, misma `scrollY`, mismo índice activo, sin recarga (marcador en `window` intacto); `goForward()` vuelve al mundo | ✅ |
| `replaceState` al scrollear, sin spam de historial | e2e: recorrer los cuatro mundos cambia la URL y no `history.length`; e2e Phase 1 "scrolling replaces the URL" | ✅ |

## 2. Arquitectura implementada

**`lib/world.ts` (puro).**
- `WORLD_UNITS` = 2,5 (SCREEN 0 · ISOLATE 1 · WORLD 2 · hold), `WORLD_UNITS_RM` = 1.
- `spaceRect`: el espacio de diseño 1440×900 / 390×844, escalado y centrado.
- `escapeRect(worldType, tier, viewport, objeto)`: dónde aterriza el objeto al final de EXPAND (primer estado del mundo):
  - TS: el mensaje en TS01, x 160 centrado (sm x 24, y 300);
  - Rayo: 62 % del alto del espacio (sm 70 % del ancho);
  - Santi: 78 % del alto (sm ancho completo, ≤ 62 % del alto);
  - Chef: cover a sangre, la imagen es el entorno.
- `flip(from, to)`: translate + escala uniforme con `transform-origin 0 0`. Nunca hay posiciones hardcodeadas en los tweens.

**`components/worlds/WorldScene.tsx`** (cliente; estructura de MIS §07): `section[data-world][data-state]` > `h2` (sr-only con JS) > `.world-pin` > `.world-stage` (100svh), con:
- `env`: plano de color, opacidad 0 en SCREEN;
- `screen`: el mismo poster que el reel, al rectángulo compartido;
- `screen-dim`;
- `object`: fuera del clip del screen, para poder escapar.

Después vienen el crédito (Santi), en flujo normal, y la copia del mundo, legible.
- **Rectángulo compartido en CSS desde el primer paint:** el stage define `--w/--h/--sx/--sy` con las mismas variables `:root` que el reel (Phase 3), y el objeto se ubica con `calc(--sx + --ax·--w)`. Ni el salto desde el reel ni un deep link mueven nada al hidratar.
- **Timeline** (`buildWorld`):
  - el objeto aparece en t = 0,01 (antes es invisible, así SCREEN es idéntico al reel);
  - ISOLATE: `screen-dim` 0 → .75;
  - ESCAPE (1 → 1,45): el objeto va de `anchor × screenRect` a `escapeRect` y el screen pasa de 1 a .92;
  - EXPAND (1,45 → 2): `env` 0 → 1 y `screen` 1 → 0;
  - ease `settle`, scrub .6, snap a `s:` labels.
- **RM:** tres estados instantáneos (SCREEN → objeto grande en su entorno con el screen oculto → mundo), sin viaje.
- **Viewports diminutos** (< 360 × 560): layout estático de Phase 1.

**`lib/useScene.ts`** (extendido, compartido por todas las escenas):
- registro `getScene` / `sceneScroll(id, label)`, para que la navegación pregunte "dónde empieza Rayo" o "dónde está su `s:ISOLATE`" sin conocer largos de pin;
- modo `pin: "sticky"`: el stage es `position: sticky` dentro de `.world-pin`, que recibe el largo del pin como alto, y ScrollTrigger sólo scrubea (ver §3, CLS);
- tolerancia de snap de 2 px en progreso;
- reposicionamiento del estado tras cada `refresh`.

**`lib/journey-nav.ts`** (nuevo, cliente; MIS §06 "Entering a world", §20):
- `navigate(section)` sigue tres pasos:
  1. `replaceState` de la entrada actual con `{ section, y }`, para que Atrás vuelva exacto;
  2. `pushState('/trabajo/{slug}')`;
  3. salto instantáneo al SCREEN del mundo, y en el frame siguiente scroll nativo suave hasta `s:ISOLATE`, un gesto. Con RM, corte directo a `s:WORLD`.

  Desde el reel, el salto conserva el desfase del stage del reel si el visitante lo dejó por debajo del top, así sigue siendo el mismo rectángulo.
- El historial guarda sólo estado propio `{ section, y }`. Next.js parchea `history.*` y vuelve a añadir sus internals (`__NA`, árbol), así que Atrás/Adelante restauran el mismo árbol **sin remount ni recarga**.
- `installHistory` (popstate → salto instantáneo a la `y` guardada).
- `trackScrollPosition` guarda `y` con debounce de 300 ms, para que una recarga mantenga el lugar.
- `syncUrl` usa sólo `replaceState`.
- `sectionForHref` decide qué links son del journey.

**`lib/route-sync.ts`** queda puro: el mapeo sección ↔ URL, usado también en el servidor. Un fragmento de ancla gana sobre el path (`#perfil` es Perfil en cualquier URL del journey). Cualquier otro fragmento es del navegador: el skip link `#contenido` y el "Ir a …" sin JS.

**`components/journey/JourneyClient.tsx`** (reescrito):
- delegación de clicks en fase bubble para todos los links internos (reel, overlay, "Siguiente →", header, capacidades), respetando `defaultPrevented`, modificadores, `target` y `download`; la activación por teclado mueve el foco a la sección;
- arranque: deep link → SCREEN; recarga → la posición recordada; `scrollRestoration` manual sólo en esos casos;
- `main[data-started]` mantiene el hero fuera de vista hasta posicionar.

**`components/worlds/ProjectProof.tsx`** (cliente; hoja de prueba de MIS §02):
- la ventana del proof va en el rectángulo compartido de su proyecto en lg/xl, y en una ventana 16:9 en md/sm;
- recorrido: escala .9 → 1 en el primer 40 % y atenuado a .55 en el último 30 % (la salida genérica; la costura roja TS → Rayo es TS12, Phase 5);
- `ProofMedia` sigue con placeholders honestos donde no hay media.

**`components/layout/ReelOverlay.tsx`** (nuevo; MIS §19): "Trabajo" en el header abre un `<dialog>` nativo con `showModal()`, que da el trap de foco, Esc y la página inerte.
- Muestra cuatro miniaturas (2 × 2 en sm), con `aria-current` en rojo sobre el proyecto actual.
- Al abrir, el foco va al proyecto actual; al cerrar, vuelve a "Trabajo".
- Elegir un proyecto cierra el diálogo y navega con `pushState` + el salto.
- Sin JS, "Trabajo" es un link a `#trabajo`.

**`data/assets.ts`:** `anchorRect` desktop/mobile en `meta` de los cuatro posters (ver §6: provisionales).

## 3. Problemas corregidos durante el QA

1. **CLS 6–8 al recorrer la página.** El pin de ScrollTrigger usa `position: fixed`, y cada entrada o salida de los cuatro pines tras un salto de scroll contaba como layout shift (≈ 1,0 cada una). Probado en aislamiento: `position: sticky` da CLS 0. Por eso el modo `pin: "sticky"` en `useScene`, que usan todos los mundos. El opening conserva su pin de Phase 2: arranca en 0 y su test ya pasaba.
2. **El snap saltaba un estado.** Un salto a un label cae en un píxel entero, a veces una fracción *después* del label. Con una tolerancia fija de 1e-4 en progreso, el snap direccional lo llevaba al estado siguiente:
   - un deep link terminaba en ISOLATE;
   - una recarga en WORLD terminaba al final del pin.

   Ahora `snapToStop` recibe la tolerancia en píxeles (2 px), y tiene un test unitario.
3. **SCREEN medio píxel corrido.** Un inicio fraccionario redondeaba a una posición justo *antes* de que el stage se pegara: Santi a 820 px con 1,04 % de diff, todo el resto de la imagen 0,4 px abajo. La navegación ahora aterriza en el primer píxel entero dentro del pin sticky, y el snap de vuelta a SCREEN también.
4. **`data-state` desfasado tras una recarga.** El `refresh` de ScrollTrigger renderiza el timeline con los eventos suprimidos, así que la animación estaba en WORLD con el estado en SCREEN. Ahora el estado se reposiciona tras cada refresh.
5. **Selectores CSS rotos por el pin-spacer.** Los `:has(> .world-stage)` dejaban de coincidir cuando el pin envolvía el stage (stage corrido unos 290 px). Se reemplazaron por selectores descendientes.
6. **El skip link `#contenido` se interpretaba como "ir al mundo".** Los fragmentos desconocidos ahora devuelven `null`.
7. **ESLint `no-html-link-for-pages`.** Los links del header pasaron a ser anclas de hash; la marca es un `<a href="/">` documentado.
8. **Viewports diminutos.** El mundo estático ahora aterriza bajo el header fijo, como las demás secciones ancladas. Antes el nombre quedaba tapado. Se actualizó el test de Phase 1.

## 4. Decisiones

- **El reel no se pinea** (decisión de Phase 3), así que su stage queda en la posición fraccionaria que dicte el documento. Un mundo en cambio se pega exacto al píxel. Chrome ajusta las filas de cada imagen a píxeles de dispositivo, así que un frame 0,2 px fuera de la grilla dibuja su imagen una fila más alta: es invisible, pero un diff estricto lo mide.
  - Para medir el criterio, el test empuja la sección del reel menos de 1 px y lo documenta.
  - La comparación es estricta (sin blur) y lleva un control negativo para que la métrica no sea vacua.
  - En uso real la diferencia es ≤ 1 fila en la mitad inferior del frame.
- **Objetos de prueba = recortes del poster real** (Rayo, Santi, Chef): mismos píxeles, nada inventado. Aparecen en t = 0,01, así que en SCREEN la imagen es una sola.
- **TravelSuite360 en SCREEN es el placeholder honesto**, porque no hay captura aprobada (§23). El mensaje aparece en ISOLATE sobre el screen oscurecido; su alineación real con la captura llega con el asset.
- **Proofs:** rectángulo del proyecto en lg/xl; 16:9 en md/sm, porque la mayoría de las capturas de producto son apaisadas y el retrato 358:420 recortaría la UI.
- **Sin dependencias nuevas.** Sin `router.push`. Sin captura de la rueda: el overlay es el único momento en que la página no scrollea (modal, MIS §05).

## 5. Pruebas

| Suite | Resultado |
|---|---|
| `npx tsc --noEmit` | limpio |
| `npm run lint` | limpio |
| `npm run build` | ok · `/`, `/trabajo/{4 slugs}` SSG |
| `npx vitest run` | 5 archivos · **94 tests** ✅ (nuevo `tests/world.test.ts`: espacio de diseño, `escapeRect` por mundo/tier, FLIP, largos, anclas válidas por poster; `foundation`: prioridad de anclas en `sectionForLocation`, tolerancia de snap) |
| `npx playwright test` | 6 proyectos (xl-1440, lg-1366, md-820, sm-390, sm-320, rm-1440) · **242 passed, 94 skipped, 0 failed** (los skips son por diseño: inputs de escritorio en mobile, tiny, RM) |

**`tests/e2e/world.spec.ts`** (nuevo, 11 tests × 6 proyectos):
- rectángulo compartido (diff ≤ 1 % + control);
- el salto conserva el rectángulo aun con el reel fuera de su reposo;
- "Ver caso" → una entrada de historial → ISOLATE → WORLD; Atrás al reel en la misma pieza y posición sin recarga; Adelante;
- deep link en SCREEN, y recarga en WORLD que mantiene el lugar;
- "Siguiente →";
- scroll sin entradas de historial;
- gramática: opacidad de dim/env/screen, centro y alto del objeto según `escapeRect`;
- axe en `/trabajo/santi-nuca`;
- overlay (foco al actual, Esc devuelve el foco, elegir navega con `pushState`);
- RM: corte a WORLD y vuelta;
- sin JS: mundos legibles, links reales, sin diálogo.

**Medición del diff** (estricta): TS 0,00 % · Rayo ≤ 0,16 % · Santi ≤ 0,84 % · Chef ≤ 0,63 %, en xl/lg/md/sm/RM. Control a 3 px: 3,0–16,7 %.

Un flake observado una vez bajo carga paralela completa: aviso "preloaded but not used" del poster de Chef en sm-320. En aislamiento pasa 18/18. Queda en observación para Phase 11 (rendimiento).

**QA manual** (build de producción, `qa/phase4/`, ignorado por git):
- `states-{xl-1440,md-820,sm-390}.png`: por proyecto, el reel, SCREEN, ISOLATE, ESCAPE (en movimiento) y WORLD.
- `world-{desktop-1440,mobile-390,reduced-motion-1440}.webm`: reel → 02 → entrar → segundo gesto → seguir → Atrás → overlay → 03 → segundo gesto → Atrás. En las tres grabaciones Atrás devuelve exactamente la `scrollY` del reel, `history.length` sube sólo con navegaciones explícitas y la consola queda limpia.

## 6. Assets pendientes

| Clave | Falta | Efecto hoy |
|---|---|---|
| `ts.reel.poster` + `anchorRect` | captura demo de TravelSuite360 aprobada (§23, dos firmas) y el rect real del mensaje en ella | SCREEN de TS es el placeholder; el mensaje aparece en ISOLATE (**bloquea el lanzamiento**) |
| `anchorRect` de Rayo / Santi / Chef | medidos a ojo sobre las capturas de ENSAMBLE; se reajustan con los posters finales | alineados al poster actual |
| `rayo.burger` / capas (cutouts alfa) | Phase 6 | el objeto es un recorte del poster (con su fondo negro) |
| fotografías de Santi en alta | Phase 7 | el objeto es el recorte de la portada |
| `chef.product` macro en alta | Phase 8 | el cover a sangre amplía un recorte chico: se ve borroso (esperado con el objeto de prueba) |
| media de proofs (videos/capturas por proyecto) | Phases 5–8 | placeholders honestos en los proofs que no tienen media |
| posters para md | en md el poster de Santi (`w=750`) se amplía ≈ 13 % por el `cover` | `sizes` del reel no contempla el recorte por cover; se revisa con el pipeline de media final |

## 7. Próximo paso — alcance exacto de Phase 5 · TravelSuite360 world

MIS §26 fila 5 (capítulos §08, §16, §19).

**Entregables:**
- `TravelSuiteWorld`: todo lo que sigue a `s:WORLD` del mundo TS, sobre el `WorldScene` de esta fase.
- `TravelSuiteReveal`.
- `scripts/gen-ts-reveal.mjs`: generador determinista (mulberry32, semilla 360) que escribe `data/ts-reveal.ts` (64 fragmentos en desktop y 32 en mobile).
- Los estados TS00–TS12 en todos los tiers + RM, incluida la costura roja de salida TS12 hacia Rayo (`clip-path: inset()` cerrándose desde los bordes).
- Resumen sr-only de estados.
- CSS 3D (perspectiva 1400px) sólo en lg/xl.

**Aceptación:**
- cada estado coincide con §08 a 1440×900 (screenshot por label);
- ≥ 55 fps durante el dolly en laptop de referencia;
- sin `Math.random` en runtime;
- 3D sólo en lg/xl;
- secuencia RM completa.

**Dependencia:** la captura demo de TravelSuite360 (§23) para alinear SCREEN y el objeto. Sin ella, Phase 5 puede construirse con el placeholder, pero no aprobarse visualmente.
