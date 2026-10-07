# 07 · Phase 1 — Foundation

Fecha: 2026-10-07 · Base: `main` @ `92b8c36` (merge del handoff) · Spec: *REVELADO — Master Implementation Spec* rev 37 (MIS), §26 fila "1 · Foundation". Autoridad: Content Master rev 26 → REVELADO 2.2 → MIS → código ENSAMBLE.

## 1. Resultado

Una página en marcha con el **esqueleto del Journey**: cada sección presente como HTML estático legible, con el copy real del Content Master y placeholders honestos; header; rutas `/` y `/trabajo/{slug}`; formulario funcional (con y sin JS); tests de contenido; verificador de assets. Sin motion de escena todavía (eso empieza en Phase 2).

| Criterio de aceptación (MIS §26) | Cómo se verificó | Estado |
|---|---|---|
| Página sin JS legible de punta a punta | e2e `without JavaScript` (6 viewports) + test de HTML renderizado sobre el build (5 rutas) | ✅ |
| Content tests pasan (sin "fundador", crédito de Santi, campos gated ocultos) | `tests/content.test.ts` (reglas 1–6 de MIS §21 + fidelidad de copy + HTML) | ✅ 37 tests |
| 0 errores de consola | e2e en build de producción, 5 rutas × 6 viewports, recorrido completo | ✅ |
| 0 warnings de hidratación | dev server (React solo los emite en dev): recorrido completo, consola limpia | ✅ |
| CLS ≤ 0.02 (Lighthouse) | e2e con `PerformanceObserver` de `layout-shift` en un scroll completo, todos los viewports | ✅ (ver §6: no es Lighthouse CI) |

Extras verificados: sin overflow horizontal en 1440/1366/820/390/320 en todas las posiciones de scroll muestreadas; la rueda vertical nunca se captura; `replaceState` al scrollear sin crear entradas de historial; `/trabajo/nope` → 404 "No existe."; deep link arranca en el mundo.

## 2. Qué se hizo, por sistema

**Sistema de diseño** — `src/app/globals.css` reescrito: tokens REVELADO 2.2 (black `#0B0B0C`, paper `#EDE8DE`, paper-2, muted, signal `#E63B2E`, ink, panel) en `@theme`; breakpoints de Tailwind reemplazados por los **cuatro tiers** (md 768 · lg 1024 · xl 1440; sm por defecto); escala tipográfica fluida (`--hero-size`, `--type-display/statement/lead/body/micro`) por tier según MIS §15; `.js` gating; regla reduced-motion **scoped** (solo elementos interactivos; nunca `*`); cajas de media con `aspect-ratio` reservado. Estilos editoriales mínimos del esqueleto (no es el diseño final de cada sección).

**Tipografía** — Schibsted Grotesk variable (latin, wght 400–900, OFL, 46 KB) desde `@fontsource-variable/schibsted-grotesk@5.3.0` (`npm pack`, archivo copiado a `src/fonts/` con su licencia; no queda como dependencia). `next/font/local`, `display: swap`, fallback métrico Arial. IBM Plex Mono 400 conservado como mono (MIS §29 Q6). Retirados: Archivo Narrow 500/700, IBM Plex Sans 400/500, Plex Mono 500. `<html lang="es">`, metadata de Content Master 17, `themeColor #0B0B0C`, skip link.

**Datos tipados** (`src/data/`, MIS §21) — `types.ts` (modelo + `Gated<T>` + contratos), `projects.ts` (cuatro proyectos, orden fijo), `site.ts` (nav, hero, reel, CTA, microcopy, meta, flags), `capabilities.ts` (seis), `profile.ts`. Copy literal; donde 00 (ronda 1) y 06–09 difieren, gana 00. Todo `[CONFIRMAR]` es `status: "pending"` y no se renderiza.

**Contratos de assets** (MIS §22) — `data/assets.ts` (40 contratos: 3 `derived` desde capturas reales, 37 `placeholder`), `lib/assets.ts` (resolver server-only), `lib/resolved.ts` (tipos sin registro, para que el registro nunca llegue al bundle cliente). Media de TravelSuite360 sin `privacyChecked: true` resuelve **siempre** a placeholder.

**Componentes de media** (`components/media/`) — `Placeholder` (campo plano + filete 1px; clave visible solo con `NEXT_PUBLIC_SHOW_ASSET_KEYS=1`), `Still` (`next/image`, AVIF/WebP, caja reservada, alt visible debajo si la imagen falla, art direction con `getImageProps`), `Cutout` (`<picture>` AVIF/WebP 1x/2x, `fetchpriority`), `LoopVideo` (solo cliente, nunca con reduced motion ni Save-Data, invisible hasta el primer frame, timeout 4 s, registro de un solo loop activo), `ProofMedia` (autoplay ≥ 60 % en vista, play/pausa visible, sin video: poster real sin botón o placeholder). Ninguno conoce paths.

**Infraestructura GSAP** — `lib/motion.ts` (registro, `CustomEase` "settle"/"reveal" — GSAP no parsea `cubic-bezier()`, tokens `dolly`/`steps`/`none`, `usePrefersReducedMotion`, puntero por media query), `lib/tiers.ts` (tiers, `SCENE_CONDITIONS` xl/lg/md/sm/rm/tiny, `GESTURE_VH` 80/70/60, RM 50vh, `labelStops`, `snapToStop` direccional a `s:` saltando `m:`, `stepToStop`), `lib/useScene.ts` extendido: `gsap.matchMedia` por tier + rm, labels `s:`/`m:`, `api.auto(label, build)`, `onState` + `data-state`, `onToggle`, pin = units × gesto, stepping en RM y viewports diminutos, try/catch → la sección cae a su layout estático (quita `data-anim`), refresh tras fuentes, re-sort de triggers, rebuild por ancho conservado.

**Estado de navegación** — `lib/journey-store.ts` (`heroRevealed`, `section`, `endActive`; `useSyncExternalStore`, writes idempotentes). Reemplaza `lib/store.ts`.

**Geometría** — `lib/geometry.ts`: `reelRect` (76vw máx. 1094 / 76vw / 84vw / 100vw−32; tope 72svh / 64svh manteniendo aspecto; centrado o top 18svh en sm), `reelTrackX`, `neighbourVisible`, `designScale` (1440×900 / 390×844), `zForScale` (z = P·(1 − 1/s)), `placeRect`. Testeado contra los valores de REVELADO (1094×616 en x 173 a 1440×900; 141 px de vecina).

**Sincronización de rutas** — `lib/route-sync.ts` (sección ↔ URL), `components/journey/JourneyClient.tsx` (un ScrollTrigger por `[data-section]` → store → `replaceState` + `document.title`; salto instantáneo en deep link con `scrollRestoration` manual solo durante el salto). Ruta `app/trabajo/[slug]/page.tsx` (SSG, `dynamicParams = false`, metadata por proyecto) y `app/not-found.tsx`. Sin `router.push`.

**Contacto** — `lib/brief.ts` (núcleo puro e inyectable) + `app/actions/brief.ts` (wrapper con IP desde headers). Honeypot `company`, timing `t` (< 3 s → éxito silencioso), rate limit en memoria 5 / 10 min por IP, validación (nombre 2–120, email ≤ 254 + patrón, brief 4–2000), Resend por `fetch` (texto plano, `reply_to` = visitante, asunto `Brief · {nombre}`). **Éxito solo tras 2xx**; sin variables = error honesto. `BriefForm` con `useActionState` (funciona sin JS), validación al enviar y luego en vivo por campo, foco al primer error, `aria-invalid`/`aria-describedby`, alerta de ruta, lectura de completitud 20/20/60. `EndSequence` en forma estática (la secuencia es Phase 10).

**Journey** — `components/journey/Journey.tsx` (server): lee `data/`, resuelve gating y contratos, ordena S0–S15; secciones en sus rutas finales de MIS §03, como server components que reciben el copy por props: `OpeningHero`, `ProjectReel`, `WorldScene` (estructura de stage de §07), `ProjectProof`, `HumanMoment`/`FrancoAtWork` (apagados por flag), `CapabilitiesRail` + `EvidenceSlot`, `Profile`, `FinalCta` + `MinimalFooter`, `SiteHeader` (cliente).

**Retirado (ENSAMBLE)** — `components/Experience.tsx`, `components/scenes/*`, `components/system/*` salvo `Cursor.tsx`, `data/system.ts`, `data/live.ts`, `lib/store.ts`, fuentes ENSAMBLE, CSS ENSAMBLE. `next.config.ts`: sin `frame-src` de Live Windows (REVELADO no embebe nada), `images.formats` AVIF/WebP. `Cursor.tsx` queda sin usar, intacto, para minarlo en Phase 3 (auditoría §REWRITE).

**Herramientas** — `scripts/check-assets.mjs` (corre en `prebuild`), `vitest` (dev), `@playwright/test` (dev, Chromium). Scripts: `typecheck`, `test`, `test:e2e`, `check:assets`, `check:launch`.

## 3. Pruebas

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npx eslint` | ✅ 0 problemas |
| `npm run build` (incluye `check:assets`) | ✅ `/` estático + 4 rutas `/trabajo/*` SSG |
| `npx vitest run` | ✅ 61/61 (`content.test.ts` 37 · `foundation.test.ts` 24) |
| `npx playwright test` (build de producción, 6 proyectos: 1440, 1366, 820, 390, 320, 1440 RM) | ✅ 88 passed · 2 skipped (rueda en proyectos mobile, no aplica) |
| `npm run check:launch` | ❌ a propósito: 6 slots bloqueantes en placeholder (ver §5) |
| Dev server, recorrido completo | ✅ sin warnings de hidratación ni errores |

Orden para reproducir: `npm run build && npx vitest run && npx playwright test` (los tests de HTML y el e2e usan el build).

## 4. Decisiones tomadas (con la opción por defecto elegida)

1. **Auditoría desactualizada respecto de `main`.** La auditoría se hizo sobre `806590c`; `main` ya tenía ENSAMBLE V2 + copy en español (merges `4a2246e`, `5a9b39e`). El mapa KEEP/EXTEND/RETIRE seguía siendo válido; se retiraron además los archivos V2 (`LiveWindow`, `ModuleFace`, `ProjectWindow`, `Screen`, `data/live.ts`).
2. **Capturas de TravelSuite360 sí existen** en `main` (`public/projects/travelsuite360/*.png`, 4 archivos, datos de producción difuminados). La auditoría dice "ninguno". **No se usan**: MIS §23 exige datos demo controlados y firma de dos personas. Quedan como `candidates` del contrato `ts.reel.poster` con `privacyChecked: false`; un test asegura que no aparecen en la página.
3. **URLs "Abrir ↗"**: `data/live.ts` de ENSAMBLE tenía URLs verificadas (HTTP 200, 2026-10-01) para Rayo, Santi y Chef. El Content Master las marca `[CONFIRMAR]` → quedan `pending` con la URL como valor candidato; nunca llegan al HTML (test). Confirmarlas = cambiar `status` a `confirmed`.
4. **Error de ruta del formulario**: "No se envió. Probá de nuevo o escribí a hola@… [CONFIRMAR email]" → mientras el email no esté confirmado se muestra **"No se envió. Probá de nuevo."** (se omite el fragmento no confirmado, regla del Content Master 12).
5. **"solo" en TravelSuite360**: la one-liner del Content Master dice "en un solo lugar". La guarda de MIS §21 regla 2 se implementó como `(?<!un )\bsolo\b` (prohíbe "solo" como *alone*, permite "un solo lugar").
6. **Timing del formulario sin JS**: el estado de error devuelve el `t` original para que un re-render sin JS no reinicie el control (un e2e lo encontró: una corrección rápida caía como bot y mostraba "Brief recibido." sin enviar). Con JS, `t` se fija al hidratar.
7. **Capacidad 06 tipográfica**: sin elemento; el statement en cuerpo `lead` y la etiqueta mono es la atribución "Meta Ads" — no se duplica texto en pantalla. El sub-kicker "Después de publicar" va dentro de la tarjeta 06 (sigue accesible).
8. **Variantes por tier dentro de un contrato**: `franco.hero.desktop/.mobile` del Spec se modelan como una clave `franco.hero` con `files.desktop/mobile`. `anchorRect` vive solo en el contrato del poster (una sola fuente; Phase 4 la lee).
9. **`reelLine` explícito por proyecto**: categoría y línea del reel difieren en Rayo y Chef (Content Master 05 vs 07/09); se agregó el campo al modelo.
10. **Route sync y `/trabajo/[slug]` en Phase 1**: CLAUDE.md y el pedido los incluyen; `replaceState` hacia `/trabajo/{slug}` sin la ruta real rompería el reload. Se implementó lo mínimo correcto (ruta SSG + salto instantáneo + "Ir a {nombre}" sin JS). Pendiente para Phase 4: `pushState` en navegación explícita, `popstate`, overlay 01–04, inline CSS para evitar el flash del opening.
11. **Header**: siempre visible en Phase 1 (`JourneyClient` marca `heroRevealed` al montar); la aparición tras O2 llega con el opening en Phase 2. "Trabajo" es un ancla hasta que exista `ReelOverlay` (Phase 4).
12. **Momentos humanos**: `features.humanMoment` y `features.francoAtWork` en `false` (MIS §13); los componentes existen y se activan con el flag.
13. **Node**: el entorno corre Node 24.16; `engines` pide ≥ 22.18 (type stripping para `check-assets.mjs`).

## 5. Assets que bloquean el lanzamiento

`npm run check:launch` (y cualquier build con `VERCEL_ENV=production`) **falla** hasta que estos contratos tengan material final:

| Clave | Falta |
|---|---|
| `franco.hero` | retrato cutout con alpha ≥ 2400 px + recorte mobile 4:5 |
| `ts.reel.poster` | captura real de TravelSuite360 con datos demo + checklist §23 firmado |
| `ts.proof` | grabación de 8 s (TravelChat 3 s → CRM 2.5 s → IA 2.5 s), datos demo, §23 |
| `rayo.proof`, `santi.proof`, `chef.proof` | grabaciones reales 6–10 s |

Advertencias no bloqueantes: los tres posters derivados son PNG crudos (287 KB–1.2 MB) servidos vía `next/image`; Phase 12 los codifica. Resto de faltantes: tabla "ASSETS MISSING" de `docs/06-phase0-audit.md` (sigue vigente salvo el punto TS de la decisión 2).

> **Importante para el deploy**: si Vercel construye `main` en producción, ese build va a fallar por diseño (MIS §22: no se publica evidencia falsa). Los preview builds solo avisan.

## 6. Qué falta / pendientes

- **Lighthouse CI** no se corrió (no instalado). El CLS se midió en lab con `PerformanceObserver` en Chromium (equivalente al dato de Lighthouse para CLS); Lighthouse CI entra en Phase 11/12 (MIS §18).
- e2e solo en Chromium; WebKit y Firefox en Phase 11 (MIS §27).
- axe-core no está instalado todavía (MIS §19 lo pide desde Phase 3 en adelante).
- `scripts/media.mjs` (LQIP, cutouts) y el tile de grano: Phase 2.
- `sitemap.ts`/`robots.ts`, canonical y `metadataBase`: requieren el dominio `[CONFIRMAR]`.
- Preguntas abiertas que siguen sin respuesta (Content Master 19): Mercado Pago live, extracción IA de TS, demos de Prospector ("Cada negocio recibe la suya."), fotos de Rayo, evidencia Meta Ads, URLs, email, LinkedIn, stack habitual.
- Copy a confirmar con Franco (se publica tal cual el Content Master lo da como final, pero tiene nota `[CONFIRMAR]` en su sección): módulos del micro case de TS en producción; línea de origen de TS; "Sitio real, en línea." de Santi (claim 22). El micro case de Rayo incluye "Stack documentado: …" y además se muestra la línea `Stack · …` (MIS §09): la duplicación es del Content Master; no se reescribió.

## 7. Próximo paso

**Phase 2 · Opening + Hero** (MIS §26): `OpeningHero` cliente (O0–O3, H1, H2) sobre el markup de este esqueleto, grano, pipeline LQIP (`scripts/media.mjs`), aparición del header tras O2. Releer MIS §02 S1, §03 (hero stack), §15, §16 y Content Master 04 antes de empezar. Corre sobre el placeholder del retrato hasta que exista `franco.hero`.
