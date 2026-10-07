# MiPortafolio — Franco Núñez

Portfolio personal. Dirección creativa: **REVELADO 2.2** (diseño congelado). La implementación avanza por fases; la versión anterior (ENSAMBLE) queda en el historial de git.

> **Para implementar, empezá por `CLAUDE.md`** (orden de autoridad y reglas). Documentos vigentes: `docs/05b-content-master.md` → `docs/05a-revelado-2.2.md` → `docs/05-revelado-implementation-spec.md`. Fases hechas: `docs/06-phase0-audit.md` (auditoría) y `docs/07-phase1-foundation.md` (foundation).

Estado: **Phase 1 · Foundation hecha.** El Journey existe como documento estático y legible (también sin JavaScript) con el copy real y placeholders honestos donde falta material; el motion de cada escena llega desde Phase 2. Stack: Next.js 16 · React 19 · TypeScript strict · Tailwind v4 · GSAP 3.15 (+ ScrollTrigger). Sin otras dependencias de runtime.

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
  06-phase0-audit.md · 07-phase1-foundation.md
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
tests/                                  content + foundation (Vitest) · e2e (Playwright)
public/projects/                        capturas reales (TravelSuite360: no aprobadas para publicar, ver docs/07)
```

## Reglas no negociables (resumen)

No inventar métricas, clientes, testimonios, funcionalidades ni pantallas. Lo no confirmado no se publica. Los placeholders nunca se presentan como evidencia. Scroll vertical nativo siempre; la rueda vertical nunca se captura.
