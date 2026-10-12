import type { AssetKey } from "./types";

/**
 * Provisional launch (Spec §22, decided by Franco on 2026-10-12): REVELADO 2.2 goes to Vercel
 * production while some launch-blocking slots are still placeholders. This file is the explicit,
 * controlled exception — nothing else relaxes the asset checker:
 *
 * - a production build (`VERCEL_ENV=production`) accepts exactly the slots listed here, each still
 *   rendering its honest `Placeholder` (no imagery, no text that reads as evidence), and prints them
 *   as pending on every build;
 * - any OTHER launch-blocking slot on placeholder still fails the build;
 * - `npm run check:launch` (the final launch criterion, Spec §28 A21) ignores this list and keeps
 *   failing until every slot is final;
 * - TravelSuite360 media still needs `privacyChecked: true` (Spec §23): this list never publishes
 *   media, it only lets a slot stay empty.
 *
 * When a real asset arrives: add its files to `src/data/assets.ts`, set its status, remove its key
 * here (the checker warns about keys that are no longer needed), rebuild.
 */
export const PROVISIONAL_LAUNCH: {
  authorizedBy: string;
  date: string;
  note: string;
  slots: AssetKey[];
} = {
  authorizedBy: "Franco Núñez",
  date: "2026-10-12",
  note: "Publicación provisional en Vercel Production con los assets disponibles; imágenes, videos y ajustes se completan después.",
  slots: ["franco.hero", "ts.reel.poster", "ts.proof", "rayo.proof", "santi.proof", "chef.proof"],
};
