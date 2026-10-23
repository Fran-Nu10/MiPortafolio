"use client";

import { useRef, type CSSProperties } from "react";
import type { CutoutFiles } from "@/data/types";
import { EASE } from "@/lib/motion";
import { setJourney } from "@/lib/journey-store";
import { BAND_INSET, HERO_UNITS, HERO_UNITS_RM, OPENING, focusWhenReady, inset, parseInsetTop, splitName } from "@/lib/opening";
import { aspectVars, type ResolvedAsset } from "@/lib/resolved";
import { useScene, type SceneApi } from "@/lib/useScene";
import { Cutout } from "@/components/media/Cutout";

export interface HeroContent {
  name: readonly [string, string];
  firma: string;
  support: string;
  index: string;
  openingIndex: string;
}

/**
 * mask-up: the element rises into its own box (clip from the bottom + yPercent). The clip region
 * reaches 30% above the line box: the giant capitals sit on a 0.82 line-height and their accents
 * (Ú, Ñ) rise above it. Collapsed, the region has zero height (top −30%, bottom inset 130%).
 */
const MASKED = { clipPath: "inset(-30% -6% 130% -6%)", yPercent: 100 };
const SHOWN = { clipPath: "inset(-30% -6% -6% -6%)", yPercent: 0 };
const OPEN = "inset(0% 0% 0% 0%)";

/**
 * S1 · Opening → Hero → Positioning (Spec §02 S1, §03 hero stack, §15, §16). One pinned scene.
 *
 *   O0  black + grain (CSS, first paint)
 *   O1  a 14vh light band opens (time-based)
 *   O2  focus: LQIP → sharp once the portrait decodes (or LQIP at 2.5 s); index 00; header in
 *   O3  gesture 1 — the band opens to the full viewport, the accent line crosses once, 00 → 01
 *   H1  gesture 2 — FRANCO behind the body, NÚÑEZ in front; firma and support mask up
 *   H2  gesture 3 — positioning: portrait −12vh at .55, the names part, the support line rises
 *       to statement size; then the scene unpins
 *
 * The window is two nested clips: the time-based band (O0 → O1) clips `band`, the scrolled
 * opening (O2 → O3) clips `aperture`; what shows is their intersection, so no two animations
 * ever drive the same property. The band starts as a CSS animation at first paint; the scene
 * continues it in GSAP (inline styles survive the pin re-parenting the section, CSS
 * animations do not).
 *
 * The server HTML is the readable static composition (no JS, failed build, tiny viewports);
 * CSS rescues it after 4 s if the scene never builds.
 */
export function OpeningHero({
  hero,
  portrait,
  grain,
  skipOpening,
}: {
  hero: HeroContent;
  portrait: ResolvedAsset;
  grain: ResolvedAsset;
  /** deep link: the visitor starts at a world, the opening never plays */
  skipOpening: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  /** the time-based opening plays once per page load, not on every rebuild */
  const played = useRef(skipOpening);
  const [firstA, firstB] = splitName(hero.name[0]);
  const [lastA, lastB] = splitName(hero.name[1]);
  const lqip = portrait.status !== "placeholder" ? portrait.lqip : undefined;

  useScene(ref, {
    id: "hero",
    units: (_tier, rm) => (rm ? HERO_UNITS_RM : HERO_UNITS),
    build: (api) => (api.rm ? buildReduced(api) : buildFull(api, played)),
    onState: (state) => {
      const stage = ref.current?.querySelector<HTMLElement>('[data-part="stage"]');
      // during the time-based opening the scroll timeline rests on O2; the opening owns the phase
      if (stage && (played.current || state !== "O2")) stage.dataset.phase = state;
    },
    onUpdate: (progress) => {
      if (progress > 0.001) {
        finishOpening.current?.();
        if (indexFade.current) {
          indexFade.current.progress(1).kill();
          indexFade.current = null;
        }
      }
    },
  });

  const grainStyle = grain.status !== "placeholder" ? { "--grain": `url(${(grain.files.desktop as { src: string }).src})` } : {};

  return (
    <section
      ref={ref}
      data-scene-root=""
      id="inicio"
      aria-label="Franco Núñez"
      data-section="inicio"
      data-anim=""
      data-opening={skipOpening ? undefined : ""}
      data-portrait={portrait.status === "placeholder" ? "none" : "real"}
      className="hero"
    >
      {portrait.status !== "placeholder" ? <PortraitPreload portrait={portrait} /> : null}
      <div className="hero-stage" data-part="stage" style={grainStyle as CSSProperties}>
        <h1 className="sr-only">Franco Núñez</h1>
        <span aria-hidden="true" className="hero-name hero-name-first" data-part="first">
          <span>{firstA}</span>
          <span>{firstB}</span>
        </span>
        <div className="hero-aperture" data-part="aperture">
          <div className="hero-band" data-part="band">
            <div className="hero-portrait" data-part="portrait" data-lqip={lqip ? "" : undefined} style={aspectVars(portrait) as CSSProperties}>
              {lqip ? (
                // pre-blurred 16px image, blurred again by CSS: no runtime blur on the large image
                // eslint-disable-next-line @next/next/no-img-element
                <img className="hero-lqip" src={lqip} alt="" aria-hidden="true" />
              ) : null}
              <Cutout asset={portrait} priority fill />
            </div>
          </div>
        </div>
        <span aria-hidden="true" className="hero-name hero-name-last" data-part="last">
          <span>{lastA}</span>
          <span>{lastB}</span>
        </span>
        <span aria-hidden="true" className="hero-line" data-part="line" />
        <div className="hero-copy" data-part="copy">
          <p className="hero-index micro" aria-hidden="true" data-part="index">
            <span data-part="index-0">{hero.openingIndex}</span>
            <span data-part="index-1">{hero.index}</span>
          </p>
          <p className="hero-firma micro" data-part="firma">
            {hero.firma}
          </p>
          <p className="hero-support" data-part="support">
            {hero.support}
          </p>
        </div>
        <span aria-hidden="true" className="hero-probe" data-part="probe" />
      </div>
    </section>
  );
}

/** finishes the time-based opening at once (set while it runs) */
const finishOpening: { current: (() => void) | null } = { current: null };
/**
 * The index "00" fading in at O2 (a 400 ms tween of its own). If the scroll timeline starts
 * before it ends, both would drive the same property and the later one would win per tick —
 * under load the fade-in could outlive the timeline's 00 → 01 step and leave "00" showing
 * beside "01". The scroll timeline owns the index from its first pixel: the fade is finished
 * at once and dropped.
 */
const indexFade: { current: gsap.core.Tween | null } = { current: null };

function parts(api: SceneApi) {
  const one = (p: string) => api.q(`[data-part="${p}"]`)[0];
  return {
    stage: one("stage"),
    aperture: one("aperture"),
    band: one("band"),
    portrait: one("portrait"),
    first: one("first"),
    last: one("last"),
    line: one("line"),
    idx0: one("index-0"),
    idx1: one("index-1"),
    firma: one("firma"),
    support: one("support"),
    probe: one("probe"),
    lqip: api.root.querySelector<HTMLElement>(".hero-lqip"),
    sharp: api.root.querySelector<HTMLImageElement>('[data-part="portrait"] img.media-img'),
  };
}

/** a scene that does not run: the static composition (tiny viewports) */
function staticHero(api: SceneApi) {
  api.root.removeAttribute("data-anim");
  api.root.removeAttribute("data-opening");
  setJourney({ heroRevealed: true });
  return null;
}

/**
 * Hand the section to GSAP. Returns the band's inset as the first-paint CSS animation has it
 * (read before `data-built` switches that animation off).
 */
function takeOver(api: SceneApi, band: HTMLElement): number | null {
  const cssInset = parseInsetTop(getComputedStyle(band).clipPath);
  // pin the band's current value inline before the CSS rule switches off (no open frame)
  api.gsap.set(band, { clipPath: inset(cssInset ?? 50) });
  api.root.setAttribute("data-anim", "");
  api.root.setAttribute("data-built", "");
  return cssInset;
}

function buildFull(api: SceneApi, played: { current: boolean }): gsap.core.Timeline | null {
  const { gsap, root } = api;
  if (!api.pinned) return staticHero(api);
  const p = parts(api);
  // a late build (slow device): CSS may already have reached O2 on its own (the index "00" fading
  // in at the band's end, or at the 2.5 s decode deadline with a portrait — Spec §02 S1 timing
  // guarantees). Read it before takeOver switches the CSS off, and continue from there.
  const cssIdx = getComputedStyle(p.idx0).visibility === "visible" ? parseFloat(getComputedStyle(p.idx0).opacity) || 0 : 0;
  const cssInset = takeOver(api, p.band);
  const H = p.stage.offsetHeight;
  const opening = !played.current && window.scrollY <= 0 && root.hasAttribute("data-opening") && cssIdx === 0;
  if (!opening) root.removeAttribute("data-opening");

  // the support line grows to statement size, as far as the viewport allows…
  const lead = parseFloat(getComputedStyle(p.support).fontSize);
  const statement = parseFloat(getComputedStyle(p.probe).fontSize);
  const gutter = p.support.getBoundingClientRect().left;
  const room = (window.innerWidth - 2 * gutter) / Math.max(1, p.support.offsetWidth);
  // …and as far as the space under NÚÑEZ allows once it has parted down (+4vh)
  const copyBottom = p.support.getBoundingClientRect().bottom;
  const aboveSupport = p.support.getBoundingClientRect().top - p.idx0.parentElement!.getBoundingClientRect().top;
  const lastBottom = p.last.getBoundingClientRect().bottom + 0.04 * H + 16;
  const headroom = copyBottom > lastBottom ? (copyBottom - lastBottom - aboveSupport) / Math.max(1, p.support.offsetHeight) : 1;
  const k = Math.max(1, Math.min(statement / lead, room, headroom));
  const grow = p.support.offsetHeight * (k - 1);

  // ── O2: the resting state the scroll timeline starts from ──────────────────
  gsap.set(p.aperture, { clipPath: inset(BAND_INSET) });
  gsap.set([p.first, p.last, p.firma, p.support], MASKED);
  gsap.set(p.line, { scaleX: 0, xPercent: 0, transformOrigin: "0% 50%" });
  gsap.set(p.idx1, { autoAlpha: 0 });
  gsap.set(p.support, { transformOrigin: "0% 100%" });

  const tl = gsap.timeline({ defaults: { ease: EASE.settle } });
  tl.addLabel("s:O2", 0);
  // O3 · the band opens to the full viewport; the accent line crosses once; 00 → 01
  // (nothing starts at 0: a tween at 0 would render its from-state while the opening still runs)
  tl.fromTo(p.aperture, { clipPath: inset(BAND_INSET) }, { clipPath: OPEN, duration: 0.85, ease: EASE.reveal, immediateRender: false }, 0.15);
  tl.fromTo(p.line, { scaleX: 0 }, { scaleX: 1, duration: 0.38, ease: EASE.none, immediateRender: false }, 0.02);
  tl.fromTo(p.line, { xPercent: 0 }, { xPercent: 101, duration: 0.4, ease: "power1.in", immediateRender: false }, 0.4);
  tl.fromTo(p.idx0, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.45, ease: EASE.steps(1), immediateRender: false }, 0.05);
  tl.fromTo(p.idx1, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: EASE.steps(1), immediateRender: false }, 0.05);
  tl.addLabel("s:O3", 1);
  // H1 · the composition: FRANCO behind the body, NÚÑEZ in front; firma and support mask up
  tl.fromTo(p.first, MASKED, { ...SHOWN, duration: 0.7, immediateRender: false }, 1.1);
  tl.fromTo(p.last, MASKED, { ...SHOWN, duration: 0.7, immediateRender: false }, 1.18);
  tl.fromTo(p.firma, MASKED, { ...SHOWN, duration: 0.5, immediateRender: false }, 1.4);
  tl.fromTo(p.support, MASKED, { ...SHOWN, duration: 0.5, immediateRender: false }, 1.48);
  tl.addLabel("s:H1", 2);
  // H2 · positioning hold
  tl.to(p.portrait, { y: -0.12 * H, opacity: 0.55, duration: 0.9 }, 2.05);
  tl.to(p.first, { y: -0.06 * H, duration: 0.9 }, 2.05);
  tl.to(p.last, { y: 0.04 * H, duration: 0.9 }, 2.05);
  tl.to(p.support, { scale: k, duration: 0.9 }, 2.05);
  tl.to([p.idx0.parentElement!, p.firma], { y: -grow, duration: 0.9 }, 2.05);
  tl.addLabel("s:H2", 3);
  // hold at H2 before the scene unpins (placed at the label: the timeline lasts exactly HERO_UNITS)
  tl.to({}, { duration: HERO_UNITS - 3 }, 3);

  // ── O0 → O2: time-based, once per page load ────────────────────────────────
  const sharp = p.sharp;
  const crossfade = (duration: number) => {
    if (!sharp || !p.lqip) return;
    gsap.to(sharp, { opacity: 1, duration, ease: EASE.none });
    gsap.to(p.lqip, { opacity: 0, duration, ease: EASE.none });
  };
  if (sharp && p.lqip) {
    gsap.set(sharp, { opacity: 0 });
    gsap.set(p.lqip, { opacity: 1 });
  }
  const reveal = () => setJourney({ heroRevealed: true });

  if (!opening) {
    // rebuild, deep link or restored scroll: the opening is over
    played.current = true;
    gsap.set(p.band, { clipPath: OPEN });
    if (cssIdx > 0 && cssIdx < 1) gsap.fromTo(p.idx0, { autoAlpha: cssIdx }, { autoAlpha: 1, duration: 0.4 * (1 - cssIdx), ease: EASE.settle });
    else gsap.set(p.idx0, { autoAlpha: 1 });
    if (sharp && p.lqip) {
      if (sharp.complete && sharp.naturalWidth) crossfade(0);
      else sharp.decode().then(() => crossfade(OPENING.focus), () => {});
    }
    p.stage.dataset.phase = "O2";
    reveal();
    return tl;
  }

  gsap.set(p.idx0, { autoAlpha: 0 });
  p.stage.dataset.phase = "O0";
  // O0 → O1: continue the band from wherever the first-paint CSS animation had it
  const from = cssInset ?? 50;
  const left = Math.max(0, Math.min(1, (from - BAND_INSET) / (50 - BAND_INSET)));
  const band = gsap.timeline();
  band.fromTo(
    p.band,
    { clipPath: inset(from) },
    {
      clipPath: inset(BAND_INSET),
      duration: OPENING.band * left,
      delay: from >= 50 ? OPENING.hold : 0,
      ease: EASE.reveal,
      onStart: () => {
        if (!played.current) p.stage.dataset.phase = "O1";
      },
    },
  );
  // the band is done: the outer aperture (at the same 14vh) is the window from here on
  band.set(p.band, { clipPath: OPEN });

  const firstPaint = performance.getEntriesByName("first-paint")[0]?.startTime ?? 0;
  const decode = sharp ? sharp.decode() : Promise.resolve();
  let cancelRace: (() => void) | null = null;

  const focus = (isSharp: boolean) => {
    if (played.current) return;
    played.current = true;
    finishOpening.current = null;
    root.removeAttribute("data-opening");
    p.stage.dataset.phase = "O2";
    if (isSharp) crossfade(OPENING.focus);
    indexFade.current = gsap.to(p.idx0, { autoAlpha: 1, duration: 0.4, ease: EASE.settle, onComplete: () => (indexFade.current = null) });
    reveal();
  };
  const sharpLate = () => crossfade(OPENING.focus);

  band.eventCallback("onComplete", () => {
    if (played.current) return;
    cancelRace = focusWhenReady(decode, firstPaint + OPENING.decodeDeadline - performance.now(), { focus, sharp: sharpLate });
  });

  // scrolling during O0–O2 jumps straight to the scroll states (Spec §02 S1)
  finishOpening.current = () => {
    finishOpening.current = null;
    cancelRace?.();
    band.progress(1);
    let decoded = false;
    if (sharp?.complete && sharp.naturalWidth) decoded = true;
    else decode.then(sharpLate, () => {});
    focus(decoded);
  };

  api.onRevert(() => {
    cancelRace?.();
    finishOpening.current = null;
    indexFade.current?.kill();
    indexFade.current = null;
  });
  return tl;
}

/**
 * Reduced motion (Spec §16): two states, cuts only — black with grain → the portrait sharp
 * and full (no band, no focus pull, no accent line) → names, firma, support line, index 01.
 */
function buildReduced(api: SceneApi): gsap.core.Timeline | null {
  const { gsap, root } = api;
  if (!api.pinned) return staticHero(api);
  const p = parts(api);
  takeOver(api, p.band);
  root.removeAttribute("data-opening");
  gsap.set([p.aperture, p.band], { clipPath: OPEN });
  gsap.set(p.line, { autoAlpha: 0 });
  gsap.set([p.first, p.last, p.firma, p.support, p.idx0, p.idx1], { autoAlpha: 0 });
  if (p.lqip) gsap.set(p.lqip, { autoAlpha: 0 });
  if (p.sharp) gsap.set(p.sharp, { opacity: 1 });
  // the one allowed fade (≤ 200 ms) as the portrait arrives
  gsap.fromTo(p.portrait, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: EASE.none });
  p.stage.dataset.phase = "O2";
  setJourney({ heroRevealed: true });

  const tl = gsap.timeline();
  tl.addLabel("s:O2", 0);
  tl.set([p.first, p.last, p.firma, p.support, p.idx1], { autoAlpha: 1 }, 0.5);
  tl.addLabel("s:H1", 0.5);
  tl.to({}, { duration: HERO_UNITS_RM - 0.5 }, 0.5);
  return tl;
}

/** the hero portrait is the LCP: preload the tier's AVIF (Spec §17), hoisted to <head> by React */
function PortraitPreload({ portrait }: { portrait: ResolvedAsset }) {
  if (portrait.status === "placeholder") return null;
  const d = portrait.files.desktop as CutoutFiles;
  const m = portrait.files.mobile as CutoutFiles;
  const set = (f: CutoutFiles) => `${f.avif["1x"]} 1x, ${f.avif["2x"]} 2x`;
  return (
    <>
      <link rel="preload" as="image" type="image/avif" imageSrcSet={set(d)} media="(min-width: 768px)" fetchPriority="high" />
      <link rel="preload" as="image" type="image/avif" imageSrcSet={set(m)} media="(max-width: 767.98px)" fetchPriority="high" />
    </>
  );
}
