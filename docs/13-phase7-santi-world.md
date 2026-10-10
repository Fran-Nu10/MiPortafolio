# 13 · Phase 7 — Santi Nuca World

Fecha: 2026-10-10 · Base: `main` @ `ff83afb` · Spec: *REVELADO — Master Implementation Spec* rev 37 (MIS), §26 fila "7 · Santi world" (capítulo §10; además §07 gramática, §15 tiers, §16 RM, §17 imágenes, §19 atribución y alt, §22 contratos, §29 Q3). Copy: Content Master rev 26 §08, literal. Dirección: REVELADO 2.2 §11.3.

## 1. Resultado

El mundo de Santi Nuca continúa el mismo timeline de Phase 4 desde `s:WORLD`:

**Interfaz editorial (la apertura real del sitio) → la fotografía sale de la página y el negro se vuelve papel → díptico → tríptico con Forma · Línea · Textura → el sistema (01–06) → la prueba (sitio real, en línea) → Chef.**

DOM + GSAP + `clip-path`, 2D (sin perspectiva). Sin dependencias nuevas. Una sola regla geométrica, verificada en cada estado: una fotografía se mueve con **escala uniforme y recorte**, nunca con una escala no uniforme.

**Atribución, fija (Content Master 08):** las fotografías son de Santi Nuca; Franco hizo diseño web, dirección estética digital, UX/UI, composición editorial y desarrollo. El crédito «Fotografía · Santi Nuca» es texto real, junto a la primera fotografía desde que aparece, y sigue en la prueba. Cada `alt` termina en «— fotografía de Santi Nuca» (regla del `check-assets`); ningún texto, alt ni metadato se lo atribuye a Franco.

| Criterio de aceptación (MIS §26) | Cómo se verificó | Estado |
|---|---|---|
| N00–N05 + RM | e2e `santi.spec.ts`: cada estado a 1440×900 con screenshot adjunto y la composición medida (§5); RM como cuatro cortes | ✅ |
| Sin escala no uniforme (assert sobre las transforms) | unidad: `fit` da una sola escala y recortes ≥ 0 con la ventana visible exacta; e2e: en cada estado y a mitad de camino, la matriz de cada figura es `matrix(a, 0, 0, a, …)` con `a === d` y sin skew (`assertUniform`) | ✅ |
| Crédito visible de N02 hasta la prueba | e2e: opacidad 1 del crédito en N02, N03, N04 y N05; el micro case de la prueba lo repite (dos apariciones exactas en el árbol) | ✅ |
| Cambio de tono a papel correcto | e2e: `data-paper="no"` en SCREEN/ISOLATE, `"yes"` en N02 (el crédito pasa a tinta al 70 %, los labels a tinta), `env` 1; al volver atrás, `"no"` y `env` 0 | ✅ |

## 2. Material

**Nada generado, nada inventado.** Hasta que lleguen los originales de Santi Nuca (§29 Q3), el mundo usa sus fotografías **tal como las muestra su sitio**: `scripts/derive-santi-photos.mjs` las corta de las capturas reales en los bordes del panel de cada página (la regla del header y la línea vertical de la página, detectadas por el gradiente), sin tocar un píxel. Seis fotografías, en el orden del mundo:

| # | Página real | Uso |
|---|---|---|
| 1 | Apertura (01/12) | el objeto que escapa del SCREEN; la imagen sola; primera del díptico, del tríptico y de la retícula |
| 2 | Trabajo 01 | díptico |
| 3 | Trabajo 02 (la foto derecha del díptico de esa página; la izquierda lleva el numeral de la página) | tríptico |
| 4–6 | Trabajo 03 (detalle), 04, 05 | la retícula |

Variantes AVIF q50 + WebP q78, 1x ≤ 640 px de alto, 2x el doble (`scripts/media.mjs cutout`); la mayor ≤ 59 KB. Geometría generada y commiteada en `src/data/santi-photos.ts` (claves, alts, tamaños y el `anchorRect` de la apertura en los dos frames del reel: desktop `{.2895, .0498, .4103, .9502}`); `--check` falla si difiere. Contratos `santi.photo.1–6` en estado `derived` con `surface: "paper"` (una foto que falla deja una caja papel del mismo tamaño con su alt, sin mover nada).

## 3. Secuencia implementada (N00–N05)

Unidades: SCREEN 0 · ISOLATE 1 · N02 2 (= `s:WORLD`) · N03 3 · N04 4 · N05 5 · fin 5,4 → 432vh a 80vh por gesto (md 378vh; sm 324vh). Reduced motion: 4 unidades × 50vh.

| Estado | Label | Qué pasa (1440×900; sm entre paréntesis) |
|---|---|---|
| N00 · SCREEN | `s:SCREEN` | la apertura real en el rectángulo compartido; `santi.photo.1` alineada sobre su panel (invisible hasta el primer scroll, regla de Phase 4) |
| N01 · ISOLATE | `s:ISOLATE` | la página se oscurece a .75; la fotografía queda iluminada |
| N02 · RUPTURA + SINGLE | `s:WORLD` | la fotografía sale de la página y queda sola, centrada, al 78 % del alto (sm: ancho completo dentro del 62 % del alto); el negro se vuelve papel con la ease `reveal` (la ruptura); la página se va; el tono pasa a tinta (`data-paper`); aparece el crédito debajo de la imagen |
| N03 · DÍPTICO | `s:N03` | la foto 1 va a la mitad izquierda del campo editorial (1200×702, x 120, y 99) y se recorta a su media hoja; la foto 2 entra en la mitad derecha revelada por `clip-path` desde la izquierda (sm: apiladas, revelada desde arriba) |
| N04 · TRÍPTICO | `s:N04` | tres columnas iguales; la foto 3 entra desde la derecha; debajo, `Forma`, `Línea`, `Textura` (22 px) con `01`, `02`, `03` (mono), máscara hacia arriba con 80 ms de escalón (sm: tres filas, labels a la derecha de cada una) |
| N05 · SISTEMA | `s:N05` | FLIP: las tres figuras entran en sus celdas de la retícula 3×2 (sm 2×3) con escala uniforme + x/y; las fotos 4–6 se revelan por `clip-path` con 120 ms de escalón; los números 01–06 aparecen en cada celda; los labels del tríptico se van |
| hold | — | 0,4 unidades antes de soltar el pin |
| prueba | flujo | fondo papel (continuidad con N05), ventana con borde tinta al 20 %, «Sitio real, en línea.», micro case, crédito, rol «Diseño y desarrollo», «Siguiente → Chef Arturo» |

**Reduced motion (§16):** cuatro composiciones estáticas conmutadas en su label (single desde el corte de la card, díptico, tríptico con labels, sistema); el papel se fija en N02 sin fundido; el crédito desde la primera.

**Tiers (§15):** desktop/lg/md comparten el espacio 1440×900 escalado; sm usa su espacio 390×844 con la recomposición vertical de §10. Todo 2D, sin `perspective`.

## 4. Arquitectura

- **`src/lib/santi-world.ts`** (puro): labels y unidades; `field` (el campo editorial), `single`, `diptych`, `triptych`, `system` por variante; **`fit(nat, target, focus)`**: una escala uniforme de cobertura, un recorte centrado en la figura (en píxeles propios: `clip-path` se aplica antes de la transform) y la traslación que lleva la ventana recortada al rectángulo destino; `FOCUS` (y .3: los retratos se recortan desde el tercio superior, no desde el medio); `insetOf`; `isUniform`; `splitViews`.
- **`SantiWorld.tsx`** (cliente): el `WorldScene` de Phase 4 con la extensión `scene` (un timeline, un pin, un snap) y la opción nueva **`envEase`** (el plano papel llega con `reveal`). Las seis `figure[data-photo]` (con `Cutout`, `<img>` plano, no `next/image`) se maquetan a su mayor tamaño de la secuencia (el alto de la imagen sola, su propio aspecto) y todas las apariciones posteriores son ese mismo cuadro, escalado hacia abajo y recortado. Crédito, labels y numeración son texto real posicionado en el espacio. El objeto que escapa se cambia por la figura 1 en el mismo frame y el mismo rectángulo en que llega.
- **`WorldScene.tsx`**: `envEase` en la extensión. **`Journey.tsx`**: `santiView` (copy §08, crédito, fotografías). **CSS**: capa Santi, tono por `data-paper` (papel sobre negro → tinta sobre papel), labels, el crédito en flujo se oculta mientras la escena corre (sin JS sigue ahí).
- **Contratos (`assets.ts`):** `santi.photo.1–6` derived desde `src/data/santi-photos.ts`; `santi.reel.poster.anchorRect` medido.

## 5. Pruebas

| Suite | Resultado |
|---|---|
| `npx tsc --noEmit` · `npm run lint` · `npm run build` | limpios |
| `npx vitest run` | 8 archivos · **143 tests** ✅ (nuevo `tests/santi-world.test.ts`, 17: `--check` de la derivación, seis fotografías con sus páginas y presupuestos, ancla dentro de los frames, atribución (alts, crédito, rol, micro case, objeto), copy, composiciones sin solapes dentro del campo por variante, single, `fit` (ventana visible exacta, sin recorte en el aspecto propio), `insetOf`, `isUniform`, unidades y topes) |
| `npx playwright test` | 6 proyectos · **326 passed, 0 failed, 172 skipped** (skips por diseño) |

**`tests/e2e/santi.spec.ts`** (nuevo, 8 tests): N00–N05 a 1440×900 con captura por estado (78 % y centro de la imagen sola, mitades iguales a la misma altura, tres columnas iguales con sus labels y páginas en tinta, retícula de 2 filas × 3 columnas con 01–06, prueba sobre papel con crédito y rol) · `assertUniform` en cada estado y entre estados · reversa hasta ISOLATE con el tono de vuelta · continuidad Rayo → Santi → Chef (la prueba de Rayo baja a .55, el SCREEN de Santi es negro, N02 lo vuelve papel, la prueba de Santi baja a .55 hacia el SCREEN de Chef; sólo la prueba de TS tiene costura) · tiers (sin `matrix3d`; sm apila) · RM como cortes · accesibilidad (alts, dos créditos exactos, axe en N05) · sin JS. `world.spec.ts`: su test de entrada acepta los estados propios de Santi tras `s:WORLD`; sin JS, el crédito se localiza por su clase.

## 6. Problemas corregidos

1. **Un tween de `clip-path` aterrizaba en el borde equivocado**: cuando un recorte tiene lados iguales (`inset(0 187 0 187)`), el navegador lo serializa como shorthand (`inset(0px 187px)`) y GSAP, al leerlo, tomaba el lado faltante como 0: la foto del díptico quedaba desplazada. `insetOf` mantiene el lado izquierdo 0,013 px aparte del derecho (invisible) y el valor computado conserva los cuatro lados. Test unitario.
2. **El tono y el crédito no estaban al descansar exacto en el label** (un snap cae en píxeles enteros): el tono se conmuta 0,02 unidades antes de N02 y el crédito llega con el papel en el último tramo de EXPAND.
3. **La tercera etiqueta del tríptico terminaba 0,01 unidades después de N04**: los escalones empiezan antes.
4. **Recortes**: los retratos en celdas apaisadas perdían la cara (recorte centrado): `FOCUS` en el tercio superior.
5. **La foto del Trabajo 02** cortada del lado izquierdo de su página traía el numeral "02" de la página: se toma la foto derecha del mismo díptico.
6. Tests: la caja visible de una figura se calcula con la escala del espacio además de la de la figura (en lg/md el espacio está escalado); las columnas se cuentan por agrupamiento, no por redondeo; sin JS hay dos nodos de crédito (escena y flujo).

## 7. Decisiones

- **La ruptura (negro → papel).** Revelado 2.2 la quiere "de golpe"; el Spec §10 la define como `env.opacity` 0 → 1 con la ease `reveal` dentro de N02. Se implementó lo del Spec sobre la gramática compartida: el plano papel llega en el tramo EXPAND (0,55 unidades) con `reveal` (lento-rápido-lento: en el medio es casi un corte, pero sigue al scroll y nunca salta). Si Franco prefiere el corte seco de Revelado, es un cambio de ease a `steps(1)` en ese tween. **A confirmar.**
- **Numeración.** La fotografía que escapa es la de la apertura (el póster del reel es la apertura del sitio, §10 N00), así que la secuencia es apertura + trabajos 01–05 y los números `01 · 02 · 03` / `01–06` son los de la secuencia, en el estilo de paginación del sitio ("01 / 12"). Los alts llevan la página real de cada foto. Cuando lleguen los originales, Franco decide si el sistema muestra los seis trabajos (y la apertura sólo escapa) o se mantiene esta secuencia.
- **Campo editorial 1200×702** (x 120, y 99): díptico en mitades, tríptico en tercios con 56 px para los labels, retícula 3×2 con 16 px de calle. Celdas apaisadas para retratos: recorte de cobertura con foco alto. **Candidato de ajuste** si la dirección prefiere celdas verticales (3×2 no entra en 900 de alto con proporción vertical).
- Las fotografías se maquetan al alto de la imagen sola y se *reducen* en todos los estados siguientes, salvo la mitad del díptico, donde la foto de la apertura (vertical) cubre una mitad más ancha que ella y sube 1,26× (los 2x son 1258 px de alto: sigue siendo reducción respecto del archivo).
- **md** conserva el espacio 1440×900 escalado (§15), como en Rayo.

## 8. Assets pendientes

| Clave | Falta | Efecto hoy |
|---|---|---|
| `santi.photo.1–6` | los originales en alta de Santi Nuca, con su permiso (§29 Q3) | recortes de las capturas del sitio (≤ 1290 px de alto); la foto 2 es apaisada tal como la muestra su página |
| `santi.proof` | grabación del scroll real (apertura → trabajos → forma/línea/textura), 6–10 s, sin loop | placeholder sobre el póster real |
| `liveUrl` | `[CONFIRMAR]` (candidata de ENSAMBLE registrada) | sin "Abrir ↗" |
| «Sitio real, en línea.» | `[CONFIRMAR]` que siga publicado | se publica (FACT de Phase 1) |
| tipografía, año | `[CONFIRMAR]` | no se nombran |

## 9. QA visual (`qa/phase7/`, ignorado por git)

- `sheet-{xl-1440,lg-1366,md-820,sm-390,rm-1440,rm-sm-390}.png`: SCREEN → N05 por tier, con el `data-state` de cada captura, más los PNG individuales.
- `santi-{desktop-1440,laptop-1366,tablet-820,mobile-390,reduced-motion-1440}.webm`: la prueba de Rayo, la llegada al SCREEN de Santi, el mundo entero, la prueba de Santi y la llegada al SCREEN de Chef. Consola limpia en todas.

## 10. Próximo paso

**Phase 8 · Chef Arturo world** (MIS §11, §26 fila 8). No se empieza sin aprobación.
