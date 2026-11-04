"use client";

import {
  ALL_FACE_REGIONS,
  computeIrisScale,
  type FaceRegionId,
  generateGeometricSkinMask,
  srgbToLab
} from "@dermalens/analysis-core";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function DebugRegionsPage() {
  const [selectedRegion, setSelectedRegion] = useState<FaceRegionId | "all">("all");
  const [showMask, setShowMask] = useState(true);
  const [sampledColor, setSampledColor] = useState<{ r: number; g: number; b: number; lab: [number, number, number] }>({
    r: 220,
    g: 175,
    b: 145,
    lab: srgbToLab(220, 175, 145)
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute scale sample
  const scaleSample = computeIrisScale({ x: 120, y: 150 }, { x: 166.8, y: 150 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);

    // Simulated synthetic facial landmarks for visualization
    const faceContour = [
      { x: w * 0.5, y: h * 0.15 },
      { x: w * 0.82, y: h * 0.35 },
      { x: w * 0.85, y: h * 0.6 },
      { x: w * 0.7, y: h * 0.85 },
      { x: w * 0.5, y: h * 0.92 },
      { x: w * 0.3, y: h * 0.85 },
      { x: w * 0.15, y: h * 0.6 },
      { x: w * 0.18, y: h * 0.35 }
    ];

    const leftEye = [
      { x: w * 0.3, y: h * 0.4 },
      { x: w * 0.42, y: h * 0.38 },
      { x: w * 0.42, y: h * 0.45 },
      { x: w * 0.3, y: h * 0.45 }
    ];

    const rightEye = [
      { x: w * 0.58, y: h * 0.38 },
      { x: w * 0.7, y: h * 0.4 },
      { x: w * 0.7, y: h * 0.45 },
      { x: w * 0.58, y: h * 0.45 }
    ];

    const lips = [
      { x: w * 0.4, y: h * 0.75 },
      { x: w * 0.6, y: h * 0.75 },
      { x: w * 0.55, y: h * 0.82 },
      { x: w * 0.45, y: h * 0.82 }
    ];

    // Render Face Contour
    ctx.beginPath();
    ctx.moveTo(faceContour[0]?.x ?? 0, faceContour[0]?.y ?? 0);
    for (const pt of faceContour) {
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.fillStyle = showMask ? "rgba(220, 175, 145, 0.4)" : "rgba(56, 189, 248, 0.15)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Render Excluded Eyes
    for (const eye of [leftEye, rightEye]) {
      ctx.beginPath();
      ctx.moveTo(eye[0]?.x ?? 0, eye[0]?.y ?? 0);
      for (const pt of eye) ctx.lineTo(pt.x, pt.y);
      ctx.closePath();
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.fill();
      ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
      ctx.stroke();
    }

    // Render Excluded Mouth
    ctx.beginPath();
    ctx.moveTo(lips[0]?.x ?? 0, lips[0]?.y ?? 0);
    for (const pt of lips) ctx.lineTo(pt.x, pt.y);
    ctx.closePath();
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fill();
    ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
    ctx.stroke();

    // Render Regions
    const drawRegionPill = (x: number, y: number, label: string, id: FaceRegionId) => {
      const isSelected = selectedRegion === "all" || selectedRegion === id;
      ctx.fillStyle = isSelected ? "rgba(14, 165, 233, 0.85)" : "rgba(100, 116, 139, 0.4)";
      ctx.fillRect(x - 30, y - 10, 60, 20);
      ctx.strokeStyle = isSelected ? "#38bdf8" : "rgba(255, 255, 255, 0.2)";
      ctx.strokeRect(x - 30, y - 10, 60, 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x, y);
    };

    drawRegionPill(w * 0.5, h * 0.25, "Forehead", "forehead");
    drawRegionPill(w * 0.25, h * 0.55, "L-Cheek", "leftCheek");
    drawRegionPill(w * 0.75, h * 0.55, "R-Cheek", "rightCheek");
    drawRegionPill(w * 0.5, h * 0.55, "Nose", "nose");
    drawRegionPill(w * 0.5, h * 0.88, "Chin", "chin");
    drawRegionPill(w * 0.5, h * 0.68, "Perioral", "perioral");
    drawRegionPill(w * 0.36, h * 0.48, "UnderEye", "underEyes");
    drawRegionPill(w * 0.64, h * 0.48, "UnderEye", "underEyes");
  }, [selectedRegion, showMask]);

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
        <h1 style={{ fontSize: "22px", fontWeight: 800 }}>Region & Geometry Engine Visualizer</h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          Visual inspection of 8 facial regions, iris scale normalisation, and CIELAB color sampler.
        </p>
      </div>

      {/* Visualizer Canvas */}
      <div style={{
        position: "relative",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        border: "1px solid var(--border-subtle)",
        alignSelf: "center"
      }}>
        <canvas
          ref={canvasRef}
          id="debug-regions-canvas"
          width={320}
          height={380}
          style={{ display: "block", width: "100%", height: "auto" }}
        />
      </div>

      {/* Controls & Metrics */}
      <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>Region Filter:</span>
          <select
            id="select-region"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as FaceRegionId | "all")}
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              fontSize: "13px"
            }}
          >
            <option value="all">All Regions</option>
            {ALL_FACE_REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>Skin Mask Overlay:</span>
          <button
            type="button"
            id="btn-toggle-mask"
            onClick={() => setShowMask(!showMask)}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-md)",
              backgroundColor: showMask ? "var(--status-good)" : "var(--bg-tertiary)",
              color: showMask ? "#fff" : "var(--text-primary)",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {showMask ? "Enabled" : "Disabled"}
          </button>
        </div>

        {/* Live Metrics Card */}
        <div style={{
          padding: "12px",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          fontSize: "13px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Iris Reference Scale:</span>
            <span style={{ fontWeight: 600 }}>{scaleSample.toFixed(2)} px/mm</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Skin Tone Sample:</span>
            <span style={{ fontWeight: 600 }}>RGB({sampledColor.r}, {sampledColor.g}, {sampledColor.b})</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>CIELAB Coordinates:</span>
            <span style={{ fontWeight: 600 }}>
              L*={sampledColor.lab[0].toFixed(1)}, a*={sampledColor.lab[1].toFixed(1)}, b*={sampledColor.lab[2].toFixed(1)}
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
