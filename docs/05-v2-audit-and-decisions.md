# 05 · V2 — audit, decisions, live windows

Branch `feat/portfolio-v2`, from `main` @ `806590c`. Master rule of V2:

> **BUILD → PRESENT → INTERACT.** ENSAMBLE builds. The camera presents. The visitor uses the product.
> ISOMETRIC = build / understand · FRONTAL = present / use.

## 1. Audit (before touching code)

Measured with Playwright on the production build at 360×740, 390×844, 430×932, 768×1024,
1024×768, 1440×900, 1920×1080 (scroll length per scene, screenshots at 6–11 positions per
scene, overflow scan, console).

Findings on `806590c`:

- **Phones scrolled 37 viewport heights.** Every scene inherited its desktop pin: Selected
  Work alone was one 16 vh pin (17 vh with the section), Capabilities 3 vh, Process 4 vh,
  About and Technology 2.2 vh each — and on phones Capabilities, About and Technology showed
  *no change at all* while pinned.
- The very first object of the site read "DASHBOARD · CAPTURE RESERVED".
- Hero (phones): the tagline collided with the name's cota; the manifesto's three vertical
  cota labels overlapped; the engraved plate left the frame.
- Prospector: six coloured ellipses for most of its sheet; the real demo appeared late.
- Product captures were small or tilted: TravelSuite's slab, the Capabilities trays (four large
  iso sheets with ~120 px crops inside), the Chef Arturo PDP at 60 % of the frame.
- No way to use the real builds.
- One pre-existing bug: the Build 05 "received" animation targeted a node React had not
  rendered yet (GSAP "target null" warning).

### KEEP / ADAPT / REBUILD

| Scene | Verdict | What changed |
| --- | --- | --- |
| 00 Preloader | KEEP | safe-area aware frame |
| 01–02 Hero + Manifesto | ADAPT | shorter pin, compact layout fixes, real first face (module index), exact hand-off to Sheet 01 |
| 03.01 TravelSuite360 | REBUILD | slab → full window → module by module (layers per module; capture slots ready) |
| 03.02 Prospector | REBUILD | outline → real ingredient layers → real hero → assemble/snap → menu → product → INTERACT |
| 03.03 Santi Nuca | ADAPT | own scene; spreads as large frontal pages; phones frame/pan each spread |
| 03.04 Chef Arturo | ADAPT | build → rotate → present pattern; arch crosses the frame; PDP at full window; exit as slab 04 |
| 05 Capabilities | REBUILD | small iso inventory + one frontal bin at ~2/3 of the frame; phones: flowing bins |
| 06 Process | ADAPT | 4 → 3 vh desktop, 2.3 vh phones |
| 07 Lab | KEEP | (no invented experiments) |
| 08 About | ADAPT | flows on phones (no pin) |
| 09 Technology | ADAPT | flows on phones; the oblique plate is square on phones (it overflowed by 80 px) |
| 10 Final / Build 05 | KEEP | shorter desktop pin; received-state animation fixed |

## 2. Scroll distance (whole page, in viewport heights)

| Viewport | V1 | V2 |
| --- | --- | --- |
| 360×740 | 37.1 | 24.6 |
| 390×844 | 36.9 | 23.8 |
| 430×932 | 36.9 | 23.4 |
| 768×1024 | 36.9 | 23.9 |
| 1024×768 | 39.6 | 34.6 |
| 1440×900 | 39.7 | 34.6 |
| 1920×1080 | 39.6 | 34.5 |

Pin per scene, desktop / compact (vh): Hero 4.2 / 2.8 · TravelSuite 2.2 / 1.3 · Prospector
3.0 / 2.2 · Santi Nuca 2.4 / 1.7 · Chef Arturo 3.2 / 2.3 · Capabilities 2.6 / flow · Process
2.0 / 1.3 · About 1.0 / flow · Technology 1.0 / flow · Final 1.8 / flow.

Nothing touches native scrolling: no wheel/touch interception, no smooth-scroll library, iOS
momentum intact. Phones feel faster because each scene needs less finger travel, and touch
scrubs with 0.3 s smoothing instead of 0.6 s.

## 3. Architecture added

- `useScene` — `pinVh: { desktop, compact }`, `mobile: "flow"` + `flowRange`; `build()` receives
  `compact` and `flow`, so a scene can build a different (shorter) timeline for phones.
  Rule learned in QA: **every value a later tween changes gets an explicit `tl.set` at 0**,
  otherwise ScrollTrigger's refresh can leave it at its end value.
- `Screen` — a real capture at its own ratio covering any window, with a focus (`fx`, `fy`) and a
  phone-only zoom (`zm`); scenes pan by tweening `--fx`. Desktop windows have the capture's ratio
  (nothing cropped); phone windows are portrait and show a legible region instead of shrinking.
- `ProjectWindow` — PRESENT. `--rot` 0 iso → 1 frontal (same camera as the Stack), `--s`, `--fill`
  (outline before surface). Desktop ≈ 86 % of the frame width; compact: the full useful width and
  the height left under the sheet head. Scenes move it through `.pw-move` (never `.pw-pos`,
  which GSAP would de-centre).
- `ModuleFace` — a product system's interface layer drawn from its documented modules. A module
  with a capture shows the capture; without one, the layers it runs through and a reserved slot.
- `LiveWindow` + `LiveControls` — INTERACT (button) / OPEN LIVE ↗ (link).

## 4. Live Project Windows

URLs come from each project's own repository (GitHub *homepage* field), never typed by hand.
Headers checked on 2026-10-01 (`curl -I`):

| Project | URL | HTTP | X-Frame-Options | CSP frame-ancestors | In the portfolio |
| --- | --- | --- | --- | --- | --- |
| Prospector · RAYO SMASH | https://prospector-phi-virid.vercel.app/rayo-smash | 200 | none | none | INTERACT + OPEN LIVE |
| Santi Nuca | https://hair-portfolio-two.vercel.app | 200 | none | none | INTERACT + OPEN LIVE |
| Chef Arturo | https://chef-arturoprod.vercel.app | 200 | none | none | INTERACT + OPEN LIVE |
| TravelSuite360 | — (no public build documented) | — | — | — | none |

How it works: nothing external loads until INTERACT. A `no-cors` reachability probe (8 s) runs
first — a frame's `load` event also fires on the browser's own error page, so the frame is only
mounted once the host answered — then a 12 s ceiling for the frame itself. Offline / blocked /
slow → the real capture stays with OPEN LIVE ↗. The page underneath is locked (`overflow:hidden`)
and `inert`; Esc or BACK TO PORTFOLIO restores scroll position and focus. Desktop adds a 390 px
view (the builds are responsive). The iframe is sandboxed (`allow-scripts allow-same-origin
allow-forms allow-popups allow-popups-to-escape-sandbox`, no top navigation).

Headers on this site (`next.config.ts`): `frame-src 'self'` + the three origins above (from
`src/data/live.ts`), `frame-ancestors 'self'`, `nosniff`, `strict-origin-when-cross-origin`.

If one of those builds ever adds `X-Frame-Options` or `frame-ancestors`, set its `embeddable` to
`false` in `src/data/live.ts` (the window then offers OPEN LIVE only), or allow this site in the
build's own config, e.g. `Content-Security-Policy: frame-ancestors 'self' https://sellfolio.vercel.app`
(and remove any `X-Frame-Options: DENY/SAMEORIGIN`). No external repository was modified.

Known limits: third-party cookies/storage inside the frame are partitioned by the browser (a cart
started inside the window does not follow to a new tab); Mercado Pago or WhatsApp links open in a
new tab (popups are allowed to escape the sandbox).

## 5. Data still needed (nothing was invented)

- **TravelSuite360 captures.** None are in the repository. Drop them in
  `public/projects/travelsuite360/` and set `capture` on the module in `src/data/projects.ts`
  (`modules[]`): TravelChat · inbox, CRM, Cotizaciones · AI assistant, Viajes · reservas,
  Reportes financieros, Automations. Each capture replaces its module's drawing in the window and
  in the hero's first face; nothing else changes.
- A public / demo URL for TravelSuite360, if one should be usable from the portfolio.
- Everything already listed in `04-implementation-notes.md` (roles, contact routes, portrait…).
