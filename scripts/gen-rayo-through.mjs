#!/usr/bin/env node
/**
 * Rayo Smash · R05 "through" clip (Spec §09): the camera move between the layers, rendered
 * from the same six derived cutouts at the exact R04 composition — so the DOM ↔ video
 * handoff has nothing to hide. First frame = last frame = R04 (camera at rest); in between
 * the camera dollies in past the bun, the bacon, the cheese and the meat, and comes back.
 *
 *   node scripts/gen-rayo-through.mjs            → public/media/rayo/through-desktop.{av1,h264}.mp4
 *                                                  + through-desktop-poster.webp (frame 0)
 *
 * Frames are real CSS 3D renders (headless Chromium, the same perspective / tilt / depths as
 * RayoWorld, from lib/rayo-world.ts), captured at 1920×1200 around the 1440×900 space so the
 * clip also covers the stage on lg. Encoded in the browser (MediaRecorder): AV1 MP4 first,
 * H.264 MP4 second (Spec §17). No audio. Deterministic frame times (canvas.captureStream(0)).
 *
 * This is a test render from derived material: the final clip is rendered from the demo's
 * original layer PNGs at production quality. Same contract key, same framing.
 */
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);
const { RAYO_LAYERS, RAYO_STACK } = await load("src/data/rayo-layers.ts");
const { R04_TILT, RAYO_PERSPECTIVE, assembledBoxes, explodeOffsets, posterBoxes, stackHeight } = await load("src/lib/rayo-world.ts");

const OUT = join(ROOT, "public/media/rayo");
const FRAME = { w: 1920, h: 1200 };
const SPACE = { w: 1440, h: 900 };
const FPS = 30;
const SECONDS = 3.2;
const RED = "#E63B2E";
const BITRATE = 8_000_000;

/** the R04 composition, exactly as RayoWorld lays it out (lib/rayo-world.ts, deep variant) */
function composition() {
  const stackAspect = RAYO_STACK.aspect[0] / RAYO_STACK.aspect[1];
  const stackBox = { w: 0.62 * SPACE.h * stackAspect, h: 0.62 * SPACE.h };
  stackBox.x = (SPACE.w - stackBox.w) / 2;
  stackBox.y = (SPACE.h - stackBox.h) / 2;
  const toSpace = (b) => ({ x: stackBox.x + b.x * stackBox.w, y: stackBox.y + b.y * stackBox.w, w: b.w * stackBox.w, h: b.h * stackBox.w });
  const layers = RAYO_LAYERS.map((l) => ({ name: l.name, offset: l.offset }));
  const stack = { w: RAYO_STACK.aspect[0], h: RAYO_STACK.aspect[1] };
  const poster = posterBoxes(layers, stack).map(toSpace);
  const asmH = stackHeight(assembledBoxes(layers, stack)) * stackBox.w;
  const explode = explodeOffsets(layers.length, asmH, "deep");
  return RAYO_LAYERS.map((l, i) => ({ name: l.name, src: l.files.webp["2x"], box: poster[i], dy: explode[i].dy, z: explode[i].z }));
}

/** the camera path: (translateZ toward the layers, y follow, extra tilt) at t ∈ [0, 1] */
function camera(t) {
  const ease = (x) => x * x * (3 - 2 * x);
  // in over 62% of the clip, hold 8%, out over 30%; the ends are the rest pose
  const k = t < 0.62 ? ease(t / 0.62) : t < 0.7 ? 1 : 1 - ease((t - 0.7) / 0.3);
  return { z: 940 * k, y: 230 * k, tilt: -5 * k };
}

const page = (comp) => `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:${FRAME.w}px;height:${FRAME.h}px;overflow:hidden;background:${RED}}
  .space{position:absolute;left:${(FRAME.w - SPACE.w) / 2}px;top:${(FRAME.h - SPACE.h) / 2}px;width:${SPACE.w}px;height:${SPACE.h}px}
  .persp{position:absolute;inset:0;perspective:${RAYO_PERSPECTIVE}px;perspective-origin:50% 50%}
  .camera{position:absolute;inset:0;transform-style:preserve-3d;transform-origin:${SPACE.w / 2}px ${SPACE.h / 2}px}
  .group{position:absolute;inset:0;transform-style:preserve-3d;transform-origin:${SPACE.w / 2}px ${SPACE.h / 2}px;transform:rotateX(${R04_TILT}deg)}
  .piece{position:absolute;transform-origin:0 0}
  .piece img{display:block;width:100%;height:100%}
</style></head><body><div class="space"><div class="persp"><div class="camera" id="camera"><div class="group">
${comp.map((l) => `<div class="piece" style="left:${l.box.x}px;top:${l.box.y}px;width:${l.box.w}px;height:${l.box.h}px;transform:translate3d(0px, ${l.dy}px, ${l.z}px)"><img src="${pathToFileURL(join(ROOT, "public", l.src)).href}" alt=""></div>`).join("\n")}
</div></div></div></div></body></html>`;

const comp = composition();
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: FRAME.w, height: FRAME.h }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
// a file:// page (setContent's about:blank origin cannot load file:// images)
const PAGE = join(ROOT, "media-src/rayo/through-page.html");
mkdirSync(dirname(PAGE), { recursive: true });
writeFileSync(PAGE, page(comp));
await p.goto(pathToFileURL(PAGE).href, { waitUntil: "load" });
await p.evaluate(async () => {
  await Promise.all(Array.from(document.images).map((i) => i.decode()));
  await document.fonts?.ready;
});

const total = Math.round(FPS * SECONDS);
const frames = [];
for (let f = 0; f < total; f++) {
  const c = camera(f / (total - 1));
  await p.evaluate((c) => {
    document.getElementById("camera").style.transform = `translate3d(0px, ${c.y}px, ${c.z}px) rotateX(${c.tilt}deg)`;
  }, c);
  frames.push(await p.screenshot({ type: "png", animations: "disabled" }));
}
console.log(`rayo through: ${frames.length} frames at ${FRAME.w}×${FRAME.h}`);

// frame 0 is the clip's poster (and the DOM composition the handoff must match)
await sharp(frames[0]).webp({ quality: 82 }).toFile(join(OUT, "through-desktop-poster.webp"));

// encode in the browser from the frame sequence: exact frame timing via captureStream(0)
const enc = await ctx.newPage();
await enc.setContent(`<!doctype html><canvas id="c" width="${FRAME.w}" height="${FRAME.h}"></canvas>`);
const encode = async (mime, name) => {
  const b64 = await enc.evaluate(
    async ({ frames, mime, fps, bitrate }) => {
      if (!MediaRecorder.isTypeSupported(mime)) return null;
      const canvas = document.getElementById("c");
      const g = canvas.getContext("2d");
      const stream = canvas.captureStream(0);
      const track = stream.getVideoTracks()[0];
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate });
      const chunks = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      const done = new Promise((r) => (rec.onstop = r));
      const imgs = await Promise.all(
        frames.map(
          (src) =>
            new Promise((res) => {
              const i = new Image();
              i.onload = () => res(i);
              i.src = src;
            }),
        ),
      );
      rec.start();
      for (const i of imgs) {
        g.drawImage(i, 0, 0);
        track.requestFrame();
        await new Promise((r) => setTimeout(r, 1000 / fps));
      }
      g.drawImage(imgs[imgs.length - 1], 0, 0);
      track.requestFrame();
      await new Promise((r) => setTimeout(r, 100));
      rec.stop();
      await done;
      const blob = new Blob(chunks, { type: mime.split(";")[0] });
      const buf = new Uint8Array(await blob.arrayBuffer());
      let s = "";
      for (let k = 0; k < buf.length; k += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(k, k + 0x8000));
      return btoa(s);
    },
    { frames: frames.map((f) => `data:image/png;base64,${f.toString("base64")}`), mime, fps: FPS, bitrate: BITRATE },
  );
  if (!b64) {
    console.warn(`${name}: ${mime} not supported by this Chromium — skipped`);
    return null;
  }
  const file = join(OUT, name);
  writeFileSync(file, Buffer.from(b64, "base64"));
  console.log(`${name}: ${Math.round(statSync(file).size / 1024)} KB`);
  return file;
};
await encode('video/mp4;codecs="av01.0.08M.08"', "through-desktop.av1.mp4");
await encode('video/mp4;codecs="avc1.640028"', "through-desktop.h264.mp4");
await browser.close();
console.log(JSON.stringify({ key: "rayo.through", width: FRAME.w, height: FRAME.h, duration: SECONDS, fps: FPS }));
