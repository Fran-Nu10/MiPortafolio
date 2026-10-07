import Image, { getImageProps } from "next/image";
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

  let img: ReactNode;
  if (mobile.src !== desktop.src) {
    const common = { alt: asset.alt, sizes, fill: true, priority } as const;
    const { props: d } = getImageProps({ ...common, src: desktop.src });
    const {
      props: { srcSet: mobileSrcSet, ...m },
    } = getImageProps({ ...common, src: mobile.src });
    img = (
      <picture>
        <source media="(min-width: 768px)" srcSet={d.srcSet} sizes={sizes} />
        <source media="(max-width: 767.98px)" srcSet={mobileSrcSet} sizes={sizes} />
        {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
        <img {...m} className="media-img" />
      </picture>
    );
  } else {
    img = <Image src={desktop.src} alt={asset.alt} fill sizes={sizes} priority={priority} className="media-img" />;
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
