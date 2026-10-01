import type { CSSProperties, ReactNode } from "react";
import type { Capture as CaptureData } from "@/data/projects";
import { Capture } from "./Capture";
import { CAPTURE_RATIO } from "@/data/projects";

/**
 * A real screen at its own proportions inside any window. The canvas always keeps the
 * capture's ratio and covers the window; `fx`/`fy` choose what stays in view (0–1 of the
 * capture). A desktop window has the capture's ratio, so nothing is cropped; a phone window
 * is portrait, so it shows a legible region of the real screen instead of shrinking it —
 * and a scene can pan by tweening `--fx` on `.screen-canvas`.
 *
 * Children are drawn in capture coordinates (percentages of the canvas), on top of the image.
 */
export function Screen({
  capture,
  fx = 0.5,
  fy = 0.5,
  zm = 1,
  sizes = "(max-width: 1023px) 1100px, 88vw",
  className = "",
  canvasClassName = "",
  style,
  children,
  priority = false,
}: {
  capture?: CaptureData;
  fx?: number;
  fy?: number;
  /** zoom on compact viewports only (desktop windows show the whole screen) */
  zm?: number;
  sizes?: string;
  className?: string;
  canvasClassName?: string;
  style?: CSSProperties;
  children?: ReactNode;
  priority?: boolean;
}) {
  return (
    <div className={`screen ${className}`} style={style}>
      <div className={`screen-canvas ${canvasClassName}`} style={{ ["--fx" as string]: fx, ["--fy" as string]: fy, ["--zm" as string]: zm, ["--r" as string]: CAPTURE_RATIO }}>
        {capture && <Capture capture={capture} sizes={sizes} position="center center" priority={priority} />}
        {children}
      </div>
    </div>
  );
}
