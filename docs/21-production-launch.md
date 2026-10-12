# 21 · Lanzamiento provisional en Vercel Production

Fecha: 2026-10-12 · Autorizado por Franco Núñez: «publicar REVELADO 2.2 en Vercel Production con los assets provisionales disponibles».

## 1. Registro del despliegue

| Dato | Valor |
|---|---|
| URL de producción | **https://mi-portafolio-dusky-three.vercel.app** |
| Proyecto Vercel | `pruebashopi8-gmailcoms-projects/mi-portafolio` (id `prj_cl8S9yd8nc67sD4vXkjmDmEhkGgF`) |
| Deployment verificado | `dpl_66nZrNwvxCXTh6pjgnofq4YCpFUy` · https://mi-portafolio-a1gm6xxrr-pruebashopi8-gmailcoms-projects.vercel.app · **Ready** |
| Commit desplegado | **`c25fc36`** «Allow an explicit, controlled provisional launch on Vercel production» (rama `main`) |
| Build | 47 s · `check-assets: ok (production · provisional launch)` · `✓ Compiled successfully in 7.0s` · las 5 rutas estáticas generadas |
| Deploy anterior | `mi-portafolio-bak7t8zn2…` sobre `2a12fcf` (Phase 1): **Error**, el chequeo de assets frenó el build — antes de existir la excepción provisional y antes del push |
| Git | `origin/main` = local; 38 commits subidos por fast-forward, sin sobrescribir nada remoto |
| Variables de entorno en Vercel | ninguna (ver §4) |
| Dominio propio | ninguno asignado a este proyecto |

## 2. Cómo se habilitó el lanzamiento sin quitar la salvaguarda

- `src/data/launch.ts` (`PROVISIONAL_LAUNCH`): lista explícita de los 6 slots bloqueantes que pueden seguir en placeholder, con quién lo autorizó y cuándo.
- `scripts/check-assets.mjs`, en un build de producción (`VERCEL_ENV=production`, o `npm run check:production` local): acepta **sólo** esos slots y los imprime como pendientes en cada build. Cualquier otro slot bloqueante en placeholder sigue fallando el build; una clave listada que ya no hace falta da aviso.
- `npm run check:launch` (el criterio de lanzamiento definitivo, A21) **sigue fallando**: no lee la lista.
- La validación de privacidad de TravelSuite360 (`privacyChecked`, §23) no cambió.
- Test: `content.test` regla 8 (la lista coincide exactamente con los bloqueantes actuales; los slots de TS siguen sin media; los dos modos del chequeo; sin claves de asset en el HTML).

## 3. Verificación en producción

| Comprobación | Resultado |
|---|---|
| `/`, `/trabajo/travelsuite360`, `/trabajo/rayo-smash`, `/trabajo/santi-nuca`, `/trabajo/chef-arturo` | **200**; títulos de §17 correctos |
| Ruta inexistente | **404** «No existe.» |
| Capturas privadas de TravelSuite360 (`/projects/travelsuite360/*`) | **404** directo · **400** por el optimizador (`/_next/image`) |
| Capturas aprobadas, medios derivados | 200 |
| Navegador (Chromium, 1440×900 y 390×844, las 5 rutas) | 0 errores y 0 avisos de consola, 0 errores de hidratación, sin overflow, `.js` activo, sin fallo de chunks |
| Journey completo por scroll | cada mundo llega a su último estado (TS09b · R07 · N05 · C07) en desktop y móvil |
| Deep links | aterrizan en el SCREEN de su mundo |
| Formulario | sin Resend configurado: «No se envió. Probá de nuevo.», valores conservados, **ningún «Brief recibido.»** y ningún correo enviado |
| Placeholders | ninguno muestra su clave de asset (`NEXT_PUBLIC_SHOW_ASSET_KEYS` no está definida); son campos planos sin imagen ni texto |
| Headers | `Strict-Transport-Security`, `Content-Security-Policy: frame-ancestors 'self'`, `X-Content-Type-Options`, `Referrer-Policy`; sin `X-Powered-By` |
| Clip de Rayo | 206 con Range; el `ERR_ABORTED` que registra el navegador es el corte normal de la precarga al salir del pin, no un error |

Capturas: `qa/production/` (ignorado por git), resumen en `qa/production/production-smoke.json`.

## 4. Lo que el sitio publicado todavía no tiene (pendientes)

**Slots en placeholder honesto (lanzamiento provisional):**

| Slot | Qué ve el visitante hoy | Qué hace falta |
|---|---|---|
| `franco.hero` | un campo plano oscuro detrás de FRANCO / NÚÑEZ | retrato cutout con alpha ≥ 2400 px + recorte móvil 4:5 |
| `ts.reel.poster` | campo plano en el reel y en el SCREEN de TravelSuite360 | capturas de un tenant demo + checklist §23 firmado por dos personas + aprobación de los socios |
| `ts.proof` | campo plano con la leyenda real de la prueba | grabación de 8 s en el tenant demo (mismas firmas) |
| `rayo.proof`, `santi.proof`, `chef.proof` | campo plano con la leyenda real; sin botón de play | grabaciones de 6–10 s sin datos de clientes |

**Configuración:** `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` en Vercel → Settings → Environment Variables (Production) y un envío real · dominio propio (canonical, OG, JSON-LD) · favicon propio.

**Autorizaciones:** permiso de Santi Nuca y de Chef Arturo sobre su fotografía (hoy se usan recortes provisionales de sus sitios públicos, con crédito) · firma §23 y aprobación de los socios para TravelSuite360 · confirmar Mercado Pago live · los `[CONFIRMAR]` del Content Master.

**Opcionales apagados:** Franco at work, momento humano, loops del reel, loop macro de Chef, imágenes OG, busto.

## 5. Reemplazar un asset pendiente (preparado)

1. Poner los archivos: cutouts con `scripts/media.mjs cutout` → `public/media/{grupo}/`; stills como imagen en `public/`; video en AV1 + H.264 con póster = primer frame.
2. En `src/data/assets.ts`: completar `files` (y `meta` si el contrato lo pide: `anchorRect`, `monitorFocus`, `chapters`), cambiar `status` a `final`. Para TravelSuite360, además `privacyChecked: true` **sólo con el checklist §23 firmado**.
3. Quitar la clave de `src/data/launch.ts` (el chequeo avisa si quedó de más; el test de contenido falla si la lista no coincide).
4. `npm run build` · `npx vitest run` · `npx playwright test` · `npm run check:production`.
5. Commit y `git push origin main`: Vercel despliega solo.
6. Cuando la lista quede vacía y `npm run check:launch` dé exit 0, el lanzamiento deja de ser provisional.

## 6. Rollback

Vercel → proyecto `mi-portafolio` → Deployments → el deployment anterior → *Instant Rollback* (sin rebuild), o `vercel rollback <url>`. En código: `git revert <commit>` + push (nunca force-push).
