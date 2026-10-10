# 14 · Phase 8 — Chef Arturo World

Fecha: 2026-10-10 · Base: `main` @ `55cf76f` · Spec: *REVELADO — Master Implementation Spec* rev 37 (MIS), §26 fila "8 · Chef world" (capítulo §11; además §07 gramática, §15 tiers, §16 RM, §17 media, §19 accesibilidad, §22 contratos, §29 Q4). Copy: Content Master rev 26 §09, literal. Dirección: REVELADO 2.2 §11.4.

## 1. Resultado

El mundo de Chef Arturo continúa el mismo timeline de Phase 4 desde `s:WORLD`:

**Interfaz ecommerce (la página de producto real) → la fotografía escapa y llena la pantalla: macro → la cámara retrocede al producto entero sobre la crema de la tienda → la composición del catálogo (Merienda) → la vista de producto con sus datos reales → la compra → «Primero el deseo. Después, la compra.» → la prueba (tienda real, en línea) → Capacidades.**

DOM + GSAP + `clip-path`, 2D. Sin dependencias nuevas. Una regla de continuidad (§11): **la comida y la foto de producto son el mismo nodo del DOM de C02 a C06**; se mueve sólo con escala uniforme y recorte (el `fit` de Phase 7). La UI de comercio es una representación, no una tienda: `<span>`s con el estilo de los controles reales dentro de un `role="img"` con su etiqueta completa; nada enfocable; la tienda real sólo por «Abrir ↗».

**Veracidad (Content Master 09):** rol «Producto, diseño y desarrollo»; prueba «Tienda real, en línea.» (no «con pagos en producción»: Mercado Pago live sin confirmar, `paymentsLive` pendiente); marca y fotografía no se atribuyen a Franco; sin ventas, pedidos, clientes ni métricas. Todo el texto del mundo es copy real del producto; la única frase de Franco es el cierre.

| Criterio de aceptación (MIS §26) | Cómo se verificó | Estado |
|---|---|---|
| C00–C07 + RM | e2e `chef.spec.ts`: cada estado a 1440×900 con screenshot adjunto y la composición medida (§5); RM como cinco cortes | ✅ |
| El elemento de imagen es el mismo nodo del DOM de C02 a C06 | e2e: se marca el nodo en C02 y se comprueba el mismo nodo (y uno solo) en C06; además, su transform es escala uniforme en cada estado | ✅ |
| La UI de comercio no tiene controles falsos enfocables | e2e: dentro del `role="img"` y de toda la capa del mundo no hay `button`, `a`, `input`, `select`, `textarea` ni `tabindex`; el mundo entero no tiene elementos enfocables (los links son de la prueba) | ✅ |

## 2. Material

**Nada generado, nada inventado.** Hasta que exista la fotografía de producto y el macro en alta (§29 Q4), el mundo usa las fotografías **como las muestra la tienda real**: `scripts/derive-chef-photos.mjs` las corta de las capturas en los bordes de cada panel (textura de imagen por gradiente; columnas no-página), sin tocar un píxel.

| Clave | Origen real | Uso |
|---|---|---|
| `chef.product` | la foto de la Cookie levain de pistacho y chocolate blanco en su página de producto (606×757) | el objeto que escapa; el macro (a sangre, ampliado: provisional); la tarjeta; la vista de producto |
| `chef.catalog.1–3` | la fila «Merienda» del catálogo: Cookie Levain clásica con chips · red velvet con chocolate blanco · cacao al 100 % (595–640×572), con los nombres y el precio que imprime la tienda (todas $ 120) | los tres vecinos de la composición |
| `chef.macro.loop` | a producir | placeholder: el still es el suelo; con el loop, `LoopVideo` se reproduce en C02 |

Variantes AVIF q50 + WebP q78, 1x = mitad del master, 2x = master (≤ 74 KB). Geometría commiteada en `src/data/chef-photos.ts` (claves, nombres, precios, alts, tamaños, `anchorRect` del producto en los dos frames del reel, el crema de la tienda `#f7f3ea`); `--check` falla si difiere.

## 3. Secuencia implementada (C00–C07)

Unidades: SCREEN 0 · ISOLATE 1 · C02 2 (= `s:WORLD`) · C03 3 · C04 4 · C05 5 · C06 5,6 · C07 6,2 · fin 6,4 → 512vh a 80vh por gesto (md tope 450vh; sm 384vh). Reduced motion: 5 unidades × 50vh.

| Estado | Label | Qué pasa (1440×900; sm entre paréntesis) |
|---|---|---|
| C00 · SCREEN | `s:SCREEN` | la página de producto real en el rectángulo compartido; `chef.product` alineada sobre su foto (invisible hasta el primer scroll, regla de Phase 4) |
| C01 · ISOLATE | `s:ISOLATE` | la página se oscurece a .75; la fotografía queda iluminada |
| C02 · MACRO | `s:WORLD` | la foto sale de la página y llena el stage (cover, centrada; el `escapeRect` de Phase 4); la página se va. El loop macro reproduciría aquí (`LoopVideo` activo sólo en este estado; hoy placeholder) |
| C03 · RETROCEDE | `s:C03` | el still retrocede (escala uniforme + recorte, ease `none`, atado al scroll) hasta su lugar en la tarjeta del catálogo; la crema de la tienda llega con `settle` |
| C04 · COMPOSICIÓN | `s:C04` | `Merienda · cookies, brownies y boxes dulces` (máscara hacia arriba); los tres vecinos se revelan por `clip-path` con 80 ms de escalón; bajo cada tarjeta, nombre y precio reales (el producto es la segunda tarjeta, como en la tienda) (sm: retícula 2×2) |
| C05 · INFORMACIÓN | `s:C05` | la tarjeta crece a la vista de producto (el mismo nodo): foto a la izquierda, `Cookie levain de pistacho y chocolate blanco` · `$ 120` · `compra directa` a la derecha; los vecinos y el encabezado se van (sm: foto arriba, información abajo) |
| C06 · COMPRA | `s:C06` | `− 1 +`, `Agregar al carrito` (el verde de la tienda), `Mercado Pago`, `consultar por WhatsApp` entran con máscara, 60 ms de escalón |
| C07 · CIERRE | `s:C07` | `Primero el deseo. Después, la compra.` (34 px; sm 28) con máscara hacia arriba; la UI baja a .4 |
| prueba | flujo | «Tienda real, en línea.», micro case, rol, «Siguiente → Capacidades» |

**Reduced motion (§16):** cinco stills (macro → producto entero → catálogo → producto + compra → cierre). Sin video.

**Tiers (§15):** desktop/lg/md comparten el espacio 1440×900 escalado; el macro cubre el stage real (más ancho que el espacio en lg, más alto en md); sm usa su espacio 390×844.

## 4. Arquitectura

- **`src/lib/chef-world.ts`** (puro): labels y unidades; `field` (el campo crema), `macro(v, aspect, cover)`, `catalog` (cuatro tarjetas en fila; sm 2×2; el producto en la segunda), `product` (vista de producto por variante, con la línea de cierre siempre bajo la foto y los controles), los `split*` del copy; reexporta `fit`/`insetOf` de `santi-world`.
- **`ChefWorld.tsx`** (cliente): el `WorldScene` de Phase 4 con la extensión `scene`. La figura del producto se maqueta a su mayor tamaño (el macro) y sólo se reduce desde ahí; los vecinos viven en sus slots; el encabezado y la chrome de las tarjetas, la vista de producto (`role="img"`) y el cierre son texto real posicionado en el espacio. El objeto que escapa se cambia por la figura en el mismo frame y el mismo rectángulo en que llega. Los bloques de texto quedan `visibility: hidden` hasta su estado (no existen para AT sobre el stage negro).
- **`Journey.tsx`**: `chefView` (copy §09, fotografías con nombres y precios, loop, `aria-label` de la representación). **CSS**: capa Chef, crema, tipografía en tinta, controles como spans (el verde `#1f4a3c` de la tienda con papel: contraste alto).
- **Contratos (`assets.ts`):** `chef.product` y `chef.catalog.1–3` derived desde `src/data/chef-photos.ts`; `chef.reel.poster` pasa a la **página de producto** (ver §7) con su `anchorRect` medido; `chef.macro.loop` sigue placeholder (poster: el producto).

## 5. Pruebas

| Suite | Resultado |
|---|---|
| `npx tsc --noEmit` · `npm run lint` · `npm run build` | limpios |
| `npx vitest run` | **153 / 153** en 9 archivos (nuevo `tests/chef-world.test.ts`, 10: `--check` de la derivación, cuatro fotografías con nombres y precios de la tienda y presupuestos, ancla y póster, los hechos (rol, prueba sin pagos, sin crédito de marca/foto, el objeto es la cookie, loop placeholder), el copy, composiciones por variante (macro cubre el stage, tarjetas con el aspecto de la foto sin solapes, la línea de cierre bajo foto y controles), `fit` siempre reduce, unidades y topes) |
| `npx playwright test` | **349 passed · 1 failed · 196 skipped** en la corrida completa; el fallo es `travelsuite.spec.ts` «every state in order» en TS09b, un flake **previo a Phase 8** (ver §7.9); `chef.spec.ts` + `world.spec.ts` solos: 83 passed, 31 skipped (skips por diseño) |

**`tests/e2e/chef.spec.ts`** (nuevo, 8 tests): C00–C07 a 1440×900 con captura por estado (macro a sangre, producto entero al tamaño de tarjeta sobre crema, la fila con el producto en la segunda tarjeta y los nombres reales, la vista con la información a la derecha y los controles aún enmascarados, los cuatro controles con su texto, el mismo nodo marcado en C02 y hallado en C06, el cierre bajo la foto con la UI a .4, la prueba sin "pagos en producción" y con «Siguiente → Capacidades») · la representación (un `role="img"`, su etiqueta, cero enfocables) · reversa hasta ISOLATE · continuidad Santi → Chef → Capacidades (la prueba de Santi baja a .55, el SCREEN de Chef es negro, la crema llega en C03, la prueba de Chef lleva a Capacidades) · tiers (sin `matrix3d`; sm: macro a sangre, 2×2, información debajo) · RM como cortes · accesibilidad (alts reales, el cierre una vez, axe en C06 con toda la UI y en C07 sobre el cierre) · sin JS. `world.spec.ts`: el deep link de Chef usa las fracciones de su pin (6,4 unidades; 5 en RM).

## 6. Rendimiento (medición real)

Método de Phase 5/6: Chromium headless sobre la GPU real (i5-12400F · RTX 5060 · 180 Hz), build de producción, rueda real a 36 px/16 ms, frames contados con `requestAnimationFrame` sólo mientras la figura cambia; CPU frenada 1×/4×/6×; 2 corridas por configuración.

Dos tramos: **C02→C03** (el macro a sangre retrocede: escala uniforme + recorte de una foto que cubre el stage) y **C04→C06** (la composición, el FLIP a la vista de producto, máscaras y controles).

| Config | CPU | C02→C03 | C04→C06 |
|---|---|---|---|
| xl 1440×900 | 1× | 178,7 · 180 fps (p95 5,7 ms; 0 frames > 18,2 ms) | 177,7 · 180 fps (p95 5,7 ms; 0) |
| xl 1440×900 | 4× | 180 · 180 fps (p95 5,7 ms; 0) | 180 · 178 fps (p95 5,7 ms; 0) |
| xl 1440×900 | 6× | 168,1 · 177,2 fps (p95 11,1 / 5,7 ms; 0) | 157,1 · 161,4 fps (p95 11,1 ms; 0) |
| lg 1366×768 | 4× | 179,9 · 179,9 fps (0) | 166,2 · 176,1 fps (p95 ≤ 11,1 ms; 0) |
| md 820×1180 | 4× | 180 · 180 fps (0) | 180 · 175,8 fps (0) |
| sm 390×844 | 4× | 180 · 180 fps (0) | 159,7 · 179,3 fps (p95 ≤ 11,1 ms; 2/229 y 0/268 frames > 18,2 ms) |

**Peor caso: 157 fps (xl, CPU ×6, C04→C06), sin frames lentos**; el único tramo con frames > 18,2 ms fue sm ×4 en una de dos corridas (2 de 229). El objetivo de ≥ 55 fps (§29) se cumple con margen en este equipo. Script: `scratchpad/cfps.cjs` (no se commitea).

Las mismas limitaciones que antes: no es el MacBook Air 2020 de referencia; frenar la CPU no emula una GPU débil.

## 7. Problemas corregidos y decisiones

1. **La página de producto, no el hero, como póster de Chef.** El Spec §11 asume que el hero muestra "el producto"; el hero real muestra una torta en un arco, mientras que el Content Master fija los datos reales del producto en la Cookie levain ($ 120, compra directa). Para que la foto que escapa, la tarjeta y la vista de producto sean **el mismo producto que dice el copy** (la regla de un solo elemento de §11), el póster del reel y del SCREEN pasa a `chef-arturo-pdp-cookie-levain.png`: la interfaz de comercio de la que escapa la foto es su página de producto. Cambia el póster de Phase 3 para este proyecto; el diff reel ↔ SCREEN sigue ≤ 1 % (`world.spec`). **A confirmar por Franco** (la alternativa, la torta del hero con los datos de la cookie, sería falsa).
2. **Detección de paneles**: las fotos de la tienda tienen fondos claros; medir "píxeles que no son página" daba tiras. Se mide la textura (gradiente) por filas y, para las tarjetas, la altura de foto del producto se aplica a sus vecinas.
3. **El macro no cubría el stage en lg/md**: cubría el espacio 1440×900 escalado (bandas a los lados). `macro()` recibe el stage en unidades de diseño.
4. **axe sobre el stage negro**: los textos enmascarados de comercio medían contraste contra el negro antes de su estado. Quedan `visibility: hidden` hasta su estado; en C07 la UI baja a .4 por Spec y es una sola imagen para AT: axe corre con toda la UI en C06 y sobre el cierre en C07.
5. **sm**: la línea de cierre cruzaba el bloque de compra; la foto baja a ≤ 300 px y las cajas no se solapan (test unitario).
6. **Crema y tono**: `theme.env` de Chef es `image` (el plano `env` del shell es transparente): la crema de la tienda es un plano propio del mundo que llega en C03 con `settle`, como pide §11 (C02 es la foto; C03 ya es la tienda).
7. **md** conserva el espacio escalado (§15), como en los otros mundos.
8. **Flake previo en la suite (no de Phase 8).** En la corrida completa falló una vez `travelsuite.spec.ts` «every state in order» (esperaba `TS09b`, obtuvo `TS09a`). Reproducido en el árbol commiteado de Phase 7 (`55cf76f`, worktree aparte, mismo build): al menos 3 de 12 corridas, 1 de 6 sobre Phase 8; Phase 8 no toca el mundo TravelSuite. Mecanismo probable: el test salta con `scrollTo` instantáneo desde TS09a mientras el tween del snap anterior todavía corre y lo devuelve al stop de TS09a (una rueda real mata ese tween; un `scrollTo` programático no). Es una carrera del test, no un defecto del sitio; queda anotado para endurecer `to()` (esperar a que el scroll se asiente) fuera de esta fase, como el flake de O3 de Phase 4.
9. `macroFocus` (centro del recorte macro) queda en el contrato; el shell centra el cover (la foto es cenital y uniforme): se usará con la foto final si hace falta.

## 8. Assets pendientes

| Clave | Falta | Efecto hoy |
|---|---|---|
| `chef.product` | fotografía original de producto en alta (§29 Q4) | recorte de la captura (606×757): el macro a sangre se ve ampliado |
| `chef.macro.loop` | loop macro 4–6 s (16:9 y 9:16), seamless, que termine en la foto de producto | still; `LoopVideo` ya cableado para C02 |
| `chef.catalog.1–3` | originales | recortes del catálogo (≈ 600×572) |
| `chef.proof` | grabación catálogo → producto → carrito, 6–10 s, sin datos de clientes | placeholder sobre el póster real |
| `paymentsLive` | `[CONFIRMAR]` Mercado Pago live | «Tienda real, en línea.» |
| `liveUrl`, año, stack, marca/fotografía | `[CONFIRMAR]` | sin "Abrir ↗"; no se nombran; sin crédito |

## 9. QA visual (`qa/phase8/`, ignorado por git)

- `sheet-{xl-1440,lg-1366,md-820,sm-390,rm-1440,rm-sm-390}.png`: SCREEN → C07 por tier, con el `data-state` de cada captura, más los PNG individuales.
- `chef-{desktop-1440,laptop-1366,tablet-820,mobile-390,reduced-motion-1440}.webm`: la prueba de Santi, la llegada al SCREEN de Chef, el mundo entero, la prueba y la llegada a Capacidades. Consola limpia en todas.

## 10. Próximo paso

**Phase 9 · Capabilities + Profile** (MIS §12, §26 fila 9). No se empieza sin aprobación.
