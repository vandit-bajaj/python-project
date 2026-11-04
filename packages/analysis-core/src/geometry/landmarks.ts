import { FaceRegion, type FaceRegionId } from "../types";

/**
 * Standard MediaPipe FaceMesh 468+10 landmark index groupings.
 */
export const FACIAL_REGION_LANDMARKS: Record<FaceRegionId, readonly number[]> = {
  [FaceRegion.FOREHEAD]: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
    400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
    54, 103, 67, 109, 10
  ],
  [FaceRegion.LEFT_CHEEK]: [
    116, 123, 147, 213, 192, 214, 210, 211, 32, 208, 199, 428, 262, 431, 430, 434
  ],
  [FaceRegion.RIGHT_CHEEK]: [
    345, 352, 376, 433, 416, 434, 430, 431, 262, 428, 199, 208, 32, 211, 210, 214
  ],
  [FaceRegion.NOSE]: [
    1, 2, 98, 327, 195, 5, 4, 19, 94, 2, 168, 6, 197, 195, 5
  ],
  [FaceRegion.CHIN]: [
    152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356, 389, 251
  ],
  [FaceRegion.PERIORAL]: [
    0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61, 185, 40, 39, 37
  ],
  [FaceRegion.UNDER_EYES]: [
    111, 117, 118, 119, 120, 121, 128, 245, 340, 346, 347, 348, 349, 350, 357, 465
  ],
  [FaceRegion.T_ZONE]: [
    10, 338, 297, 332, 284, 251, 389, 356, 1, 2, 98, 327, 195, 5, 4, 19, 94, 168, 6, 197
  ],
  [FaceRegion.U_ZONE]: [
    116, 123, 147, 213, 192, 152, 377, 400, 378, 379, 345, 352, 376, 433, 416
  ]
};

// Outer face contour polygon (used for boundary mask)
export const FACE_CONTOUR_LANDMARKS: readonly number[] = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109, 10
];

// Eye contours (to exclude from skin mask)
export const LEFT_EYE_LANDMARKS: readonly number[] = [
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33
];

export const RIGHT_EYE_LANDMARKS: readonly number[] = [
  362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362
];

// Inner and outer lips (to exclude from skin mask)
export const LIPS_LANDMARKS: readonly number[] = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61
];

// Iris landmarks (468: left center, 469-472: left perimeter; 473: right center, 474-477: right perimeter)
export const LEFT_IRIS_POINTS = {
  center: 468,
  leftEdge: 469,
  rightEdge: 471
} as const;

export const RIGHT_IRIS_POINTS = {
  center: 473,
  leftEdge: 474,
  rightEdge: 476
} as const;
