import { ASSETS } from "@/data/assets";
import type { AssetContract, AssetKey } from "@/data/types";
import type { ResolvedAsset, ResolvedBase } from "./resolved";

export type { ResolvedAsset, ResolvedBase, ResolvedPlaceholder, ResolvedReal } from "./resolved";

/**
 * Asset-contract resolver (Spec §22). Server components call `resolveAsset(key)` and hand
 * the result to a media component, so the registry never ships to the client and no
 * component ever knows a file path.
 *
 * A contract resolves to its files when `status !== "placeholder"`; otherwise to a
 * placeholder description with the same aspect, timing and metadata. TravelSuite360 media
 * without `privacyChecked: true` always resolves to a placeholder (Spec §23).
 */

const BY_KEY = new Map<AssetKey, AssetContract>(ASSETS.map((a) => [a.key, a]));

export function hasAsset(key: AssetKey): boolean {
  return BY_KEY.has(key);
}

export function getContract(key: AssetKey): AssetContract {
  const c = BY_KEY.get(key);
  if (!c) throw new Error(`Unknown asset key "${key}" — add it to src/data/assets.ts`);
  return c;
}

export function allContracts(): readonly AssetContract[] {
  return ASSETS;
}

/** TravelSuite360 media is never published without the §23 sign-off */
export function isTravelSuiteKey(key: AssetKey): boolean {
  return key.startsWith("ts.") || key === "og.ts";
}

export function isUsable(c: AssetContract): boolean {
  if (c.status === "placeholder" || !c.files?.desktop) return false;
  if (isTravelSuiteKey(c.key) && c.privacyChecked !== true) return false;
  return true;
}

export function resolveAsset(key: AssetKey, seen: Set<AssetKey> = new Set()): ResolvedAsset {
  const c = getContract(key);
  if (seen.has(key)) throw new Error(`Asset poster cycle at "${key}"`);
  seen.add(key);
  const base: ResolvedBase = {
    key: c.key,
    kind: c.kind,
    alt: c.alt,
    aspect: { desktop: c.aspect.desktop, mobile: c.aspect.mobile ?? c.aspect.desktop },
    surface: c.surface ?? "black",
    meta: c.meta ?? {},
  };
  const posterResolved = c.poster ? resolveAsset(c.poster, seen) : null;
  const poster = posterResolved && posterResolved.status !== "placeholder" ? posterResolved : null;

  if (!isUsable(c)) return { ...base, status: "placeholder", poster };
  const desktop = c.files!.desktop!;
  return {
    ...base,
    status: c.status as "final" | "derived",
    files: { desktop, mobile: c.files!.mobile ?? desktop },
    poster,
    lqip: c.lqip,
  };
}

/** keys that still resolve to a placeholder although they block launch (Spec §22) */
export function launchBlockers(): AssetContract[] {
  return ASSETS.filter((c) => c.blocksLaunch && !isUsable(c));
}
