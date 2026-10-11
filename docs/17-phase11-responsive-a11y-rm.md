# 17 · Phase 11 — Responsive / Accessibility / Reduced Motion consolidation

Fecha: 2026-10-11 · Base: `main` @ `4381fd1` · Spec: *REVELADO — Master Implementation Spec* rev 37 (MIS), §26 fila "11 · Responsive / a11y / RM consolidation" (capítulos §15, §16, §19, §24, §27, §28). Alcance: revisión de la experiencia completa (Opening → End) sobre la matriz de viewports, teclado, lector de pantalla por semántica, contraste, sin JS, medios bloqueados, reduced motion; y los dos tests intermitentes documentados. **Sólo correcciones**: nada de rediseño.

## 1. Método

Dos auditorías automatizadas sobre el build de preview (`PREVIEW_MOMENTS=1`, con los dos momentos y sus placeholders), más la revisión visual de sus hojas:

- **`audit11`** (`qa/phase11/audit.json` + `sheet-*.png`): para cada viewport de MIS §27 (xl 2560×1440 · 1920×1080 · 1440×900; lg 1366×768 · 1280×800 · 1024×768 · 1024×1366; md 820×1180 · 768×1024 · 844×390; sm 430×932 · 390×844 · 375×667 · 360×800 · 320×568) y reduced motion en 1440×900, 820×1180 y 390×844: recorrido del documento entero de 100 en 100 px midiendo **overflow horizontal** (`scrollWidth − innerWidth`), **texto recortado** (elementos de texto cuyo contenido excede su caja sin un clip intencional), **consola** (errores/avisos/`pageerror`), **CLS** acumulado, el orden de **estados** de cada mundo y del hero, **axe** en seis puntos (hero, reel, TS, capacidades, perfil, contacto) y una captura en cada sección y a ¼, ½, ¾ de cada pin.
- **`a11y11`** (`qa/phase11/a11y.json`): Tab por toda la página a 1440×900 y 390×844 registrando orden de foco, anillo visible, elemento dentro del viewport, nada enfocable dentro de `aria-hidden`, tamaño del objetivo; PageDown mueve el documento; **medios bloqueados** (`/media/*`, `*.mp4`, `/_next/image`): las imágenes rotas conservan su caja, CLS, sin errores no esperados; **sin JS**: todas las secciones legibles en orden, sin overflow.

## 2. Resultados de la matriz

| Viewport (tier) | Largo del documento | Overflow | Texto recortado | Consola | CLS | axe (serio/crítico) |
|---|---|---|---|---|---|---|
| 2560×1440 (xl) | 42 vh | 0 | 0 | 0 | 0,002 | sólo la excepción documentada (§3.3) |
| 1920×1080 (xl) | 43 vh | 0 | 0 | 0 | 0,002 | ídem |
| 1440×900 (xl) · RM | 44 · 28 vh | 0 · 0 | 0 · 0 | 0 · 0 | 0,003 · 0,012 | ídem |
| 1366×768 · 1280×800 · 1024×768 · 1024×1366 (lg) | 43–45 vh | 0 | 0 | 0 | ≤ 0,005 | ídem |
| 820×1180 · RM · 768×1024 (md) | 38 · 27 · 39 vh | 0 | 0 | 0 | ≤ 0,006 | ídem |
| 844×390 (teléfono apaisado → viewport diminuto: sin pins, §24) | 30 vh | 0 | 0 | 0 | 0,011 | **0** |
| 430×932 · 390×844 · RM · 375×667 · 360×800 (sm) | 38–41 vh (RM 29) | 0 | 0 | 0 | ≤ 0,01 | ídem |
| 320×568 (sm, mínimo → diminuto) | 26 vh | 0 | 0 | 0 | 0 | **0** |

**Estados:** en los 18 recorridos cada mundo pasó por todos sus estados en orden (hero O2 → O3 → H1 → H2; TS SCREEN → … → TS10; Rayo → R07; Santi → N05; Chef → C07; capacidades SEAM → RAIL en lg/xl); bajo RM las secuencias de §16 completas, sin estados en blanco. CLS ≤ 0,012 en todos (presupuesto 0,02; MIS §18).

**Revisión visual de las hojas** (`qa/phase11/sheet-*.png`): composición y jerarquía correctas en los cuatro tiers; en lg a 1024×1366 (iPad Pro vertical, borde del tier) el espacio 1440×900 escalado deja aire arriba y abajo — es la regla de §15 («same choreography, scaled design spaces»), no un defecto; en 844×390 y 320×568 el sitio es la composición estática de §24 (sin pins), legible; NÚÑEZ recortado por el borde es el recorte intencional de §28 A13. Hallazgos corregidos en §3.

**Orden de foco (1440 y 390, idéntico):** Saltar al contenido → marca → Trabajo (01–04) → Perfil → Ahora, el tuyo → Ver caso → botones 01–04 del reel → «Siguiente →» de las cuatro pruebas → los tres links de atribución (01, 03, 05) → Nombre → Email → brief → Enviar. Es el orden de MIS §19 (sin «Abrir ↗» ni play/pausa mientras las URLs y los videos estén pendientes). Anillo visible en todos; ninguno fuera del viewport; ninguno dentro de `aria-hidden`; PageDown desplaza el documento (nada captura teclas).

**Medios bloqueados:** 40 imágenes, 35 bloqueadas (las 5 restantes son datos inline), **las 35 conservan su caja** (aspect-ratio reservado) con su texto alternativo en mono debajo (15 `.media-alt`), 0 videos montados, **CLS 0,003 / 0,002**, 0 errores no esperados de la app (sólo los `net::ERR_FAILED` del bloqueo). `qa/phase11/media-blocked-*.png`.

**Sin JS:** 15 secciones legibles en orden (incluidas las cuatro pruebas y los dos momentos mudos con 0 palabras), overflow 0 en 1440 y 390.

## 3. Correcciones

1. **Header a ≤ 359 px (320×568 de la matriz):** la marca y los tres links se superponían (`white-space: nowrap` sin espacio). Media query ≤ 359.98: fuente 13 px, gaps 12 px, la marca puede recortarse con elipsis antes de pisar nada. (CSS.)
2. **Objetivos < 24 px:** la marca del header (91×21) y los tres links de atribución del riel (23 px de alto) no cumplían el ≥ 44 px de §15 (ni el 24×24 de WCAG 2.2). `inline-flex` + `min-height: 44px` (en el riel con margen negativo para no mover el texto). a11y11: 4 → 0 issues.
3. **Chef C07, contraste:** la UI de compra atenuada a .4 bajo la línea de cierre (Spec §11) da 2,5:1 sobre crema. Es una representación (`role="img"`) ya leída en C05/C06 y decorativa al final: ahora pasa a `aria-hidden` en C07 (y vuelve al revertir). axe sigue midiendo el contraste del texto visible aunque esté fuera del árbol de accesibilidad: queda como **excepción documentada** (la única), excluida en `chef.spec` (desde Phase 8) y en la auditoría. No se cambió el .4 del Spec.
4. **TS bajo reduced motion:** en TS02/TS03 la frase quedaba con huecos («Necesito viajar a ____ en ___, somos ____.») porque las palabras se vuelven transparentes para que sus copias vuelen; sin movimiento no hay copias que vuelen → bajo RM las palabras quedan en la frase, subrayadas, con los tres campos listados al lado (§16, literal). Hallado en las hojas RM de 1440 y 390.
5. **Opening, «00» junto a «01»** (la causa del flake O3, §4): el fundido de entrada del índice 00 en O2 (400 ms) y el paso 00 → 01 del timeline de scroll movían la misma propiedad; si el visitante (o el test) scrollea dentro de esos 400 ms, el fundido terminaba después y dejaba «00» visible junto a «01». El timeline es dueño del índice desde su primer píxel: el fundido se completa y se descarta en `onUpdate`. Es un defecto real de experiencia bajo carga, no sólo del test.
6. **`to()` de los specs:** salto sólo con el documento en reposo (`tests/e2e/scroll.ts`, §4).
7. **Pósters sin preload desalineado (WebKit, Retina):** en las rutas `/trabajo/*` WebKit a DPR 2 avisaba «preloaded using link preload but not used»: React 19 (servidor) emite un `<link rel=preload imagesrcset>` para todo `<img>` no-lazy que no esté dentro de `<picture>`, y el candidato que elegía el preload no era el del elemento → doble descarga del póster en Safari Retina. `Still` ya no usa `<Image>`: `getImageProps` + `<img>` siempre dentro de `<picture>` (React no lo preloadea), `loading="eager"` + `fetchpriority="high"` para el póster del mundo de arranque (HTML de servidor: se descubre al instante). Verificado en el HTML: 0 preloads de imagen, el póster eager/high. e2e en `foundation.spec` (ningún preload de imagen que no sea el AVIF del hero).
8. **Centrado por foco en el riel (WebKit):** `window.scrollTo({behavior: "smooth"})` emitido hasta ~1 s después de un salto programático no producía ningún scroll en WebKit (reproducido: 500 ms → nada; 1 200 ms → centra). El centrado se hace ahora cuadro a cuadro con GSAP (`settle`, 0,5 s; instantáneo bajo RM): determinista en los tres motores. Chromium no cambia de comportamiento.
9. **Rayo R05 en motores sin H.264:** Playwright-WebKit en Windows no reproduce MP4 H.264; el sitio salta R05 limpiamente (§09) y el test de tiers ahora exige el `<video>` sólo si `canPlayType` lo admite. Safari real reproduce H.264.
10. **Fragmentos de TS en axe (WebKit):** los 64 fragmentos decorativos (`aria-hidden`, MIS §19 «TS fragments excluded») se excluyen de la pasada de axe en TS10 (WebKit los renderiza más claros y disparaba contraste).
11. **Avisos del navegador en la consola:** `tests/e2e/console.ts` centraliza el vigilante; filtra sólo el aviso informativo de Firefox «scroll-linked positioning effect» (los scrubs son scroll-linked por diseño, §05). Ningún error ni aviso del sitio se filtra.

## 4. Flakes: reproducción y corrección

Reproducción **antes** (misma máquina, mismo build; `E2E_SETTLE=0` desactiva la espera nueva):

| Test | Comando | Antes | Después |
|---|---|---|---|
| `travelsuite.spec › every state in order` (TS09a/TS09b) | `--repeat-each 12 --workers 1` | **2 / 12 fallan** (`Expected "TS09b" · Received "TS09a"`); también 1/6 (Phase 8) y ≥ 3/12 sobre el árbol de Phase 7 | **12 / 12** |
| `opening.spec › O3 opens the band…` | `--repeat-each 10 --workers 6` | **4 / 10 fallan** (`index-0` visible en O3); con sólo la espera de scroll, 2/10 | **10 / 10 y 20 / 20** |

**TS09b — mecanismo.** `to()` saltaba con `scrollTo` instantáneo mientras el tween del snap anterior (useScene: delay 80 ms, hasta 600 ms) todavía corría; una rueda real mata ese tween, un `scrollTo` programático no: el tween terminaba en su propio objetivo (TS09a) y pisaba el salto. **Corrección:** `tests/e2e/scroll.ts › settled()` espera a que el documento no se mueva durante 160 ms (una condición, no un timeout arbitrario: devuelve en cuanto nada se mueve; 160 > los 80 ms de delay del snap) antes de cada salto; `jump()` la usa en los `to()` de TS, Rayo, Santi, Chef, world y en `scrollToLabel` del opening. Sin tocar las animaciones.

**O3 — mecanismo.** No era sincronización del test sino un defecto del sitio bajo carga (§3.5): el test llega a O2 y scrollea de inmediato; con 6 workers el fundido de 400 ms de «00» terminaba después del paso 00 → 01 y ganaba el último frame. Con la espera de scroll sola seguía fallando (2/10): la evidencia de que la causa estaba en el código. **Corrección** en `OpeningHero`: el fundido se completa y se descarta cuando el timeline de scroll arranca. Ningún timeout ampliado, ningún test desactivado, cobertura intacta.

**Flake de carga residual (observado, no reproducido en aislamiento):** `rayo.spec › tiers` sm-390 falló una vez en Phase 9 dentro de la suite completa en paralelo con la QA visual; 8/8 solo. Queda anotado.

## 5. Navegadores (MIS §27)

WebKit y Firefox se instalaron con `npx playwright install webkit firefox` y entran como proyectos opcionales (`CROSS_BROWSER=1`: `webkit-1440`, `webkit-390` móvil, `firefox-1440`; `playwright.config.ts`). Resultados de la suite completa sobre ellos (3 workers; con 6 el equipo satura y aparecen fallos de carga):

| Corrida | Resultado | Qué quedó |
|---|---|---|
| 1ª (antes de las correcciones) | 25 fallos / 214 | avisos del navegador en consola (Firefox scroll-linked; WebKit «preloaded but not used»), riel/foco en WebKit, R05 en WebKit, fragmentos TS en axe (WebKit), y fallos de carga |
| 2ª (filtro de avisos + póster sin preload) | 4 fallos / 235 | foco del riel (WebKit, determinista), R05 (WebKit), axe TS10 (WebKit), URL/título en webkit-390 (carga) |
| **3ª (final)** | **1 fallo / 238** | `foundation.spec › scrolling replaces the URL` en **webkit-390**: la URL cambia pero el `<title>` queda el de la home; **pasa 4/4 en aislamiento**. Hipótesis: Next vuelve a aplicar el título de la ruta tras nuestro `replaceState` y bajo carga llega después del nuestro (carrera sólo observada en WebKit móvil en paralelo). Queda anotado para verificar en Safari iOS real (Phase 13); no se parchó a ciegas. |

Comportamientos propios de los motores verificados: Firefox corre pins, scrubs y snaps sin diferencias; WebKit renderiza los cuatro mundos (diff reel ↔ SCREEN ≤ 1 % también en WebKit), el formulario y el End; R05 se salta limpiamente cuando el motor no decodifica el clip (Playwright-WebKit en Windows). Safari real no se probó (sin macOS/iOS en el entorno).

## 6. Pruebas

| Suite | Resultado final |
|---|---|
| `npx tsc --noEmit` · `npm run lint` · `npm run build` | limpios (build de preview para la QA; el build normal omite los momentos) |
| `npx vitest run` | **174 / 174** |
| `npx playwright test` (Chromium, 6 proyectos) | **478 passed · 0 failed · 224 skipped** — tres corridas completas consecutivas en verde (la primera vez en el proyecto; antes siempre había 1–2 flakes) |
| `CROSS_BROWSER=1 … --workers 3` (WebKit ×2 + Firefox) | 238 passed · 1 failed (§5) · 112 skipped |
| Flakes | TS09b 12/12 (antes 10/12) · O3 30/30 con 6 workers (antes 6/10) |

Cambios en tests: `tests/e2e/scroll.ts` (`settled`/`jump`), `tests/e2e/console.ts` (vigilante compartido), los `to()` de los specs de mundos y el `scrollToLabel` del opening usan `jump`; `foundation.spec` exige 0 preloads de imagen; `rayo.spec` R05 asertado en Chromium y anotado en otros motores; `travelsuite.spec` excluye los fragmentos de axe; `capabilities.spec` entra al mundo tras centrar la tarjeta por foco y esperar el reposo. Ningún timeout ampliado, ningún test desactivado.

## 7. Pendiente / fuera del entorno

- Pasada manual con VoiceOver (macOS/iOS) y NVDA (Windows/Firefox): no disponible en este entorno; la semántica se verificó por axe, orden de foco y árbol (roles, labels, `aria-hidden`, una sola copia de cada texto).
- Dispositivos reales (iOS Safari, Android Chrome): no disponibles; WebKit y Firefox corrieron en Playwright (§5).
- Lighthouse / presupuestos de rendimiento: Phase 12.

## 8. Hacia Phase 12: assets y autorizaciones necesarios

| # | Qué | Para | Bloquea el lanzamiento |
|---|---|---|---|
| 1 | Retrato de Franco: cutout con alpha ≥ 2400 px de alto (3/4, B&N, luz dura) + recorte 4:5 móvil (`franco.hero.*`) | hero (LCP) | **sí** (`check:launch`) |
| 2 | Busto iluminado ≥ 1600 px (`franco.bust`) | costura de capacidades | no (placeholder honesto) |
| 3 | TravelSuite360: tenant demo con datos controlados, capturas y grabación de la prueba (`ts.reel.poster`, `ts.reel.loop`, `ts.proof`) + checklist §23 firmado por dos personas + aprobación de los socios de publicar el producto y «tres agencias» | reel, mundo, prueba | **sí** |
| 4 | Rayo: PNG originales de las capas y render final del clip R05 (16:9; 9:16 opcional) + grabación de la prueba (`rayo.proof`) | mundo, prueba | no (derivados reales en uso) |
| 5 | Santi Nuca: fotografías originales + permiso de Santi para usarlas en el mundo; grabación de la prueba (`santi.proof`) | mundo, prueba | permiso: **sí** |
| 6 | Chef Arturo: foto de producto en alta, loop macro 4–6 s (16:9 y 9:16), permiso del negocio; grabación catálogo → producto → carrito sin datos de clientes (`chef.proof`); confirmar Mercado Pago live (`paymentsLive`) | mundo, prueba, copy | permiso: **sí** |
| 7 | Franco at work: video 8–15 s, 16:9 1920×1080 y 9:16 1080×1920, `monitorFocus` real; momento humano: still 3:2 / 4:5 (o loop). Si no llegan: lanzar sin ambas secciones (flags, §29 Q11) | S7, S14 | no (decisión Q11) |
| 8 | Resend: `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` con dominio verificado; **un envío real de producción** (A15) | formulario | **sí** |
| 9 | `[CONFIRMAR]`: email y LinkedIn del perfil, URLs «Abrir ↗» de los cuatro productos, años, stacks, «con equipos en cualquier lugar», extra de la prueba de Rayo | perfil, pruebas, reel | no (se omiten mientras tanto) |
| 10 | Hosting/dominio (Vercel asumido), canónica/OG, decisión de analytics (ninguno recomendado) | SEO, privacidad | dominio: **sí** |
| 11 | Pasadas manuales: VoiceOver (macOS/iOS), NVDA; iPhone 12/15 Pro Max, Pixel 6, iPad; MacBook Air 2020 para fps | A4, A19, §27 | sí para declarar A4/A19 |

## 9. Evaluación de preparación para producción

**Funcional y responsive:** completo. Las 16 secciones del mapa de experiencia existen y funcionan en los cuatro tiers, con reduced motion, sin JavaScript y con medios bloqueados; la matriz §27 no muestra overflow, texto recortado, errores de consola ni CLS por encima del presupuesto; el orden de foco es el de §19; axe limpio salvo la excepción documentada. La suite de Chromium está **en verde completo** (478 e2e + 174 unidades), y los dos tests intermitentes quedaron corregidos con evidencia; WebKit y Firefox corren como proyectos opcionales (resultados en §5).

**No listo para publicar todavía** — por material y autorizaciones, no por código: el retrato del hero y el material de TravelSuite360 (con su firma de privacidad) bloquean por contrato (`npm run check:launch` falla a propósito); las variables de Resend y un envío real faltan; los permisos de Santi Nuca y Chef Arturo sobre su material y las URLs/perfil `[CONFIRMAR]` siguen pendientes. Phase 12 integra esos assets, mide los presupuestos de §18 (Lighthouse, JS inicial, LCP con el retrato real) y cierra la privacidad; Phase 13 es la QA final de §27/§28 en dispositivos reales.

## 10. Próximo paso

**Phase 12 · Performance + media** (MIS §17, §18, §22, §23) — con los assets definitivos. No se empieza sin aprobación.
