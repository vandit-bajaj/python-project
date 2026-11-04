export const UI_CONSTANTS = {
  MIN_TOUCH_TARGET_PX: 44,
  MAX_MOBILE_WIDTH_PX: 480,
  REFERENCE_VIEWPORTS: {
    IPHONE: { width: 390, height: 844 },
    ANDROID: { width: 360, height: 800 }
  }
} as const;

export type ThemeMode = "light" | "dark" | "system";
