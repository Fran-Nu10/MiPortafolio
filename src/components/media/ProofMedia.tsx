"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import type { VideoFiles } from "@/data/types";
import { aspectVars, type ResolvedAsset } from "@/lib/resolved";
import { isSaveData, mediaTierFor } from "@/lib/media";
import { usePrefersReducedMotion } from "@/lib/motion";
import { tierForWidth } from "@/lib/tiers";
import { useInView, usePageVisible } from "@/lib/useInView";
import { Placeholder } from "./Placeholder";
import { Still } from "./Still";

const noop = () => () => {};
function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/**
 * A proof recording: the real product, non-loop (Spec §17 / §02 S4). Autoplays muted only
 * when ≥ 60% in view (never under reduced motion or Save-Data), pauses outside, keeps a
 * visible play/pause control and holds its last frame.
 *
 * While the recording does not exist: the real poster capture with no play button, or the
 * neutral placeholder when there is no real poster either (TravelSuite360 today).
 */
export function ProofMedia({ asset, label, sizes }: { asset: ResolvedAsset; label: string; sizes: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hydrated = useHydrated();
  const rm = usePrefersReducedMotion();
  const inView = useInView(boxRef, { threshold: 0.6 });
  const visible = usePageVisible();
  const [failed, setFailed] = useState(false);
  const [shown, setShown] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  /** the visitor paused: no autoplay until they press play again */
  const [userPaused, setUserPaused] = useState(false);

  const real = asset.status !== "placeholder";
  const canMount = real && hydrated && !failed;
  const autoplay = canMount && !rm && !isSaveData() && !userPaused && !ended && inView && visible;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (autoplay) v.play().catch(() => setFailed(true));
    else if (!inView || !visible) v.pause();
  }, [autoplay, inView, visible]);

  const poster = asset.poster;
  const floor = poster ? <Still asset={poster} sizes={sizes} fill /> : <Placeholder asset={asset} fill />;

  let files: VideoFiles | null = null;
  if (canMount && real) {
    const tier = mediaTierFor(tierForWidth(window.innerWidth));
    files = (asset.files[tier] ?? asset.files.desktop) as VideoFiles;
  }

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) {
      setUserPaused(false);
      setEnded(false);
      if (v.ended) v.currentTime = 0;
      v.play().catch(() => setFailed(true));
    } else {
      setUserPaused(true);
      v.pause();
    }
  };

  return (
    <div ref={boxRef} className="proof-media media-fill" style={aspectVars(asset) as CSSProperties} data-asset={asset.key}>
      {floor}
      {files ? (
        <>
          <video
            ref={videoRef}
            className="media-video"
            style={{ opacity: shown ? 1 : 0 }}
            muted
            playsInline
            preload={inView ? "metadata" : "none"}
            aria-label={label}
            onPlaying={() => {
              setShown(true);
              setPlaying(true);
            }}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              setPlaying(false);
              setEnded(true);
            }}
            onError={() => setFailed(true)}
          >
            {files.sources.map((s) => (
              <source key={s.src} src={s.src} type={s.type} />
            ))}
          </video>
          <button type="button" className="proof-toggle" onClick={toggle} aria-label={playing ? "Pausar" : ended ? "Volver a ver" : "Reproducir"}>
            <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
          </button>
        </>
      ) : null}
    </div>
  );
}
