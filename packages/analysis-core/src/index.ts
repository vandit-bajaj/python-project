export {
  FaceRegion,
  type FaceRegionId,
  RegionScoresSchema,
  type RegionScores,
  QualityReportSchema,
  type QualityReport,
  AnalysisResultSchema,
  type AnalysisResult,
  type AnalyzerInput,
  type Analyzer
} from "./types";

export {
  ALL_FACE_REGIONS,
  createEmptyRegionScores
} from "./regions";

export {
  computeLaplacianVariance
} from "./quality/blur";

export {
  analyzeExposure,
  type ExposureMetrics
} from "./quality/exposure";

export {
  analyzeColorCast,
  type ColorCastMetrics
} from "./quality/colorCast";

export {
  evaluateCaptureQuality,
  type QualityGateEvaluation,
  type GateOptions
} from "./quality/gate";

export {
  srgbToLinear,
  linearToSrgb,
  srgbToLab,
  batchRgbaToLab
} from "./geometry/color";

export {
  STANDARD_IRIS_DIAMETER_MM,
  computeIrisScale,
  type Point2D
} from "./geometry/scale";

export {
  FACIAL_REGION_LANDMARKS,
  FACE_CONTOUR_LANDMARKS,
  LEFT_EYE_LANDMARKS,
  RIGHT_EYE_LANDMARKS,
  LIPS_LANDMARKS,
  LEFT_IRIS_POINTS,
  RIGHT_IRIS_POINTS
} from "./geometry/landmarks";

export {
  isPointInPolygon,
  generateGeometricSkinMask,
  refineSkinMaskWithLuminance,
  type PolygonContours
} from "./geometry/mask";

export {
  type UVCoordinate,
  type CanonicalUVTexture
} from "./geometry/unwrap";
