#!/usr/bin/env node
/**
 * The showreel films (docs/26 §F): web versions of the four professional films, made from their
 * masters without touching them. Masters stay outside the repository; only the web files land in
 * public/media/reel/.
 *
 *   node scripts/encode-reel.mjs [masters=C:/Users/User/Documents/REVELADO-PORTFOLIO-FINAL]
 *
 * Per film and tier (desktop 16:9 · mobile as delivered): AV1 (SVT-AV1, first source) and H.264
 * (High, faststart, the fallback), no audio track, and a poster = frame 0 (WebP), so the still
 * under the video is the video's own first picture. A master whose H.264 is already within the web
 * budget (Chef Arturo, ≤ 2 Mbit/s) is copied as its H.264 source instead of being re-encoded.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const MASTERS = process.argv[2] ?? "C:/Users/User/Documents/REVELADO-PORTFOLIO-FINAL";
const OUT = join(process.cwd(), "public/media/reel");
const SLUGS = ["travelsuite360", "rayo-smash", "santi-nuca", "chef-arturo"];
/** desktop: 1600 px wide (a ≤ 1094 css px card at 1.5×); mobile: 720 px wide */
const WIDTH = { desktop: 1600, mobile: 720 };
/** masters at or under this bitrate are already web-sized: their H.264 ships as delivered */
const KEEP_H264_KBPS = 2000;

mkdirSync(OUT, { recursive: true });

const probe = (f) =>
  JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=bit_rate,duration:stream=width,height", "-select_streams", "v:0", "-of", "json", f], { encoding: "utf8" }));

const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });

for (const slug of SLUGS) {
  for (const tier of ["desktop", "mobile"]) {
    const master = join(MASTERS, `${slug}-${tier}.mp4`);
    if (!existsSync(master)) {
      console.log(`missing: ${master}`);
      continue;
    }
    const info = probe(master);
    const { width, height } = info.streams[0];
    const kbps = Math.round(Number(info.format.bit_rate) / 1000);
    const w = Math.min(WIDTH[tier], width);
    const scale = `scale=${w}:-2:flags=lanczos`;
    const base = join(OUT, `${slug}-${tier}`);

    // AV1: the first source (smallest; also the one the test browsers decode)
    ff(["-i", master, "-an", "-vf", scale, "-c:v", "libsvtav1", "-preset", "5", "-crf", tier === "desktop" ? "36" : "37", "-g", "60", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${base}.av1.mp4`]);

    // H.264: the fallback — as delivered when it already fits the web, re-encoded otherwise
    if (kbps <= KEEP_H264_KBPS) copyFileSync(master, `${base}.h264.mp4`);
    else
      ff([
        "-i", master, "-an", "-vf", scale, "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-maxrate", tier === "desktop" ? "2400k" : "1400k",
        "-bufsize", tier === "desktop" ? "4800k" : "2800k", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${base}.h264.mp4`,
      ]);

    // the poster: frame 0, at the web width
    const png = `${base}-poster.png`;
    ff(["-i", master, "-frames:v", "1", "-vf", scale, png]);
    await sharp(png).webp({ quality: 78 }).toFile(`${base}-poster.webp`);
    const out = await sharp(`${base}-poster.webp`).metadata();
    execFileSync("node", ["-e", `require("fs").unlinkSync(${JSON.stringify(png)})`]);

    const kb = (f) => Math.round(statSync(f).size / 1024);
    console.log(
      `${slug} ${tier}: master ${width}×${height} ${kbps} kbit/s → av1 ${kb(`${base}.av1.mp4`)} KB · h264 ${kb(`${base}.h264.mp4`)} KB${kbps <= KEEP_H264_KBPS ? " (as delivered)" : ""} · poster ${out.width}×${out.height} ${kb(`${base}-poster.webp`)} KB`,
    );
  }
}
