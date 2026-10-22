# 26 · Dirección de arte final: ritmo editorial, motion y showreel profesional

Fecha: 2026-10-22 · Pedido de Franco: «REVELADO 2.2 — MASTER PROMPT · FINAL ART DIRECTION · EDITORIAL RHYTHM · MOTION · PROFESSIONAL SHOWREEL» · Base: `cb929f2` (HEAD verificado) · Sin push ni deploy · Copy: Content Master §24.

## 0. Estado de partida

- **Git:** `main` limpio en `cb929f2`, un solo worktree y ningún stash.
- **Otras ramas:** `wip/parallel-session-2026-10-21` (otra sesión, sin tocar), `backup/antes-revelado`, `feat/portfolio-v2` y `feat/spanish-copy`, todas sin commits que falten en `main`.
- **Worktree temporal:** `.iso-base`, armado sobre `cb929f2` sólo para medir la base. Se retiró al terminar (`git worktree remove`; el `node_modules` del repo, enlazado allí, quedó intacto).
- **Puertos de otros procesos:** el puerto 3100 lo ocupa otra app de Franco (`XegurosApp-sura`) y no se tocó. Por eso `playwright.config.ts` ahora acepta `E2E_PORT` (por defecto, 3100); la suite corrió en 3400. Remotion Studio (puerto 3000) tampoco se tocó.

## F · Inventario de las películas (Fase 1 y Fase 5)

Carpeta `C:\Users\User\Documents\REVELADO-PORTFOLIO-FINAL`, ocho archivos (`ffprobe`):

| Archivo | Proyecto · corte | Códec | Resolución | Duración | Peso | Bitrate |
|---|---|---|---|---|---|---|
| travelsuite360-desktop.mp4 | TravelSuite360 · desktop | H.264 High, yuv420p, 30 fps, sin audio | 1920×1080 | 12,0 s | 12,5 MB | 8,7 Mbit/s |
| travelsuite360-mobile.mp4 | TravelSuite360 · mobile | ídem | 1080×1920 | 12,0 s | 11,6 MB | 8,1 Mbit/s |
| rayo-smash-desktop.mp4 | Rayo Smash · desktop | ídem | 1920×1080 | 15,0 s | 15,2 MB | 8,5 Mbit/s |
| rayo-smash-mobile.mp4 | Rayo Smash · mobile | ídem | 1080×1920 | 15,0 s | 15,6 MB | 8,7 Mbit/s |
| santi-nuca-desktop.mp4 | Santi Nuca · desktop | ídem | 1920×1080 | 15,0 s | 8,6 MB | 4,8 Mbit/s |
| santi-nuca-mobile.mp4 | Santi Nuca · mobile | ídem | 1080×1920 | 15,0 s | 9,0 MB | 5,0 Mbit/s |
| chef-arturo-desktop.mp4 | Chef Arturo · desktop | ídem | 1920×1080 | 15,0 s | 3,3 MB | 1,9 Mbit/s |
| chef-arturo-mobile.mp4 | Chef Arturo · mobile | ídem | **716×840** | 15,0 s | 1,8 MB | 1,0 Mbit/s |

- **Las ocho variantes esperadas están.** La asociación no se dedujo del nombre: se confirmó con cuatro fotogramas por archivo (`qa/final/frames/sheet-{desktop,mobile}.jpg`).
- **Pósters y alternativas:** no había pósters ni versiones alternativas. El mobile de Chef viene en 0,85:1 y no en 9:16; se respetó tal cual.
- **Reproducción:** los 8 masters y los 16 archivos web decodifican completos con ffprobe. En navegador, Chromium y Firefox reproducen el AV1. El WebKit de Playwright reproduce el H.264, porque declara AV1 y no lo decodifica (ver F3). Un test e2e exige que el tiempo de la película avance en los tres motores.

**F2 · Privacidad de TravelSuite360 (Spec §23).** Se revisaron las dos películas cuadro a cuadro, a 1 fps (24 fotogramas, `qa/final/ts/sheet-{desktop,mobile}.jpg`).
- **Datos que aparecen:** sólo datos demo. Clientes «Ana Demo», «Bruno Ejemplo», «Carla Prueba», «Diego Muestra», «Elena Modelo» y «Florencia Ejemplo»; «Agencia Demo» y «Agente Demo»; valores de ejemplo (USD 4.000, Punta Cana, Madrid…). No aparece ningún dato de producción.
- **Registro:** `ts.reel.loop` y su póster quedan con `privacyChecked: true`. La revisión 1 es esta auditoría; la revisión 2, el pedido explícito de Franco, autor de las películas, de integrarlas (2026-10-22). Queda en `meta.source` del registro.
- **Lo que no cambia:** las capturas no aprobadas de ENSAMBLE, el póster SCREEN del caso (`ts.reel.poster`) y `ts.proof` siguen siendo placeholders. Un test lo verifica.
- **Si Franco quiere otra segunda firma humana**, es la única objeción posible a esta integración.

**F4 · Versiones web** (`node scripts/encode-reel.mjs`, reproducible).
- **Qué sale:** por película y corte, AV1 (SVT-AV1, CRF 36/37) como primera fuente y H.264 (High, CRF 23, máx. 2,4 / 1,4 Mbit/s, faststart) como respaldo, sin pista de audio. El póster es el cuadro 0 en WebP.
- **Formatos de salida:** desktop a 1600×900. Mobile a 720×1280; Chef queda en 716×840.
- **Chef sin recomprimir:** el H.264 de Chef ya era web (≤ 2 Mbit/s) y se copió tal cual.
- **Los masters (81 MB) no entran al repositorio:** `public/media/reel/` suma 33 MB con las dos variantes de cada corte.

| Película · corte | AV1 | H.264 | Póster |
|---|---|---|---|
| TravelSuite360 desktop / mobile | 1,56 / 0,79 MB | 2,17 / 1,32 MB | 32 / 22 KB |
| Rayo Smash desktop / mobile | 1,50 / 1,08 MB | 2,25 / 1,49 MB | 40 / 30 KB |
| Santi Nuca desktop / mobile | 1,94 / 1,38 MB | 2,65 / 1,92 MB | 52 / 44 KB |
| Chef Arturo desktop / mobile | 1,47 / 1,04 MB | 3,33 / 1,78 MB (originales) | 37 / 24 KB |

El Spec §18 fijaba 1,5 / 0,8 MB para loops de 4 s. Para películas de 12–15 s, `check-assets` usa un presupuesto propio por clave: 3,5 / 2 MB por archivo. Es un desvío deliberado y queda documentado en el script.

**F3 · Integración.** Reutiliza la arquitectura del showreel:
- `LoopVideo`, `reelVideoPlan` y `lib/showreel.ts`;
- los contratos `*.reel.loop` pasan a `final` con sus archivos;
- el póster de cada película es `*.reel.film.poster`.

La tarjeta toma el aspecto de su película: 16:9 en desktop y el corte mobile tal como fue entregado. Así la imagen nunca se recorta. Antes, `cover` le cortaba la «S» a SANTI.

Se cumple:
- autoplay, `muted`, `loop`, `playsInline`, sin controles, `aria-hidden` y sin recibir el puntero (el clic siempre es de la tarjeta);
- el póster es el cuadro 0, así que la entrada del video no salta;
- reproduce sólo con la tarjeta activa, asentada, ≥ 50 % visible y con la pestaña visible; fuera del viewport, pausa;
- nunca monta un `<video>` bajo reduced motion ni con Save-Data / 2G;
- `LoopVideo` sigue en vivo el tier: un resize que cruza a teléfono cambia de corte;
- **respaldo de códec, bug encontrado en la QA:**
  - El WebKit de Playwright responde `canPlayType` «probably» para AV1, arranca el AV1 y enseguida dispara `error` en el `<video>`. `LoopVideo` lo tomaba como falla total y volvía al póster.
  - Ahora un error de decodificación salta a la fuente siguiente (`<video key>` se remonta sin el AV1). Sólo se declara falla cuando no queda ninguna fuente.
  - Verificado: en WebKit la película queda en `travelsuite360-desktop.h264.mp4` con `readyState` 4 y avanza;
- la tarjeta entera sigue siendo la puerta a `/trabajo/{slug}`, con una sola parada de teclado («Ver caso») y sin controles anidados.

**F4 · Carga.** Sólo la tarjeta activa precarga (`preload=auto`) y sus vecinas leen la metadata. Nunca se descargan las ocho variantes: al llegar al reel hay como máximo dos `<video>`, y un test lo verifica.

## A · Espacios muertos (Fase 2)

Medición con el detector de tramos casi vacíos (frames con < 1,2 % del viewport fuera del tono dominante, cada ¼ de viewport; `qa/final/gaps/*.json`):

| Viewport | Base `cb929f2` | Después |
|---|---|---|
| 1440×900 | 1,75 vh vacíos: hero O2 0,5 · **THE SHIFT → Capacidades 0,75** · Propuesta CAMPO 0,5 | **0,5 vh**: sólo Propuesta CAMPO (campo latente, diseñado) |
| 820×1180 | 0,5 vh (opening O2/O3, diseñado) | 0,5 vh (ídem) |
| 390×844 | 0 | 0 |

**A1 · Trabajo seleccionado → showreel.**
- **Causa:** el escenario del reel medía 100svh y centraba la tarjeta (`--sy = (100svh − h)/2`). El título vivía en un bloque aparte, encima, con 48 px de margen, y quedaban unos 260 px de negro a 1440. En teléfono, además, el índice 01–04 se iba al fondo de un escenario de 100svh.
- **Corrección, sin márgenes negativos:**
  - **Desktop y tablet:** el escenario mide lo que contiene: franja del título (`--reel-head`, cabecera + 150 px; + 200 px en tablet, donde el título va en dos líneas), la tarjeta y la franja de la meta. El título queda anclado al borde izquierdo de la tarjeta, 28 px arriba, y se extiende hasta el margen derecho, así no se parte en laptops. La altura de la tarjeta cede (`--reel-cap`) para que título, tarjeta y meta entren en una pantalla.
  - **Teléfonos de 700 px de alto o más:** el título va en la banda de 18svh, justo encima de la tarjeta. **Teléfonos bajos:** el título va en flujo y la tarjeta 16 px debajo. En los dos casos el escenario termina con su índice.
  - **Bug encontrado en la QA, a 1366:** la pista «arrastrá · ← → · 1–4» se superponía con «Ver caso» y le tapaba el clic. Ahora los controles ocupan sólo la mitad derecha de la tarjeta, únicamente sus botones reciben clics y la pista se muestra sólo desde 1440.
- **Consecuencia:** el salto invisible reel ↔ SCREEN de la Fase 4 ya no aplica. La tarjeta muestra la película con su aspecto y el caso abre en su SCREEN (docs/25 ya lo había llevado a otro documento). La prueba de píxeles de `world.spec` se reemplazó por una de película y aspecto por tarjeta.

**A2 · THE SHIFT → Capacidades.**
- **Causa:** el primer viewport de Capacidades era la costura del busto. Sin el busto (asset pendiente) quedaban un placeholder oscuro y una línea mono de 11 px, unos 0,75 vh negros.
- **Corrección estructural:** con la sección nueva (C) la costura desaparece como escena. «Todo lo anterior pasó por las mismas manos.» es la apertura editorial, en tamaño de titular. El busto se mostrará a su lado cuando exista, nunca como una caja placeholder.

**A3 · Auditoría global.**
- La Propuesta empezaba en un campo de palabras al 12–42 % de opacidad, que se leía como pantalla negra. Ahora va del 28 al 48 %: sigue siendo latente (el test exige < 50 %), pero se lee.
- El fondo de Capacidades cede su padding al margen que necesita el escenario `sticky`.

## C · Capacidades: índice editorial vivo (Fase 3)

Las seis tarjetas y el riel horizontal quedan descartados. Se retiran `CapabilitiesRail`, `EvidenceElement`, `EvidenceSlot` y `lib/capabilities-rail.ts`. La guarda de evidencia `resolveEvidence` (sin métricas no autorizadas) pasa a `lib/capabilities-index.ts`.

- **Desktop (≥ 1024):**
  - índice al 45 % y escenario compartido al 55 %;
  - las filas corren con scroll nativo, sin pin de sección: el escenario es `sticky` dentro de su columna;
  - la capacidad activa es la fila que cruza la línea de lectura (46 % del viewport) y vuelve a activarse al subir;
  - hover y foco también activan; nada se revela sólo con hover;
  - la fila activa lleva número rojo y una regla roja que crece; las demás quedan en muted, que cumple AA;
  - el escenario cambia de escena con un fundido de 360 ms y un desplazamiento de 14 px.
- **Tablet (768–1023):** cada unidad en una fila, palabras a la izquierda y demostración a la derecha.
- **Teléfono:** cada unidad apilada (número, nombre, valor, referencia y su plancha debajo), sin carrusel. La plancha se reproduce al entrar a la vista.
- **Escenas** (`components/capabilities/CapabilitiesIndex.tsx`). Comparten una gramática: plancha oscura, etiqueta «nn nombre», demostración y referencia.
  - **01 Producto:** el recorrido real de TravelSuite360: mensaje → interpretado (destino, fechas, pasajeros) → «Opción 01 · Opción 02» → «reserva confirmada», con un estado en rojo.
  - **02 Ingeniería web:** el primer cuadro real de la película de Santi Nuca sobre las capas Front, Back y Datos, que se separan.
  - **03 Comercio digital:** la Cookie levain real de Chef: cantidad 1 → 2, «Agregar al carrito» y «Mercado Pago».
  - **04 IA y automatización:** el mensaje real; sus tres palabras se marcan y se vuelven datos estructurados. Es una demostración y no simula una integración corriendo.
  - **05 Experiencias interactivas:** las seis capas reales de Rayo, separándose.
  - **06 Meta Ads y crecimiento:** alcance en anillos y una línea que va de «Negocios» a «Personas» y a «Próximos clientes». Sin cifras.
- **Copy:** no se escribió nada nuevo. Las palabras de cada escena salen del copy aprobado o del enunciado de su capacidad (Content Master §24, verificado por test).
- **Movimiento:** las secuencias son animaciones CSS ligadas a `data-on`. Bajo reduced motion y sin JS se ve el estado final.
- **Largo:** a 1440, Capacidades pasa de 3,39 a 2,62 vh (tabla en QA).

## B · THE SHIFT: jerarquía narrativa (Fase 4)

- **Reparto:** cada frase se parte en un comienzo en papel y un remate en rojo, el que propuso el brief (Content Master §24).
- **Movimiento de la frase:** entra por máscara, primero el comienzo y 0,1 gesto después el remate; sale hacia arriba, por su máscara, al cambiar de acto. Sin efectos de letras, blur ni distorsión.
- **Tamaño:** de 4,6 a 4,8 cqw en desktop (columna del 29 al 31 %), de 6,6 a 7,4 cqw en tablet y de 9,6 a 10,6 cqw en teléfono. Peso 800.
- **Fragmentos:** la tipografía de la interfaz pasa a muted (AA) y los dos fragmentos del titular bajan de escala en el desorden. La e2e exige que la línea sea más de 1,15 veces el fragmento más grande.
- **Lo que no cambió:** la axonometría, el gesto «Publicar → Publicado» y la leyenda conceptual. Las pruebas de geometría siguen pasando: nada tapa la línea y nada sale del espacio.

## D · MOSTRAR / CONVENCER / CONVERTIR (Fase 4)

Estructura, copy y estados quedan aprobados e intactos. Se suma una capa de letras sobre la misma línea de tiempo con scrub, reversible y determinista (las poses de llegada son una tabla, sin `Math.random`):

- **MOSTRAR.:** mientras se abre la apertura, cada letra encuentra su lugar desde su propio desplazamiento (±0,34 em, ±7°) con `elastic.out(1, 0.55)` y 35 ms entre letras.
- **CONVENCER.:** cuando la palabra ya subió, una línea roja la recorre por la línea de base. En la primera versión iba a media altura y en la grabación se leía como un tachado, así que se bajó. Cada letra responde al paso: −0,05 em, escala 1,07 y un destello rojo, y vuelve con `back.out`. Todo ocurre dentro del gesto, así que en el estado la palabra está quieta y entera.
- **CONVERTIR.:** las letras se cierran desde un espaciado más abierto con un pequeño sobrepaso (`back.out(1.7)`, desde el centro), y el punto aterriza al final, en rojo.
- **Implementación:** las letras son `span` en línea dentro del mismo `h3`; el texto se lee igual. Sólo se anima transform y color. Bajo reduced motion, la página editorial estática de siempre.

## E · Perfil (Fase 4)

Reemplaza los revelados por bloque de la Fase 9 (`ProfileReveal`):
- **Declaración:** entra por líneas, cada una saliendo de su máscara (90 ms entre líneas). Las líneas las mide `SplitText`, que viene con el paquete `gsap` (no es una dependencia nueva). Se carga con `import()` cuando la sección se acerca y no cambia el ARIA. Al terminar, el split se revierte y queda un párrafo de texto plano.
- **Párrafos:** cada uno entra al llegar al 88 % del viewport y nunca vuelve a ocultarse.
- **Meta Ads:** el conductor «Estrategia → Producto → Crecimiento» dibuja sus reglas rojas y «Crecimiento» se enciende en rojo, como texto grande que cumple AA.
- **Reduced motion y sin JS:** todo está, nada se mueve.

## QA (Fase 6)

**Entorno.** Windows 11 y build de producción (`next build` + `next start`). Herramientas: Playwright 1.64 con Chromium, WebKit y Firefox, y Lighthouse 13.5 con throttling simulado. La base es `cb929f2`, construida en el worktree temporal `.iso-base` y medida con los mismos scripts. Los datos crudos están en `qa/final/` (ignorado por git).

### Pruebas

| Verificación | Resultado |
|---|---|
| `tsc --noEmit` | ok |
| ESLint (`src`, `tests`, `scripts`, `playwright.config.ts`) | 0 problemas. `eslint .` contaba además 178 errores, todos en `.iso-base/.next`, el build del worktree temporal; desaparecieron al retirarlo |
| `next build` + `check:assets` | ok. Sólo los avisos de siempre: el póster crudo de Chef y los slots de `check:launch` |
| Vitest | 220 / 220 |
| Playwright Chromium (15 proyectos) | **651 / 651** en la corrida final (948 listados, 297 omitidos por proyecto), con los dos tests nuevos. Tras el último ajuste de CSS (el clic de la tarjeta, ver abajo), `reel` + `cases` + `declaration` volvieron a correr: 213 / 213. La primera corrida dio 639 + 1 falla, de un test que describía el layout anterior (ver más abajo) |
| Playwright WebKit 1440 / 390 + Firefox 1440 | Con un worker: 329 / 329, luego **331 + 1** en la corrida final y 112 + 1 en la reejecución de `reel` + `cases` + `declaration`. Cada falla fue un test distinto de WebKit y pasó solo, 6 / 6 o 12 / 12 en repetición. Con dos workers: 305 + 22 fallas por carga. Firefox: 0 fallas con un worker; con dos, una sola, un timeout al cerrar el contexto (ver más abajo) |

**Las fallas encontradas y qué eran:**
- **Error preexistente, corregido: una recarga podía saltar a otra sección.**
  - **Cómo se reproduce:** bajar hasta el contacto, subir a THE SHIFT y recargar en menos de un segundo. La página aterrizaba en `/#contacto`. La base `cb929f2` hace lo mismo.
  - **Causa:** `trackScrollPosition` guarda la posición 300 ms después del último evento de scroll. El snap de THE SHIFT sigue moviendo la página unos 0,9 s después de un reposo, así que una recarga en ese lapso restauraba la última posición guardada.
  - **Corrección:** al irse, la página anota dónde está y la recarga la lee una vez (`journey-nav.ts`). Se guarda en `sessionStorage`: medido en los tres motores, un `replaceState` hecho en `pagehide` sobrevive a la recarga sólo en WebKit.
  - **Cobertura:** un test nuevo en `foundation.spec` recarga a los 50 ms. La matriz manual, que lo encontró, ahora da recarga correcta en los diez casos.
- **Regresión real, corregida: WebKit perdía las películas.** El AV1 fallaba al decodificar y `LoopVideo` volvía al póster (F3). Ahora cae al H.264, y un test nuevo exige que el tiempo de la película avance en cada motor.
- **Test desactualizado, corregido.** «narrow: each capability is one unit» exigía la escena *debajo* de las palabras también en tablet. El layout de tablet, decidido en esta intervención, la pone *al lado*. El test ahora verifica cada layout donde corresponde.
- **Limitación del entorno: carga en WebKit.**
  - **Qué pasó:** con dos workers, la corrida cruzada dio 22 fallas. Casi todas eran `main` sin `data-started` a los 5 s, o sea hidratación lenta, y en una el reel seguía sin hidratar.
  - **Qué se comprobó:**
    - corridas con un worker: 20 de las 22 pasaron;
    - las 2 restantes pasaron 6 / 6 aisladas;
    - el `reel.spec` completo pasó 32 / 32 dos veces seguidas.
  - **La causa, medida** (`qa/final/engine-load.jsonl`, rAF durante 4 s en el reel a 1440):

| Motor | Fuente | Con la película | Pausada |
|---|---|---|---|
| Chromium | AV1 1600×900 | p50 16,7 ms · p99 16,8 | 16,7 · 16,8 |
| Firefox | AV1 1600×900 | p50 5,6 ms · p99 5,6 (headless: rAF sin vsync) | 5,6 · 5,6 |
| WebKit (Playwright, Windows) | H.264 1600×900 | **p50 46 ms · p99 65 (≈ 21 fps)** | 16 · 31 |

  - **Las fallas sueltas de WebKit** con un worker tienen el mismo origen y son siempre un test distinto: «the whole active card is the door…» en 390 y ««← Trabajo» lands on the reel…» en 1440. Sólo la primera sugería una causa real: el `<video>` recibía el clic, y el respaldo de códec lo remonta. Si el remontaje cae entre `mousedown` y `mouseup`, WebKit puede no despachar el `click`. Por eso la película ya no recibe el puntero (`.reel-frame .media-video { pointer-events: none }`) y el clic siempre es del marco.

  El WebKit de Playwright en Windows decodifica el H.264 por software en el hilo principal. Antes de esta intervención la película caía al póster, por eso esa carga no existía. Safari en macOS e iOS decodifica H.264 por hardware (VideoToolbox), así que no es representativo. **Pero no está verificado en un Safari real:** queda como pendiente de dispositivo, junto con los de docs/19 A21.

### Largo del journey (`scripts/measure-journey.mjs`, viewports)

| Viewport | Base | Después | Cambio | Dónde |
|---|---|---|---|---|
| 1440×900 | 20,53 | **19,47** | −5,2 % | Trabajo 1,36 → 1,00 · Capacidades 3,39 → 2,62 · Perfil 1,54 → 1,60 |
| 1366×768 | 21,09 | **19,88** | −5,7 % | Trabajo 1,38 → 1,00 · Capacidades 3,65 → 2,74 |
| 820×1180 | 17,33 | **16,85** | −2,8 % | Trabajo 1,30 → 0,65 · Capacidades 2,16 → 2,27 |
| 430×932 | 18,73 | **18,46** | −1,4 % | Trabajo 1,35 → 1,08 · Capacidades 3,76 → 3,66 |
| 390×844 | 19,32 | **19,13** | −1,0 % | Trabajo 1,37 → 1,11 · Capacidades 4,00 → 3,96 |
| 320×568 | 17,58 | **18,19** | **+3,5 %** | Capacidades 5,26 → 5,80 · Perfil 2,89 → 3,13 |
| 1440, reduced motion | 12,19 | **11,36** | −6,8 % | Trabajo y Capacidades |

A 320 la página crece: cada capacidad lleva su plancha debajo, donde antes había tarjetas de texto. Además, el Perfil suma el conductor de Meta Ads. Es el único viewport que crece.

### Lighthouse (mediana de 6 corridas por lado, `/`)

Medido antes de los últimos tres cambios: el respaldo de códec, la recarga y el `pointer-events` del video. Ninguno toca la carga inicial: el respaldo actúa recién cuando una película falla, la recarga lee `sessionStorage` sólo en una recarga, y el tercero es una regla de CSS.

| | Base mobile | Después mobile | Base desktop | Después desktop |
|---|---|---|---|---|
| Performance | 88 | 86 | 100 | 100 |
| LCP | 3,40 s | **3,55 s** | 0,73 s | 0,72 s |
| TBT | 222 ms | 254 ms | 2 ms | 5 ms |
| CLS | 0 | 0 | 0 | 0 |
| Accesibilidad | 100 | 100 | 100 | 100 |
| JS (transfer) | 221 KB | 221 KB | 221 KB | 221 KB |
| Peso total | 357 KB | 387 KB | 363 KB | 378 KB |

- **Ningún byte de video en la carga:** la película entra cuando el reel se acerca. Los +30 KB son los pósters de las películas, unos 19 KB cada uno contra los placeholders de antes.
- **El LCP es el mismo elemento en los dos builds:** el índice del hero (`p.hero-index > span`), que el opening revela por diseño. Lo que crece es el *render delay*, de 1 499 a 1 547 ms sin throttling.
- **Causa probable, no aislada:** hidratar unos 435 nodos más (894 → 1 329), las seis escenas de Capacidades. Se renderizan dos veces: en la fila, para teléfono y tablet, y en el escenario compartido, para desktop. Así el layout no depende de JS.
- **Mitigación posible, no aplicada:** montar en el cliente sólo el juego de escenas del tier.
- El presupuesto previo de LCP móvil (2,5 s) ya fallaba en la base (docs/18).

### Fluidez y memoria (`qa/final/perfscroll.jsonl`, Chromium con GPU, journey completo con la rueda, ida y vuelta)

| | 1440 base | 1440 después | 390 base | 390 después |
|---|---|---|---|---|
| Frame p50 / p95 / p99 | 16,7 / 16,8 / 33,3 ms | 16,7 / 16,7 / **16,8** ms | 16,7 / 16,8 / 16,8 | 16,7 / 16,8 / 16,8 |
| Frames > 50 ms | 0 | 0 | 1 | 0 |
| Long tasks | 2 (máx. 59 ms) | **0** | 2 (máx. 63 ms) | **0** |
| Heap tras GC: carga → ida y vuelta | 4,4 → 6,7 MB | 4,5 → 7,0 MB | 4,4 → 6,4 MB | 4,5 → 6,9 MB |
| Nodos DOM | 894 | 1 329 | 899 | 1 326 |

- **Sin fugas:** en tres idas y vueltas seguidas el heap queda en 7,1 / 7,2 / 7,2 MB.

### Matriz manual (1440 / 1024 / 820 / 390 / 320)

Recorrida con scripts de captura, reproducibles en el scratchpad de la sesión, y con la suite:
- scroll hacia abajo y hacia arriba;
- pines: THE SHIFT, la Propuesta y los mundos de los casos;
- recarga en mitad de una escena, resize que cruza tiers, deep links;
- ida y vuelta a los cuatro casos con Atrás;
- teclado (Tab, ← →, 1–4, Esc del overlay);
- películas: reproducción, pausa fuera de vista y cambio de corte al cruzar a teléfono;
- reduced motion y sin JS.

Resultado (`qa/final/matrix.jsonl`, en cada viewport con y sin reduced motion):
- sin overflow horizontal en ningún viewport;
- sin errores de consola;
- CLS 0 en todos los viewports;
- axe sin violaciones serias ni críticas en el reel, THE SHIFT, Capacidades, la Propuesta, el Perfil y los casos.

### Capturas y grabaciones

- **Capturas** antes / después en los mismos estados, a 1440 y 390: `docs/assets/final/{base,after}-{1440,390}-*.jpg`. Muestran el reel, THE SHIFT (acto 2 y final), la apertura y el medio de Capacidades, los tres estados de la Propuesta y el Perfil.
- **Cuadros de movimiento** sacados de las grabaciones: `docs/assets/final/motion-*.jpg`. Son las películas de TravelSuite360, Rayo y Santi a 1440, la de TravelSuite360 mobile a 390, el barrido de CONVENCER, el armado de CONVERTIR, las líneas del Perfil y THE SHIFT.
- **Grabaciones** (`qa/final/rec/*.webm`, no versionadas por peso):
  - reel con las películas y cambio de pieza por teclado (1440 y 390);
  - THE SHIFT → Capacidades ida y vuelta;
  - Capacidades completa (1440 y 390);
  - MOSTRAR / CONVENCER / CONVERTIR;
  - Perfil.

## Pendientes y riesgos

1. **Safari e iOS reales.** No se pudo verificar en un dispositivo Apple:
   - la reproducción de las películas (AV1 en M3 o A17 en adelante; H.264 en el resto);
   - el costo de decodificación (ver QA).
2. **TravelSuite360, segunda firma.** La película se integró tras la revisión cuadro a cuadro y el pedido explícito de Franco (F2). Si Spec §23 exige una segunda persona distinta del autor, falta esa firma. Revertirla es cambiar `privacyChecked` y `status` en `src/data/assets.ts`: la tarjeta vuelve al placeholder honesto.
3. **LCP móvil +0,14 s y TBT +32 ms** (mediana simulada), con una mitigación identificada (Lighthouse, arriba).
4. **320 px +3,5 % de largo.**
5. **El rectángulo compartido reel ↔ SCREEN de la Fase 4 se retiró** (A1). La tarjeta adopta el aspecto de su película. El caso abre en su SCREEN desde docs/25, en otro documento.
6. **Copy a confirmar:** el conductor «Estrategia → Producto → Crecimiento» es texto del brief (Content Master §24) y no estaba en el Content Master.
7. **Peso del repo:** `public/media/reel/` suma 33 MB versionados. Los masters (81 MB) quedan fuera.
8. **El mobile de Chef** se entregó en 716×840 (0,85:1) y se respetó. Si debía ser 9:16, hace falta otro master.
9. **Sin cambios:** los bloqueantes de lanzamiento de docs/20 §3, o sea el retrato, el busto, las cuatro pruebas, Resend y el dominio.

## Archivos

- **Nuevos:**
  - `scripts/encode-reel.mjs`;
  - `public/media/reel/*` (16 videos y 8 pósters);
  - `src/lib/capabilities-index.ts`, `src/components/capabilities/CapabilitiesIndex.tsx`;
  - este informe y `docs/assets/final/*`.
- **Retirados:** `src/components/capabilities/{CapabilitiesRail,EvidenceElement,EvidenceSlot}.tsx`, `src/lib/capabilities-rail.ts`.
- **Modificados:**
  - `src/data/{assets,site,profile}.ts`, `src/lib/{showreel,shift,declaration,journey-nav}.ts`;
  - `src/components/{journey/Journey,media/LoopVideo,shift/Shift,declaration/Declaration,profile/Profile,profile/ProfileReveal}.tsx`;
  - `src/app/globals.css`, `scripts/check-assets.mjs`, `playwright.config.ts`;
  - `tests/{capabilities,content,showreel}.test.ts`;
  - `tests/e2e/{capabilities,foundation,reel,shift,world}.spec.ts`, con dos tests nuevos: la película avanza en cada motor y la recarga durante el snap;
  - `docs/05b-content-master.md` (§24), `CLAUDE.md`, `README.md`.

## Commits (locales, sin push ni deploy)

Sobre `cb929f2`, uno por fase. Los archivos con cambios de varias fases (`globals.css`, `Journey.tsx` y tres specs) se partieron por bloque.

| Commit | Fase |
|---|---|
| `fbd01a1` | F · películas del showreel, respaldo de códec |
| `3ba32cb` | A · título del reel con sus tarjetas; campo de la Propuesta |
| `db8bb1a` | C · índice editorial de Capacidades (retira el riel) |
| `c1dae01` | B · THE SHIFT: frases protagonistas |
| `1612909` | D · letras de MOSTRAR / CONVENCER / CONVERTIR |
| `2e3f93a` | E · Perfil por líneas y conductor de Meta Ads |
| `564940a` | QA · recarga durante el snap (error preexistente) |
| `722d4d0` | QA · `E2E_PORT` |
| siguiente | Docs: este informe, capturas, Content Master §24, `CLAUDE.md`, `README.md` |
