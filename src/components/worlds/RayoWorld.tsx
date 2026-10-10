"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VideoFiles } from "@/data/types";
import { EASE } from "@/lib/motion";
import { isSaveData } from "@/lib/media";
import {
  R04_TILT,
  R06_STAGGER,
  R_T,
  R_T_RM,
  RAYO_PERSPECTIVE,
  RAYO_UNITS,
  RAYO_UNITS_RM,
  assembledBoxes,
  canRunClip,
  explodeOffsets,
  posterBoxes,
  rayoVariant,
  splitMenuLine,
  stackHeight,
  type Box,
  type RayoVariant,
} from "@/lib/rayo-world";
import type { ResolvedAsset } from "@/lib/resolved";
import type { SceneApi } from "@/lib/useScene";
import { Cutout } from "@/components/media/Cutout";
import { WorldScene, type WorldBuildContext, type WorldSceneExtension, type WorldView } from "./WorldScene";

/** Content Master 07, verbatim, plus the layer contracts (Spec §09) */
export interface RayoView {
  title: string;
  menuLine: string;
  /** top → bottom: the six cutouts with their boxes inside the whole stack */
  layers: { name: string; asset: ResolvedAsset; offset: { x: number; y: number; w: number; h: number } }[];
  /** the whole stack (the escaping object) */
  stack: { aspect: [number, number] };
  /** the prerendered camera move (R05); a placeholder skips R05 */
  through: ResolvedAsset;
}

/**
 * S5 · Rayo Smash world (Spec §09, Revelado 2.2 §11.2). The shared shell runs SCREEN →
 * ISOLATE → R02 (the stack escapes the hero and grows into the red field). From there:
 * R03 the stack is swapped for its six aligned layers and «Capa por capa.» enters · R04 the
 * layers separate, with depth and a slight tilt on lg/xl · R05 the prerendered camera move
 * between the layers (time-based; skipped without a playable clip) · R06 the layers settle
 * into the whole burger, the first time it is whole · R07 the menu line of the real demo.
 *
 * Only the real captures are used: every layer is keyed out of the demo's hero. The title and
 * the menu line are real text; the layers carry no text (one alt on the whole stack).
 */
export function RayoWorld({ world, rayo }: { world: WorldView; rayo: RayoView }) {
  const [active, setActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [built, setBuilt] = useState<{ variant: RayoVariant; rm: boolean } | null>(null);
  const variant = built?.variant ?? null;
  // the scene's clip control, handed over by each build
  const [clip, setClip] = useState<ClipControl | null>(null);

  // the clip exists for this tier: a desktop source always, a 9:16 one only when produced
  const sources = useMemo(() => {
    if (rayo.through.status === "placeholder") return null;
    const own = rayo.through.files.mobile !== rayo.through.files.desktop;
    return { desktop: rayo.through.files.desktop as VideoFiles, mobile: own ? (rayo.through.files.mobile as VideoFiles) : null };
  }, [rayo.through]);
  // the clip is a 3D composition: it plays where the layers have depth (lg/xl); phones only
  // with their own 9:16 clip; tablets (3D off, Spec §15) skip R05
  const files = variant === "deep" ? (sources?.desktop ?? null) : variant === "sm" ? (sources?.mobile ?? null) : null;
  // preload: `auto` once the Rayo pin starts (Spec §17); never under reduced motion / Save-Data
  const mountVideo = active && !!files && !failed && built !== null && !built.rm && !isSaveData();

  const onFail = useCallback(() => setFailed(true), []);
  useEffect(() => {
    clip?.sync({ ready: ready && !failed, video: videoRef.current });
  }, [clip, ready, failed, mountVideo]);

  const scene = useMemo<WorldSceneExtension>(
    () => ({
      units: (_tier, rm) => (rm ? RAYO_UNITS_RM : RAYO_UNITS),
      onToggle: (on) => setActive(on),
      build: (api, tl, ctx) => {
        const v = rayoVariant(api.tier, api.rm);
        setBuilt({ variant: v, rm: api.rm });
        setClip(buildRayo(api, tl, ctx, v, rayo));
        api.onRevert(() => setClip(null));
      },
    }),
    [rayo],
  );

  const menu = splitMenuLine(rayo.menuLine);

  return (
    <WorldScene world={world} scene={scene}>
      <div className="rayo-layer" data-part="rayo">
        <div className="rayo-space" data-part="space">
          <div className="rayo-persp" data-part="persp">
            <div className="rayo-group" data-part="group">
              {rayo.layers.map((l) => (
                <div key={l.name} className="rayo-piece" data-part="piece" data-layer={l.name}>
                  <Cutout asset={l.asset} fill />
                </div>
              ))}
            </div>
          </div>
          {/* R05: the prerendered move between the layers, the same framing as the space */}
          {mountVideo && files ? (
            <video
              ref={videoRef}
              className="rayo-through"
              data-part="through"
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              aria-hidden="true"
              onCanPlayThrough={() => setReady(true)}
              onError={onFail}
            >
              {files.sources.map((s) => (
                <source key={s.src} src={s.src} type={s.type} />
              ))}
            </video>
          ) : null}
          <p className="rayo-title" data-part="title">
            {rayo.title}
          </p>
          <div className="rayo-menu" data-part="menu">
            <p className="rayo-menu-name" data-part="menu-name">
              {menu.name}
            </p>
            <p className="rayo-menu-detail" data-part="menu-detail">
              {menu.detail}
            </p>
            <p className="micro rayo-menu-price" data-part="menu-price">
              {menu.price}
            </p>
          </div>
        </div>
      </div>
    </WorldScene>
  );
}

// ── the timeline ──────────────────────────────────────────────────────────────────────────────

const HIDE_Y = "inset(100% 0% 0% 0%)";
const HIDE_X = "inset(0% 100% 0% 0%)";
const SHOW = "inset(0% 0% 0% 0%)";
/** automatic segments fire this far before their state's label (snap tolerance) */
const AUTO_LEAD = 0.02;
/** the clip is abandoned if the visitor scrolls this far past s:R05 while it plays */
const CLIP_WINDOW = 0.3;
/**
 * The §09 fallback cross-fade, enabled: the test render matches the DOM in position and
 * colour (red field exact), but its codec leaves ≈ 3/255 of texture noise inside the layers
 * (QA, docs/12 §6). 120 ms of opacity hides that; both ends stay in place.
 */
const CROSSFADE = 0.12;

interface ClipControl {
  sync: (s: { ready: boolean; video: HTMLVideoElement | null }) => void;
}

function buildRayo(api: SceneApi, tl: gsap.core.Timeline, ctx: WorldBuildContext, v: RayoVariant, rayo: RayoView): ClipControl {
  const { gsap, root: stage, rm } = api;
  const deep = v === "deep";
  const one = (p: string) => api.q(`[data-part="${p}"]`)[0];
  const space = one("space");
  const persp = one("persp");
  const group = one("group");
  const pieces = api.q('[data-part="piece"]');
  const title = one("title");
  const menu = one("menu");
  const menuParts = [one("menu-name"), one("menu-detail"), one("menu-price")];
  const T = (t: number) => t + (ctx.worldAt - (rm ? R_T_RM.R02 : R_T.R02));

  stage.dataset.rayo = v;
  api.onRevert(() => {
    delete stage.dataset.rayo;
  });

  // ── the design space, scaled once; the stack's box at R02 is what the shell's escapeRect gave
  const sp = v === "sm" ? { w: 390, h: 844 } : { w: 1440, h: 900 };
  const s = Math.min(window.innerWidth / sp.w, stage.clientHeight / sp.h);
  gsap.set(space, { width: sp.w, height: sp.h, xPercent: -50, yPercent: -50, scale: s, transformOrigin: "50% 50%" });
  const stackAspect = rayo.stack.aspect[0] / rayo.stack.aspect[1];
  const stackBox: Box =
    v === "sm"
      ? { w: 0.7 * sp.w, h: (0.7 * sp.w) / stackAspect, x: 0, y: 0 }
      : { w: 0.62 * sp.h * stackAspect, h: 0.62 * sp.h, x: 0, y: 0 };
  stackBox.x = (sp.w - stackBox.w) / 2;
  stackBox.y = (sp.h - stackBox.h) / 2;
  const toSpace = (b: Box): Box => ({ x: stackBox.x + b.x * stackBox.w, y: stackBox.y + b.y * stackBox.w, w: b.w * stackBox.w, h: b.h * stackBox.w });
  const layers = rayo.layers.map((l) => ({ name: l.name, offset: l.offset }));
  const stack = { w: rayo.stack.aspect[0], h: rayo.stack.aspect[1] };
  const poster = posterBoxes(layers, stack).map(toSpace);
  // the whole burger: assembled, grown to the stack's height (sm: to its width), centered a
  // little above the middle so the menu line fits under it
  const asmUnit = assembledBoxes(layers, stack);
  const asmH = stackHeight(asmUnit) * stackBox.w;
  const grow = v === "sm" ? Math.min(stackBox.w / (Math.max(...asmUnit.map((b) => b.x + b.w)) * stackBox.w), (0.5 * sp.h) / asmH) : (0.62 * sp.h) / asmH;
  const asmRaw = asmUnit.map(toSpace);
  const asmCx = sp.w / 2;
  const asmCy = v === "sm" ? 0.42 * sp.h : 0.46 * sp.h;
  const rawCx = Math.min(...asmRaw.map((b) => b.x)) + (Math.max(...asmRaw.map((b) => b.x + b.w)) - Math.min(...asmRaw.map((b) => b.x))) / 2;
  const rawTop = Math.min(...asmRaw.map((b) => b.y));
  const assembled = asmRaw.map((b) => ({ x: asmCx + (b.x - rawCx) * grow, y: asmCy - (asmH * grow) / 2 + (b.y - rawTop) * grow, w: b.w * grow, h: b.h * grow }));
  const burgerBottom = asmCy + (asmH * grow) / 2;
  const explode = explodeOffsets(pieces.length, asmH, v);

  // ── placement: pieces at their poster boxes; everything else moves on transforms only ──
  pieces.forEach((p, i) => gsap.set(p, { left: poster[i].x, top: poster[i].y, width: poster[i].w, height: poster[i].h, x: 0, y: 0, z: 0, scale: 1, transformOrigin: "0 0" }));
  gsap.set(persp, deep ? { perspective: RAYO_PERSPECTIVE, perspectiveOrigin: "50% 50%" } : { perspective: "none" });
  gsap.set(group, { rotateX: 0, transformOrigin: `${sp.w / 2}px ${sp.h / 2}px`, visibility: "hidden", willChange: "auto" });
  gsap.set(title, { left: sp.w / 2, top: sp.h / 2, xPercent: -50, yPercent: -50, clipPath: HIDE_Y });
  gsap.set(menu, { left: sp.w / 2, top: burgerBottom + (v === "sm" ? 28 : 36), xPercent: -50, clipPath: HIDE_X });
  api.onRevert(() => gsap.set([space, persp, group, ...pieces, title, menu], { clearProps: "all" }));

  const swapIn = (t: number) => {
    // the stack → its six layers: the same composite, in the same frame
    tl.set(ctx.object, { autoAlpha: 0 }, t);
    tl.set(group, { visibility: "visible" }, t);
  };

  if (rm) {
    // three stills (Spec §16): the stack in the red field (the card cut, s:WORLD) → exploded
    // layers + title → the whole burger + the menu line
    swapIn(T(R_T_RM.R04));
    pieces.forEach((p, i) => tl.set(p, { y: explode[i].dy }, T(R_T_RM.R04)));
    tl.set(title, { clipPath: SHOW }, T(R_T_RM.R04));
    tl.addLabel("s:R04", T(R_T_RM.R04));
    pieces.forEach((p, i) => tl.set(p, { x: assembled[i].x - poster[i].x, y: assembled[i].y - poster[i].y, scale: assembled[i].w / poster[i].w }, T(R_T_RM.R06)));
    tl.set(title, { clipPath: HIDE_Y }, T(R_T_RM.R06));
    tl.set(menu, { clipPath: SHOW }, T(R_T_RM.R06));
    tl.addLabel("s:R06", T(R_T_RM.R06));
    tl.to({}, { duration: R_T_RM.END - R_T_RM.R06 }, T(R_T_RM.R06));
    return { sync: () => {} };
  }

  // ── R03 · CAPA POR CAPA: the swap, then the title masks up ─────────────────────────────
  swapIn(T(R_T.R02) + 0.01);
  tl.set(group, { willChange: "transform" }, T(R_T.R02) + 0.01);
  tl.to(title, { clipPath: SHOW, duration: R_T.R03 - R_T.R02 - 0.02, ease: EASE.reveal }, T(R_T.R02) + 0.02);
  tl.addLabel("s:R03", T(R_T.R03));

  // ── R04 · EXPLODE: the layers separate — y for all, depth and a tilt on lg/xl ───────────
  const d4 = R_T.R04 - R_T.R03;
  pieces.forEach((p, i) => tl.to(p, { y: explode[i].dy, z: explode[i].z, duration: d4 }, T(R_T.R03)));
  if (deep) tl.to(group, { rotateX: R04_TILT, duration: d4 }, T(R_T.R03));
  tl.addLabel("s:R04", T(R_T.R04));

  // ── R05 · THROUGH: the clip, time-based, on the forward crossing (Spec §09 handoff) ─────
  tl.addLabel("m:R05", T(R_T.R05) - AUTO_LEAD);
  tl.addLabel("s:R05", T(R_T.R05));
  const clip = new Clip(gsap, group, () => tl.time() > T(R_T.R05) + CLIP_WINDOW);
  // the forward crossing starts it (the auto fires on forward crossings only)
  api.auto("m:R05", () => gsap.timeline().call(() => clip.start(), [], 0));
  // a backward crossing stops it (this call fires in both directions; it precedes the start
  // going forward and is a no-op then), as does leaving the window while it plays
  tl.call(() => clip.stop(), [], T(R_T.R05) - AUTO_LEAD - 0.005);
  tl.call(() => clip.stop(), [], T(R_T.R05) + CLIP_WINDOW);
  api.onRevert(() => clip.stop());

  // ── R06 · ASSEMBLY: the layers settle into the whole burger, bottom-up, and grow ────────
  const d6 = R_T.R06 - R_T.R05;
  const n = pieces.length;
  pieces.forEach((p, i) => {
    const at = T(R_T.R05) + (n - 1 - i) * R06_STAGGER;
    tl.to(p, { x: assembled[i].x - poster[i].x, y: assembled[i].y - poster[i].y, z: 0, scale: assembled[i].w / poster[i].w, duration: d6 - (n - 1) * R06_STAGGER }, at);
  });
  if (deep) tl.to(group, { rotateX: 0, duration: d6 * 0.6 }, T(R_T.R05));
  tl.to(title, { clipPath: HIDE_Y, duration: d6 * 0.35, ease: EASE.reveal }, T(R_T.R05));
  tl.set(group, { willChange: "auto" }, T(R_T.R06));
  tl.addLabel("s:R06", T(R_T.R06));

  // ── R07 · HERO LINE: the real menu line, under the burger ───────────────────────────────
  const d7 = R_T.R07 - R_T.R06;
  gsap.set(menuParts, { clipPath: HIDE_X });
  // the block is unmasked a hair before its state (a snap may rest short of the label); its
  // lines are what mask in
  tl.set(menu, { clipPath: SHOW }, T(R_T.R06) - AUTO_LEAD);
  menuParts.forEach((m, i) => tl.to(m, { clipPath: SHOW, duration: d7 * 0.6, ease: EASE.reveal }, T(R_T.R06) + i * d7 * 0.15));
  tl.addLabel("s:R07", T(R_T.R07));
  tl.to({}, { duration: R_T.END - R_T.R07 }, T(R_T.R07));

  return clip;
}

/**
 * The DOM ↔ video handoff (Spec §09): the video is mounted, paused on frame 0 and invisible
 * above the layers. Forward crossing → play(); on the first presented frame the video shows
 * and the layers hide in the same frame; on `ended` (or on leaving the window, or any
 * failure) the layers show and the video hides in the same frame. Not ready → R05 skipped.
 */
class Clip implements ClipControl {
  private video: HTMLVideoElement | null = null;
  private ready = false;
  private playing = false;
  constructor(
    private gsap: SceneApi["gsap"],
    private group: HTMLElement,
    private left: () => boolean,
  ) {}
  sync(s: { ready: boolean; video: HTMLVideoElement | null }) {
    this.ready = s.ready;
    this.video = s.video;
  }
  start() {
    const v = this.video;
    if (!v || this.playing || !canRunClip({ hasClip: true, ready: this.ready, rm: false, saveData: isSaveData() })) return;
    this.playing = true;
    const show = () => {
      if (!this.playing || this.left()) return this.stop();
      this.gsap.to(v, { autoAlpha: 1, duration: CROSSFADE, ease: "none", onComplete: () => this.playing && this.gsap.set(this.group, { visibility: "hidden" }) });
    };
    v.currentTime = 0;
    v.onended = () => this.stop();
    v.onerror = () => this.stop();
    const play = v.play();
    const rvfc = (v as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => void }).requestVideoFrameCallback;
    if (rvfc) rvfc.call(v, show);
    else v.onplaying = show;
    play.catch(() => this.stop());
  }
  stop() {
    const v = this.video;
    const wasPlaying = this.playing;
    this.playing = false;
    // the layers come back first (at their R04 pose: the clip's last frame), then the clip fades
    this.gsap.set(this.group, { visibility: "visible" });
    if (v) {
      v.onended = null;
      v.onerror = null;
      v.onplaying = null;
      this.gsap.killTweensOf(v);
      const done = () => {
        v.pause();
        try {
          v.currentTime = 0;
        } catch {
          // not loaded yet
        }
      };
      if (wasPlaying && v.ended) this.gsap.to(v, { autoAlpha: 0, duration: CROSSFADE, ease: "none", onComplete: done });
      else {
        this.gsap.set(v, { autoAlpha: 0 });
        done();
      }
    }
  }
}
