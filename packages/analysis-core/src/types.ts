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
  readonly regionMasks?: Partial<Record<FaceRegionId, Uint8Array>>;
  readonly pixelsPerMm: number;
  readonly qualityReport: QualityReport;
  readonly labL?: Float32Array;
  readonly labA?: Float32Array;
  readonly labB?: Float32Array;
}

export const AnalysisResultSchema = z.object({
  id: z.string(),
  version: z.string(),
  overallScore: z.number().min(0).max(100),
  regionScores: RegionScoresSchema,
  confidence: z.number().min(0).max(1),
  uvMapWidth: z.number().int().positive(),
  uvMapHeight: z.number().int().positive(),
  uvMapBuffer: z.custom<Uint8Array>((val) => val instanceof Uint8Array).optional(),
  isBeta: z.boolean().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const AggregatedAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  overallConfidence: z.number().min(0).max(1),
  primaryConcerns: z.array(z.string()),
  results: z.array(AnalysisResultSchema),
  timestamp: z.number()
});
export type AggregatedAnalysis = z.infer<typeof AggregatedAnalysisSchema>;

export interface Analyzer<R extends AnalysisResult = AnalysisResult> {
  readonly id: string;
  readonly version: string;
  analyze(input: AnalyzerInput, signal?: AbortSignal): Promise<R>;
}
