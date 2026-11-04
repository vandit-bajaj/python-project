"use client";

import {
  type AnalysisResult,
  type AggregatedAnalysis,
  ALL_FACE_REGIONS,
  type FaceRegionId,
  FaceRegion,
  RednessAnalyzer,
  PigmentationAnalyzer,
  OilinessAnalyzer,
  TextureAnalyzer,
  WrinklesAnalyzer,
  DarkCirclesAnalyzer,
  aggregateAnalysis,
  createEmptyRegionScores
} from "@dermalens/analysis-core";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const analyzers = [
  { id: "redness", label: "Redness", instance: new RednessAnalyzer() },
  { id: "pigmentation", label: "Pigmentation", instance: new PigmentationAnalyzer() },
  { id: "oiliness", label: "Oiliness", instance: new OilinessAnalyzer() },
  { id: "texture", label: "Texture / Pores", instance: new TextureAnalyzer() },
  { id: "wrinkles", label: "Wrinkles (Beta)", instance: new WrinklesAnalyzer() },
  { id: "darkCircles", label: "Dark Circles (Beta)", instance: new DarkCirclesAnalyzer() }
];

export default function DebugAnalyzersPage() {
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string>("redness");
  const [analysisReport, setAnalysisReport] = useState<AggregatedAnalysis | null>(null);
  const [activeResult, setActiveResult] = useState<AnalysisResult | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Generate synthetic UV face texture
    const width = 128;
    const height = 128;
    const numPixels = width * height;
    const uvTextureBuffer = new Uint8ClampedArray(numPixels * 4);
    const skinMaskBuffer = new Uint8Array(numPixels);
    skinMaskBuffer.fill(1);

    // Baseline skin tone
    for (let i = 0; i < numPixels; i++) {
      const idx = i * 4;
      uvTextureBuffer[idx] = 225;     // R
      uvTextureBuffer[idx + 1] = 175; // G
      uvTextureBuffer[idx + 2] = 150; // B
      uvTextureBuffer[idx + 3] = 255; // A
    }

    // Partition mock regions
    const regionMasks: Record<FaceRegionId, Uint8Array> = {
      [FaceRegion.FOREHEAD]: new Uint8Array(numPixels),
      [FaceRegion.LEFT_CHEEK]: new Uint8Array(numPixels),
      [FaceRegion.RIGHT_CHEEK]: new Uint8Array(numPixels),
      [FaceRegion.NOSE]: new Uint8Array(numPixels),
      [FaceRegion.CHIN]: new Uint8Array(numPixels),
      [FaceRegion.PERIORAL]: new Uint8Array(numPixels),
      [FaceRegion.UNDER_EYES]: new Uint8Array(numPixels),
      [FaceRegion.T_ZONE]: new Uint8Array(numPixels),
      [FaceRegion.U_ZONE]: new Uint8Array(numPixels)
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (y < 40) {
          regionMasks[FaceRegion.FOREHEAD][idx] = 1;
          regionMasks[FaceRegion.T_ZONE][idx] = 1;
          // Add some horizontal forehead lines
          if (y % 12 === 0) {
            uvTextureBuffer[idx * 4] = 160;
            uvTextureBuffer[idx * 4 + 1] = 120;
            uvTextureBuffer[idx * 4 + 2] = 100;
          }
        } else if (y >= 40 && y < 85) {
          if (x < 45) {
            regionMasks[FaceRegion.LEFT_CHEEK][idx] = 1;
            regionMasks[FaceRegion.U_ZONE][idx] = 1;
            // Inject redness in left cheek
            uvTextureBuffer[idx * 4] = Math.min(255, (uvTextureBuffer[idx * 4] ?? 0) + 35);
          } else if (x > 83) {
            regionMasks[FaceRegion.RIGHT_CHEEK][idx] = 1;
            regionMasks[FaceRegion.U_ZONE][idx] = 1;
            // Inject small dark spots in right cheek
            if (x % 14 === 0 && y % 14 === 0) {
              uvTextureBuffer[idx * 4] = 90;
              uvTextureBuffer[idx * 4 + 1] = 60;
              uvTextureBuffer[idx * 4 + 2] = 50;
            }
          } else {
            regionMasks[FaceRegion.NOSE][idx] = 1;
            regionMasks[FaceRegion.T_ZONE][idx] = 1;
            // High shine on nose tip
            if (y > 60 && y < 75 && x > 56 && x < 72) {
              uvTextureBuffer[idx * 4] = 248;
              uvTextureBuffer[idx * 4 + 1] = 248;
              uvTextureBuffer[idx * 4 + 2] = 248;
            }
          }
          if (y < 55 && (x < 45 || x > 83)) {
            regionMasks[FaceRegion.UNDER_EYES][idx] = 1;
            // Under-eye darkening
            uvTextureBuffer[idx * 4] = 150;
            uvTextureBuffer[idx * 4 + 1] = 120;
            uvTextureBuffer[idx * 4 + 2] = 135;
          }
        } else {
          regionMasks[FaceRegion.CHIN][idx] = 1;
          regionMasks[FaceRegion.T_ZONE][idx] = 1;
          regionMasks[FaceRegion.U_ZONE][idx] = 1;
        }
      }
    }

    const input = {
      uvTextureBuffer,
      width,
      height,
      skinMaskBuffer,
      regionMasks,
      pixelsPerMm: 4.5,
      qualityReport: {
        isSingleFace: true,
        faceCoverageFraction: 0.72,
        yawDegrees: 1.2,
        pitchDegrees: -0.8,
        rollDegrees: 0.2,
        blurScore: 195,
        exposureValid: true,
        lightingEvenness: 0.92,
        overallScore: 0.94
      }
    };

    const t0 = performance.now();
    Promise.all(analyzers.map((a) => a.instance.analyze(input))).then((results) => {
      const duration = Math.round(performance.now() - t0);
      setExecutionTimeMs(duration);
      const agg = aggregateAnalysis(results, input.qualityReport);
      setAnalysisReport(agg);

      const current = results.find((r) => r.id === selectedAnalyzerId) ?? results[0];
      if (current) {
        setActiveResult(current);
        renderHeatmap(current, width, height);
      }
    });
  }, [selectedAnalyzerId]);

  const renderHeatmap = (res: AnalysisResult, width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.createImageData(width, height);
    const buf = res.uvMapBuffer;

    for (let i = 0; i < width * height; i++) {
      const val = buf ? buf[i] ?? 0 : 0;
      const idx = i * 4;
      // Thermal / heat color map: low = dark slate, med = amber, high = crimson
      if (val < 40) {
        imgData.data[idx] = 15;
        imgData.data[idx + 1] = 23;
        imgData.data[idx + 2] = 42;
      } else if (val < 140) {
        imgData.data[idx] = 245;
        imgData.data[idx + 1] = 158;
        imgData.data[idx + 2] = 11;
      } else {
        imgData.data[idx] = 239;
        imgData.data[idx + 1] = 68;
        imgData.data[idx + 2] = 68;
      }
      imgData.data[idx + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
  };

  return (
    <main className="app-shell" style={{ paddingTop: "20px", paddingBottom: "24px", gap: "16px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}>
          ← Home
        </Link>
        <span style={{ fontSize: "12px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", backgroundColor: "var(--bg-tertiary)" }}>
          DEV ONLY
        </span>
      </header>

      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 800 }}>Skin Analyzers v1 Visualizer</h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          Inspect classical CV skin analyzers, canonical UV heatmaps, and worker latency.
        </p>
      </div>

      {/* Analyzer Selector Chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {analyzers.map((a) => (
          <button
            key={a.id}
            id={`btn-analyzer-${a.id}`}
            type="button"
            onClick={() => setSelectedAnalyzerId(a.id)}
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-md)",
              backgroundColor: selectedAnalyzerId === a.id ? "var(--accent-primary)" : "var(--bg-secondary)",
              color: selectedAnalyzerId === a.id ? "#ffffff" : "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Heatmap & Active Analyzer Card */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px",
        borderRadius: "var(--radius-lg)",
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, textTransform: "capitalize" }}>
              {activeResult?.id ?? selectedAnalyzerId}
            </h2>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Version {activeResult?.version ?? "1.0.0"}
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {activeResult?.isBeta && (
              <span
                id="badge-beta"
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: "var(--status-warn)",
                  color: "#000"
                }}
              >
                BETA
              </span>
            )}
            <div style={{
              fontSize: "18px",
              fontWeight: 800,
              color: (activeResult?.overallScore ?? 0) > 40 ? "var(--status-warn)" : "var(--status-good)"
            }}>
              {activeResult?.overallScore ?? 0}
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 400 }}> / 100</span>
            </div>
          </div>
        </div>

        {/* Heatmap Canvas */}
        <div style={{
          position: "relative",
          alignSelf: "center",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          border: "1px solid var(--border-subtle)"
        }}>
          <canvas
            ref={canvasRef}
            id="heatmap-canvas"
            width={128}
            height={128}
            style={{ display: "block", width: "160px", height: "160px", imageRendering: "pixelated" }}
          />
        </div>

        {/* Confidence & Region breakdown */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
          <span style={{ color: "var(--text-secondary)" }}>Confidence:</span>
          <span style={{ fontWeight: 600 }}>{((activeResult?.confidence ?? 0) * 100).toFixed(0)}%</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
          <span style={{ color: "var(--text-secondary)" }}>Benchmark Latency:</span>
          <span style={{ fontWeight: 600 }}>{executionTimeMs} ms</span>
        </div>

        {/* Regional Scores */}
        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
            REGIONAL SCORES
          </span>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px",
            fontSize: "12px"
          }}>
            {ALL_FACE_REGIONS.map((reg) => (
              <div
                key={reg}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  backgroundColor: "var(--bg-tertiary)"
                }}
              >
                <span style={{ textTransform: "capitalize", color: "var(--text-secondary)" }}>{reg}</span>
                <span style={{ fontWeight: 600 }}>{activeResult?.regionScores[reg] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aggregate Report Summary */}
      {analysisReport && (
        <section style={{
          padding: "16px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700 }}>Overall Composite Analysis</h3>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Composite Skin Score:</span>
            <span style={{ fontWeight: 700 }}>{analysisReport.overallScore} / 100</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Overall Confidence:</span>
            <span style={{ fontWeight: 600 }}>{(analysisReport.overallConfidence * 100).toFixed(0)}%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Primary Concerns:</span>
            <span style={{ fontWeight: 600, textTransform: "capitalize" }}>
              {analysisReport.primaryConcerns.join(", ")}
            </span>
          </div>
        </section>
      )}
    </main>
  );
}
