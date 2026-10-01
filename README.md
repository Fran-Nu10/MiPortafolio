# MiPortafolio — Franco Núñez

Portfolio personal. Dirección creativa: **ENSAMBLE** (el sitio se construye delante del visitante).

Estado: **implementación de producción** (Next.js 16 · React 19 · TypeScript strict · Tailwind v4 · GSAP). El sitio completo vive en `src/`; los documentos de `docs/` siguen siendo la fuente de verdad estratégica y de contenido.

```
npm install
npm run dev      # http://localhost:3000
npm run build && npm run start
npm run lint
```

Entrega del brief (formulario final): copiar `.env.example` a `.env.local` y completar `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`. Sin esas variables el formulario funciona y avisa honestamente que nada fue enviado.

## Estructura

```
docs/
  01-documento-maestro-v1.md            Estrategia, principios, arquitectura narrativa
  02-selected-work-content-map-v2.md    Los 4 Featured Builds y qué demuestra cada uno
  03-assets-manifest.md                 Qué asset es qué, dónde se usa, qué falta
  04-implementation-notes.md            Qué se construyó, decisiones, motion, QA, pendientes
  05-v2-audit-and-decisions.md          V2: auditoría, KEEP/ADAPT/REBUILD, scroll, Live Project Windows
src/
  app/                                  layout, page, globals.css, actions/brief.ts
  components/scenes/                    00–10: Opening · Work (work/: TravelSuite · Prospector · SantiNuca · ChefArturo)
                                        · Capabilities · Process · Lab · About · Technology · Final
  components/system/                    Frame · Cota · Stack · Cursor · Capture · Screen · ProjectWindow · ModuleFace
                                        · LiveWindow · Sheet · Preloader
  data/                                 projects · live · site · system (sólo hechos documentados)
  lib/                                  motion · store · useScene
public/
  projects/
    travelsuite360/                     4 capturas · TravelChat, CRM, Asistente IA, Reportes (datos personales difuminados)
    prospector/                         6 capturas · demo RAYO SMASH
    santi-nuca/                         8 capturas · portfolio editorial
    chef-arturo/                        10 capturas · ecommerce editorial
```

Convención de assets: `public/projects/<proyecto>/<proyecto>-<pantalla>[-<estado>].png`. Originales PNG sin recomprimir; las versiones optimizadas se generan en build.

## Diseño

El sistema visual y todas las escenas viven en el canvas de Claude Design (páginas 01–04) y están implementadas en `src/`. El objeto 3D es un stack CSS 3D (no WebGL): la cara superior es DOM vivo y las losas planas no necesitan iluminación — ver `docs/04-implementation-notes.md`.

## Reglas no negociables (resumen)

No inventar métricas, clientes, testimonios, funcionalidades ni pantallas. Sólo se mide lo que Franco construyó. Producto real antes que decoración.
