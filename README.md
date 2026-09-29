# MiPortafolio — Franco Núñez

Portfolio personal. Dirección creativa: **ENSAMBLE** (el sitio se construye delante del visitante).

Estado: **fase de diseño cerrándose**. Este repositorio todavía no contiene la implementación; contiene la fuente de verdad estratégica, el mapa de contenido de Selected Work, el manifiesto de assets y los assets reales organizados para la implementación.

## Estructura

```
docs/
  01-documento-maestro-v1.md            Estrategia, principios, arquitectura narrativa
  02-selected-work-content-map-v2.md    Los 4 Featured Builds y qué demuestra cada uno
  03-assets-manifest.md                 Qué asset es qué, dónde se usa, qué falta
public/
  projects/
    travelsuite360/                     (pendiente: sin capturas todavía)
    prospector/                         6 capturas · demo RAYO SMASH
    santi-nuca/                         8 capturas · portfolio editorial
    chef-arturo/                        10 capturas · ecommerce editorial
```

Convención de assets: `public/projects/<proyecto>/<proyecto>-<pantalla>[-<estado>].png`. Originales PNG sin recomprimir; las versiones optimizadas se generan en build.

## Diseño

El sistema visual y todas las escenas viven en el canvas de Claude Design (páginas 01–04). El handoff a implementación (Next.js · TypeScript · Tailwind · GSAP · Three.js/R3F cuando esté justificado · Vercel) se hará con un Prompt Maestro una vez cerrado el diseño completo.

## Reglas no negociables (resumen)

No inventar métricas, clientes, testimonios, funcionalidades ni pantallas. Sólo se mide lo que Franco construyó. Producto real antes que decoración.
