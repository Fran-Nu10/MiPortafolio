"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import type { VideoFiles } from "@/data/types";
import { aspectVars, type ResolvedAsset } from "@/lib/resolved";
import { claimPlayback, isSaveData, mediaTierFor, releasePlayback } from "@/lib/media";
import { usePrefersReducedMotion } from "@/lib/motion";
import { TIER_QUERIES } from "@/lib/tiers";
import { useInView, usePageVisible } from "@/lib/useInView";
import { Placeholder } from "./Placeholder";
import { Still } from "./Still";

const noop = () => () => {};
/** false on the server and during hydration, true afterwards: the <video> is client-only */
function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** the phone tier, live: a resize across it swaps the cut (desktop 16:9 ↔ the mobile cut, docs/26 §F3) */
function subscribePhone(onChange: () => void) {
  const mq = window.matchMedia(TIER_QUERIES.sm);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function usePhone() {
  return useSyncExternalStore(subscribePhone, () => window.matchMedia(TIER_QUERIES.sm).matches, () => false);
}

/**
 * A muted decorative clip over its identical poster (Spec §17). The poster is always the
 * floor: the video mounts only on the client, never under reduced motion or Save-Data, is
 * invisible until its first frame is presented, and on any failure simply disappears.
 *
 * `active` is the owner's decision (reel: active item after snap). Playback also needs the
 * clip ≥ 50% in view and the tab visible. At most one decorative loop plays (lib/media).
 */
export function LoopVideo({
  asset,
  active,
  mount = true,
  loop = true,
  preload = "none",
  sizes,
  fill = false,
  className = "",
  onEnded,
}: {
  asset: ResolvedAsset;
  active: boolean;
  /** the owner's lifecycle decision: whether the <video> element exists at all (reel, Spec §06) */
  mount?: boolean;
  /** false = Franco at work: plays once per entry, holds the last frame */
  loop?: boolean;
  preload?: "none" | "metadata" | "auto";
  sizes: string;
  fill?: boolean;
  className?: string;
  onEnded?: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hydrated = useHydrated();
  const phone = usePhone();
  const rm = usePrefersReducedMotion();
  const inView = useInView(boxRef, { threshold: 0.5 });
  const visible = usePageVisible();
  const [failed, setFailed] = useState(false);
  /** sources skipped after a decode failure: a browser that claims AV1 and cannot decode it falls to H.264 */
  const [skip, setSkip] = useState(0);
  const [shown, setShown] = useState(false);

  const real = asset.status !== "placeholder";
  const tier = mediaTierFor(phone ? "sm" : "lg");
  const canMount = mount && real && hydrated && !rm && !failed && !isSaveData();
  const shouldPlay = canMount && active && inView && visible;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!shouldPlay) {
      v.pause();
      return;
    }
    claimPlayback(v);
    v.play().catch(() => setFailed(true));
    return () => releasePlayback(v);
    // a swapped cut is a new element: it plays as the old one did
  }, [shouldPlay, tier, skip]);

  // a clip that never presents its first frame within 4 s of trying is treated as failed
  useEffect(() => {
    if (!shouldPlay || shown) return;
    const t = window.setTimeout(() => setFailed(true), 4000);
    return () => window.clearTimeout(t);
  }, [shouldPlay, shown]);

  const poster = asset.poster;
  const floor = poster ? <Still asset={poster} sizes={sizes} fill /> : <Placeholder asset={asset} fill />;

  let files: VideoFiles | null = null;
  if (canMount && real) files = (asset.files[tier] ?? asset.files.desktop) as VideoFiles;
  const sources = files ? files.sources.slice(skip) : [];
  // a source that loads and then fails to decode is not retried by the browser: try the next one
  const onVideoError = () => (skip + 1 < (files?.sources.length ?? 0) ? setSkip(skip + 1) : setFailed(true));

  return (
    <div ref={boxRef} className={`loop-video ${fill ? "media-fill" : "media-box"} ${className}`} style={aspectVars(asset) as CSSProperties} data-asset={asset.key}>
      {floor}
      {files ? (
        <video
          key={`${tier}-${skip}`}
          ref={videoRef}
          className="media-video"
          style={{ opacity: shown ? 1 : 0 }}
          muted
          playsInline
          loop={loop}
          preload={preload}
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setShown(true)}
          onError={onVideoError}
          onEnded={onEnded}
        >
          {sources.map((s, i) => (
            // the last source reports its own failure (the <video> error covers a decode error)
            <source key={s.src} src={s.src} type={s.type} onError={i === sources.length - 1 ? onVideoError : undefined} />
          ))}
        </video>
      ) : null}
    </div>
  );
}
