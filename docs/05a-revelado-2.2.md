# REVELADO 2.2 — Especificación de experiencia (texto)

> **Qué es este documento.** Transcripción en texto de la dirección de arte y de experiencia congelada de REVELADO 2.2 (acumulada en 2.0 → 2.1 → 2.2). La fuente visual es el canvas de Claude Design; esto es lo que Claude Code necesita para no perder decisiones. No es una propuesta: **el diseño está congelado**. No rediseñar, no crear "REVELADO 2.3".
>
> - Canvas (publicado): https://claude.ai/artifact/Uk8Y5fiQnzFDCMq1NbmuHM (vista: https://claude.ai/code/artifact/e0ac5ebd-37ee-4246-a70e-c12e35b1aa24). Los tableros R2-xx, R21-xx y R22-xx son la referencia visual.
> - Autoridad: **Content Master** (copy y hechos) → **REVELADO 2.2 (este)** → **Master Implementation Spec** → código existente.
> - Si algo de 2.0/2.1 contradice a 2.2, el Content Master o el Spec, gana lo más alto en el orden anterior. Las contradicciones conocidas están en "Superseded" al final.
> - Exportado el 2026-10-07.

---

## 1. Principio rector

*The metaphor serves the work. The work does not serve the metaphor.* "Revelar" es lenguaje de motion, no decoración: algo latente adquiere forma y contraste hasta ser producto. No hay cubetas, broches, cuerdas, papel baritado, ampliadora como objeto ni grano permanente. Nada que diga "web sobre fotografía analógica".

El rojo es señal, y es el único color que viaja entre mundos.

## 2. Tokens

| Token | Valor | Uso |
| --- | --- | --- |
| Black (fondo) | `#0B0B0C` | fondo base |
| Paper (primario) | `#EDE8DE` | texto sobre negro, superficies claras |
| Paper secondary | `#D6D0C4` | superficies secundarias |
| Muted | `#8E8B84` | metadatos (sobre negro 5.8:1; **sobre papel 2.8:1 → no usar como texto**) |
| Safelight red | `#E63B2E` | señal / activo (sobre negro 4.7:1; sobre papel 3.4:1) |
| Ink on paper | `#141414` | texto sobre papel (al 70 %: 6.2:1) |
| Panel gris | `#17181B` | superficies de UI sobre negro |

Los mundos pueden romper el sistema temporalmente: TravelSuite = la luz de su UI; Rayo = rojo/negro; Santi = blanco de página; Chef = crema y fotografía. Después el sistema vuelve (REVELADO → MUNDO → REVELADO).

## 3. Tipografía

Schibsted Grotesk, una sola familia: **900** display (aguanta 400 px sobre negro y sobre foto), **500** editorial, **400** UI y metadatos. Mono: IBM Plex Mono (ya en el repo; pregunta abierta no bloqueante en el Spec §29). Alternativa descartada salvo decisión de Franco: Bricolage Grotesque.

## 4. Gramática de motion

| Verbo | Qué es |
| --- | --- |
| REVEAL | algo adquiere contraste y nitidez: filtro + máscara, 500–700 ms, curva de salida larga. Opening, quinta pieza del índice, capacidades al entrar al centro. |
| EXPAND | una pieza se convierte en experiencia: escala desde su lugar hasta 80–95 % del viewport; nunca aparece ya grande. |
| ENTER | entramos al mundo: el fondo cambia de materia (luz de UI, rojo, blanco, crema) antes que el contenido. |
| SHIFT | cambio de medio dentro de un proyecto: corte seco o barrido de máscara en un gesto; sin cross-fade. |
| BREAK | un proyecto rompe el sistema; el break es instantáneo, lo que sigue es lento. |
| RETURN | volvemos a Revelado: la materia del proyecto se enfría a papel y a negro mientras el siguiente elemento ya está dibujado. |
| HUMAN | foto/video de Franco con movimiento orgánico: recortes lentos, respiración, nunca snaps. |

**Prohibido:** bounce, springs, flotación, parallax continuo, scroll hijacking, lentitud por lentitud. Regla: **un gesto = un cambio con sentido.**

## 5. Orden del recorrido

Opening → Hero (FRANCO / NÚÑEZ) → Posicionamiento (último estado del hero, no sección aparte) → Project Reel → **TravelSuite360 → Rayo Smash → Santi Nuca → Chef Arturo** (cada uno: mundo + prueba) → respiro humano (entre Rayo y Santi) → Capacidades (con la frase del busto como costura) → Perfil → Franco at work → "Ahora, el tuyo." (formulario) → Fin (por éxito del form, sin footer).

Ritmo: DARK → REVEAL → QUIET → PRODUCT (TravelSuite) → SPECTACLE (Rayo) → HUMAN → QUIET (Santi) → PRODUCT/deseo (Chef) → HUMAN (perfil) → CONTACT. Contraste máximo entre vecinos: negro/UI → rojo → blanco → crema → negro. Orden de proyectos fijo; "Rayo primero" fue descartado (adelanta el pico y vuelve a TravelSuite un anticlímax). Nunca más de dos respiros humanos, nunca el hero repetido.

Longitudes de scroll de escritorio (valores iniciales, se afinan en QA): Spec §02.

## 6. Hero

- La foto **no** vive en un rectángulo de papel. Cuerpo, tipografía y negro se tocan: **FRANCO detrás del cuerpo, NÚÑEZ delante y cortado por el borde.** Copy mínimo. Firma: "Producto × Diseño × Ingeniería" (texto exacto: Content Master §04).
- Opening: una banda de luz, una superficie fuera de foco, Franco; "la apertura que enfoca". 2 estados automáticos + 3 de scroll (Spec §02/§05).
- Mobile: crop vertical con FRA/NCO arriba y NÚ/ÑEZ abajo.
- **No existe retrato de Franco todavía** (ver brief de producción más abajo): el hero se construye con `Placeholder` y la sección queda bloqueada para lanzamiento hasta tener el cutout (`franco.hero.*`).

## 7. Project Reel (R2.2)

No es un carrusel: reel de cuatro piezas a 76 vw con vecinas asomando, un solo video activo, snap seco, entrada sin corte a cada mundo. La rueda vertical no se captura nunca.

| Aspecto | Definición |
| --- | --- |
| Dimensiones | activa 1094 × h (76 vw a 1440); alturas por personalidad: TravelSuite 616 (16:9), Rayo 580 (1.9:1), Santi 700 (1.56:1), Chef 640 (1.7:1); centradas verticalmente; mobile 358 × 420 |
| Gaps · vecinas | gap 32 px; vecinas visibles 141 px por lado (desktop), 8 px (mobile); vecinas al 55 % con grayscale .6; metadato mínimo "0n · nombre" |
| Snap | al centro, 420 ms, ease-out; umbral 20 % del ancho o velocidad > 0,4 px/ms; una pieza por gesto |
| Drag · mouse · trackpad | drag con pointer events (sin inercia libre); delta horizontal del trackpad mueve el reel; rueda vertical nunca se captura; click en vecina → va; click en la activa → entra |
| Teclado | ← → mueven; 1–4 saltan; Enter entra; Tab recorre Ver caso / Abrir ↗ de la activa; foco visible = aro papel 2 px |
| Video | sólo la activa reproduce: loop seamless 3–6 s, muted, playsinline, autoplay al snap, pausa al salir; vecinas y resto: poster (captura real) |
| Poster | la captura real es poster, fallback y estado reduced motion; se carga antes que el video; el video sólo se pide si la pieza está activa o es la siguiente |
| Cursor | sobre el reel: DRAG; sobre la activa: VER; sobre bordes vecinos: → / ←; en touch no existe |
| Metadatos | activa: 0n / 04 · nombre 22 px · categoría · año (por confirmar) · Ver caso · Abrir ↗; vecinas: 0n · nombre; abajo, 01–04 como índice en texto |
| Entrar | Ver caso / click / Enter → SCREEN → ISOLATE → ESCAPE → EXPAND → WORLD en 1–2 gestos, sin corte; objeto que escapa: información (TravelSuite), burger (Rayo), fotografía (Santi), producto (Chef) |
| Volver · navegación | la experiencia sigue sola TravelSuite → Rayo → Santi → Chef; control discreto "01–04" (arriba a la derecha) abre el reel como overlay compacto: cuatro miniaturas en fila, Esc cierra; nunca un menú pesado |
| Ritmo por proyecto | entrada 1–2 gestos · mundo 3–5 gestos · prueba 1 gesto + 5–12 s · salida 1 gesto; nada obliga a terminar: "Siguiente proyecto →" siempre visible al final de cada mundo |
| Performance | sólo un video activo; mundos lazy; el de Rayo se precarga cuando Rayo es la siguiente pieza; el de Chef, al terminar Santi; nada se carga en el opening |
| Mobile | una pieza por pantalla, swipe = una pieza, tap entra; indicador de cuatro marcas; loop sólo en la activa |
| Reduced motion | posters en lugar de video; sin snap animado (cambio directo); flechas visibles; entradas a mundos = cortes entre estados |

## 8. Cursor y microinteracciones

Cursor por defecto: punto de 6 px, papel. Con acción: aro de 22 px y una palabra: VER, DRAG, PLAY / PAUSE, ABRIR ↗, SIGUIENTE. Sin trail, sin glow, sin seguidor grande. En touch no existe.

Links: subrayado que se dibuja desde la izquierda, 180 ms. El rojo sólo marca lo activo. Progreso: marcas del índice, nunca una barra. Carga de imagen: REVEAL (de gris a contraste), no blur-up genérico. Controles de video: aro + palabra, se esconden a los 2 s. Foco: aro de 2 px papel, idéntico al cursor.

## 9. Scroll

Un gesto = un cambio con sentido. Pins cortos y section-owned (Spec §05). Todo lo demás es flujo nativo con animación disparada al ~30 % del viewport. Drag horizontal sólo en reel y riel. **La rueda vertical nunca se intercepta globalmente; sin smooth scroll propio.**

## 10. Mundo TravelSuite360 — estados TS00–TS09 (R2.2)

Diez estados, siete gestos. Todo es DOM con CSS 3D y GSAP; el único video es la prueba. La tipografía es real y accesible; las profundidades son `translateZ` con `perspective 1400px` en un escenario único; los fragmentos del big reveal existen desde el principio y aparecen por la retirada de cámara. Posiciones en un espacio 1440×900. Mensaje de demo: **"Necesito viajar a Punta Cana en julio, somos cuatro."** (unidad de demo, no dato de cliente).

| Estado | Frame | Copy | Posición | Profundidad | Cámara | Motion | Gesto | Duración | Medio |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 00 · entrada | el preview del reel, congelado | — | frame al 25 %, centrado | z 0 | fija | el mensaje sale del frame y crece a 44 px, 700 ms, ease-out | click / Ver caso | 0,7 s | DOM · el mensaje es un nodo de texto real del preview (poster + capa de texto) |
| 01 · raw | negro, mucho espacio | "Necesito viajar a Punta Cana en julio, somos cuatro." | x 160, y centro, 64 px, ancho máx. 1100 | z 0 | fija | respira 2 px al llegar; nada más | 1 gesto | 0,6 s | DOM |
| 02 · extracción | las partes nacen de la frase | Punta Cana → destino · julio → fechas · cuatro → pasajeros · etiqueta: interpretado | destino x 560 y 140 · fechas x 220 y 300 · pasajeros x 1020 y 360 · la frase baja a y 560 al 45 % | z +300 / 0 / −300 → escala 1,25 / .9 / .7 · opacidad 1 / .85 / .6 | dolly Z +200 siguiendo a Punta Cana | las palabras se desprenden en su lugar (sin aparecer desde fuera): translate + scale, ease-out larga; la frase deja huecos subrayados | 1 gesto | 0,9 s | DOM + CSS 3D + GSAP |
| 03 · quote | dos opciones tipográficas | Opción 01 / Opción 02 · destino · fechas · pasajeros · vuelo · hotel | 01 x 120 y 160 · 02 x 120 y 520 | 01 z 0 escala 1 · 02 z −400 escala .72 op .4 | fija | 01 avanza, 02 se retira; sin cards: líneas y texto | 1 gesto | 0,7 s | DOM + GSAP |
| 04 · trip | la opción encaja | viaje · Punta Cana · fechas · pasajeros · vuelo · hotel · traslados · estado | bloque x 760 y 150, ancho 600, retícula 2 × 3 | z 0 | fija | los datos se alinean a la retícula con snap seco: steps(4), 500 ms; sin morph | 1 gesto | 0,5 s | DOM · CSS grid · GSAP |
| 05 · reserva | confirmación | reserva confirmada → reporte actualizado · sin intervención | barra bajo el bloque, 600 px | z 0 | fija | la señal roja (10 px) recorre la barra en 500 ms y sale por la derecha; el reporte se marca sin flecha | automático, 500 ms después del trip | 0,9 s | DOM · un elemento, transform x |
| 06 · big reveal | decenas de operaciones detrás | fragmentos: mensaje · cotización · viaje · reserva · cliente · reporte (texto 9 px + línea) | 50–80 fragmentos distribuidos, zona central libre; el viaje seguido queda al centro a escala .7 | cuatro profundidades: z 0 / −300 / −600 / −900 → escala 1 / .8 / .55 / .3 · opacidad .55 → .1 | dolly Z −800, lento al inicio y más rápido después; viñeta radial fija | los fragmentos ya existen, aparecen por la retirada de la cámara (no por fade); micro-deriva de 4 px en loop | 1–2 gestos | 1,6 s | DOM + CSS 3D + GSAP; 60–80 nodos de texto, sin partículas, sin canvas |
| 07 · nombre | calma | TravelSuite360 · Operación completa para agencias de viaje | centrado, y 560, 88 px | z 0 | se detiene | la deriva se detiene; el nombre entra con REVEAL, 800 ms | automático | 0,8 s | DOM |
| 08 · prueba | una ventana real | TravelChat · CRM · IA · Abrir ↗ · Siguiente proyecto → | x 173 y 120 · 1094 × 616 | z 0 | fija | scale .9 → 1, 500 ms; tres cortes secos de 3 / 2,5 / 2,5 s; muted; poster | 1 gesto + reproducción | 8 s | video (grabación real) · lazy, precarga al entrar al mundo |
| 09 · salida | vuelve al índice | — | la ventana vuelve a 1094 × 616 en el reel | z 0 | fija | pierde luz al 55 %; el rojo entra por los bordes 1,2 s | 1 gesto | 1,2 s | DOM + GSAP |

Notas de implementación ya decididas en el Spec (§08): fragmentos generados determinísticamente (mulberry32, semilla 360, `data/ts-reveal.ts`, 64 desktop / 32 mobile); CSS 3D sólo en lg/xl con `z = P·(1 − 1/scale)`; en sm/md y reduced motion, estados como cortes. Copy del nombre/subtítulo: **siempre del Content Master**, no de esta tabla si difieren.

## 11. Mundos de proyecto (R2.1, con ajustes de 2.2)

Orden fijo: TravelSuite → Rayo → Santi → Chef. Cada mundo: realidad → experiencia → prueba.

### 11.1 TravelSuite360 · mundo 01 · sistema
- **Concepto.** Un sistema vivo: una consulta se vuelve un viaje completo. Comunica pensamiento de sistema, no dashboards.
- **Material real.** Conceptos del producto (mensaje, cliente, destino, cotización, viaje, reserva, reporte, IA, automatización) y grabaciones reales de TravelChat, CRM, reportes y asistente para la prueba. Los textos de ejemplo son unidades de demo, no datos de clientes.
- **Momento firma.** La consulta que se vuelve un viaje: el mismo texto del mensaje se descompone en destino, fechas y pasajeros y reaparece como reserva confirmada.
- **Cámara.** Avanza lenta entre tres planos; nunca orbita. **Profundidad:** escala y opacidad, sin niebla ni desenfoque fuerte. **Medios:** DOM + GSAP; sin WebGL; la prueba es video.
- **Salida.** La interfaz pierde luz y vuelve al índice como pieza; el negro se vuelve rojo por los bordes: Rayo.
- **Mobile.** Recorrido vertical, un evento por gesto, menos actividad simultánea; prueba al final con crop + pan.
- **Producción.** Existe: los conceptos y el producto. Crear: grabaciones reales por módulo (1920×1200, cursor visible) y capturas fijas para card/índice. **Hoy no existe ningún material de TravelSuite360** → placeholders marcados; privacidad: sólo datos demo (Spec §23).

### 11.2 Rayo Smash · mundo 02 · espectáculo
- **Concepto.** Capa por capa, de verdad: la burger se suspende, se separa y la cámara pasa entre las capas. Comida + diseño + ingeniería creativa.
- **Material real.** Fotografía de la burger explotada del hero de Rayo (el Spec §09 define los recortes por capa: cinco cutouts + burger entera), detalle macro de medallón con cheddar, la Clásica de la PDP, menú tracklist, plancha. Datos reales del sitio: Clásica $490, pan brioche, doble medallón smash, cheddar fundido, salsa de la casa. *(Rayo Smash es el demo de Prospector; ver Content Master §07 para el encuadre exacto.)*
- **Secuencia.** 1 entera, quieta, a sangre · 2 se suspende y se separa en capas con snap seco (cantidad exacta y offsets: Spec §09) · 3 la cámara entra: pan → bacon → queso → carne, macro · 4 assembly: vuelven, snap, entera · 5 rota y se vuelve el hero real · 6 prueba: hero → menú → PDP → live.
- **Cámara.** Dolly hacia adelante entre capas con leve tilt; vuelve a frontal en el assembly; rotación de 20° al convertirse en hero.
- **Medios (decisión híbrida E = 2.5D + video).** Capas 2.5D con recortes del material original para suspensión y assembly (DOM/CSS 3D + GSAP) + **un video prerenderizado 16:9** para el paso de cámara entre capas; en mobile **un único video 9:16**. **No WebGL** (se descartó; sólo si apareciera un modelo 3D de calidad, fuera de alcance).
- **Momento firma.** La cámara entre el bacon y el queso (macro) y el snap del assembly.
- **Salida.** La superficie clara del envoltorio crece hasta ser blanco; corte: la hoja de Santi. **Mobile.** Capas separadas en vertical; el paso entre capas es el video 9:16.
- **Producción.** Existe: 6 capturas. Derivable: recortes por capa. Crear: render/video del paso entre capas (16:9 y 9:16), grabación del sitio real para la prueba.
- Evaluación de tecnología (1–10): A modelo 3D/WebGL (6,5,4,3,9) · B capas 2.5D (8,9,8,8,7) · C video prerenderizado (9,9,9,6,4) · D image sequence (9,6,5,6,9) · **E híbrido B+C elegido (9,9,9,7,8)**. Columnas: realismo, performance, mobile, costo, control.

### 11.3 Santi Nuca · mundo 03 · editorial
- **Concepto.** Una publicación editorial que cobró vida: fotografía, tipo, páginas, composición. Dirección de arte. **Atribución (Content Master ronda 1):** la fotografía es de Santi Nuca (crédito "Fotografía · Santi Nuca"); Franco hizo el diseño web, dirección de arte, UX/UI, composición y desarrollo.
- **Material real.** Ocho capturas (apertura, 01–06, tríptico forma/línea/textura).
- **Secuencia.** 1 una hoja sola, centrada · 2 se desplaza; otra entra debajo y la recorta: díptico · 3 la cámara se abre apenas: tríptico, tres palabras · 4 las páginas se recomponen en retícula: sistema editorial, índice 01–06 · 5 prueba: la web real, scroll grabado, live.
- **Cámara.** Casi fija; dos movimientos de 20–40 px. **Profundidad:** plana; sólo solapamiento y una sombra mínima. **Medios:** DOM + GSAP (transforms y máscaras sobre imágenes); sin video, sin 3D; reduced motion: cortes.
- **Momento firma.** Una imagen → díptico → tríptico → sistema, en una sola coreografía continua, lenta y exacta.
- **BREAK.** Negro → blanco de golpe (el corte sin animación es el espectáculo).
- **Salida.** El papel se calienta a crema; la primera comida de Chef entra a sangre. **Mobile.** Una página por vez, swipe horizontal.
- **Producción.** Existe: 8 capturas. Pedir: fotografías fuente en alta (a Santi Nuca), grabación de scroll del sitio real, nombre de la tipografía (por confirmar).

### 11.4 Chef Arturo · mundo 04 · deseo + comercio
- **Concepto.** Primero el deseo, después la compra: una pieza audiovisual gastronómica que resulta ser un producto digital real. **Atribución:** marca y fotografía no se atribuyen a Franco; rol "Producto, diseño y desarrollo"; prueba "Tienda real, en línea." (no afirmar "pagos en producción" hasta confirmar Mercado Pago live).
- **Material real.** Diez capturas y datos reales del catálogo: Cookie levain de pistacho y chocolate blanco $120, merienda (cookies, brownies, boxes dulces), compra directa, Mercado Pago, WhatsApp.
- **Secuencia.** 1 macro extremo, a sangre · 2 la cámara retrocede: producto entero · 3 otras piezas entran y se ordenan · 4 nombre, precio y ocasión integrados a la dirección de arte · 5 cantidad · agregar: la escena se reorganiza; el objeto es producto digital · 6 prueba: PDP real, catálogo, carrito, live.
- **Cámara.** Retroceso lento desde el macro; después fija. **Profundidad:** fotográfica (foco y escala, no 3D). **Medios:** video de comida donde exista; fotografía con recortes lentos y máscaras donde no; DOM para información comercial y el gesto de compra.
- **Momento firma.** La pieza que pasa de objeto a producto. **Salida.** La crema se enfría a papel, el papel a negro; el riel de capacidades ya está dibujado. **Mobile.** Video vertical a pantalla completa; la compra entra desde abajo sobre crema.
- **Producción.** Existe: 10 capturas. Crear: fotografía de producto/macro en alta, video 16:9 y 9:16, grabación del carrito y la ruta de compra.

## 12. Capacidades, Perfil, Franco at work, Final

- **Capacidades.** Riel magnético de piezas reales de los proyectos en un eje; la central se expande y muestra evidencia; cada pieza vuelve a su proyecto. **Taxonomía vigente: seis capacidades (Content Master §11)**, la sexta "Adquisición de clientes" con "Publicidad en Meta Ads, orientada a ventas." y **sin métricas** (la versión de 5 capacidades de 2.0 quedó superada). Opens with the bust seam: "Todo lo anterior pasó por las mismas manos." (Content Master §14).
- **Perfil.** Corto (tres líneas), texto exacto del Content Master §13; revelado una vez al entrar.
- **Franco at work.** Video propio (16:9 desktop; 9:16 mobile, no recorte del 16:9), frame que crece hasta 95 % (pin 200vh), expand con tap en mobile; el monitor se convierte en el formulario. Sección **apagada por flag** hasta tener el video.
- **Final.** "Ahora, el tuyo.": la quinta pieza del índice sube de contraste mientras el visitante escribe. Formulario Nombre · Email · Brief. Éxito: "Brief recibido." → la luz roja baja → negro → FRANCO NÚÑEZ. **Sin footer.** El formulario nunca se pinnea. El End se dispara por éxito del servidor (2xx de Resend), nunca por scroll.

## 13. Mobile (otro corte, no un reflow)

Menos estados, menos profundidad, **un pin como máximo (el opening)**, más swipe, medios más grandes, texto más corto. Hero: crop vertical FRA/NCO arriba y NÚ/ÑEZ abajo. TravelSuite: una pantalla, un módulo, crop + pan. Rayo: ingredientes en vertical + video 9:16. Santi: páginas verticales. Chef: comida a sangre. Capacidades: swipe horizontal. Franco at work: video 9:16 propio. Desktop: drag en reel y riel, flechas y teclado 1–4, cursor contextual. Tiers de implementación: Spec §15.

## 14. Reduced motion

Posters en lugar de video, cortes entre estados, snap sin animación, rueda y scroll nativos intactos. Regla de CSS: **nunca** `* { transition: none }`; scoped (lección de ENSAMBLE). Detalle: Spec §16.

## 15. Plan de medios (producción, no implementación)

- **Franco hero** (bloquea lanzamiento): retrato 3/4, B&N alto contraste, una luz dura desde la izquierda, fondo negro real, ropa oscura lisa, mirada fuera de cámara (+ variante a cámara). Aire arriba y a la derecha para que NÚÑEZ corte el borde. ≥ 4000 px de alto. Entregable: cutout con alpha (`franco.hero.desktop/mobile`).
- **Franco details**: mano sobre escritorio, perfil contra ventana, espalda caminando, reflejo en monitor apagado. Cuatro planos, misma luz; dos se usan.
- **At work 16:9 / 9:16**: escritorio real, monitor con un proyecto real, luz de ventana + monitor, 8–15 s (9:16: 8–12 s), sin tipeo, sin mirar a cámara, loop limpio. El 9:16 no es un recorte del 16:9.
- **TravelSuite**: recorridos reales de pantalla (TravelChat, CRM, cliente con viajes y cotizaciones, Reportes, Asistente IA, automatizaciones), 1920×1200, datos demo (revisión de privacidad).
- **Rayo / Chef / Santi**: ver §11.
- **No inventar:** ninguna captura de TravelSuite existe; sin métricas, sin clientes, sin resultados.

## 16. Superseded (no implementar lo viejo)

| Dicho en 2.0/2.1 | Vigente |
| --- | --- |
| "Profundidad real sólo en Rayo (una escena WebGL)" | Rayo = híbrido 2.5D + video prerenderizado. **No hay WebGL/Three.js/R3F.** |
| Capacidades: cinco (Producto · Ingeniería web · Comercio digital · IA + automatización · Experiencias interactivas) | Seis, según Content Master §11 (incluye "Adquisición de clientes"). |
| Índice persistente "01–04 × 01/05" con tira de contactos | Reel de 4 piezas + control compacto "01–04" (overlay). La "quinta pieza" en blanco sólo existe en el CTA final ("Ahora, el tuyo."). |
| Cualquier rol/atribución de Franco como "fundador" o "solo" | TravelSuite360: "Socio · Producto e ingeniería" (3 socios, Franco lidera todo el software, 3 agencias lo usan). Nunca "fundador"/"solo". |
| Hero con foto en rectángulo de papel | Cuerpo/tipo/negro se tocan (FRANCO detrás, NÚÑEZ delante). |
