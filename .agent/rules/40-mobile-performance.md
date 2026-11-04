# Mobile performance

Proposed starting budgets. Validate in Phase 0 on the reference devices in `docs/devices.md`.

- Landing LCP <= 2.5 s on mid-range Android over throttled 4G. Initial JS <= 150 KB gzip.
- MediaPipe, three.js and the PDF library load only after a user action.
- Live guidance >= 15 FPS. Still analysis <= 3-4 s. 3D >= 30 FPS. INP <= 200 ms. CLS ~ 0.
- Camera: stop all tracks on unmount, on `visibilitychange` (hidden) and on route change.
- Release ImageBitmaps and canvases promptly. Assume iOS kills memory-heavy tabs.
- 3D: cap DPR, frame-on-demand, dispose resources, handle WebGL context loss, static fallback.
- Layout: `100dvh`, safe-area insets, touch targets >= 44 px, nothing hover-only.
