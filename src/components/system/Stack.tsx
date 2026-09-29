import type { CSSProperties, ReactNode } from "react";
import type { Layer } from "@/data/projects";

export interface StackLayerFace {
  /** DOM content of the top face (the interface layer carries the real screen) */
  face?: ReactNode;
  /** face background; paper for interface layers, graphite otherwise */
  paper?: boolean;
  /** outline only until filled (0–1). Read from --fill-<i> on the stack element. */
}

interface StackProps {
  layers: Layer[];
  /** optional per-layer DOM faces, keyed by layer key */
  faces?: Partial<Record<Layer["key"], ReactNode>>;
  width?: number;
  height?: number;
  /** initial CSS variables: rotation 0 (iso) – 1 (frontal), explode px, fill per layer 0–1 */
  rot?: number;
  explode?: number;
  fills?: number[];
  /** show the axis through the stack */
  axis?: boolean;
  /** draw the base plate under the stack with an engraved label */
  plate?: ReactNode | null;
  className?: string;
  style?: CSSProperties;
  thickness?: number;
  /** show layer labels on the faces */
  labels?: boolean;
  /** dashed outline layers (nothing built yet) */
  ghost?: boolean;
}

/**
 * The signature object: four isometric slabs with real thickness, bone edge lines and
 * the real interface as the top face. Everything is CSS 3D so the top face stays live DOM.
 * Motion is driven through CSS variables on the root: --rot, --explode, --fill-0..3.
 */
export function Stack({
  layers,
  faces = {},
  width = 340,
  height = 220,
  rot = 0,
  explode = 110,
  fills,
  axis = true,
  plate = null,
  className = "",
  style,
  thickness = 4,
  labels = true,
  ghost = false,
}: StackProps) {
  const count = layers.length;
  const vars: Record<string, string | number> = {
    "--rot": rot,
    "--explode": `${explode}px`,
    "--t": `${thickness}px`,
    "--w": `${width}px`,
    "--h": `${height}px`,
  };
  layers.forEach((_, i) => {
    vars[`--fill-${i}`] = fills?.[i] ?? 1;
  });

  return (
    <div className={`iso-space relative ${className}`} style={{ width, height: height + (count - 1) * (explode + thickness) * 0.6, ...style }}>
      <div
        className="stack preserve-3d absolute left-1/2 top-1/2"
        style={{
          ...(vars as CSSProperties),
          width,
          height,
          marginLeft: -width / 2,
          marginTop: -height / 2,
          transform: "rotateX(calc(54.7deg * (1 - var(--rot)))) rotateZ(calc(-45deg * (1 - var(--rot))))",
        }}
      >
        {plate && (
          <div
            className="plate absolute preserve-3d"
            style={{
              left: -width * 0.45,
              top: -height * 0.5,
              width: width * 1.9,
              height: height * 2,
              transform: `translateZ(calc(-1 * var(--t) - 24px))`,
              border: "1px solid var(--edge)",
              background: "var(--plate)",
              opacity: "calc(1 - var(--rot))",
            }}
          >
            {plate}
          </div>
        )}
        {axis && (
          <div
            className="axis absolute left-1/2 top-1/2"
            style={{
              width: 1,
              height: (count + 1) * (explode + thickness),
              transform: "rotateX(90deg)",
              transformOrigin: "top center",
              background: "repeating-linear-gradient(to bottom, var(--orange) 0 6px, transparent 6px 12px)",
              opacity: "calc((1 - var(--rot)) * 0.9)",
            }}
          />
        )}
        {[...layers].reverse().map((layer, ri) => {
          // bottom layer first in the DOM; z from bottom
          const b = ri; // 0 = data (bottom)
          const i = count - 1 - ri; // original index (0 = interface)
          const isTop = i === 0;
          const paper = isTop;
          const face = faces[layer.key];
          const fillVar = `var(--fill-${i})`;
          return (
            <div
              key={layer.key}
              className="layer absolute inset-0 preserve-3d"
              data-layer={layer.key}
              style={{
                transform: `translateZ(calc(var(--explode) * ${b} + var(--t) * ${b}))`,
              }}
            >
              {/* sides (thickness) */}
              {(["top", "bottom", "left", "right"] as const).map((side) => (
                <div
                  key={side}
                  aria-hidden="true"
                  className="side absolute"
                  style={{
                    background: "#141716",
                    borderLeft: side === "left" || side === "right" ? undefined : "1px solid #4a504c",
                    borderTop: side === "left" || side === "right" ? "1px solid #4a504c" : undefined,
                    opacity: `calc(${fillVar} * (1 - var(--rot) * 0.9))`,
                    ...(side === "top" && { left: 0, top: 0, width: "100%", height: "var(--t)", transform: "rotateX(90deg)", transformOrigin: "top" }),
                    ...(side === "bottom" && { left: 0, bottom: 0, width: "100%", height: "var(--t)", transform: "rotateX(-90deg)", transformOrigin: "bottom" }),
                    ...(side === "left" && { left: 0, top: 0, width: "var(--t)", height: "100%", transform: "rotateY(-90deg)", transformOrigin: "left" }),
                    ...(side === "right" && { right: 0, top: 0, width: "var(--t)", height: "100%", transform: "rotateY(90deg)", transformOrigin: "right" }),
                  }}
                />
              ))}
              {/* top face: outline always, fill clipped by --fill */}
              <div
                className="face absolute inset-0 overflow-hidden"
                style={{
                  border: ghost ? "1px dashed var(--edge)" : `1px solid ${paper ? "var(--bone)" : "var(--edge-2)"}`,
                  transform: "translateZ(var(--t))",
                  boxShadow: "0 40px 60px -30px rgba(0,0,0,0.8)",
                }}
              >
                <div
                  className="fill absolute inset-0"
                  style={{
                    background: paper ? "var(--paper)" : "linear-gradient(160deg, #2e3330 0%, #242826 60%, #202422 100%)",
                    clipPath: `inset(0 calc((1 - ${fillVar}) * 100%) 0 0)`,
                  }}
                >
                  {face ?? (
                    <div className="flex h-full flex-col gap-2 p-3">
                      {labels && (
                        <div className="t-mono" style={{ color: paper ? "var(--ink)" : "var(--bone-3)", fontSize: 10 }}>
                          {layer.label}
                        </div>
                      )}
                      {layer.parts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {layer.parts.map((p) => (
                            <span
                              key={p}
                              className="t-mono"
                              style={{
                                fontSize: 8,
                                padding: "2px 5px",
                                border: `1px solid ${paper ? "#e4dfd3" : "#4a504c"}`,
                                color: paper ? "var(--ink)" : "var(--bone-2)",
                              }}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {labels && !paper && (
                  <div className="t-mono absolute left-3 top-3" style={{ color: "var(--bone-3)", fontSize: 10, opacity: `calc(1 - ${fillVar})` }}>
                    {layer.label}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
