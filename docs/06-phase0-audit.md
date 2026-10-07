# 06 · Phase 0 — Audit + Reuse Map

Fecha: 2026-10-07 · Base: `main` @ 806590c (ENSAMBLE, implementación completa) · Destino: REVELADO 2.2 según *REVELADO — Master Implementation Spec* (en adelante MIS).

Estado del repo antes de tocar nada: working tree limpio, `tsc --noEmit` OK, `eslint` OK, `next build` OK (verificado en la fase anterior). Stack: Next 16.3.7 · React 19.2.8 · TypeScript 5.9 strict · Tailwind 4.3 · GSAP 3.15. Sin dependencias extra. Node 22.

Orden de autoridad aplicado: Content Master → Revelado 2.2 → MIS → código existente.

## KEEP

| Archivo | Por qué se queda |
|---|---|
| `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `package.json` (deps) | Correctos para REVELADO. Solo se agregan `images.formats` (AVIF/WebP) y los scripts de test/assets. |
| `src/app/page.tsx` | Sigue siendo "renderizar la experiencia"; el componente que importa cambia. |
| `src/app/layout.tsx` | Patrón `next/font/local` + metadata + viewport correcto; cambian fuentes, `lang`, metadata (ver EXTEND). |
| `src/lib/store.ts` (mecanismo `useSyncExternalStore`) | Es exactamente el store mínimo que pide MIS §04. Cambian los campos. |
| `src/lib/useScene.ts` | Es el patrón "una sección = un contexto GSAP + un ScrollTrigger" con rebuild por ancho y snap a labels `rest…` que MIS §05 exige. |
| `src/lib/motion.ts` (`registerGsap`, `prefersReducedMotion`, `isCoarsePointer`) | Correctos. |
| `src/app/actions/brief.ts` (server action, honeypot, Resend por `fetch`) | Es la arquitectura recomendada por MIS §14. Cambian campos y validación. |
| `public/projects/**` (24 capturas PNG reales, 2548×1324 aprox.) | Único material real. Se mueven a `public/media/*` recién en Phase 12. |
| `docs/01–05` | Historia y fuentes. No se tocan. |
| `.gitignore`, `README.md` (se actualiza al final de Phase 1) | — |

## EXTEND

| Archivo | Qué cambia |
|---|---|
| `src/lib/motion.ts` | Tokens ENSAMBLE (`EASE.snap/product`, `DUR`, `ISO`) → tokens REVELADO (`settle`, `reveal`, `dolly`, `steps`), tiers `xl/lg/md/sm`, `GESTURE_VH`, `directionalSnap`, `tierQueries`. |
| `src/lib/useScene.ts` | Labels `s:` (snap) y `m:` (marcador), `gsap.matchMedia` por tier + `rm`, `api.auto` (segmentos temporales disparados por label), `onState`. Se conserva el rebuild por ancho y el re-sort de triggers. |
| `src/lib/store.ts` → `journey-store.ts` | Campos ENSAMBLE (`step`, `status`, `frame`, `grid`, `tone`, `brief`, `ready`) → `heroRevealed`, `section`, `endActive`. |
| `src/app/actions/brief.ts` | Input `name/what/kind` → `name/email/brief` + `company` (honeypot) + `t` (timing); validación de email; rate limit en memoria; ruta no configurada = **error** (nunca éxito silencioso). |
| `src/app/layout.tsx` | Schibsted Grotesk self-hosted; `lang="es"`; metadata desde `data/site`; `.js` gating inline. |
| `src/app/globals.css` | Reescritura: tokens REVELADO, 4 tiers, regla reduced-motion **scoped** (se conserva la lección de Phase I: nunca `* { transition: none }`), `.js` gating. |
| `src/data/site.ts`, `src/data/projects.ts` | Reescritura al modelo MIS §21 con el copy del Content Master (ronda 1). |

## REWRITE

| Archivo | Qué sirve, qué no |
|---|---|
| `src/components/system/Cursor.tsx` | Sirve: rAF/quickTo + detección de puntero fino + `data-cursor` ancestor. No sirve: modos ENSAMBLE (inspect/measure/separate/magnet). Se reescribe en Phase 3 como cursor del reel (DRAG · VER · → ←). |
| `src/components/system/Preloader.tsx` | La idea "no es un loader; entra limpio aunque el media no esté" se mantiene, pero el opening REVELADO es otro (banda de luz, foco). Phase 2. |
| `src/components/scenes/Final.tsx` (formulario) | Patrón `useActionState` + estados + lectura de completitud se conserva conceptualmente; markup y copy se rehacen (Nombre · Email · Brief). Phase 1. |

## RETIRE (cuando exista el reemplazo; no antes)

| Archivo | Reemplazo | Cuándo |
|---|---|---|
| `src/components/Experience.tsx` | `components/journey/Journey.tsx` | Phase 1, al renderizar el nuevo shell |
| `src/components/scenes/*` (Opening, Work, Capabilities, Process, Lab, About, Technology, Final) | secciones REVELADO | Phase 1 (skeleton estático) |
| `src/components/system/*` (Frame, Cota, Stack, Capture, ReservedFace, Sheet, Preloader, Cursor) | ninguno equivalente (vocabulario ENSAMBLE) | Phase 1, salvo Cursor (minado en Phase 3) |
| `src/data/system.ts` | — | Phase 1 |
| `src/fonts/archivo-narrow-*`, `ibm-plex-sans-*` | Schibsted Grotesk | Phase 1 |
| `src/fonts/ibm-plex-mono-*` | **se conserva** como mono (Open Engineering Question 6, NON-BLOCKING) | — |
| CSS ENSAMBLE en `globals.css` (`.t-display`, `.dot-grid`, `.axis-*`, `.iso-space`, cotas, preloader) | tokens REVELADO | Phase 1 |

Dependencias verificadas antes de retirar: `page.tsx → Experience → scenes/* → system/* → lib/* + data/*`. Ningún archivo fuera de `components/` importa `components/*`; `actions/brief.ts` no depende de componentes. Retirar `components/*` + `data/system.ts` no rompe `lib/` ni `app/`. Las fuentes solo las importa `layout.tsx`.

## ASSETS FOUND

**Franco** — ninguno (sin retrato, sin busto, sin video).

**TravelSuite360** — ninguno (`public/projects/travelsuite360/` vacío). Único proyecto sin material real.

**Rayo / Prospector** (`public/projects/prospector/`, 6 PNG, ~2548×1324): `hero-exploded`, `hero-exploded-scroll`, `hero-layer-detail`, `menu-tracklist`, `product-clasica`, `section-plancha`. Sirven como: poster del reel (hero-exploded), poster de SCREEN, fuente para derivar el cutout de la burger entera y bandas de capas (coordenadas aproximadas identificadas en Revelado 2.1: bun 40–165 · bacon 195–300 · onion 480–580 · patty 615–720 · bottom bun 760–831 sobre 1600×831).

**Santi Nuca** (`public/projects/santi-nuca/`, 8 PNG): `opening`, `work-01`, `work-02-diptych`, `work-03-detail`, `editorial-forma-linea-textura`, `work-04`, `work-05`, `work-06`. Sirven como poster del reel/SCREEN y como recortes provisorios de las fotos 1–6 (no originales; autoría fotográfica: Santi Nuca).

**Chef Arturo** (`public/projects/chef-arturo/`, 10 PNG): `hero`, `hero-expansion`, `hero-fullbleed`, `detalle-intro`, `detalle-expansion`, `detalle-fullbleed`, `fechas-que-importan`, `elegi-tu-ocasion`, `catalogo-merienda`, `pdp-cookie-levain`. Sirven como poster del reel/SCREEN, recorte provisorio del producto (pdp) y hermanos del catálogo.

**General** — fuentes IBM Plex Mono 400/500 (woff2, licencia incluida). Sin grain, sin OG images.

## ASSETS MISSING (según contrato MIS §22)

| Clave | Estado | Bloquea lanzamiento |
|---|---|---|
| `franco.hero.desktop/mobile` (cutout alpha) | no existe | **sí** |
| `franco.bust` | no existe | no (placeholder) |
| `franco.atWork.*` | no existe | no (sección apagada por flag) |
| `moments.human` | no existe | no (sección apagada por flag) |
| `ts.reel.poster.*`, `ts.screen`, `ts.proof.*` | no existen | **sí** (TravelSuite necesita capturas reales, con datos demo y revisión de privacidad) |
| `{p}.reel.loop.*` (×4) | no existen | no (posters) |
| `{rayo,santi,chef}.proof.*` | no existen | sí para el proof de cada uno (ventana con poster, sin play hasta tenerlo) |
| `rayo.burger`, `rayo.layers.*` | derivables de la captura; cutouts finales a producir | no |
| `rayo.through.*` | a producir | no (R05 se omite) |
| `santi.photo.1..6` originales | a pedir a Santi Nuca | no para dev (recortes), sí para lanzamiento con calidad |
| `chef.product` original, `chef.macro.loop` | a producir | no (still) |
| `og.home`, `og.{p}` | a producir | no (fallback: sin og:image) |
| Schibsted Grotesk woff2 | **ver RISKS** | no |
| Evidencia Meta Ads | no existe | no (variante tipográfica es el estado de producción) |

## RISKS (solo técnicos reales)

1. **Fuentes.** No hay archivos de Schibsted Grotesk en el repo ni acceso garantizado para descargarlos aquí. Phase 1 instala el pipeline de `next/font/local` con el archivo si se obtiene de la fuente oficial (Google Fonts, licencia OFL); si no, fallback de sistema con `size-adjust` y documentado como NON-BLOCKING. La métrica del hero (FRANCO/NÚÑEZ) solo se puede afinar con la fuente real.
2. **TravelSuite360 sin material.** Todo el mundo TS (Phase 5) se construye sobre placeholders; la geometría `anchorRect` del mensaje en el poster no se puede fijar hasta tener la captura real. Diseño de contrato listo; valor pendiente.
3. **Capturas PNG de 0.3–2.8 MB.** Nunca deben servirse crudas. `next/image` resuelve posters (`Still`); los cutouts pasan por `scripts/media.mjs` (sharp). Si sharp no está disponible en el entorno de build, los cutouts se generan localmente y se commitean (están bajo `public/media`).
4. **Rate limit en memoria** en serverless es best-effort (MIS §14 lo acepta). Sin KV hasta observar abuso.
5. **Push al remoto**: 403 desde este entorno (repo fuera del set autorizado). Los commits se hacen localmente y se exporta bundle/patches.

Sin blockers reales para Phase 1.
