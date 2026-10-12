# 19 · Phase 13 — QA final + Release candidate

Fecha: 2026-10-11 · Base: `main` @ `0f0b6cd` · Spec: *REVELADO — Master Implementation Spec* rev 37 (MIS), §26 fila "13 · QA + release" (§27 matriz de QA, §28 criterios A1–A21); Content Master rev 26 (§00, §18 auditoría de claims).

**Clasificación: RELEASE CANDIDATE TÉCNICO — LANZAMIENTO BLOQUEADO POR DEPENDENCIAS EXTERNAS.** El código pasa toda la verificación automatizable en este entorno; los criterios que fallan o quedan abiertos dependen de material, autorizaciones, dispositivos o pasadas manuales que no existen acá. No se declara producción aprobada.

## 1. Qué se auditó

| Área | Cómo | Evidencia |
|---|---|---|
| Journey completo, matriz §27 | `audit11` sobre el build final: 15 viewports (2560×1440 → 320×568, incl. 1024×1366 y 844×390 apaisado) + RM en 3; documento entero de 100 en 100 px: overflow, texto recortado, consola, CLS, estados de cada mundo, axe en 6 puntos, capturas | `qa/phase13/matrix/` |
| Teclado, foco, medios bloqueados, sin JS | `a11y11` a 1440 y 390 | `qa/phase13/matrix/a11y.json` |
| Contenido renderizado | `content13`: texto visible, alts, aria-labels, links y metadatos de las 6 rutas (sin JS), contra las guardas del Content Master (00, 16, 18) | `qa/phase13/rendered-text-*.txt`, `content-audit.json` |
| Modos de falla §24 | `fail13`: red caída al enviar, la action respondiendo 500, el chunk de GSAP bloqueado, todos los `.mp4` bloqueados | `qa/phase13/failure-*.png`, `failure-modes.json` |
| Rendimiento | Lighthouse 13.5 ×3 por ruta/forma, transferencias CDP, fps del journey (Phase 12, repetido sobre el build final) | `qa/phase13/lighthouse/`, `qa/phase13/budget/` |
| Cross-browser | Chromium (6 proyectos), WebKit 1440 + 390 móvil, Firefox 1440 | §4 |
| Seguridad del formulario | código + bundles + headers | §6 |

## 2. Recorrido

Opening → Hero → Reel → TravelSuite360 → Rayo Smash → (momento humano, apagado) → Santi Nuca → Chef Arturo → Capacidades → Perfil → (Franco at work, apagado) → Contacto → End: recorrido por rueda, por teclado y por salto en cada viewport de la matriz; deep links a los cuatro mundos en frío, recarga a mitad de un mundo, Atrás/Adelante después de entrar desde el reel (e2e `world.spec`). Con el build de preview (`PREVIEW_MOMENTS=1`) también los dos momentos con sus placeholders (e2e `moments.spec`).

**Matriz §27 sobre el build final (18 recorridos):**

| Viewports | Overflow | Texto recortado | Consola | CLS | axe serio/crítico |
|---|---|---|---|---|---|
| xl 2560×1440 · 1920×1080 · 1440×900 · RM | 0 | 0 | 0 | ≤ 0,003 | 1 por recorrido (`.seam-line`, ver abajo); RM 0 |
| lg 1366×768 · 1280×800 · 1024×768 · 1024×1366 | 0 | 0 | 0 | ≤ 0,005 | 1 (`.seam-line`); 1366: + título de la prueba de Chef (ver abajo) |
| md 820×1180 · RM · 768×1024 · 844×390 | 0 | 0 | 0 | ≤ 0,004 | 0 |
| sm 430×932 · 390×844 · RM · 375×667 · 360×800 · 320×568 | 0 | 0 | 0 | ≤ 0,001 | 0 |

Los avisos de axe que quedan **no son defectos visibles**, verificados uno por uno: (a) `.seam-line` («Todo lo anterior pasó por las mismas manos.») se mide mientras el riel la desvanece (axe recorre la página entera desde otro punto y la encuentra a opacidad parcial); con la sección quieta en cuatro puntos del pin (opacidad 1 · 0,8 · 0,5 · 0) axe da **0**; en reposo es muted sobre negro, 5,8:1. (b) El título «CHEF ARTURO» de la prueba a 1366×768: axe le atribuye el fondo crema del mundo, pero en las cuatro posiciones a las que axe lo lleva (`scrollIntoView` start/center/end/nearest) la pila de elementos bajo el título es la prueba sobre el negro del documento (captura `qa/phase13/chefproof-intoview-center.png`). La excepción documentada de Phase 8/11 (UI de Chef atenuada en C07) se sigue excluyendo.

**Teclado, medios bloqueados, sin JS (1440 y 390):** 21 elementos enfocables en el orden de §19, 0 problemas (anillo visible, dentro del viewport, nada en `aria-hidden`, objetivos ≥ 44 px); PageDown desplaza; con `/media/*`, `*.mp4` y el optimizador bloqueados, las 35 imágenes conservan su caja, CLS 0,002, 0 errores; sin JS, 13 secciones legibles (los dos momentos no existen con las flags apagadas), overflow 0.

**Lighthouse final (mediana de 3):** `/` desktop 100 · LCP 0,73 s · TBT 0 ms · CLS 0 — móvil 88 · LCP 3,39 s · TBT 214 ms · CLS 0. `/trabajo/travelsuite360` desktop 100 · 0,72 s · 4 ms · 0 — móvil 85 · 3,41 s · 311 ms · 0. `/trabajo/chef-arturo` desktop 99 · 0,85 s · 6 ms · 0 — móvil 81 · 4,64 s · 158 ms · 0. Accesibilidad / Best Practices / SEO 100 en las seis combinaciones. **Transferencias:** JS inicial 226,4 KB, CSS 11,6 KB, fuentes 60,9 KB, medios eager ≈ 23 KB, 0 duplicados, clip de Rayo 1,22 MB sólo en desktop al entrar al pin; heap JS 7–9 MB; 0 long tasks durante el scroll. **Medios:** máx. 1 video reproduciéndose; Save-Data, 2G y RM: 0 pedidos de video.

## 3. Problemas encontrados y corregidos en esta fase

1. **El formulario rompía la página sin red.** Con la red caída (o la action respondiendo 500), enviar el brief lanzaba una excepción hasta la pantalla de error de Next y el visitante perdía todo (Spec §24 exige el error de ruta con los valores conservados). Ahora, con JS, la action se llama dentro de una transición: cualquier respuesta que no llegue es «No se envió. Probá de nuevo.» con los tres campos intactos; sin JS sigue siendo el POST de la misma action. e2e nuevo (offline y 500).
2. **Un chunk que no carga dejaba los mundos con todas sus capas apiladas.** Con el chunk de GSAP bloqueado («block GSAP chunk only», §27) nada construía las escenas y el CSS del modo animado mostraba los estados superpuestos (capturas en `qa/phase13/`). El script del `<head>` que pone `.js` ahora la quita si falla la carga de un script propio (`/_next/static/`) → el documento estático legible. Además, mientras una escena no se construyó (JS lento), sólo se ve su SCREEN. e2e nuevo.
3. **WebKit móvil: `<title>` tras `replaceState` bajo carga** (pedido explícito). Reproducido: **1 de 8, 0 de 8** páginas WebKit en paralelo llegaban al título correcto. Tres causas, cada una aislada con trazas (escrituras al título con stack, `replaceState`, posiciones):
   - el router de Next sincroniza su estado con nuestro `replaceState` y su commit de React **reescribe el nodo de texto del `<title>`** con el título de la ruta, después del nuestro → `keepTitle` (un `MutationObserver` en `<head>` que restituye el título de la sección);
   - si la hidratación llega después de que el visitante scrolleó (carga lenta), los pins que crecen por encima, y el `refresh` que agrega el spacing del pin, **lo desplazaban a otro mundo** (el anclaje nativo de WebKit elegía un nodo dentro de un stage pinneado) → `holdView`/`restoreView` en `useScene`: la sección del centro se mantiene en su lugar a través de cada build y refresh hasta que la cola termina o el visitante scrollea; `overflow-anchor: none` en `html` para que el anclaje nativo no sume al nuestro;
   - el trigger de la sección podía activarse al crearse, **antes de que existiera la suscripción** que sincroniza la URL → sincronización explícita al arrancar.
   Resultado: **48 / 48** en WebKit (6 tandas de 8 en paralelo), 16/16 Chromium, 12/12 Firefox; el test original pasa en la suite cruzada. Lo que **sólo** se puede verificar en Safari iOS real: el anclaje de scroll de iOS con la barra de URL dinámica y la inercia táctil durante una hidratación lenta.
4. **Firefox: entrar a un mundo desde un link del riel** fallaba bajo carga: el clic de Playwright re-scrolleaba el destino (y con él el riel) y caía en la tarjeta vecina. El test activa el link desde el teclado (Enter), como un visitante de teclado; además la animación de centrado por foco cede ante cualquier otro scroll (un clic hacia un mundo, la rueda) en vez de seguir arrastrando la página.
5. **Corrección al informe de Phase 11:** la matriz de entonces también registró `.seam-line` en lg/xl y el informe lo resumió como «sólo la excepción documentada». Era el mismo artefacto de medición descrito arriba (no un defecto visible), pero quedó mal reportado; queda corregido acá.
6. **Hardening:** sin `X-Powered-By`; las variables de Resend y la URL de pruebas no aparecen en ningún chunk del cliente (búsqueda sobre `.next/static`).

## 4. Pruebas finales

| Suite | Resultado final |
|---|---|
| `npx tsc --noEmit` | limpio |
| `npm run lint` | 0 errores (el único aviso — una directiva `eslint-disable` sobrante en `Still.tsx` — se quitó después de la corrida; `eslint` limpio) |
| `npm run build` (configuración de producción y preview) | limpios |
| `npx vitest run` | **176 / 176** (11 archivos) |
| `npx playwright test` — Chromium, 6 proyectos, build de producción | **458 passed · 0 failed · 262 skipped** (los tests de los momentos se saltan solos con las flags apagadas) |
| `npx playwright test` — Chromium, build de preview (`PREVIEW_MOMENTS=1`) | **487 passed · 0 failed · 233 skipped** (los 29 de los momentos corren) |
| `CROSS_BROWSER=1` — WebKit 1440 · WebKit 390 móvil · Firefox 1440 (3 workers) | **227 passed · 0 failed · 133 skipped** |
| `npm run check:launch` | **exit 1** (6 slots bloqueantes — intacto, a propósito) |

Los *skipped* son por diseño (tests que corren sólo en un proyecto de referencia, o sólo en lg/xl, sm o RM). Nuevos en esta fase: `contact.spec` (red caída y action 500), `foundation.spec` (chunk de GSAP bloqueado → documento estático), y la sincronización `scenesBuilt` en `capabilities`, `contact` y `moments`. Ningún test se desactivó ni se amplió un timeout para pasar.

## 5. Criterios A1–A21 (MIS §28), uno por uno

| # | Criterio | Estado | Evidencia / qué falta |
|---|---|---|---|
| A1 | Fidelidad visual vs boards 1440×900 y 390×844 | ⚠ **abierto** | capturas por estado de cada fase (`qa/phase2…13`); **faltan las baselines aprobadas por Franco** — sin ellas no hay diff ≤ 2 % en CI. Además los slots en placeholder (retrato, TS) no pueden compararse con los boards |
| A2 | Copy idéntico al Content Master; nada no confirmado | ✅ | `content.test` (reglas 1–7) + auditoría del texto renderizado de las 6 rutas: 0 violaciones; textos clave verificados (FRANCO / NÚÑEZ, firma, «Ahora, el tuyo.», «Brief recibido.», busto); `[CONFIRMAR]` nunca renderizado |
| A3 | Guardas de hechos | ✅ | TS «Socio · Producto e ingeniería», nunca fundador/solo; «Producto real, en uso en tres agencias.»; Rayo «no es un cliente: es la demo que Prospector construye»; «Fotografía · Santi Nuca» + alts «— fotografía de Santi Nuca»; Chef «Tienda real, en línea.» (sin pagos en producción); capacidad 06 sin métricas |
| A4 | ≥ 55 fps laptop de referencia, ≥ 50 iPhone 12 / Pixel 6; sin long tasks > 50 ms al scrollear | ⚠ **parcial** | journey completo ≥ 149 fps (CPU 6×) sobre una GPU de escritorio, 0 long tasks; **no medido en MacBook Air 2020 ni en móviles reales** (no disponibles) |
| A5 | Scroll vertical nativo | ✅ | sin `preventDefault` en wheel/touch verticales (búsqueda en `src/`); e2e de rueda/teclado; PageDown mueve el documento |
| A6 | Rueda sobre el reel scrollea la página | ✅ | `reel.spec`, `foundation.spec` |
| A7 | Reel accesible por teclado | ✅ | `reel.spec` (flechas, 1–4, Home/End, Enter, botones), foco visible |
| A8 | Sin overflow horizontal en la matriz, cada 100 px | ✅ | `audit11` sobre el build final: 0 en los 18 recorridos |
| A9 | Sin errores de hidratación | ✅ | consola vigilada en todos los e2e y en la matriz |
| A10 | Sin errores ni avisos de la app en consola | ✅ | idem; sólo se filtra el aviso informativo de Firefox sobre efectos scroll-linked |
| A11 | CLS ≤ 0,02 en todas las rutas | ✅ | Lighthouse 0 en las 10 combinaciones (era 1,0 en los deep links); matriz ≤ 0,012; medios bloqueados 0,002–0,003 |
| A12 | Medios de TS con `privacyChecked` y firma de dos personas | ❌ **bloqueado** | no existe material de TS aprobado; las capturas candidatas ahora no se sirven (404). Requiere tenant demo + checklist §23 + firma de Franco y un socio |
| A13 | Tipografía sin recortes ni desbordes | ✅ | `audit11`: 0 textos recortados en la matriz (salvo el recorte intencional de NÚÑEZ) |
| A14 | Reduced motion completo, sin estados en blanco, nada > 200 ms | ✅ automatizado · ⚠ manual | proyecto `rm-1440` en todos los e2e + RM en 1440/820/390 en la matriz; **pasada manual macOS/iOS no hecha** |
| A15 | Formulario: Resend en producción, seis estados, sin JS, éxito sólo con 2xx | ✅ técnico · ❌ envío real | e2e contra el stand-in (seis estados, honeypot, timing, rate limit, sin JS, offline/500); **falta configurar Resend y un envío real de producción** |
| A16 | Deep links, recarga, Atrás/Adelante | ✅ | `world.spec` y specs de cada mundo; deep links sin flash del opening, ahora con CLS 0 |
| A17 | Presupuestos §18 (LCP, JS inicial, medios eager, TBT) | ❌ **parcial** | ✅ LCP desktop, CLS, TBT desktop, CSS, fuentes, medios eager, pósters, clip · ❌ JS inicial 226 KB > 170 (piso del framework + GSAP ≈ 189 KB) · ❌ LCP móvil 3,0–3,4 s > 2,5 (el opening revela su primer contenido a los 1,2 s por diseño; con el retrato real hay que volver a medir) · ⚠ TBT móvil 214 ms en `/` (✅), 311 ms en `/trabajo/travelsuite360` (❌ > 250), 158 ms en Chef |
| A18 | Un solo video activo | ✅ | máx. 1 reproduciéndose en todo el journey; 0 bajo RM, Save-Data y 2G |
| A19 | axe 0 serio/crítico; VoiceOver y NVDA | ✅ axe · ⚠ lectores | axe en cada spec y en la matriz (única excepción documentada: la UI de Chef atenuada a .4 en C07, `aria-hidden`); **pasadas manuales con VoiceOver/NVDA no hechas** (no hay macOS/iOS ni NVDA en el entorno) |
| A20 | Modos de falla del §24 | ✅ | JS desactivado/bloqueado (documento estático; ahora también si falla un chunk), JS lento (SCREEN sin capas apiladas), escena que falla (cae a estática), video que falla (R05 se salta), imagen que falla (caja reservada + alt), Save-Data/2G, viewport diminuto, formulario sin env/500/offline/rate limit (error honesto), slug desconocido (404), placeholder bloqueante en producción (build falla) |
| A21 | Ningún placeholder como evidencia | ✅ | `EvidenceSlot` nunca renderiza placeholder; `check:launch` y `VERCEL_ENV=production` fallan con 6 slots bloqueantes |

Resumen: **15 ✅ · 4 parciales (A4, A14, A19 por pasadas manuales; A17 por presupuesto) · 1 abierto (A1 sin baselines) · 1 bloqueado (A12)**, y A15 técnico ✅ pero sin envío real.

## 6. Formulario y seguridad

| Punto | Estado |
|---|---|
| Validación cliente/servidor | idéntica (`validateBrief`); el servidor es la autoridad; topes de longitud aplicados al leer |
| Honeypot / timing / rate limit | `company` fuera de pantalla y fuera del tab order; < 3 s → éxito silencioso sin envío; 5 / 10 min por IP en memoria (best effort por instancia, §14). La IP sale de `x-forwarded-for`, que en Vercel lo fija la plataforma |
| Variables sensibles | sólo en el servidor (`actions/brief.ts`); 0 apariciones en `.next/static`; `.env*` ignorados por git salvo `.env.example` |
| Errores | sin variables → error de ruta; Resend no-2xx → error de ruta; red/500 → error de ruta (nuevo); nunca «Brief recibido.» sin 2xx |
| Payload | texto plano, `reply_to` = visitante, asunto `Brief · {nombre}`; nada se guarda ni se loguea |
| Accesibilidad | labels visibles, `aria-invalid` + `aria-describedby`, foco al primer error (también del servidor), `role="alert"` único, `role="status"` enfocado en el End; inputs ≥ 16 px, objetivos ≥ 44 px |
| Sin JS | POST de la misma action; errores con valores; éxito → End estático |
| Headers | `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors 'self'`; sin `X-Powered-By` |
| Tests | Resend simulado en todos los e2e; **ningún correo real enviado** |

## 7. Contenido (Content Master) — resultado

Texto visible de las seis rutas (`qa/phase13/rendered-text-*.txt`) contra las guardas: **0 violaciones**. Verificado a mano sobre el texto renderizado: rol y prueba de TravelSuite360, Rayo como demo de Prospector, crédito y alts de Santi Nuca (27 menciones, 13 alts con el crédito), micro case y prueba de Chef (Mercado Pago aparece como función de la tienda, nunca como pagos en producción), capacidad 06 «Publicidad en Meta Ads, orientada a ventas.» sin cifras, perfil literal. **Sin links externos** (las URLs «Abrir ↗», años, stacks salvo el de Rayo, email y LinkedIn siguen `[CONFIRMAR]` y no se renderizan). Meta: títulos y descripciones de §17 en las cinco rutas; `canonical` ausente hasta confirmar el dominio; JSON-LD `Person` sin `url`/`sameAs`.

## 8. Pendiente técnico (no bloquea el RC, sí la aprobación final)

- Presupuesto de JS inicial (decisión: ajustar el §18 a lo medido o dividir los constructores de los mundos, ≈ −15–20 KB, insuficiente igual).
- LCP móvil: volver a medir con el retrato real (el LCP pasará a ser la imagen).
- TBT de los deep links móviles; LCP de los deep links a Rayo/Santi/Chef (4,2–4,9 s): el póster se pinta cuando la página aterriza.
- Capas de compositor en un móvil real (panel Layers).
- Pasadas manuales: VoiceOver (macOS/iOS), NVDA, Safari iOS (anclaje de scroll con barra dinámica durante una hidratación lenta), Android Chrome.
- Favicon: el actual es el de `create-next-app`.

## 9. Próximo paso

Ninguna fase más en el Spec. Ver `docs/20-revelado-2.2-closure.md`: checklist de despliegue, dependencias y autorizaciones. **No se hizo push ni despliegue.**
