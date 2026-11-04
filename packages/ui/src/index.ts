export const UI_CONSTANTS = {
  MIN_TOUCH_TARGET_PX: 44,
  MAX_MOBILE_WIDTH_PX: 480,
  REFERENCE_VIEWPORTS: {
    IPHONE: { width: 390, height: 844 },
    ANDROID: { width: 360, height: 800 }
  }
} as const;

export type ThemeMode = "light" | "dark" | "system";

export { ScoreRing, type ScoreRingProps } from "./components/ScoreRing";
export { RegionPill, type RegionPillProps } from "./components/RegionPill";
export { HeatmapCanvas, type HeatmapCanvasProps } from "./components/HeatmapCanvas";

export {
  Face3DViewer,
  Face3DFallback,
  type Face3DViewerProps
} from "./components/Face3DViewer";
