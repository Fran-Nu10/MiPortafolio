# 12 · Phase 6 — Rayo Smash World

Fecha: 2026-10-10 · Base: `main` @ `53cf4fc` · Spec: *REVELADO — Master Implementation Spec* rev 37 (MIS), §26 fila "6 · Rayo world" (capítulo §09; además §07 costura y gramática, §15 tiers y profundidad, §16 RM, §17 media, §18 presupuestos, §22 contratos, §24 fallos). Copy: Content Master rev 26 §07, literal. Dirección: REVELADO 2.2 §11.2.

## 1. Resultado

El mundo de Rayo Smash continúa el mismo timeline de Phase 4 desde `s:WORLD`:

**Interfaz real (el hero de la demo) → la hamburguesa escapa al campo rojo → «Capa por capa.» → las capas se separan, con profundidad → la cámara pasa entre ellas (clip) → las capas se arman por primera vez en la hamburguesa entera → la línea real del menú → la prueba (demo real, navegable) → Santi.**

DOM + CSS 3D (sólo lg/xl) + GSAP + un clip prerenderizado para R05. Sin WebGL, sin dependencias nuevas, sin texto inventado: el mundo muestra sólo «Capa por capa.» y `Clásica · doble medallón smash, cheddar fundido, salsa de la casa, pan brioche · $ 490`.

| Criterio de aceptación (MIS §26) | Cómo se verificó | Estado |
|---|---|---|
| R00–R07 + handoff del clip + omisiones | e2e `rayo.spec.ts`: cada estado a 1440×900 con screenshot adjunto, composición medida (§5) | ✅ |
| Handoff DOM ↔ video invisible con un clip de prueba renderizado desde las capas | el clip se genera desde los seis cutouts derivados en la composición exacta de R04 (`scripts/gen-rayo-through.mjs`); e2e: diff de píxeles entre el DOM en R04 y el primer frame del clip ≤ 3 % (medido 1,9 % con el cross-fade de 120 ms que permite §09; detalle en §6) | ✅ |
| Un clip que falla omite R05 limpiamente | e2e: con `*.mp4` bloqueado, R05 no muestra video, las capas siguen a la vista y R06 llega igual; en md, sm, RM y Save-Data no se monta `<video>` | ✅ |

## 2. Material

**No se dibujó ni se inventó nada.** Las seis capas son recortes de las capturas reales del hero de la demo (`scripts/derive-rayo-layers.mjs`, sharp):
- `prospector-hero-exploded.png` (2543×1321, el hero con la Clásica explotada sobre `#0a0a0f`): se "chroma-keyea" por distancia al color de fondo (borde suave 6 → 22/255). Seis bandas: pan de arriba, bacon, medallón, cebolla, medallón, pan de abajo. **El producto real es doble medallón**: el Spec §09 listaba cinco capas; el contrato pasó a seis (`rayo.layers.patty2`), en el orden real.
- El medallón superior lo cruza el título de la propia demo ("CAPA POR CAPA" en blanco): se deriva de `prospector-hero-exploded-scroll.png` (el mismo hero, scrolleado y 1,478× más grande), reescalado por el ancho de la cebolla y centrado donde está en el hero. Verificado: es la misma fotografía (diferencia media 14,6/255 contra los píxeles no cruzados).
- El pan de abajo lo corta el pliegue del hero en la captura: sus últimas 28 filas se funden en lugar de terminar en una línea. En R06 queda bajo el medallón; en R04 se lee como sombra.
- `rayo.burger` es la pila entera compuesta desde las seis capas, en sus posiciones del póster: lo que escapa del SCREEN.
- Variantes AVIF q50 + WebP q78, 1x = mitad del master, 2x = master (`scripts/media.mjs cutout`). Todo ≤ 27 KB; la pila 94 KB (WebP 2x).

**Geometría generada y commiteada:** `src/data/rayo-layers.ts` (caja de cada capa dentro de la pila, 0–1; `anchorRect` de la pila dentro del póster para los dos frames del reel: desktop `{.3838, .0568, .2207, .941}`, mobile `{.2429, .0568, .4885, .941}`). `--check` falla si difiere de la derivación; `assets.ts` la importa.

**El clip R05 (`rayo.through`)** es un render de prueba (`scripts/gen-rayo-through.mjs`): Chromium headless renderiza 96 frames (30 fps, 3,2 s) de la composición R04 real (mismos cutouts, `perspective 1200px`, `rotateX 8°`, mismas profundidades, desde `lib/rayo-world.ts`) con una cámara que avanza entre pan, bacon, queso y carne y vuelve; primer frame = último frame = R04. 1920×1200 alrededor del espacio 1440×900 (así también cubre el stage en lg). Codificado en el navegador: **AV1 MP4 (1,22 MB) y H.264 MP4 (1,43 MB)**, sin audio, dentro del presupuesto de 2,5 MB (§18). Póster `rayo.through.poster` = frame 0. Sólo desktop (sin 9:16).

Los PNG originales de la demo (capas limpias, pan de abajo entero) reemplazan todo esto con las mismas claves y los mismos campos de geometría, sin tocar el mundo.

## 3. Secuencia implementada (R00–R07)

Unidades: SCREEN 0 · ISOLATE 1 · R02 2 (= `s:WORLD`) · R03 2,6 · R04 3,6 · R05 3,9 · R06 4,9 · R07 5,5 · fin 5,7 → 456vh a 80vh por gesto (md: 399vh; sm: 342vh). Reduced motion: 3,5 unidades × 50vh.

| Estado | Label | Qué pasa (1440×900; sm entre paréntesis) |
|---|---|---|
| R00 · SCREEN | `s:SCREEN` | el hero real en el rectángulo compartido; `rayo.burger` alineado sobre la pila del póster (invisible hasta el primer scroll, regla de Phase 4) |
| R01 · ISOLATE | `s:ISOLATE` | la interfaz se oscurece a .75; la pila queda iluminada |
| R02 · ENTERA | `s:WORLD` | la pila sale de la pantalla y se centra al 62 % del alto del espacio (sm: 70 % del ancho); el campo rojo llena; la pantalla se va |
| R03 · CAPA POR CAPA | `s:R03` | la pila se cambia por las seis capas alineadas (misma composición, mismo frame: cambio invisible); «Capa por capa.» entra con máscara hacia arriba, 88 px (sm 44) |
| R04 · EXPLODE | `s:R04` | las capas se separan: `y` de −32 % a +30 % del alto de la hamburguesa armada, lineal; en lg/xl además `z` 0 → −320 por capa y el grupo inclina 8° (`rotateX`); `will-change` sólo entre R03 y R06 |
| R05 · THROUGH | `s:R05` | al cruzar hacia adelante: el clip (ya montado, en frame 0, invisible, sobre las capas) reproduce; en su primer frame presentado se muestra (120 ms) y las capas se ocultan; al terminar, las capas vuelven y el clip se va (120 ms). Hacia atrás, o si el visitante sigue 0,3 unidades más allá: se detiene y las capas vuelven. Sin clip listo: no pasa nada, R06 sigue |
| R06 · ASSEMBLY | `s:R06` | las capas se asientan de abajo arriba (60 ms de escalón) en la hamburguesa entera, por primera vez: cada capa se hunde una parte de su alto en la de abajo (regla fija, sin morph); la hamburguesa crece al 62 % del alto, centrada un poco arriba del medio; la inclinación vuelve a 0; el título se va |
| R07 · HERO LINE | `s:R07` | la línea real del menú debajo: `Clásica` (44 px, papel) · `doble medallón smash, cheddar fundido, salsa de la casa, pan brioche` (17 px) · `$ 490` (mono), con máscaras escalonadas |
| prueba | flujo | `ProjectProof` de Phase 4: poster real, «Demo real, navegable.», rol «Diseño, motion y desarrollo», la línea de relación «Rayo Smash no es un cliente: es la demo que Prospector construye para vender.», stack confirmado, «Siguiente → Santi Nuca» |

**Reduced motion (§16):** tres stills tras el corte de la card: la pila en el campo rojo (`s:WORLD`) → las capas separadas, planas, con el título (`s:R04`) → la hamburguesa entera con la línea (`s:R06`). El video nunca se monta.

**Tiers (§15):** `deep` lg/xl (3D + clip) · `flat` md y RM en md+ (sólo `y`, sin perspectiva, sin clip) · `sm` (su espacio 390×844, sólo `y`, sin clip salvo un 9:16 propio). En pantallas diminutas, el mundo es su copy.

## 4. Arquitectura

- **`src/lib/rayo-world.ts`** (puro): labels y unidades, variantes, `posterBoxes` / `assembledBoxes` (regla de asiento por capa: panes y medallones .42–.5, bacon .55, cebolla .6), `explodeOffsets` (−32 % → +30 %, z sólo en `deep`), `canRunClip`, `splitMenuLine`.
- **`RayoWorld.tsx`** (cliente): monta el `WorldScene` de Phase 4 con la extensión `scene` (un timeline, un pin, un snap). Sus capas van dentro del stage: espacio escalado una vez → `persp` → `group` (preserve-3d) → seis `piece` con `Cutout`; el `<video>` 1920×1200 centrado sobre el espacio; título y línea del menú como texto real. `Clip` encapsula el handoff (§09): `requestVideoFrameCallback` (fallback `playing`), `ended`, cruce hacia atrás, ventana, errores, `play()` rechazado.
  - El video se monta sólo con el pin activo (`onToggle`), `preload="auto"`, nunca con RM o Save-Data; `canplaythrough` marca `ready`.
  - Posicionamiento por transforms (left/top fijos en la caja del póster; `x/y/z/scale` animados).
- **`WorldScene.tsx`**: objeto de tipo `cutout` (el recorte real en su `anchorRect`); `Journey.tsx` lo elige cuando el contrato resuelve a un cutout real, si no, el recorte del póster de Phase 4.
- **Contratos (`assets.ts`):** `rayo.burger`, `rayo.layers.{topBun,bacon,patty,onion,patty2,bottomBun}` (derived, con `meta.offset`), `rayo.through` (derived, opcional, desktop) y `rayo.through.poster`; `rayo.reel.poster.anchorRect` medido. `tsconfig`: `allowImportingTsExtensions` para que `check-assets.mjs` (Node type stripping) resuelva `./rayo-layers.ts`.
- **Accesibilidad (§19):** título y línea del menú existen una vez en el árbol (la copia de texto bajo el stage se oculta mientras corre la escena); las capas llevan `alt=""`; la pila lleva el alt de la Clásica; sin JS el mundo es su copy.

## 5. Pruebas

| Suite | Resultado |
|---|---|
| `npx tsc --noEmit` · `npm run lint` · `npm run build` | limpios |
| `npx vitest run` | 7 archivos · **126 tests** ✅ (nuevo `tests/rayo-world.test.ts`, 12: `--check` de la derivación, seis capas en orden y dentro de la pila, ancla dentro de los dos frames, presupuestos de los cutouts, contratos (burger/capas derived con offsets; clip AV1 → H.264 ≤ 2,5 MB, sólo desktop, póster), arreglos (póster vs armada, asientos, misma x), R04, variantes, unidades y topes, `canRunClip`, copy) |
| `npx playwright test` | 6 proyectos · **303 passed, 0 failed, 153 skipped** (skips por diseño) |

**`tests/e2e/rayo.spec.ts`** (nuevo, 10 tests): R00–R07 a 1440×900 con capturas (opacidades, 62 %, centro, cambio de pila por capas en el mismo lugar, `translateZ −320` y `matrix3d` en R04, video visible y capas ocultas en R05 y vuelta, hamburguesa entera a 62 % y más ancha que la pila, texto exacto del menú, prueba con la línea de relación y sin la frase pendiente) · handoff ≤ 3 % · clip bloqueado → R05 omitido · reversa (clip detenido y en pausa) · costura desde TS · tiers (3D y clip sólo lg/xl) · phones · RM como cortes · accesibilidad y axe en R07 · sin JS. `world.spec.ts`: la gramática de Rayo usa las fracciones de su pin de 5,7 unidades.

## 6. Rendimiento (medición real)

Método de Phase 5: Chromium headless sobre la GPU real (ANGLE d3d11; i5-12400F · RTX 5060 · 180 Hz), build de producción, rueda real a 36 px/16 ms, frames contados con `requestAnimationFrame` sólo mientras el grupo o una capa cambian; CPU frenada 1×/4×/6×; 2 corridas por configuración.

| Configuración | CPU | R03 → R04 (seis capas 3D, inclinación) | R05 clip (decodificación) |
|---|---|---|---|
| xl 1440×900 | 1× | 180 fps · p95 5,7 ms · 0 frames > 18,2 ms | 180 fps · frame máx. 5,9 ms · 0 descartados |
| xl 1440×900 | 4× | 179–180 fps · 0 lentos | 180 fps · 0 descartados |
| xl 1440×900 | 6× | 176–178 fps · 0 lentos | 180 fps · 0 descartados |
| lg 1366×768 | 4× | 180 fps · 0 lentos | 180 fps · 0 descartados |
| md 820×1180 (2D) | 4× | 180 fps · 0 lentos | sin clip |
| sm 390×844 (2D) | 4× | 171–180 fps · p95 ≤ 11,1 ms · 0 lentos | sin clip |

La medición de R06 → R07 se descartó: el segundo bucle de `requestAnimationFrame` del script se superpuso al primero y duplicó los conteos (360 "fps"); no se informa un número que no es real. Las mismas limitaciones que en Phase 5: no es el MacBook Air 2020 de referencia; frenar la CPU no emula una GPU débil.

**Handoff, medido** (columna de la pila, 320×780 px): DOM de la página vs. frame 0 del render (paridad de composición) diferencia media 2,0/1,4/1,8 por canal; frame decodificado vs. render (códec) 2,8/1,8/2,9; DOM vs. video 3,5/2,0/3,3, sin desplazamiento de color (medias con signo ≈ 0; el campo rojo coincide al 0,00 %). Es ruido de textura del códec, no un salto: por eso se activó el cross-fade de 120 ms que §09 prevé como fallback.

## 7. Problemas corregidos

1. **El video se dibujaba 240 px a la izquierda** (handoff al 6,6 %): el preflight de Tailwind pone `max-width: 100%` a `video`; la caja de 1920 px quedaba en 1440. `max-width: none`. Handoff → 1,9 %.
2. **La caja del pan de abajo abarcaba toda la columna**: la línea del pliegue en las últimas filas de la captura pasaba el umbral; se excluyen tres filas antes de medir.
3. **El medallón superior cruzado por el título de la demo**: derivado de la captura scrolleada (§2).
4. **`check-assets.mjs` no resolvía `./rayo-layers`** (Node type stripping exige la extensión): import con `.ts` y `allowImportingTsExtensions`.
5. **Reglas del compilador de React** (refs en render, estado mutado): el control del clip pasó a estado.
6. **`next start` sólo sirve lo que `public/` tenía al compilar**: los medios regenerados necesitan un build (anotado para el QA; los tests ya compilan antes).
7. **La línea del menú no aparecía al caer exacto en R06** (un snap puede quedar un pixel corto del label): el bloque se desenmascara 0,02 unidades antes; sus líneas son las que entran.
8. Tests: la hamburguesa armada no es más baja que la pila (mide 62 % de alto y es mucho más ancha); RM fuera del test de tiers; los errores de consola del bloqueo de `*.mp4` que provoca el propio test se filtran.

## 8. Decisiones

- **La costura roja TS12 → Rayo** (lo que Phase 5 dejó abierto). El Spec pide "sin corte ni flash negro" (§07) y a la vez R00 = el hero sobre negro (§09) y un salto desde el reel invisible (Phase 4, diff ≤ 1 %, que exige el mismo fondo negro del reel). Tratamiento elegido: el rojo cierra desde los bordes sobre la prueba de TS **como una cortina**; el stage negro de Rayo (la interfaz real) sube y la cubre en el mismo scroll; un gesto después, la hamburguesa escapa y el rojo vuelve como entorno propio de Rayo (R02). La secuencia rojo → interfaz real → rojo es la narrativa "Interfaz real → hamburguesa protagonista → universo rojo". Verificado en e2e: costura visible al 90 % del pase, oculta al llegar a SCREEN (env 0), env 1 en R02. Si Franco prefiere que el SCREEN de Rayo ya sea rojo, hay que aceptar un corte de fondo en el salto desde el reel: no se hizo.
- **"La hamburguesa entera" del Spec es la pila que muestra el hero real** (explotada). SCREEN → R03 respetan la captura; R06 es la primera vez que la hamburguesa está entera (reconstrucción), y crece al 62 % que §09 da para R02. El 62 % en R02, aplicado a la pila alta y fina, deja la pila casi del tamaño del reel: la "entrada" crece poco. **Candidato de ajuste** (no se redimensionó sin aprobación).
- **R05 sólo en lg/xl**: el clip es la composición 3D; en md (3D apagado por §15) y sm su primer frame no coincidiría con el DOM. §15 listaba "clip 16:9" en md asumiendo la misma composición.
- **Cross-fade de 120 ms activado** (fallback de §09), por el ruido de códec medido (§6).
- **Título** centrado sobre la pila, como el hero de la demo (cita al proyecto); se va en R06.
- **Contraste sobre rojo** (§19): papel sólo en tamaño display (título 88 px, `Clásica` 44 px); el detalle y el precio en tinta (`#0b0b0c` sobre `#E63B2E` ≈ 4,7:1).
- **md** queda con el espacio 1440×900 escalado (§15): composición chica en tablet vertical. Candidato de ajuste para QA de dispositivos.
- Las demás frases de la demo (CLÁSICA, DEL MENÚ, el botón Pedir) sólo existen dentro de las capturas; el mundo no las reproduce.

## 9. Assets pendientes

| Clave | Falta | Efecto hoy |
|---|---|---|
| `rayo.layers.*`, `rayo.burger` | los PNG originales de las capas de la demo (limpios, pan de abajo entero, resolución completa) | cutouts derivados de capturas: 1x a media resolución; pan de abajo fundido en el pliegue |
| `rayo.through` | render final desde los originales (AV1 + H.264, 1920×1200 o 16:9 al encuadre R04) | render de prueba desde los cutouts derivados |
| `rayo.through` 9:16 | opcional | R05 se omite en phones |
| `rayo.proof` | grabación hero → menú → producto, 6–10 s, sin loop | placeholder sobre el poster real |
| `liveUrl` | `[CONFIRMAR]` (candidata de ENSAMBLE registrada) | sin "Abrir ↗" |
| `proofLineExtra` | `[CONFIRMAR]` ("Cada negocio recibe la suya.") | no se publica |
| fotografía de la burger | `[CONFIRMAR]` propia / banco / generada (Content Master 07) | sin atribución en pantalla |
| año | `[CONFIRMAR]` | no se muestra |

## 10. QA visual (`qa/phase6/`, ignorado por git)

- `sheet-{xl-1440,lg-1366,md-820,sm-390,rm-1440,rm-sm-390}.png`: SCREEN → R07 por tier, con el `data-state` de cada captura, más los PNG individuales.
- `rayo-{desktop-1440,laptop-1366,tablet-820,mobile-390,reduced-motion-1440}.webm`: la prueba de TS, la costura, Rayo entero (R05 con el clip en desktop y laptop), la prueba de Rayo y la llegada al SCREEN de Santi. Consola limpia en todas.

## 11. Próximo paso

**Phase 7 · Santi Nuca world** (MIS §10, §26 fila 7). No se empieza sin aprobación.
