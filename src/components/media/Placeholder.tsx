import type { CSSProperties } from "react";
import { aspectVars, type ResolvedBase } from "@/lib/resolved";

const SHOW_KEYS = process.env.NEXT_PUBLIC_SHOW_ASSET_KEYS === "1";

/**
 * The honest stand-in for a missing asset (Spec §22): a flat field at the contract's
 * aspect with a 1px inner rule — no imagery, no fake UI, nothing that reads as evidence.
 * The asset key shows only in development/preview (`NEXT_PUBLIC_SHOW_ASSET_KEYS=1`).
 * Decorative by construction: it never claims to be the thing it replaces.
 */
export function Placeholder({ asset, fill = false, className = "" }: { asset: ResolvedBase; fill?: boolean; className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-placeholder={asset.key}
      data-surface={asset.surface}
      className={`placeholder ${fill ? "media-fill" : "media-box"} ${className}`}
      style={aspectVars(asset) as CSSProperties}
    >
      {SHOW_KEYS ? <span className="placeholder-key">{asset.key}</span> : null}
    </div>
  );
}
