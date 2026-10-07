import type { CSSProperties } from "react";
import type { CutoutFiles } from "@/data/types";
import { aspectVars, type ResolvedAsset } from "@/lib/resolved";
import { Placeholder } from "./Placeholder";

/**
 * Plain <img> for alpha cutouts and images animated beyond their layout size (Spec §17):
 * pre-generated AVIF + WebP at 1x/2x with known intrinsic sizes, so pixel alignment never
 * depends on an optimizer's re-crop. The hero portrait uses `priority` (fetchpriority high).
 */
export function Cutout({
  asset,
  priority = false,
  fill = false,
  className = "",
  imgClassName = "",
}: {
  asset: ResolvedAsset;
  priority?: boolean;
  fill?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  if (asset.status === "placeholder") return <Placeholder asset={asset} fill={fill} className={className} />;
  const d = asset.files.desktop as CutoutFiles;
  const m = asset.files.mobile as CutoutFiles;
  const srcSet = (f: { "1x": string; "2x": string }) => `${f["1x"]} 1x, ${f["2x"]} 2x`;
  return (
    <div className={`cutout ${fill ? "media-fill" : "media-box"} ${className}`} data-asset={asset.key} style={aspectVars(asset) as CSSProperties}>
      <picture>
        {m !== d ? <source media="(max-width: 767.98px)" type="image/avif" srcSet={srcSet(m.avif)} /> : null}
        {m !== d ? <source media="(max-width: 767.98px)" type="image/webp" srcSet={srcSet(m.webp)} /> : null}
        <source type="image/avif" srcSet={srcSet(d.avif)} />
        <source type="image/webp" srcSet={srcSet(d.webp)} />
        <img
          src={d.webp["1x"]}
          alt={asset.alt}
          width={d.width}
          height={d.height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className={`media-img ${imgClassName}`}
        />
      </picture>
    </div>
  );
}
