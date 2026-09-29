import Image from "next/image";
import type { CSSProperties } from "react";
import type { Capture as CaptureData } from "@/data/projects";

/** A real product capture. object-fit cover with a chosen focus; never a decorative image. */
export function Capture({ capture, sizes = "100vw", priority = false, position = "center top", mobilePosition, className = "", style }: { capture: CaptureData; sizes?: string; priority?: boolean; position?: string; mobilePosition?: string; className?: string; style?: CSSProperties }) {
  return (
    <Image
      src={capture.src}
      alt={capture.alt}
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      className={`capture h-full w-full object-cover ${className}`}
      style={{ ["--pos" as string]: position, ["--pos-m" as string]: mobilePosition ?? position, ...style }}
    />
  );
}
