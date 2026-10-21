# 23 · Intervención integral: ritmo, capacidades, contacto y showreel

Fecha: 2026-10-21 · Pedido de Franco: «REVELADO 2.2 — MASTER PROMPT · Intervención integral de UX, dirección de arte, ritmo narrativo y conversión» · Base: `af5755e` · Sin push ni deploy.

> **Origen del trabajo.** Otra sesión empezó este mismo brief y lo dejó a medias, sin commits, a las 15:14. Su estado completo quedó guardado sin tocar en la rama local `wip/parallel-session-2026-10-21` (`f98ca4f`), y sus scripts y capturas sueltos se movieron de la raíz y de `docs/` a `qa/intervention/parallel-session/` (ignorado). Esta tarea partió de ese trabajo, lo verificó pieza por pieza, se quedó con lo correcto, corrigió lo que rompía y descartó lo que contradecía el Content Master (ver §7).

## 1. Diagnóstico inicial (medido)

Se recorrió todo el documento sobre una copia limpia de `af5755e`, con una captura cada ⅓ de viewport (sección y estado de escena en cada cuadro) en 1440×900, 820×1180 y 390×844. Además se corrió un detector de tramos casi vacíos (porcentaje del viewport que se aparta del tono dominante) y se grabó el scroll continuo hacia abajo y hacia arriba.

| Problema | Dónde | Causa técnica (tipo del brief) |
|---|---|---|
| Banda negra entre el final de cada mundo y su prueba, y la ventana de la prueba flotando a media altura | las cuatro transiciones mundo → prueba | **(1) espaciado CSS + (8) layout**: `.world` dejaba `padding-bottom: 10svh` después del pin; la figura de la prueba medía `100svh` con la ventana centrada (`--sy = (100svh − h) / 2`, unos 160 px arriba en 1440) y la prueba sumaba `14svh` abajo. Más de 300 px negros entre la última imagen del mundo y el texto de la prueba, y otro tramo antes del mundo siguiente. |
| Prueba → texto separados | las cuatro pruebas | lo mismo: el texto de la prueba empezaba al final de la figura de 100svh, no después de la ventana y su leyenda. |
| Un viewport casi negro antes del riel de Capacidades | Chef → Capacidades | **(3) distancia de scroll + (7) estado sin contenido**: la costura del busto ocupaba un viewport entero de pin; sin el busto (asset pendiente) sólo queda su placeholder y una línea en mono de 11 px. |
| Tramos largos con la misma imagen quieta | SCREEN → ISOLATE de cada mundo (≈ 1,5 vh), el SCREEN de TravelSuite360 | **(4) contenido estático**: es la gramática aprobada (un gesto por estado), pero los pósters son capturas fijas y el de TravelSuite360 es un placeholder (falta material con la firma de privacidad §23). El video profesional del bloque D es lo que los anima. |
| La UI de TravelSuite360 chica sobre negro (TS03–TS09) | mundo 01 | composición del mundo en su espacio de 1440×900; no es un hueco de layout (ver §8). |
| Tablet vertical: la tarjeta del reel ocupa menos de la mitad del escenario | reel en 820×1180 | **(8) geometría**: el rectángulo compartido 16:9 está centrado en un escenario de 100svh (ver §8). |

Recorridos de antes y después, con sección y estado en cada cuadro, en `qa/intervention/{base,after}-{1440,820,390}/sheet*.png`. Grabaciones continuas en `qa/intervention/rec/{base,after}-{1440,820,390}.webm`. Detector: `qa/intervention/gaps/*.json`.

## 2. Bloque A · ritmo

**Cambios (todos con causa identificada; sin márgenes negativos):**

- Mundo → prueba: el mundo ya no agrega espacio después del pin (`padding: 0`). La prueba empieza donde termina la escena: su ventana va a `12svh` del borde (antes centrada en 100svh), la figura mide sólo ventana + leyenda (`calc(var(--sy) + var(--h) + 88px)`) y el padding inferior baja de `14svh` a `8svh`. La ventana conserva su tamaño de reel, así que las animaciones de la prueba (escala .9 → 1, atenuación a .55) y la costura roja TS12 no cambian; la costura es `position: fixed`.
- Costura del busto: pasa de un viewport a 0,6 (`SEAM_LEN` en `lib/capabilities-rail.ts`, con `seamPx`, `railX`, `cardScroll` y `separationWindow` derivados). Es un ajuste de duración justificado (§5 del brief) y se aparta del texto del Spec §12 («ocupa el primer viewport»): con el busto real, cuando exista, se puede volver a 1.
- **Dos regresiones que las pruebas encontraron y se corrigieron:**
  - *Recarga bajo reduced motion*: con las alturas nuevas del documento sin construir, la recarga en Chef WORLD aterrizaba en otra sección en 5 de 8 intentos. Causa: `holdView` (useScene) retenía la sección que estaba al centro de un documento a medio construir y el siguiente refresh devolvía la vista ahí, encima del aterrizaje. Solución: al aterrizar, `JourneyClient` llama a `anchorView()`, que retiene la sección donde efectivamente se aterrizó. Una primera versión que soltaba la vista (`releaseView`) rompía la compensación de refreshes posteriores en WebKit y se reemplazó. Resultado: 8/8.
  - Tests del riel que asumían una costura de un viewport: ahora leen `SEAM_LEN`, `SEAM_IN` y `RAIL_ENTER_AT` de la misma librería.

**Resultado (largo del documento):**

| Viewport | Antes | Después | Diferencia |
|---|---|---|---|
| 1440×900 | 42 744 px (47,5 vh) | 41 632 px (46,3 vh) | −1,2 vh |
| 820×1180 | 47 376 px (40,1 vh) | 45 222 px (38,3 vh) | −1,8 vh |
| 390×844 | 34 360 px (40,7 vh) | 33 031 px (39,1 vh) | −1,6 vh |

No se acortó ninguna coreografía: todo el ahorro sale de espacio sin contenido. Ver `assets/intervention/a1-1440-ts-to-rayo.jpg`, `a2-1440-rayo-to-santi.jpg` y `a3-1440-chef-to-capacidades.jpg`. En las tres, el mundo encadena con su prueba y la prueba con el mundo siguiente sin bandas negras.

## 3. Bloque B · capacidades

- **Jerarquía de cada tarjeta:**
  1. número en mono y **capacidad** como título grande, entre 28 y 40 px, peso 700;
  2. **valor comercial** en cuerpo `paper-2`;
  3. **evidencia** dentro de un marco propio 16:10 con filete y panel, que nunca toca el título ni el texto;
  4. **referencia** discreta en mono, bajo un filete.

  Las tarjetas del riel son más anchas (`min(600px, 42vw)`). En pantallas bajas (≤ 720 px) el marco se aplana y el título baja un escalón. En md, sm y reduced motion sigue la lista apilada.
- **Nombres según el brief:** Producto · Ingeniería web · Comercio digital · **IA y automatización** · Experiencias interactivas · **Meta Ads y crecimiento**.
- **Valor comercial:** cada enunciado conserva textual su frase aprobada (Content Master §11) y agrega, después de los dos puntos, qué obtiene el cliente, sin hechos nuevos, resultados ni cifras. La 06 es el texto exacto del brief. Se descartaron dos frases de la sesión anterior por agregar afirmaciones sin respaldo: «sistemas que se usan todos los días» y «el scroll… lo hace memorable». Todo queda como **propuesta a confirmar** en el Content Master §22.
- **Meta Ads con más presencia:** la 06 lleva un filete rojo, el título más grande del riel y más aire. **Se retiró el diagrama animado «reach»** que había agregado la sesión anterior: dibujaba personas alcanzadas y el Content Master §11 prohíbe fabricar evidencia para la 06 hasta que exista una campaña real con cifras autorizadas. La 06 sigue en su variante tipográfica, sin marco de evidencia vacío.
- Capturas: `assets/intervention/b1-1440-rail-mid.jpg`, `b2-1440-rail-end.jpg` y `b3-390-meta-ads.jpg`.

## 4. Bloque C · contacto

- **Copy del brief:**
  - eyebrow «Tu próximo proyecto empieza acá» (en mayúsculas por CSS);
  - «Ahora, el tuyo.» sin cambios;
  - texto «Una idea nueva, un negocio que quiere crecer o un producto que necesita dar el siguiente paso. Contame qué tenés en mente.»;
  - botón «Enviar proyecto»;
  - complemento «Hablemos de lo que podemos construir.».

  Reemplaza el apoyo del CTA del Content Master §21: ese texto lo aprobaste el mismo día y lo supera este brief. Registrado en §22.
- **Composición:** dos columnas desde lg (titular y texto | formulario en un panel) y apiladas debajo de lg. El titular pasa a `clamp(56px, 9.2vw, 136px)`. Los campos son amplios (56 px, borde completo) con etiqueta visible. El botón principal mide 64 px y tiene una flecha que se desplaza 6 px al hover. El pie del sitio cierra la sección.
- **Correcciones sobre el trabajo anterior:**
  - el texto de error en rojo sobre el panel daba **4,25:1** a 11 px (axe serio). Ahora va en papel, con una marca roja y el borde rojo del campo;
  - el estado de error tapaba el anillo de foco justo cuando el formulario lleva el foco al primer error. Ahora el foco gana: contorno de papel de 2 px.
- **Funcionalidad intacta** (las pruebas lo verifican): validación cliente/servidor, foco en el primer error, honeypot, tiempo mínimo, rate limit, Resend simulado (2xx → «Brief recibido.»), errores de red y 500 con los datos conservados, y envío sin JavaScript. No se agregaron campos.
- Capturas: `assets/intervention/c1-1440-cta.jpg`, `c2-1440-cta-errors.jpg` y `c3-390-cta.jpg`.

## 5. Bloque D · showreel

- **La infraestructura de video ya existía** y se conserva (`LoopVideo` + `reelVideoPlan`):
  - videos `muted`, `playsInline`, sin controles, `aria-hidden`;
  - reproducción sólo en la pieza activa ya asentada, ≥ 50 % en vista y con la pestaña visible;
  - pausa al salir;
  - `preload` escalonado: `auto` en la activa, `metadata` en las vecinas, nada en las lejanas, que además se desmontan a los 10 s;
  - póster como piso siempre, nunca video bajo reduced motion ni Save-Data, y una sola reproducción decorativa a la vez;
  - si un video no presenta su primer cuadro en 4 s, se descarta;
  - archivo móvil propio por tier (`files.mobile`).
- **Declaración por proyecto** (`lib/showreel.ts`, `showreelOf`): id, nombre, ruta, póster, video (con los tiers que existen) y metadatos, leídos del proyecto y del registro de assets, sin datos nuevos. Un test garantiza tres cosas: que ningún video sale mientras su contrato sea `placeholder`, que el video y el póster no se contradicen, y que un video se integra para los dos tiers o para ninguno.
- **Toda la tarjeta activa es la puerta**: un clic en el póster o en los metadatos entra al proyecto con `pushState` y el salto invisible a su SCREEN, no a un reproductor. La vecina sigue llegando al centro con un clic. El teclado tiene una sola parada por tarjeta («Ver caso»), y su foco enciende el contorno de toda la tarjeta. No hay controles anidados (test). El cursor dice «Ver» sobre toda la tarjeta.
- **Dirección visual:** la imagen manda. Al hover hay un *push-in* lento de 2 % sobre el póster o el video (900 ms; nada bajo reduced motion ni en pantallas táctiles) y un filete de papel. En reposo no hay filete, porque la SCREEN de cada mundo debe seguir idéntica a su tarjeta (≤ 1 %). El nombre del proyecto pasa a 22–28 px, peso 600; el resto de los metadatos queda en micro. No se usan degradados ni overlays.
- Capturas: `assets/intervention/d1-1440-reel.jpg`, `d2-1440-reel-hover.jpg` y `d3-1440-reel-focus.jpg`.

### Videos pendientes (assets)

| Contrato | Hoy | Qué entregar |
|---|---|---|
| `ts.reel.loop` | `placeholder` (y el póster `ts.reel.poster` también: privacidad §23) | loop 16:9 (desktop) y 4:5 (mobile) de un tenant **demo** con la firma §23 |
| `rayo.reel.loop` · `santi.reel.loop` · `chef.reel.loop` | `placeholder` (pósters reales) | loop 16:9 + 4:5, 4–8 s, sin audio, primer cuadro = póster |

Cómo integrar uno:
1. Exportar AV1 y H.264 por tier.
2. Agregar `files: { desktop: { sources: [...] }, mobile: { sources: [...] } }` al contrato en `src/data/assets.ts` y pasar su `status` a `final`. No se toca ningún componente.
3. Correr `npm run build`, `npm run check:assets` y los tests (el de showreel exige los dos tiers).

## 6. Pruebas

- `npx tsc --noEmit`, ESLint sobre `src/`, `tests/` y `scripts/`, y `npm run build`: limpios (`check-assets: ok`).
- **Vitest: 207/207.**
- **Playwright Chromium (6 proyectos): 507 pasados, 0 fallidos** antes de los últimos dos tests del CTA; después, `contact` y `reel` dieron 149/149.

  Tests nuevos o actualizados:
  - tarjeta entera como puerta y cursor;
  - cierre a dos columnas, copy exacto y botón ≥ 56 px;
  - foco visible en el primer error y contraste del mensaje;
  - riel atado a `SEAM_LEN`;
  - nombres y enunciados de capacidades;
  - copy del CTA.
- **WebKit 1440/390 y Firefox 1440 (suite completa): 255 pasados, 1 fallido.** El rojo es «la SCREEN de TravelSuite360 es su tarjeta» en WebKit, con la SCREEN 96–304 px corrida. Bajo la misma carga (`--repeat-each=3`), la **base `af5755e` falla igual**, en ese mismo test y en otros dos de `world.spec`. Con un solo worker pasa 6/6 en las dos versiones, así que es un flake previo de WebKit en Windows bajo carga, no una regresión.
- **Teclado:** el orden de foco no cambió en 1440, 820, 390 y RM (saltar al contenido → marca → «Ver caso» → «Siguiente →» ×4 → Capacidades → formulario). Ningún foco quedó oculto, chico o sin anillo.
- **axe** (serio/crítico) en hero, work, perfil y contacto: 0 en las cuatro vistas.
- Overflow horizontal 0 y consola limpia en todas las vistas.
- **No hecho:** lector de pantalla (VoiceOver, NVDA) y dispositivos físicos: no hay acceso en este entorno.

## 7. Impacto en rendimiento

Lighthouse 13.5 sobre home, A/B contra `af5755e`:
- desktop: 3 corridas por versión;
- móvil: 3 corridas más otras 4 intercaladas base/después.

**La máquina estaba cargada por Remotion Studio** (otro proyecto en el puerto 3000, con sus navegadores headless), así que los valores absolutos de TBT y LCP móviles fluctúan mucho dentro de una misma versión (TBT de 291 a 2196 ms). Por eso se reporta la comparación y no un valor:

| | Base | Después |
|---|---|---|
| Desktop | perf 100 · TBT 59 ms · LCP 0,79 s · CLS 0 | perf 100 · TBT 0 ms · LCP 0,73 s · CLS 0 |
| Móvil (4 intercaladas, mediana) | TBT 1434 ms · LCP 3,94 s · CLS 0 | TBT 1165 ms · LCP 4,17 s · CLS 0 |
| JS inicial | 230 KB | 230 KB (sin cambios) |
| Bytes totales (móvil) | 369 KB | 429 KB |

Diferencias:
- **Bytes:** los +60 KB son una sola imagen, `burger-desktop@2x.avif`. El documento sin construir es más corto y deja el mundo de Rayo dentro de la distancia de carga diferida de Chrome. Está bajo el pliegue, se pide `lazy` y no afecta LCP ni CLS.
- **LCP:** no se puede afirmar ni mejora ni empeoramiento: las corridas se solapan (3,47–4,37 s antes, 3,71–4,64 s después).

## 8. Riesgos residuales y decisiones abiertas

1. **SCREEN → ISOLATE de cada mundo** (≈ 1,5 vh con la misma imagen). Es la gramática aprobada, un gesto por cambio, y no se tocó. Si se quisiera acortarla, sería una decisión de dirección: afecta a los cuatro mundos, sus deep links y sus pruebas. Con los videos profesionales en el reel ese tramo gana movimiento.
2. **TravelSuite360 TS03–TS09:** la UI del mundo es chica sobre negro. Es su composición (espacio 1440×900) y su material está bloqueado por privacidad. Rediseñarla excede «ajustes puntuales».
3. **Tablet vertical (reel y SCREEN):** el rectángulo compartido 16:9 centrado en 100svh deja aire arriba y abajo. Corregirlo exige un rectángulo compartido propio para tablet vertical en el reel, las cuatro SCREEN y las pruebas a la vez.
4. **Costura del busto:** sigue con ~0,6 vh casi vacío mientras falte `franco.bust`.
5. **Spec §12:** la costura dejó de durar un viewport. Queda documentado acá; el Spec no se reescribió.
6. **Copy por confirmar** (Content Master §22): los enunciados de capacidades 01–05, el «Creo campañas» en primera persona dentro de una tarjeta y la sustitución del apoyo del CTA del §21.
7. **Meta Ads aparece dos veces** (la capacidad 06 y el bloque del Perfil del §21). Hoy leen complementarios: oferta comercial en el riel y lado humano en el Perfil.
8. El flake de WebKit bajo carga (§6) es previo y queda como está.

## 9. Archivos y commits

- **Bloque A · ritmo:**
  - `src/app/globals.css` (mundo y prueba);
  - `src/lib/capabilities-rail.ts`, `src/components/capabilities/CapabilitiesRail.tsx` (costura);
  - `src/lib/useScene.ts` (`anchorView`), `src/components/journey/JourneyClient.tsx`;
  - `tests/capabilities.test.ts` y `tests/e2e/capabilities.spec.ts` (costura).
- **Bloque B · capacidades:**
  - `src/data/capabilities.ts`;
  - `src/app/globals.css` (tarjetas);
  - `tests/content.test.ts`, `tests/e2e/capabilities.spec.ts` y `tests/e2e/foundation.spec.ts` (nombres y textos).
- **Bloque C · contacto:**
  - `src/data/site.ts`, `src/components/contact/FinalCta.tsx`, `BriefForm.tsx`;
  - `src/components/journey/Journey.tsx` (props del CTA);
  - `src/app/globals.css` (CTA y formulario);
  - `tests/content.test.ts` y `tests/e2e/contact.spec.ts`.
- **Bloque D · showreel:**
  - `src/lib/showreel.ts` y `tests/showreel.test.ts`;
  - `src/components/journey/Journey.tsx` (ruta desde la declaración);
  - `src/components/reel/ProjectReel.tsx`, `ReelCursor.tsx`;
  - `src/app/globals.css` (tarjeta);
  - `tests/e2e/reel.spec.ts`.
- **Docs:** este informe, `docs/assets/intervention/*.jpg` (1,1 MB), `docs/05b-content-master.md` (§22), `CLAUDE.md` y `README.md`.

Commits locales (sin push ni deploy), sobre `af5755e`:

| Bloque | Commit |
|---|---|
| A · ritmo | `9c30ec7` |
| B · capacidades | `6a835ff` |
| C · contacto | `27af5df` |
| D · showreel | `29eb75d` |
| Docs | el commit que agrega este informe |
