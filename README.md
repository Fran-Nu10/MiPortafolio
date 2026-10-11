# MiPortafolio — Franco Núñez

Portfolio personal. Dirección creativa: **REVELADO 2.2** (diseño congelado). La implementación avanza por fases; la versión anterior (ENSAMBLE) queda en el historial de git.

> **Para implementar, empezá por `CLAUDE.md`** (orden de autoridad y reglas). Documentos vigentes: `docs/05b-content-master.md` → `docs/05a-revelado-2.2.md` → `docs/05-revelado-implementation-spec.md`. Fases hechas: `docs/06-phase0-audit.md` (auditoría), `docs/07-phase1-foundation.md` (foundation), `docs/08-phase2-opening-hero.md` (opening + hero), `docs/09-phase3-project-reel.md` (reel), `docs/10-phase4-world-system.md` (sistema de mundos), `docs/11-phase5-travelsuite-world.md` (mundo TravelSuite360), `docs/12-phase6-rayo-world.md` (mundo Rayo Smash), `docs/13-phase7-santi-world.md` (mundo Santi Nuca) `docs/14-phase8-chef-world.md · 15-phase9-capabilities-profile.md · 16-phase10-at-work-contact-end.md` (mundo Chef Arturo) `docs/15-phase9-capabilities-profile.md · 16-phase10-at-work-contact-end.md` (capacidades + perfil) y `docs/16-phase10-at-work-contact-end.md` (Franco at work, contacto, cierre).

Estado: **Phase 10 · Franco at Work + Contact + End hecha.** El opening, el hero FRANCO / NÚÑEZ, el reel de cuatro productos (drag, swipe, trackpad, teclado, una pieza por gesto) y el paso del reel a cada mundo (el mismo rectángulo, SCREEN → ISOLATE → ESCAPE → EXPAND, Atrás vuelve al reel, deep links `/trabajo/{slug}`, overlay 01–04) el mundo de TravelSuite360 completo (TS00–TS12: de la consulta a la reserva, el gran reveal y la costura roja hacia Rayo) el mundo de Rayo Smash (R00–R07: la hamburguesa escapa del hero, capa por capa, la cámara entre las capas, la reconstrucción y la línea del menú) el mundo de Santi Nuca (N00–N05: la fotografía sale de la página, el negro se vuelve papel, díptico, tríptico, Forma · Línea · Textura y el sistema) el mundo de Chef Arturo (C00–C07: la foto escapa de la página de producto, macro, retroceso, catálogo, producto, compra y cierre), el riel de capacidades (busto, seis capacidades con evidencia viva de los proyectos; pinneado en desktop, apilado en móvil), el perfil, el formulario (sin JS también; éxito sólo con 2xx de Resend) y el cierre funcionan; Franco at work y el momento humano están construidos pero apagados por flag hasta tener su video/still en todos los tiers, con reduced motion y sin JavaScript; la consolidación responsive/a11y/RM y el rendimiento siguen como documento estático legible con el copy real y placeholders honestos, y ganan su motion fase por fase. Stack: Next.js 16 · React 19 · TypeScript strict · Tailwind v4 · GSAP 3.15 (+ ScrollTrigger). Sin otras dependencias de runtime.

```
npm install
npm run dev             # http://localhost:3000
npm run build           # corre antes check:assets
npm run lint
npx tsc --noEmit
npx vitest run          # tests de contenido y unidades
npx playwright test     # e2e sobre el build de producción
npm run check:launch    # falla mientras falten assets que bloquean el lanzamiento
```

Entrega del brief (formulario final): copiar `.env.example` a `.env.local` y completar `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`. Sin esas variables el formulario muestra un error honesto: "Brief recibido." solo aparece si Resend respondió 2xx.

## Estructura

```
docs/
  05b-content-master.md                 copy, hechos, atribuciones (autoridad 1)
  05a-revelado-2.2.md                   experiencia y dirección de arte (autoridad 2)
  05-revelado-implementation-spec.md    arquitectura, fases, QA (autoridad 3)
  06-phase0-audit.md · 07-phase1-foundation.md · 08-phase2-opening-hero.md · 09-phase3-project-reel.md · 10-phase4-world-system.md · 11-phase5-travelsuite-world.md · 12-phase6-rayo-world.md · 13-phase7-santi-world.md · 14-phase8-chef-world.md · 15-phase9-capabilities-profile.md · 16-phase10-at-work-contact-end.md
  01–04, 05-v2-*, 06-spanish-*          historia de ENSAMBLE (no son fuente de verdad)
src/
  app/                                  layout · page · trabajo/[slug] · not-found · actions/brief · globals.css
  components/journey/                   Journey (server) · JourneyClient
  components/{opening,reel,worlds,moments,capabilities,profile,contact,layout}/
  components/media/                     Still · Cutout · LoopVideo · ProofMedia · Placeholder
  data/                                 site · projects · capabilities · profile · assets (contratos) · types
  lib/                                  motion · tiers · useScene · journey-store · geometry · route-sync
                                        · assets · media · useInView · brief · content
  fonts/                                Schibsted Grotesk (variable) · IBM Plex Mono 400
scripts/check-assets.mjs                validación de contratos de assets (prebuild)
scripts/media.mjs                       grano y cutouts AVIF/WebP + LQIP (sharp)
tests/                                  content + foundation (Vitest) · e2e (Playwright)
public/projects/                        capturas reales (TravelSuite360: no aprobadas para publicar, ver docs/07)
```

## Reglas no negociables (resumen)

No inventar métricas, clientes, testimonios, funcionalidades ni pantallas. Lo no confirmado no se publica. Los placeholders nunca se presentan como evidencia. Scroll vertical nativo siempre; la rueda vertical nunca se captura.
