import { useEffect, useRef } from "react";

export interface HeatmapCanvasProps {
  uvMapBuffer?: Uint8Array;
  width: number;
  height: number;
  displaySize?: number;
  opacity?: number;
}

/**
 * Color-blind safe false-color heatmap rendering.
 * Uses a perceptually uniform thermal palette (slate navy -> warm amber -> vibrant coral)
 * avoiding pure red-only mappings.
 */
export function HeatmapCanvas({
  uvMapBuffer,
  width,
  height,
  displaySize = 180,
  opacity = 1.0
}: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.createImageData(width, height);
    const numPixels = width * height;

    for (let i = 0; i < numPixels; i++) {
      const val = uvMapBuffer ? uvMapBuffer[i] ?? 0 : 0;
      const idx = i * 4;

      if (val < 35) {
        // Low concern: Dark Slate Navy (neutral background)
        imgData.data[idx] = 15;
        imgData.data[idx + 1] = 23;
        imgData.data[idx + 2] = 42;
        imgData.data[idx + 3] = Math.round(180 * opacity);
      } else if (val < 135) {
        // Moderate: Warm Amber
        imgData.data[idx] = 245;
        imgData.data[idx + 1] = 158;
        imgData.data[idx + 2] = 11;
        imgData.data[idx + 3] = Math.round(220 * opacity);
      } else {
        // Elevated: Vibrant Coral/Crimson
        imgData.data[idx] = 239;
        imgData.data[idx + 1] = 68;
        imgData.data[idx + 2] = 68;
        imgData.data[idx + 3] = Math.round(245 * opacity);
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [uvMapBuffer, width, height, opacity]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        display: "block",
        width: `${displaySize}px`,
        height: `${displaySize}px`,
        imageRendering: "pixelated",
        borderRadius: "var(--radius-md)"
      }}
    />
  );
}
