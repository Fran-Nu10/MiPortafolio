# MiPortafolio — Franco Núñez

Portfolio personal. Dirección creativa: **REVELADO 2.2** (diseño congelado). La versión anterior (ENSAMBLE) queda en el historial de git.

**Estado: publicado en Vercel Production como lanzamiento provisional** (autorizado por Franco, 2026-10-12): **https://mi-portafolio-dusky-three.vercel.app**. Las 14 fases del Spec (0–13) están implementadas y documentadas; la experiencia completa funciona en los cuatro tiers, con reduced motion, sin JavaScript y con medios bloqueados. Seis slots siguen en placeholder honesto (retrato del hero, material de TravelSuite360, las cuatro pruebas) por una excepción explícita en `src/data/launch.ts`; faltan además las variables de Resend, el dominio y permisos. `npm run check:launch` sigue fallando hasta que todo sea final. Detalle: [`docs/21-production-launch.md`](docs/21-production-launch.md) y [`docs/20-revelado-2.2-closure.md`](docs/20-revelado-2.2-closure.md).

> **Para trabajar, empezá por `CLAUDE.md`** (orden de autoridad y reglas). Documentos vigentes, en orden de autoridad: `docs/05b-content-master.md` → `docs/05a-revelado-2.2.md` → `docs/05-revelado-implementation-spec.md`.

Stack: Next.js 16 · React 19 · TypeScript strict · Tailwind v4 · GSAP 3.15 (+ ScrollTrigger, CustomEase). Sin otras dependencias de runtime. Desarrollo: Vitest 3, Playwright 1.64 (+ axe-core).

## Comandos

```
npm install
npm run dev             # http://localhost:3000
npm run build           # corre antes check:assets
npm run lint
npx tsc --noEmit
npx vitest run          # contenido + unidades (los chequeos de HTML usan el build)
npx playwright test     # e2e sobre el build de producción (Chromium, 6 proyectos)
CROSS_BROWSER=1 npx playwright test --project=webkit-1440 --project=webkit-390 --project=firefox-1440 --workers 3
npm run check:assets    # contratos de assets (preview: avisa)
npm run check:production  # como el build de Vercel producción: acepta sólo los slots de src/data/launch.ts
npm run check:launch    # lanzamiento definitivo: falla mientras haya slots bloqueantes en placeholder
```

WebKit y Firefox para los e2e: `npx playwright install webkit firefox`. Los e2e levantan un **Resend simulado** (`tests/e2e/mock-resend.mjs`): ningún test envía correo real. Para probar los momentos (Franco at work, momento humano) con sus placeholders: `PREVIEW_MOMENTS=1 npm run build`.

## Variables de entorno

| Variable | Dónde | Para qué |
|---|---|---|
| `RESEND_API_KEY` | producción (servidor) | API de Resend |
| `CONTACT_TO` | producción (servidor) | casilla que recibe los briefs |
| `CONTACT_FROM` | producción (servidor) | remitente en un dominio verificado en Resend |
| `NEXT_PUBLIC_SHOW_ASSET_KEYS` | sólo desarrollo / preview | imprime la clave del asset sobre cada placeholder |
| `RESEND_API_URL` | **sólo tests** | apunta la entrega al stand-in local; nunca en producción |
| `PREVIEW_MOMENTS` | sólo builds de preview | muestra las secciones apagadas por flag con sus placeholders; ignorado con `VERCEL_ENV=production` |

Sin las tres primeras el formulario responde con un error honesto: «Brief recibido.» sólo aparece tras un 2xx de Resend. Ninguna llega al bundle del cliente (verificado en Phase 13).

## Documentación

```
docs/
  05b-content-master.md                 copy, hechos, atribuciones (autoridad 1)
  05a-revelado-2.2.md                   experiencia y dirección de arte (autoridad 2)
  05-revelado-implementation-spec.md    arquitectura, fases, QA (autoridad 3)
  06-phase0-audit.md                    Phase 0 · auditoría
  07-phase1-foundation.md               Phase 1 · foundation
  08-phase2-opening-hero.md             Phase 2 · opening + hero
  09-phase3-project-reel.md             Phase 3 · reel
  10-phase4-world-system.md             Phase 4 · sistema de mundos
  11-phase5-travelsuite-world.md        Phase 5 · TravelSuite360
  12-phase6-rayo-world.md               Phase 6 · Rayo Smash
  13-phase7-santi-world.md              Phase 7 · Santi Nuca
  14-phase8-chef-world.md               Phase 8 · Chef Arturo
  15-phase9-capabilities-profile.md     Phase 9 · capacidades + perfil
  16-phase10-at-work-contact-end.md     Phase 10 · Franco at work, contacto, cierre
  17-phase11-responsive-a11y-rm.md      Phase 11 · responsive, accesibilidad, reduced motion
  18-phase12-performance-media.md       Phase 12 · rendimiento + medios
  19-phase13-qa-release.md              Phase 13 · QA final + release candidate (A1–A21)
  20-revelado-2.2-closure.md            cierre: readiness, checklist de despliegue, rollback, inventario, autorizaciones
  21-production-launch.md               lanzamiento provisional en Vercel: registro, verificación, pendientes, reemplazo
  22-commercial-declaration.md          declaración comercial MOSTRAR → CONVENCER → CONVERTIR (entre Capacidades y Perfil)
  23-ux-rhythm-conversion.md            intervención integral: ritmo (huecos), capacidades, contacto, showreel
  24-positioning-copy-pass.md           posicionamiento y autoridad: hero, Perfil + Meta Ads, Work abierto, contacto
  25-the-shift.md                       THE SHIFT (de la complejidad al producto) y los casos en /trabajo/[slug]
  26-final-art-direction-motion.md      dirección de arte final: ritmo, índice de capacidades, motion, películas del showreel
  27-blue-edition-mobile-first.md       Blue Edition (azul #6488FF), Una sola visión, Perfil y Meta Ads, microetiquetas, mobile-first
  28-services-mobile-final-polish.md    Servicios (reemplaza a Capacidades), showreel y hero mobile, limpieza de copy de producción
  01–04, 05-v2-*, 06-spanish-*          historia de ENSAMBLE (no son fuente de verdad)
```

## Estructura

```
src/
  app/                                  layout · page · trabajo/[slug] · not-found · actions/brief · globals.css
  components/journey/                   Journey (server) · JourneyClient
  components/{opening,reel,worlds,moments,capabilities,declaration,profile,contact,layout}/
  components/media/                     Still · Cutout · LoopVideo · ProofMedia · Placeholder
  data/                                 site · projects · capabilities · profile · assets (contratos) · geometría derivada
  lib/                                  motion · tiers · useScene · journey-store · journey-nav · route-sync · geometry
                                        · assets · media · brief · content · *-world (geometría pura de cada mundo)
  fonts/                                Schibsted Grotesk (variable) · IBM Plex Mono 400
scripts/                                check-assets · media · derive-* / gen-* (medios derivados de capturas reales)
tests/                                  Vitest (contenido, unidades) · e2e (Playwright)
public/projects/                        capturas reales; las de TravelSuite360 NO están aprobadas y no se sirven (404)
public/media/                           medios derivados (AVIF/WebP, clip de Rayo)
```

## Reglas no negociables (resumen)

No inventar métricas, clientes, testimonios, funcionalidades ni pantallas. Lo no confirmado (`[CONFIRMAR]`) no se publica. Los placeholders nunca se presentan como evidencia. Scroll vertical nativo siempre; la rueda vertical nunca se captura. TravelSuite360: sólo datos demo y firma de privacidad de dos personas antes de publicar cualquier medio.
