# 24 · Pasada de posicionamiento: copy, autoridad y presentación

Fecha: 2026-10-21 · Pedido de Franco («REVELADO 2.2 — MASTER PROMPT: optimización de copy, autoridad profesional y posicionamiento comercial») · Copy: Content Master §21 (addendum de esta fecha) · Base: `53b903a`. Sin push ni deploy.

> **Nota de numeración.** Este documento es `24` porque el código en curso de otra tarea (Capacidades / ritmo del scroll) ya cita un `docs/23` que todavía no existe en el repositorio. No se tocó nada de esa tarea (ver §8).

## 1. Qué cambió (texto exacto)

| Dónde | Antes | Ahora |
|---|---|---|
| Hero · categoría (`hero.firma`) y firma del header (`nav.firma`) | PRODUCTO × DISEÑO × INGENIERÍA | **PRODUCTO × DISEÑO × INGENIERÍA × CRECIMIENTO** |
| Hero · línea principal (`hero.support`) | «Diseña y construye productos digitales, de la idea al sistema en producción.» | **«Transforma ideas y negocios en productos digitales que destacan, funcionan y generan oportunidades.»** |
| Perfil · declaración (`profile.core`) | «Diseño y construyo productos digitales: la idea, la interfaz, el código y lo que pasa después de publicar. Soy socio de TravelSuite360 … tres agencias de viaje. Los otros tres productos … de punta a punta. Trabajo desde Uruguay con equipos en cualquier lugar.» | **«Diseño y desarrollo productos digitales donde la estrategia, la experiencia de usuario y la ingeniería trabajan con un mismo propósito: crear valor real para cada negocio.»** |
| Perfil · desarrollo (`profile.body`, 2 párrafos) | — | **«Mi trabajo va más allá de construir una interfaz. Me involucro en cómo se presenta una marca, cómo interactúan sus clientes, cómo funcionan sus procesos y cómo convertir una idea en un producto digital sólido, escalable y preparado para crecer.»** · **«Desde Uruguay, trabajo en proyectos de comercio electrónico, plataformas y sistemas de gestión, combinando criterio de producto, diseño y desarrollo con una visión comercial.»** |
| Perfil · Meta Ads (`profile.ads`; antes `profile.extension`: «Construir es una parte. Que llegue a la gente es otra…») | una línea chica al final | titular **«Un gran producto también necesita llegar a las personas correctas.»** y tres párrafos (aprobados, en `src/data/profile.ts`), con «Meta Ads» en énfasis |
| Work · título del reel (`reel.heading`) | «Cuatro productos.» | **«Trabajo seleccionado.»** |
| Work · etiqueta del reel y del overlay | «Trabajo · 01–04» (fija) | «Trabajo · 01–NN», NN = cantidad real de proyectos (`rangeLabel`) |
| Work · pista de reposo del reel | «arrastrá · ← → · 1–4» (fija) | «arrastrá · ← → · 1–N», N = cantidad real (`SITE.reel.restHint(n)`) |
| Capacidades · kicker | «Cinco cosas que se repiten en los **cuatro** productos. …» | «… en **todos los** productos. …» (la lista cerrada del pedido: «Los cuatro proyectos») |
| Contacto · apoyo (`cta.support`) | «Cuatro productos, de la idea a producción. El quinto todavía está en blanco.» | **«Ya viste lo que puedo construir. Ahora contame qué tenés en mente. Podemos empezar con una idea, un negocio que quiere crecer o un producto que necesita dar el siguiente paso.»** |
| Meta description / `og:description` | repetían la línea vieja del hero y «Cuatro productos … El quinto…» | siguen a la línea nueva del hero (§5 de abajo) |

Se conservan sin cambios: «Ahora, el tuyo.», los campos, las validaciones, Resend y la lógica del formulario, los cuatro mundos, el orden de los proyectos, MOSTRAR → CONVENCER → CONVERTIR, la prueba de cada proyecto («Producto real, en uso en tres agencias.» sigue en TravelSuite360) y las atribuciones de Santi Nuca, Chef Arturo y Rayo Smash.

## 2. Decisiones visuales

- **Hero.** La línea pasó de 22 px / 500 a ≈ 28 px / 600 en 1440 (`clamp(22px, 1.95vw, 32px)`; 25 px en tablet, `clamp(21px, 6.4vw, 26px)` en teléfono), con `text-wrap: balance` y un ancho máximo que en horizontal nunca llega a NÚÑEZ (que arranca en 38vw). Queda en tres o cuatro líneas parejas en vez de dos largas con huérfana. El H2 sigue creciendo como antes, limitado por el espacio libre. La composición asimétrica y el nombre no cambian; la frase gana presencia sin competirle (0,3× del tamaño de FRANCO).
- **Header.** La firma más larga entra en 768 px con 28 px de aire hasta el menú; por debajo de 768 sigue oculta.
- **Perfil.** Jerarquía por tamaño, peso y espacio, sin tarjetas: (1) la declaración en `clamp(25px, 3vw, 42px)` / 500 y sola; (2) el desarrollo, más tranquilo, bajo un filete, en `clamp(17px, 1.35vw, 20px)` y `paper-2`; (3) Meta Ads en un espacio propio, a `10svh` y bajo un filete más fuerte, con titular a `clamp(24px, 2.6vw, 38px)` / 900 y tres párrafos en cuerpo. «Meta Ads» va en `<strong>` 700 y papel pleno contra el `paper-2` del párrafo: discreto y reconocible, sin iconos, logos, tarjetas ni métricas. Lectura cómoda: 54 caracteres de medida en el cuerpo.
- **Meta Ads vs. la sexta capacidad.** El bloque del Perfil no repite el enunciado de la capacidad 06 (el test comprueba que «orientada a ventas» no aparece en Perfil): profundiza el lado humano del recorrido.
- **Revelado.** Dos grupos, cada uno una vez: la declaración y su desarrollo al entrar el Perfil (75 %); Meta Ads al llegar su bloque (82 %), porque queda bien debajo del pliegue y revelarlo al mismo tiempo lo gastaría fuera de vista. Bajo reduced motion y sin JS no hay revelado, el texto está.
- **Reel.** «Trabajo seleccionado.» mide 11,31 em: en 1440 se capó a 84 px para que quede en una línea en el ancho de 966 px del encabezado; en móvil el tamaño se limita para que «seleccionado.» (7,13 em) no desborde ni a 320 px; a 768 px baja a dos líneas balanceadas. Se mantiene el tratamiento actual (ver §7, «fondo claro»).
- **Contacto.** El apoyo pasó de una línea a tres o cuatro: ancho máximo 52 ch, interlineado 1,4 y `text-wrap: pretty`.

## 3. Arreglo de una latencia previa (encontrada por el QA)

A 320×568 el revelado del Perfil se disparaba ~1 500 px antes de que el visitante llegara (también en producción hoy). Causa: en viewports diminutos los mundos devuelven una escena sin timeline (layout estático, `data-anim` fuera) y `useScene` salía sin encolar un `ScrollTrigger.refresh`; las posiciones medidas antes quedaban viejas (~470 px). `useScene` ahora encola el refresh también cuando la escena no tiene timeline (un solo refresh coalescido por cuadro). Verificado en dev: posiciones de los triggers idénticas antes y después de un `refresh` manual.

## 4. Verificación

Todo se ejecutó sobre una copia aislada de `53b903a` con **sólo estos cambios** (el árbol de trabajo tenía además cambios sin commitear de otra tarea, §8):

- `npx tsc --noEmit`, `npm run lint`, `npm run build`: limpios, `check-assets: ok`.
- **Vitest: 204/204** (186 → 204 con los nuevos tests de copy, jerarquía de Perfil y contadores abiertos).
- **Playwright Chromium, 6 proyectos: 502 pasados.** El único rojo del paso completo fue «a failed bundle» en sm-390 (un flake conocido de ese test, que reintentado pasa en los seis proyectos); no se tocó esa prueba.
- **WebKit 1440/390 y Firefox 1440** sobre `capabilities`, `foundation`, `opening`, `declaration` y `reel`: 141 pasados, 0 fallidos.
- **QA visual** en 1440, 1366, 820, 390, 320 y reduced motion: sin overflow horizontal y sin errores de consola. Capturas comparativas antes/después en `qa/copy/compare/` (el «antes» es el sitio publicado). Texto largo y saltos de línea revisados en las seis vistas.
- **Teclado:** el orden de foco (saltar al contenido → marca → Trabajo → «Ver caso» → «Siguiente →» ×4 → Capacidades → formulario) es el mismo en 1440, 820, 390 y RM; el Perfil no agrega focos; todos los foco son visibles y dentro del viewport.
- **axe** (serio/crítico) en `#inicio`, `#trabajo`, `#perfil` y `#contacto`: 0 en las cuatro vistas.
- **Animaciones de entrada y salida:** los tests de opening, reel, declaración y revelado del Perfil siguen verdes; el revelado nuevo de Meta Ads tiene su propia prueba.
- **No hecho:** lector de pantalla (VoiceOver, NVDA) y dispositivos físicos: no hay acceso en este entorno.

## 5. Meta tags

El título de página y el `jobTitle` del JSON-LD siguen en «Producto × Diseño × Ingeniería» (la identidad SEO del Content Master §17). La meta description (`Transforma ideas y negocios … Socio de TravelSuite360, a cargo del software. Uruguay.`, 150 caracteres) y `og:description` toman la línea nueva del hero en lugar de la vieja.

## 6. Voz y excepciones registradas (Content Master §21)

- «Transforma ideas…» es una **excepción explícita** a §02 («nunca "transformar ideas"»), aprobada por Franco con la opción A del hero.
- El Perfil sigue siendo el bloque en primera persona; el nuevo Meta Ads vive dentro de él («Me gusta pensar…»), así que no abre otra voz en primera persona fuera de la declaración (ya aprobada, docs/22).
- El Perfil supera la banda de 40–70 palabras de §13 a pedido: la declaración (27 palabras) es la que cumple el papel del «núcleo»; el resto es desarrollo y un bloque propio.
- Sin adjetivos de prestigio («exitoso», «líder», «el mejor»): un test los prohíbe en Perfil.
- Meta Ads: «Campañas en Instagram y Facebook que ayudan a dar a conocer una marca…» queda sin cifras, inversión, resultados, clientes ni certificaciones (test).

## 7. Inconsistencias y pendientes para Franco

1. **«Cofundador de TravelSuite360» NO se agregó.** El pedido lo deja como opcional; el rol congelado del Content Master (ronda 1, repetido en `CLAUDE.md`) es «Socio · Producto e ingeniería» y «nunca fundador»; el test de la regla 2 lo prohíbe. Si «cofundador» reemplaza ese hecho, hay que decirlo: es una línea en el Perfil más la actualización de la regla y del test. El Perfil no nombra a TravelSuite360 hoy; el mundo, el reel y las capacidades sí.
2. **«fondo claro y texto oscuro» del reel.** El pedido dice «mantené el tratamiento de fondo claro y texto oscuro que ya tiene esta sección», pero el reel (y el título «Cuatro productos.») ya era papel sobre negro: nunca tuvo fondo claro. Lo único claro de esa zona son los mundos de Santi y Chef. No se cambió el tratamiento (sería un rediseño); si se quería un reel claro, es un pedido nuevo.
3. **Dos aperturas casi idénticas seguidas.** La conclusión de la declaración («Diseño y desarrollo productos digitales pensados para mostrar lo mejor…») y la nueva declaración del Perfil («Diseño y desarrollo productos digitales donde la estrategia…») empiezan igual y quedan una tras otra. Ambos textos son los aprobados; se deja la decisión (por ejemplo, variar uno de los dos).
4. **Meta Ads dos veces.** El Perfil tiene ahora su bloque de Meta Ads, y la capacidad 06 del riel también habla de Meta Ads (y otra tarea en curso la está reescribiendo, §8). Conviene que las dos lean complementarias, no iguales.
5. **Firma larga y título de página.** La firma con «× Crecimiento» está en el hero y en el header; el `<title>` y el JSON-LD conservan las tres disciplinas. Si se prefiere uno solo, es una línea.
6. **Pendiente de Content Master origen:** pasar §20 y §21 al Claude Doc.
7. «Producto real, en uso en tres agencias.» sigue en la prueba de TravelSuite360 (crédito legítimo, intacto).

## 8. Convivencia con otra tarea en el mismo repositorio

Durante esta pasada apareció trabajo sin commitear que no es de esta tarea: reescritura de capacidades (`src/data/capabilities.ts`, `src/lib/capabilities-rail.ts`, `CapabilitiesRail.tsx`, `EvidenceSlot.tsx`), cambios de CSS (cards de capacidades, el espaciado `--sy` de las pruebas, el bloque «reach») y scripts sueltos (`_gaps.mjs`, `_sheet.mjs`, `_shot.mjs`, `rows-before-1440.json`, `docs/assets/`). **Nada de eso se commiteó ni se modificó.** Esta pasada se verificó en una copia aislada de `HEAD` y se commiteó con sólo sus propios cambios. Una advertencia honesta: a mitad de la tarea ejecuté un `git stash` / `git stash pop` en el árbol compartido para comparar contra el código anterior; restauró todo sin conflictos, pero durante esos minutos los archivos ajenos estuvieron en su versión commiteada.

## 9. Archivos

- Datos: `src/data/site.ts`, `src/data/profile.ts`. Helper: `src/lib/content.ts` (`rangeLabel`). Ensamble: `src/components/journey/Journey.tsx`, `src/components/contact/FinalCta.tsx` (comentario).
- Presentación: `src/components/profile/Profile.tsx`, `ProfileReveal.tsx`, `src/app/globals.css` (hero, reel, perfil, CTA), `src/lib/useScene.ts` (§3).
- Pruebas: `tests/content.test.ts`, `tests/capabilities.test.ts`, `tests/e2e/capabilities.spec.ts`, `tests/e2e/foundation.spec.ts`.
- Docs: este documento, `docs/05b-content-master.md` (§21), `CLAUDE.md`, `README.md`.
