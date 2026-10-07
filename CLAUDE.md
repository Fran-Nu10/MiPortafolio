# CLAUDE.md — MiPortafolio · REVELADO

Portfolio de **Franco Núñez**. Dirección creativa final: **REVELADO 2.2** (diseño **congelado**). Idioma principal del sitio: **español**. Este archivo es el punto de entrada para implementar; no contiene el historial de la conversación de diseño, sólo lo que hace falta para construir.

## 1. Orden de autoridad (si dos documentos se contradicen, gana el de arriba)

| # | Autoridad | Gobierna | Ruta exacta |
| --- | --- | --- | --- |
| 1 | **Content Master** (rev 26, secciones 00–19; la 00 son las correcciones de la ronda 1) | copy, hechos, roles, atribuciones, claims | `docs/05b-content-master.md` |
| 2 | **REVELADO 2.2** | experiencia, dirección de arte, motion, estados | `docs/05a-revelado-2.2.md` (texto) + canvas visual: https://claude.ai/artifact/Uk8Y5fiQnzFDCMq1NbmuHM |
| 3 | **Master Implementation Spec** (rev 37, 29 secciones) | arquitectura, componentes, estado, contratos de assets, fases, QA, aceptación | `docs/05-revelado-implementation-spec.md` |
| 4 | Código existente (ENSAMBLE, legado) | nada: se reutiliza sólo lo marcado KEEP/EXTEND | `src/**` — ver `docs/06-phase0-audit.md` |

Otros documentos: `docs/06-phase0-audit.md` (Phase 0 hecha: KEEP / EXTEND / REWRITE / RETIRE, assets encontrados y faltantes, riesgos). `docs/01–04` son historia de ENSAMBLE: **no son fuente de verdad** de REVELADO (sólo `03-assets-manifest.md` sirve como inventario de `public/projects/**`).

Antes de cada fase: releer los capítulos del Spec que ella cita (§26 tiene la tabla fase → capítulos → criterios de aceptación) y las secciones del Content Master que alimentan su copy.

## 2. Estado actual

- **Phase 0 · Audit: hecha** (`docs/06-phase0-audit.md`).
- **Phase 1 · Foundation: NO empezada.** El código sigue siendo ENSAMBLE (Next 16.3.7, React 19.2.8, TS 5.9 strict, Tailwind 4, GSAP 3.15). No hay tests ni Playwright instalados todavía.
- Trabajar **una fase por vez** (Spec §26): no empezar una fase hasta que pasen los criterios de aceptación de la anterior. Al terminar Phase 1: escribir `docs/07-phase1-foundation.md` y detenerse a reportar.
- Primera tarea pendiente: ejecutar Phase 1 según el brief del propio Spec §26 (tokens, tiers, `globals.css`, `layout.tsx` con Schibsted Grotesk, capa de datos, contratos de assets, componentes de media, `lib/motion`, `useScene`, `journey-store`, geometría, route sync, acción de contacto, skeleton del Journey).

## 3. No negociables

**Diseño y contenido**
- No rediseñar. No crear "REVELADO 2.3". No reescribir copy. No reabrir el posicionamiento. Si el Spec y el Content Master chocan en copy → gana el Content Master; en implementación → gana el Spec; ante duda real → documentar en `docs/` y preguntar, no inventar.
- **Nunca inventar** clientes, resultados, métricas, URLs, features, testimonios, tiempos de respuesta. Lo no confirmado lleva `[CONFIRMAR]` en el Content Master y **no se publica como hecho**.
- Los **placeholders nunca se entregan como evidencia falsa**: toda pieza sin asset final usa `Placeholder` (visible y honesto) y el estado `placeholder` del registro de assets. Un build de producción con assets obligatorios sin `final` debe quedar bloqueado/avisado según Spec §22.
- Hechos congelados (Content Master, ronda 1): TravelSuite360 → rol **"Socio · Producto e ingeniería"** (3 socios; Franco lidera todo el software; **3 agencias lo usan**; prueba "Producto real, en uso en tres agencias."). **Nunca** "fundador" ni "solo". Santi Nuca es diseñador de imagen y dueño de la fotografía (crédito "Fotografía · Santi Nuca"); rol de Franco "Diseño y desarrollo". Chef Arturo → "Producto, diseño y desarrollo", prueba "Tienda real, en línea." (no afirmar pagos en producción hasta confirmar Mercado Pago live); marca y fotografía no se atribuyen a Franco. Rayo Smash es el demo de Prospector ("Diseño, motion y desarrollo"). Seis capacidades; la sexta, "Adquisición de clientes" ("Publicidad en Meta Ads, orientada a ventas."), **sin métricas**.
- Textos clave: hero **FRANCO / NÚÑEZ**; firma "Producto × Diseño × Ingeniería"; CTA "Ahora, el tuyo."; éxito "Brief recibido."; busto "Todo lo anterior pasó por las mismas manos."

**Scroll y motion**
- **Scroll vertical nativo siempre. La rueda vertical nunca se captura.** Sin smooth scroll propio, sin scroll hijacking. Drag/gestos horizontales sólo dentro del reel y del riel.
- **No agregar** Three.js, R3F, Lenis, Framer Motion, librerías de carrusel ni de estado. Se mantienen sólo: Next, React, GSAP (+ ScrollTrigger), Tailwind. (Framer Motion aparece en el contenido sólo como stack de Prospector, no como dependencia de este sitio.)
- Una sola animación decorativa de video activa a la vez. Prohibido: bounce, springs, flotación, parallax continuo.
- `prefers-reduced-motion`: reglas **scoped**; **nunca** `* { transition: none }`.
- Arquitectura: journey renderizado en servidor + capa de motion cliente; cada sección dueña de su timeline GSAP (`useScene`/`WorldScene`); store mínimo con `useSyncExternalStore`; cuatro tiers (xl ≥1440, lg 1024–1439, md 768–1023, sm <768); CSS 3D sólo en lg/xl; ruteo híbrido (`/` y `/trabajo/[slug]` renderizan el mismo Journey; `replaceState` al scrollear, `pushState` en navegación explícita; sin `router.push`). Detalles: Spec §01–§05, §15, §20.

**Contacto**
- Server Action con honeypot + timing + rate limit en memoria + Resend por `fetch`. **Éxito sólo tras un 2xx de Resend**; sin variables configuradas = error honesto, nunca éxito silencioso. Variables en `.env.example`: `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`.

**Privacidad**
- TravelSuite360: sólo datos demo en cualquier captura/grabación; checklist en Spec §23 antes de integrar media.

## 4. Fuentes

Recomendada y decidida: **Schibsted Grotesk** (variable, latin, OFL), auto-hospedada con `next/font/local`. Google Fonts **no es accesible** desde el entorno de sesiones anteriores; la vía usada fue el paquete npm (`@fontsource-variable/schibsted-grotesk`, archivo `files/schibsted-grotesk-latin-wght-normal.woff2` + `LICENSE`) → copiar a `src/fonts/`. Mono: IBM Plex Mono (ya en `src/fonts/`; pregunta abierta no bloqueante, Spec §29). Retirar Archivo Narrow e IBM Plex Sans cuando el reemplazo esté en pie.

## 5. Assets

- Reales hoy: `public/projects/{prospector,santi-nuca,chef-arturo}/**` (24 PNG ~2550×1325; nunca servir crudos → `Still`/next-image y pipeline `scripts/media.mjs` con `sharp`, que ya está en `node_modules`). **TravelSuite360: ninguno.** **Franco: ni retrato, ni busto, ni video.**
- Contrato único: `data/assets.ts` + `lib/assets.ts` (Spec §22), estados `final | placeholder | derived`. Los componentes de media (`LoopVideo`, `ProofMedia`, `Still`, `Cutout`, `Placeholder`) no conocen paths: piden claves al registro.
- Faltantes y qué bloquea el lanzamiento: tabla "ASSETS MISSING" en `docs/06-phase0-audit.md`.

## 6. Comandos

```
npm install
npm run dev        # http://localhost:3000
npm run build
npm run lint
npx tsc --noEmit
```

Verificar con `tsc --noEmit`, `eslint` y `next build` antes de cada commit de fase. Node 22.

## 7. Git

- Rama `main`. El remoto es `origin` (https://github.com/Fran-Nu10/MiPortafolio). Historia local preparada por la sesión de diseño: los commits posteriores a `0e5ea8f` (ENSAMBLE, Phase 0 y este handoff) pueden no estar aún en GitHub; si `git log origin/main..HEAD` los lista, pushear con un `git push origin main` normal (**nunca force-push**).
- Commits pequeños por fase/tarea. Mensajes en inglés, imperativo, como el historial existente.
- No borrar `docs/01–04` ni `public/projects/**` sin pedirlo.

## 8. Cómo trabajar

1. Leer §1 (autoridad) y la fase pedida en Spec §26.
2. Releer los capítulos del Spec y las secciones del Content Master que la fase cita.
3. Implementar sólo esa fase, sin adelantar trabajo de fases posteriores ni rediseñar.
4. Verificar (tsc, eslint, build; tests cuando existan), actualizar `docs/0N-*.md` de la fase y reportar: qué se hizo, qué falta, qué decisiones se tomaron, qué assets bloquean.
5. Ante un conflicto o un hueco real, escribirlo en el reporte con la opción por defecto elegida; no inventar contenido.
