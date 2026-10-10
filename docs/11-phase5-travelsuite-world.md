# 11 · Phase 5 — TravelSuite360 World

Fecha: 2026-10-10 · Base: `main` @ `362a0e2` · Spec: *REVELADO — Master Implementation Spec* rev 37 (MIS), §26 fila "5 · TravelSuite360 world" (capítulos §08, §16, §19; además §07 costura, §15 tiers y profundidad, §17 media). Copy: Content Master rev 26 §06, literal, sólo dividido en piezas. Dirección: REVELADO 2.2 §10–§11.1.

## 1. Resultado

El mundo de TravelSuite360 continúa el mismo timeline de Phase 4 desde `s:WORLD`: una conversación que se vuelve operación.

**Mensaje → Extracción → Cotización → Viaje → Reserva → Reporte → Gran reveal → Nombre → Producto real (prueba) → costura roja hacia Rayo.**

DOM + CSS 3D (sólo lg/xl) + GSAP. Sin WebGL, sin canvas, sin dependencias nuevas, sin `Math.random()` en runtime.

| Criterio de aceptación (MIS §26) | Cómo se verificó | Estado |
|---|---|---|
| Cada estado coincide con §08 a 1440×900 (screenshot por label) | e2e `travelsuite.spec.ts` · "every state in order", con un screenshot adjunto por label; comprueba posiciones, opacidades y profundidades de la tabla de §08 (detalle en §5). Hojas en `qa/phase5/sheet-xl-1440.png` | ✅ |
| ≥ 55 fps durante el dolly en el laptop de referencia | Medición real con GPU (§6): ≥ 87,7 fps de promedio en el peor caso (xl con CPU 6× más lenta). **No se midió en el laptop de referencia (MacBook Air 2020)** | ⚠️ cumplido en este equipo; pendiente en el dispositivo de referencia |
| Sin `Math.random` en runtime | unidad: ningún `.ts/.tsx` de `src/` lo llama; los fragmentos vienen de `src/data/ts-reveal.ts`, generado y commiteado; `--check` verifica que coincide con el generador | ✅ |
| 3D sólo en lg/xl | e2e en los 6 proyectos: `perspective 1400px` y matrices `matrix3d` sólo en lg/xl sin reduced motion; en md, sm y RM, cero `matrix3d` y `perspective: none` | ✅ |
| Secuencia completa con reduced motion | e2e: TS01 → TS03 → TS04 → TS05 → TS06 → TS09b como cortes (dos lecturas a 150 ms son la misma imagen); la señal queda al final de la barra; aparece el nombre; no hay costura | ✅ |

## 2. Secuencia implementada (TS00–TS12)

Unidades del timeline (1 unidad = 1 gesto). Total 7,5 → 600vh a 80vh por gesto. En md el pin queda tope 450vh (§15); en sm, ×0,75. Con reduced motion: 6 unidades × 50vh.

| Estado | Label | Qué pasa (1440×900; sm entre paréntesis) |
|---|---|---|
| TS00 · SCREEN | `s:SCREEN` 0 | el poster del reel en el rectángulo compartido (hoy, el placeholder honesto) |
| TS00b · ISOLATE | `s:ISOLATE` 1 | el resto se oscurece a .75; el mensaje queda iluminado |
| TS01 · RAW | `s:TS01` 2 (alias de `s:WORLD`) | el mensaje escapa hasta x 160, centrado verticalmente, 64 px, ancho ≤ 1100 (x 24, y 300, 34 px, ≤ 342). En el último 10 % "respira" 2 px. Arriba, `input`; abajo, la línea de origen (18 px, muted). El objeto que escapa le pasa el lugar a la frase de la escena **en los mismos píxeles** (verificado ≤ 1,5 px) |
| TS02 · EXTRACTION | `m:TS02` 2–2,4 | Punta Cana, julio y cuatro se desprenden en su lugar (`y −12`, escala 1,06); sus huecos quedan subrayados. La frase original sigue entera en el árbol de accesibilidad (sólo `color: transparent`) |
| TS03 · FIELDS | `s:TS03` 3 | `destino · Punta Cana` (560,140) a 1,25 · `fechas · julio` (220,300) a .9, op .85 · `pasajeros · 4` (1020,360) a .7, op .6 (el "cuatro" se convierte en "4"). La cámara se acerca +200 y el `perspective-origin` sigue a destino (39 % → 45 %). La frase baja a y 560 con op .45. Aparece `interpretado` (en sm: columna en y 120/200/280, sin z; frase en y 520) |
| TS04 · QUOTE | `s:TS04` 4 | los campos vuelan a las líneas de Opción 01 (120,160). Opción 02 (120,520) queda a .72, op .4. Vuelo y hotel: etiqueta y línea, sin valor inventado (sm: y 120 / 460) |
| TS05 · SELECTED | `s:TS05` 4,6 | `seleccionada` entra con máscara, en rojo (lo activo); Opción 02 se retira a z −900, op 0 |
| TS06 · TRIP | `s:TS06` 5,1 | la opción se reacomoda en la grilla 2×3 del viaje (760,150), ancho 600, con un salto seco `steps(4)` y sin morph (sm: columna de 6, ancho 342, y 140) |
| TS07 · RESERVATION | automático, +500 ms | `reserva confirmada`; la señal roja de 10 px recorre la barra de 600 px en 500 ms y sale por la derecha |
| TS08 · REPORT | automático, encadenado | `→ reporte actualizado · sin intervención` se marca solo (máscara, 400 ms) |
| TS09 · BIG REVEAL | `s:TS09a` ≈ 6,25 · `s:TS09b` 6,7 | la cámara se retira de 0 a −800 con `power2.in`; 09a queda donde la cámara pasa por −300 (sm −500). El viaje queda al centro, percibido a .7. Los 64 fragmentos (sm: 32) ya estaban ahí, fuera de cuadro, y entran por la retirada, no por un fade. Viñeta radial fija |
| TS10 · NAME | automático tras 09b | la deriva (±4 px, 6–9 s, lg/xl/md) se detiene; `TravelSuite360` a 88 px en y 560 (44 px, y 600) entra con un reveal de contraste de 800 ms y debajo `Una agencia entera, operando.`; los fragmentos bajan ×.5 |
| TS11 · PROOF | flujo | la ventana va en el rectángulo compartido, con borde 1px `#8E8B84` @ 40 % y radio 8. Caption `Producto real, en uso en tres agencias.` y rol `Socio · Producto e ingeniería`. Los capítulos `TravelChat · CRM · IA` (cambian a los 3,0 s y 5,5 s) **sólo se muestran con la grabación real** (hoy, placeholder). Preload escalonado: `none` → `metadata` con el mundo activo → `auto` desde TS09 |
| TS12 · EXIT | último 30 % del pase del proof | la ventana baja a .55 y el rojo entra **desde los bordes** del viewport (`clip-path` evenodd con un hueco que se cierra). Al terminar, el stage de Rayo sube por encima del rojo: sin corte y sin flash negro. Con reduced motion no hay costura |

**Reduced motion (§16):** los mismos labels y el mismo pin, mostrados sólo en sus estados de reposo.
- La cadena es: SCREEN → la frase en su entorno (sin ISOLATE) → campos con huecos subrayados → opciones → `seleccionada` → viaje → reserva y reporte (la señal fija al final de la barra) → una composición plana de fragmentos alrededor del viaje (centrado, escala .7) → nombre.
- En lg/xl se dibujan los 64 fragmentos, planos; en md y sm, 32.

**Variantes por tier** (`lib/ts-world.ts → tsVariant`):
- `deep` (lg/xl): `translateZ` real, `perspective 1400px`, la cámara hace el dolly.
- `flat` (md, y reduced motion en md+): la misma composición, con cada profundidad proyectada a 2D (x/y/escala, `z = P·(1 − 1/escala)`), sin `translateZ`.
- `sm`: las columnas sm de §08.

## 3. Arquitectura

- **`scripts/gen-ts-reveal.mjs` → `src/data/ts-reveal.ts`** (commiteado; `--check` falla si difieren). Usa mulberry32 con semilla 360. Produce 64 fragmentos desktop (4 grupos × 16, z 0/−300/−600/−900, cámara → −800) y 32 mobile (2 grupos, z 0/−600, cámara → −500). Reglas:
  - se muestrea en el cuadro final y se desproyecta (el spread se escala por `(P − z)/P`);
  - ninguno cae dentro de la elipse libre (480×300; mobile 300×340);
  - antes de la retirada, ninguno está dentro del 80 % del cuadro (aparecen por la retirada, Revelado 2.2 §10);
  - sin solapes dentro de un grupo;
  - las seis palabras del Content Master se alternan en ciclo.
- **`src/lib/ts-world.ts`** (puro): layout de cada variante en coordenadas del espacio de diseño, labels y tiempos, `perceived`/`depthFor`/`project`, el tiempo de 09a (`power2.in` de GSAP es **cúbico**), `splitField`/`splitList` (sólo dividen el copy) y `chapterAt`.
- **`TravelSuiteWorld.tsx`** (cliente): renderiza el `WorldScene` de Phase 4 con su punto de extensión nuevo (`scene` + `children` + `summary`). Las capas del mundo van dentro del mismo stage, y su timeline se agrega **al mismo timeline**, con un solo pin, un solo snap y un solo ScrollTrigger. Navegación, historial, salto desde el reel, deep links y snap siguen siendo de Phase 4, sin duplicar.
  - Las posiciones se miden una vez por build, con la cámara en reposo: palabra → campo → línea de opción → celda del viaje. Así lo que se mueve es "lo mismo".
  - Las autos (TS07/08 y TS10) usan `api.auto` desde marcadores `m:TS07`/`m:TS10`, 0,02 unidades antes de sus labels.
  - `will-change` sólo en la cámara y los grupos, entre `m:TS08` y TS10.
- **`TravelSuiteReveal.tsx`**: 4 grupos de profundidad siempre presentes. Los fragmentos (un `<span aria-hidden>` por palabra, `left/top` estáticos) se montan sólo con el mundo a menos de un viewport.
- **`WorldScene.tsx`** (extendido): `WorldSceneExtension { units, build, onToggle }`; el mundo sólo agrega "lo que sigue a `s:WORLD`" (MIS §07).
- **`ProjectProof` / `ProofMedia`**: capítulos, preload escalonado, `onFail`, marco TS y la costura `exit: "seam"`.
- **`lib/world.ts`**: el `escapeRect` de TS ahora escala con el espacio de diseño (el mensaje aterriza sobre los píxeles de la frase en lg/md).
- **`lib/tiers.ts`**: tope de 450vh por pin en md (§15); `stepToStop` acepta tolerancia.
- **`lib/useScene.ts`**: el modo de pasos de reduced motion usa la misma tolerancia de 2 px que el snap (que ya la tenía desde Phase 4).
- **Accesibilidad (§19):**
  - El mensaje, `input`, la línea de origen y el cierre son texto real, una sola vez en el árbol.
  - Campos, opciones, viaje, reserva y fragmentos son `aria-hidden`. Los estados se resumen una vez en un `<ol class="sr-only">` con las palabras del Content Master.
  - El nombre es el `h2` sr-only de la sección; la versión visual es `aria-hidden`.
  - Sin JS o en pantallas diminutas, el mundo se lee como su copy y la escena y el resumen no existen.

## 4. Problemas corregidos

1. **La profundidad se aplanaba.** Un `div aria-hidden` intermedio sin `preserve-3d` colapsaba las profundidades: Opción 02 y los campos se veían planos. Ahora es un plano 3D (`.ts-plane`).
2. **TS03 desbordado.** "Punta Cana" se veía a 1,52× y quedaba bajo el header. Las escalas de §08 son las percibidas, así que cada profundidad se resuelve con el +200 de la cámara incluido (igual que el .7 del viaje).
3. **TS10 no aparecía.** Un auto atado al label exacto no se disparaba si el snap quedaba un pixel antes. Se resolvió con marcadores propios del mundo (ver 7: el arreglo compartido se descartó).
4. **El reacomodo de TS06 se veía en TS05.** Estaba puesto *sobre* el label; un paso de reduced motion cae exacto en él. Ahora arranca 0,01 después.
5. **TS09b no se alcanzaba en mobile con reduced motion.** El modo de pasos tenía una tolerancia fija de 1e-4; a 390 px, 1 px corto mostraba TS06. Ahora usa la misma tolerancia de 2 px que el snap.
6. **TS09a mal calculado.** Se calculó con `power2.in` cuadrático, pero en GSAP es cúbico: la cámara paraba en −183 en lugar de −300. Ahora usa raíz cúbica, con un test que lo cubre.
7. **Regresión introducida y retirada.** La tolerancia que agregué primero a las autos compartidas de `useScene` se revirtió (estado de Phase 4) y el caso de TS se resolvió con marcadores locales (punto 3). Las pruebas con el test O3 del opening: con esa tolerancia falló 5/10 en dos tandas, y la reversión con los marcadores también falló 5/10. El mismo test **sobre el código commiteado de Phase 4** (worktree temporal) dio 10/10 y luego 6/10. Conclusión: es un flake previo del test de Phase 2 bajo carga paralela, no una regresión de Phase 5. Esa tolerancia no tiene evidencia propia en su contra; se descartó para no cambiar código compartido sin necesidad.
8. Comprobaciones nuevas del propio test: el handoff se medía en el test de reversa, donde el snap hacia atrás lo invalida (se movió al test hacia adelante), y la reversa ahora espera a que el playhead escrubeado llegue al label.

## 5. Pruebas

| Suite | Resultado |
|---|---|
| `npx tsc --noEmit` · `npm run lint` · `npm run build` | limpios · `/` y `/trabajo/{4}` SSG |
| `npx vitest run` | 6 archivos · **114 tests** ✅ (nuevo `tests/ts-world.test.ts`, 18 tests: determinismo y `--check` del generador, conteos y grupos, reglas de los fragmentos en el cuadro final y antes de la retirada, palabras del Content Master, ningún `Math.random(` en `src/`, `z = P·(1 − 1/s)`, proyección 2D, variantes por tier, layout de §08, presupuesto de unidades y topes, 09a cúbico, división del copy, capítulos; `foundation`: tope de md y tolerancia del modo de pasos; `world`: `escapeRect` escalado) |
| `npx playwright test` | 6 proyectos · **277 passed, 0 failed, 119 skipped** (los skips son por diseño: viewport de referencia una sola vez, inputs de escritorio en mobile, tiny, RM) |

**`tests/e2e/travelsuite.spec.ts`** (nuevo):
- la secuencia completa a 1440×900: SCREEN → … → TS12, con screenshot por label, posiciones en el espacio de diseño, `translateZ` de la cámara (+200, 0, −300, −800), viaje a .7 centrado, autos, nombre, proof y costura (visible al 90 % del pase y oculta al terminar);
- el handoff objeto → frase en los mismos píxeles;
- la reversa deshace cada estado;
- 3D sólo en lg/xl, con 64/32 fragmentos según tier;
- columna sm y sin deriva;
- tiny → texto;
- reduced motion completo, como cortes;
- el resumen sr-only, con cada frase una vez en el árbol;
- axe en TS10;
- fragmentos montados sólo cerca del mundo;
- sin JS.

**Flake conocido, previo a esta fase:** `opening.spec.ts › O3 opens the band…` falla de forma intermitente con los workers por defecto (6) y `--repeat-each`; también sobre el commit de Phase 4. Pasa 6/6 con 1 worker y 10/10 con 10. En la corrida completa final pasó. No se tocó (es Phase 2); queda anotado para estabilizarlo.

## 6. Rendimiento del dolly (medición real)

**Equipo:** Intel Core i5-12400F · NVIDIA GeForce RTX 5060 · Windows 11 Pro · pantalla de 180 Hz.

**Navegador:** Chromium 1248 de Playwright, *new headless* con `--use-angle=d3d11 --enable-gpu-rasterization`, sin ventana visible.
- Se verificó que usa la GPU real: WebGL reporta `ANGLE (NVIDIA, NVIDIA GeForce RTX 5060 … Direct3D11)` y `SystemInfo` reporta `gpu_compositing: enabled`.
- El headless por defecto usa SwiftShader (software) y **no** sirve para medir.
- Build de producción (`next start`), DPR 1.

**Metodología:**
1. Se abre el deep link `/trabajo/travelsuite360` y se espera a TS06 con las autos terminadas.
2. Se aplica throttling de CPU por CDP (1×, 4× o 6×).
3. Un gesto de rueda continuo cruza el dolly TS06 → TS09b: 36 px cada 16 ms, hasta 1,6 unidades.
4. Un bucle de `requestAnimationFrame` registra cada frame. Cuentan sólo los frames entre el primero y el último en que la cámara (3D) o el grupo 0 (2D) cambiaron: es "durante el dolly", el scrub incluido.
5. Se reporta fps promedio, p95, máximo y frames > 18,2 ms (por debajo de 55 fps). 3 corridas por configuración.

El bucle llama a `getComputedStyle` en cada frame, así que la medición es conservadora.

| Configuración | CPU | fps prom. (3 corridas) | p95 frame | frame máx. | frames > 18,2 ms |
|---|---|---|---|---|---|
| xl 1440×900 · 3D (64 fragmentos) | 1× | 178,0 · 178,1 · 180,0 | 5,7 ms | 16,7 ms | 0 · 0 · 0 |
| xl 1440×900 · 3D | 4× | 177,4 · 177,4 · 177,4 | 5,7 ms | 16,8 ms | 0 · 0 · 0 |
| xl 1440×900 · 3D | 6× | 146,2 · 131,1 · **87,7** | 11,2 · 11,2 · 22,4 ms | 94,7 ms | 3/229 · 3/220 · 20/175 |
| lg 1366×768 · 3D | 1× | 173,1 · 179,0 · 179,0 | 5,7 ms | 22,2 ms | 1 · 0 · 0 |
| lg 1366×768 · 3D | 4× | 172,9 · 176,9 · 175,9 | 5,7 ms | 16,6 ms | 0 · 0 · 0 |
| lg 1366×768 · 3D | 6× | 172,7 · 169,8 · 170,6 | 5,8 ms | 16,7 ms | 0 · 0 · 0 |
| md 820×1180 · 2D (32) | 4× | 180,0 · 180,0 · 180,0 | 5,7 ms | 5,8 ms | 0 · 0 · 0 |
| sm 390×844 · 2D (32) | 4× | 172,2 · 180,0 · 178,7 | 5,7 ms | 33,5 ms | 1 · 0 · 0 |
| sm 390×844 · 2D | 6× | 149,4 · 176,1 · 170,6 | 11,1 ms | 16,7 ms | 0 · 0 · 0 |

**Lectura:**
- En todas las corridas el promedio supera 55 fps; el peor caso es xl con CPU 6× más lenta, 87,7 fps.
- La única degradación visible está en ese mismo caso (11 % de frames > 18,2 ms en una de 3 corridas).
- No hizo falta la guarda de §08 (quitar el grupo 4 en lg).

**Límites:**
- No es el dispositivo de referencia (MacBook Air 2020).
- El throttling emula una CPU más lenta, no una GPU más débil.
- rAF mide la cadencia del hilo principal, no los frames del compositor.

Por eso el criterio "≥ 55 fps en MacBook Air 2020" **queda pendiente de una verificación en ese equipo** (Chrome, panel Performance, MIS §27). En este equipo se cumple con margen.

**El cierre `Target crashed` (investigación):**
- **Observado:** durante las primeras mediciones con ventana visible, el navegador se cerró varias veces y una vez Playwright reportó `Target crashed`.
- **Repro controlado:** Chromium con ventana, `DEBUG=pw:browser` (stderr del navegador) y eventos `crash`/`close`/`disconnected` en cada corrida.
  - Cada "fallo" fue `page-close` + `browser-disconnected`, **sin** evento `crash`.
  - En la corrida 1 el cierre ocurrió a los ~3 s de abrir, todavía en SCREEN, antes del scroll y del 3D.
  - El navegador salió con código 0 y su stderr no registra errores de renderer ni de GPU (sólo avisos de `page_load_metrics`).
  - Esos cierres coincidieron con ventanas de prueba abriéndose en el escritorio del usuario, que el usuario reportó ("se abre en bucle esta pestaña") y cerró.
- **Sin interrupción**, el mismo dolly en 3D terminó bien:
  - 6 corridas con ventana: wheel, programático, control 2D, home;
  - 27 corridas sin ventana con GPU;
  - toda la suite e2e.
- **Conclusión:** no es reproducible y no hay evidencia de que provenga de la página.
- **Sigue sin explicar** el único evento `Target crashed` (renderer) del primer intento: no quedó stderr de esa corrida y no se volvió a producir. **No se declara resuelto.**
- Las mediciones se hicieron después sin ventanas visibles, para no interferir con el escritorio.

## 7. Decisiones

- **`interpretado`** va en (160,140) (sm 24,72): §08 no le da posición; se usó la esquina del label, como `input`.
- **Composición del viaje y la reserva:**
  - centro del viaje en y ≈ 390, un poco arriba del centro, para que el nombre en y 560 quede libre;
  - la reserva y su barra van dentro del bloque del viaje, para que viajen juntas al centro.
- **Fragmentos:** 9 px en su propio plano (el texto final es diminuto: es textura, `aria-hidden`).
- **TS12 hacia Rayo:** el rojo entra *desde los bordes* (Revelado 2.2 §11.1 y MIS §07 lo dicen así). El valor literal `inset(50%) → inset(0)` dibujaría el rojo creciendo desde el centro; se implementó como un hueco que se cierra (polígono evenodd).
  - Al terminar, el stage de Rayo (todavía negro en su SCREEN, Phase 4) sube por encima del rojo.
  - Si el SCREEN de Rayo debe heredar el rojo es una decisión de **Phase 6**.
  - El "Siguiente → Rayo Smash" queda tapado por el rojo durante el último 30 % (sigue en el tab order y es clickeable).
- **Línea de origen:** "Las agencias operan en WhatsApp, planillas y correo. TravelSuite360 lo junta." se publica como en Phase 1 (POSITIONING). El Content Master la marca `[CONFIRMAR]` sobre si es el problema de origen tal como Franco lo contaría: **sigue abierta**.

## 8. Assets pendientes para la aprobación visual definitiva

| Clave | Falta | Efecto hoy |
|---|---|---|
| `ts.reel.poster` + su `anchorRect` | captura demo de TravelSuite360 con datos controlados + checklist §23 (dos firmas); el rect real del mensaje en ella | SCREEN/ISOLATE de TS es el placeholder; el mensaje aparece sobre el poster oscurecido. **Bloquea el lanzamiento y la aprobación visual de TS00–TS01** |
| `ts.proof` | grabación de 8 s, un archivo, con tres cortes secos (TravelChat 3 s → CRM 2,5 s → IA 2,5 s); AV1 + H.264 1600×900 y H.264 960×540; poster AVIF/WebP del primer frame; datos demo (§23) | el proof es el placeholder; los capítulos no se muestran; el preload escalonado y el cambio de capítulo están implementados pero no se pudieron ejercitar con video real |
| URL pública o demo | `[CONFIRMAR]` | sin "Abrir ↗" (se omite) |
| Verificación en MacBook Air 2020 | Chrome Performance durante el dolly | criterio de fps pendiente en el dispositivo de referencia (§6) |

Nunca se usaron las capturas de producción de TravelSuite360 (difuminadas, no aprobadas): siguen como `candidates`, sin publicarse.

## 9. QA visual (`qa/phase5/`, ignorado por git)

- `sheet-{xl-1440,lg-1366,md-820,sm-390,rm-1440,rm-sm-390}.png`: TS00–TS10 por tier, con el `data-state` de cada captura, más los PNG individuales.
- `seam-{xl,sm}.png`: TS12, del 60 % al 105 % del pase del proof.
- `ts-{desktop-1440,laptop-1366,tablet-820,mobile-390,reduced-motion-1440}.webm`: el mundo completo (SCREEN → TS10), el proof y la costura hacia el SCREEN de Rayo. Consola limpia.

## 10. Próximo paso

**Phase 6 · Rayo Smash world** (MIS §09, §26 fila 6). No se empieza sin aprobación. Incluye decidir el SCREEN de Rayo después de la costura roja (§7).
