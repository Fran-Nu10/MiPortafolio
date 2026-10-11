# 15 · Phase 9 — Capabilities + Profile

Fecha: 2026-10-11 · Base: `main` @ `a6393ae` · Spec: *REVELADO — Master Implementation Spec* rev 37 (MIS), §26 fila "9 · Capabilities + Profile" (capítulo §12; además §15 tiers, §16 RM, §19 accesibilidad, §29 Q12). Copy: Content Master rev 26 §11 (capacidades), §13 (perfil), §14 (la línea del busto), literal. Dirección: REVELADO 2.2 §12.

## 1. Resultado

**Capacidades (S12).** Tras la prueba de Chef, la costura del busto («Todo lo anterior pasó por las mismas manos.») abre la sección; en lg/xl la sección se pinnea y **el scroll vertical mueve el riel en horizontal** (scrub 0,8, sin snap, 1:1 en píxeles una vez que el riel entró): seis tarjetas de igual ancho con el nombre, la frase y un **elemento vivo real** de un proyecto, la sexta separada por un espacio triple y el sub-kicker «Después de publicar», sin color propio. Tablets, teléfonos, reduced motion y sin JavaScript: la misma lista apilada en flujo, sin pin.

**Perfil (S13).** El texto exacto del Content Master §13 (núcleo + extensión), la etiqueta «Perfil» como único título, sin foto; un solo revelado al entrar (cada bloque entero con `clip-path` + 16 px, 700 ms, `settle`, 120 ms de escalón). Stack y rutas de contacto siguen `[CONFIRMAR]` → no se renderizan.

| Criterio de aceptación (MIS §26) | Cómo se verificó | Estado |
|---|---|---|
| El foco en una tarjeta fuera de pantalla la trae a la vista | e2e: con el riel en x = 0, la tarjeta 05 está a la derecha fuera del viewport; `focus()` en su link → la tarjeta termina centrada (±24 px) y entera dentro del viewport; el foco sigue en el link; Tab continúa en orden | ✅ |
| La capacidad 06 renderiza la variante tipográfica | e2e: `data-evidence="typographic"`, statement a tamaño lead, etiqueta mono «Meta Ads», sin `img`/`video`/placeholder, **sin un solo dígito**, sin términos vedados en toda la sección; unidad: el guard `resolveEvidence` | ✅ |
| El copy del perfil es exactamente el del Content Master 13 | unidad + e2e (texto completo del núcleo y la extensión; 59 palabras; sin «fundador/freelance/disponible/años»); sin JS igual | ✅ |
| Riel pinneado en lg/xl, apilado en md/sm | e2e por proyecto: lg/xl `data-rail`, pin de 2–3,5 viewports, estados `SEAM` → `RAIL`, x 1:1; md/sm sin pin, tarjetas en orden vertical | ✅ |
| Loops de evidencia | e2e: ningún loop corre lejos de la sección; el primero corre y avanza en vista; el último (fuera de vista) está quieto; al salir, todos paran; RM: estados finales fijos | ✅ |

## 2. Secuencia del riel (lg/xl)

El timeline corre en píxeles de scroll (duración = 1 viewport + overflow del riel):

| Tramo (px desde el inicio del pin) | Qué pasa |
|---|---|
| 0 → 0,12·vh | `s:SEAM` · el busto (`franco.bust`, placeholder) y la línea llegan (opacity 0→1, y 12→0, `settle`); el kicker y el riel esperan fuera (riel en x = vw − gutter) |
| 0,12·vh → 0,5·vh | la costura sostiene |
| 0,5·vh → 1·vh | el busto sale a la izquierda (x −50 vw, opacity 0) mientras **el riel entra** desde la derecha hasta x = 0 y el kicker aparece |
| 1·vh → 1·vh + overflow | `s:RAIL` · x de 0 a −(railWidth − 100vw + gutter): 1 px de scroll = 1 px de riel; la última tarjeta termina a un gutter del borde |

Geometría (`lib/capabilities-rail.ts`, pura): tarjetas `min(420px, 30vw)`, gap 32, gap triple antes de 06; a 1440×900 el riel mide 2 760 px, overflow 1 336 px, **pin 2 236 px ≈ 2,5 gestos (259 vh)** — dentro del «≈ 300 vh» del Spec; a 1366×768 284 vh. Unidades para `useScene`: `railUnits` (pin / gesto del tier). Pin `sticky` (el mismo mecanismo de los mundos: CLS 0).

**Teclado.** `focusin` en el riel: si la tarjeta no está entera dentro del viewport, `cardScroll` calcula el scroll que la centra (`pinStart + vh + (left + cardW/2 − vw/2)`, acotado al tramo 1:1) y hace `window.scrollTo` (smooth; instantáneo bajo RM). El orden de Tab es el de la lista: 01 → 03 → 05 (los links de atribución; 02, 04 y 06 no tienen link) → Perfil → formulario.

## 3. Los elementos vivos (Spec §12, tabla)

Cada tarjeta demuestra con material real de un mundo; copy literal del Content Master, nada inventado:

| # | Elemento | De dónde sale | Ciclo |
|---|---|---|---|
| 01 Producto | mensaje → los tres campos (destino · fechas · pasajeros) → `reserva confirmada` | TS01/TS03/TS07 del mundo TravelSuite360 | 3 estados, 1,6 s |
| 02 Ingeniería web | tres pósters reales apilados (Santi · Rayo · Chef); el del frente cambia, sólo opacidad | `*.reel.poster` (derivados de capturas reales) | 3, 2 s |
| 03 Comercio digital | `− 1 +` → `Agregar al carrito` → `Mercado Pago`, el control actual encendido | C06 del mundo Chef | 3, 1,6 s |
| 04 IA + automatización | la frase con Punta Cana · julio · cuatro subrayándose por turno y resolviéndose a destino · fechas · pasajeros | TS01 + TS03 | 4, 1,4 s |
| 05 Experiencias interactivas | las capas reales de la Clásica (las seis de Phase 6) a tamaño chico; **en el riel la separación la mueve el propio scroll** (`--sep` 0→1 mientras la tarjeta cruza la mitad derecha del viewport); en md/sm, un loop de tiempo | `rayo.layers.*` | 2, 1,8 s |
| 06 Adquisición de clientes | **nada**: statement a tamaño lead y la etiqueta mono «Meta Ads» | — | — |

**Ciclo de vida.** Un solo `IntersectionObserver` para las seis tarjetas (≥ 50 % visible); en el riel además el pin activo. Fuera de vista nada corre (intervalos limpiados). Sin video en el riel. **Reduced motion:** cada elemento muestra su estado final como still (reserva confirmada · póster del frente · Mercado Pago · las tres palabras resueltas · capas separadas). Todos son `aria-hidden` y no contienen nada enfocable.

**EvidenceSlot (06 y futuro).** `resolveEvidence` en el servidor: `typographic` pasa; `verified-material`/`campaign` sólo con todos sus archivos reales y, en `campaign`, sólo métricas `authorized` con `source`; en producción lo no probado cae a `typographic`. Nunca un `Placeholder`. La unidad de Phase 1 (dígitos sin autorización → falla) sigue vigente.

## 4. Arquitectura

- **`src/lib/capabilities-rail.ts`** (puro): `railLayout`, `railPinPx`, `railUnits`, `railX`, `cardScroll`, `separationWindow`, `EVIDENCE_CYCLE`/`finalStep`/`nextStep`, `resolveEvidence`.
- **`CapabilitiesRail.tsx`** (cliente): el markup de Phase 1 (figure de costura, kicker, `ol` de seis `li > article`) dentro de un `stage` con `useScene` (`pin: "sticky"`, `snap: false`, `scrub: 0.8`, `units` medidas en el build). El build devuelve `null` fuera de lg/xl, bajo RM o en viewports diminutos: la lista queda en flujo. Observer de visibilidad, handler de foco, `running` por tarjeta.
- **`EvidenceElement.tsx`** (cliente): los cinco elementos; `data-step` + CSS (cross-fades ≤ 200 ms); `splitByWords` corta la frase sin perder un carácter.
- **`EvidenceSlot.tsx`**: variantes material/tipográfica, sin placeholders.
- **`ProfileReveal.tsx`** (cliente, dentro de `Profile`): `ScrollTrigger` `top 75%`, `once`; `data-reveal` pending/shown; nada bajo RM; el texto nunca sale del árbol (clip-path).
- **`Journey.tsx`**: `capabilityCard` + `evidenceData` resuelven copy y assets en el servidor (los clientes no importan `data/`).
- **CSS**: el riel se maqueta desde el primer paint sólo bajo `(min-width: 1024px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)` + `html.js` + `[data-anim]` (un build fallido quita `data-anim` y la lista se apila); los elementos vivos; la tarjeta 06 sin acento.

## 5. Pruebas

| Suite | Resultado |
|---|---|
| `npx tsc --noEmit` · `npm run lint` · `npm run build` | limpios |
| `npx vitest run` | **165 / 165** en 10 archivos (nuevo `tests/capabilities.test.ts`, 12: geometría del riel, mapa scroll↔x, centrado por foco acotado, ventana de separación, cadencia y estados finales, corte de la frase, 06 tipográfica sin dígitos, guard de EvidenceSlot, copy del perfil) |
| `npx playwright test` | **402 passed · 2 failed · 208 skipped** en la corrida completa (en paralelo con la QA visual): (a) `capabilities.spec` xl, el gap triple medido 96,6 px con el scrub aún asentándose → tolerancia ±2 px; (b) `rayo.spec` sm-390 «tiers» (R05 en vez de R07), **flake por carga**: 8/8 al correr solo; queda para el inventario de flakes de Phase 11. `capabilities.spec.ts` solo: 54 passed, 12 skipped (6 proyectos) |

**`tests/e2e/capabilities.spec.ts`** (nuevo, 10 tests × 6 proyectos): el riel en lg/xl (pin, costura, entrada, 1:1, final con 06 a un gutter del borde y el gap triple), la lista apilada en md/sm, el foco que centra la tarjeta, 06 tipográfica, los cinco elementos con el copy de los mundos y el ciclo de vida (fuera/dentro de vista, RM como stills), la separación de 05 atada al scroll, el perfil (copy, sin foto, sin pendientes, revelado al 75 % / ninguno bajo RM), axe en riel + perfil, los links de atribución entran a su mundo con `pushState`, sin JS en orden.

## 6. Rendimiento

El riel es una sola transform (`x`) sobre un contenedor con `will-change` mientras existe el riel; los elementos vivos cambian `opacity`/`color`/`transform` por CSS con intervalos de 1,4–2 s. No se midió fps en esta fase (sin scrub de capas pesadas ni video); la medición consolidada queda para Phase 11/12.

## 7. Problemas corregidos y decisiones

1. **Reduced motion → lista apilada, no riel** (MIS §29 Q12; §16 lo prevé como alternativa). `useScene` bajo RM escalona el timeline entre labels (`stepToStop`), lo que convertiría el riel en saltos; la lista en flujo es íntegra, legible y no esconde nada. Documentado como decisión por defecto; revertible.
2. **La entrada del riel no se veía**: un `set` en t = 0 y un `fromTo` colocado después de 0 no renderizan su estado inicial hasta que el playhead los alcanza → `immediateRender: true` en los `fromTo` del kicker y del riel.
3. **Contraste (axe)**: los controles «apagados» del strip de Chef a opacidad 0,4 daban 2,7:1. Ahora el estado idle es muted y contorneado (5,8:1 sobre negro) y el actual es papel; sin translucidez sobre texto.
4. **Gutter**: `x` final = −(railWidth − 100vw + gutter) con `railWidth` incluyendo el gutter izquierdo del `ol` → la última tarjeta termina a un gutter del borde (test).
5. **Capas de Rayo: seis, no cinco.** El Spec habla de «the five Rayo layer cutouts»; las capas reales derivadas en Phase 6 son seis (doble smash). Se usan las seis reales.
6. **`innerText` en mayúsculas**: el test sin JS lee `textContent` (las etiquetas mono van en uppercase por CSS).
7. Sub-kicker «Después de publicar»: en el riel va sobre la tarjeta 06 (dentro del espacio triple); apilado, encima de la tarjeta.

## 8. Assets pendientes

| Clave | Falta | Efecto hoy |
|---|---|---|
| `franco.bust` | busto iluminado (≥ 1600 px de alto), cutout | placeholder honesto en la costura (lg/xl: 26 vw × 4:5, abajo a la izquierda) |
| Capacidad 06 | una campaña real: creativos, captura autorizada, `source` | tipográfica (por diseño) |
| Perfil | email y LinkedIn `[CONFIRMAR]`; stack `[CONFIRMAR]` | líneas omitidas |

## 9. QA visual (`qa/phase9/`, ignorado por git)

- `sheet-{xl-1440,lg-1366,md-820,sm-390,rm-1440}.png`: costura → riel → final (lg/xl), la lista por viewports (md/sm/RM) y el perfil; con el `data-state` y el paso de cada elemento vivo.
- `capabilities-{desktop-1440,laptop-1366,tablet-820,mobile-390,reduced-motion-1440}.webm`: de la prueba de Chef al perfil, por rueda. Consola limpia en todas.

## 10. Próximo paso

**Phase 10 · Franco at Work + Contact + End** (MIS §13, §14, §02 S16).
