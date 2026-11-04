import type { QualityReport } from "../types";
import { computeLaplacianVariance } from "./blur";
import { analyzeColorCast } from "./colorCast";
import { analyzeExposure } from "./exposure";

export interface QualityGateEvaluation {
  readonly isAcceptable: boolean;
  readonly report: QualityReport;
  readonly primaryGuidance: string;
}

export interface GateOptions {
  readonly minBlurScore?: number;
  readonly facePresent?: boolean;
  readonly faceCoverageFraction?: number;
  readonly yawDegrees?: number;
  readonly pitchDegrees?: number;
  readonly rollDegrees?: number;
}

/**
 * Runs all pure quality checks against an RGBA pixel buffer and returns
 * a QualityReport with user-facing guidance.
 */
export function evaluateCaptureQuality(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  options: GateOptions = {}
): QualityGateEvaluation {
  const blurScore = computeLaplacianVariance(rgba, width, height);
  const exposure = analyzeExposure(rgba, width, height);
  const colorCast = analyzeColorCast(rgba, width, height);

  const isSingleFace = options.facePresent ?? true;
  const faceCoverageFraction = options.faceCoverageFraction ?? 0.65;
  const yawDegrees = options.yawDegrees ?? 0;
  const pitchDegrees = options.pitchDegrees ?? 0;
  const rollDegrees = options.rollDegrees ?? 0;

  const minBlur = options.minBlurScore ?? 35.0;
  const isSharp = blurScore >= minBlur;
  const isAngleAcceptable =
    Math.abs(yawDegrees) <= 20 &&
    Math.abs(pitchDegrees) <= 20 &&
    Math.abs(rollDegrees) <= 20;

  // Determine overall confidence score [0, 1]
  let confidence = 1.0;
  if (!isSharp) confidence *= 0.6;
  if (!exposure.isExposureAcceptable) confidence *= 0.7;
  if (colorCast.isColorCastSevere) confidence *= 0.8;
  if (!isAngleAcceptable) confidence *= 0.75;
  if (!isSingleFace) confidence = 0.0;

  // Derive actionable guidance message
  let primaryGuidance = "Hold still and face the camera";
  let isAcceptable = true;

  if (!isSingleFace) {
    primaryGuidance = "Center your face in the guide";
    isAcceptable = false;
  } else if (!isAngleAcceptable) {
    primaryGuidance = "Look straight at the camera";
    isAcceptable = false;
  } else if (exposure.meanLuminance < 40) {
    primaryGuidance = "Move into brighter, even lighting";
    isAcceptable = false;
  } else if (exposure.highlightClippingFraction > 0.15) {
    primaryGuidance = "Avoid direct glare or flash";
    isAcceptable = false;
  } else if (!isSharp) {
    primaryGuidance = "Hold phone steady to focus";
    isAcceptable = false;
  } else if (colorCast.isColorCastSevere) {
    primaryGuidance = "Face natural white lighting";
    isAcceptable = false;
  } else if (confidence >= 0.75) {
    primaryGuidance = "Good lighting — keep holding still";
    isAcceptable = true;
  }

  const report: QualityReport = {
    isSingleFace,
    faceCoverageFraction,
    yawDegrees,
    pitchDegrees,
    rollDegrees,
    blurScore,
    exposureValid: exposure.isExposureAcceptable,
    lightingEvenness: Math.max(0, 1 - colorCast.divergence),
    overallScore: Math.round(confidence * 100) / 100
  };

  return {
    isAcceptable,
    report,
    primaryGuidance
  };
}
