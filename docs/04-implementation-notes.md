# 04 · Implementation notes

Production implementation of the ENSAMBLE system. This file records what was built, the
decisions that deviate from the design handoff and why, how the motion system is wired, and
what still needs Franco.

## Stack

- Next.js 16 (App Router, static prerender) · React 19 · TypeScript strict
- Tailwind v4 (`@tailwindcss/postcss`) with the design tokens declared once in `src/app/globals.css`
- GSAP 3 + ScrollTrigger for every scene (one pinned trigger + one scrubbed timeline per scene)
- Self-hosted fonts via `next/font/local` (Archivo Narrow 500/700, IBM Plex Sans 400/500, IBM Plex Mono 400/500 · OFL, licences in `src/fonts/`)
- No WebGL. See the deviation below.

## Architecture

```
src/
  app/
    layout.tsx            fonts, metadata, theme colour
    page.tsx              → <Experience />
    globals.css           tokens, @theme, utilities, breakpoints, reduced motion
    actions/brief.ts      server action: validates the brief, delivers via Resend if configured
  components/
    Experience.tsx        skip link · the ten scenes in order · Frame · Cursor · Preloader
    scenes/               Opening (00–02) · Work (03.01–03.04) · Capabilities (05) · Process (06)
                          Lab (07) · About (08) · Technology (09) · Final (10 · Build 05)
    system/               Frame (T0 grid + frame + counter) · Cota/Marker/Callout · Stack (the
                          signature object) · Cursor (instrument) · Capture · ReservedFace ·
                          Sheet (Rail, TitleBlock) · Preloader
  data/
    projects.ts           the four builds: only documented facts; "[to confirm]" is hidden by the UI
    site.ts               tagline, location, manifesto, steps, contact (all null until supplied)
    system.ts             trays, stations, experiments, technologies + documented links
  lib/
    motion.ts             eases (snap = steps(n), settle, product), durations, iso camera, media queries
    store.ts              useSyncExternalStore: counter step, status, section, note, frame/grid, tone, brief
    useScene.ts           the one scene hook: pin + scrub + reduced motion + cleanup
```

Sequence and counter: 00 Preloader → 01 Hero → 02 Manifesto → 03 Selected Work (03.01–03.04)
→ 05 Capabilities → 06 Process → 07 Lab → 08 About → 09 Technology → 10 Final / Build 05.
There is no 04; the numbering is intentional (the sheets are 03.01–03.04). The T0 counter
("NN / 06") is the object's assembly state, not the section index.

## Deviation: CSS 3D stack instead of WebGL / R3F

The handoff allowed Three.js/R3F "when justified". It is not justified here:

1. The top face of the object is a live DOM element (a real capture, a real form, a reserved
   slot with real module names). A WebGL plane would need a texture snapshot and lose text,
   focus and the cursor readouts.
2. The object is flat slabs with edge lines. There is no lighting, no material, no curvature —
   nothing that CSS `rotateX(54.7deg) rotateZ(-45deg)` + `translateZ` cannot draw exactly.
3. It removes a 600 kB dependency and a second render loop; ScrollTrigger drives everything.

`Stack.tsx` is that object: `--rot` (0 = isometric construction, 1 = frontal product),
`--explode` (layer separation), `--fill-i` (outline → surface). GSAP tweens those variables;
the browser composites the transforms. Because GSAP reads a CSS custom property's start value
as 0, every variable tween is a `fromTo` with `immediateRender: true`.

## 00 · Preloader, 01 · Hero, 02 · Manifesto (master prompt §9–§11)

- **Preloader** (`system/Preloader.tsx`): the hero's own world — frame, dot grid, header at
  00 / 06 — and part 01 arriving (outline in `steps(6)`, then the paper surface) in the exact
  box and centring of the hero bench. It leaves when the site is really ready: fonts loaded
  **and** the opening scene built and measured (`store.ready`), with a 900 ms ceiling. It leaves
  with a snap, never a fade: the hero underneath has the same part in the same place.
- **Hero** (`scenes/Opening.tsx`): FRANCO filled, NÚÑEZ outline at 0 %, one frontal part. Scroll:
  guides draw → the part turns to iso and its system appears as outlines → layers fill bottom-up,
  each landing 25 % of the surname → 100 %. The cursor separates the layers (fine pointers only,
  60–160 px, live readout on the explode cota) until the name lies down.
- **The name becomes the base plate**: the real `h1` travels (CSS vars `--nx --ny --lay --ns`:
  translate, rotateX 54.7°, rotateZ −45°, scale) onto the plate's engraving. The target and the
  scale are measured from the DOM in the manifesto state (projected iso scale
  `k = bboxWidth / ((w + h)·cos45)`), so it lands pixel-exact; ink fades to the engraved line on
  the way and the engraving takes over with a snap. The plate arrives as an outline and fills its
  surface only after the name has landed (lines before surfaces — and the name stays visible).
- **Manifesto**: DESIGN / ENGINEERING / PRODUCT are three dimension lines drawn on the model
  (SVG in frame coordinates, computed from each layer's projected right-hand vertex): 01 =
  interface, 02–04 = the technical layers, Σ = the whole system, with dashed extension lines.
  Each word lights the layers it measures (`data-hl` on the stack and the cotas) on scroll and on
  hover / keyboard focus. On wide screens the words column starts right of the cotas.
- **Reduced motion** snaps between named resting states (`rest…` labels): part frontal · system
  outlined · 25 / 50 / 75 / 100 % · name on the plate · each word measured · assembled · frontal.
- The hero stack explodes around its middle (`<Stack centered>`), so the exploded system stays
  inside the frame; the hand-off slab ends at exactly Sheet 01's size (`--bench-scale`).
- The construction world is now strictly orthographic (`.iso-space { perspective: none }`).
- Any scene rebuilds on a width change; triggers are re-sorted by document order and refreshed.

## Motion grammar → code

| verb | implementation |
| --- | --- |
| ENTER | outlines draw (`scaleX/scaleY` from 0, linear) or parts arrive on the x axis with `settle` |
| BUILD | `--fill-i` 0 → 1, or `clip-path: inset()` sweeps, always before surfaces |
| ASSEMBLE | `--explode` → 0 with `steps(4)` (snap), then a hold |
| INSPECT | hover / focus / click on `[data-cursor]` targets; T2 markers |
| TRANSITION | the object rotates clockwise (`--rot` 0 → 1, `product` ease), never a cut; sheet swaps wipe with clip-path |
| DISASSEMBLE | layers leave as outlines (`--fill-i` → 0, x offsets, opacity last) |
| COMPLETE | fills land, the counter reads 06/06, the edge line appears |

Eases: `snap(n) = steps(n)`, `settle = cubic-bezier(.22,1,.36,1)`, `product = cubic-bezier(.7,0,.2,1)`.
No fades except where a fade is the technically honest thing (autoAlpha on a sheet that has
already left the frame).

## Scenes and scroll

`useScene(ref, { pinVh, states, build })` creates one pinned ScrollTrigger per scene with the
scene's timeline scrubbed to it. `states` is the number of discrete states that timeline has;
under `prefers-reduced-motion` the same timeline is used but progress snaps to the nearest
state, so nothing animates — the visitor steps through the same drawings. Scenes with inputs
(Final) use `mobile: "flow"`: no pin on phones, the section scrolls normally and grows with its
content so the form stays usable above the keyboard.

Every pinned section sits inside a React-owned `div.scene-slot`. ScrollTrigger's pin spacer
is inserted inside that div, so React never sees a DOM node it did not create (this was the
cause of an `insertBefore` hydration error early on).

Scroll length per scene (desktop): Opening 550 vh · Work 1600 vh (24 states) · Capabilities
200 vh · Process 300 vh · Lab flows · About 120 vh · Technology 120 vh · Final 260 vh.

## Breakpoints

One layout breakpoint: `md` is redefined to **1024 px** in `@theme`. Below it (phones and
portrait tablets) the compact layouts apply: accordion trays, vertical stations, one-column
lab, tall portrait plate, flowing form. Landscape tablets and up get the frame composition.
Between 1024 and 1279 px the hero name and the frontal stack take less width (`--hero-size`,
`--bench-scale`). All three are CSS variables in `globals.css`; the JS media queries in
`motion.ts`, `useScene.ts`, `Opening.tsx` and `Process.tsx` use the same 1023/1024 boundary.

## Reduced motion

- `useScene`: progress snaps to `states`; no tween ever plays between two states.
- `globals.css`: CSS transitions on interactive parts collapse to 0.01 ms. The rule is scoped
  (buttons, inputs, parts, trays, lids, frame lines, cursor) and deliberately **not** `*`: a
  universal transition override on pinned sections / pin spacers breaks ScrollTrigger's pin
  measurements (every scene pinned at once). This was reproduced and fixed in QA.
- Cursor: no lag; the instrument still switches modes.
- Final: the post-submit reveal is a plain state change.

## Accessibility

- Skip link → `#build-05` (the contact layer) as the first focusable element.
- Every scene is a `<section aria-label>`; captures carry real `alt` text from `projects.ts`.
- Trays, technology keys and the form are real buttons/inputs with visible orange focus rings.
- The brief form: labelled inputs, `fieldset/legend` for the kind chips (radio inputs, `sr-only`),
  `role="alert"` for validation, honeypot `company` with `tabIndex=-1` and `aria-hidden`.
- The cursor instrument only mounts for fine pointers; touch never sees it.

## Performance

- Static prerender, no client data fetching. Initial payload (1440×900): ~665 kB JS, 25 kB CSS,
  6 font files (98 kB), captures as optimised `next/image` (all `loading="lazy"`).
- One ScrollTrigger per scene, one `gsap.context` per scene, reverted on unmount.
- Captures are static imports → width/height known, blur placeholders, `sizes` set per slot.
- 61 fps in the headless scroll probe; no console errors at any tested viewport.

## Contact delivery

`src/app/actions/brief.ts` validates the brief and, when `RESEND_API_KEY` and `CONTACT_TO`
are set, sends it through the Resend HTTP API. Without them it returns `delivered: false` and
the UI says so honestly ("nothing was sent"). See `.env.example`.

## QA performed

Playwright (Chromium) screenshot passes at 360×740, 390×844, 768×1024, 1024×768, 1440×900,
1920×1080 across 14–27 scroll positions each; a `prefers-reduced-motion` pass at 1440×900;
keyboard pass (skip link → name → what → kind → submit); form submission (received state) and
validation (empty submit → alert); console/pageerror/requestfailed monitors on every run;
`npm run lint` and `tsc --noEmit` clean; `npm run build` static.

## Still needs Franco (nothing was invented in their place)

- TravelSuite360: captures (dashboard, inbox, quotes, reservations, CRM, automations), the
  real layer stack, role and "made" statements — the sheet shows reserved faces until then.
- Chef Arturo: cart / Mercado Pago / WhatsApp checkout captures; role.
- Prospector: a mobile capture of the demo; role wording is documented, stack confirmed.
- Santi Nuca: the typeface used in the editorial; role.
- Portrait for 08 · About (`public/about/franco-portrait.*`).
- Contact routes: email, WhatsApp link, booking link, reply time (`site.ts` → `contact`).
- `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` for real delivery.
- Public project names / URLs if any should be linked; the year to show as "working since".
