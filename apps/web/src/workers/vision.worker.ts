import {
  batchRgbaToLab,
  computeIrisScale,
  generateGeometricSkinMask,
  refineSkinMaskWithLuminance,
  RednessAnalyzer,
  PigmentationAnalyzer,
  OilinessAnalyzer,
  TextureAnalyzer,
  WrinklesAnalyzer,
  DarkCirclesAnalyzer,
  AcneAnalyzer,
  aggregateAnalysis,
  type Point2D,
  type PolygonContours,
  type AnalyzerInput,
  type AggregatedAnalysis
} from "@dermalens/analysis-core";
import * as Comlink from "comlink";

export interface ColorSpaceOutput {
  readonly labL: Float32Array;
  readonly labA: Float32Array;
  readonly labB: Float32Array;
}

// Single instances of pure analyzers
const rednessAnalyzer = new RednessAnalyzer();
const pigmentationAnalyzer = new PigmentationAnalyzer();
const oilinessAnalyzer = new OilinessAnalyzer();
const textureAnalyzer = new TextureAnalyzer();
const wrinklesAnalyzer = new WrinklesAnalyzer();
const darkCirclesAnalyzer = new DarkCirclesAnalyzer();
const acneAnalyzer = new AcneAnalyzer();

export const visionWorkerApi = {
  /**
   * Initializes worker runtime.
   */
  async init(): Promise<boolean> {
    return true;
  },

  /**
   * Converts an RGBA buffer to CIELAB space in background worker thread.
   */
  async computeColorSpace(
    rgba: Uint8ClampedArray,
    width: number,
    height: number
  ): Promise<ColorSpaceOutput> {
    const pixelCount = width * height;
    const labL = new Float32Array(pixelCount);
    const labA = new Float32Array(pixelCount);
    const labB = new Float32Array(pixelCount);

    batchRgbaToLab(rgba, pixelCount, labL, labA, labB);

    return Comlink.transfer(
      { labL, labA, labB },
      [labL.buffer, labA.buffer, labB.buffer]
    );
  },

  /**
   * Generates a skin mask with morphological eye/lip exclusions and luminance refinement.
   */
  async generateSkinMask(
    contours: PolygonContours,
    width: number,
    height: number,
    labL?: Float32Array
  ): Promise<Uint8Array> {
    const mask = generateGeometricSkinMask(contours, width, height);

    if (labL) {
      refineSkinMaskWithLuminance(mask, labL, width, height);
    }

    return Comlink.transfer(mask, [mask.buffer]);
  },

  /**
   * Computes anatomical pixels-per-mm scale factor based on iris diameter.
   */
  async computeScale(
    leftIrisP1: Point2D,
    leftIrisP2: Point2D,
    rightIrisP1?: Point2D,
    rightIrisP2?: Point2D
  ): Promise<number> {
    return computeIrisScale(leftIrisP1, leftIrisP2, rightIrisP1, rightIrisP2);
  },

  /**
   * Runs the complete suite of skin analyzers in the worker thread.
   */
  async runAllAnalyzers(input: AnalyzerInput): Promise<AggregatedAnalysis> {
    const startTime = performance.now();

    // Pre-calculate CIELAB once to share across all 7 analyzers
    const pixelCount = input.width * input.height;
    const labL = new Float32Array(pixelCount);
    const labA = new Float32Array(pixelCount);
    const labB = new Float32Array(pixelCount);
    batchRgbaToLab(input.uvTextureBuffer, pixelCount, labL, labA, labB);

    const enrichedInput: AnalyzerInput = {
      ...input,
      labL,
      labA,
      labB
    };

    const results = await Promise.all([
      rednessAnalyzer.analyze(enrichedInput),
      pigmentationAnalyzer.analyze(enrichedInput),
      oilinessAnalyzer.analyze(enrichedInput),
      textureAnalyzer.analyze(enrichedInput),
      acneAnalyzer.analyze(enrichedInput),
      wrinklesAnalyzer.analyze(enrichedInput),
      darkCirclesAnalyzer.analyze(enrichedInput)
    ]);

    const aggregated = aggregateAnalysis(results, input.qualityReport);
    const executionDurationMs = Math.round(performance.now() - startTime);

    // Attach benchmark metric
    return {
      ...aggregated,
      metadata: {
        workerDurationMs: executionDurationMs
      }
    } as AggregatedAnalysis & { metadata: { workerDurationMs: number } };
  }
};

export type VisionWorkerApi = typeof visionWorkerApi;

Comlink.expose(visionWorkerApi);
