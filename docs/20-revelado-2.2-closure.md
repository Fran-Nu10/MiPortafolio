# 20 · REVELADO 2.2 — Cierre

Fecha: 2026-10-11 · Rama `main` (local, **sin push**) · Último commit de cierre: ver `git log` · Autoridad: Content Master rev 26 → REVELADO 2.2 → Master Implementation Spec rev 37.

> **Actualización 2026-10-12:** Franco autorizó publicar con los assets provisionales. El sitio está en Vercel Production como **lanzamiento provisional** (`docs/21-production-launch.md`); la clasificación de abajo sigue describiendo el lanzamiento definitivo.

## 1. Clasificación

# RELEASE CANDIDATE TÉCNICO — LANZAMIENTO BLOQUEADO POR DEPENDENCIAS EXTERNAS

- **Técnicamente:** las fases 0–13 están implementadas, probadas y documentadas (`docs/06`–`docs/19`). Toda la experiencia (Opening → End) funciona en los cuatro tiers, con reduced motion, sin JavaScript, con medios bloqueados y con un chunk que no carga. Suite final: ver `docs/19` §4.
- **No es publicable:** faltan material y autorizaciones que el código no puede ni debe fabricar. `npm run check:launch` falla con 6 slots bloqueantes, y un build con `VERCEL_ENV=production` también.
- **No es «listo para publicar»:** hay criterios abiertos que sólo se cierran con material (A12), con Franco (A1, baselines), con dispositivos y lectores de pantalla reales (A4, A14, A19) o con una decisión de presupuesto (A17).

## 2. Estado de `check:launch` (exacto)

```
> npm run check:launch
check-assets: 42 contracts · 0 final · 23 derived · 19 placeholder
  warn  rayo.reel.poster (desktop|mobile): …prospector-hero-exploded.png is 745 KB (raw capture, served through next/image)
  warn  santi.reel.poster (desktop|mobile): …santi-nuca-opening.png is 1205 KB (raw capture, served through next/image)
  warn  chef.reel.poster (desktop|mobile): …chef-arturo-pdp-cookie-levain.png is 1023 KB (raw capture, served through next/image)
  error launch-blocking slots still on placeholder: franco.hero, ts.reel.poster, ts.proof, rayo.proof, santi.proof, chef.proof
check-assets: 1 error(s) (launch mode)                                   exit code 1
```

`npm run check:assets` (preview) pasa con los mismos avisos. **La salvaguarda no se tocó.**

## 3. Dependencias externas que bloquean el lanzamiento

| # | Qué | Quién | Desbloquea |
|---|---|---|---|
| 1 | **Retrato de Franco**: cutout con alpha, ≥ 2400 px de alto (3/4, B&N, luz dura, fondo negro, aire arriba/derecha para NÚÑEZ) + recorte 4:5 móvil | Franco (sesión de fotos) | `franco.hero`; LCP real; A1 del hero |
| 2 | **TravelSuite360**: tenant demo con datos controlados (§23), capturas del reel y grabación de la prueba (8 s, cortes 3,0 / 5,5 s) | Franco + socios | `ts.reel.poster`, `ts.proof` |
| 3 | **Firma de privacidad §23** sobre cada cuadro de TS (13 puntos, revisión a 0,25×) por **dos personas** (Franco + un socio) y aprobación de los socios para publicar el producto y la línea «tres agencias» | Franco + un socio | `privacyChecked: true`; A12 |
| 4 | **Grabaciones de las pruebas** de Rayo, Santi Nuca y Chef Arturo (6–10 s, 1600×900 y 960×540, sin datos de clientes) | Franco | `rayo/santi/chef.proof` |
| 5 | **Permiso de Santi Nuca** para usar sus fotografías en el mundo (+ originales en alta) | Santi Nuca | uso de `santi.photo.*` |
| 6 | **Permiso de Chef Arturo** sobre su fotografía (+ foto de producto en alta; loop macro opcional) | el negocio | uso de `chef.product`, `chef.catalog.*` |
| 7 | **Resend**: dominio verificado, `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` en Vercel (producción) y **un envío real** | Franco | A15 |
| 8 | **Dominio** de producción (canonical, OG, JSON-LD `url`) | Franco | SEO; despliegue |

No bloquean pero se esperan: busto (`franco.bust`), video de Franco trabajando y plano del momento humano (secciones apagadas por flag; §29 Q11: lanzar sin ellas o esperar), loops del reel, OG images, favicon propio, y los `[CONFIRMAR]` del Content Master (email, LinkedIn, URLs «Abrir ↗», años, stacks, «con equipos en cualquier lugar», extra de la prueba de Rayo, Mercado Pago live).

## 4. Registro de autorizaciones

| Autorización | Estado | Evidencia requerida | Dónde se registra |
|---|---|---|---|
| Publicar TravelSuite360 (producto, capturas, «tres agencias») | **pendiente** | aprobación escrita de los otros dos socios | este documento + `privacyChecked` en `src/data/assets.ts` |
| Checklist de privacidad §23 de cada medio de TS | **pendiente** | checklist firmado por Franco y un socio, por archivo | `privacyChecked: true` (el build lo exige) |
| Fotografías de Santi Nuca en el mundo | **pendiente** | permiso de Santi Nuca | `meta.source` del contrato + este documento |
| Fotografía de Chef Arturo | **pendiente** | permiso del negocio | idem |
| Acreditar marca / fotografía de Chef Arturo | **no se acredita** hasta confirmar autoría | — | Content Master 09 |
| Rayo Smash como demo de Prospector | ✅ (es un producto propio) | — | — |
| Mercado Pago en producción (Chef) | **sin confirmar** → la prueba dice «Tienda real, en línea.» | confirmación de Franco | `paymentsLive` en `src/data/projects.ts` |
| Capacidad 06 con evidencia | **no hay** → variante tipográfica | campaña real + métricas autorizadas con fuente | `EvidenceSlot` (`authorized`, `source`) |

**Ninguna firma, permiso ni aprobación fue inventada.** Las cuatro capturas de ENSAMBLE de TravelSuite360 (datos de producción difuminados) siguen en el repositorio como candidatas y **no se sirven** (404 directo, 400 en el optimizador — Phase 12).

## 5. Inventario de assets (42 contratos)

| Clase | Cantidad | Claves |
|---|---|---|
| Final y aprobado | 0 | — |
| Real, provisional (derivado de capturas públicas reales) | 23 | `site.grain` · `rayo.reel.poster` · `santi.reel.poster` · `chef.reel.poster` · `rayo.burger` · `rayo.layers.{topBun,bacon,patty,onion,patty2,bottomBun}` · `rayo.through` (+ `.poster`) · `santi.photo.1–6` · `chef.product` · `chef.catalog.1–3` |
| Pendiente de entrega, bloquea | 6 | `franco.hero` · `ts.reel.poster` · `ts.proof` · `rayo.proof` · `santi.proof` · `chef.proof` |
| Pendiente de entrega, no bloquea | 1 | `franco.bust` |
| Opcional / desactivado | 12 | `franco.atWork` · `moments.human` · `{ts,rayo,santi,chef}.reel.loop` · `chef.macro.loop` · `og.{home,ts,rayo,santi,chef}` |

Integrar un asset definitivo = agregar archivos (`scripts/media.mjs` para cutouts; `next/image` para stills; AV1 + H.264 para video), completar `files`/`meta` y cambiar `status` a `final` en `src/data/assets.ts`. Ningún componente ni timeline cambia (Spec §22). Después: `npm run build` (el servidor sólo sirve lo que `public/` tenía al compilar) y `npm run check:launch`.

## 6. Checklist de despliegue (cuando las dependencias estén)

1. `git log origin/main..HEAD` — revisar los commits locales; `git push origin main` **normal** (nunca force-push). *(No hecho: requiere tu aprobación.)*
2. Vercel: proyecto conectado a `main`, framework Next.js, Node ≥ 22.18; **no** definir `RESEND_API_URL` ni `PREVIEW_MOMENTS` en producción.
3. Variables de producción: `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` (dominio verificado en Resend).
4. Integrar los assets de §3 y marcar `privacyChecked` sólo con la firma real. `npm run check:launch` → **exit 0**.
5. Suite completa en verde: `npx tsc --noEmit` · `npm run lint` · `npm run build` · `npx vitest run` · `npx playwright test` · `CROSS_BROWSER=1 …`.
6. Preview deployment: recorrer el journey en Safari iOS, Android Chrome, MacBook Air (A4), con VoiceOver y NVDA (A19), reduced motion en macOS/iOS (A14). Medir Lighthouse sobre el preview (A17) con el retrato real.
7. Aprobar baselines visuales (A1) y volver a correr el diff.
8. Un envío real desde el preview hacia `CONTACT_TO` (A15).
9. Dominio: canonical, `og:url`, JSON-LD `url`/`sameAs` cuando se confirmen.
10. Promover a producción.

## 7. Rollback

- **Antes del primer despliegue** (estado actual): no hay nada que revertir; `main` local conserva toda la historia (ENSAMBLE incluido).
- **Vercel:** *Instant Rollback* al deployment anterior desde el dashboard (Deployments → el anterior → Promote / Instant Rollback) o `vercel rollback <url-del-deployment>`; no requiere rebuild.
- **Código:** `git revert <commit>` (nunca `reset --hard` ni force-push sobre `main`) y nuevo deploy.
- **Una sección problemática:** los momentos se apagan por flag (`SITE.features`); una escena que falla cae sola a su layout estático (Spec §24).
- **Formulario:** quitar las variables de Resend lo vuelve un error honesto (nunca un éxito falso).

## 8. Problemas conocidos

| Problema | Impacto | Estado |
|---|---|---|
| JS inicial 226 KB gz > presupuesto 170 KB | carga en móviles lentos | estructural (framework ≈ 140 KB + GSAP ≈ 49 KB); decisión pendiente |
| LCP móvil 3,0–3,4 s > 2,5 s | métrica | el opening muestra su primer contenido a los 1,2 s por diseño; re-medir con el retrato |
| TBT móvil en deep links 160–262 ms (lantern), ~800 ms con throttling aplicado | interactividad en móviles lentos | hidratación del documento completo |
| LCP de deep links móviles a Rayo/Santi/Chef 4,2–4,9 s | métrica | el póster se pinta al aterrizar |
| Favicon de `create-next-app` | identidad | falta asset |
| Excepción de contraste en Chef C07 (UI atenuada a .4, `aria-hidden`) | axe la reporta | decisión de diseño (Spec §11), documentada |
| R05 de Rayo se salta en WebKit de Playwright/Windows | sólo entorno de test | Safari real decodifica H.264 |
| Pasadas manuales (VoiceOver, NVDA, iOS, Android, MacBook Air) | A4/A14/A19 | no realizadas — no hay dispositivos en el entorno |

## 9. QA

Capturas, grabaciones y reportes por fase en `qa/phase2` … `qa/phase13` (ignorados por git). Reportes de esta etapa: `qa/phase12/` (Lighthouse ×90, transferencias, fps), `qa/phase13/` (matriz, accesibilidad, contenido renderizado, modos de falla, Lighthouse final).
