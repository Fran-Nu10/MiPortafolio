import { describe, expect, it } from "vitest";
import { PROJECTS } from "@/data/projects";
import { getContract } from "@/lib/assets";
import { incompleteVideo, showreelOf } from "@/lib/showreel";

describe("showreel declaration (docs/23 §6)", () => {
  const entries = PROJECTS.map(showreelOf);

  it("every project declares id, name, route, poster, video and metadata", () => {
    expect(entries.map((e) => e.id)).toEqual(PROJECTS.map((p) => p.id));
    for (const e of entries) {
      expect(e.name, e.id).toBeTruthy();
      expect(e.route, e.id).toBe(`/trabajo/${e.id}`);
      expect(e.meta.reelLine, e.id).toBeTruthy();
      expect(e.meta.title, e.id).toContain("Franco Núñez");
      expect(getContract(e.poster).kind, e.id).not.toBe("loop");
      expect(getContract(e.video).kind, e.id).toBe("loop");
      // the loop's floor is the same still the card declares: video and poster never disagree
      expect(getContract(e.video).poster, e.id).toBe(e.poster);
    }
  });

  it("no video is invented: while a loop is a placeholder the card shows its poster only", () => {
    for (const e of entries) {
      const c = getContract(e.video);
      if (c.status === "placeholder") expect(e.videoTiers, e.id).toEqual({ desktop: false, mobile: false });
    }
  });

  it("a video is integrated for both tiers or for none", () => {
    for (const e of entries) expect(incompleteVideo(e), e.id).toBe(false);
  });

  it("the four professional films are in (docs/26 §F): both cuts, AV1 first, H.264 fallback, a poster of their own", () => {
    for (const e of entries) {
      expect(e.videoTiers, e.id).toEqual({ desktop: true, mobile: true });
      const c = getContract(e.video);
      expect(c.status, e.id).toBe("final");
      for (const tier of ["desktop", "mobile"] as const) {
        const f = c.files?.[tier] as { sources: { src: string; type: string }[]; duration: number };
        expect(f.sources.map((s) => s.type.split(";")[0] + (s.type.includes("av01") ? " av1" : " h264")), `${e.id} ${tier}`).toEqual(["video/mp4 av1", "video/mp4 h264"]);
        expect(f.sources.every((s) => s.src.startsWith("/media/reel/")), e.id).toBe(true);
        expect(f.duration).toBeGreaterThanOrEqual(12);
      }
      expect(getContract(c.poster!).status, e.id).toBe("final");
    }
  });
});
