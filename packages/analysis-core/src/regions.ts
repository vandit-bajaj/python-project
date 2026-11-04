import { FaceRegion, type FaceRegionId } from "./types";

export const ALL_FACE_REGIONS: readonly FaceRegionId[] = [
  FaceRegion.FOREHEAD,
  FaceRegion.LEFT_CHEEK,
  FaceRegion.RIGHT_CHEEK,
  FaceRegion.NOSE,
  FaceRegion.CHIN,
  FaceRegion.PERIORAL,
  FaceRegion.UNDER_EYES,
  FaceRegion.T_ZONE,
  FaceRegion.U_ZONE
];

export function createEmptyRegionScores(): Record<FaceRegionId, number> {
  return {
    [FaceRegion.FOREHEAD]: 0,
    [FaceRegion.LEFT_CHEEK]: 0,
    [FaceRegion.RIGHT_CHEEK]: 0,
    [FaceRegion.NOSE]: 0,
    [FaceRegion.CHIN]: 0,
    [FaceRegion.PERIORAL]: 0,
    [FaceRegion.UNDER_EYES]: 0,
    [FaceRegion.T_ZONE]: 0,
    [FaceRegion.U_ZONE]: 0
  };
}
