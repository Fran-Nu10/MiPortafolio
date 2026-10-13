# 22 · Declaración comercial — MOSTRAR → CONVENCER → CONVERTIR

Fecha: 2026-10-13 · Pedido por Franco («REVELADO 2.2 — Nueva secuencia cinematográfica comercial») · Copy: Content Master §20 (addendum de esta fecha) · Commits locales `c8de26f`, `5b7feb6`, `eab65ed`, `f6c80e2` (sin push ni deploy).

## 1. Qué es

Una secuencia tipográfica pinneada que convierte el recorrido de «esto es lo que construí» en «esto es lo que puedo construir para vos». No es una sección de servicios: es una sola coreografía continua sobre negro, con tres movimientos (descubrimiento → organización → resolución) y un mismo sistema visual. Cada palabra protagonista termina en un índice corrido arriba a la izquierda, así que al final las tres ideas quedan en pantalla como una sola declaración, y la frase final es el pico tipográfico de la secuencia.

Es independiente de TravelSuite360. No usa nada de su copy, sus datos, su narrativa ni sus módulos (`ts-world`, `ts-reveal`), y un test lo verifica. Del mundo de TS se tomó sólo el lenguaje de movimiento («palabras dispersas que se reorganizan»), reimplementado desde cero.

## 2. Ubicación en el Journey

**Después de Capacidades y antes de Perfil**: `… Chef Arturo → Capacidades → **Propuesta** → Perfil → «Ahora, el tuyo.»`. Es un id de sección nuevo, `propuesta`, y la URL pasa a `/#propuesta` mientras está en vista (con `replaceState`, nunca una entrada nueva de historial).

La preferencia inicial era ubicarla antes de Capacidades. La moví por tres costuras ya diseñadas:

1. **La salida de Chef está diseñada para caer sobre el riel ya dibujado.** REVELADO 2.2 §11.4 dice: «la crema se enfría a papel, el papel a negro; el riel de capacidades ya está dibujado». Una sección en medio rompe ese cierre.
2. **La frase del busto se refiere a los proyectos.** Capacidades abre con «Todo lo anterior pasó por las mismas manos.» (Content Master §14). Si la declaración va antes, «todo lo anterior» incluiría una declaración comercial y el busto aparecería después de «Que te elijan.».
3. **«Siguiente → Capacidades» de la prueba de Chef** saltaría la sección.

Capacidades sigue siendo «lo construido»: cada capacidad muestra evidencia de los cuatro mundos. El puente que se pidió ocurre igual, a la salida del riel. Además, la sexta capacidad, «Adquisición de clientes», desemboca en CONVERTIR, el cierre en primera persona («Diseño y desarrollo…») entrega a Perfil, que es la única otra voz en primera persona del sitio, y Perfil entrega a «Ahora, el tuyo.».

**Cómo moverla, si lo decidís:** el componente no depende de su posición. Hay que pasar `<Declaration>` antes de `<CapabilitiesRail>` en `src/components/journey/Journey.tsx` y actualizar el orden esperado en `tests/e2e/declaration.spec.ts`. Las tres costuras de arriba quedarían como riesgos aceptados.

No cambió nada más del orden. Los cuatro mundos, el reel, los deep links, la historia y las transiciones existentes siguen igual; la suite completa lo confirma.

## 3. Estados y transiciones

Un stage `sticky` con scrub 0.6 y snap a etiquetas. Cada transición equivale a un gesto (0,8–1 unidad). Pin de 6,9 unidades: 552vh en lg/xl, 450vh en md (el tope de §15) y 414vh en sm.

| Estado | Unidad | Qué se ve | Cómo se llega |
|---|---|---|---|
| `CAMPO` | 0 | diez palabras latentes, chicas, casi imperceptibles (opacidad .12–.42), en profundidad (lg/xl) | es el primer paint: el stage entra así, sin salto |
| `DESCUBRE` | 0,8 | la constelación en contraste (≥ .6), adelante (z 0), un 30 % más cerca del centro | las palabras avanzan desde la profundidad, escalonadas |
| `MOSTRAR` | 1,8 | **MOSTRAR.** monumental y «Tenés algo que vale la pena mostrar.» | se dibuja una línea roja; las palabras convergen y se absorben en ella (escala .35 → 0); la línea se abre como apertura, en `clip-path` desde el centro, con sus dos bordes rojos separándose, y aparece la línea de apoyo |
| `ORDEN` | 2,8 | la grilla de seis palabras numeradas 01–06 (3×2; 2×3 en teléfono) | MOSTRAR. se reduce al índice; las seis palabras llegan sueltas y escaladas y se acomodan en sus celdas mientras se dibujan las reglas |
| `CONVENCER` | 3,6 | **CONVENCER.** sobre la grilla, que retrocede a .5, y «Hagamos que tus clientes descubran por qué elegirte.» | la palabra sube desde su máscara |
| `ACCION` | 4,6 | un track con cuatro acciones (explorar · consultar · reservar · comprar) y un punto rojo en cada parada | CONVENCER. va al índice; la grilla colapsa (las reglas se recogen); el track se dibuja; las acciones entran y se encienden una por una |
| `CONVERTIR` | 5,5 | **CONVERTIR.** monumental, centrado sobre el track | los cuatro puntos convergen en uno; el punto se vuelve la línea roja; la línea se abre sobre CONVERTIR. (la misma apertura del acto I: el sistema se cierra) |
| `ELIJAN` | 6,4 → 6,9 | el índice completo (MOSTRAR. / CONVENCER. / CONVERTIR.), «Que no solo te vean.» en muted y **«Que te / elijan.»** a 20cqw (27cqw en teléfono), con el punto final en rojo, y la conclusión en cuerpo de texto | CONVERTIR. va al índice; la primera frase entra; la segunda sube desde su máscara; la conclusión entra al final. Medio gesto de reposo y el pin se suelta hacia Perfil |

Todo es reversible: cada propiedad de cada elemento la anima un solo tween a la vez, con valores `from` explícitos. El recorrido hacia atrás está probado estado por estado.

## 4. Composición y motion

- **Sistema:** negro `#0B0B0C`, papel y rojo de seguridad. El rojo es señal y aparece sólo en momentos decisivos: la línea de apertura (actos I y III), los puntos de las acciones y el punto de «elijan.». Una sola familia tipográfica, Schibsted Grotesk: 900 para las protagonistas y la frase final, 500 para las líneas, las celdas y las acciones, 400 para el campo. Plex Mono sólo para los números 01–06.
- **Espacio de diseño por variante, nunca un reflow:** 1440×900 en pantallas apaisadas, 820×1180 en tablets verticales y 390×844 en teléfonos (`decVariant` en `lib/declaration.ts`, con las mismas condiciones en CSS). El espacio conserva su proporción dentro del viewport y la tipografía está en unidades de contenedor (`cqw`), así que se ve nítida a cualquier tamaño, sin `scale` sobre el texto. Cada protagonista ocupa el ancho de la columna: CONVENCER. mide 6,86 em, medido sobre la fuente real.
- **Teléfono, con su propia coreografía:** su propio dibujo del campo (vertical), la grilla 2×3, el track como columna (los puntos bajan) y CONVERTIR. se abre en la última parada. Tablet: el dibujo vertical del campo a menor tamaño, con la grilla y el track apaisados.
- **Profundidad:** sólo en lg/xl (Spec §15), con perspectiva de 1400 px únicamente en el campo del acto I. El acto II es 2D a propósito: ordenar es aplanar.
- **Lo que no tiene:** partículas, neón, blur, rebotes, springs, flotación, parallax continuo o loops decorativos. Sólo transforms, opacity y `clip-path`. No hay reflow durante el scroll: todas las posiciones las define el CSS desde el primer paint y se miden una vez por build, antes de cualquier escritura.
- **El índice:** cada protagonista se transforma en su propia línea del índice (`translate` + `scale` hacia un slot medido); no se cambia por otro elemento. Por eso la transición entre actos es una sola coreografía y no un fundido entre pantallas.

## 5. Responsive, reduced motion y sin JS

| Modo | Comportamiento |
|---|---|
| lg/xl con motion | coreografía completa, profundidad en el campo |
| md con motion | dibujo vertical (tablets en vertical) o apaisado (md horizontal ≥ 560 px de alto), sin profundidad, pin de 450vh |
| sm con motion | coreografía propia, pin de 414vh |
| reduced motion | **página editorial estática:** los tres actos apilados (palabras, protagonista, línea), la frase final y la conclusión, todo legible y sin pin. Aplica la regla de Capacidades (Spec §16, §29 Q12): los tres actos se entienden sin movimiento espacial |
| viewports diminutos (< 360 px de ancho o < 560 px de alto) | la misma página estática (Spec §24) |
| sin JS / chunk caído | la misma página estática; todo el copy está en el HTML del servidor |

El tamaño estático de las protagonistas nunca supera el ancho de la columna: a 320 px, CONVERTIR. mide 6,86 em sin cortes.

## 6. Rendimiento (medido; Lighthouse 13.5, 3 corridas, mediana)

| | Base `4fea9ab` | Primera versión | Final |
|---|---|---|---|
| Home móvil: TBT | 198 ms | 331 ms | **203 ms** |
| Home móvil: LCP | 3,32 s | 3,47 s | **3,39 s** (rangos de corrida 3,30–3,40 base / 3,32–3,40 final) |
| Home móvil: CLS | 0 | 0 | 0 |
| Home desktop | perf 100 · TBT 0 | 100 · 0 | **100 · 0** |
| JS inicial (brotli / gzip) | 225,5 / 258,8 KB | — | **227,8 / 261,6 KB** (+2,3 / +2,8) |
| CSS / HTML (gzip) | 11,1 / 20,4 KB | — | 12,7 / 21,8 KB |

En la primera versión, el build diferido de la escena y el `ScrollTrigger.refresh()` global que encolaba sumaban una tarea larga después de la hidratación. Se corrigió con dos opciones opt-in de `useScene` que sólo usa esta escena:

- `presized`: el alto del pin está en CSS desde el primer paint. Si el build no lo cambia, se omite el refresh global; si lo cambia (por ejemplo, svh ≠ innerHeight en móvil), se refresca como siempre.
- `lazy`: la escena se construye cuando la sección está a un viewport de distancia, no en la cola de hidratación. Su stage no lleva `data-scene-root`, así que `scenesReady()` no la espera y los deep links y recargas no se demoran.

Las demás escenas no cambiaron. El presupuesto de JS (170 KB) ya se excedía antes (docs/18) y sigue así: esta sección agrega 2,3 KB.

## 7. Copy

Es exactamente el aprobado en el pedido: Content Master §20, en `SITE.declaration` de `src/data/site.ts`, con test palabra por palabra. Para su tipografía, la línea del acto III se parte en `first / lead / word / mark` (`splitFinal`); el texto del DOM se lee igual, «Que no solo te vean. Que te elijan.», y está testeado. El encabezado de la sección (sólo para lectores de pantalla) es «MOSTRAR. CONVENCER. CONVERTIR.», la línea del concepto del pedido.

**Tensiones con el Content Master que quedan registradas** (no se cambió el copy; decide Franco):

- La regla de voz §02 («nunca hablar de "soluciones"») choca con «soluciones», que es una de las diez palabras del acto I aprobadas. Aparece sola, como palabra del campo, no en una frase.
- La regla §02.3 («Franco aparece en el perfil y en el cierre») y la nota de Spec §12 sobre Perfil como única primera persona chocan con la conclusión, que está en primera persona («Diseño y desarrollo…»). Como la sección termina justo antes de Perfil, las dos voces quedan juntas.
- La segunda persona («Tenés», «tus clientes», «te elijan») es nueva en el sitio, que hasta ahora hablaba del trabajo. Es el objetivo explícito de la sección.

## 8. Verificación

- `npx tsc --noEmit` y `npm run lint`: limpios. `npm run build`: ok, `check-assets: ok`.
- **Vitest: 194/194** (+14 de `tests/declaration.test.ts`, más las rutas `/#propuesta` y el copy en el HTML sin JS de `content.test`).
- **Playwright Chromium (6 proyectos): 497 pasados, 0 fallidos** (`declaration.spec`: orden en el journey; los ocho estados hacia adelante y hacia atrás; cada protagonista y su línea completas dentro del viewport; grilla y acciones; sin salto al entrar ni al salir del pin, con ±1 px; URL capacidades → propuesta → perfil sin entradas de historial; recarga dentro de la secuencia; axe sin violaciones serias en ELIJAN; página estática bajo RM y a 320 px con axe; sin JS).
- **WebKit 1440 / WebKit 390 / Firefox 1440 (`CROSS_BROWSER=1`, suite completa): 251 pasados, 0 fallidos.**
- **QA visual** en 1440×900, 1920×1080, 1366×768, 1024×768, 820×1180, 390×844 y 360×800: los ocho estados en orden, 0 errores de consola, 0 overflow. Están las hojas de contacto, los cuadros intermedios de un recorrido con la rueda, las costuras con Capacidades y Perfil, RM y sin JS, y dos grabaciones (adelante y atrás) en `qa/declaration/final/` (ignorado por git).
- **No hecho:** la pasada con lectores de pantalla (VoiceOver, NVDA) y dispositivos físicos. No hay acceso a ellos en este entorno.

**Encontrado y corregido durante el QA:**

- GSAP leía el `translateY(105%)` del CSS como píxeles, así que CONVENCER. y la frase final no aparecían.
- El borde superior de «Que te» asomaba por el margen de la máscara de descendentes; ahora el desplazamiento es de 120 %.
- A 320 px, la palabra estática desbordaba la columna.
- `data-part="line"` chocaba con un localizador global del spec del opening; se renombró la parte, sin tocar el test existente.
- Una carrera entre el snap y los saltos del test bajo carga; se resolvió en el helper del spec.

## 9. Archivos

- Nuevos: `src/components/declaration/Declaration.tsx`, `src/lib/declaration.ts`, `tests/declaration.test.ts`, `tests/e2e/declaration.spec.ts` y este documento.
- Modificados:
  - `src/data/site.ts` (copy).
  - `src/components/journey/Journey.tsx` (ubicación).
  - `src/lib/journey-store.ts` y `src/lib/route-sync.ts` (sección `propuesta`).
  - `src/lib/journey-nav.ts` (aterrizaje en el inicio del pin).
  - `src/lib/useScene.ts` (opciones `presized` y `lazy`, opt-in).
  - `src/app/globals.css` (bloque S12b).
  - `tests/content.test.ts` y `tests/foundation.test.ts`.
  - `docs/05b-content-master.md` (§20), `CLAUDE.md` y `README.md`.
- Sin cambios: los cuatro mundos, el reel, la navegación de mundos, las salvaguardas de privacidad (`next.config.ts`, `check-assets`, `launch.ts`) y los assets.

## 10. Riesgos y pendientes

1. **Ubicación:** difiere de la preferencia inicial, por las razones de §2. Moverla es un cambio de una línea más el test.
2. **Content Master:** el §20 es un addendum local del export. Hay que pasarlo al Claude Doc de origen. Quedan además las tres tensiones de voz de §7.
3. **Campo latente:** en `CAMPO`, las palabras están a .12–.42 de opacidad a propósito («casi imperceptibles»). Se vuelven legibles en el estado siguiente, y en RM y sin JS se leen siempre al 100 %.
4. **Presupuesto de JS:** sigue excedido como antes (227,8 KB brotli contra 170 KB). Esta sección suma +2,3 KB.
5. **Producción:** nada desplegado. Cada push a `main` despliega solo a Vercel Production (docs/21), así que el push requiere tu autorización.
