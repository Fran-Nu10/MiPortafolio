"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { ResolvedAsset } from "@/lib/resolved";
import { REEL_SIZES, reelVideoPlan } from "@/lib/reel";
import { LoopVideo } from "@/components/media/LoopVideo";

export interface ReelItemView {
  id: string;
  /** "01 / 04" (active) */
  indexLabel: string;
  /** "02 · Rayo Smash" (neighbours, Content Master 05) */
  miniLabel: string;
  /** "02 de 04 · Rayo Smash" (live region after a settle) */
  liveLabel: string;
  name: string;
  reelLine: string;
  relationLine?: string;
  aspect: { desktop: [number, number]; mobile: [number, number] };
  /** the loop contract; its poster (the real capture) is the floor under any video */
  loop: ResolvedAsset;
  reelLabel: string;
  enter: { href: string; label: string };
  /** only when the live URL is confirmed */
  open?: { href: string; label: string; aria: string };
}

/**
 * One reel piece (Spec §06 DOM). Only the active item's links are in the tab order; the
 * neighbours keep their frames clickable. The <video> exists only by the lifecycle rules
 * (lib/reel `reelVideoPlan`); the real poster is always underneath.
 */
export function ReelItem({
  item,
  index,
  active,
  side,
  distance,
  settled,
  near,
  reducedMotion,
  saveData,
  roleItem,
}: {
  item: ReelItemView;
  index: number;
  active: boolean;
  /** where the item sits relative to the active one: its visible strip is on that edge */
  side: "before" | "active" | "after";
  distance: number;
  settled: boolean;
  near: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  roleItem: string;
}) {
  // an item ≥ 2 away keeps its (paused) video for 10 s, then unmounts it
  const [expired, setExpired] = useState(distance > 1);
  useEffect(() => {
    if (distance <= 1) {
      const id = requestAnimationFrame(() => setExpired(false));
      return () => cancelAnimationFrame(id);
    }
    const t = window.setTimeout(() => setExpired(true), 10_000);
    return () => window.clearTimeout(t);
  }, [distance]);

  const plan = reelVideoPlan({ distance, near, settled, awayFor: expired ? Infinity : 0, reducedMotion, saveData });
  const tab = active ? 0 : -1;

  return (
    <li
      className="reel-item"
      data-index={index}
      data-project={item.id}
      data-active={active ? "" : undefined}
      data-side={side}
      data-dim={settled && !active ? "" : undefined}
      style={
        {
          "--r-d": item.aspect.desktop[0] / item.aspect.desktop[1],
          "--r-m": item.aspect.mobile[0] / item.aspect.mobile[1],
          "--ar-d": `${item.aspect.desktop[0]} / ${item.aspect.desktop[1]}`,
          "--ar-m": `${item.aspect.mobile[0]} / ${item.aspect.mobile[1]}`,
        } as CSSProperties
      }
    >
      {/* the group lives inside the <li>: a role on the <li> itself would break the list */}
      <div role="group" aria-roledescription={roleItem} aria-label={item.reelLabel} className="reel-piece">
        <div data-part="frame" className="reel-frame">
          <LoopVideo asset={item.loop} active={plan.play} mount={plan.mount} preload={plan.preload} sizes={REEL_SIZES} fill />
        </div>
        <div data-part="meta" className="reel-meta">
          <div className="reel-meta-full">
            <div className="reel-meta-head">
              <span className="micro muted">{item.indexLabel}</span>
              <h3 className="reel-name">{item.name}</h3>
            </div>
            <div className="reel-meta-row">
              <p className="micro muted reel-line">{item.reelLine}</p>
              <p className="reel-links">
                <a href={item.enter.href} className="link" tabIndex={tab} data-enter="">
                  {item.enter.label}
                </a>
                {item.open ? (
                  <a href={item.open.href} target="_blank" rel="noopener noreferrer" aria-label={item.open.aria} className="link" tabIndex={tab}>
                    {item.open.label}
                  </a>
                ) : null}
              </p>
            </div>
            {item.relationLine ? <p className="reel-relation">{item.relationLine}</p> : null}
          </div>
          <p className="reel-meta-mini micro muted" aria-hidden="true">
            {item.miniLabel}
          </p>
        </div>
      </div>
    </li>
  );
}
