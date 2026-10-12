# 18 · Phase 12 — Performance + Media

Fecha: 2026-10-11 · Base: `main` @ `ae4f0a9` · Spec: *REVELADO — Master Implementation Spec* rev 37 (MIS), §26 fila "12 · Performance + media" (capítulos §17 medios, §18 presupuestos, §22 contratos, §23 privacidad). Criterio de aceptación: «Lighthouse budgets met; asset checker green; privacy sign-off on all TS media; no launch-blocking placeholder».

**Resultado en una línea:** la experiencia es rápida donde depende del código (desktop 99–100, CLS 0, TBT ≤ 1 ms, ≥ 149 fps en el peor caso de scroll), se corrigieron cuatro defectos medidos (CLS 1,0 en los deep links, TBT de hidratación, descargas duplicadas, **una fuga de privacidad**), pero **la fase no se puede declarar aprobada**: dos presupuestos del §18 fallan por razones estructurales documentadas (JS inicial y LCP móvil) y los tres criterios de material (`check:launch`, firma de privacidad de TS, placeholders bloqueantes) dependen de entregas externas que no existen.

## 1. Método (todo medido, nada estimado)

| Medición | Herramienta | Condiciones |
|---|---|---|
| Lighthouse | Lighthouse 13.5.0 (instalado aparte en el scratchpad, no en el proyecto) sobre el Chromium 1248 de Playwright, headless | build de producción (`next build` + `next start`, gzip); **3 corridas por ruta y factor de forma, mediana**; móvil = perfil por defecto (Moto G Power, slow 4G simulado, CPU 4×, *lantern*); desktop = `--preset=desktop`; además móvil con **throttling aplicado** (`--throttling-method=devtools`) para LCP/TBT reales |
| Transferencias | Playwright + CDP `Network` (`encodedDataLength`), caché desactivada | `/` y `/trabajo/travelsuite360`, 1440×900 y 390×844 (DPR 3): todo lo transferido antes de scrollear (carga + 4 s) y después, recorriendo el documento entero |
| Duplicados | mismo análisis | la misma URL dos veces, o el mismo asset en dos anchos/formatos |
| Scroll | método de Phases 5–8: Chromium new-headless sobre la **GPU real** (ANGLE D3D11, RTX 5060), rueda real 36 px / 16 ms, frames por `requestAnimationFrame`, CPU 1× / 4× / 6× | **el journey completo** de arriba abajo, atribuido por sección; long tasks por `PerformanceObserver` |
| Medios | Playwright | el journey completo en normal, Save-Data, 2G y reduced motion: pedidos de video, videos montados y reproduciéndose |
| Promoción GPU | estilos computados por punto del journey | `will-change`, transforms 3D, miembros de contextos `preserve-3d` |

Archivos: `qa/phase12/lighthouse/*.json` (90 reportes), `qa/phase12/{before,after}/budget.json`, `qa/phase12/fps.json`.

## 2. Lighthouse — antes / después (medianas de 3)

| Ruta · forma | Perf | LCP | TBT | CLS | FCP | SI |
|---|---|---|---|---|---|---|
| `/` desktop | 99 → **100** | 0,73 → 0,72 s | 71 → **1 ms** | 0 → 0 | 0,25 s | 0,47 s |
| `/` móvil | 75 → **88** | 3,42 → 3,35 s | 645 → **224 ms** | 0 → 0 | 0,94 s | 1,51 s |
| `/trabajo/travelsuite360` desktop | **73 → 100** | 0,77 → 0,71 s | 120 → **1 ms** | **1,000 → 0** | 0,25 s | 0,53 s |
| `/trabajo/travelsuite360` móvil | 72 → **87** | 3,49 → 3,36 s | 800 → **262 ms** | 0 → 0 | 0,94 s | 1,68 s |
| `/trabajo/rayo-smash` desktop · móvil | — → 100 · 83 | 0,81 · 4,21 s | 0 · 201 ms | 0 · 0 | | |
| `/trabajo/santi-nuca` desktop · móvil | — → 99 · 80 | 0,89 · 4,93 s | 0 · 160 ms | 0 · 0 | | |
| `/trabajo/chef-arturo` desktop · móvil | — → 100 · 82 | 0,80 · 4,59 s | 1 · 130 ms | 0 · 0 | | |

Accesibilidad, Best Practices y SEO: **100 / 100 / 100** en las diez combinaciones. Las rutas de Rayo, Santi y Chef se midieron sólo después (la línea base cubrió `/` y TS).

**Throttling aplicado (móvil real emulado, `/`):** LCP **5,06 s → 3,01 s** (antes/después de la corrección §4.4), TBT 749 ms, FCP 1,81 s. `/trabajo/travelsuite360`: LCP 5,15 s, TBT 832 ms.

## 3. Presupuestos del §18

| Presupuesto | Límite | Medido (después) | Estado |
|---|---|---|---|
| LCP desktop | ≤ 1,8 s | 0,71–0,89 s (todas las rutas) | ✅ |
| LCP móvil | ≤ 2,5 s | `/` 3,35 s (lantern) · 3,01 s (aplicado) | ❌ estructural (§5.2) |
| CLS | ≤ 0,02 | **0** en las diez combinaciones | ✅ (era 1,0) |
| TBT desktop | ≤ 100 ms | 0–1 ms | ✅ (era 71/120) |
| TBT móvil | ≤ 250 ms | `/` 224 ✅ · TS 262 ❌ · Rayo 201 · Santi 160 · Chef 130 (lantern); 749 ms con throttling aplicado ❌ | ⚠ |
| JS inicial | ≤ 170 KB gz | **225,8 KB** | ❌ estructural (§5.1) |
| — de eso GSAP + ScrollTrigger (+ CustomEase) | ≈ 45 KB | ≈ 48–49 KB (medido sobre `gsap/dist`) | ✅ |
| CSS | ≤ 30 KB gz | 11,6 KB | ✅ |
| Fuentes | ≤ 90 KB, 2 archivos precargados | 60,9 KB (Schibsted 46,1 + Plex Mono 14,8), 2 precargas | ✅ |
| Medios eager antes de scrollear | ≤ 200 KB desktop · ≤ 130 KB móvil | 23,2 KB · 21,4 KB (grano 7,7 + un póster del reel; el favicon de 25,8 KB aparte) | ✅ |
| Póster del reel (AVIF) | ≤ 120 KB · ≤ 70 KB | 15,5 KB (w 1200) · 13,8 KB (w 1080) | ✅ |
| Clip Rayo | ≤ 2,5 MB | 1,22 MB (AV1) | ✅ |
| Stills / cutouts en mundos | ≤ 250 KB · ≤ 150 KB | todos dentro (`check-assets`; los pósters crudos se sirven por el optimizador en AVIF) | ✅ |
| Loops, pruebas, Franco at work | — | no existen (placeholder) | n/a |
| Scroll ≥ 55 fps (desktop) | sostenido | journey completo: 178 fps (1×), 170 (4×), **149 (6×)**; peor sección 132 fps (hero/TS a 6×); 2–27 frames > 18,2 ms de 5 000–7 800 | ✅ en este equipo (no es el MacBook Air 2020) |
| Long tasks durante el scroll | ninguna > 50 ms | 0 (una de 59 ms en md 4×) | ✅ |
| Una sola animación de video | — | máx. 1 reproduciéndose; Save-Data, 2G y RM: **0 pedidos de video, 0 elementos `<video>`** | ✅ |
| Memoria | — | heap JS 7–9 MB al final del journey; 1 245–1 345 nodos | (sin presupuesto) |
| Promoción GPU | ≤ 16 desktop · ≤ 8 móvil | candidatos a capa: desktop TS ≤ 16 (`ts-camera`, `ts-group`, miembros 3D) · Rayo 9; móvil TS 3 `will-change` + miembros de un `preserve-3d` sin transforms 3D | ✅ desktop · ⚠ móvil sin verificar en el panel Layers (§7) |

## 4. Optimizaciones (cada una por un cuello de botella medido)

1. **CLS 1,0 en todos los deep links (desktop).** El salto a la escena se emitía en el mismo frame que el `refresh` de los pins y Chromium contaba el escenario entero como un desplazamiento de 1,0 (reproducido y aislado con un observer de `layout-shift`: el salto diferido 2 frames lo elimina). `JourneyClient` aterriza dos frames después del refresh; el hero sigue oculto mientras tanto. **CLS 1,000 → 0.**
2. **TBT de hidratación.** Todas las escenas se construían dentro del commit de hidratación (una tarea de ≈ 0,5 s en el CPU móvil de Lighthouse) y retrasaban el opening. `useScene` ahora construye en su propia tarea, en orden de documento, toda escena que arranque más de 1,5 viewports por debajo; las cercanas, al instante. `scenesReady()` (todas las raíces `data-scene-root` construidas y la cola vacía) gobierna el aterrizaje de deep links y recargas. **TBT móvil 645 → 224 ms (`/`), 800 → 262 ms (TS); desktop 71/120 → 1 ms.** Se probó además hidratación progresiva con `<Suspense>` y **se descartó**: React externaliza los límites grandes en nodos ocultos que revela un script, y el documento sin JS quedaba vacío (verificado).
3. **Descargas duplicadas.** Los tres pósters del elemento vivo de «Ingeniería web» se pedían en un segundo ancho (`w=640`/`w=1200`) además del que ya tenía el reel; con el mismo `sizes` el navegador reutiliza el ya descargado. **3 → 0 duplicados; −22 KB desktop, −49 KB móvil.** (El favicon aparece 8× sólo con la caché desactivada: Chromium lo vuelve a pedir en cada `replaceState`; con caché, una vez.)
4. **LCP con CPU lento.** El primer contenido del opening (el índice «00» en O2) dependía de que llegara todo el bundle: con throttling aplicado, 5,06 s. Si la escena aún no se construyó, ahora el CSS completa O2 por su cuenta al final de la banda (o al plazo de 2,5 s de decodificación cuando exista el retrato — la garantía de tiempo del §02 S1) y la escena continúa desde ahí. Se usa un paso de `visibility` y no un fundido de opacidad: una animación de opacidad corre en el compositor y el navegador no contaba el elemento como pintado. **LCP aplicado 5,06 → 3,01 s.** (Lantern no cambia — §5.2.)
5. **Fuga de privacidad (§23) — corregida.** Las cuatro capturas de ENSAMBLE de TravelSuite360 (datos de producción difuminados, **no aprobadas**) estaban en `public/` y se servían públicamente: `/projects/travelsuite360/*.png` → 200 y también vía `/_next/image?url=…` → 200; además sus rutas (`candidates`) y las notas internas de producción (`source`) viajaban en el payload RSC de cada página. Ahora: `rewrites.beforeFiles` las responde **404**, `images.localPatterns` limita el optimizador a las tres capturas aprobadas y `/media/**` (**400** para todo lo demás), y `resolveAsset` ya no envía `source` ni `candidates` al cliente. Los archivos siguen en el repositorio (CLAUDE.md §7: no se borran sin pedirlo). Tests: `content.test` (regla 7: ningún asset resuelto lleva notas; el HTML construido no nombra esas capturas) y `foundation.spec` (404/≥ 400 en las cuatro, 200 en una aprobada).

## 5. Incumplimientos y por qué (sin maquillar)

1. **JS inicial 225,8 KB > 170 KB.** Medido por chunk: React DOM + runtime de Next 16 = **≈ 140 KB** (react-dom 70,5 · next 35,3 · 10,1 · 8 · turbopack 3,9 · resto); el chunk de la app 85,8 KB, de los cuales GSAP + ScrollTrigger + CustomEase ≈ 49 KB (el §18 los cuenta como eager) y el código propio ≈ 37 KB. **Piso sin una línea de código propio: ≈ 189 KB.** El presupuesto no es alcanzable con este stack; dividir los constructores de los mundos en chunks dinámicos (la propia vía del §18) quitaría ≈ 15–20 KB y seguiría fallando, con un refactor de los cuatro mundos que no se hizo para no arriesgar regresiones en una fase de cierre. Decisión pedida: ajustar el presupuesto del §18 a la realidad medida del framework, o aceptar el refactor.
2. **LCP móvil 3,35 s (lantern) / 3,01 s (aplicado) > 2,5 s.** El elemento LCP de la home es el índice «00» de O2: el diseño muestra a propósito sólo negro, grano y la banda durante 1,2 s (O0 → O1, §02 S1), y el nombre aparece recién con el scroll (H1). Con throttling aplicado el LCP ya es FCP + 1,2 s (el diseño); lantern además lo ata a todo el JS porque en la traza sin throttling la escena lo revela. Sin rediseñar el opening no baja de ≈ FCP + 1,2 s. **Con el retrato real el LCP será la imagen y hay que volver a medir** (Phase 12 con assets).
3. **TBT móvil en `/trabajo/travelsuite360` 262 ms > 250** (lantern; 832 ms aplicado). La hidratación del documento entero sigue siendo la tarea más larga; la hidratación progresiva no es viable sin perder el documento sin JS (§4.2).
4. **LCP de los deep links móviles a Rayo/Santi/Chef 4,2–4,9 s**: el póster del mundo es el LCP y la página aterriza cuando el JS construyó las escenas (el póster no está en el viewport hasta el salto). El §18 fija el LCP de la home; se documenta como deuda.

## 6. Medios (§17) — auditoría del pipeline

| Punto | Estado |
|---|---|
| Formatos | stills por `next/image` en AVIF → WebP; cutouts pre-generados AVIF q50 + WebP q78, 1x/2x; clip Rayo AV1 → H.264 (`canPlayType` decide) |
| Resoluciones / compresión | dentro de presupuesto (`check-assets` en cada build); pósters crudos (745–1 205 KB PNG) servidos sólo por el optimizador — avisos conocidos, desaparecen con los originales |
| LQIP / placeholders | LQIP previsto para el retrato (no existe); placeholders honestos con aspecto reservado |
| Preload / lazy | sólo las dos fuentes (y el AVIF del retrato cuando exista); ningún preload de imagen (Phase 11); stills lazy salvo el póster del mundo de arranque (`eager` + `fetchpriority=high`) |
| Fuentes responsive | `<picture>` desktop/móvil; `sizes` por slot; el elemento de «Ingeniería web» reutiliza el del reel |
| Póster bajo video | siempre debajo; el video aparece en su primer frame |
| Un video activo | máx. 1 reproduciéndose en todo el journey |
| Reduced motion · Save-Data · 2G | 0 videos montados, 0 pedidos |
| Códecs | AV1 + H.264 MP4; WebKit de Playwright en Windows no decodifica → R05 se salta limpio (Safari real sí) |
| CLS por medios | 0 (y 0,002–0,003 con todos los medios bloqueados, Phase 11) |
| Duplicados | 0 |

## 7. Pendiente técnico de la fase

- Verificar capas en el panel Layers de un dispositivo móvil real (el proxy por estilos no ve las capas que crea el compositor).
- `preserve-3d` se declara también en md/sm (sin transforms 3D ahí, sin efecto medible): limpiarlo es cosmético.
- Medir en MacBook Air 2020, iPhone 12 / Pixel 6 (A4); este entorno sólo tiene una GPU de escritorio.

## 8. Inventario de assets (42 contratos) — clasificación

| Clase | Contratos | Detalle |
|---|---|---|
| **Final y aprobado** | **0** | ninguno |
| **Real, pero provisional** (derivado de capturas públicas reales) | 23 | `site.grain` (generado) · pósters `rayo/santi/chef.reel.poster` · `rayo.burger`, `rayo.layers.*` (6), `rayo.through` + póster (clip renderizado desde esas capas) · `santi.photo.1–6` · `chef.product`, `chef.catalog.1–3` |
| **Pendiente de autorización** | (sobre los provisionales) | Santi Nuca: permiso para usar sus fotografías en el mundo (§29 Q3) · Chef Arturo: permiso del negocio sobre su fotografía (§29 Q4) · TravelSuite360: 4 capturas candidatas **no aprobadas** (datos de producción difuminados; ahora bloqueadas al público) |
| **Pendiente de entrega — bloquea el lanzamiento** | 6 | `franco.hero` · `ts.reel.poster` · `ts.proof` · `rayo.proof` · `santi.proof` · `chef.proof` |
| **Pendiente de entrega — no bloquea** | 1 | `franco.bust` (placeholder honesto en la costura) |
| **Opcional / desactivado** | 12 | `franco.atWork`, `moments.human` (flags apagadas) · `ts/rayo/santi/chef.reel.loop` · `chef.macro.loop` · `og.home`, `og.ts`, `og.rayo`, `og.santi`, `og.chef` |
| Fuera del registro | — | favicon: es el de `create-next-app` (25,9 KB) — falta uno propio |

**Privacidad (§23):** ningún contrato de TravelSuite360 tiene `privacyChecked: true`; no existe tenant demo, ni grabaciones con datos controlados, ni la firma de dos personas (Franco + un socio). **No se inventó ninguna firma ni permiso.**

## 9. `check:launch`

```
check-assets: 42 contracts · 0 final · 23 derived · 19 placeholder
  error launch-blocking slots still on placeholder: franco.hero, ts.reel.poster, ts.proof, rayo.proof, santi.proof, chef.proof
check-assets: 1 error(s) (launch mode)        → exit 1
```

Intacto y fallando a propósito. `npm run check:assets` (preview) pasa con avisos. Un build con `VERCEL_ENV=production` falla igual.

## 10. Pruebas

| Suite | Resultado al cierre de la fase |
|---|---|
| `npx tsc --noEmit` · `npm run lint` · `npm run build` | limpios |
| `npx vitest run` | **176 / 176** (+2: regla 7 de contenido) |
| `npx playwright test` (Chromium, 6 proyectos, build con la configuración de producción) | **450 passed · 0 failed · 258 skipped** (los 34 tests de los momentos se saltan solos sin `PREVIEW_MOMENTS`; con el build de preview corren — Phase 13) |
| `CROSS_BROWSER=1` (WebKit ×2 + Firefox, 3 workers) | 223 passed · 1 failed (`capabilities` › entrar a un mundo desde un link del riel, Firefox: el clic de Playwright caía sobre la tarjeta vecina mientras el riel se movía) — corregido en Phase 13 |

Mediciones nuevas: `qa/phase12/` (Lighthouse ×90, transferencias, fps del journey completo).

## 11. Dependencias externas para cerrar la fase

Retrato del hero · material TS con tenant demo + checklist §23 firmado por dos personas + aprobación de los socios · grabaciones de las cuatro pruebas · originales y permisos de Santi Nuca y Chef Arturo · decisión sobre el presupuesto de JS inicial (§5.1) · dispositivos de referencia para A4.
