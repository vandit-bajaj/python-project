import {
  type AnalysisResult,
  type QualityReport,
  type AggregatedAnalysis,
  AggregatedAnalysisSchema
} from "../types";
import { clamp, round } from "../analyzers/utils";

/**
 * Weights assigned to individual analyzers when computing the composite skin index.
 * Core tier analyzers receive standard weight (1.0), whereas Beta tier analyzers
 * have reduced weight (0.5) due to lower selfie signal-to-noise ratio.
 */
const ANALYZER_WEIGHTS: Record<string, number> = {
  redness: 1.0,
  pigmentation: 1.0,
  oiliness: 0.9,
  texture: 1.0,
  wrinkles: 0.5,
  darkCircles: 0.5
};

/**
 * Aggregates individual skin analyzer results into a single composite analysis report.
 */
export function aggregateAnalysis(
  results: readonly AnalysisResult[],
  qualityReport: QualityReport
): AggregatedAnalysis {
  let weightedScoreSum = 0;
  let totalWeight = 0;
  let confidenceSum = 0;

  for (const result of results) {
    const weight = ANALYZER_WEIGHTS[result.id] ?? 0.8;
    weightedScoreSum += result.overallScore * weight;
    totalWeight += weight;
    confidenceSum += result.confidence;
  }

  const compositeScore = totalWeight > 0 ? weightedScoreSum / totalWeight : 0;
  const meanConfidence = results.length > 0 ? confidenceSum / results.length : 0.8;

  // Composite overall confidence scales with capture quality
  const overallConfidence = Math.max(
    0.1,
    Math.min(1.0, round(meanConfidence * 0.6 + qualityReport.overallScore * 0.4, 2))
  );

  // Identify top primary concerns (sorted by severity)
  const primaryConcerns = [...results]
    .filter((r) => r.overallScore >= 15)
    .sort((a, b) => b.overallScore - a.overallScore)
    .map((r) => r.id);

  const aggregate: AggregatedAnalysis = {
    overallScore: clamp(round(compositeScore)),
    overallConfidence,
    primaryConcerns: primaryConcerns.length > 0 ? primaryConcerns : (results[0] ? [results[0].id] : []),
    results: [...results],
    timestamp: Date.now()
  };

  return AggregatedAnalysisSchema.parse(aggregate);
}
