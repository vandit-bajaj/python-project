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
  AcneAnalyzer,
  WrinklesAnalyzer,
  DarkCirclesAnalyzer,
  aggregateAnalysis
} from "@dermalens/analysis-core";
import { HeatmapCanvas, RegionPill, ScoreRing } from "@dermalens/ui";
import Link from "next/link";
import { useEffect, useState } from "react";
import { APP_CONTENT } from "@/content";
import { downloadReportPdf, printReport, type ReportPdfData } from "@/utils/pdf";

export default function ReportPage() {
  const [analysisReport, setAnalysisReport] = useState<AggregatedAnalysis | null>(null);
  const [selectedConcernId, setSelectedConcernId] = useState<string>("redness");
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.85);
  const [expandedConcernId, setExpandedConcernId] = useState<string | null>("redness");
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  useEffect(() => {
    // Generate synthetic UV face texture
    const width = 128;
    const height = 128;
    const numPixels = width * height;
    const uvTextureBuffer = new Uint8ClampedArray(numPixels * 4);
    const skinMaskBuffer = new Uint8Array(numPixels);
    skinMaskBuffer.fill(1);

    for (let i = 0; i < numPixels; i++) {
      const idx = i * 4;
      uvTextureBuffer[idx] = 220;     // R
      uvTextureBuffer[idx + 1] = 170; // G
      uvTextureBuffer[idx + 2] = 145; // B
      uvTextureBuffer[idx + 3] = 255; // A
    }

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
          if (y % 12 === 0) {
            uvTextureBuffer[idx * 4] = 160;
            uvTextureBuffer[idx * 4 + 1] = 120;
            uvTextureBuffer[idx * 4 + 2] = 100;
          }
        } else if (y >= 40 && y < 85) {
          if (x < 45) {
            regionMasks[FaceRegion.LEFT_CHEEK][idx] = 1;
            regionMasks[FaceRegion.U_ZONE][idx] = 1;
            uvTextureBuffer[idx * 4] = Math.min(255, (uvTextureBuffer[idx * 4] ?? 0) + 38);
          } else if (x > 83) {
            regionMasks[FaceRegion.RIGHT_CHEEK][idx] = 1;
            regionMasks[FaceRegion.U_ZONE][idx] = 1;
            if (x % 14 === 0 && y % 14 === 0) {
              uvTextureBuffer[idx * 4] = 90;
              uvTextureBuffer[idx * 4 + 1] = 60;
              uvTextureBuffer[idx * 4 + 2] = 50;
            }
          } else {
            regionMasks[FaceRegion.NOSE][idx] = 1;
            regionMasks[FaceRegion.T_ZONE][idx] = 1;
            if (y > 60 && y < 75 && x > 56 && x < 72) {
              uvTextureBuffer[idx * 4] = 248;
              uvTextureBuffer[idx * 4 + 1] = 248;
              uvTextureBuffer[idx * 4 + 2] = 248;
            }
          }
          if (y < 55 && (x < 45 || x > 83)) {
            regionMasks[FaceRegion.UNDER_EYES][idx] = 1;
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

    // Add a few blemish spots
    for (const spot of [{ x: 26, y: 62 }, { x: 64, y: 96 }]) {
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= 3) {
            const pIdx = ((spot.y + dy) * width + (spot.x + dx)) * 4;
            uvTextureBuffer[pIdx] = Math.min(255, (uvTextureBuffer[pIdx] ?? 0) + 55);
            uvTextureBuffer[pIdx + 1] = Math.max(0, (uvTextureBuffer[pIdx + 1] ?? 0) - 20);
            uvTextureBuffer[pIdx + 2] = Math.max(0, (uvTextureBuffer[pIdx + 2] ?? 0) - 20);
          }
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
        faceCoverageFraction: 0.74,
        yawDegrees: 1.0,
        pitchDegrees: -0.5,
        rollDegrees: 0.2,
        blurScore: 195,
        exposureValid: true,
        lightingEvenness: 0.94,
        overallScore: 0.95
      }
    };

    const analyzers = [
      new RednessAnalyzer(),
      new PigmentationAnalyzer(),
      new OilinessAnalyzer(),
      new TextureAnalyzer(),
      new AcneAnalyzer(),
      new WrinklesAnalyzer(),
      new DarkCirclesAnalyzer()
    ];

    Promise.all(analyzers.map((a) => a.analyze(input))).then((results) => {
      const agg = aggregateAnalysis(results, input.qualityReport);
      setAnalysisReport(agg);
    });
  }, []);

  const activeConcern = analysisReport?.results.find((r) => r.id === selectedConcernId);

  const getSeverityBadge = (score: number) => {
    if (score <= 20) return { label: "Low", color: "var(--status-good)" };
    if (score <= 45) return { label: "Moderate", color: "var(--status-attention)" };
    return { label: "Elevated", color: "var(--status-alert)" };
  };

  const handleDownloadPdf = () => {
    if (!analysisReport) return;
    setIsPdfGenerating(true);

    const pdfData: ReportPdfData = {
      overallScore: analysisReport.overallScore,
      overallConfidence: Math.round(analysisReport.overallConfidence * 100),
      primaryConcerns: analysisReport.primaryConcerns.map((id) => {
        const c = APP_CONTENT.report.concerns[id as keyof typeof APP_CONTENT.report.concerns];
        return c ? c.label : id;
      }),
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      concerns: analysisReport.results.map((r) => {
        const c = APP_CONTENT.report.concerns[r.id as keyof typeof APP_CONTENT.report.concerns];
        const severity = getSeverityBadge(r.overallScore);
        return {
          id: r.id,
          label: c ? c.label : r.id,
          score: r.overallScore,
          severity: severity.label
        };
      }),
      qualityMetrics: {
        lightingEvenness: 0.94,
        blurScore: 195
      }
    };

    try {
      downloadReportPdf(pdfData);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  return (
    <main
      className="app-shell"
      style={{
        paddingTop: "20px",
        paddingBottom: "40px",
        gap: "24px"
      }}
    >
      {/* Top Header Navigation */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link
          href="/scan"
          id="btn-nav-scan"
          style={{
            color: "var(--accent-primary)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          ← {APP_CONTENT.report.retake}
        </Link>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 8px",
          borderRadius: "var(--radius-full)",
          backgroundColor: "var(--accent-muted)",
          color: "var(--accent-foreground)",
          fontSize: "11px",
          fontWeight: 600
        }}>
          <span>🔒</span>
          <span>100% On-Device</span>
        </div>
      </header>

      {/* Story Section 1: Hero Composite Index */}
      <section style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "12px",
        padding: "20px 16px",
        borderRadius: "var(--radius-lg)",
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)"
      }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          {APP_CONTENT.report.title}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "340px", lineHeight: 1.4 }}>
          {APP_CONTENT.report.subtitle}
        </p>

        <div style={{ marginTop: "8px", marginBottom: "4px" }}>
          <ScoreRing
            score={analysisReport?.overallScore ?? 0}
            size={110}
            strokeWidth={10}
            label={APP_CONTENT.report.overallScoreLabel}
          />
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center", fontSize: "12px" }}>
          <div>
            <span style={{ color: "var(--text-secondary)" }}>{APP_CONTENT.report.confidencePrefix}: </span>
            <span style={{ fontWeight: 700, color: "var(--status-good)" }}>
              {Math.round((analysisReport?.overallConfidence ?? 0.9) * 100)}%
            </span>
          </div>
          <span style={{ color: "var(--border-strong)" }}>•</span>
          <div>
            <span style={{ color: "var(--text-secondary)" }}>Rating: </span>
            <span style={{ fontWeight: 700 }}>Relative Index</span>
          </div>
        </div>

        {/* Top Focus Areas */}
        {analysisReport && analysisReport.primaryConcerns.length > 0 && (
          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              {APP_CONTENT.report.primaryConcernsHeading}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px" }}>
              {analysisReport.primaryConcerns.map((id) => {
                const c = APP_CONTENT.report.concerns[id as keyof typeof APP_CONTENT.report.concerns];
                return (
                  <span
                    key={id}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-full)",
                      backgroundColor: "var(--bg-tertiary)",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text-primary)"
                    }}
                  >
                    {c ? c.label : id}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Story Section 2: Interactive Heatmap Viewer */}
      <section style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        padding: "16px",
        borderRadius: "var(--radius-lg)",
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)"
      }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700 }}>
            {APP_CONTENT.report.heatmapHeading}
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            {APP_CONTENT.report.heatmapInstruction}
          </p>
        </div>

        {/* Concern selector chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {analysisReport?.results.map((r) => {
            const isSelected = selectedConcernId === r.id;
            const concernCopy = APP_CONTENT.report.concerns[r.id as keyof typeof APP_CONTENT.report.concerns];
            const label = concernCopy ? concernCopy.label.replace(" (Beta)", "") : r.id;

            return (
              <button
                key={r.id}
                id={`btn-concern-${r.id}`}
                type="button"
                onClick={() => setSelectedConcernId(r.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: isSelected ? "var(--accent-primary)" : "var(--bg-tertiary)",
                  color: isSelected ? "var(--accent-foreground)" : "var(--text-primary)",
                  border: "1px solid",
                  borderColor: isSelected ? "var(--accent-primary)" : "var(--border-subtle)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Heatmap Viewer with Opacity Slider */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <div
            id="heatmap-container"
            style={{
              position: "relative",
              width: "190px",
              height: "190px",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "#0f172a"
            }}
          >
            <HeatmapCanvas
              uvMapBuffer={activeConcern?.uvMapBuffer}
              width={activeConcern?.uvMapWidth ?? 128}
              height={activeConcern?.uvMapHeight ?? 128}
              displaySize={190}
              opacity={overlayOpacity}
            />
          </div>

          {/* Opacity slider */}
          <div style={{ width: "100%", maxWidth: "260px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)" }}>
              <span>Base Photo</span>
              <span>Heatmap Overlay ({Math.round(overlayOpacity * 100)}%)</span>
            </div>
            <input
              id="slider-opacity"
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(Number.parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent-primary)", cursor: "pointer" }}
              aria-label="Heatmap opacity slider"
            />
          </div>
        </div>
      </section>

      {/* Story Section 3: Concern Breakdown Cards */}
      <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Cosmetic Concern Details</h2>

        {analysisReport?.results.map((r) => {
          const isExpanded = expandedConcernId === r.id;
          const concernCopy = APP_CONTENT.report.concerns[r.id as keyof typeof APP_CONTENT.report.concerns];
          const severity = getSeverityBadge(r.overallScore);

          return (
            <div
              key={r.id}
              id={`card-concern-${r.id}`}
              style={{
                borderRadius: "var(--radius-lg)",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                overflow: "hidden",
                transition: "border-color var(--transition-fast)"
              }}
            >
              {/* Card Header Accordion Trigger */}
              <button
                type="button"
                id={`trigger-concern-${r.id}`}
                onClick={() => setExpandedConcernId(isExpanded ? null : r.id)}
                style={{
                  width: "100%",
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {concernCopy ? concernCopy.label : r.id}
                    </h3>
                    {r.isBeta && (
                      <span
                        id={`badge-beta-${r.id}`}
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "4px",
                          backgroundColor: "var(--status-attention)",
                          color: "#000"
                        }}
                      >
                        BETA
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "12px", color: severity.color, fontWeight: 600 }}>
                    {severity.label} Index ({r.overallScore}/100)
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <ScoreRing score={r.overallScore} size={44} strokeWidth={5} animate={false} />
                  <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {/* Expanded Card Body */}
              {isExpanded && (
                <div style={{
                  padding: "0 16px 16px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  fontSize: "13px",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "12px"
                }}>
                  {/* Meaning */}
                  <div>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>What it means: </span>
                    <span style={{ color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      {concernCopy?.meaning}
                    </span>
                  </div>

                  {/* General Cosmetic Care Guidance */}
                  <div style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-tertiary)",
                    lineHeight: 1.4
                  }}>
                    <span style={{ fontWeight: 700, color: "var(--accent-primary)", display: "block", marginBottom: "2px" }}>
                      💡 General Care Guidance:
                    </span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {concernCopy?.care}
                    </span>
                  </div>

                  {/* When to Consult Dermatologist */}
                  <div style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "rgba(220, 38, 38, 0.08)",
                    borderLeft: "3px solid var(--status-alert)",
                    lineHeight: 1.4
                  }}>
                    <span style={{ fontWeight: 700, color: "var(--status-alert)", display: "block", marginBottom: "2px" }}>
                      ⚕️ When to consult a dermatologist:
                    </span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {concernCopy?.whenToConsult}
                    </span>
                  </div>

                  {/* Regional Scores Chips */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Regional Distribution
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      {ALL_FACE_REGIONS.map((reg) => (
                        <RegionPill key={reg} region={reg} score={r.regionScores[reg] ?? 0} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Story Section 4: Capture Quality & Environmental Transparency */}
      <section style={{
        padding: "16px",
        borderRadius: "var(--radius-lg)",
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        fontSize: "13px"
      }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700 }}>
          {APP_CONTENT.report.qualityHeading}
        </h3>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-secondary)" }}>Lighting Uniformity:</span>
          <span style={{ fontWeight: 600 }}>94% (Even illumination)</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-secondary)" }}>Camera Sharpness Index:</span>
          <span style={{ fontWeight: 600 }}>195 (Optimal focus)</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-secondary)" }}>Iris Reference Scale:</span>
          <span style={{ fontWeight: 600 }}>4.5 px / mm</span>
        </div>
      </section>

      {/* Story Section 5: Methodology & Honest Limitations */}
      <section style={{
        padding: "16px",
        borderRadius: "var(--radius-lg)",
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        fontSize: "12px",
        lineHeight: 1.4
      }}>
        <h3 style={{ fontSize: "14px", fontWeight: 700 }}>
          {APP_CONTENT.report.methodologyHeading}
        </h3>
        <p style={{ color: "var(--text-secondary)" }}>
          {APP_CONTENT.report.methodologyBody}
        </p>
      </section>

      {/* Story Section 6: Action Buttons & PDF Export */}
      <section style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
        <button
          id="btn-download-pdf"
          type="button"
          onClick={handleDownloadPdf}
          disabled={isPdfGenerating}
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center", cursor: "pointer" }}
        >
          📄 {isPdfGenerating ? "Generating PDF..." : APP_CONTENT.report.exportPdf}
        </button>

        <button
          id="btn-print-report"
          type="button"
          onClick={printReport}
          className="btn-secondary"
          style={{ width: "100%", justifyContent: "center", cursor: "pointer" }}
        >
          🖨️ {APP_CONTENT.report.printReport}
        </button>

        <Link
          href="/scan"
          id="btn-scan-again"
          className="btn-secondary"
          style={{ width: "100%", textAlign: "center", textDecoration: "none" }}
        >
          🔄 {APP_CONTENT.report.retake}
        </Link>

        <p style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          textAlign: "center",
          lineHeight: 1.4,
          paddingTop: "12px"
        }}>
          {APP_CONTENT.common.disclaimer}
        </p>
      </section>
    </main>
  );
}
