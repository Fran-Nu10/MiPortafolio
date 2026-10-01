# 06 · Sistema de copy en español

Rama `feat/spanish-copy`, desde `main` @ `4a2246e`. Localización editorial completa: no es una
traducción del inglés, sino ENSAMBLE escrito en español.

## 1. Regla de idioma

Todo el portfolio está en español latinoamericano contemporáneo (`<html lang="es">`). El voseo se usa
solo cuando el sitio le habla directamente al visitante («contame», «elegí», «probá», «inspeccioná»,
«venís»). Los botones van en infinitivo («Probar», «Empezar la lámina 05»).

Cada término cae en una de tres clases:

| Clase | Regla | Ejemplos |
| --- | --- | --- |
| **A · copy humano** | Siempre en español, reescrito (no traducido) | hero, manifiesto, claims, párrafos, formulario, errores, estados |
| **B · lenguaje del sistema** | En español, con vocabulario real del dibujo técnico: es lo que hace que ENSAMBLE suene concebido en español | lámina, pieza, cota, despiece, trazo, placa base, grabado, ensamble, encastre, estación, armando, ensamblado |
| **C · producto / tecnología / oficio** | Se mantiene el nombre original | TravelSuite360, Prospector, RAYO SMASH, Santi Nuca, Chef Arturo, TravelChat, Next.js, React, TypeScript, Supabase, PostgreSQL, Vercel, GSAP, Apify, Mercado Pago, WhatsApp · API, CRM, SaaS, IA, UYU/USD · brief, lead, scoring, scraping, pipeline, motion, hero, tracklist, checkout, inbox, dashboard, design tokens, shader, WebGL, stack, portfolio, Lab |

Por qué la clase C conserva estos términos: son las palabras con las que el oficio habla en
Latinoamérica («hero», «brief», «motion», «checkout»). Traducirlos («héroe», «resumen», «movimiento»,
«caja») sonaría a traducción automática o cambiaría el sentido. «Lab» se mantiene como nombre propio
de sección: «Laboratorio» es más largo y más solemne de lo que la sección es.

Lo que **no** se mantuvo en inglés, a propósito: *sheet, part, explode, interface, components, data,
assembling, assembled, drawing, engraved, launched, station, drawn by, live*. En inglés eran el
«lenguaje del sistema»; en español el dibujo técnico tiene equivalentes exactos y más ricos
(*despiece* para *exploded view*, *lámina* para *sheet*), así que no hacía falta spanglish.

## 2. Decisiones no literales

| LOCATION | ORIGINAL | SPANISH FINAL | RATIONALE |
| --- | --- | --- | --- |
| Hero · bajada | Builds digital products from brief to production. Strategy, design, engineering and launch — assembled by one person, on purpose. | Productos digitales, de la idea a producción. Estrategia, diseño, ingeniería y lanzamiento, ensamblados por una sola persona. | Primera frase nominal y rítmica. «Ensamblados» conecta la enumeración con el concepto ENSAMBLE y evita la enumeración corporativa. «On purpose» se cae: en español sonaba traducido. 124 vs 128 caracteres. |
| Hero · pieza | Part 01 · interface · frontal | Pieza 01 · interfaz · frontal | Clase B. |
| Hero · cota del apellido | Núñez · 0 % · awaiting parts 02–04 / part 04 landed / the system is understood | Núñez · 0 % · faltan las piezas 02–04 / pieza 04 colocada / el sistema se entiende | Anotación de plano, no frase. |
| Hero · cota de explosión | explode · 110 · cursor drags 60–160 | despiece · 110 · el cursor separa 60–160 | «Despiece» es el término técnico exacto de una vista explotada. |
| Hero → Lámina 01 | the object you watched being built is sheet 01 · TravelSuite360 | lo que viste armarse es la lámina 01 · TravelSuite360 | Voseo natural, más corto. |
| Manifiesto · palabras | DESIGN · ENGINEERING · PRODUCT | DISEÑO · INGENIERÍA · PRODUCTO | Se evaluó mantenerlas en inglés: en español tienen el mismo ancho (INGENIERÍA es más corta que ENGINEERING), se entienden sin esfuerzo y un manifiesto en inglés dentro de un sitio en español se leería como una pose. |
| Manifiesto · 01 | Art direction, interface systems, motion. A product nobody can build is a drawing. | Dirección de arte, interfaz y motion. Si no se puede construir, es solo un dibujo. | La idea («diseñar algo inconstruible no alcanza») en forma condicional, que en español golpea más que la definición. |
| Manifiesto · 02–04 | Every layer is mine: data, API, components. No handoff gaps. | Datos, API, componentes: cada capa es mía. Nada se pierde entre el diseño y el código. | «Handoff gaps» no tiene equivalente natural; se dice lo que significa. |
| Manifiesto · Σ | Business is the first layer. If it doesn't change a number, it doesn't get built. | El negocio es la primera capa. Si no mueve un número, no se construye. | Casi literal porque ya era precisa; «mover un número» es más natural que «cambiar». |
| Selected Work · sección | 03 — Selected work · Sheet 01 / 04 | 03 — Proyectos · Lámina 01 / 04 | «Trabajos seleccionados» suena a catálogo. «Proyectos» es directo; la idea de construcción la lleva «lámina», que ENSAMBLE ya usa. |
| TravelSuite360 · categoría / claim | Product system · SaaS / A complete operating system for travel agencies. | Plataforma SaaS · agencias de viaje / El sistema con el que opera una agencia de viajes: de la primera conversación a la reserva. | Responde qué es y por qué importa; nombra el recorrido real (TravelChat → reservas) sin inventar métricas. |
| Prospector · categoría / claim | Creative engineering · interactive commerce / A restaurant commerce demo engineered to sell the experience before the pitch. | Ingeniería creativa · comercio interactivo / Demos que llegan construidas: el restaurante ve su producto antes de la primera conversación. | El claim describe el sistema (una demo por lead), no «una web de hamburguesas». |
| Santi Nuca · claim | An editorial portfolio built around image, rhythm and restraint. | Un portfolio editorial hecho de imagen, ritmo y contención. | Se conserva la brevedad editorial. |
| Chef Arturo · categoría / claim | Premium commerce · art direction × transaction / Editorial commerce designed to turn a food brand into a complete buying experience. | Comercio premium · dirección de arte × compra / Comercio editorial para una marca gastronómica: identidad fuerte, compra clara. | Dos ideas en tensión (marca y transacción), sin copy de ecommerce genérico. |
| Capabilities · título | Parts, not services | Despiece | Pieza central de ENSAMBLE: el despiece es literalmente un producto desarmado en sus piezas. Una palabra, más fuerte que «Piezas, no servicios», y la bajada aclara la idea anti-servicios. |
| Capabilities · bajada | You just saw four finished products. These are the parts they were built from — sorted into four bins. A part that has no capture stays an empty slot. | Cuatro productos terminados, desarmados. No es una lista de servicios: son las piezas que combino para construir un producto entero. | Dice exactamente lo pedido: no hay lista de servicios, hay capacidades que se combinan. Lo de los espacios vacíos ya se ve en las bandejas. |
| Capabilities · bandejas | Digital products · Commerce experiences · AI & automation · Interactive web | Productos digitales · Comercio · IA y automatización · Web interactiva | «Experiencias de comercio» es copy de agencia; «Comercio» alcanza. |
| Process · título | The same object, six stations | El mismo objeto, seis estaciones | Ya estaba integrado a ENSAMBLE (no es «Mi proceso»). Las estaciones: Entender · Definir · Diseñar · Prototipar · Construir · Lanzar. «Strategize» → «Definir» (no «Estrategizar»); «Engineer» → «Construir». |
| Process · Launch | Frontal. In production. Watched. | Frontal. En producción. Medido. | «Medido» retoma el manifiesto (si no mueve un número…). |
| Lab · título | Parts that don't belong to a build yet | Piezas sin proyecto | La versión literal ocupaba 4 líneas; esta, 2. El «todavía» pasa a la bajada. |
| About · título | Drawn by Franco Núñez | Dibujado por Franco Núñez | Conserva la convención del rótulo de un plano sin caer en «Sobre mí». En el contador: «08 — Autor». |
| About · rótulo | Based in · Building for · Does · Works with | Base · Alcance · Hace · Con quién | Campos de rótulo, no frases. |
| About · cierre | Based in Uruguay. Building globally. No biography beyond this block: the four builds above are the biography. | Desde Uruguay, para cualquier país. No hay más biografía que este bloque: los cuatro proyectos de arriba la cuentan. | Uruguay + alcance internacional sin grandilocuencia. |
| Technology · título | Engraved on the plate | Grabado en la placa | Se mantiene como infraestructura, no «Habilidades». |
| Live Window · INTERACT | Interact | Probar | Una palabra, lo que el visitante hace realmente. Aria: «Probar X en vivo, dentro del portfolio». |
| Live Window · OPEN LIVE | Open live ↗ | Abrir sitio ↗ («Abrir ↗» en pantallas angostas) | Claro y breve; nunca «Haz clic aquí». |
| Live Window · BACK | Back to portfolio | Volver al portfolio | La salida tiene que ser evidente: se nombra el destino. |
| Live Window · estados | connecting to the live build / live · interact / the live build did not answer | conectando con el sitio / en vivo / el sitio no respondió | — |
| Final · titular | What I built → we can build | Lo que construí → construimos | El mismo verbo cambia de persona: la transformación visual (una máscara) se vuelve también gramatical. «Construimos» funciona como presente y como pasado: lo que ya construimos y lo que podemos construir. |
| Final · Build 05 | Build 05 · Your product | Lámina 05 · El producto de {nombre} | Los cuatro proyectos son las láminas 01–04; la quinta es la del visitante. Coherente con todo el sistema. |
| Final · CTA | Start the build | Empezar la lámina 05 | La conclusión inevitable del recorrido, no «¿Trabajamos juntos?». |
| Formulario | Name · What are we building · SaaS / Commerce / AI / Interactive | Nombre · Qué vamos a construir · SaaS / Comercio / IA / Interactivo | Solo lo necesario. Los valores enviados no cambian (solo las etiquetas). |
| Formulario · errores | A name, at least two letters. / Tell me what we are building, in a few words. | Un nombre, de al menos dos letras. / Contame qué vamos a construir, en pocas palabras. | Directos, en la voz del sitio. |
| Formulario · éxito | Your brief is on the axis, next to the four builds. | La primera pieza del próximo sistema acaba de entrar. Tu brief ya está en el eje, junto a los cuatro proyectos. | Continúa la narrativa (estación 01 de 06). Si la vía de envío no está conectada, lo dice: «…así que no se envió nada». |
| Skip link | Skip to Build 05 · contact | Saltar a la lámina 05 · contacto | — |
| Metadata | Franco Núñez — Digital product designer & developer | Franco Núñez — Diseño y desarrollo de productos digitales | Título, description, OpenGraph (`es_UY`) y Twitter. Sin keyword stuffing. |

## 3. Estados del contador (clase B)

Armando · Trazando · Ensamblado · Lámina 0N / 04 · Lámina 0N → 0N · Estación 0N / 06 · Piezas sueltas
· Dibujado por · Grabado · En producción · Lámina 05 · Entender. Secciones: 00 — Carga · 01 — Inicio
· 02 — Manifiesto · 03 — Proyectos · 05 — Capacidades · 06 — Proceso · 07 — Lab · 08 — Autor ·
09 — Tecnología · 10 — Cierre / Lámina 05.

## 4. Cambios mínimos de layout por longitud

- **Proceso, phones:** la columna del título pasa de 60 % a 96 % del ancho (desktop sin cambios).
  «El mismo objeto, / seis estaciones» quedaba en 4 líneas; ahora son 2.
- **Live Window, phones:** el nombre del proyecto se trunca en vez de pisar los botones, y «Abrir
  sitio» se acorta a «Abrir» bajo 640 px.
- Ningún tamaño de fuente se redujo.

## 5. Corrección encontrada durante la QA

La sonda de alcance de la Live Window trataba como falla el aborto de su propia limpieza (React
StrictMode monta los efectos dos veces en desarrollo; también pasaría con un remontaje). Ahora un
aborto por limpieza se ignora y solo el timeout o un error de red real cuentan como «el sitio no
respondió».

## 6. Pendiente de Franco

- Rol exacto en TravelSuite360, Santi Nuca y Chef Arturo (hoy no se muestra).
- Vías de contacto (email, WhatsApp, agenda) y tiempo de respuesta: cuando existan, aparecen en
  la lámina 05 («Agendar 30 min» ya está escrito).
- El año de inicio («Activo desde»), si se quiere mostrar.
