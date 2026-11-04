import { z } from "zod";

export const FaceRegion = {
  FOREHEAD: "forehead",
  LEFT_CHEEK: "leftCheek",
  RIGHT_CHEEK: "rightCheek",
  NOSE: "nose",
  CHIN: "chin",
  PERIORAL: "perioral",
  UNDER_EYES: "underEyes",
  T_ZONE: "tZone",
  U_ZONE: "uZone"
} as const;

export type FaceRegionId = typeof FaceRegion[keyof typeof FaceRegion];

export const RegionScoresSchema = z.record(
  z.string(),
  z.number().min(0).max(100)
);
export type RegionScores = z.infer<typeof RegionScoresSchema>;

export const QualityReportSchema = z.object({
  isSingleFace: z.boolean(),
  faceCoverageFraction: z.number().min(0).max(1),
  yawDegrees: z.number(),
  pitchDegrees: z.number(),
  rollDegrees: z.number(),
  blurScore: z.number().min(0),
  exposureValid: z.boolean(),
  lightingEvenness: z.number().min(0).max(1),
  overallScore: z.number().min(0).max(1)
});
export type QualityReport = z.infer<typeof QualityReportSchema>;

export interface AnalyzerInput {
  readonly uvTextureBuffer: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly skinMaskBuffer: Uint8Array;
  readonly pixelsPerMm: number;
  readonly qualityReport: QualityReport;
}

export const AnalysisResultSchema = z.object({
  id: z.string(),
  version: z.string(),
  overallScore: z.number().min(0).max(100),
  regionScores: RegionScoresSchema,
  confidence: z.number().min(0).max(1),
  uvMapWidth: z.number().int().positive(),
  uvMapHeight: z.number().int().positive(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export interface Analyzer<R extends AnalysisResult = AnalysisResult> {
  readonly id: string;
  readonly version: string;
  analyze(input: AnalyzerInput, signal?: AbortSignal): Promise<R>;
}
