"use client"

import { memo } from "react"
import { Dithering } from "@paper-design/shaders-react"

const MemoizedDithering = memo(Dithering)

interface PixelBackgroundProps {
  /** Front color (the pixel color). Default: "#005B5B" (teal) */
  colorFront?: string
  /** Back color (transparent by default). Default: "#00000000" */
  colorBack?: string
  /** Animation speed. Default: 0.43 */
  speed?: number
  /** Shape of the animation: "wave" | "simplex" | "circle" | "square". Default: "wave" */
  shape?: "wave" | "simplex" | "circle" | "square"
  /** Dithering type: "2x2" | "4x4" | "8x8". Default: "4x4" */
  type?: "2x2" | "4x4" | "8x8"
  /** Pixel size in pixels. Default: 3 */
  pxSize?: number
  /** Scale of the pattern. Default: 1.13 */
  scale?: number
  /** Background color of the container. Default: "#000000" */
  backgroundColor?: string
  /** Additional CSS class names */
  className?: string
}

export function PixelBackground({
  colorFront = "#005B5B",
  colorBack = "#00000000",
  speed = 0.43,
  shape = "wave",
  type = "4x4",
  pxSize = 3,
  scale = 1.13,
  backgroundColor = "#000000",
  className = "",
}: PixelBackgroundProps) {
  return (
    <div 
      className={`fixed inset-0 z-0 select-none ${className}`}
      style={{
        contain: "layout style paint",
        willChange: "transform",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        backgroundColor,
      }}
    >
      <MemoizedDithering
        colorBack={colorBack}
        colorFront={colorFront}
        speed={speed}
        shape={shape}
        type={type}
        pxSize={pxSize}
        scale={scale}
        style={{
          backgroundColor,
          height: "100vh",
          width: "100%",
        }}
      />
    </div>
  )
}

export default PixelBackground
