# 25 · THE SHIFT: de la complejidad al producto

Fecha: 2026-10-21 · Pedido de Franco: «REVELADO 2.2 — MASTER IMPLEMENTATION PROMPT · THE SHIFT — From Complexity to Product» · Base: `c147346` · Sin push ni deploy.

> Este pedido cambia dos decisiones del Spec. El **ruteo híbrido de §20** (un solo documento en `/` y en `/trabajo/[slug]`) se reemplaza por dos documentos: la home y un caso por proyecto. Los **cuatro mundos** dejan de estar en el recorrido principal. Franco lo pidió de forma explícita («retirá las cuatro presentaciones individuales del flujo vertical principal»), así que el cambio queda registrado acá y en `CLAUDE.md`. La dirección de arte, la paleta, la tipografía y el copy de cada mundo no cambian.

## 1. Auditoría (Fase 0)

**Git.** Árbol limpio en `c147346`, sin stashes, un solo worktree. La rama local `wip/parallel-session-2026-10-21` (de la sesión paralela anterior) no se tocó.

**Arquitectura anterior.** `/` y `/trabajo/{slug}` renderizaban el mismo `Journey`:
- secciones en orden: hero → reel → cuatro mundos (cada uno con su prueba) → capacidades → declaración → perfil → contacto;
- entrar desde el reel era un `pushState` y un salto invisible al SCREEN del mundo, en el mismo rectángulo del reel;
- un deep link aterrizaba en el mundo dentro del documento completo, con el hero oculto;
- sin JS, «Ir a {proyecto}» saltaba al ancla.

Respuestas a las siete preguntas del brief:

1. **El showreel** es la sección `#trabajo` (`ProjectReel`). Empieza después del hero y termina en el primer mundo; en 1440 mide 1,36 viewports.
2. **Las presentaciones individuales** se construyen así:
   - `TravelSuiteWorld`, `RayoWorld`, `SantiWorld` y `ChefWorld` (sobre `WorldScene`), cada uno con un pin `sticky` de `useScene`, seguido de `ProjectProof`.
   - TravelSuite360 cerraba con la costura roja TS12 hacia Rayo.
   - La salida de Chef caía sobre el riel de Capacidades.
3. **Dependencias con la navegación:**
   - `route-sync` mapea un mundo a `/trabajo/{slug}`;
   - `journey-nav.navigate` hacía pushState más el salto, `syncUrl` reemplazaba la URL al scrollear;
   - el cabezal mostraba «0n / 04»;
   - el overlay 01–04, los enlaces «Siguiente →» y los de atribución de capacidades apuntaban a esas URLs;
   - el clic del reel llamaba a `navigate`.
4. **Reutilizable sin cambios:**
   - los cuatro mundos y `ProjectProof`;
   - `useScene` (pin sticky, `presized` y `lazy`, como la declaración);
   - el patrón de espacio de diseño por variante de `Declaration`;
   - `SiteHeader`, `ReelOverlay` y `JourneyClient`.
5. **A conservar:** todo el copy de §06–§09 y §17, los medios y los créditos de cada proyecto.
6. **Conexión con Capacidades:** el pin de Capacidades arranca con la costura del busto («Todo lo anterior pasó por las mismas manos.»).
7. **Pins y su recorrido**, en viewports a 1440×900:

| Sección | Recorrido |
| --- | --- |
| hero | 3,60 |
| reel | 1,36 |
| TravelSuite360 + prueba | 7,00 + 1,18 |
| Rayo + prueba | 5,56 + 1,21 |
| Santi + prueba | 5,32 + 1,24 |
| Chef + prueba | 6,12 + 1,18 |
| capacidades | 3,39 |
| declaración | 6,52 |
| perfil | 1,54 |
| contacto | 1,05 |
| **total** | **46,26** |

Los cuatro mundos con sus pruebas eran **28,8 de 46,3 viewports**.

## 2. Arquitectura nueva (Fase 1)

| | Antes | Ahora |
| --- | --- | --- |
| `/` | hero, reel, cuatro mundos, capacidades, declaración, perfil, contacto | hero → reel → **THE SHIFT** → capacidades → declaración → perfil → contacto |
| `/trabajo/{slug}` | el mismo documento, arrancando en el mundo | **el caso**: cabezal, el mundo, su prueba, el pie (`CaseStudy`) |
| Reel → proyecto | `pushState` y salto dentro del documento | navegación de página a la misma URL; con View Transitions, un fundido de 240 ms (nunca bajo RM) |
| Volver | Atrás dentro del documento | «← Trabajo» (`/#trabajo`) o Atrás del navegador: misma posición y **misma pieza del reel** |
| Siguiente | el mundo siguiente, dentro del documento | el caso siguiente; después de Chef, `/#capacidades` |

Archivos de esta fase:
- **Documentos:**
  - `src/components/journey/Journey.tsx`: sólo la home.
  - `CaseStudy.tsx` (nuevo): el caso, con las vistas de los mundos movidas sin cambios desde Journey.
  - `shared.ts`: cabezal y «Abrir ↗».
  - `features.ts`: los flags opcionales y `RENDERED_AT`.
- **Rutas:** `src/app/page.tsx` y `src/app/trabajo/[slug]/page.tsx`.
- **Navegación:**
  - `lib/journey-nav.ts`: `isHere` (una sección de este documento o de otro); `reloadPosition` también para Back/Forward; `rememberedReel`.
  - `JourneyClient`: intercepta sólo los enlaces a secciones del documento; aterriza en anclas (`/#trabajo`, `/#capacidades`) una vez construidas las escenas; en un caso revela el cabezal desde el inicio.
  - `ProjectReel`: el clic en la tarjeta navega a la página; la pieza activa queda en el estado del historial.
  - `SiteHeader` y `ReelOverlay`: `/#perfil`, `/#contacto` y `/#trabajo`, que funcionan desde un caso.
  - `ProjectProof`: el enlace «← Trabajo».
  - `route-sync`: `REEL_HREF`.

**Lo que se retiró y por qué:**
- La costura roja TS12 ya no se dibuja: llevaba a Rayo dentro del mismo documento, y un caso termina en su prueba y sus enlaces. El código de `ProjectProof` sigue soportando `exit: "seam"`.
- Se quitaron «Ir a {proyecto}» (`SITE.world.goTo`) y su CSS `.deep-link`: un caso sin JS ya empieza por su mundo.

No quedan escenas vacías, pins ni triggers de los mundos en la home: sus componentes no se montan ahí. Las URLs no cambiaron.

## 3. THE SHIFT · concepto y storyboard (Fases 2–3)

Una sola escena, pin `sticky` de 2,6 gestos: 208 vh en lg/xl, 182 en md, 156 en sm. Más el escenario, unas **3,1 alturas de viewport en desktop y 2,6 en teléfono**. Hay cuatro estados de reposo, con snap a cada uno:

| Estado (unidad) | Línea | Qué hace la interfaz |
| --- | --- | --- |
| DESORDEN (0) | «Una idea no alcanza.» | 21 fragmentos crudos (contornos, tipografía apagada) sobre una diagonal dibujada a mano: el contenedor como un fantasma inclinado, el titular partido y grande, navegación e indicadores en los bordes, la marca roja como único acento. |
| DIRECCION (0,8) | «Necesita dirección.» | Los fragmentos se enderezan y vuelven a su columna, primero los más cercanos. La retícula aparece columna por columna (12, 8 o 4). En lg/xl la interfaz se abre como **axonometría explotada**: el plano se inclina 52° y gira −28°, y cada capa se separa por su profundidad. En md/sm, vista explotada plana. |
| EJECUCION (1,6) | «Y ejecución.» | Las capas se cierran en un plano, entra la superficie papel y luego la tinta. **El gesto:** el control «Publicar» se enciende, el estado pasa de «Borrador» a «Publicado», la barra se llena y el módulo «Interfaz» responde (se levanta y se marca). |
| RESULTADO (2,3) | «De la idea al producto.» | La cámara retrocede (0,86, 0,88 o 0,90). Aparecen tres anotaciones del sistema (retícula, tipografía, estado) y la leyenda «Interfaz conceptual, diseñada para esta sección.», que sigue la esquina de la interfaz. Se sostiene 0,3 gestos y suelta el pin. |

**Continuidad.** Ningún elemento se intercambia por otro: el que termina en la interfaz es el mismo nodo desde el primer cuadro. CSS lo ubica donde lo tiene la interfaz terminada y el desorden es la transformación inversa medida en cada build (FLIP). La capa cruda y la terminada viven en el mismo fragmento y sólo cambian por opacidad.

**La interfaz conceptual.** Es una página de producto ficticia con marca «Concepto»:
- navegación, botón «Empezar», eyebrow y el titular «Todo encuentra su lugar.»;
- una imagen hecha con CSS (sol rojo, horizonte);
- tres módulos: Estructura, Interfaz y Función;
- el control «Publicar».

No es un proyecto, no lleva métricas ni nombres de clientes (lo verifica `tests/shift.test.ts`), y la leyenda lo dice. Para el lector de pantalla es una imagen (`role="img"`) con una descripción, sin enfocables ni controles falsos: el gesto es una demostración atada al scroll, no una interacción.

**Dirección de arte.**
- Paleta, Schibsted Grotesk y Plex Mono, negro y papel, el rojo como acento único.
- Sin partículas, brillos, gradientes ni glass.
- Profundidad sólo en lg/xl (regla de Spec §15).
- No se muestra el nombre «THE SHIFT»: Content Master §03 no admite etiquetas en inglés. La sección muestra su subtítulo.

**Entrada y salida.**
- Entra justo después del reel con el desorden ya compuesto: la escena se construye un viewport antes de llegar, así que nunca aparece vacía.
- Sale hacia Capacidades. Ahí la auditoría encontró **un cuadro negro**: el busto de la costura aparecía con opacidad 0 al empezar el pin.
- Corrección: el busto entra mientras la sección sube a la vista (un scrub propio en `CapabilitiesRail`), y el pin arranca con él a opacidad 1. `SEAM_IN` sale de `lib/capabilities-rail.ts` y el test del riel ahora exige opacidad 1 al inicio del pin.

## 4. Arquitectura GSAP (Fase 4)

- `src/lib/shift.ts` es puro (sin GSAP), compartido por la escena y los tests:
  - estados y unidades, `within` y `span`;
  - variantes (`shiftVariant`, las mismas condiciones que la declaración);
  - caja de la interfaz y zona del texto;
  - layout de cada fragmento por variante (fracciones de la interfaz, tipo en `cqw`);
  - poses del desorden, profundidades de capa, explosión plana y escala final;
  - `scatterBounds` para los tests.
- `src/components/shift/Shift.tsx`: un `useScene` con pin `sticky`, `presized` y `lazy`, scrub 0,6, snap a los estados.
  - El build mide todo antes de escribir (`offsetLeft` y `offsetTop` relativos al espacio: sin layout forzado).
  - Una sola línea de tiempo determinista, sólo transform y opacity.
  - Revert completo con el `matchMedia` de la sección (tier, RM, tiny) y rebuild al cambiar el ancho.
- Las primeras poses de los grupos escalonados se fijan con `gsap.set`. Un `fromTo` con `stagger` sólo renderiza de inmediato su primer objetivo: 11 de las 12 columnas de la retícula se veían en el acto I hasta corregirlo.
- `will-change: transform` sólo en los fragmentos dentro del escenario animado.
- Fuera del viewport la escena no hace trabajo: es scrub puro, sin loops.

## 5. Mobile y tablet (Fase 5)

Cada variante tiene su propio dibujo, no la versión desktop reducida.

- **Teléfono (390×844):**
  - composición vertical: título y línea arriba, la interfaz como pantalla de app debajo;
  - navegación con menú, chip «Publicado» sobre la imagen, botón y «Publicar» en una fila, dos módulos (el tercero y la navegación textual se simplifican);
  - desorden propio en retrato, vista explotada plana;
  - anotaciones encima de la interfaz y leyenda debajo.
- **Tablet vertical (820×1180):** el mismo orden vertical con navegación completa, tres módulos y la imagen a lo ancho.
- **320 px (tiny):** la página estática, igual que con movimiento reducido.

Ninguna línea queda bajo un fragmento (test de geometría y e2e), no hay overflow y el texto mínimo es de 11 px.

## 6. Accesibilidad y fallbacks (Fase 6)

- **Reduced motion, viewports tiny y sin JS:**
  - la página estática: las cuatro líneas (con su número y título) y la interfaz terminada en reposo, con el control encendido y «Publicado»;
  - la leyenda;
  - sin pin y sin anotaciones.
- **Semántica:** `h2` con el título, `ol` con los cuatro actos y `figure` con la interfaz (`role="img"`, descripción) y `figcaption`. Lo decorativo es `aria-hidden` o queda dentro de la imagen.
- **Contraste:** la tipografía cruda del acto I cumple AA sobre negro en todas las poses (fragmentos con texto a opacidad ≥ 0,9). Axe lo había marcado y está corregido.
- **Navegación entre documentos:** View Transitions sólo con `prefers-reduced-motion: no-preference`; bajo RM es un corte.

## 7. Rendimiento (Fase 7)

THE SHIFT usa sólo elementos web: no agrega videos, imágenes, canvas, WebGL, filtros ni librerías. Lighthouse 13.5 se corrió alternando base (`c147346`, en un worktree aislado) y nuevo, 6 corridas por lado, sobre `next start`. Los valores son medianas de las 6.

| Métrica | Base | THE SHIFT |
| --- | --- | --- |
| Móvil · performance | 71–80 | 69–88 |
| Móvil · LCP | 3,75 s | **3,41 s** |
| Móvil · TBT | 435 ms | **225 ms** |
| Móvil · CLS | 0 | 0 |
| JS transferido (`/`) | 230 KB | **220 KB** |
| Peso total (`/`) | 429 KB | **357 KB** |
| Desktop · performance | 100 | 99–100 |
| Desktop · LCP | 0,72–0,76 s | 0,72–0,82 s |
| Accesibilidad (Lighthouse) | 100 | 100 |

El TBT móvil varía mucho entre corridas en las dos versiones: una tanda de «después» dio 853 ms y otra de «base», 823. En los dos casos coincide con Remotion Studio corriendo en el puerto 3000 de la misma máquina. Por eso se dan medianas y no corridas sueltas.

**Fluidez y memoria.** Rueda real por toda la home, ida y vuelta (`rAF` por cuadro, tareas largas, heap después de GC por CDP):

| | Base 1440 | Ahora 1440 | Base 390 | Ahora 390 |
| --- | --- | --- | --- | --- |
| Píxeles recorridos | 81 464 | 35 156 | 64 374 | 30 918 |
| Cuadro p50 / p95 / p99 (ms) | 16,7 / 16,8 / 50 | 16,7 / 16,8 / 33,3 | 16,7 / 16,8 / 16,8 | 16,7 / 16,7 / 16,8 |
| Cuadros > 50 ms | 22 | **0** | 2 | **0** |
| Tareas largas | 0 | 1 (50 ms) | 0 | 0 |
| Heap al cargar / tras la vuelta | 5,4 / 7,2 MB | 4,4 / 6,6 MB | 5,4 / 7,1 MB | 4,4 / 6,4 MB |
| Nodos DOM | 1 243 → 1 544 | 894 → 894 | 1 247 → 1 248 | 899 → 899 |

Fuga: tres vueltas seguidas dejan el heap en 6,6 → 6,7 → 6,8 MB, con los nodos estables. No hay fuga: el salto de la primera vuelta son las escenas que se construyen al acercarse.

**INP.** No hay interacción nueva en la home: THE SHIFT no tiene controles. El clic de las tarjetas del reel ahora navega en lugar de animar un salto.

## 8. QA y pruebas (Fase 8)

**Defectos que encontró la QA y quedaron corregidos:**

1. **Un hold de vista sobrevivía a los builds perezosos** (`useScene.anchored`).
   - La declaración y THE SHIFT se construyen al acercarse y no disparan refresh. La sección retenida durante ese build nunca se soltaba.
   - El build perezoso siguiente devolvía la vista ahí: un salto de Perfil hacia arriba, a THE SHIFT, volvía a Perfil y la URL no seguía al visitante.
   - Corrección: un hold que toma un build se suelta al restaurarse, salvo que haya un refresh pendiente.
2. **Un cambio de ancho mandaba la página a `y = 0`** (`useScene` resize).
   - Cada escena leía `scrollY` en su propio temporizador, a veces en medio del refresh de ScrollTrigger, que mide con el documento en 0.
   - Corrección: la sección del centro se anota una vez, en el primer evento de resize, antes de cualquier rebuild o cambio de media query. Se restaura en cada refresh y al asentarse.
   - Resultado: 1440 → 1360 conserva el lugar en todas las secciones, sin pasar por el tope (medido cada 100 ms). La base ya se corría unos 980 px en Perfil.
3. **Cuadro negro entre THE SHIFT y Capacidades:** el busto entra con la sección (§3).
4. **Retícula visible en el acto I:** el `stagger` sólo renderizaba el primer objetivo (§4).
5. **Contraste AA:**
   - en la tipografía cruda del acto I;
   - en el eyebrow y los índices de la interfaz terminada (tinta al 68 % y al 72 %);
   - en el chip «Publicado» sobre la imagen en teléfono.
6. **Atrás desde un caso volvía al reel en la pieza 01:** la pieza activa ahora vive en el estado del historial.
7. **La cabecera de un caso nunca aparecía:** sólo la revelaba el opening de la home.
8. **WebKit: 1 de cada 4 cambios de ancho dentro de THE SHIFT terminaba en el tope.** WebKit puede entregar el cambio de media query del tier antes que el evento resize, así que la posición leída en ese evento ya podía ser 0. La vista se recuerda cada vez que el scroll queda en reposo y el resize restaura esa. La prueba de resize repetida 4 veces en Chromium (4 tamaños), WebKit (2) y Firefox dio 28 / 28.

**Resultados finales.** Están en el registro de integración (§13), corridos sobre el `main` commiteado.

**Pruebas nuevas:**
- `tests/e2e/shift.spec.ts`:
  - el orden de la home y que no queden mundos en ella;
  - los cuatro estados, de ida y de vuelta, con una línea por vez;
  - FLIP en reposo: cada fragmento exactamente en su lugar;
  - el gesto, el resultado y la leyenda;
  - nada tapa la línea ni sale del viewport;
  - sin saltos al entrar ni al salir, y rueda nativa;
  - recarga, resize, axe;
  - página estática bajo RM o tiny, y sin JS.
- `tests/e2e/cases.spec.ts`:
  - cada «Ver caso», y la tarjeta entera como puerta;
  - «← Trabajo» y la cadena de «Siguiente →» hasta Capacidades;
  - la cabecera desde un caso;
  - Atrás a la misma posición;
  - los casos sin JS.
- `tests/shift.test.ts`: tiempos, variantes, límites del desorden, zona del texto, capas, contraste de la tipografía cruda y copy sin métricas ni proyectos.

**Pruebas adaptadas.** Describían la arquitectura anterior. Ninguna aserción vigente se aflojó.
- `world.spec`: el rectángulo compartido ahora se compara entre la home y el caso; Ver caso → caso → Atrás vuelve a la misma pieza y a la misma posición; el corte bajo RM.
- `foundation`: home sin JS, casos sin JS, sincronización de la URL, chunk caído en la home y en un caso.
- `travelsuite`, `rayo`, `santi`, `chef`: continuidad dentro de cada caso.
- `capabilities`: los enlaces de atribución abren el caso; el busto está visible al empezar el pin.
- `declaration` y `opening`: el orden de la home; un deep link es el caso sin hero.
- `content.test`: la home y cada caso, cada uno con su copy.

**Se retiraron, junto con el comportamiento que verificaban:**
- el salto invisible a un mundo dentro de la misma página;
- la costura TS12;
- «Ir a {proyecto}».

**QA cinematográfica.** Recorrido con rueda real (tres muescas, pausa), de ida y vuelta por THE SHIFT, grabado en `qa/shift/rec/shift-{1440,820,390}.webm`. Se revisaron:
- ritmo: un acto por gesto, con snap;
- legibilidad: la línea sola en su zona;
- continuidad: los mismos nodos;
- reversibilidad: los estados se deshacen en orden;
- entrada: el desorden ya compuesto al llegar;
- salida: la interfaz sube mientras el busto de Capacidades entra.

Recorridos completos, antes y después, en `qa/shift/{base,after}-{1440,390}/sheet*.png` (copias reducidas en `docs/assets/shift/j-*`).

## 9. Largo del recorrido (medido)

`node scripts/measure-journey.mjs http://localhost:3200`: alto del documento de `/` una vez construidas todas las escenas, sobre `next start`. JSON en `qa/shift/length-{base,after}.json`.

| Viewport | Antes | Después | Reducción |
| --- | --- | --- | --- |
| 1440×900 | 46,26 vh (41 632 px) | 20,53 vh (18 478 px) | **−55,6 %** |
| 1366×768 | 47,15 vh | 21,09 vh | −55,3 % |
| 820×1180 | 38,32 vh | 17,33 vh | −54,8 % |
| 430×932 | 38,35 vh | 18,73 vh | −51,2 % |
| 390×844 | 39,14 vh | 19,32 vh | −50,6 % |
| 320×568 | 27,05 vh | 17,58 vh | −35,0 % |
| 1440 · reduced motion | 28,52 vh | 12,19 vh | −57,3 % |

THE SHIFT mide 3,08 vh en desktop, 2,82 en tablet, 2,56 en teléfono y 1,73 bajo RM (estático). Los casos miden entre 6,6 y 8,3 vh cada uno y sólo los recorre quien los abre.

## 10. Capturas

- `assets/shift/s1-1440-four-acts.jpg`: los cuatro actos en 1440, con la axonometría en el 02.
- `assets/shift/s2-390-four-acts.jpg` y `s3-820-four-acts.jpg`: teléfono y tablet, cada uno con su propio dibujo.
- `assets/shift/s4-static-rm-320.jpg`: la página estática con reduced motion y en 320.
- `assets/shift/s5-case-top-and-end.jpg`: un caso empieza en su SCREEN y termina con «← Trabajo» y «Siguiente →».
- `assets/shift/s6-1440-into-capabilities.jpg`: la salida hacia Capacidades, con el busto ya visible al empezar el pin.
- `assets/shift/j-{1440,390}-{before-sheet0,after}.jpg`: el recorrido de la home, antes y después.

## 11. Riesgos y pendientes

1. **Copy a confirmar por Franco** (Content Master §23): la leyenda, las anotaciones y todo el texto de la interfaz conceptual.
2. **Spec §20 reemplazado.** El ruteo en dos documentos sustituye al documento único. La transición del reel al caso ya no es el salto invisible: es una navegación de página. Con View Transitions (Chromium, Safari 18.2+) es un fundido de 240 ms sobre el mismo rectángulo; en los demás navegadores, un cambio de página normal.
3. **Los casos dependen de los mismos assets pendientes que antes.** En particular, el SCREEN de TravelSuite360 es un placeholder honesto: un caso que empieza con un rectángulo vacío hasta que llegue el material con la firma de privacidad de §23.
4. **La costura TS12 se conserva en el código** (`ProjectProof` `exit: "seam"`) sin uso. Se puede retirar si no vuelve.
5. **Bajo carga paralela**, un test de píxeles del rectángulo compartido (sm-390, Chef) dio 7 % una vez; repetido, 3 / 3 bajo el 1 %. Es decodificación de imágenes con 6 workers.
6. **Sin dispositivos reales ni lectores de pantalla:** la pasada manual sigue pendiente (como en docs/17–19).
7. **«THE SHIFT» no aparece en pantalla.** Si Franco quiere mostrarlo, hace falta una excepción explícita a §03.

## 12. Archivos

- **Nuevos:**
  - `src/lib/shift.ts`, `src/components/shift/Shift.tsx`;
  - `src/components/journey/CaseStudy.tsx`, `shared.ts`, `features.ts`;
  - `scripts/measure-journey.mjs`;
  - `tests/shift.test.ts`, `tests/e2e/shift.spec.ts`, `tests/e2e/cases.spec.ts`;
  - este informe y `docs/assets/shift/*`.
- **Modificados:**
  - `src/app/page.tsx`, `src/app/trabajo/[slug]/page.tsx`;
  - `src/components/journey/{Journey,JourneyClient}.tsx`;
  - `src/components/layout/{SiteHeader,ReelOverlay}.tsx`;
  - `src/components/reel/ProjectReel.tsx`, `src/components/worlds/ProjectProof.tsx`;
  - `src/components/capabilities/CapabilitiesRail.tsx`;
  - `src/lib/{journey-nav,journey-store,route-sync,useScene,capabilities-rail}.ts`;
  - `src/data/site.ts`;
  - `src/app/globals.css`: THE SHIFT, View Transitions, `.case-foot`, se retira `.deep-link`;
  - los specs listados en §8;
  - `docs/05b-content-master.md` (§23), `CLAUDE.md`, `README.md`.

## 13. Registro de integración

Todo queda consolidado en `main` local, sin push ni deploy.

**Auditoría.**
- Un solo worktree. El worktree temporal `.iso-base`, usado para la base de Lighthouse, ya se retiró.
- No hay stashes.
- Los nueve commits aprobados ya estaban en `main`:
  - la pasada de posicionamiento: `4f224da`, `41644de`, `4c5be9d` y `af5755e`;
  - los cuatro bloques de la intervención UX: `9c30ec7`, `6a835ff`, `27af5df`, `29eb75d` y `c147346`.
- No hacía falta merge ni cherry-pick, y no se duplicó nada.
- `wip/parallel-session-2026-10-21` (`f98ca4f`, la instantánea de otra sesión) queda intacta y **sin integrar**, como se pidió.
- Las ramas `backup/antes-revelado`, `feat/portfolio-v2` y `feat/spanish-copy` no tienen commits que falten en `main`.

**Commits de THE SHIFT**, sobre `c147346`:

| Commit | Contenido |
| --- | --- |
| `8364fce` | `useScene`: la vista retenida por un build perezoso se suelta; el resize conserva el lugar |
| `34e48b1` | THE SHIFT: `lib/shift.ts`, `components/shift/Shift.tsx`, CSS, copy (Content Master §23), `tests/shift.test.ts` |
| `586db2c` | la home y un caso por proyecto, la navegación entre documentos, la entrada del busto, los specs nuevos y adaptados, `scripts/measure-journey.mjs` |
| `ad80e2b` | `useScene`: un resize restaura la última vista en reposo (WebKit) |
| este commit | docs: este informe, Content Master §23, `CLAUDE.md`, `README.md` y las capturas |

Cada commit de código se verificó por separado en un worktree aislado: `tsc`, ESLint y Vitest sin los chequeos de HTML.

**Verificación sobre el estado final** (`ad80e2b`; el commit de docs no toca código):

| Suite | Resultado |
| --- | --- |
| `npx tsc --noEmit` · `npx eslint src tests scripts` · `npm run build` | limpios |
| `npx vitest run` | **221 / 221** (14 archivos) |
| `npx playwright test` (Chromium, 6 proyectos) | **647 pasan · 0 fallan** (295 saltadas por variante) |
| `CROSS_BROWSER=1` (webkit-1440, webkit-390, firefox-1440; 2 workers) | **331 pasan · 0 fallan** (140 saltadas) |
