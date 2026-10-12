import { getImageProps } from "next/image";
import type { CSSProperties, ReactNode } from "react";
import type { ImageFile } from "@/data/types";
import { aspectVars, type ResolvedAsset } from "@/lib/resolved";
import { Placeholder } from "./Placeholder";

/**
 * `next/image` with an asset-contract input (Spec §17): AVIF/WebP, responsive srcset, lazy
 * by default, and a box reserved at the contract's aspect before any byte loads (no CLS).
 * Mobile may crop the same file (`focus`) or art-direct a different one (<picture>).
 *
 * Failure without JavaScript: the alt text sits in mono underneath the image; an image that
 * fails to load leaves it visible at the same size (Spec §24) — no broken icon, no shift.
 */
export function Still({
  asset,
  sizes,
  priority = false,
  fill = false,
  className = "",
}: {
  asset: ResolvedAsset;
  sizes: string;
  priority?: boolean;
  fill?: boolean;
  className?: string;
}) {
  if (asset.status === "placeholder") return <Placeholder asset={asset} fill={fill} className={className} />;
  const desktop = asset.files.desktop as ImageFile;
  const mobile = asset.files.mobile as ImageFile;
  const style = {
    ...aspectVars(asset),
    "--focus-d": desktop.focus ?? "50% 50%",
    "--focus-m": mobile.focus ?? desktop.focus ?? "50% 50%",
  } as CSSProperties;

  // Next 16: `priority` is deprecated. React 19's server renderer preloads any non-lazy <img>
  // that is not inside a <picture> (a <link rel=preload imagesrcset>), and WebKit at DPR 2 picked a
  // different candidate for the element than for the preload ("preloaded but not used" on every
  // project route: a double download). The optimizer's srcset/sizes come from getImageProps and the
  // element always sits in a <picture>: an above-the-fold poster loads eagerly with
  // fetchpriority="high" (server HTML, discovered at once), and nothing is preloaded twice.
  const eager = priority ? ({ loading: "eager", fetchPriority: "high" } as const) : {};
  const common = { alt: asset.alt, sizes, fill: true } as const;
  const { props: d } = getImageProps({ ...common, src: desktop.src });
  let img: ReactNode;
  if (mobile.src !== desktop.src) {
    const {
      props: { srcSet: mobileSrcSet, ...m },
    } = getImageProps({ ...common, src: mobile.src });
    img = (
      <picture>
        <source media="(min-width: 768px)" srcSet={d.srcSet} sizes={sizes} />
        <source media="(max-width: 767.98px)" srcSet={mobileSrcSet} sizes={sizes} />
        {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
        <img {...m} {...eager} className="media-img" />
      </picture>
    );
  } else {
    img = (
      <picture>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- alt and the optimizer's srcset come from getImageProps */}
        <img {...d} {...eager} className="media-img" />
      </picture>
    );
  }

  return (
    <div className={`still ${fill ? "media-fill" : "media-box"} ${className}`} data-asset={asset.key} style={style}>
      <span className="media-alt" aria-hidden="true">
        {asset.alt}
      </span>
      {img}
    </div>
  );
}
