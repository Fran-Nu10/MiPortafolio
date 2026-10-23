# 27 · Blue Edition: identidad personal, dirección de arte y mobile-first

**Datos de la intervención:**
- **Fecha:** 2026-10-23.
- **Pedido de Franco:** «REVELADO 2.2 — MASTER PROMPT · BLUE EDITION · PERSONAL IDENTITY · ART DIRECTION · MOBILE-FIRST RECONSTRUCTION».
- **Base:** `faae87c`, que es `HEAD` y también `origin/main`.
- **Entrega:** commits locales, sin push ni deploy.
- **Copy:** Content Master §25.

## 1. Auditoría inicial (Fase 1)

**Git.**
- `main` estaba limpio en `faae87c`. Ese commit ya estaba en `origin/main`, pusheado fuera de esta sesión.
- Había un solo worktree y ningún stash. La rama `wip/parallel-session-2026-10-21` no se tocó.
- **Worktree de la base:** `.iso-base` se armó sobre `faae87c` sólo para medir la base, en el puerto 3300, y se retiró al terminar.

**El rojo.**
- `--color-signal` (`#e63b2e`) estaba centralizado en un token, con 46 usos en `globals.css`.
- **Fuera del token:**
  - dos colores escritos en JS: el barrido de CONVENCER y el conductor del Perfil;
  - tres translúcidos en `rgb(230 59 46 / …)`: las columnas de THE SHIFT y una capa de Ingeniería web.
- **Sin rojo:** el favicon es blanco y negro, y no hay imagen OG.
- **Dos usos que no son identidad del portfolio:**
  - las marcas de error del formulario;
  - el entorno «red» del mundo de **Rayo Smash**, que es el rojo de su marca, el de su película.

**Mobile (390 × 844, 375 × 667, 320 × 568; hojas en `qa/blue/audit/`).**
- **Microetiquetas:**
  - «TRABAJO · 01–04» encima del reel;
  - el subtítulo de THE SHIFT, repetido en cada acto, y los números «01 — EL DESORDEN»;
  - en cada plancha de Capacidades, el número y el nombre repetidos de la fila, y la referencia repetida;
  - el «01–06» de las palabras de la Propuesta;
  - la etiqueta «PERFIL».
- **«Todo lo anterior pasó por las mismas manos.»:** era un titular sin composición, con un placeholder de busto que no existe.
- **Perfil:** era una sola columna de párrafos, y en teléfono se sucedían sin cambio de ritmo.
- **Reel a 320:** el índice «01 / 04» se partía en dos líneas.
- **Rendimiento:** Capacidades renderizaba sus seis escenas dos veces en el HTML. Eran 351 nodos, la causa probable señalada en docs/26.

## 2. Blue Edition (Fase 2)

**Tokens** (`src/app/globals.css`, `@theme`):

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--color-accent` | `#6488FF` | el único acento decorativo del portfolio | 6,1:1 sobre negro, 5,5:1 sobre el panel: AA también para texto normal |
| `--color-accent-deep` | `#3352CC` | el acento sobre papel (la interfaz conceptual de THE SHIFT la toma redefiniendo `--color-accent` en `.sh-done`) | 5,3:1 sobre papel |
| `--color-error` | `#E63B2E` | semántico: la marca y el borde de un error de formulario; el texto del error queda en papel | — |
| `--color-rayo` | `#E63B2E` | color de un proyecto: el campo del mundo de Rayo Smash | — |
| `COLOR.accent` / `COLOR.paper` (`src/lib/motion.ts`) | `rgb(100, 136, 255)` / `rgb(237, 232, 222)` | lo que interpolan las líneas de tiempo (GSAP no interpola variables CSS) | — |

**Cambios:**
- **Renombre:** `--color-signal` pasó a `--color-accent` (46 usos). No fue una sustitución de color a ciegas: cada uso se clasificó primero (§1).
- **Translúcidos:** ahora se escriben con `color-mix(in srgb, var(--color-accent) N%, transparent)`.
- **Comentarios:** los que describían «la línea roja» del portfolio ahora dicen «acento», y la regla de contraste nueva queda documentada.

**Lo que no cambió:**
- las películas, las fotografías, los logotipos y las capturas de los proyectos;
- el rojo de Rayo Smash;
- el rojo semántico del error;
- los colores de las interfaces de TravelSuite360, Santi Nuca y Chef Arturo.

**Verificación** (`tests/e2e/identity.spec.ts`):
- recorre toda la home en reposo y lee color, fondo, bordes, outline, fill, stroke, sombra, subrayado y caret de cada elemento con caja, incluidos `::before` y `::after`;
- exige cero rojos;
- exige el acento en THE SHIFT, «Una sola visión» y el CTA;
- exige que el error siga en rojo semántico, con el mensaje en papel;
- exige que el campo de Rayo siga rojo.

## 3. Reconstrucción editorial (Fase 3)

### «Distintas disciplinas. Una sola visión.»

- **Ubicación:** una sección nueva, `#vision`, entre THE SHIFT y Capacidades.
- **Qué reemplaza:** la apertura de Capacidades, «Todo lo anterior pasó por las mismas manos.». Esa frase se podía leer como si las fotos, las marcas y los productos de los proyectos fueran de Franco. La nueva dice cómo se trabaja.
- **Lenguaje gráfico** (`src/lib/vision.ts`): **una misma figura de nueve puntos en tres estados**, una por etapa.
  - **Pensar:** los puntos sueltos y una línea libre que los recorre (una curva Catmull-Rom). Es la idea, todavía abstracta.
  - **Diseñar:** los mismos puntos sobre una retícula de 3 × 3, con guías y un recorrido ortogonal. Es la estructura.
  - **Construir:** cada punto se vuelve un módulo y los nueve forman un bloque sólido. Es el producto, estable.
  - **El punto central es azul en los tres estados:** es la misma decisión, llevada de principio a fin.
  - Sin íconos, sin tarjetas, sin dashboard.
- **Conductor:** una línea azul con un tramo por etapa, que va de cada nodo al siguiente. El último tramo termina en el punto del cierre.
- **Composición:**
  - **Desktop:** tres columnas y el conductor en horizontal bajo las figuras; el cierre bajo Construir.
  - **Teléfono:** la versión se hizo primero. Las tres etapas van en una columna y el conductor baja por los centros de las figuras.
  - **Tablet:** la figura va al lado de las palabras.
- **Movimiento** (`VisionScene`):
  - va con scrub sobre el paso de la propia sección, sin pin y reversible;
  - cada etapa llega en su tercio: los puntos salen del centro hacia su lugar suelto; desde ahí pasan a la retícula; después crecen hasta ser módulos;
  - la página estática ya es la transformación terminada, así que bajo reduced motion y sin JS se ve igual de clara.

### Perfil

- La declaración, grande y sola, entra por líneas como antes.
- **Primer párrafo:** a su lado (en desktop, a su izquierda) van sus cuatro frases, en el orden del texto: «una marca», «sus clientes», «sus procesos», «un producto digital». Las une el hilo azul y la última va en azul. Un test verifica que salen del párrafo.
- **Segundo párrafo:** a su lado (en desktop, a su derecha) van dos fragmentos reales, que se abren desde su marco:
  - la Cookie levain de Chef Arturo, con el pie «Comercio electrónico»;
  - la interfaz de TravelSuite360, con datos demo, con el pie «Plataforma y sistema de gestión».
- **Decisión: los pies dicen el tipo, no el proyecto.** Content Master §21 decidió que el Perfil no nombre TravelSuite360, y un test lo verifica. Quedó **[CONFIRMAR]** en §25 por si Franco prefiere los nombres.
- **En desktop la alineación alterna:** recurso a la izquierda, texto a la derecha, y al revés en el bloque siguiente.
- **En teléfono el orden es** declaración → frases → párrafo → fragmentos → párrafo → Meta Ads.
- No hay retrato ni imagen inventada. «Perfil» queda sólo para lectores de pantalla.

### Meta Ads, un capítulo propio

- **Titular:** «Construirlo es una parte.» / «Hacer que lo descubran es la otra.», con la segunda línea en azul.
- **Secuencia** en el mismo lenguaje de módulos que «Una sola visión»:
  - **Producto:** un módulo;
  - **Descubrimiento:** el módulo con contornos que se alejan, es decir, que se ve más lejos;
  - **Acción:** uno de esos contornos se vuelve un módulo azul que llega.
- **No es un embudo:** no hay cifras ni gráficos de resultados.
- **Las líneas de cada paso** salen del texto aprobado de §21 y conservan sus precisiones: Instagram y Facebook, y consultar, reservar o comprar.
- **Párrafo:** el texto del brief, con «Meta Ads» en azul.
- **Disposición:** en desktop los pasos van en fila con el hilo horizontal; en teléfono, en columna con el hilo vertical, y «DESCUBRIMIENTO» entra entero a 320.

## 4. Limpieza de identidad (Fase 4)

- **Reel:** el título pasa a ser «Proyectos que construí.» y se retira la etiqueta «TRABAJO · 01–04». Los cuatro proyectos, las películas, las variantes, los pósters, los respaldos y la entrada a los casos no cambian.

**Microetiquetas:**

| Etiqueta | Decisión | Por qué |
|---|---|---|
| «Trabajo · 01–04» sobre el reel | retirada | repetía el título y las tarjetas |
| «De la complejidad al producto.» (THE SHIFT) | sólo para lectores de pantalla | competía con las cuatro frases, que son la sección |
| «01 — El desorden» y los demás números de acto | sólo para lectores de pantalla | enumeraban escenas |
| número y nombre en cada plancha de Capacidades | retirados | la fila de al lado los dice |
| referencia en cada plancha | retirada | también está en la fila |
| «Después de publicar» | sólo para lectores de pantalla | el kicker lo dice en pantalla |
| «01–06» de las palabras de la Propuesta | retirados | sólo contaban |
| «Perfil» | sólo para lectores de pantalla | repetía el nombre de la sección |
| índice «00 → 01» del hero | **se conserva** | en O2 es el único contenido de la apertura junto con la banda: sin él, O2 sería una pantalla negra |
| numeración 01–06 de Capacidades, índice «01 / 04» de las tarjetas, referencias de proyecto, estados de las interfaces, «Interfaz conceptual…», anotaciones del acto IV de THE SHIFT | **se conservan** | navegan, identifican o describen contenido conceptual |

- Las etiquetas que pasaron a lectores de pantalla conservan su caja (1 px, posicionadas), así que las escenas que las animan siguen funcionando y no dejan huecos.

## 5. Mobile-first (Fase 5)

- **Secciones nuevas:** «Una sola visión», el Perfil y Meta Ads se diseñaron primero para el teléfono. La versión de desktop es su variante.

**El resto, sección por sección:**
- **Hero:** el nombre partido «FRA / NCO · NÚ / ÑEZ» y la apertura O0–O3 son la dirección congelada de REVELADO. La propuesta de valor y la firma se leen a 320. El CTA es «Ahora, el tuyo» del header. No se cambió.
- **Showreel:**
  - Las películas mobile se ven con su propio encuadre. La de Chef Arturo, de 716 × 840 (0,85:1), se respeta sin recorte.
  - **Bug, corregido:** a 320 el índice «01 / 04» se partía. Ahora el índice y el nombre son piezas enteras, y en una tarjeta angosta el nombre pasa debajo del índice.
  - **Probado y revertido:** achicar la tarjeta en teléfonos bajos para que título, tarjeta y meta entraran en una pantalla. Con la tarjeta a 147 px de ancho, la meta de Rayo Smash se partía en ocho líneas y estiraba el escenario, así que se descartó. A 375 × 667 y 320 × 568, «Ver caso» queda justo bajo el pliegue y aparece con el primer gesto.
- **THE SHIFT:** ya tenía su dibujo de teléfono y su página estática a 320 × 568. Gana espacio al pasar su subtítulo y sus números a lectores de pantalla. Los tests de geometría (nada tapa la frase, nada sale del espacio) y de recarga y resize pasan en los 15 proyectos.
- **Capacidades:** las planchas quedan sin su etiqueta y sin su referencia duplicadas. A 390 la sección pasa de 3,96 a 3,66 pantallas. No se volvió a la cuadrícula de tarjetas.
- **MOSTRAR / CONVENCER / CONVERTIR:** escala, palabras completas y pin se revisaron a 390, 375 y 320. La única intervención fue retirar la numeración de las palabras; la coreografía aprobada (docs/22) queda igual.
- **Contacto:**
  - El envío, el honeypot, el timing y Resend no cambiaron.
  - Los campos ya medían al menos 17 px (sin zoom en iOS) y tenían `autoComplete` e `inputMode`.
  - Se agregaron `enterKeyHint="next"`, `autoCapitalize` (palabras en el nombre, ninguno en el email) y `spellCheck={false}` en el email.
  - Las safe areas ya estaban: `viewportFit: cover` y `env(safe-area-inset-*)` en el header y en el pie del CTA.
- **Transversal:**
  - Sin scroll horizontal en ningún viewport.
  - Sin `100vh` problemáticos nuevos: las secciones nuevas usan `svh` sólo para el ritmo vertical.
  - Sin elementos sticky nuevos.
  - La reproducción en iOS usa `playsInline` y `muted`, igual que antes.

## 6. QA y optimización (Fase 6)

### Rendimiento

**Capacidades renderizaba sus escenas dos veces.**
- **Antes:** el HTML llevaba las seis escenas de las filas (teléfono y tablet) y las seis del escenario compartido (desktop).
- **Ahora:**
  - el servidor envía un solo juego, el de las filas, que es también lo que ven teléfono, tablet y no-JS;
  - en pantallas anchas el cliente cambia ese juego por el del escenario (`useWide`, `useSyncExternalStore` sobre `(min-width: 1024px)`).
- **Nodos de la sección:** 351 → 176. **Nodos del HTML:** 853 → 785, aun con dos secciones nuevas.

**La hidratación.**
- **Problema:** las líneas de tiempo nuevas («Una sola visión» y los reveals del Perfil) se construían en el commit de la hidratación y sumaban unos 80 ms de TBT móvil. Medido: la tarea larga de React pasó de 224 a 288 ms.
- **Corrección:** ahora se construyen cuando la sección queda a 1,5 viewports (`src/lib/approach.ts`). Hasta entonces la sección es su página estática.

**Lighthouse 13.5** (mediana de 3 corridas por tanda; la base y la Blue Edition se corrieron intercaladas en la misma sesión; `qa/blue/lh/`):

| | Base `faae87c` móvil | Blue móvil | Base desktop | Blue desktop |
|---|---|---|---|---|
| Performance | 87 · 85 · 89 | **88 · 90 · 90** | 100 | 100 |
| LCP | 3,56 · 3,58 · 3,53 s | **3,54 · 3,46 · 3,49 s** | 0,73 s | **0,71 s** |
| TBT | 201 · 267 · 142 ms | **167 · 129 · 113 ms** | 0 ms | 0 ms |
| CLS | 0 | 0 | 0 | 0 |
| Accesibilidad | 100 | 100 | 100 | 100 |
| JS (transfer) | 221 KB | 222 KB | 221 KB | 222 KB |
| Peso total | 387 KB | 393 KB | 379 KB | 384 KB |

(Tres tandas en móvil y una en desktop. Los +6 KB son las dos imágenes de los fragmentos del Perfil, que el navegador pide de forma diferida, `loading="lazy"`, lejos del primer viewport.)

- **Antes de construir las líneas de tiempo al acercarse,** la Blue Edition daba TBT de 247 ms, con una corrida atípica de 1 231 ms. Ese fue el dato que llevó a corregirlo.
- **El LCP sigue siendo el índice del hero,** que la apertura revela por diseño a los 1,2 s. Ya fallaba el presupuesto de 2,5 s en la base (docs/18).

**Fluidez y memoria** (`qa/blue/perfscroll.jsonl`: Chromium con GPU, el journey completo con la rueda, ida y vuelta):

| | 1440 base | 1440 Blue | 390 base | 390 Blue |
|---|---|---|---|---|
| Frame p50 / p95 / p99 | 16,7 / 16,8 / 16,8 ms | 16,7 / 16,7 / 16,8 ms | 16,7 / 16,8 / 16,8 | 16,7 / 16,7 / 16,8 |
| Long tasks | 1 (52 ms) | 0 | 0 | 1 (57 ms) |
| Nodos DOM en vivo | 1 329 | **1 179** | 1 326 | **1 176** |
| Heap tras GC, carga → ida y vuelta | 4,5 → 7,0 MB | 4,5 → 7,5 MB | 4,5 → 6,9 MB | 4,4 → 7,3 MB |
| Heap en tres idas y vueltas | 7,0 / 7,2 / 7,3 MB | 7,4 / 7,6 / 7,6 MB | — | — |

- **Sin fuga:** en la Blue Edition el heap se estabiliza en la segunda vuelta. Los ≈ 0,4 MB de más son las dos líneas de tiempo nuevas y sus ScrollTriggers.

### Largo del journey (`scripts/measure-journey.mjs`, en viewports)

| Viewport | Base `faae87c` | Blue | Cambio | Dónde |
|---|---|---|---|---|
| 1440 × 900 | 19,47 | 21,25 | +9,1 % | Una sola visión +1,21 · Capacidades 2,62 → 2,42 · Perfil 1,60 → 2,36 |
| 1366 × 768 | 19,88 | 21,78 | +9,6 % | Una sola visión +1,32 · Capacidades −0,22 · Perfil +0,81 |
| 820 × 1180 | 16,85 | 18,77 | +11,4 % | Una sola visión +1,19 · Perfil +0,83 |
| 430 × 932 | 18,46 | 20,40 | +10,5 % | Una sola visión +1,52 · Capacidades −0,28 · Perfil +0,70 |
| 390 × 844 | 19,13 | 21,16 | +10,6 % | Una sola visión +1,61 · Capacidades 3,96 → 3,66 · Perfil 1,86 → 2,60 |
| 320 × 568 | 18,19 | 20,35 | +11,9 % | Una sola visión +2,22 · Capacidades 5,80 → 5,27 · Perfil 3,13 → 4,02 |
| 1440, reduced motion | 11,36 | 12,92 | +13,7 % | Una sola visión y Perfil |

- **El crecimiento es contenido pedido,** no huecos: una sección nueva y los recursos visuales del Perfil y de Meta Ads.
- **Lo que se recuperó:**
  - Capacidades bajó en todos los viewports, al retirar las etiquetas duplicadas;
  - THE SHIFT bajó en 320 y bajo reduced motion, al pasar su título y sus números a lectores de pantalla;
  - el Perfil se compactó en teléfonos chicos, con fragmentos cuadrados y una secuencia más corta.

### Pruebas

| Verificación | Resultado |
|---|---|
| `tsc --noEmit` | ok |
| ESLint (`src`, `tests`, `scripts`) | 0 problemas |
| `next build` + `check:assets` | ok. Sólo los avisos de siempre: pósters crudos y los slots de `check:launch` |
| Vitest | 221 / 221 |
| Playwright Chromium (15 proyectos) | **692 / 692** (1 002 listados, 310 omitidos por proyecto) |
| Playwright WebKit 1440 / 390 + Firefox 1440 (un worker) | **350 / 350** (501 listados, 151 omitidos) |
| axe | sin violaciones serias ni críticas en Una sola visión, Capacidades, Perfil, THE SHIFT, Propuesta, reel y casos |

**Tests nuevos:**
- `vision.spec`: el lugar y el copy exacto; la composición por layout; la transformación con scrub, hacia adelante y hacia atrás, sin pin y sin capturar la rueda; axe; reduced motion; sin JS.
- `identity.spec`: cero rojos pintados en la home; el acento donde marca; el error semántico; el rojo de Rayo.
- **Capacidades:** nunca los dos juegos de escenas, y las planchas sin etiquetas.
- **Perfil:** composición de lado (desktop) o en orden de lectura (teléfono); los recursos son material real y las palabras del propio párrafo; nada se oculta al volver a subir.

**Fallas encontradas y qué eran:**
- **Regresión, corregida: Atrás desde un caso, en WebKit.** Al volver Atrás, WebKit restaura primero su propia posición, más abajo en la página. Desde ahí «Una sola visión» quedaba dentro del margen y se construía; su refresh de ScrollTrigger llegaba después del aterrizaje y corría la vista 50–100 px (3 de 6 aisladas; la base pasaba 6 de 6). `onApproach` ahora empieza a observar cuando el journey aterrizó (`main[data-started]`). Después: 6 de 6, y la vista se queda en el lugar recordado (trazado cada 100 ms).
- **Corregido: la tarjeta del reel en teléfonos bajos.** El intento de achicarla (§5) estiró el escenario a 320, y lo detectó la e2e de composición. Se revirtió el tope y el índice se arregló de otra forma.
- **Tests de la base que no verificaban nada, corregidos:**
  - En `foundation.spec` (la falla del bundle), una regex `/\bjs\b/` se había guardado con caracteres de retroceso (U+0008) en vez de `\b`, en una sesión anterior. La aserción «la clase de `<html>` no contiene `js`» nunca podía fallar. Ahora verifica de verdad, y pasa.
  - Con el mismo error, el chequeo nuevo de `content.test` saltaba el texto con énfasis.
- **Tests actualizados por el diseño nuevo:**
  - el orden de las secciones, que ahora incluye `vision`;
  - el acento de THE SHIFT;
  - los textos sin JS;
  - el Perfil, Meta Ads y la cabecera de Capacidades.
  - Ninguna aserción se relajó.
- **Intermitentes:**
  - Una corrida intermedia en Chromium dio una falla en «the address follows the visitor» (Propuesta, `rm-1440`). Pasó al repetirla y en las dos corridas completas siguientes.
  - En las corridas cruzadas de docs/26, WebKit daba 0–1 fallas sueltas por corrida, bajo la carga de decodificar H.264 por software. En la corrida final no hubo ninguna.

### Capturas

- **Antes / después,** en los mismos estados de ambos builds: `docs/assets/blue/{base,after}-{1440,390,320}-*.jpg`.
- **Estados capturados:**
  - el reel;
  - THE SHIFT;
  - lo que sigue a THE SHIFT (antes, la apertura de Capacidades; ahora, «Una sola visión»), en dos momentos;
  - el índice de Capacidades;
  - el Perfil, en dos momentos;
  - Meta Ads;
  - el contacto.
- **Hojas de contacto del recorrido completo:** 390, 375, 320 y 1440, en `qa/blue/j*/` (no versionadas).

## 7. Pendientes y riesgos

1. **Safari e iOS reales.** No hay acceso a un dispositivo Apple verificable: lo de WebKit es el WebKit de Playwright en Windows, no Safari. Siguen pendientes:
   - la reproducción de las películas;
   - el costo de decodificación (docs/26);
   - `color-mix` (Safari 16.2 o posterior).
2. **[CONFIRMAR] Pies de los fragmentos del Perfil:** hoy dicen el tipo de proyecto, no su nombre (§3).
3. **El índice «00 → 01» del hero se conserva** (§4). Si Franco quiere retirarlo, la apertura O2 necesita otro contenido.
4. **Largo en teléfono:** «Una sola visión» suma unos 1,6 viewports a 390 (§6). Es contenido nuevo, no hueco.
5. **En teléfonos bajos** (375 × 667, 320 × 568) «Ver caso» del reel queda justo bajo el pliegue (§5).
6. **Sin cambios:** siguen los bloqueantes de lanzamiento de docs/20 §3, o sea el retrato, las pruebas, Resend y el dominio.

## 8. Commits

Locales, sobre `faae87c`, sin push ni deploy. Uno por fase. Los archivos con cambios de varias fases (`globals.css`, `site.ts`, `Journey.tsx`, `CapabilitiesIndex.tsx` y cinco specs) se partieron por bloque. Cada commit intermedio pasa `tsc --noEmit`.

| Commit | Fase |
|---|---|
| `1d8f2dd` | 2 · Blue Edition: tokens, rojo semántico y de Rayo, `identity.spec` |
| `a97d4f4` | 3 · Una sola visión, Perfil, Meta Ads; Capacidades con título y un juego de escenas; movimiento al acercarse |
| `041f47e` | 4 · «Proyectos que construí.» y microetiquetas |
| `ba05315` | 5 · mobile: índice del reel entero, teclado del formulario |
| `076e798` | 6 · QA: una aserción que no podía fallar |
| siguiente | 7 · documentación: este informe, capturas, Content Master §25, `CLAUDE.md`, `README.md` |

