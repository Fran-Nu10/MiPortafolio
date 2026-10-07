# REVELADO — Master Implementation Spec

> **Export para Claude Code.** Fuente: Claude Doc "REVELADO — Master Implementation Spec" (doc b9645500-9616-4d27-a4b1-d83dd8294563), rev 37, 29 secciones (01–29). Exportado el 2026-10-07. Autoridad: Content Master → REVELADO 2.2 → este documento → código existente. El diagrama de la sección 02 se exportó como tabla de texto.

Oct 7, 2026 · @Franco Nuñez

Design → engineering handoff. Sources, in order of authority: Content Master (copy and facts) · Revelado 2.2 (experience, art direction, motion) · this document (implementation). Reader: Claude Code. No new creative decisions are made here.

## 01 — System Architecture

**Authority.** Copy and facts come only from the Content Master (rev with "Correcciones · ronda 1"). Experience, art direction and motion come only from Revelado 2.2 (canvas page `r22`, plus `r21`/`r2` where 2.2 does not override). This spec decides implementation only. If something here contradicts either source, the source wins and this spec is wrong.

**Stack (kept).** Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 (CSS-first `@theme`) · GSAP 3.15 + ScrollTrigger. No new runtime dependency is required by this spec. Explicitly not added: Three.js / R3F, Lenis or any smooth-scroll library, Framer Motion, a carousel library, a state library, a form provider SDK.

**Rendering model.** The journey is server-rendered HTML (every word of copy is in the initial document, readable without JS). Motion is a client-side enhancement layered on top: each section is a client component that receives its content as props from a server component and attaches its own GSAP context after mount. If JS never runs, the page is a long, readable, static editorial document (see 24 · Failure Modes).

**What the existing repo (Fran-Nu10/MiPortafolio, `main` @ 806590c) gives us.** Audited for this spec; Phase 0 re-audits before touching anything.

| Existing piece | File | Verdict | Why |
| --- | --- | --- | --- |
| GSAP registration, reduced-motion and coarse-pointer probes, `COMPACT_QUERY` | `src/lib/motion.ts` | **Reuse, extend** | Correct and small. `EASE`/`DUR`/`ISO` constants are ENSAMBLE vocabulary → replace values with Revelado tokens (05). |
| `useScene` (pin + scrub + gsap.context + rebuild on width change + trigger re-sort + reduced-motion snapping to `rest…` labels) | `src/lib/useScene.ts` | **Reuse, extend** | This is already the section-owned timeline pattern this spec requires. Add: label snapping for normal motion, `matchMedia` branches, an `onState` callback. |
| Tiny external store via `useSyncExternalStore` | `src/lib/store.ts` | **Reuse, shrink** | Keep the mechanism; replace the ENSAMBLE fields with the four journey fields in 04. |
| Server action with honeypot + Resend over `fetch` | `src/app/actions/brief.ts` | **Reuse, adapt** | Already the recommended contact architecture. Change the input shape (Nombre · Email · brief), add email validation, timing check, rate limit (14). |
| `next/font/local` setup | `src/app/layout.tsx` | **Reuse pattern, swap fonts** | Archivo Narrow / IBM Plex are ENSAMBLE. Revelado uses Schibsted Grotesk (self-host). |
| Real project captures | `public/projects/*` | **Keep files, move later** | 24 real captures (Prospector, Santi Nuca, Chef Arturo). `travelsuite360/` is empty. |
| Scenes, system components, ENSAMBLE CSS | `src/components/scenes/*`, `src/components/system/*`, most of `globals.css` | **Retire** | Old visual system; not a reference. Delete in Phase 1 only after the new shell renders. `Cursor.tsx` logic may be mined for the reel cursor labels. |
| Project data | `src/data/projects.ts` | **Replace** | Shape is ENSAMBLE-specific (layers, faces). Replaced by the model in 21. |
| Breakpoint 1024 in `@theme` | `globals.css` | **Replace** | Becomes the four-tier system in 15. |

**Top-level shape.** One page shell → one `Journey` (ordered list of sections) → sections own their own timelines. Project worlds share one transition grammar (07) and one media layer (17). Content lives in typed data files (21); components never hardcode copy. Media lives behind asset contracts (22) so placeholders and final media are interchangeable without touching animation code.

**Non-negotiables (repeated where they apply).** Native vertical scroll always. Vertical wheel never captured. One active video at a time in the reel. No fabricated evidence. TravelSuite360 role is always "Socio · Producto e ingeniería" — never founder, never solo. Santi Nuca photography is always credited to Santi Nuca.

## 02 — Experience Map

**Scroll model per section (diagram exported as text).** Desktop scroll lengths are starting values, tuned in QA; vertical wheel is never captured. "Pinned" = section-owned ScrollTrigger scene; "Flow" = native document flow; "Event" = triggered sequence.

| Order | Section | Model | Scroll model detail | Length |
| --- | --- | --- | --- | --- |
| 1 | Opening → Hero → Positioning | Pinned | 2 automatic + 3 scroll states | 250vh |
| 2 | Project Reel | Flow | horizontal gestures inside only | 100svh |
| 3 | TravelSuite360 · world | Pinned | scrub, snaps to state labels | 600vh |
| 4 | TravelSuite360 · proof | Flow | video plays while in view | 100svh |
| 5 | Rayo Smash · world | Pinned | scrub + one time-based video clip | 450vh |
| 6 | Rayo Smash · proof | Flow | video plays while in view | 100svh |
| 7 | Human moment | Flow | mask scrub, no pin | 120svh |
| 8 | Santi Nuca · world | Pinned | scrub, snaps to state labels | 450vh |
| 9 | Santi Nuca · proof | Flow | scroll recording plays in view | 100svh |
| 10 | Chef Arturo · world | Pinned | scrub, snaps to state labels | 450vh |
| 11 | Chef Arturo · proof | Flow | video plays while in view | 100svh |
| 12 | Capabilities (with bust seam) | Pinned | vertical scroll drives the rail | 300vh |
| 13 | Profile | Flow | one reveal on entry | content |
| 14 | Franco at work | Pinned | scrub, frame grows to 95% | 200vh |
| 15 | Final CTA · form | Flow | never pinned (inputs, keyboard) | content |
| 16 | End | Event | triggered by form success, not by scroll | 100svh |

Every pinned scene is a section-owned ScrollTrigger with `pinSpacing`; nothing outside a pinned scene ever moves while it is pinned. Between pinned scenes the page is plain document flow. The order is fixed by Revelado 2.2: TravelSuite360 → Rayo Smash → Santi Nuca → Chef Arturo.

**Two structural decisions that keep copy single-sourced.** (1) *Positioning* is not a separate DOM section: it is the last state (H2) of the Opening→Hero scene, using the same firma and support-line nodes the hero already renders. No duplicated copy, nothing read twice. (2) The bust line "Todo lo anterior pasó por las mismas manos." (Content Master 14) is the opening seam of the Capabilities scene, not a separate section; the user-facing order (Chef proof → Capabilities) is preserved.

**Section sheets.** Worlds, reel, capabilities, Franco at work and contact have their own chapters (06–14); their sheet here only fixes purpose, boundaries and handoff. Opening, Hero/Positioning, proofs, human moment and End are fully specified here.

| # | Section | Purpose | DOM root | Layout model | Entry | Exit → handoff |
| --- | --- | --- | --- | --- | --- | --- |
| S0 | Shell + nav | Persistent identity and the 01–04 control | `<header>` fixed, `<main>` | fixed top bar, safe-area padded | visible after O2 | always present; hidden during End |
| S1 | Opening → Hero → Positioning | First image, name, firma, support line | `<section id="inicio" aria-label="Franco Núñez">` | full-viewport stage, absolutely layered | page load | H2 holds; portrait clears upward → reel heading enters from flow |
| S2 | Project Reel | Index of the four products, entry point to worlds | `<section id="trabajo">` | 100svh flex column; horizontal track inside | flow | "Ver caso" or scroll continues → TS world SCREEN state |
| S3 | TravelSuite360 world | Raw message → operation → reveal | `<section id="travelsuite360">` | pinned stage, perspective 1400px | SCREEN state = reel card geometry | TS10 name holds → proof |
| S4/S6/S9/S11 | Proof (×4) | Real product, real media, micro case, CTAs | `<section aria-labelledby>` per project | 100svh, window centered at reel geometry | flow; window scales .9→1 | window keeps reel geometry → next world SCREEN |
| S5 | Rayo Smash world | Burger escapes, capa por capa | `<section id="rayo-smash">` | pinned stage | SCREEN | assembled burger → proof |
| S7 | Human moment | Rhythm, silence | `<section aria-hidden="true">` | 120svh flow, sticky inner frame | flow | frame closes to black → Santi rupture |
| S8 | Santi Nuca world | Black→white rupture, editorial system | `<section id="santi-nuca">` | pinned stage | SCREEN | system grid → proof |
| S10 | Chef Arturo world | Food first, commerce second | `<section id="chef-arturo">` | pinned stage | SCREEN | purchase UI → proof |
| S12 | Capabilities | Six capabilities with live evidence | `<section id="capacidades">` | pinned; horizontal rail driven by vertical scroll | bust seam | rail ends → profile in flow |
| S13 | Profile | Who, how, contact routes | `<section id="perfil">` | two-column editorial (desktop) | flow | flow |
| S14 | Franco at work | Human scale before the ask | `<section aria-label="Franco trabajando">` | pinned; frame scales to 95% | flow | frame dims to monitor → CTA |
| S15 | Final CTA | The fifth, blank project | `<section id="contacto">` | flow, form never pinned | flow | success → End |
| S16 | End | Closing | `<div role="status">` + final block | 100svh, black | form success (or flow for no-JS) | none |

**S1 · Opening → Hero → Positioning — full sheet.** States, in order: **O0** black + grain (CSS, instant) → **O1** horizontal light band (a 14vh-high `clip-path: inset()` window) shows the portrait blurred (LQIP background, `filter: blur(24px)` on a pre-blurred tiny image, no runtime blur on the large image) → **O2** focus: when the full portrait has decoded (`img.decode()`), cross-fade LQIP→sharp over 600 ms inside the band; index reads 00. These three are automatic and time-based. Then scroll: **O3** (gesture 1) band opens to full viewport (`inset` 43%→0), the red line crosses once along the band's lower edge (one 2px element, `scaleX` 0→1 then `x` out, 700 ms equivalent), index 00→01 ticks with `steps(1)`. **H1** (gesture 2) hero composition: FRANCO behind body, NÚÑEZ in front (see 10 Hero below), firma and support line enter (mask-up, 80 ms stagger by line). **H2** (gesture 3) positioning hold: portrait translates up −12vh and dims to .55, name layers part slightly (FRANCO −6vh, NÚÑEZ +4vh), support line rises to statement size position; then the scene unpins. *Hero layer stack and responsive rules are in 03 Component Architecture → `OpeningHero` notes and 15 Responsive.*

**S1 timing guarantees.** Maximum blocking time: zero — no element waits on JS to be readable (the hero text is server HTML, visible under O2 styles if JS fails). O0→O1 starts at first paint. If the portrait has not decoded by **2.5 s** after first paint, O2 completes with the LQIP still showing and swaps to the sharp image silently when ready. Scroll is never locked: scrolling during O0–O2 jumps the timeline to O3 immediately. This is not a loader: there is no percentage, no counter beyond the 00→01 index.

**S4/S6/S9/S11 · Proof — full sheet.** Purpose: real media of the real product + the micro case + the two CTAs. DOM: `<section>` → `<h3>` project name (visually the label) → `<figure>` with `ProofMedia` (17) + `<figcaption>` holding the proof line ("Producto real, en uso en tres agencias." / "Demo real, navegable." / "Sitio real, en línea." / "Tienda real, en línea.") → micro case paragraph → role line → stack line (only if confirmed) → links "Abrir ↗" (only if `liveUrl` exists) and "Siguiente → {next}". Layout: window at reel geometry (1094 × per-project height, 76vw at 1440), centered; text block below at desktop, below at mobile. Scroll: flow; window `scale` .9→1 scrubbed over the first 40% of its pass; video plays only when ≥60% visible (IntersectionObserver), pauses otherwise. Reduced motion: no scale; poster image; play button visible. A11y: video has a visible play/pause control and `aria-label` "Recorrido por {name}"; figcaption is real text. Perf: video `preload="none"` until the world before it is active (17). Handoff: the window stays at reel geometry so the next world's SCREEN state starts at the same rectangle — the frame swap is the cut.

**S7 · Human moment — full sheet.** See 13 for the media contract (shared with Franco at work family). Silent: no copy, `aria-hidden="true"`, alt empty. 120svh section with a sticky 100svh inner frame; the image sits in a `clip-path: inset()` window that opens from a centered horizontal band to full (same aperture grammar as the opening) between 0–50% of the pass and closes to black between 70–100%. No pin, no state, no JS store writes. Mobile: same, 100svh. Reduced motion: image shown full, no aperture.

**S16 · End — full sheet.** Triggered by the form's success state, not by scroll. Sequence: "Brief recibido." (mono, paper on black) holds 1.2 s → the red signal dims to 0 over 800 ms → full black 400 ms → "FRANCO NÚÑEZ" in paper, hero typeface, fades/reveals in 600 ms. No other text. The header hides. Focus moves to the "Brief recibido." status node (it has `tabindex="-1"`). Without JS (plain form POST), the server responds with the same End block rendered statically. Reduced motion: same sequence as instant state changes with 1.2 s holds.

## 03 — Component Architecture

**Rule for a boundary.** A component exists only if it owns one of: a GSAP context/timeline, local state, a media lifecycle, a reused visual unit, or a server/client split. Visual sub-parts of a world stay as markup inside that world's file, addressed by `data-part` attributes for GSAP. Target: \~35 component files total, not hundreds.

```
app/
  layout.tsx                 server · fonts, <html lang="es">, metadata defaults, skip link
  page.tsx                   server · <Journey initial={null} />
  trabajo/[slug]/page.tsx    server · <Journey initial={slug} />  (20 Routing)
  actions/brief.ts           server action (14 Contact)
  not-found.tsx              "No existe. ← Trabajo"

components/
  journey/
    Journey.tsx              server · reads data/, renders sections in order, passes content props
    JourneyClient.tsx        client · mounts once: route sync, initial scroll, journey store writes
  layout/
    SiteHeader.tsx           client · marca, firma, "01–04" trigger, Perfil, Ahora, el tuyo
    ReelOverlay.tsx          client · compact 01–04 overlay (dialog), Esc closes
    MinimalFooter.tsx        server · "Franco Núñez · Uruguay · {year}" (above the form)
  opening/
    OpeningHero.tsx          client · one pinned scene: O0–O3, H1, H2 (positioning)
  reel/
    ProjectReel.tsx          client · track, active index, drag, keys, snap (06)
    ReelItem.tsx             client · poster + loop video slot + metadata; video lifecycle via props
  worlds/
    WorldScene.tsx           client · shared shell: pin, label snap, SCREEN→WORLD grammar (07)
    TravelSuiteWorld.tsx     client · TS00–TS12 markup + timeline builder (08)
    TravelSuiteReveal.tsx    client · big-reveal fragment field, mounts on proximity (08)
    RayoWorld.tsx            client · layered burger + scrubbed video segment (09)
    SantiWorld.tsx           client · clip-path editorial system (10)
    ChefWorld.tsx            client · macro → product → commerce bridge (11)
    ProjectProof.tsx         client · proof window + micro case + CTAs (02 · S4)
  moments/
    HumanMoment.tsx          client · aperture scrub, aria-hidden
    FrancoAtWork.tsx         client · pinned frame growth, placeholder-ready (13)
  capabilities/
    CapabilitiesRail.tsx     client · bust seam + pinned horizontal rail (12)
    EvidenceSlot.tsx         client · renders evidence variant or typographic fallback (12)
  profile/
    Profile.tsx              server · bio, stack line, contact routes (+ tiny client reveal)
  contact/
    FinalCta.tsx             server · title, support line, renders <BriefForm>
    BriefForm.tsx            client · fields, completion %, states, useActionState (14)
    EndSequence.tsx          client · "Brief recibido." → black → FRANCO NÚÑEZ
  media/
    LoopVideo.tsx            client · muted looping clip: sources, poster, active/inactive, failure
    ProofMedia.tsx           client · non-loop proof video: in-view play, controls, failure
    Still.tsx                server-safe · next/image wrapper with asset-contract input
    Cutout.tsx               server-safe · plain <img> for animated/transparent layers (28)
    Placeholder.tsx          server-safe · neutral placeholder honoring a contract's aspect + role
  a11y/
    SrOnly.tsx, VisuallyAnimatedText.tsx  (one readable copy + aria-hidden animated duplicate)

lib/
  motion.ts                  (existing) registration, tokens, media-query helpers
  useScene.ts                (existing, extended) pin/scrub/snap/rebuild per section
  useInView.ts               IntersectionObserver hook, shared by media
  journey-store.ts           (existing store.ts, shrunk) 04
  route-sync.ts              section ↔ URL mapping (20)
  seeded.ts                  deterministic PRNG (mulberry32) for the TS reveal layout
  assets.ts                  asset-contract resolver: contract → final or placeholder

data/
  site.ts                    global copy: nav, hero, CTA, microcopy, meta
  projects.ts                four Project records (21)
  capabilities.ts            six Capability records
  profile.ts                 bio paragraphs, contact routes
  assets.ts                  asset-contract registry (22)
```

**Why `WorldScene` is shared but worlds are separate files.** The pin, label snapping, SCREEN state markup, the reel-geometry rectangle, entry/exit handling and reduced-motion state stepping are identical across the four worlds. What happens between ISOLATE and WORLD is not. `WorldScene` takes a `build(api)` function from each world (the same contract `useScene` already uses) and the project record; each world file supplies its markup as children and its timeline as `build`.

**Server/client split.** Copy flows server → client as props. Client components never import from `data/` directly (keeps data tree-shaken out of client bundles beyond what each section needs, and keeps one source of truth).

**Hero layer stack (OpeningHero).** One stage element, `position: relative; height: 100svh; overflow: clip; isolation: isolate`. Layers bottom→top, all `position: absolute`:

| z | Layer | Element | Notes |
| --- | --- | --- | --- |
| 0 | Ground | stage background `#0B0B0C` | CSS |
| 1 | Grain | `::before` on stage, tiled 256px noise PNG (≤8 KB), `opacity .06`, `mix-blend-mode: screen` | static; never animated (no per-frame repaint) |
| 2 | FRANCO | `<span aria-hidden>` giant display type | behind the body |
| 3 | Portrait | `Cutout` (transparent WebP/AVIF of Franco, alpha) inside the aperture wrapper (`clip-path: inset()`) | the body occludes FRANCO through its alpha |
| 4 | NÚÑEZ | `<span aria-hidden>` giant display type | in front of the body |
| 5 | Firma, support line, index | real text | readable copy |
| 6 | Red line | 2px div | O3 only |
| — | Accessible name | `<h1 class="sr-only">Franco Núñez</h1>` | the two giant spans are decorative duplicates |

The body/type interaction is pure stacking order with a transparent cutout: no masks, no SVG, no canvas. It survives any viewport because FRANCO and NÚÑEZ are sized from the same `--hero-size` clamp as the portrait height (15 Responsive gives the per-tier values and the mobile crop).

## 04 — State Architecture

**Principle.** Animation progress is not React state. Scroll-driven visuals live inside GSAP timelines and are never mirrored into React (no re-render per scroll frame). React state exists only where the UI's *structure or semantics* change: which reel item is active, whether a video element should exist, form status, overlay open/closed.

**Is a context or store needed?** One tiny external store, yes — the existing `useSyncExternalStore` store, shrunk to four fields. Not React Context (a context value change re-renders every consumer subtree; the store lets each subscriber select one field). No library.

| State | Kind | Owner | Values | Who reads it |
| --- | --- | --- | --- | --- |
| `openingPhase` | local (ref + data attribute) | `OpeningHero` | `O0 \| O1 \| O2 \| O3 \| H1 \| H2` | its own timeline; `data-phase` on the stage for CSS |
| `heroRevealed` | **global** (store) | `OpeningHero` writes once at O2 | boolean | `SiteHeader` (fades in after O2) |
| `activeIndex` | local state | `ProjectReel` | 0–3 | its items (`isActive`, `isNext`) |
| `dragging` | local ref (not state) | `ProjectReel` | boolean + pointer origin + velocity samples | its pointer handlers; `data-dragging` attribute for the cursor label |
| `section` | **global** (store) | each section's ScrollTrigger `onToggle` | `inicio \| trabajo \| travelsuite360 \| rayo-smash \| santi-nuca \| chef-arturo \| capacidades \| perfil \| contacto` | `SiteHeader` ("02 / 04" index), `route-sync`, `ReelOverlay` (current item highlight) |
| `worldState` | local (timeline label) | each world | e.g. `TS00`…`TS12` | the world's own timeline; mirrored only to `data-state` on the stage for CSS and tests |
| `revealMounted` | local state | `TravelSuiteReveal` | boolean | itself (mounts fragment field near the reveal, 08) |
| `videoShouldPlay` | derived | media components | `isActive && inView && !reducedMotion && !failed` | `LoopVideo`, `ProofMedia` |
| `videoFailed` | local state | media components | boolean | itself (falls back to poster) |
| `reducedMotion` | derived (media query listener) | `lib/motion` hook `usePrefersReducedMotion` | boolean | every animated component (read once per build; change triggers a rebuild) |
| `tier` | derived (matchMedia) | GSAP `matchMedia` contexts | `xl \| lg \| md \| sm` (15) | timelines (rebuilt per tier); never React state |
| `overlayOpen` | local state | `SiteHeader` | boolean | `ReelOverlay` (dialog) |
| `form` | local (`useActionState`) | `BriefForm` | `idle \| typing \| submitting \| success \| error` + field errors | itself; `EndSequence` mounts on `success` |
| `completion` | derived | `BriefForm` | 0–100 | its readout; computed from field values (weights: name 20, email 20, brief 60 — brief scales with length up to 140 chars) |
| `endActive` | **global** (store) | `BriefForm` on success | boolean | `SiteHeader` (hides) |
| route | **URL** | `route-sync` | `/` or `/trabajo/{slug}` (+ `#capacidades`, `#perfil`, `#contacto`) | Next router, share, reload (20) |

**Store shape (replaces `SystemState`).** `{ heroRevealed: boolean; section: SectionId; endActive: boolean }` — overlay stays local. Writes are idempotent (the existing `setSystem` already drops no-op patches).

**URL state rules.** Only the active world (or a top-level anchor section) is reflected in the URL. Reel `activeIndex` is not in the URL (browsing the reel is not navigation). `history.replaceState` while scrolling; `history.pushState` only for explicit navigation (reel "Ver caso", overlay selection, "Siguiente →"). Details in 20.

**What must never become state.** Scroll progress, timeline progress, pointer position, cursor label, the TS reveal's camera Z, video currentTime. These are refs, data attributes or GSAP-internal.

## 05 — Scroll & Motion Architecture

**Native scroll contract.** The window is the only scroller for vertical motion. No smooth-scroll library, no `overflow: hidden` on `html/body` (except while the overlay dialog is open, using `overscroll-behavior: contain` on the dialog instead of locking where possible), no `preventDefault` on `wheel` anywhere, no `touch-action: none` on full-viewport elements. Pinned scenes use ScrollTrigger `pin` + `pinSpacing`, which only translates the pinned element while the document keeps scrolling natively.

**Scroll map.**

| Mode | Sections | Mechanism | Wheel |
| --- | --- | --- | --- |
| Normal flow | Reel (container), Proofs, Human moment, Profile, Final CTA | document flow; enter/leave triggers only | never touched |
| Sticky (CSS) | Human moment inner frame, Proof window during its scale | `position: sticky; top: 0` inside a taller section | never touched |
| Pinned + scrub + label snap | Opening→Hero, the four worlds | `useScene` / `WorldScene`: `pin: true`, `scrub: 0.6`, `snap: { snapTo: directionalSnap("s:"), duration: {min: .25, max: .6}, delay: .08, ease: "power2.out", inertia: false } — a small helper that snaps to the next/previous label whose name starts with s: (marker labels m: are skipped; built-in labelsDirectional would stop on every label)` | never touched; snap runs only after the user stops scrolling |
| Pinned + scrub, no snap | Capabilities rail, Franco at work | `pin`, `scrub: 0.8` | never touched |
| Discrete gestures inside a flow section | Project Reel horizontal axis | pointer events + `wheel` listener that reads **only** `deltaX` (and `shiftKey` + `deltaY`), returns early otherwise without `preventDefault` | vertical deltas pass through untouched |
| Event-triggered | End sequence, opening O0–O2 | time-based GSAP timelines, not tied to scroll | never touched |

**"One gesture = one meaningful change" under native scroll.** Revelado's discrete progressions are implemented as *labels on a scrubbed timeline*, each label one resting state, spaced so one ordinary scroll gesture (≈ a trackpad flick or 3–5 wheel notches ≈ 70–100vh) travels from one label to the next; `labelsDirectional` snap settles on the next label in the direction of travel when the user stops. This gives one-change-per-gesture feel while the browser keeps full control of scrolling, keyboard scrolling, scrollbar drags and assistive tech. Fast scrollers pass through several states continuously — that is allowed and intended.

**Label spacing convention.** Each world timeline is authored in abstract time units where 1 unit = one gesture. Pin length = `units × GESTURE_VH` (`GESTURE_VH` = 80 desktop, 70 tablet, 60 mobile; in `motion.ts`). Labels are named `s:<STATE>` (e.g. `s:TS03`) and are also the reduced-motion stops (`useScene` already snaps to `rest…` labels; rename the convention to `s:`).

**GSAP organization.**

| Concern | Rule |
| --- | --- |
| Timeline ownership | One timeline + at most one ScrollTrigger per section, created inside that section's `gsap.context(root)`. Sub-timelines (e.g. the TS reveal drift loop) are children owned by the same context. No global master timeline. |
| React lifecycle | Built in `useLayoutEffect` (client only) after mount; `ctx.revert()` on unmount, on tier change and on width change (existing `useScene` rebuild logic). |
| `gsap.matchMedia` | Each section creates one `gsap.matchMedia()` with conditions `{ xl, lg, md, sm, rm }` (15). Each condition builds its own timeline; matchMedia reverts automatically when the condition flips. This replaces the manual width check in `useScene` for tier changes; keep the manual rebuild only for same-tier width changes that alter measured geometry. |
| Trigger order | Sections can build out of document order (OpeningHero waits for fonts). Keep the existing `ScrollTrigger.sort` by document position + one coalesced `refresh()`. |
| Refresh | `ScrollTrigger.config({ ignoreMobileResize: true })` (exists). Refresh after fonts (`document.fonts.ready`) and after any media that changes layout — none should, because every media slot reserves its aspect ratio (17). |
| Reduced motion | The `rm` condition builds the *same labels* with `duration: 0` tweens (instant sets), `scrub: true`, no snap animation; states change in place. 16 defines per-world content. |
| will-change | Set by GSAP only during active tweens via `onStart`/`onComplete` (or `force3D: "auto"` default), never in static CSS for groups. See 18. |
| Eases | Tokens in `motion.ts`: `settle` `cubic-bezier(.22,1,.36,1)` (arrivals), `reveal` `cubic-bezier(.65,0,.35,1)` (aperture, contrast reveals), `dolly` `power2.in` (camera retreat accelerating, TS reveal), `steps(4)` (snap-to-grid, TS trip), `none` (scrub-linked camera). Durations are relative units inside scrubbed timelines; absolute ms only for time-based sequences (opening, End, reel snap). |

**Animation spec format used in 06–14.** Every major animation row gives TRIGGER (what starts it) · START/END (scroll positions or label range) · DURATION/SCRUB · EASING · PROPERTY · TARGET (`data-part` selector) · DEPENDENCY (what must exist or have finished). Only `transform`, `opacity`, `clip-path` and `filter` (filter only on small elements or pre-blurred images) are animated. Never animate `width/height/top/left`, `box-shadow`, or `backdrop-filter`.

## 06 — Project Reel Specification

**No carousel library.** Four items, one axis, custom snap rules (one piece per gesture, never capture vertical wheel, video tied to snap completion) — every library would need overriding on exactly these points. \~250 lines of first-party code is cheaper than fighting Embla/Swiper defaults.

**DOM.**

```
<section id="trabajo" aria-labelledby="trabajo-h">
  <header> label "Trabajo · 01–04" · <h2 id="trabajo-h">Cuatro productos.</h2> </header>
  <div data-part="viewport" role="region" aria-roledescription="carrusel" aria-label="Trabajo">   overflow: clip
    <ol data-part="track">                                       flex row, gap 32px, transform: translateX
      <li role="group" aria-roledescription="proyecto" aria-label="01 de 04: TravelSuite360" data-active>
        <div data-part="frame" style="aspect-ratio: …">           poster <img> + <LoopVideo> (active/next only)
        <div data-part="meta"> 01 / 04 · <h3>name</h3> · categoría · rol · [año if confirmed] · Ver caso · Abrir ↗
  <nav aria-label="Proyectos"> four <button aria-current> "01 · TravelSuite360" …  (the compact 01–04 index)
  <div aria-live="polite" class="sr-only"> "02 de 04 · Rayo Smash"
```

**Geometry (per tier, values from Revelado 2.2 reel spec).**

|  | xl ≥1440 | lg 1024–1439 | md 768–1023 | sm <768 |
| --- | --- | --- | --- | --- |
| Active width `W` | 1094px (= 76vw at 1440), max 1094 | 76vw | 84vw | `100vw − 32px` |
| Gap | 32px | 32px | 24px | 8px |
| Neighbour visible | `(100vw − W)/2 − gap` (141px at 1440) | same formula | same formula | 8px |
| Frame aspect | TS 16:9 · Rayo 1094:580 · Santi 1094:700 · Chef 1094:640 | same | same | all 358:420 (portrait crop, own poster/video sources) |
| Height cap | if frame height > `72svh`, shrink `W` to keep aspect | same | same | `min(420/358·W, 64svh)` |
| Vertical position | frame centered in the 100svh section (meta below) | same | same | frame top at 18svh |

Track offset: `x(i) = (100vw − W)/2 − i·(W + gap)`. Computed in px on build and on resize (no CSS calc in the tween target). The section itself never translates.

**Active index & snap algorithm.** `activeIndex` (0–3) is React state; the track position is a GSAP-owned value. Transitions only ever move by one index per gesture (keyboard digits and the 01–04 buttons may jump directly).

| Input | Handling | Result |
| --- | --- | --- |
| Pointer drag (mouse, pen, touch) | `pointerdown` on viewport → `setPointerCapture`; track follows `dx` 1:1; past the first/last item, resistance 0.35. Keep the last 5 `(x, t)` samples for velocity. | On `pointerup`: if \` |
| Touch axis lock | `touch-action: pan-y` on the viewport so the browser keeps vertical panning; after 8px movement, if \` | dy |
| Horizontal trackpad / Shift+wheel | **Non-passive** `wheel` listener on the viewport. If \` | deltaX |
| Click / tap | Ignored if the pointer moved > 6px. Neighbour → go to it. Active frame → enter world. | — |
| Keyboard | Listener on `document`, active only when focus is inside the reel **or** (reel ≥ 50% visible **and** focus is on `body`). Never when focus is in an input/textarea/contenteditable/dialog. `←`/`→` = ±1. `1`–`4` = jump. `Enter` on the active item or its "Ver caso" = enter world. `Home`/`End` = first/last. | page arrow-scrolling is unaffected (↑/↓ untouched) |
| 01–04 buttons | `button` click → jump | accessible fallback for everything above |

**Focus management.** Only the active item's links ("Ver caso", "Abrir ↗") are in the tab order; neighbours' links get `tabindex="-1"` (their frames remain mouse-clickable). After a keyboard-initiated change while focus is inside the reel, focus moves to the new active item's "Ver caso". Focus ring: 2px paper outline, 4px offset (Revelado reel spec). The live region announces "0n de 04 · {name}" after each settle.

**Video lifecycle (per item).**

| Condition | Element present | `preload` | Playing |
| --- | --- | --- | --- |
| Reel > 1 viewport away | poster `<img loading="lazy">` only | — | no |
| Reel within 1 viewport, item is active | poster + `<video>` | `auto` | starts on **snap complete** (not during drag), if reel ≥ 50% in view and tab visible |
| Item is `active ± 1` | poster + `<video>` | `metadata` | no |
| Item becomes inactive | video kept, paused (currentTime kept) | — | no |
| Item ≥ 2 away for > 10 s | `<video>` unmounted | — | no |
| `play()` promise rejects / `error` event | poster stays, video hidden, no retry loop | — | no |
| Reduced motion or Save-Data | poster only, never mounts video | — | no |

One `IntersectionObserver` on the viewport (threshold 0.5) + `visibilitychange` gate playback. Loops: 3–6 s, seamless, muted, `playsinline`, `loop`, no audio track (contracts in 22).

**Animation specs.**

| Animation | Trigger | Start → End | Duration / scrub | Easing | Property | Target | Dependency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Settle to index | pointerup / key / wheel threshold / button | current x → `x(i)` | 420 ms | `settle` | `x` | `[data-part=track]` | geometry measured |
| Neighbour dim | settle start | 1 → .55 (inactive), .55 → 1 (active) | 420 ms | `settle` | `opacity` | item frames | — |
| Neighbour grayscale | settle **complete** | class swap, CSS `filter: grayscale(.6)` on poster only, 200 ms CSS transition | 200 ms | linear | `filter` | poster `<img>` of inactive items | never interpolated during drag |
| Meta swap | settle start | old meta fades, new rises 8px | 240 ms | `settle` | `opacity`, `y` | `[data-part=meta]` | — |
| Section entry | reel top hits 80% viewport | heading mask-up | 600 ms, once | `settle` | `clip-path`, `y` | header | fonts ready |

**Cursor (fine pointers only).** One fixed element, positioned by `transform` in a rAF loop (no React state). Labels per Revelado: over the reel "DRAG", over the active frame "VER", over neighbour edges "→"/"←". `(hover: none)` or `(pointer: coarse)` → never mounted. Mine `components/system/Cursor.tsx` for the rAF loop.

**Entering a world from the reel.** "Ver caso" / active click / Enter: (1) `pushState('/trabajo/{slug}')`; (2) instant `window.scrollTo` to the world's start position (its SCREEN state renders the same image at the same rectangle as the active reel frame — both are viewport-centered at identical geometry, so the jump is invisible); (3) smooth native scroll to the world's `s:ISOLATE` label (one gesture's distance). The grammar continues from there (07). From any other reel position, the same applies — worlds are addressed by position, not by scrolling through the ones in between.

**Mobile.** One piece per screen, swipe = one piece, tap = enter, four-mark indicator (the 01–04 buttons styled as marks, labels kept for screen readers). Loop only on the active item.

**Reduced motion.** Posters only. Index changes are instant (no tween). Prev/next buttons visible beside the 01–04 index. Entering a world is a cut to the world's first readable state.

## 07 — Shared Card→World Transition System

**Grammar.** SCREEN → ISOLATE → ESCAPE → EXPAND → WORLD, in 1–2 gestures, no cut. Built once in `WorldScene`; each world supplies only its escaping object and what happens after EXPAND.

**The one geometric guarantee.** `lib/geometry.ts → reelRect(tier, project, viewport)` returns the active reel frame rectangle (x, y, w, h in viewport px). The reel (06), every world's SCREEN state, and every proof window call this same function. Because all three are viewport-centered at identical size, moving between them is a same-rectangle swap and reads as continuous. Any change to reel geometry automatically propagates.

**Stage structure (shared, `WorldScene`).**

```
<section id={slug} data-world={slug} data-state="SCREEN">
  <div data-part="stage">                         pinned, 100svh, overflow: clip, perspective set per world
    <div data-part="env" />                      world environment colour plane (opacity 0 at SCREEN)
    <div data-part="screen" style={reelRect}>     overflow: clip, the real-product frame
      <Still poster />                           same poster the reel shows
      <div data-part="screen-dim" />             black plane, opacity 0 → .75 at ISOLATE
    </div>
    <div data-part="object" style={anchorRect}>   OUTSIDE the screen's clip, so it can escape
      {project-specific object}                  text node | cutout | photograph | product crop
    </div>
    <div data-part="world">{world children}</div>
  </div>
</section>
```

The escaping object is a separate layer placed at the exact pixel location of that object inside the poster, computed from `anchorRect` (normalized 0–1 coordinates in the poster's own space, stored in the asset contract, 22) multiplied by the screen rectangle. At SCREEN the object layer is pixel-aligned over the poster, so the visitor sees one image. It is "the same thing" leaving the screen because it starts exactly where it was.

**Shared states and specs.** Units: 1 unit = one gesture (05).

| State | Label | Visible | Trigger | Range | Ease | Property → target |
| --- | --- | --- | --- | --- | --- | --- |
| SCREEN | `s:SCREEN` | poster at `reelRect`, object aligned over it | world start (or instant jump from reel) | 0 | — | static |
| ISOLATE | `s:ISOLATE` | rest of the screen darkens; object keeps full light; optional 1px paper outline around the object region fades in (per world) | scroll | 0 → 1 | `settle` | `screen-dim.opacity` 0→.75 |
| ESCAPE | (inside next unit) | object crosses the screen edge; screen begins to recede | scroll | 1 → 1.45 | `settle` | `object`: `x/y/scale` toward the world start rect (+ `z` in 3D worlds); `screen`: `scale` 1→.92 |
| EXPAND | `s:WORLD` | object reaches world scale; environment fills; screen gone | scroll | 1.45 → 2 | `settle` | `env.opacity` 0→1; `screen.opacity` 1→0; `object` reaches `escapeTo` rect |
| WORLD | world labels | world-specific | scroll | 2 → n | per world | per world |

The object's end transform is computed, not hardcoded: `from` = `anchorRect × reelRect`, `to` = the world's `escapeTo` rect (a per-tier rectangle each world declares, e.g. TS01's message box). GSAP tweens `x`, `y`, `scale` between them (FLIP-style: measure both rects on build, animate transforms only).

**Shared vs project-specific.**

| Shared (WorldScene) | Project-specific (world file + asset contract) |
| --- | --- |
| pin, label snap, unit→vh mapping | perspective value (TS 1400px approved; Rayo 1200px starting value, tune in QA; Santi and Chef none — 2D) |
| SCREEN markup and `reelRect` alignment | the object: TS = live DOM text of the message; Rayo = burger cutout (alpha WebP/AVIF); Santi = the original photograph, full-resolution, cropped to its frame in the page; Chef = product crop (macro-ready, high-res) |
| ISOLATE dim plane | `anchorRect` (where the object sits in the poster) |
| ESCAPE/EXPAND tween construction from two rects | `escapeTo` rect per tier; environment colour (TS black, Rayo red `#E63B2E` field, Santi paper `#EDE8DE`, Chef: no colour plane — the macro image itself becomes the environment) |
| reduced-motion stepping, `data-state` mirroring, store `section` writes | everything after `s:WORLD` |
| exit handling (below) | exit flavour (TS: red enters from the edges toward Rayo; others: dim to .55) |

**Exit and handoff between consecutive worlds.** Each world ends at its proof (normal flow). The proof window sits at `reelRect`. The next world's SCREEN state is also at `reelRect`. Between them the proof dims (`opacity` → .55 over its last 30% of pass) and the TS→Rayo seam additionally brings the red field in from the viewport edges (`clip-path: inset()` closing from 50% to 0, 1.2 s equivalent of scroll). No black flash, no cut.

**Mobile.** Same grammar; `reelRect` comes from the sm geometry (portrait frame) and the mobile poster has its own `anchorRect` (posters differ per tier, so anchors are per asset variant). ESCAPE is 2D only (no `z`).

**Reduced motion.** Three instant states: SCREEN → (one gesture) object shown large in its world environment with the screen hidden → world states. No travel.

## 08 — TravelSuite360 Technical Specification

**Approved architecture.** DOM + CSS 3D transforms + GSAP. No WebGL, no canvas, no particles. Perspective 1400px.

**Design space.** The world is authored in a fixed **1440 × 900** coordinate space (all x/y below are in it, from Revelado 2.2 TS state spec). `data-part="space"` is a 1440×900 box, centered in the stage and scaled by one transform `scale(s)`, `s = min(vw/1440, vh/900)` (xl/lg/md). Mobile uses its own **390 × 844** space with its own coordinates (column "sm" below). This keeps every position deterministic and resolution-independent.

**3D structure.**

```
stage            perspective: 1400px; perspective-origin: 50% 50%
 └ space        scale(s); transform-style: preserve-3d
    └ camera    translateZ(camZ)  ← the only element the "dolly" animates; preserve-3d
       ├ message      [data-part=msg]   real <p>, the sentence; key words are <span data-word=dest|date|pax>
       ├ fields       [data-part=f-dest|f-date|f-pax]  label + value, translateZ per field
       ├ quote        [data-part=q1|q2]  lines + text, no cards
       ├ trip         [data-part=trip]   CSS grid 2×3
       ├ reservation  [data-part=res]    600px bar + 10px red signal
       ├ reveal       <TravelSuiteReveal/>  4 depth groups (below)
       └ name         [data-part=name]   flat, outside the 3D camera in practice (see TS10)
```

**3D rules (bugs to avoid).** Never put `opacity < 1`, `filter`, `overflow` other than visible, `clip-path` or `mix-blend-mode` on `space` or `camera` — they flatten `preserve-3d`. Opacity goes on leaves or on depth groups whose own children are flat. Perceived scales from Revelado are produced by `translateZ` alone, solved as `z = P·(1 − 1/scale)` with P = 1400 (e.g. scale 1.25 → z = +280; .9 → −156; .72 → −544; .7 → −600). No separate `scale` on depth-placed elements.

**Copy (Content Master 06, verbatim).** Raw: “Necesito viajar a Punta Cana en julio, somos cuatro.” · label `input` · origin line “Las agencias operan en WhatsApp, planillas y correo. TravelSuite360 lo junta.” · extraction labels `destino · Punta Cana` / `fechas · julio` / `pasajeros · 4` / label `interpretado` · quote `Opción 01 · Opción 02` with fields destino, fechas, pasajeros, vuelo, hotel and the tag `seleccionada` · trip `viaje · Punta Cana · fechas · pasajeros · vuelo · hotel · traslados · estado` · reservation `reserva confirmada · → reporte actualizado · sin intervención` · reveal fragment words `mensaje · cotización · viaje · reserva · cliente · reporte` · close `TravelSuite360 · Una agencia entera, operando.` Fields without a known value (vuelo, hotel, traslados, estado) show the label and a rule line only — no invented values.

**State table.** `s:` = snap label (one gesture); `m:` = marker inside a gesture; *auto* = time-based child segment fired when the playhead crosses the label forward (`api.auto(label, build)` in `WorldScene`: forward crossing → `play()`, backward crossing → `progress(0)` instantly).

| State | Label | Visible elements | Transforms (1440×900 space) | Camera | Timing / ease | Trigger | sm (390×844) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TS00 · SCREEN | `s:SCREEN` | reel poster at `reelRect`; message text node aligned over the poster's message (`anchorRect`) | — | 0 | — | world start / reel jump | same, portrait poster |
| TS00b · ISOLATE | `s:ISOLATE` | poster dims (.75 plane); message stays lit | — | 0 | 1 unit, `settle` | 1 gesture | same |
| TS01 · RAW | `s:TS01` | black; the sentence at 64px, max-width 1100, at x160, vertically centered; label `input` above; origin line below at 18px, muted | msg: from `anchorRect` to (160, 450−h/2), font-size via `scale` (render at 64px, start scaled down) | 0 | 1 unit (ESCAPE+EXPAND), `settle`; arrival "breath" = `y` −2→0 px over last 10% | 1 gesture | sentence 34px, x24, y 300, max-width 342 |
| TS02 · EXTRACTION | `m:TS02` | the three key words detach in place; their slots in the sentence become underlined gaps | detached copies (aria-hidden, pre-positioned over the spans) lift: `y −12`, `scale 1.06`; original span text → `color: transparent`, underline 1px stays | 0 | first 0.4 of next unit, long `settle` | (inside gesture) | same |
| TS03 · FIELDS | `s:TS03` | `destino · Punta Cana`, `fechas · julio`, `pasajeros · 4`; label `interpretado`; sentence lowered | dest → (560,140) z+280 op 1 · date → (220,300) z−156 op .85 · pax → (1020,360) z−600 op .6 · sentence → y560, op .45 | camZ 0 → +200, `perspective-origin` follows dest (x 39%→45%) | remaining 0.6 unit, `settle` | 1 gesture | 2D stack: three fields in a column at y 120/200/280, no z; sentence to y 520 |
| TS04 · QUOTE | `s:TS04` | `Opción 01` (front), `Opción 02` (back), each: destino, fechas, pasajeros, vuelo, hotel as text lines + rules | fields fly into Opción 01 lines; q1 at (120,160) z0; q2 at (120,520) z−544 op .4 | +200 → 0 | 1 unit, `settle` | 1 gesture | q1 y120, q2 y460 op .4, no z |
| TS05 · SELECTED | `s:TS05` | tag `seleccionada` on Opción 01; Opción 02 retires | q2 z−544 → −900, op .4 → 0; tag mask-in | 0 | 0.6 unit, `settle` | 1 gesture | q2 fades, no z |
| TS06 · TRIP | `s:TS06` | trip block, 2×3 grid at (760,150), width 600 | option lines re-flow into grid cells: per-cell `x/y` tweens with `steps(4)` | 0 | 0.5 unit, `steps(4)`; no morph | 1 gesture | grid 1×6 column, width 342, y 140 |
| TS07 · RESERVATION | auto after `s:TS06` (+500 ms) | `reserva confirmada`; 600px bar under the trip; 10px red signal | signal `x` 0 → 600 → exits right (`x` +200, op 0) | 0 | 500 ms travel, linear; *auto* | automatic | bar 342px |
| TS08 · REPORT | auto (chained) | `→ reporte actualizado · sin intervención` marks itself; no arrow animation | text mask-in | 0 | 400 ms, `settle`; *auto* | automatic | same |
| TS09 · BIG REVEAL | `s:TS09a`, `s:TS09b` | the followed trip stays center at perceived .7; 64 fragments appear through the camera retreat (not fade-in); fixed radial vignette | trip z 0 → −600 (perceived .7) | camZ 0 → −800, `dolly` (`power2.in`: slow then faster) across 1.6 units | 2 snap stops (−300 at 09a, −800 at 09b) | 1–2 gestures | 32 fragments, 2 groups, camZ → −500, no drift |
| TS10 · NAME | auto after `s:TS09b` | drift stops; `TravelSuite360` 88px centered at y560; `Una agencia entera, operando.` below | name: contrast reveal (`clip-path` inset 0 100% 0 0 → 0, 800 ms, `reveal`); fragments op ×.5 | holds | 800 ms; *auto* | automatic | name 44px, y 600 |
| TS11 · PROOF | (S4, flow) | see TravelSuite proof below | — | — | — | unpin → flow | 16:9 full-width window |
| TS12 · EXIT | (S4 tail) | proof window dims to .55; red field enters from viewport edges toward Rayo | `clip-path: inset(50%)` → `inset(0)` on the red plane | — | last 30% of proof pass (≈ 1.2 s of scroll) | scroll | same |

Unit budget: SCREEN 0 · ISOLATE 1 · TS01 1 · TS03 1 · TS04 1 · TS05 0.6 · TS06 0.5 (+ autos) · TS09 1.6 · hold 0.8 = **7.5 units** → 600vh at `GESTURE_VH` 80.

**Big reveal (signature moment).**

| Aspect | Decision |
| --- | --- |
| Node count | 64 fragment elements desktop (16 per depth group), 32 on sm (2 groups × 16). Each fragment = one `<span aria-hidden>` holding one word (9px mono, muted paper) + its 1px rule via `::after`. Total added DOM ≈ 70 nodes desktop. |
| Depth groups | 4 `div[data-depth]` at `translateZ` 0 / −300 / −600 / −900; opacity per group .55 / .4 / .25 / .1 (set on the group; groups are flat inside). |
| Positions | Deterministic. A build-time script `scripts/gen-ts-reveal.mjs` (mulberry32, seed 360) writes `data/ts-reveal.ts`: `{ id, group, x, y, word }[]`, committed to the repo. Rules: spread per group scaled by `(P − z)/P` so far groups still fill the frame after perspective; reject points inside the central clear ellipse (480×300 at center); words cycle through the six Content Master words. Fragments are placed with static `left/top` (never animated) so each group paints as one layer. No `Math.random()` at runtime → no hydration mismatch. |
| Transform strategy | Only `camera.translateZ` animates during the dolly (one property, one element). Drift = 4 tweens (one per group) of `x/y` ±4px, sine yoyo, 6–9 s periods, started at `s:TS09b` and killed at TS10. |
| will-change | `will-change: transform` on `camera` and the 4 groups only between `m:TS08` and TS10 (set/unset in callbacks). Never on fragments. |
| Mount / unmount | `TravelSuiteReveal` mounts when the TS world pin starts (`onEnter`/`onEnterBack`) with `visibility: hidden`; becomes visible at `m:TS08`; unmounts when the world's ScrollTrigger reports `onLeave`/`onLeaveBack` by more than one viewport. |
| Mobile reduction | 32 fragments, 2 groups (z 0 / −600), camZ → −500, no drift loop, no perspective-origin follow. |
| Reduced motion | One static composition: trip block centered (flat, scale .7 via `scale`, since no 3D), fragments flattened into the frame at their 2D positions with group opacities, then the name. Same idea — many operations behind one — without travel. |
| Frame-rate guard | QA must hold ≥ 55 fps on a 2020 MacBook Air during the dolly (Chrome performance panel). If not, drop group 4 (16 nodes) on lg before anything else. |

**TravelSuite proof (S4).**

| Behaviour | Spec |
| --- | --- |
| Media | One 8 s non-loop recording with three hard cuts baked in: TravelChat 3 s → CRM 2.5 s → IA 2.5 s. One file, not three. Chapter labels “TravelChat · CRM · IA” above the window, active label switched at 3.0 s and 5.5 s via `timeupdate` (text, not burned into video). |
| Frame | window at desktop `reelRect` (16:9), 1px `#8E8B84` @ 40% border, radius 8px. No fake browser chrome. |
| Autoplay | `muted playsinline autoplay` only when ≥ 60% in view and not reduced-motion and not Save-Data / 2G. Plays once; holds the last frame; a “Volver a ver” control appears. |
| Pause | `IntersectionObserver` < 60% → pause; `visibilitychange` hidden → pause. |
| Sources | desktop: AV1 MP4 + H.264 MP4 at 1600×900 (`media="(min-width: 768px)"`); mobile: H.264 MP4 960×540. Poster: AVIF/WebP of the first TravelChat frame. |
| Preload | `none` until the TS world pin starts → `metadata` → `auto` at TS09. |
| Failure | poster stays, chapter labels hidden, proof line and micro case unaffected. |
| Caption | `Producto real, en uso en tres agencias.` — real text in `figcaption`. |
| Micro case + role | from `projects.ts`: role line `Socio · Producto e ingeniería`; micro case text (Content Master 00-B). Never “fundador”. |
| Privacy | the recording must use controlled demo data only (23). |

## 09 — Rayo Technical Specification

**Approved approach: hybrid.** 2.5D DOM layers for everything the visitor scrubs; one prerendered video only for the camera-through-the-layers moment. No Three.js.

**Copy (Content Master 07, verbatim).** entera: no text · explode: `Capa por capa.` · through: no text · assembly: no text · hero: `Clásica · doble medallón smash, cheddar fundido, salsa de la casa, pan brioche · $ 490` (real demo menu data). No other sentence in the world.

**Material boundaries.**

| Element | Medium | Notes |
| --- | --- | --- |
| SCREEN | `Still` (reel poster: the real Rayo hero capture) | from 07 grammar |
| Escaping burger (assembled) | `Cutout`: one alpha AVIF/WebP of the whole burger, aligned to the burger in the poster via `anchorRect` | the object layer |
| Red environment | DOM plane, `#E63B2E` | `env` plane of `WorldScene` |
| “Capa por capa.” | real text, display face | enters with the explode |
| Separated layers | 5 `Cutout`s (top bun, bacon, onion, patty, bottom bun), alpha AVIF/WebP, each pre-cropped to its own bounds, plus each layer's offset inside the assembled burger | DOM, `translateY` + `translateZ` |
| Camera between layers | **Prerendered video** (`rayo.through`), 2.5–4 s, rendered from the same five cutouts at the R04 framing | the only video in the world |
| Assembly + menu line | DOM layers again | after the video |
| Transition overlay | none needed if the frame contract holds; fallback 120 ms opacity cross-fade | below |

**Making the DOM ↔ video handoff invisible.** Contract on `rayo.through` (22): first frame = the exact R04 composition (same five layers, same offsets, same red, same 1440×900 framing); last frame = the exact R06 start composition. Sequence at `s:R05`: video element is already mounted, paused on frame 0, `opacity: 0`, layered above the DOM layers → on forward crossing call `play()`; on the first `requestVideoFrameCallback` (fallback: `playing` event), set video `opacity: 1` and DOM layers `visibility: hidden` in the same frame → on `ended`, show DOM layers in R06 positions and hide the video in the same frame. Because both ends match pixel-for-pixel, no cross-fade is visible; if a mismatch is found in QA, enable the 120 ms cross-fade. Backward crossing of `s:R05`: video `pause(); currentTime = 0; opacity 0`, DOM layers visible at R04. The video is time-based (an *auto* segment, 08), not scrubbed: scrubbing an inter-frame-compressed video stutters, and an all-intra encode would be far over budget.

**State table (1440×900 design space, same `space` scaling as 08).**

| State | Label | Visible | Transforms | Timing / ease | Trigger | sm |
| --- | --- | --- | --- | --- | --- | --- |
| R00 · SCREEN | `s:SCREEN` | Rayo hero capture at `reelRect`; burger cutout aligned on it | — | — | world start | portrait poster |
| R01 · ISOLATE | `s:ISOLATE` | screen dims; burger lit | dim plane .75 | 1 unit, `settle` | 1 gesture | same |
| R02 · ENTERA (escape + grow) | `s:R02` | burger leaves the screen and grows to center; red field fills | burger: `anchorRect` → center, height 62% of space; screen `scale` .92 → op 0; env op 0 → 1 | 1 unit, `settle` | 1 gesture | burger 70% width |
| R03 · CAPA POR CAPA | `s:R03` | the whole burger is swapped for the 5 aligned layers (identical composite → invisible swap); `Capa por capa.` enters | text mask-up 600 ms equivalent | 0.6 unit, `settle` | 1 gesture | text 44px |
| R04 · EXPLODE | `s:R04` | layers separate physically | per layer `y` (top −32% → bottom +30% of burger height, linear spacing) and `z` (0 / −80 / −160 / −240 / −320); slight `rotateX` 8° on the layer group | 1 unit, `settle` | 1 gesture | `y` only, no z/rotate |
| R05 · THROUGH | `s:R05` | prerendered camera move between layers | video plays (auto) | clip length | crossing `s:R05` forward | separate 9:16 clip, or skipped (see mobile) |
| R06 · ASSEMBLY | `s:R06` | layers come back together | layers return to 0 offsets, staggered bottom-up 60 ms equivalent | 1 unit, `settle` | 1 gesture | same, 2D |
| R07 · HERO LINE | `s:R07` | the menu line `Clásica · … · $ 490` | text mask-in under the burger | 0.6 unit | 1 gesture | line wraps, 16px |

Unit budget ≈ 5.2 units + clip → 450vh. Perspective 1200px on the stage (starting value). `will-change: transform` on the layer group only between R03 and R06.

**Proof (S6).** Recording: hero → menú → producto of the real demo, non-loop, 6–10 s, same `ProofMedia` behaviour as 08. Caption from `projects.ts` (currently “Demo real, navegable.”; the second sentence ships only when Content Master open question 3 is confirmed). Micro case + relation line “Rayo Smash no es un cliente: es la demo que Prospector construye para vender.” Role “Diseño, motion y desarrollo”. Stack line “Next.js 15 · Tailwind v4 · Framer Motion · Apify” (confirmed).

**Mobile.** No 3D; layers separate on `y` only. If a 9:16 `rayo.through.mobile` exists, it plays at R05 exactly like desktop; if not (contract optional), R05 is skipped on sm and R04 goes directly to R06.

**Reduced motion.** Three stills in sequence: assembled burger in the red field → exploded layers (static positions) with “Capa por capa.” → assembled with the menu line. Video never loads.

**Failure.** Video fails or is slow (not `canplaythrough` by the time R05 is reached): R05 is skipped (DOM goes R04 → R06). Layer cutouts missing: the whole-burger cutout stays and only scales (R03–R06 collapse to one state). The poster is always the floor.

## 10 — Santi Nuca Technical Specification

**Approach.** DOM + GSAP + `clip-path`. 2D only (no perspective). The world is an editorial layout that recomposes itself: one photograph → diptych → triptych → system.

**Authorship (fixed, from Content Master 08).** Photography → Santi Nuca. Web design, digital art direction, UX/UI, editorial composition and development → Franco Núñez. The credit `Fotografía · Santi Nuca` is rendered as real text (mono, small, muted) next to the first photograph from the moment it appears and stays visible for the rest of the world; it is also in the proof micro case. No component, alt text or metadata may attribute the photographs to Franco. Alt texts describe the image and end with “— fotografía de Santi Nuca”.

**Copy (verbatim).** World: `Forma · Línea · Textura` and the real page numbering `01 · 02 · 03` only. Proof caption `Sitio real, en línea.` Role `Diseño y desarrollo`.

**Image containers.** Every photograph is a `figure[data-photo=n]` containing a plain `<img>` (`Cutout`-style, not `next/image`, because its box is transformed and clipped during animation; sources are pre-generated AVIF/WebP at 1x/2x — 28). Each figure is laid out at its *largest* size in the sequence; smaller appearances are produced by `clip-path: inset()` (to change visible aspect) plus **uniform** `scale` (to change size). Never non-uniform scale — photographs must not distort. The `<img>` inside uses `object-fit: cover` and a counter-`scale` only if a crop must stay visually fixed while the frame moves.

**Background transition (the rupture).** `env` = a paper `#EDE8DE` plane over the black stage. The rupture animates `env.opacity` 0 → 1 (not `background-color`) with the `reveal` ease, then text in the world switches to ink `#141414` via a `data-tone="paper"` attribute set at the label (CSS colour swap, not tweened). The store is not involved.

**State table (1440×900 space).**

| State | Label | Visible | Transforms / clip | Timing / ease | Trigger | sm (390×844) |
| --- | --- | --- | --- | --- | --- | --- |
| N00 · SCREEN | `s:SCREEN` | Santi opening capture at `reelRect`; photo 1 aligned over its frame in the page (`anchorRect`) | — | — | world start | portrait poster |
| N01 · ISOLATE | `s:ISOLATE` | page dims; photograph lit | dim .75 | 1 unit | 1 gesture | same |
| N02 · RUPTURE + SINGLE | `s:N02` | photograph leaves the page and becomes the single image; black → paper; credit appears | photo 1: `anchorRect` → centered frame (height 78% of space), `clip-path` from page-crop to full photo; `env.opacity` 0→1; screen op → 0 | 1 unit, `reveal` | 1 gesture | photo full-width, 62% height |
| N03 · DIPTYCH | `s:N03` | photo 1 moves left half; photo 2 enters right half | photo 1 `x` −25% + `clip-path` inset right 50% → its half-frame; photo 2 revealed by `clip-path` inset left 100% → 0 | 1 unit, `settle` | 1 gesture | stacked: photo 1 top half, photo 2 bottom half (`clip-path` inset bottom/top) |
| N04 · TRIPTYCH | `s:N04` | three equal columns; labels `Forma`, `Línea`, `Textura` under them; `01 · 02 · 03` | photos 1–2 re-clip to thirds; photo 3 reveals from the right; labels mask-up, 80 ms stagger equivalent | 1 unit, `settle` | 1 gesture | three rows, label right-aligned per row |
| N05 · SYSTEM | `s:N05` | the editorial system: works numbered 01–06 in the site's grid | FLIP: triptych figures tween (uniform `scale` + `x/y`) into their grid cells; photos 4–6 reveal by `clip-path` 120 ms stagger equivalent | 1 unit, `settle` | 1 gesture | 2-column grid, 3 rows |
| hold | — | system holds before unpin | — | 0.4 unit | — | — |

Unit budget ≈ 5.4 → 450vh. Geometry for FLIP (`from`/`to` rects of each figure) is measured on build per tier; never hardcoded px in tweens.

**Proof (S9).** Recording of the real site scroll (opening → works → forma/línea/textura view), non-loop, 6–10 s, `ProofMedia`. Background of the proof section stays paper (continuity with N05); the window border switches to ink at 20%. Micro case and credit from `projects.ts`.

**Mobile choreography.** Vertical recomposition instead of horizontal: single (full width) → two stacked → three rows with labels → 2-column grid. Same labels and credit.

**Reduced motion.** Four static compositions (single, diptych, triptych with labels, system) switched in place at each label; the paper background is set at N02 without a fade.

**Failure.** A photograph fails → its figure shows a paper-toned box at the same size with the alt text visible (no layout shift); the sequence continues. The rupture never depends on images.

## 11 — Chef Arturo Technical Specification

**Principle.** Food first, commerce second. The continuity device: **one image element is the food and then becomes the product photo of the commerce UI.** The UI is rebuilt in DOM around that same element; it never cuts to a screenshot. The real recording only appears afterwards, in the proof.

**Copy (Content Master 09, verbatim).** macro: no text · retrocede: no text · composición: `Merienda · cookies, brownies y boxes dulces` · información: `Cookie levain de pistacho y chocolate blanco · $ 120 · compra directa` · compra: `− 1 + · Agregar al carrito · Mercado Pago · consultar por WhatsApp` · cierre: `Primero el deseo. Después, la compra.` Proof caption `Tienda real, en línea.` (not “con pagos en producción” until Mercado Pago live is confirmed). Role `Producto, diseño y desarrollo`. Brand and photography are not attributed to Franco anywhere.

**Medium per moment.**

| Moment | Medium | Why |
| --- | --- | --- |
| SCREEN / ISOLATE | `Still` (real Chef Arturo hero capture) + product image aligned via `anchorRect` | grammar (07) |
| MACRO | `LoopVideo` (`chef.macro`, 4–6 s seamless, muted) over its identical poster still (`chef.macro.still`) | texture needs life; a loop avoids scrub decoding |
| RETROCEDE (pull back) | the **still** (video paused and hidden on the same frame), scrubbed `scale` 2.4 → 1 | scrubbing a transform on a still is perfectly smooth; scrubbing video is not |
| COMPOSICIÓN | DOM catalog composition: the same image element moves into its card slot; 3 sibling product images reveal by `clip-path` | the image must stay one element |
| INFORMACIÓN / COMPRA | DOM commerce UI rebuilt with real labels (product name, price, quantity stepper, buttons, payment marks as text) | continuity; real copy; no screenshot swap |
| PROOF | real site recording (catalog → product → cart), `ProofMedia` | evidence |

**The bridge (macro → commerce).** `chef.macro.still` and the product photo are the same photograph (the macro video is shot/cropped from it or ends on it — asset contract, 22). At `s:C03` the video pauses, the still under it is already identical, the video hides (same frame). The still then scrubs from macro crop to whole product (`scale` + `x/y` toward its future card slot). At `s:C04` its final rect equals the product-photo rect of the DOM card, so the card's chrome (rule, label, price) grows around an image that never changed. At C05–C06 the card expands into the product view by FLIP (uniform scale + `clip-path`), and the purchase controls mask in beside it.

**DOM commerce UI rules.** It is a depiction, not a working store: controls are rendered as `<span>`s styled like the real ones (no `<button>`, no focusable fake controls), grouped in a `<div role="img" aria-label="Vista de compra de Chef Arturo: Cookie levain de pistacho y chocolate blanco, $ 120, agregar al carrito, Mercado Pago o WhatsApp">`. Visual style follows the real store's UI as seen in the captures, simplified; no invented features. The real, interactive store is reachable only through “Abrir ↗”.

**State table (1440×900 space).**

| State | Label | Visible | Transforms | Timing / ease | Trigger | sm |
| --- | --- | --- | --- | --- | --- | --- |
| C00 · SCREEN | `s:SCREEN` | hero capture at `reelRect`; product image aligned | — | — | world start | portrait poster |
| C01 · ISOLATE | `s:ISOLATE` | capture dims; product lit | dim .75 | 1 unit | 1 gesture | same |
| C02 · MACRO | `s:C02` | the image escapes and fills the viewport at macro crop; loop plays once settled | image: `anchorRect` → full-bleed at `scale` 2.4 (crop centre from contract `macroFocus`); screen op → 0 | 1 unit, `settle`; video `play()` on settle | 1 gesture | full-bleed portrait crop |
| C03 · RETROCEDE | `s:C03` | video hidden on its still; pull back to the whole product | still `scale` 2.4 → 1, `x/y` toward card slot | 1 unit, `none` (scrub-linked) | 1 gesture | same |
| C04 · COMPOSICIÓN | `s:C04` | catalog composition: `Merienda · cookies, brownies y boxes dulces`; 3 sibling products reveal | siblings `clip-path` inset 100% → 0, 80 ms stagger equivalent; heading mask-up | 1 unit, `settle` | 1 gesture | 2×2 grid |
| C05 · INFORMACIÓN | `s:C05` | product view: name, `$ 120`, `compra directa` | card FLIP to product layout; siblings op → 0 | 1 unit, `settle` | 1 gesture | image top, info below |
| C06 · COMPRA | `s:C06` | `− 1 +`, `Agregar al carrito`, `Mercado Pago`, `consultar por WhatsApp` | controls mask-in, 60 ms stagger equivalent | 0.6 unit, `settle` | 1 gesture | stacked |
| C07 · CIERRE | `s:C07` | `Primero el deseo. Después, la compra.` | line mask-up; UI dims .4 | 0.6 unit | 1 gesture | 28px |

Unit budget ≈ 6.2 → \~500vh (diagram shows 450vh as the starting value; tune in QA).

**Proof (S11).** Real recording catalog → product → cart, 6–10 s, `ProofMedia`. Caption `Tienda real, en línea.` Micro case from `projects.ts`. “Siguiente → Capacidades”.

**Reduced motion.** Stills: macro still → whole product → catalog composition → product + purchase UI → closing line. No video.

**Failure.** Macro video fails → the still is already there (it is the poster). Sibling images fail → paper-toned boxes with alt text. The DOM UI never depends on media.

## 12 — Capabilities / Profile

### Capabilities (S12)

**Copy (Content Master 11 + 14, verbatim).** Bust seam: `Todo lo anterior pasó por las mismas manos.` · kicker: `Cinco cosas que se repiten en los cuatro productos. Y una sexta, después de publicar.` · sub-kicker before 06: `Después de publicar` · six capabilities (name · statement · attribution):

| # | Name | Statement | Evidence element | Attribution label |
| --- | --- | --- | --- | --- |
| 01 | Producto | Definir qué se construye, para quién y en qué orden. | DOM mini-sequence reused from the TS world: message → three fields → `reserva confirmada`, 3 states cycling every 1.6 s | TravelSuite360 · 01 |
| 02 | Ingeniería web | Front, back y datos en producción, no en demo. | three real posters (Santi · Rayo · Chef) stacked, the front one cycling every 2 s (`opacity` only) | Santi Nuca · Rayo Smash · Chef Arturo |
| 03 | Comercio digital | Del catálogo al cobro sin fricción. | DOM mini commerce strip reused from the Chef world: `− 1 +` → `Agregar al carrito` → `Mercado Pago` highlight cycling | Chef Arturo · 04 |
| 04 | IA + automatización | Extraer datos de mensajes reales y convertirlos en trabajo hecho. | DOM: the TS sentence with the three key words underlining in turn and resolving to their field labels | TravelSuite360 · Prospector |
| 05 | Experiencias interactivas | Movimiento con propósito: cuando el scroll cuenta algo. | the five Rayo layer cutouts at small size, separation **scrubbed by the rail's own scroll** (the only evidence tied to scroll) | Rayo Smash · 02 |
| 06 | Adquisición de clientes | Publicidad en Meta Ads, orientada a ventas. | `EvidenceSlot` (below) — currently typographic | Meta Ads (mono tag) |

**Layout and scroll.** Desktop (lg/xl): the section pins; vertical scroll translates the rail horizontally (`x` from 0 to `−(railWidth − 100vw + gutter)`), `scrub: 0.8`, no snap. Pin length = rail overflow × 1.0 (≈ 300vh). The bust seam occupies the first viewport of the pin: bust image (`franco.bust` contract, placeholder until produced) with the seam line in mono, small, muted, left-aligned to the bust; it appears with the bust (`opacity` + `y` 12px, at pin start), then the bust slides out left as the rail enters. Cards are equal width (`min(420px, 30vw)`), gap 32px; the gap before 06 is 3× and carries the sub-kicker. Same typography, size and colour for 06 as the other five — no accent colour.

**DOM.** `<section id="capacidades" aria-labelledby>` → seam `<figure>` (bust `alt=""`, seam line as `<p>`) → `<p>` kicker → `<ol>` of six `<li><article>`: `<h3>` name, `<p>` statement, evidence `<div aria-hidden="true">`, attribution as a link to the project world (`/trabajo/{slug}`) or plain text for 06.

**Evidence lifecycle.** Each evidence element is a tiny client island with a time-based loop that runs only while its card is inside the viewport (one shared `IntersectionObserver` for the rail) and the pin is active; all loops pause outside. No video in the rail. Reduced motion: every evidence element shows its final state as a still.

**Keyboard inside a horizontally driven rail.** When focus enters a link inside a card that is off-screen, compute the scroll position at which that card is centered (`pinStart + cardOffset / overflow × pinLength`) and `window.scrollTo` it (instant under reduced motion, smooth otherwise). Tab order follows the list order.

**EvidenceSlot (06 and future use).** Discriminated union, rendered by one component:

| Variant | Renders | Allowed when |
| --- | --- | --- |
| `typographic` (current) | statement at lead size + mono tag `Meta Ads`; no image, no numbers | always (default) |
| `verified-material` | real creative(s) from a real campaign, as `Still`/`LoopVideo`, with a caption naming the client only if authorized | material is real and its use authorized; `source` field filled |
| `campaign` | real material + metrics | every metric has `authorized: true` and a `source`; otherwise the metrics block is not rendered |

Guards: `EvidenceSlot` never renders a `Placeholder` in production (`process.env.NODE_ENV === "production"` → falls back to `typographic`); a unit test fails the build if capability 06 data contains digits in a metric field without `authorized: true`. No ROAS, CPA, CPL, CTR, spend, client counts, platforms other than Meta Ads, or years appear anywhere (Content Master 11).

**Mobile (sm/md).** No pin. Seam (bust + line) as a normal block, then the kicker, then six cards stacked vertically in flow; 06 separated by the sub-kicker. Evidence loops run when each card is ≥ 50% visible. Rayo layers (05) separate on a simple time loop instead of scroll.

### Profile (S13)

**Copy (Content Master 13, corrected).** Core paragraph: `Diseño y construyo productos digitales: la idea, la interfaz, el código y lo que pasa después de publicar. Soy socio de TravelSuite360 y llevo toda su área de software: un sistema que hoy operan tres agencias de viaje. Los otros tres productos de acá arriba los hice de punta a punta. Trabajo desde Uruguay con equipos en cualquier lugar.` · Extension paragraph (smaller, separate): `Construir es una parte. Que llegue a la gente es otra: cuando corresponde, también trabajo la adquisición de clientes con publicidad en Meta Ads.` · Stack line (mono, only if confirmed): `Stack habitual: Next.js · React · TypeScript · Supabase · PostgreSQL · Vercel. IA integrada donde ahorra trabajo real.` · Contact routes (mono, only those present in data): email · LinkedIn. No photo, no heading other than the nav label “Perfil” (visually small; `<h2>Perfil</h2>`). The words “fundador”, “solo”, “por mi cuenta” never appear (a content test asserts this for all TravelSuite360 strings).

**Layout.** Desktop: 12-column grid; label in columns 1–2; core paragraph columns 4–11 at `--type-lead`; extension paragraph columns 4–9 at `--type-body`, 48px below; stack and contact lines in mono at `--type-micro`, 32px below. Tablet: label above, paragraphs full width minus gutters. Mobile: single column, 16px gutters.

**Motion.** Normal flow. One reveal on entry (section top at 75% viewport): each paragraph block reveals as a whole (`clip-path` inset bottom 100% → 0 + `y` 16 → 0, 700 ms, `settle`, 120 ms stagger). No per-word splitting (keeps text intact for assistive tech). Reduced motion: no reveal.

## 13 — Franco At Work

**Approved media (future).** Real video, 8–15 s, desktop 16:9, mobile 9:16. The frame grows to ≈ 95% of the viewport; the visual movement leads toward the monitor, which becomes the transition into the CTA. The asset does not exist yet; the architecture below is final and does not change when it arrives.

**Container.** `<section aria-label="Franco trabajando">` (decorative content, silent — no copy, per Content Master 14) → pinned stage 100svh → `figure[data-part=frame]` holding `LoopVideo` in **non-loop mode** (plays once per entry, holds last frame) with `object-fit: cover`.

| Property | xl / lg | md | sm |
| --- | --- | --- | --- |
| Frame aspect | 16:9 | 16:9 | 9:16 |
| Start size | 56vw wide, centered | 72vw | 72vw wide (9:16 → height 128vw, capped 70svh) |
| End size (≈ 95%) | `95vw × 95svh`, aspect released via `clip-path` (frame is laid out at end size; start size is produced by uniform `scale` + `clip-path` inset, never width/height animation) | same | `95vw × 92svh` |
| Source | `franco.atWork.desktop` (AV1 + H.264, 1920×1080) | desktop | `franco.atWork.mobile` (H.264, 1080×1920) |
| Poster | `franco.atWork.posterDesktop` (first frame) | desktop | `franco.atWork.posterMobile` |
| `preload` | `none` → `metadata` when the profile enters → `auto` at pin start | same | same |

**Scroll and transition boundary.** Pin length 200vh, `scrub: 0.8`, no snap. 0–60%: frame grows from start size to 95% (`scale` + `clip-path`), video plays when the frame is ≥ 50% of the viewport. 60–85%: hold at 95%. 85–100%: **transition boundary** — the frame's content dims toward the monitor region (`monitorFocus` rect in the asset contract, normalized 0–1): a black plane with a `clip-path` hole around `monitorFocus` closes to black over the rest of the frame, then the CTA section starts in flow on black. The transition is defined only by `monitorFocus`, so the placeholder and the final video share it.

**Placeholder (until the real video exists).** `Placeholder` with the same aspect per tier: flat `#141414` field, 1px `#8E8B84` 20% inner rule, a centered `monitorFocus` rectangle drawn as a slightly lighter `#1A1A1B` block, and no text, figure or stock imagery. It runs the same timeline (growth, hold, monitor close). Because the section has no copy and the placeholder carries no evidence claim, it may ship in a preview build; production ships either the real video or omits the section (feature flag `features.francoAtWork`, default `false` until the asset is approved).

**Human moment media (S7, same family).** Contract `moments.human`: one still (desktop 3:2, mobile 4:5) or optional 4–6 s loop with identical poster; `alt=""`; silent. Placeholder: same neutral field as above. Section ships with its placeholder hidden in production (flag `features.humanMoment`, default `false` until the asset exists) — the journey then goes Rayo proof → Santi SCREEN directly, which the 07 handoff already supports.

**Reduced motion.** No growth: the frame is shown at 95% as a still (poster), no autoplay; a visible play button lets the visitor play it. The monitor close becomes a cut to the CTA.

**Failure.** Video error → poster stays at the same size; the monitor-close transition still runs over the poster.

## 14 — Contact

**Copy (Content Master 15 + 16, verbatim).** Title `Ahora, el tuyo.` (signal red — the only red text on the site) · support `Cuatro productos, de la idea a producción. El quinto todavía está en blanco.` · labels `Nombre` · `Email` · `¿Qué estamos construyendo?` · optional placeholder on the third field `Contame lo que tengas, aunque sea una idea.` (only where it fits on one line — omitted on sm if it wraps) · button `Enviar` / `Enviando…` · errors `Falta esto.` / `Revisá el email.` / `No se envió. Probá de nuevo o escribí a {email}` · success `Brief recibido.` Minimal footer `Franco Núñez · Uruguay · {year}` sits **above** the form. Never “Submit”, never “¡Gracias por contactarme!”.

**Architecture: Next.js Server Action, no third-party form provider.** Reuse and adapt `src/app/actions/brief.ts`. Delivery stays on Resend's HTTP API over `fetch` (no SDK). The form uses `<form action={formAction}>` with React 19 `useActionState`, so it works without JavaScript (progressive enhancement) and with JavaScript gets pending/error states without a page reload.

| Layer | Responsibility |
| --- | --- |
| `FinalCta.tsx` (server) | title, support line, footer line, renders `BriefForm` with labels from `data/site.ts` |
| `BriefForm.tsx` (client) | field state, completion readout, client validation on submit, `useActionState(submitBrief)`, focus and announcements, mounts `EndSequence` on success |
| `actions/brief.ts` (server only) | parse `FormData`, honeypot, timing, rate limit, validation, Resend call, typed result |
| env | `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` (verified sender domain) — documented in `.env.example` |

**Input and result types.** Input fields: `name` (2–120 chars, trimmed), `email` (≤ 254, pattern `^[^\s@]+@[^\s@]+\.[^\s@]+$`), `brief` (4–2000 chars), hidden `company` (honeypot, must be empty), hidden `t` (render timestamp, ms). Result: `{ status: "success" } | { status: "error", fields?: { name?: "missing"; email?: "missing" | "invalid"; brief?: "missing" }, route?: true }`.

**States.**

| State | Source | UI |
| --- | --- | --- |
| idle | all fields empty | button enabled; no readout |
| typing | derived: any field non-empty | completion readout `0 % → 100 %` (mono, muted, `aria-hidden`; weights name 20 / email 20 / brief 60 scaling to 140 chars) |
| submitting | `isPending` from `useActionState` | button text `Enviando…`, `disabled`, `aria-disabled`; fields `readOnly` |
| error (fields) | client validation, or server `fields` | `Falta esto.` / `Revisá el email.` under the field in signal red; field `aria-invalid="true"` + `aria-describedby` → the message id; focus moves to the first invalid field |
| error (route) | server `route: true` (Resend failed, or env not configured) | message `No se envió. Probá de nuevo o escribí a {email}` in a `role="alert"` region under the button; values kept |
| success | server `success` **only after Resend returned 2xx** | form replaced by `EndSequence` (02 · S16); focus to the `Brief recibido.` node (`role="status"`, `tabindex="-1"`); store `endActive = true` |

Change from the current file: an unconfigured route is an **error**, not a silent “accepted” — “Brief recibido.” may only appear when the brief was actually delivered (Content Master claim 38).

**Validation.** Client: native attributes (`required`, `type="email"`, `maxLength`) for mobile keyboards and autofill, with `noValidate` on the form so the custom Spanish messages are shown on submit (not browser bubbles). Validation runs on submit and then live per field once that field has shown an error. Server re-validates identically; the server is the authority.

**Spam protection (layered, no CAPTCHA).** (1) Honeypot `company`, visually hidden off-screen with `tabindex="-1"` and `autocomplete="off"`: filled → respond `success` and send nothing. (2) Timing: `now − t < 3000 ms` → same silent success. (3) Rate limit: in-memory per-IP sliding window, 5 submissions / 10 min per server instance (best effort on serverless; upgrade to a KV store only if abuse is observed). (4) Length caps above. (5) Plain-text email only (no HTML rendering of user input); subject `Brief · {name}`; `reply_to` = visitor email.

**Accessibility.** Visible labels (not placeholders as labels); `autocomplete="name"`, `"email"`; focus ring 2px paper, 4px offset; error messages are text, not colour-only; the completion readout is decorative (`aria-hidden`); the textarea auto-grows by `field-sizing: content` where supported, fallback `rows=4`.

**Layout.** Never pinned (mobile keyboard and focus scrolling must behave natively). Desktop: title spans the width; form max-width 720px, left-aligned to the 12-column grid col 4. Mobile: single column; button full width; 16px font-size on inputs (prevents iOS zoom).

## 15 — Responsive

**Four tiers, no others.** Defined once in `globals.css` `@theme` (Tailwind breakpoints) and once in `motion.ts` (GSAP `matchMedia` conditions); the two lists must match.

| Tier | Width | Name in code | Character |
| --- | --- | --- | --- |
| xl | ≥ 1440 | `xl` | reference design (Revelado artboards are 1440) |
| lg | 1024–1439 | `lg` | same choreography, scaled design spaces |
| md | 768–1023 | `md` | tablet: 2D worlds, no pins longer than 450vh, touch-first |
| sm | < 768 | `sm` | phone: own layouts, own media sources, shortest pins |

Orientation is handled by aspect, not by extra breakpoints: any tier with `aspect-ratio < 0.8` uses portrait media sources; landscape phones (`max-height: 500px`) use md choreography with sm media.

**Viewport units.** Pinned stages and full-screen sections use `svh` (stable while mobile URL bars move); never `vh` for pinned heights, never `dvh` for pinned stages (it changes during scroll and forces refreshes). `ScrollTrigger.config({ ignoreMobileResize: true })` stays. Safe areas: header and bottom-anchored UI pad with `env(safe-area-inset-*)`; `viewport-fit=cover` (exists).

**Type scale (fluid tokens, defined once).**

| Token | Use | xl | lg | md | sm |
| --- | --- | --- | --- | --- | --- |
| `--hero-size` | FRANCO / NÚÑEZ | clamp to 340px | 21vw | 22vw | 26vw (stacked) |
| `--type-display` | world names (TS10 88px), CTA title | 88px | 6.1vw | 64px | 44px |
| `--type-statement` | TS raw sentence, “Capa por capa.” | 64px | 4.4vw | 48px | 34px |
| `--type-lead` | support line, bio core | 22–28px | 22px | 22px | 20px |
| `--type-body` | micro case, bio extension | 17px | 17px | 17px | 16px |
| `--type-micro` | labels, mono metadata, firma | 11px, `letter-spacing .12em` | same | same | same |

Values at xl come from Revelado 2.2 and Content Master 04 (firma 11px, support 22px, TS name 88px, raw 64px). Intermediate tiers are interpolations; adjust only for overflow found in QA, never to restyle.

**Per-section behaviour.**

| Section | xl / lg | md | sm |
| --- | --- | --- | --- |
| Opening → Hero | layered stage; FRANCO behind body, NÚÑEZ in front and cropped by the edge; portrait `franco.hero.desktop` | same layering, portrait scaled to 88svh | `franco.hero.mobile` (portrait crop); names stacked; same layering rule; layout per Revelado 2.2 mobile board |
| Reel | 06 geometry; drag + trackpad + keys | 84vw frame; touch swipe | portrait frames 358:420, 8px neighbours, swipe, four-mark indicator |
| Worlds | 1440×900 design space, CSS 3D where specified | same space, **3D off** (2D transforms only), pins capped at 450vh | 390×844 space, 2D, sm columns of 08–11, pins × 0.75 |
| TS big reveal | 64 fragments, 4 groups, drift | 32 fragments, 2 groups | 32 fragments, 2 groups, no drift |
| Rayo through-video | 16:9 clip | 16:9 clip | 9:16 clip if produced, else skipped |
| Proofs | window at `reelRect` | 84vw 16:9 window | full-width 16:9 window; text below |
| Capabilities | pinned horizontal rail | vertical stack, no pin | vertical stack, no pin |
| Profile | 12-col editorial | single column, wide measure | single column |
| Franco at work | 16:9 frame to 95% | 16:9 | 9:16 frame |
| Contact | form col 4–10 | full width | full width, 16px inputs |

**Touch, designed explicitly.** No hover-dependent information anywhere (cursor labels are an enhancement only). Every interactive target ≥ 44×44px. Reel: `touch-action: pan-y`, horizontal axis lock after 8px, tap = enter. Worlds: pure vertical scroll; no taps required to progress. Capabilities evidence loops run on visibility, not hover. No double-tap zoom suppression beyond `touch-action: manipulation` on buttons. Pointer type is read via `(hover: hover) and (pointer: fine)` — never via user-agent sniffing.

**Depth reduction rule.** CSS 3D (`perspective`, `translateZ`) exists only at lg and xl. At md and sm every world timeline is built from its 2D variant inside `gsap.matchMedia`; the content and order of states never change, only their transforms.

## 16 — Reduced Motion

**Mechanism.** `prefers-reduced-motion: reduce` is a `gsap.matchMedia` condition (`rm`) and a CSS media query. Under `rm` every scene still builds, with the **same labels and the same pins** (so the visitor still progresses state by state through native scroll), but every tween between labels has duration 0: states replace each other in place. No travel, no scale, no dolly, no parallax, no autoplaying video, no loops. Pins under `rm` are shortened to `units × 50vh` so the visitor does not scroll long distances through static states. CSS: one scoped rule disables transitions on interactive elements only (the existing scoped rule from Phase I — never the universal `* { transition: none !important }`, which broke pins before).

**What stays.** Opacity cross-fades ≤ 200 ms are allowed for state swaps (they do not trigger vestibular issues and avoid harsh flashes). Focus rings, hover colour changes and the form's text states stay.

**Static equivalents.**

| Section | Reduced-motion experience |
| --- | --- |
| Opening → Hero | Black with grain → portrait shown sharp and full (no band, no focus pull, no red line) → names, firma, support line, index 01. Two states. |
| Reel | Posters only; index changes instantly; prev/next buttons visible; no cursor. |
| Card → world | SCREEN → the object large in its environment (screen hidden) → world states. Cuts. |
| TravelSuite360 | Meaningful states sequentially, flat, no depth: raw sentence (with `input` and origin line) → sentence with the three key words underlined + the three fields listed beside it (`interpretado`) → Opción 01 / Opción 02 → `seleccionada` → trip grid → `reserva confirmada · → reporte actualizado · sin intervención` (signal shown at the bar's end, not travelling) → one flat composition of fragments around the trip → `TravelSuite360 · Una agencia entera, operando.` |
| Rayo | Assembled burger in red → exploded layers still + `Capa por capa.` → assembled + menu line. No video. |
| Santi Nuca | Single → diptych → triptych with `Forma · Línea · Textura` → system. Paper background set at once. Credit always visible. |
| Chef Arturo | Macro still → whole product still → catalog composition → product + purchase UI → closing line. |
| Proofs | Poster + visible play button; no autoplay; captions unchanged. |
| Human moment | Image shown full, no aperture. |
| Capabilities | Same pinned rail (horizontal translation is user-driven and maps 1:1 to scroll, which is acceptable), evidence elements shown as final-state stills. Alternative if QA finds it uncomfortable: vertical stack as on mobile. |
| Franco at work | Frame at 95% as a still poster; play button. |
| Contact / End | Form unchanged. End: `Brief recibido.` → (1.2 s) black → `FRANCO NÚÑEZ`, instant swaps. |

**Reading the preference.** Read once per build through `gsap.matchMedia` (which also rebuilds automatically if the OS setting changes while the page is open). Media components read the same media query to decide whether to mount `<video>` at all.

**QA requirement.** The full journey must be walked with reduced motion enabled on macOS and iOS: no blank stage at any label, no state skipped, all copy reachable, all CTAs reachable.

## 17 — Media Architecture

**One media layer, three video components, two image components.** Every media slot in the site is filled by passing an *asset contract key* (22) to one of: `LoopVideo`, `ProofMedia`, `Still`, `Cutout`, `Placeholder`. `lib/assets.ts` resolves the key to final files or to the placeholder; no component imports a media file path directly.

### Video

**Formats (current browser support).** Two MP4 renditions per clip: **AV1** (`video/mp4; codecs="av01.0.05M.08"`) first, **H.264 High** (`video/mp4; codecs="avc1.640028"`) second. AV1 plays in Chrome, Edge, Firefox and Safari on hardware with AV1 decode; everything else falls back to H.264. No WebM/VP9, no HEVC (not needed with AV1 + H.264). No audio tracks in any clip (strip with `-an`). `faststart` (moov atom first) on all files.

**Source selection.** Desktop vs mobile source is chosen in JS at mount (the client already knows the tier from `matchMedia`), not by `<source media>`, to avoid inconsistent support and double downloads. Changing tier after mount does not swap a playing clip; the next mount uses the new tier.

**Poster strategy.** The poster is a separate responsive `<picture>` (AVIF → WebP → JPEG) **under** the `<video>`, not the `poster` attribute (which cannot be responsive or AVIF). The video is `opacity: 0` until its first frame is presented (`requestVideoFrameCallback`, fallback `playing`), then 1. Poster = exact first frame of the clip, so the swap is invisible.

| Behaviour | `LoopVideo` (reel loops, Chef macro, human moment) | `LoopVideo` non-loop mode (Franco at work) | `ProofMedia` (4 proofs) | Rayo through-clip (inside `RayoWorld`) |
| --- | --- | --- | --- | --- |
| Attributes | `muted playsinline loop disablepictureinpicture disableremoteplayback` | same, no `loop` | `muted playsinline`, no loop | `muted playsinline` |
| Autoplay | only when the owner says `active` and in view ≥ 50% | when frame ≥ 50% of viewport | when ≥ 60% in view | on label crossing |
| Pause | inactive, < 50% in view, tab hidden | same | < 60%, tab hidden | backward crossing |
| Controls | none (decorative, `aria-hidden`) | none; play button under reduced motion | visible play/pause button (`aria-label` “Reproducir” / “Pausar”), “Volver a ver” at end | none |
| `preload` | `none` → `auto` when active/next | `none` → `metadata` → `auto` (13) | `none` → `metadata` → `auto` (per world, 08) | `auto` once the Rayo pin starts |
| Reduced motion | never mounts video | poster + play button | poster + play button | never loads |
| Save-Data / 2G | never mounts video | poster + play button | poster + play button | skipped (R04 → R06) |
| Failure (`error`, `stalled` > 4 s before first frame, `play()` rejected) | poster stays, no retry | poster stays | poster stays, button hidden | state skipped |

**Low-bandwidth detection.** `navigator.connection?.saveData === true` or `effectiveType` in `slow-2g | 2g` → treat as Save-Data. Absent API → assume normal. Never block on detection.

**One-active rule.** A tiny module-level registry in `lib/media.ts` ensures at most **one** decorative loop plays at a time (reel, Chef macro, human moment, capabilities have none); proofs and the Rayo clip can run only while their section is the active one, so in practice one video decodes at any moment.

### Images

| Case | Component | Why |
| --- | --- | --- |
| Posters, captures, proof posters, catalog siblings, profile/bust stills | `Still` = `next/image` with explicit `sizes` | automatic AVIF/WebP, responsive `srcset`, lazy by default, intrinsic size → no CLS |
| Hero portrait (LCP) | `Cutout` with `fetchpriority="high"`, preloaded via `<link rel="preload" as="image" imagesrcset>` | needs alpha, `img.decode()` control for O2, and exact intrinsic dimensions for the type layering |
| Alpha cutouts used for pixel alignment (Rayo whole burger + 5 layers, TS/Chef escaping objects) | `Cutout` (plain `<img>` with pre-generated AVIF + WebP with alpha, 1x/2x) | alignment depends on known intrinsic sizes and crops; avoid optimizer re-cropping or format changes per request |
| Images animated beyond their layout size (Chef macro still at 2.4×, Santi photos in FLIP) | `Cutout` with sources sized for the **largest** rendered size | `next/image` picks a `srcset` candidate for the layout size, which then blurs when scaled up |
| Grain tile, LQIP | CSS background / inline base64 (< 1 KB LQIP) | tiny, static |

**Generation.** A build script `scripts/media.mjs` (sharp) produces Cutout variants from masters in `media-src/` (git-ignored if large; masters live in the asset delivery folder) into `public/media/{group}/`: AVIF q50 + WebP q78 at 1x/2x, plus a 16px LQIP base64 written into `data/assets.ts`. `next/image` handles `Still`s at request time with `images.formats = ['image/avif','image/webp']`.

**Layout stability.** Every media element reserves space by `aspect-ratio` (from the contract) before any byte loads. No media changes layout when it arrives; ScrollTrigger positions never depend on media load.

## 18 — Performance Budget

**Targets (field-like lab: Lighthouse mobile, Moto G Power class, 4G throttling; and desktop).**

| Metric | Mobile | Desktop |
| --- | --- | --- |
| LCP (hero portrait or hero name) | ≤ 2.5 s | ≤ 1.8 s |
| CLS | ≤ 0.02 | ≤ 0.02 |
| INP | ≤ 200 ms | ≤ 150 ms |
| TBT (lab) | ≤ 250 ms | ≤ 100 ms |
| Scroll / motion frame rate | ≥ 50 fps sustained on iPhone 12 / Pixel 6 class | ≥ 55 fps sustained (60 target) on 2020 MacBook Air class |

**Budgets (compressed transfer size).**

| Item | Desktop | Mobile | Loading class |
| --- | --- | --- | --- |
| Initial JS (first load, all chunks needed to hydrate above the fold) | ≤ 170 KB gz | same | EAGER |
| — of which GSAP core + ScrollTrigger | ≈ 45 KB gz | same | EAGER |
| World timeline builders (per world) | ≤ 15 KB gz each | same | dynamic `import()` when the world is within 2 viewports |
| CSS | ≤ 30 KB gz | same | EAGER |
| Fonts: Schibsted Grotesk (2 weights, latin subset, woff2) + mono (1 weight) | ≤ 90 KB total, 2 files preloaded | same | EAGER (preload display weight only) |
| Hero portrait (cutout, AVIF) | ≤ 180 KB | ≤ 110 KB | EAGER + `fetchpriority=high` + preload |
| LQIP + grain tile | ≤ 1 KB inline + ≤ 8 KB | same | EAGER |
| **Total eager media before any scroll** | **≤ 200 KB** | **≤ 130 KB** | — |
| Reel poster (each, AVIF) | ≤ 120 KB | ≤ 70 KB | PREFETCH when H1 is reached; LAZY otherwise |
| Reel loop (each, AV1; H.264 ≤ 1.6×) | ≤ 1.5 MB (3–6 s, 1640×924 max) | ≤ 0.7 MB (720×844) | ON-DEMAND (active / next only) |
| Proof video (each) | ≤ 3 MB (8–10 s, 1600×900) | ≤ 1.5 MB (960×540) | ON-DEMAND (per world) |
| Rayo through-clip | ≤ 2.5 MB | ≤ 1.5 MB | ON-DEMAND (Rayo pin start) |
| Chef macro loop | ≤ 1.5 MB | ≤ 0.8 MB | ON-DEMAND (Chef pin start) |
| Franco at work | ≤ 6 MB (12 s, 1920×1080) | ≤ 3.5 MB (1080×1920) | ON-DEMAND (profile enters) |
| Stills / cutouts in worlds | ≤ 250 KB each at the largest rendered size | ≤ 150 KB | LAZY (2 viewports ahead) |

Nothing from the reel onward loads during the opening. The full portfolio is never preloaded.

**Loading classes, defined.** EAGER = in the initial HTML/critical path. PRELOAD = `<link rel="preload">` in `<head>` (only the hero portrait for the current tier and the display font). PREFETCH = low-priority fetch after the hero is interactive (`requestIdleCallback`), only for the reel posters and the TS world builder chunk. LAZY = `loading="lazy"` / IntersectionObserver with `rootMargin: 200% 0px`. ON-DEMAND = created by a component's lifecycle rule (17), never before.

**JS discipline.** Copy is server-rendered; client components receive only the props they need. World timeline builders and the TS reveal data (`data/ts-reveal.ts`, \~4 KB) are separate chunks. No client-side data fetching. No analytics script unless approved (Content Master open question; if added, it must be cookieless and ≤ 5 KB, loaded after `load`).

**GPU promotion policy.** Promotion (`will-change: transform` or a 3D transform) is useful only for an element that is *currently* animating `transform`/`opacity` and is large or frequently repainted. It becomes harmful when applied permanently to many elements (each promoted layer costs GPU memory proportional to its pixel area; dozens of full-viewport layers exhaust mobile GPU memory and cause checkerboarding and jank). Rules: (1) no `will-change` in static CSS except the pinned stage of the *currently active* scene, toggled by its ScrollTrigger `onToggle`; (2) GSAP sets/clears `will-change` in `onStart`/`onComplete` for time-based tweens; scrubbed scenes set it on their animated groups on enter and clear on leave; (3) never promote individual small items in large sets (TS fragments, list items) — promote their group; (4) maximum simultaneously promoted layers ≈ 8 on mobile, ≈ 16 on desktop, verified in the Chrome Layers panel; (5) `filter: blur()` is never animated on large elements.

**Monitoring.** `next build` output reviewed per phase for first-load JS; Lighthouse CI (mobile + desktop) run at Phase 11 and 12 against the budgets above; failure of LCP, CLS or initial JS blocks the phase.

## 19 — Accessibility

**Target.** WCAG 2.2 AA for everything that conveys information or accepts input. The experimental visuals are an enhancement over a document that is fully understandable by keyboard and screen reader alone.

**Semantic hierarchy.**

```
<html lang="es">
<a href="#contenido" class="skip">Saltar al contenido</a>
<header> marca (link to /) · nav: Trabajo · 01–04 (button, opens dialog) · Perfil · Ahora, el tuyo
<main id="contenido">
  <section aria-label="Franco Núñez">     <h1 class="sr-only">Franco Núñez</h1> + firma <p> + support <p>
  <section id="trabajo">                    <h2>Cuatro productos.</h2>  → each item <h3>
  <section id="travelsuite360">             <h2>TravelSuite360</h2> (sr-only until TS10 shows it visually) + world text + proof <h3>/<figure>
  … rayo-smash, santi-nuca, chef-arturo (same pattern)
  <section id="capacidades">                <h2 class="sr-only">Capacidades</h2> + kicker + <ol> of <article><h3>
  <section id="perfil">                     <h2>Perfil</h2>
  <section id="contacto">                   <h2>Ahora, el tuyo.</h2> + <form>
</main>
```

Visually hidden headings are allowed only where the visual design carries the same text later or elsewhere (e.g. the TS name revealed at TS10). Decorative sections (human moment, Franco at work) are `aria-hidden="true"` with no focusable content.

**Animated and duplicated text.** Rule: every piece of copy exists exactly once in the accessibility tree.

| Case | Implementation |
| --- | --- |
| Giant FRANCO / NÚÑEZ | `aria-hidden` spans; accessible name is the sr-only `<h1>` |
| TS key words that detach (copies fly, originals become gaps) | the original sentence stays in the tree intact (its spans keep their text node; only `color: transparent` is applied); flying copies are `aria-hidden` |
| TS fields, quote, trip, reservation, fragments | the world's states are summarized once in a visually hidden ordered list inside the section (`<ol class="sr-only">`: mensaje recibido → datos interpretados: destino Punta Cana, fechas julio, pasajeros 4 → dos opciones de cotización, una seleccionada → viaje armado → reserva confirmada, reporte actualizado, sin intervención); the visual pieces are `aria-hidden`. The list uses only Content Master words. 64 fragments: `aria-hidden` always. |
| Text revealed by masks (`clip-path`) | the text node is always in the DOM and unclipped for AT; masks never use `display:none` / `visibility:hidden` on copy |
| Rayo/Chef/Santi visual-only states | world copy is real text; images carry alt per 28; the Chef DOM commerce UI is one `role="img"` with a full label (11) |
| Live regions | only two: the reel announcement (`polite`) and form errors (`alert`). Scroll-driven states never announce (they would chatter). |

**Keyboard and focus order.** Skip link → header (marca, Trabajo, 01–04, Perfil, Ahora, el tuyo) → hero (no focusables) → reel (active item's "Ver caso", "Abrir ↗", then the 01–04 buttons) → each world's proof (play/pause, "Abrir ↗", "Siguiente →") → capabilities attribution links → profile contact links → form fields → "Enviar". Worlds themselves have no focusable elements (they are scroll narratives); their text is reachable by screen-reader browse mode. Native page scrolling with Space / PageDown / arrows works everywhere because nothing captures keys outside the reel rules in 06.

**Reel keyboard behaviour.** As specified in 06: ←/→/Home/End/1–4/Enter scoped to the reel; roving tab order on the active item; visible focus ring; announcement on settle; buttons as a complete non-gesture alternative.

**Overlay (01–04).** Native `<dialog>` opened with `showModal()` (focus trap, Esc, inert background for free). Focus goes to the current project; on close focus returns to the trigger. Selecting a project closes the dialog and navigates (20).

**Decorative media.** Loops, grain, human moment, Franco at work, bust: `alt=""` / `aria-hidden`. Proof videos are informative: visible play/pause control, `aria-label` “Recorrido por {name}”, and the caption + micro case give the same information in text (no audio, so no captions needed; no essential information is only in video).

**Contrast.** Paper `#EDE8DE` on black `#0B0B0C` ≈ 16:1; muted `#8E8B84` on black ≈ 5.8:1 (AA for body); ink `#141414` on paper ≈ 15:1; muted on paper ≈ 2.8:1 → **muted is not used for text on paper** (use ink at 70% instead, ≈ 6.2:1). Signal red `#E63B2E` on black ≈ 4.7:1 → passes AA for the CTA title and error messages; red on paper ≈ 3.4:1 → never used for text on paper. Ratios computed with the WCAG relative-luminance formula. Text over images (TS fragments excluded, decorative) always sits on a solid or ≥ 60% scrim.

**Motion safety.** Reduced motion fully supported (16). No flashing content (> 3 flashes/s). The red signal crossings are single events.

**Forms.** As in 14: visible labels, `aria-invalid`, `aria-describedby`, focus to first error, `role="alert"` for route errors, `role="status"` for success.

**Testing.** axe-core in Playwright for every route at each phase; manual VoiceOver (macOS Safari, iOS Safari) and NVDA (Firefox/Windows) passes at Phase 10 and 12.

## 20 — Routing

**Recommendation: hybrid — one continuous journey, served at several real URLs.** Every route renders the *same* `Journey`; the route only decides where the visitor starts and which metadata the server sends. The visual experience is identical on every URL.

| Route | Rendering | Starts at | Metadata (Content Master 17) |
| --- | --- | --- | --- |
| `/` | static (SSG) | Opening | Home title/description/OG |
| `/trabajo/travelsuite360` | static (`generateStaticParams`) | TS world SCREEN state, opening skipped | `TravelSuite360 — Franco Núñez` + its description |
| `/trabajo/rayo-smash` | static | Rayo SCREEN | its title/description |
| `/trabajo/santi-nuca` | static | Santi SCREEN | its title/description |
| `/trabajo/chef-arturo` | static | Chef SCREEN | its title/description |
| `/#capacidades`, `/#perfil`, `/#contacto` | fragments on `/` | that section | Home |
| unknown | `not-found.tsx` | — | “No existe. ← Trabajo” |

**Deep-link start.** On a `/trabajo/{slug}` load, the server renders the full journey HTML (crawlable, readable without JS). The server also renders the target section with `data-initial` and inline CSS that hides the opening states and shows the hero in its H2 state, so there is no flash of the opening. On the client, `JourneyClient` waits for the first ScrollTrigger refresh, then `window.scrollTo({ top: worldStart, behavior: "instant" })`. No smooth scroll on load. Browser scroll restoration is set to `manual` only for this initial jump, then restored to `auto`.

**URL sync while scrolling.** `route-sync` subscribes to the store's `section`. When a world becomes the active section, `history.replaceState(null, "", "/trabajo/{slug}")`; when a non-world section is active, `replaceState` to `/` (+ `#capacidades` / `#perfil` / `#contacto` for those sections). `replaceState` never creates history entries, so scrolling does not pollute Back. Document title updates with the URL (`document.title` from the same metadata table).

**Explicit navigation creates history.** Reel “Ver caso”, 01–04 overlay selection, “Siguiente →”, header links and capability attribution links call `history.pushState` with `{ section }` and then perform the jump (06 for worlds). `popstate` → read `state.section` (or parse the path) → instant scroll to that section's start. So Back after entering a world from the reel returns to the reel.

**Next.js specifics.** Since Next 14.1 the App Router integrates native `pushState`/`replaceState` with `usePathname`, so manual history calls do not trigger re-renders or refetches. Do **not** use `router.push` for in-journey navigation: it would navigate between two page entries (`/` and `/trabajo/[slug]`), remounting the journey. `<a href>` links still point at the real URLs (so middle-click, copy-link and no-JS work) and are intercepted with `preventDefault` only for plain left-clicks.

**SEO and sharing.** Each route has its own `<title>`, description, canonical (self-referencing) and OG image; JSON-LD `Person` only on `/`. Because the body is the same journey, the per-project routes differ by metadata and initial position, not content; this is an accepted trade-off (Open Engineering Question 9). The sitemap lists `/` and the four project routes.

**No-JS behaviour.** `/trabajo/{slug}` without JS shows the full document; a server-rendered in-page anchor link at the top (“Ir a {name}” → `#{slug}`) lets the visitor jump. Forms work without JS (14).

## 21 — Data Model

**Separation.** `data/*.ts` holds **content** (copy, facts, links, asset keys) — the only place Content Master text lives in code. World files hold **animation logic** (labels, transforms, durations) and read content only through props. Geometry/timing constants live in `lib/motion.ts` and in each world's timeline builder, never in `data/`. A content change never touches a world file; an animation change never touches `data/`.

**Conceptual schema** (shape, not implementation):

```
ProjectSlug   = "travelsuite360" | "rayo-smash" | "santi-nuca" | "chef-arturo"
WorldType     = "ts-depth" | "rayo-layers" | "santi-editorial" | "chef-commerce"
ClaimStatus   = "confirmed" | "pending"      // pending fields are NEVER rendered

Gated<T>      = { value: T; status: ClaimStatus; note?: string }

Project {
  id: ProjectSlug                  // also the URL slug and section id
  index: 1 | 2 | 3 | 4             // display "01"…"04"; order of the journey
  name: string                     // "TravelSuite360"
  category: string                 // "SaaS para agencias de viaje"
  role: string                     // "Socio · Producto e ingeniería"
  oneLine: string
  microCase: string
  relationLine?: string            // Rayo only: "Rayo Smash no es un cliente: …"
  credit?: { label: string; holder: string }   // Santi: { "Fotografía", "Santi Nuca" }
  proofLine: string                // only the confirmed sentence(s)
  year?: Gated<string>
  liveUrl?: Gated<string>          // "Abrir ↗" renders only if confirmed
  stack?: Gated<string[]>
  worldType: WorldType
  worldCopy: Record<string, string>   // keyed by world state id, e.g. { TS01: "…", TS10: "…" }
  theme: { env: "black" | "red" | "paper" | "image"; tone: "paper-on-black" | "ink-on-paper" }
  reel: { aspect: { desktop: [w, h]; mobile: [w, h] }; poster: AssetKey; loop: AssetKey }
  screen: { poster: AssetKey; object: AssetKey; anchorRect: { desktop: Rect01; mobile: Rect01 } }
  proof: { media: AssetKey; chapters?: { label: string; at: number }[] }
  a11y: { reelLabel: string; proofVideoLabel: string; worldSummary: string[] }
  next: ProjectSlug | "capacidades"
  meta: { title: string; description: string; ogImage: AssetKey }
}

Capability {
  index: 1..6; name: string; statement: string
  group: "core" | "extended"       // 06 = extended (sub-kicker "Después de publicar")
  attribution: { label: string; href?: string }
  evidence: EvidenceVariant        // 12: typographic | verified-material | campaign
}

Site { nav, hero: { name: ["FRANCO","NÚÑEZ"], firma, support, index }, reel: { label, heading },
       capabilities: { seam, kicker, subKicker }, profile: { core, extension, stack?: Gated<string>,
       contacts: Gated<{ label: string; href: string }>[] }, cta: { title, support, fields, button,
       states, errors, success }, footer, notFound, meta }

AssetKey  = string                 // e.g. "ts.reel.poster" — resolved by lib/assets.ts (22)
Rect01    = { x: number; y: number; w: number; h: number }   // normalized 0–1 in the asset's own space
```

**Rules enforced by tests (Phase 1).** (1) Any `Gated` with `status: "pending"` is not rendered and does not appear in HTML. (2) No TravelSuite360 string contains “fundador”, “founder”, “solo” or “por mi cuenta”. (3) Santi Nuca has `credit.holder === "Santi Nuca"` and every Santi photo alt ends with “fotografía de Santi Nuca”. (4) Chef proof line is “Tienda real, en línea.” unless a `paymentsLive` flag is confirmed. (5) Capability 06 has no numeric metrics unless authorized (12). (6) Every `AssetKey` referenced exists in the registry. These turn the Content Master's claim audit into build failures instead of reviews.

**Current values of the gated fields** (from Content Master 19): `year` pending for all four → not shown; `liveUrl` pending for all four → “Abrir ↗” hidden until URLs arrive; `stack` confirmed only for Rayo; profile `stack` pending; contacts pending; Rayo proof second sentence pending; Chef payments live pending.

## 22 — Asset Contracts

**What a contract is.** An entry in `data/assets.ts`: `{ key, kind, aspect (per tier), files (per tier, per format), poster?, lqip?, meta, status: "final" | "placeholder" | "derived", privacyChecked?: boolean }`. Components ask for a key; `lib/assets.ts` returns final files when `status !== "placeholder"`, else a `Placeholder` description with the same aspect, timing and metadata. Replacing a placeholder = adding files and flipping `status`; no component or timeline changes. Size limits per kind are in 18.

**Kinds.** `still` (next/image) · `cutout` (alpha, plain img, 1x/2x AVIF+WebP) · `loop` (seamless muted clip + poster = first frame) · `proof` (non-loop clip + poster = first frame) · `clip` (non-loop clip with first/last-frame composition contract) · `og` (1200×630 PNG/JPEG).

| Key | Kind | Aspect / size (desktop · mobile) | Required metadata | Today |
| --- | --- | --- | --- | --- |
| `franco.hero.desktop` / `.mobile` | cutout | master ≥ 2400px tall · mobile crop 4:5 | LQIP; head/shoulder line y (for name layering) | placeholder (no portrait exists) |
| `franco.bust` | cutout | ≥ 1600px tall | — | placeholder |
| `franco.atWork.desktop` / `.mobile` (+ posters) | proof (non-loop) | 16:9, 1920×1080 · 9:16, 1080×1920, 8–15 s | `monitorFocus` (Rect01, per tier) | placeholder; section flagged off in production |
| `moments.human` | still (or loop) | 3:2 · 4:5 | — | placeholder; flagged off |
| `site.grain` | still | 256×256 tile | — | derived (generated noise) |
| `{p}.reel.poster.desktop` / `.mobile` | still | per project (06) · 358:420 | `anchorRect` of the escaping object | Rayo, Santi, Chef: derived from real captures in `public/projects/*`; TS: placeholder (no TravelSuite captures exist) |
| `{p}.reel.loop.desktop` / `.mobile` | loop | same as poster, 3–6 s, seamless | first frame = poster | placeholder for all four |
| `ts.screen.message` | (none — DOM text) | — | `anchorRect` of the message inside `ts.reel.poster` (both tiers) | needs the TS poster |
| `rayo.burger` | cutout | whole burger, alpha | `anchorRect` in Rayo poster | derived (from real capture; final cutout to produce) |
| `rayo.layers.{topBun,bacon,onion,patty,bottomBun}` | cutout | each cropped to its bounds | `offset` of each layer inside the assembled burger (Rect01) | to produce (bands identified in the existing capture) |
| `rayo.through.desktop` / `.mobile` | clip | 1920×1080 (16:9) · 1080×1920 (optional) | first frame = R04 composition; last frame = R06 start composition; red background `#E63B2E` | to produce |
| `santi.photo.{1..6}` | cutout (sources sized for largest render) | original photographs | `alt` (ends “— fotografía de Santi Nuca”), credit holder; `anchorRect` of photo 1 in Santi poster | placeholder: crops of existing captures; originals needed from Santi Nuca with permission |
| `chef.product` (= `chef.macro.still`) | cutout (largest render) | high-res product photograph | `anchorRect` in Chef poster; `macroFocus` (Rect01 for the 2.4× crop) | placeholder: crop of `chef-arturo-pdp-cookie-levain`; original needed |
| `chef.macro.loop` | loop | full-bleed, 4–6 s | first frame = `chef.macro.still` at 2.4× crop | to produce |
| `chef.catalog.{1..3}` | still | product card aspect from the real catalog | alt | derived from catalog capture, originals preferred |
| `{p}.proof.desktop` / `.mobile` (+ poster) | proof | 16:9, 1600×900 · 960×540, 6–10 s (TS: 8 s, cuts at 3.0 / 5.5 s) | `chapters` (TS); `privacyChecked: true` required for TS | to record (all four) |
| `og.home`, `og.{p}` | og | 1200×630 | — | to produce (Content Master 17: hero “FRANCO / NÚÑEZ” paper on black) |
| `capability.06.evidence` | (EvidenceSlot variant) | per variant | `source`, `authorized` | none — typographic variant |

`{p}` ∈ `ts`, `rayo`, `santi`, `chef`. Masters live outside the repo (asset delivery folder); only optimized outputs are committed under `public/media/{franco,travelsuite,rayo,santi,chef,site}/`.

**Build-time checks.** A script validates every contract with `status: "final"`: files exist for every declared tier/format, sizes within budget (18), video duration within range, posters exist, `anchorRect`/`macroFocus`/`monitorFocus` present where required, and `privacyChecked === true` for every TravelSuite360 media file. A failing check fails `next build` in CI.

**Placeholder strategy.** One `Placeholder` component, driven by the contract, preserves aspect ratio (per tier), layout, timing (loops: a 4 s CSS-free static frame; clips/proofs: a fixed duration from the contract so autos and holds behave the same) and the component interface (it accepts the same props as the real component, including `anchorRect`, `macroFocus`, `monitorFocus`). Look: flat `#141414` (on black) or `#D6D0C4` (on paper), 1px inner rule at 20%, and a small mono tag with the asset key, visible **only in development and preview** (`NEXT_PUBLIC_SHOW_ASSET_KEYS`). Placeholders never contain imagery, stock, AI-generated pictures, fake UI, fake numbers or text that could read as evidence.

| Slot | Placeholder in dev/preview | In production while missing |
| --- | --- | --- |
| Franco portrait (hero) | neutral silhouette-free field at the cutout's aspect; names still layer over it | **blocks launch** — the hero needs the real portrait |
| Franco at work | neutral field + `monitorFocus` block (13) | section omitted (`features.francoAtWork = false`) |
| Human moment | neutral field | section omitted (`features.humanMoment = false`) |
| Rayo prerender | R05 skipped (R04 → R06) | same — the world is complete without it |
| Chef macro video | the macro still (no loop) | same — still only |
| Reel loops | posters only | posters only (allowed: posters are real captures) |
| Proof recordings | poster-sized neutral field + caption | **blocks launch** for that project's proof; the proof window shows the real poster capture with no play button until the recording exists |
| TS posters / captures | neutral field | **blocks launch** — TravelSuite360 needs real, privacy-safe captures |
| Meta Ads evidence | typographic variant | typographic variant (that *is* the production state) |

A CI check fails a production build if any slot marked “blocks launch” still resolves to a placeholder.

## 23 — Privacy

**Rule.** No published media may expose real operational data. For TravelSuite360 this is the default risk: the product handles agencies' clients, passengers, messages and money. **Controlled demo data is required; blurring production data is the last resort**, and a blurred frame must still pass every check below (blur can be reversed or can miss frames in motion).

**Demo data standard (TravelSuite360).** Record in a dedicated demo tenant (or a seeded local environment) with: an invented agency name not matching any real agency; invented client names that are obviously fictional; no phone numbers, or numbers in a reserved fictional range; emails on `example.com`; the scripted inquiry “Necesito viajar a Punta Cana en julio, somos cuatro.” as the TravelChat message (matches the world copy); no real prices from real suppliers (round demo prices); no internal IDs visible (hide ID columns or use demo-range IDs); no user avatars of real people; browser chrome, OS notifications, bookmarks and extensions hidden.

**Pre-publication media checklist** (every frame of every TravelSuite360 still/video, plus any capture of a client site that shows customer-facing data). Sign-off sets `privacyChecked: true` in the contract; the build refuses TS media without it.

| # | Check | Pass when |
| --- | --- | --- |
| 1 | Phone numbers | none visible, or demo range only |
| 2 | Email addresses | none, or `@example.com` only |
| 3 | Personal names | only invented demo names |
| 4 | Passenger data (document numbers, birth dates, nationalities, passport/ID) | none |
| 5 | Private messages | only the scripted demo conversation |
| 6 | Credentials, API keys, tokens, URLs with tokens, admin URLs | none (check address bar, dev tools, toasts) |
| 7 | Internal identifiers (record IDs, booking codes, PNRs, invoice numbers) | none, or obviously fake demo codes |
| 8 | Agency data (real agency names, logos, supplier contracts, commissions) | none |
| 9 | Financial information (real amounts, payment status of real clients, card data) | demo amounts only |
| 10 | Third-party UI with personal data (WhatsApp profile photos, contact names) | demo contacts only |
| 11 | Metadata | video/image EXIF and container metadata stripped (`ffmpeg -map_metadata -1`, sharp strips by default) |
| 12 | Frame-by-frame review | reviewed at 0.25× speed for videos (fast cuts can flash data) |
| 13 | Second reviewer | a second person (Franco + one partner of TravelSuite360) approves, since the company has three partners |

**Client sites (Rayo, Santi, Chef).** Captures show public pages only. Chef Arturo: no customer names, order numbers or WhatsApp conversations in recordings; cart shown with demo quantities. Santi Nuca: photographs used only with Santi's permission (Open Engineering Question 3).

**Site-level privacy.** No cookies; no analytics unless approved (cookieless only); the contact form sends to email and stores nothing server-side; Resend payload contains only the three fields; no IP addresses are logged beyond the in-memory rate limiter's short window.

## 24 — Failure Modes

**Baseline guarantee.** The server HTML is a complete, readable editorial document. Animation code only *adds* states on top of a static layout that already makes sense. CSS uses a `.js` class on `<html>` (set by a tiny inline script in `<head>`, before paint) to switch from the static layout to the animated initial states; without that class, nothing is hidden. **No section may be blank at full-screen size in any failure mode.**

| Failure | Detection | Degradation | Never |
| --- | --- | --- | --- |
| JS disabled / blocked | no `.js` class | static document: hero with portrait and text; reel as a 4-item vertical list of posters with links; each world as its final state composition + world copy as text; proofs as posters with captions; capabilities as a list; form works (server action POST) and returns the End block | hidden copy, empty pinned stages |
| JS delayed (slow hydration) | `.js` set but scenes not built yet | initial states are the *readable* first state of each section (hero H2-like layout, world SCREEN state with poster visible); scroll works natively; once built, timelines adopt the current scroll position (no jump) | opacity-0 waiting screens |
| GSAP fails to load / throws | try/catch around each scene build; `window.__gsapFailed` | that section removes its `data-anim` attribute → falls back to its static layout (same as no-JS for that section only) | one failure breaking all sections |
| A scene throws during build | per-scene error boundary (React) + try/catch in `useScene` | that section renders static; others unaffected; error logged to console in dev only | console errors in production |
| Video fails (network, codec, decode, autoplay blocked) | `error`, `stalled` > 4 s before first frame, rejected `play()` | poster stays (it is always underneath); proof play button hidden; Rayo R05 skipped; Chef macro shows still | black rectangle, spinner, retry loops |
| Image fails | `onError` | paper/graphite box at the reserved aspect with the alt text visible in mono; layout unchanged | broken-image icon, layout shift |
| Hero portrait slow | not decoded by 2.5 s | O2 completes with LQIP; sharp swap later (02) | blocking the page |
| Fonts slow | `font-display: swap` + metric-compatible fallback (`size-adjust` tuned for Schibsted Grotesk) | fallback renders; scenes rebuild once on `document.fonts.ready` (existing behaviour) | invisible text (FOIT) |
| Slow network / Save-Data | `navigator.connection` (17) | no video mounts; posters + play buttons; stills lazy as usual | auto-downloading MBs of video |
| Touch device | `(hover: none)` / `(pointer: coarse)` | no cursor; swipe reel; all hover info available otherwise | hover-only information |
| Reduced motion | media query | full RM experience (16) | broken layouts from blanket `transition: none` |
| Very small / very short viewport (< 360 wide or < 560 tall) | matchMedia | pins disabled (`rm`-style stepping without pins), sections in flow | content clipped by pinned 100svh stages |
| Form backend unavailable / env missing | Resend non-2xx, fetch throws, missing env | `route` error: “No se envió. Probá de nuevo o escribí a {email}”, values kept | fake “Brief recibido.” |
| Rate limit hit | server window | same route error message (no hint for bots) | silent drop of a real visitor's brief |
| Deep link to unknown slug | route params | `not-found.tsx`: “No existe. ← Trabajo” | 500 error |
| Placeholder present in production for a launch-blocking slot | CI asset check (22) | build fails | shipping fake evidence |

## 25 — Folder Architecture

Adapted to the existing repo (which uses `src/`, `src/data`, `src/lib`, `src/fonts`, `public/projects`, `docs/`). Paths marked **keep** exist today; **new** are added; **retire** are removed in Phase 1 once the new shell renders.

```
src/
  app/
    layout.tsx                  keep (swap fonts, lang="es", metadata from data/site)
    page.tsx                    keep (renders <Journey />)
    trabajo/[slug]/page.tsx     new
    not-found.tsx               new
    sitemap.ts, robots.ts       new
    actions/brief.ts            keep (adapt, 14)
    globals.css                 keep (rewrite: Revelado tokens, 4 tiers, .js gating, scoped RM rule)
  components/
    journey/                    new   Journey, JourneyClient
    layout/                     new   SiteHeader, ReelOverlay, MinimalFooter
    opening/                    new   OpeningHero
    reel/                       new   ProjectReel, ReelItem
    worlds/                     new   WorldScene, TravelSuiteWorld, TravelSuiteReveal, RayoWorld,
                                      SantiWorld, ChefWorld, ProjectProof
    moments/                    new   HumanMoment, FrancoAtWork
    capabilities/               new   CapabilitiesRail, EvidenceSlot
    profile/                    new   Profile
    contact/                    new   FinalCta, BriefForm, EndSequence
    media/                      new   LoopVideo, ProofMedia, Still, Cutout, Placeholder
    a11y/                       new   SrOnly, VisuallyAnimatedText
    scenes/                     retire (ENSAMBLE)
    system/                     retire (mine Cursor.tsx first)
    Experience.tsx              retire
  lib/
    motion.ts                   keep (Revelado tokens, tiers, GESTURE_VH, directionalSnap)
    useScene.ts                 keep (extend: matchMedia, s:/m: labels, api.auto)
    store.ts → journey-store.ts keep (shrink to 3 fields)
    geometry.ts                 new   reelRect, design-space scale
    useInView.ts                new
    media.ts                    new   one-active registry, Save-Data probe
    assets.ts                   new   contract resolver
    route-sync.ts               new
    seeded.ts                   new   mulberry32 (used by the script only)
  data/
    site.ts                     keep (rewrite from Content Master)
    projects.ts                 keep (rewrite to the 21 model)
    capabilities.ts             new
    profile.ts                  new
    assets.ts                   new   contract registry
    ts-reveal.ts                new   generated, committed
    system.ts                   retire
  fonts/                        keep folder; add Schibsted Grotesk woff2 (+ license); keep IBM Plex Mono 400 if confirmed (Q2); retire Archivo Narrow, Plex Sans
public/
  media/
    franco/  travelsuite/  rayo/  santi/  chef/  site/     new (optimized outputs only)
  projects/                     keep until Phase 11, then move captures into media/* and delete
scripts/
  gen-ts-reveal.mjs             new
  media.mjs                     new   sharp pipeline for cutouts/LQIP
  check-assets.mjs              new   contract + budget + privacy validation (CI)
tests/
  e2e/                          new   Playwright: journey, reel, routes, form, RM, a11y (axe)
  content.test.ts               new   claim guards from 21
docs/
  01–04 *.md                    keep (history)
  05-revelado-implementation-spec.md   new   export of this document
```

No `hooks/` top-level folder: the two shared hooks live in `lib/` beside the code they serve, matching the current repo convention.

## 26 — Implementation Phases

**Changes to the suggested order, and why.** (1) The data layer, asset contracts, media components and placeholders move into Phase 1: every later phase consumes them, and building worlds before them would hardcode media. (2) A new **Phase 4 — World system** builds `WorldScene`, the transition grammar, `ProjectProof` and route sync once, before any individual world; then each world phase only adds its own timeline. (3) Every phase ships its own **desktop + mobile + reduced-motion + a11y** for what it builds. Phase 11 (old 10) becomes a consolidation pass, not the first time mobile is seen — otherwise it turns into a rewrite. (4) Copy guards (tests from 21) run from Phase 1, so a wrong claim can never merge.

**Working rules for Claude Code.** One phase per branch/PR-sized commit series; never start a phase before the previous phase's acceptance criteria pass; re-read the relevant chapters of this spec and the Content Master at the start of each phase; push is not assumed available (export bundle/patches if the remote rejects).

| Phase | Inputs | Files / systems touched | Output | Acceptance criteria | Depends on |
| --- | --- | --- | --- | --- | --- |
| **0 · Audit + reuse map** | repo `main`, this spec §01/§25 | read-only; writes `docs/06-phase0-audit.md` | confirmed keep/extend/retire list; build/lint status; dependency versions; list of real assets and their contract mapping | audit doc committed; `npm run build` and `lint` status recorded; no code changed | — |
| **1 · Foundation** | §05, §15, §17, §21, §22, Content Master | `globals.css` (tokens, tiers, `.js` gating), `layout.tsx` (Schibsted Grotesk, `lang="es"`), `lib/motion.ts`, `lib/useScene.ts`, `lib/journey-store.ts`, `lib/geometry.ts`, `lib/assets.ts`, `lib/media.ts`, `data/*`, `components/media/*`, `components/journey/*`, `SiteHeader`, `MinimalFooter`, `scripts/check-assets.mjs`, `tests/content.test.ts`; retire ENSAMBLE components | a running page with the journey skeleton: every section present as static readable HTML with real copy and placeholders; header; content tests; asset checker | no-JS page readable end to end; content tests pass (no “fundador”, Santi credit, gated fields hidden); 0 console errors; 0 hydration warnings; Lighthouse CLS ≤ 0.02 | 0 |
| **2 · Opening + Hero** | §02 S1, §03 hero stack, §15 | `OpeningHero`, hero contracts, grain, LQIP pipeline (`scripts/media.mjs`) | O0–O3, H1, H2 on all tiers + RM | first paint < 1 s on desktop dev build; scroll during O0–O2 jumps to O3; 2.5 s decode fallback works (throttled test); FRANCO behind / NÚÑEZ in front at 320, 390, 768, 1024, 1440, 1920 widths; no horizontal overflow | 1 |
| **3 · Project Reel** | §06 | `ProjectReel`, `ReelItem`, `LoopVideo`, cursor | reel with drag, trackpad, keys, buttons, video lifecycle, mobile swipe, RM | vertical wheel over the reel scrolls the page (test with synthetic wheel events); one piece per gesture; only one `<video>` playing (assert in e2e); keyboard-only operation works; axe clean | 1 |
| **4 · World system** | §07, §20, 02 proof sheet | `WorldScene`, `ProjectProof`, `ProofMedia`, `route-sync`, `JourneyClient` deep-link start, `trabajo/[slug]` route, `ReelOverlay` | SCREEN→ISOLATE→ESCAPE→EXPAND with a test object for all four projects (posters + simple objects), proofs with placeholders, URLs | reel “Ver caso” jump is visually seamless (screenshot diff of reel frame vs SCREEN state ≤ 1% pixels); `/trabajo/{slug}` loads at the world with no opening flash; Back returns to reel; `replaceState` while scrolling, no history spam | 3 |
| **5 · TravelSuite360 world** | §08, §16, §19 | `TravelSuiteWorld`, `TravelSuiteReveal`, `scripts/gen-ts-reveal.mjs`, `data/ts-reveal.ts` | TS00–TS12 on all tiers + RM; sr-only state summary | every state matches 08 at 1440×900 (screenshot per label); ≥ 55 fps during dolly on reference laptop; no `Math.random` at runtime; 3D only on lg/xl; RM sequence complete | 4 |
| **6 · Rayo world** | §09 | `RayoWorld`, layer contracts | R00–R07 + clip handoff + skips | DOM↔video handoff invisible with a test clip rendered from the placeholder layers; clip failure skips R05 cleanly | 4 |
| **7 · Santi world** | §10 | `SantiWorld` | N00–N05 + RM | no non-uniform scaling (assert transforms); credit visible from N02 through proof; paper tone switch correct | 4 |
| **8 · Chef world** | §11 | `ChefWorld` | C00–C07 + RM | the image element is the same DOM node from C02 to C06 (e2e assertion); DOM commerce UI has no focusable fake controls | 4 |
| **9 · Capabilities + Profile** | §12 | `CapabilitiesRail`, `EvidenceSlot`, `Profile` | rail (pinned on lg/xl, stacked on md/sm), evidence loops, profile | focus on an off-screen card scrolls it into view; capability 06 renders typographic variant; profile copy matches Content Master 13 exactly | 5–8 (reuses their mini elements) |
| **10 · Franco at Work + Contact + End** | §13, §14, §02 S16 | `FrancoAtWork`, `HumanMoment`, `FinalCta`, `BriefForm`, `EndSequence`, `actions/brief.ts`, `.env.example` | placeholders behind flags; working form; End sequence | form works without JS; all six states reachable; success only on Resend 2xx (mocked in e2e); honeypot/timing/rate limit verified; errors announced (axe + manual SR) | 1, 4 |
| **11 · Responsive / a11y / RM consolidation** | §15, §16, §19 | all sections (fixes only) | cross-tier polish | full QA matrix rows for responsive, RM and a11y pass (27) | 2–10 |
| **12 · Performance + media** | §17, §18, §22, §23, final assets as they arrive | media pipeline, encodes, contracts flipped to `final`, budgets | real assets integrated; budgets met | Lighthouse budgets met; asset checker green; privacy sign-off on all TS media; no launch-blocking placeholder | 11 + assets |
| **13 · QA + release** | §27, §28 | tests, fixes, docs/05 export, README | release candidate | every acceptance criterion in 28 passes; QA matrix complete; known issues documented | 12 |

## 27 — QA Matrix

**Browsers (latest stable + previous major).** Chrome, Safari (macOS + iOS), Firefox, Edge. Safari is the priority risk (CSS 3D, video autoplay, `svh`, AV1 fallback); Firefox second (ScrollTrigger pin spacing, `requestVideoFrameCallback` support).

**Device classes.**

| Class | Reference device | Input |
| --- | --- | --- |
| Desktop | 27″ external display, 2560×1440 (browser at 1920 and 2560) | mouse wheel (notched), keyboard |
| Laptop | MacBook Air 13″ (2020, M1) · Windows laptop with integrated GPU | trackpad (inertial), keyboard |
| Tablet | iPad (10th gen) portrait + landscape | touch, optional keyboard |
| iPhone-class | iPhone 12 / 13 mini (small) and 15 Pro Max (large) | touch |
| Android-class | Pixel 6 · a mid-range Samsung A-series | touch |

**Viewport matrix (CSS px).**

| Tier | Viewports to test |
| --- | --- |
| xl | 2560×1440, 1920×1080, 1440×900 (reference) |
| lg | 1366×768 (short!), 1280×800, 1024×768, 1024×1366 (iPad Pro portrait, tier boundary) |
| md | 820×1180, 768×1024, landscape phone 844×390 (md choreography, sm media) |
| sm | 430×932, 390×844 (reference), 375×667 (short), 360×800, 320×568 (minimum) |

**Scenarios × expected result.**

| Area | Scenario | Pass when |
| --- | --- | --- |
| Scroll | full journey top → bottom with wheel, trackpad, scrollbar drag, Space/PageDown, touch | every state reached in order; no state stuck; total progression smooth; no jump on unpin |
| Scroll | fast fling through a world | intermediate states pass continuously; snap settles on the next `s:` label only after scrolling stops |
| Scroll | scroll backward through every world | all states reverse correctly; *auto* segments reset; no orphan visible elements |
| Trackpad | horizontal swipe on reel; vertical swipe over reel | horizontal: one piece; vertical: page scrolls, reel untouched; no browser back-swipe triggered |
| Mouse | drag reel, click neighbour, click active | as 06 |
| Touch | swipe reel horizontally; scroll vertically starting on reel; tap active | as 06; vertical never blocked |
| Keyboard | Tab through the whole page; reel arrows/1–4/Enter; overlay open/close; form completion | focus always visible; order as 19; no traps; overlay returns focus |
| Resize | drag window across 1440, 1024, 768 boundaries mid-world | scene rebuilds at the same scroll position; no duplicated pins; no overflow |
| Orientation | rotate tablet and phone mid-world and on the reel | layout and pins rebuilt; position kept within one state |
| Slow network | Chrome “Slow 4G” + cache disabled; Save-Data on | hero readable < 3 s; no video autoload under Save-Data; posters always visible; no blank sections |
| Reduced motion | macOS + iOS setting on, full journey | 16 experience; nothing animates beyond ≤ 200 ms fades; no blank states |
| Video failure | block `*.mp4` via devtools; force decode error with a corrupt file | posters remain; Rayo R05 skipped; proofs show posters without play button |
| Image failure | block `/media/*` | reserved boxes with alt text; no layout shift |
| JS failure | disable JS; block GSAP chunk only | static document readable; form posts and returns End |
| Form failure | Resend 500, missing env, network offline, rate limit | correct error state each time; values kept; no “Brief recibido.” |
| Deep links | open each `/trabajo/{slug}` cold; reload mid-world; Back/Forward after reel navigation | correct start; no opening flash; history as 20 |
| Overflow | at every viewport, `document.documentElement.scrollWidth === innerWidth` | true everywhere (automated) |
| Privacy | frame-by-frame review of every TS media file | checklist 23 signed |

**Automation.** Playwright projects: Chromium, WebKit, Firefox × viewports 1440×900, 1366×768, 820×1180, 390×844, 320×568, each also with `reducedMotion: "reduce"`. Assertions: no console errors, no hydration warnings, no horizontal overflow, axe violations = 0 (serious/critical), one playing video max, screenshot per world label at 1440×900 and 390×844 compared against approved baselines (tolerance 1–2%). Manual: real-device passes for Safari iOS and Android Chrome, and VoiceOver/NVDA (19).

## 28 — Acceptance Criteria

The implementation is accepted when every row passes on the QA matrix (27). Each criterion is measurable and has a named check.

| # | Criterion | Measure | Check |
| --- | --- | --- | --- |
| A1 | Visual fidelity | every world label, hero state, reel, capabilities, profile, CTA match Revelado 2.2 boards at 1440×900 and the mobile boards at 390×844 | screenshot review against boards; baselines approved by Franco, then ≤ 2% pixel diff in CI |
| A2 | Copy fidelity | every visible string equals the Content Master (latest, with ronda 1 corrections); no unconfirmed claim rendered | content tests (21) + manual diff of rendered text vs Content Master tables |
| A3 | Factual guards | no “fundador/founder/solo” for TravelSuite360; role “Socio · Producto e ingeniería”; Santi photography credited to Santi Nuca; Chef proof “Tienda real, en línea.”; capability 06 without metrics | content tests |
| A4 | Motion smoothness | ≥ 55 fps (target 60) on the laptop reference and ≥ 50 fps on iPhone 12 / Pixel 6 during normal scrolling through every scene; no long tasks > 50 ms during scroll | Chrome Performance traces per scene, Safari timeline on device |
| A5 | Native vertical scroll | no `preventDefault` on vertical wheel/touch anywhere; scroll position always equals document position; keyboard scrolling works everywhere | code search + e2e synthetic wheel/keys |
| A6 | No trapped wheel | vertical wheel over the reel (and every other element) scrolls the page | e2e |
| A7 | Keyboard-accessible reel | all reel functions reachable by keyboard and by the 01–04 buttons; focus visible | e2e + manual |
| A8 | No horizontal overflow | `scrollWidth === innerWidth` at all matrix viewports, all scroll positions sampled every 100px | e2e |
| A9 | No hydration errors | zero React hydration warnings on `/` and all `/trabajo/*` | e2e console capture |
| A10 | No console errors | zero errors and zero warnings from app code in production build | e2e console capture |
| A11 | No layout shift from media | CLS ≤ 0.02 (lab) on all routes; every media element has reserved aspect | Lighthouse + e2e |
| A12 | Privacy-safe proof media | every TS media contract `privacyChecked: true`; checklist 23 signed by two people | asset checker + sign-off doc |
| A13 | Responsive typography | no clipped or overflowing text at any matrix viewport, except the intentional NÚÑEZ edge crop | screenshots + overflow e2e |
| A14 | Reduced motion | complete RM experience (16); no blank states; no animation > 200 ms | e2e RM projects + manual on macOS/iOS |
| A15 | Working form | delivers via Resend in production; all six states; works without JS; success only on 2xx | e2e (mocked) + one real production send |
| A16 | Working deep links | each `/trabajo/{slug}` cold-loads at its world without opening flash; reload mid-world keeps place; Back/Forward per 20 | e2e |
| A17 | Performance | budgets in 18 met: LCP ≤ 2.5 s mobile / 1.8 s desktop, initial JS ≤ 170 KB gz, eager media ≤ 200 KB desktop / 130 KB mobile, TBT within target | Lighthouse CI + `next build` output |
| A18 | One active video | never more than one decorative video playing; never more than one video decoding outside proofs/Rayo clip | e2e (count `!paused`) |
| A19 | Accessibility | axe: 0 serious/critical; VoiceOver and NVDA can read every piece of copy once, operate reel, overlay and form | axe + manual SR pass |
| A20 | Failure modes | every row of 24 verified | QA matrix failure rows |
| A21 | No placeholder as evidence | production build contains no launch-blocking placeholder; `EvidenceSlot` never renders a placeholder | asset checker |

## 29 — Open Engineering Questions

Only questions that change implementation or block launch. Content questions already listed in Content Master 19 are not repeated unless they block engineering.

**Block launch (assets / permissions).**

1. **Hero portrait.** No portrait of Franco exists. The hero layering (FRANCO behind body, NÚÑEZ in front) needs a transparent cutout, ≥ 2400px tall, plus a 4:5 mobile crop. Phases 2–11 run on a placeholder; launch needs the real one.
2. **TravelSuite360 media.** No captures exist. Who provisions the demo tenant with controlled data (23), and do the other two partners approve publishing the product recordings and the “tres agencias” line?
3. **Santi Nuca originals.** Full-resolution photographs and Santi's permission to use them in the world (the current files are site captures, not originals).
4. **Chef Arturo originals.** High-res product photograph (the macro source) and the business's permission; who shoots or edits the 4–6 s macro loop?
5. **Proof recordings (×4).** Who records them, and on which accounts/environments (Chef and Rayo recordings must avoid real customer data)?

**Change implementation (decide before the named phase).**

6. **Mono typeface (Phase 1).** The Content Master asks for “mono” labels; the Revelado prototypes set labels in Schibsted Grotesk uppercase. Reuse the IBM Plex Mono 400 already self-hosted in the repo, or no mono face at all?
7. **Schibsted Grotesk weights (Phase 1).** Which weights do the 2.2 boards use for the giant name and world names (700 vs 900)? Load at most two weights plus italic only if used.
8. **Gesture length (Phases 4–5).** `GESTURE_VH` = 80/70/60 is a starting value. Franco should feel it on real devices during Phase 5 and approve once; then it is fixed for all worlds.
9. **Per-project routes and SEO (Phase 4).** Same body on `/` and `/trabajo/*` with different metadata and start position (20). Accept (recommended), or render project routes with the target world moved first in the DOM for crawlers (more complexity, possible visual differences)?
10. **Rayo through-clip (Phase 6).** Produced in a 3D/compositing tool from the five cutouts at the R04 framing. Is a 9:16 mobile render in scope, or does mobile skip R05 (supported either way)?
11. **Optional sections at launch (Phase 10).** If the human-moment image and the Franco-at-work video are not ready, launch with both sections omitted (supported by flags), or wait?
12. **Capabilities under reduced motion (Phase 9).** Keep the pinned horizontal rail (user-driven, 1:1 with scroll) or switch to the vertical stack used on mobile?

**Infrastructure.**

13. **Hosting and domain.** Vercel assumed (Next 16, server actions, image optimization). Domain for canonical/OG? Resend sender domain to verify and the inbox for `CONTACT_TO`?
14. **Analytics.** None (recommended, no banner) or a cookieless tool ≤ 5 KB?
15. **Repository access.** Pushing to `Fran-Nu10/MiPortafolio` from this environment returns 403 (the repo is not in the session's authorized set). Either grant access for the implementation sessions, or Franco applies the exported bundle/patches himself after each phase.
