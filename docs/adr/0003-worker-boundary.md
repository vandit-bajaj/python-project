# ADR 0003: Web Worker Boundary for Vision Pipeline via Comlink

- Status: accepted
- Date: 2026-11-04

## Context
Running 478-point MediaPipe face landmarker detection, morphological image segmentation, and intensive pixel/frequency-domain analyzers (e.g. Laplacian, Gabor, CIELAB conversions) on the browser main thread causes severe UI stuttering, frame drops, and unresponsive interactions on mobile devices.

## Decision
We enforce a strict boundary between the UI thread and the vision analysis pipeline using a dedicated Web Worker managed via **Comlink**:

1. **Main thread responsibilities**:
   - Camera video stream acquisition via `getUserMedia`.
   - UI state management, rendering, bottom sheets, animations, and 3D WebGL rendering.
   - User input handling and accessibility.
2. **Worker thread responsibilities**:
   - MediaPipe Face Landmarker model loading and execution.
   - ImageBitmap / OffscreenCanvas manipulation and skin mask generation.
   - Pure UV unwrap and CIELAB color space conversions.
   - Execution of all concern analyzers and scoring aggregations.
3. **Data transfer**:
   - Frames and results pass between main thread and worker as transferable objects (`ImageBitmap`, `ArrayBuffer`) to eliminate cloning overhead.
   - All messages and returned result objects are validated with Zod at the boundary.

## Alternatives Considered
- **Direct main thread execution**: Running everything on the main thread. Rejected due to guaranteed main-thread lockups and jank during intensive CV calculation on mid-range phones.
- **Raw Web Worker postMessage handlers**: Manual event listeners and switch-case message routers. Rejected in favor of typed Comlink RPC for compile-time type safety and cleaner asynchronous APIs.

## Consequences
- **Positive**: Main thread remains at 60fps for UI interactions and 3D rendering; analysis does not freeze camera feedback.
- **Negative**: Requires handling OffscreenCanvas support nuances and memory lifecycle for worker transferables.
