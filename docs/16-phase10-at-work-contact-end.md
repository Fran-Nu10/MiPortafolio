# 16 · Phase 10 — Franco at Work + Contact + End

Fecha: 2026-10-11 · Base: `main` @ `767589a` · Spec: *REVELADO — Master Implementation Spec* rev 37 (MIS), §26 fila "10 · Franco at Work + Contact + End" (capítulos §13, §14, §02 S7 y S16; además §16 RM, §17 media, §19 accesibilidad, §24 fallos). Copy: Content Master rev 26 §10 (silencio), §14, §15, §16, literal. Dirección: REVELADO 2.2 §12.

## 1. Resultado

**Franco at work (S14).** Sección muda y decorativa (sin copy, `aria-hidden` mientras no hay video), pinneada 200 vh (scrub 0,8, sin snap): el frame, maquetado a ≈ 95 % del viewport, arranca como **escala uniforme + `clip-path`** a su tamaño inicial (56 vw 16:9 en lg/xl, 72 vw en md, 9:16 a 72 vw / 70 svh en sm; nunca se anima width/height), crece hasta el 95 % en el primer 60 % del pin, sostiene hasta el 85 % y en el tramo final **cierra al monitor**: un plano negro con un agujero even-odd que se contrae hasta `monitorFocus` (del contrato), y la CTA sigue en flujo sobre negro. El video (contrato `franco.atWork`, `LoopVideo` sin loop: una vez por entrada, se queda en el último frame) corre cuando el frame cubre la mitad del viewport; preload `none` → `metadata` al entrar al perfil → `auto` al pinnearse. **No existe el video**: la sección corre el mismo timeline con el placeholder honesto del Spec (campo plano, regla interior de 1 px, bloque del monitor más claro, sin texto ni figura) y **sólo aparece en un build de preview** (`PREVIEW_MOMENTS=1` en build, nunca en producción de Vercel); por defecto queda apagada por flag.

**Momento humano (S7).** Entre la prueba de Rayo y el SCREEN de Santi: 120 svh con frame sticky de 100 svh, la imagen (`moments.human`, placeholder) en una ventana `clip-path` que **abre de una banda horizontal centrada (43 %) al cuadro entero en la primera mitad del paso y cierra a negro en el último 30 %** (la gramática de apertura del opening). Sin pin, sin estado, sin escrituras al store, `aria-hidden`, alt vacío. Misma flag.

**Contacto (S15).** «Ahora, el tuyo.» (el único rojo como texto), «Cuatro productos, de la idea a producción. El quinto todavía está en blanco.», footer mínimo arriba del formulario, tres campos y un botón. Server Action con `useActionState`: **funciona sin JavaScript** (POST plano, el servidor re-renderiza con los valores) y con él sin recarga. Los seis estados: idle · typing (lectura 0 % → 100 %, decorativa) · submitting («Enviando…», botón deshabilitado, campos de sólo lectura) · error de campos («Falta esto.» / «Revisá el email.», `aria-invalid` + `aria-describedby`, foco al primer campo inválido — también cuando el error viene del servidor) · error de ruta («No se envió. Probá de nuevo.» en `role="alert"`, valores conservados) · success (**sólo tras un 2xx de Resend**). Honeypot `company`, control temporal (< 3 s), rate limit 5 / 10 min por IP, topes de longitud, texto plano, `reply_to` = visitante.

**End (S16).** Disparado por el éxito del servidor, nunca por scroll: «Brief recibido.» (mono, papel sobre negro, con la señal roja) sostiene 1,2 s → el rojo se apaga en 800 ms → negro 400 ms → **FRANCO NÚÑEZ** aparece en 600 ms. El header se oculta (`endActive`), el foco va al `role="status"`. Reduced motion: los mismos estados como cortes con pausas de 1,2 s. Sin JS: el servidor devuelve el mismo bloque, estático.

| Criterio de aceptación (MIS §26) | Cómo se verificó | Estado |
|---|---|---|
| El formulario funciona sin JS | e2e sin JS (xl y sm): POST plano con email inválido → error con valores; corrección rápida → «Brief recibido.» + nombre, un solo envío al mock (el `t` original se devuelve: una corrección no es un bot) | ✅ |
| Los seis estados alcanzables | e2e: idle → typing (20 % / 40 %) → error de campos → error de ruta → submitting → success, con capturas; `data-state` del form | ✅ |
| Éxito sólo con 2xx de Resend (mock en e2e) | **Resend es un stand-in local** (`tests/e2e/mock-resend.mjs`, Playwright lo levanta): 200 salvo «[fail]» en el brief → 500; el e2e verifica el envío registrado (to, subject «Brief · Ana», reply_to, texto) y que con 500 no hay «Brief recibido.» | ✅ |
| Honeypot / timing / rate limit | e2e: honeypot lleno → parece éxito, nada enviado; enviado al instante → ídem; sexto envío desde la misma IP → error de ruta y exactamente 5 entregados (cada test usa una IP `x-forwarded-for` propia) | ✅ |
| Errores anunciados | e2e: `aria-invalid`/`aria-describedby` apuntan al mensaje, `role="alert"` único en el form, `role="status"` enfocado al éxito; axe limpio con errores visibles. Pasada manual con VoiceOver/NVDA: **pendiente** (no disponible en este entorno) | ✅ / ⚠ manual |

## 2. Secuencias

**Franco at work (timeline 0–1 sobre 200 vh):** `s:START` 0 — frame en pose inicial (`startPose`: escala = cover del tamaño inicial sobre el final; inset local simétrico) → crece hasta `s:FULL` 0,6 (escala 1, inset 0) → hold → 0,85–1 el plano del monitor (`monitorHole(focus, t)`: polígono even-odd del cuadro entero a `monitorFocus`) → `s:CLOSE` 1. Mismo timeline para el placeholder. A 1440×900: inicio 806×454 → 1368×855.

**Momento humano (paso de la sección como escena de flujo):** `s:BAND` 0 (inset 43 % arriba/abajo) → `s:OPEN` 0,5 (inset 0) → hold → cierre 0,7–1 (inset 50 %) → `s:CLOSED`.

**End:** `received` → (1,2 s) → `dark` (2,0 s) → `name` (3,0 s); RM: `received` → (1,2 s) `dark` → (1,2 s) `name`.

## 3. Arquitectura

- **`src/lib/at-work.ts`** (puro): `frameEnd`/`frameStart` por tier, `startPose`, `PHASE`, `playAt` (progreso en el que el frame cubre el 50 % del viewport), `monitorHole`, `apertureAt`, `atWorkUnits`.
- **`FrancoAtWork.tsx`** (cliente): `useScene` sticky, `units` 200 vh / gesto; RM o viewport diminuto: build `null` (frame al 95 % como still; con video real, `ProofMedia` con botón de play); `LoopVideo loop={false}` con `active` por `playAt` y pin activo; `preload` escalonado por sección del store. `aria-hidden` mientras no haya video (cuando lo haya y RM, el botón es enfocable y la sección deja de ocultarse).
- **`HumanMoment.tsx`** (cliente): `useScene` con `pin: false`; RM: `null`.
- **`EndSequence.tsx`** (cliente): timeline GSAP en `useLayoutEffect`, `data-end-step`, `END_T`; `scrollIntoView` + foco al status; `endActive` en el store.
- **`BriefForm.tsx`**: foco al primer campo inválido también para errores del servidor; `data-state` (idle/typing/submitting/error-fields/error-route).
- **`lib/brief.ts` + `actions/brief.ts`**: `RESEND_API_URL` (sólo para el stand-in del e2e; por defecto `https://api.resend.com/emails`).
- **`Journey.tsx`**: `FEATURES` = flags del sitio **o** `PREVIEW_MOMENTS=1` en build fuera de producción.
- **`playwright.config.ts`**: dos `webServer` (el mock en 3101 y `next start` en 3100 con `RESEND_*` de prueba apuntando al mock).
- **CSS**: momento (120 svh + sticky), at-work (stage sticky, frame al tamaño final, placeholder con bloque de monitor, plano del cierre), End (señal roja).

## 4. Pruebas

| Suite | Resultado |
|---|---|
| `npx tsc --noEmit` · `npm run lint` · `npm run build` | limpios (build de preview `PREVIEW_MOMENTS=1` para esta fase; el build normal omite las dos secciones y sus tests se saltan solos) |
| `npx vitest run` | **174 / 174** en 11 archivos (nuevo `tests/at-work.test.ts`, 9: tamaños por tier, pose inicial exacta, 200 vh en todos los tiers, `playAt`, agujero del monitor, apertura, `END_T`, URL real de Resend) |
| `npx playwright test` | **477 passed · 1 failed · 224 skipped** sobre el build de preview; el fallo fue `capabilities.spec` lg (el gap triple medido 2,2 px antes de que el scrub asentara) → el test ahora espera el reposo del riel (tolerancia 3 px) y pasa 6/6. `contact.spec` + `moments.spec` + `foundation.spec` solos: 162 passed, 18 skipped |

**`tests/e2e/contact.spec.ts`** (nuevo, 9 tests × 6 proyectos): los seis estados con capturas; «Enviando…» (anotado si el estado pendiente fue observable: la respuesta local es casi instantánea); email inválido y validación en vivo; honeypot; timing; rate limit (xl); el End paso a paso con capturas (y RM); accesibilidad del form con axe, inputs ≥ 16 px, botón ≥ 44 px; sin JS (xl, sm). **`tests/e2e/moments.spec.ts`** (nuevo, 6 tests): at-work mudo/decorativo/sin imágenes ni texto, 200 vh; crecimiento con escala uniforme + clip (la caja de layout nunca cambia), hold, cierre al monitor con el polígono del contrato, CTA detrás; RM como still; momento humano mudo entre la prueba de Rayo y Santi; apertura por paso (banda → entero → cerrado; RM entero); axe. `foundation.spec.ts`: los dos tests de ruta pasan por el fallo del mock («[fail]»).

## 5. Problemas corregidos y decisiones

1. **Mock de Resend en el e2e.** Antes la suite corría con `RESEND_*` vacíos (sólo probaba el error honesto). Ahora un servidor stand-in registra entregas y simula 500: el éxito se verifica como hecho (un envío, con sus campos) y nunca sale un correo real. La URL real sigue siendo la única por defecto (test unitario).
2. **Paralelismo del mock**: los conteos globales de entregas chocaban entre proyectos → cada test marca su brief con un token y cuenta sólo sus entregas; cada test lleva su propia IP (`x-forwarded-for`) para que el rate limit no se filtre entre tests.
3. **Plano del monitor invisible**: `fromTo` con `visibility: "hidden"` sólo en `from` lo dejaba oculto; `visibility: "visible"` en `to` lo enciende al empezar el cierre y lo apaga al revertir.
4. **El timing en el e2e**: entre hidratar y enviar pasaban > 3 s (networkidle + scroll); el test de bot fija el `t` oculto a «ahora» y envía al instante.
5. **Preview de las secciones apagadas**: para poder probarlas y mostrarlas en QA sin cambiar la flag del sitio, `PREVIEW_MOMENTS=1` en build (guardado contra `VERCEL_ENV=production`). Decisión documentada; las flags del sitio siguen en `false`.
6. **«Franco trabajando» + `aria-hidden`**: §13 pide el `aria-label` y §19 el `aria-hidden` sin enfocables; con el placeholder no hay nada enfocable → ambos. Con video real bajo RM hay un botón de play, y entonces la sección no se oculta.
7. **End en flujo, no overlay**: el bloque reemplaza al formulario en su lugar (100 svh negro), `scrollIntoView` + foco; sin capturar scroll. El header se oculta.
8. `NoFallbackError` en el log del servidor de pruebas: lo imprime Next al servir el 404 del test de slug desconocido; previo a esta fase.

## 6. Assets pendientes y bloqueos

| Clave | Falta | Efecto hoy |
|---|---|---|
| `franco.atWork` (+ posters) | video 8–15 s, 16:9 1920×1080 y 9:16 1080×1920, `monitorFocus` real | sección apagada (preview: placeholder); §29 Q11: lanzar sin ella o esperar |
| `moments.human` | still 3:2 / 4:5 (o loop 4–6 s) | sección apagada (preview: placeholder) |
| Resend | `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` con dominio verificado (§29 Q13) | sin variables el form falla honestamente; **un envío real de producción (A15) sigue pendiente** |
| Email en el error de ruta | `[CONFIRMAR]` | «No se envió. Probá de nuevo.» sin «o escribí a …» |
| Pasada manual VoiceOver / NVDA | entorno | pendiente para Phase 11/12 |

## 7. QA visual (`qa/phase10/`, ignorado por git)

- `sheet-{xl-1440,lg-1366,md-820,sm-390,rm-1440}.png`: momento humano (banda → abierto → cerrado), at-work (START → FULL → hold → CLOSE), el formulario (idle, typing 40 %, error de campo, error de ruta) y el End (received → dark → name).
- `phase10-{desktop-1440,laptop-1366,tablet-820,mobile-390,reduced-motion-1440}.webm`: prueba de Rayo → momento humano → Santi; perfil → Franco at work → formulario; el brief escrito, enviado y el cierre. Consola limpia.

## 8. Próximo paso

**Phase 11 · Responsive / a11y / RM consolidation** (MIS §15, §16, §19, §27).
