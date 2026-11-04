import { describe, expect, it } from "vitest";
import {
  ALL_FACE_REGIONS,
  AnalysisResultSchema,
  createEmptyRegionScores,
  FaceRegion,
  QualityReportSchema,
  type Analyzer,
  type AnalyzerInput,
  type AnalysisResult
} from "../src";

describe("Analysis Core: Schema & Contracts", () => {
  it("defines all 9 standard face regions", () => {
    expect(ALL_FACE_REGIONS).toHaveLength(9);
    expect(ALL_FACE_REGIONS).toContain(FaceRegion.FOREHEAD);
    expect(ALL_FACE_REGIONS).toContain(FaceRegion.T_ZONE);
    expect(ALL_FACE_REGIONS).toContain(FaceRegion.U_ZONE);
  });

  it("creates clean empty region scores", () => {
    const empty = createEmptyRegionScores();
    for (const region of ALL_FACE_REGIONS) {
      expect(empty[region]).toBe(0);
    }
  });

  it("validates quality reports with Zod schema", () => {
    const validReport = {
      isSingleFace: true,
      faceCoverageFraction: 0.65,
      yawDegrees: 2.1,
      pitchDegrees: -1.0,
      rollDegrees: 0.5,
      blurScore: 120.5,
      exposureValid: true,
      lightingEvenness: 0.88,
      overallScore: 0.92
    };

    const parsed = QualityReportSchema.safeParse(validReport);
    expect(parsed.success).toBe(true);
  });

  it("validates analyzer contract implementation", async () => {
    class StubRednessAnalyzer implements Analyzer {
      readonly id = "redness";
      readonly version = "1.0.0";

      async analyze(input: AnalyzerInput): Promise<AnalysisResult> {
        const scores = createEmptyRegionScores();
        scores[FaceRegion.FOREHEAD] = 15;
        scores[FaceRegion.LEFT_CHEEK] = 25;
        scores[FaceRegion.RIGHT_CHEEK] = 20;

        return AnalysisResultSchema.parse({
          id: this.id,
          version: this.version,
          overallScore: 20,
          regionScores: scores,
          confidence: input.qualityReport.overallScore,
          uvMapWidth: input.width,
          uvMapHeight: input.height
        });
      }
    }

    const analyzer = new StubRednessAnalyzer();
    const mockInput: AnalyzerInput = {
      uvTextureBuffer: new Uint8ClampedArray(400),
      width: 10,
      height: 10,
      skinMaskBuffer: new Uint8Array(100),
      pixelsPerMm: 4.5,
      qualityReport: {
        isSingleFace: true,
        faceCoverageFraction: 0.7,
        yawDegrees: 0,
        pitchDegrees: 0,
        rollDegrees: 0,
        blurScore: 150,
        exposureValid: true,
        lightingEvenness: 0.9,
        overallScore: 0.95
      }
    };

    const result = await analyzer.analyze(mockInput);
    expect(result.id).toBe("redness");
    expect(result.overallScore).toBe(20);
    expect(result.regionScores[FaceRegion.LEFT_CHEEK]).toBe(25);
    expect(result.confidence).toBe(0.95);
  });
});
