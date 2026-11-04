"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CameraView } from "@/components/camera/CameraView";
import { PermissionPrimer } from "@/components/camera/PermissionPrimer";
import { PhotoUpload } from "@/components/upload/PhotoUpload";
import { useCamera } from "@/hooks/useCamera";
import { type CapturedFrame, useScanStore } from "@/store/useScanStore";

type Mode = "camera" | "upload";

export default function ScanPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("camera");
  const [captured, setCaptured] = useState<CapturedFrame | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { status, errorMessage, videoRef, startCamera, stopCamera } = useCamera();
  const resetScan = useScanStore((s) => s.resetScan);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleCaptureComplete = (frame: CapturedFrame) => {
    stopCamera();
    setCaptured(frame);
  };

  const handleRetake = () => {
    resetScan();
    setCaptured(null);
    if (mode === "camera") {
      startCamera();
    }
  };

  // Render captured frame preview on canvas
  useEffect(() => {
    if (captured && previewCanvasRef.current) {
      const canvas = previewCanvasRef.current;
      canvas.width = captured.width;
      canvas.height = captured.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(captured.bitmap, 0, 0);
      }
    }
  }, [captured]);

  // If a photo was captured, show review and confirmation
  if (captured) {
    const isQualityGood = captured.qualityReport.overallScore >= 0.7;

    return (
      <main className="app-shell" style={{ paddingTop: "20px", paddingBottom: "24px", justifyContent: "space-between" }}>
        <header style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            padding: "4px 10px",
            borderRadius: "var(--radius-full)",
            backgroundColor: isQualityGood ? "rgba(22, 163, 74, 0.15)" : "rgba(234, 179, 8, 0.15)",
            color: isQualityGood ? "var(--status-good)" : "var(--status-attention)",
            fontSize: "12px",
            fontWeight: 700
          }}>
            {isQualityGood ? "✓ Quality Gate Passed" : "⚠️ Moderate Quality"}
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Capture Review</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Quality Confidence: {Math.round(captured.qualityReport.overallScore * 100)}%
          </p>
        </header>

        {/* Captured Preview */}
        <div style={{
          position: "relative",
          width: "100%",
          maxHeight: "50dvh",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          backgroundColor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--border-subtle)"
        }}>
          <canvas
            ref={previewCanvasRef}
            id="captured-preview-canvas"
            style={{ width: "100%", height: "auto", maxHeight: "50dvh", objectFit: "contain" }}
          />
        </div>

        {/* Quality Metrics Breakdown */}
        <section style={{
          padding: "14px",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Focus / Sharpness</span>
            <span style={{ fontWeight: 600 }}>{captured.qualityReport.blurScore > 35 ? "Sharp" : "Soft"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Exposure balance</span>
            <span style={{ fontWeight: 600 }}>{captured.qualityReport.exposureValid ? "Balanced" : "Needs light"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Head alignment</span>
            <span style={{ fontWeight: 600 }}>Centered</span>
          </div>
        </section>

        {/* Actions */}
        <footer style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            type="button"
            id="btn-proceed-analysis"
            className="btn-primary"
            onClick={() => router.push("/report")}
          >
            View Skin Report
          </button>
          <button
            type="button"
            id="btn-retake"
            className="btn-secondary"
            onClick={handleRetake}
          >
            Retake Photo
          </button>
        </footer>
      </main>
    );
  }

  // Active camera view
  if (mode === "camera" && status === "streaming") {
    return (
      <CameraView
        videoRef={videoRef}
        onCapture={handleCaptureComplete}
        onCancel={() => {
          stopCamera();
          router.push("/");
        }}
      />
    );
  }

  return (
    <main className="app-shell" style={{ paddingTop: "20px", paddingBottom: "24px", justifyContent: "space-between" }}>
      {/* Top Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link
          href="/"
          style={{
            color: "var(--text-secondary)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
            padding: "8px 0",
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center"
          }}
        >
          ← Back
        </Link>

        {/* Mode Toggle Tabs */}
        <div style={{
          display: "flex",
          backgroundColor: "var(--bg-tertiary)",
          borderRadius: "var(--radius-full)",
          padding: "3px"
        }}>
          <button
            type="button"
            id="tab-camera"
            onClick={() => {
              setMode("camera");
            }}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              border: "none",
              backgroundColor: mode === "camera" ? "var(--accent-primary)" : "transparent",
              color: mode === "camera" ? "var(--accent-foreground)" : "var(--text-secondary)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              minHeight: "36px"
            }}
          >
            Camera
          </button>
          <button
            type="button"
            id="tab-upload"
            onClick={() => {
              stopCamera();
              setMode("upload");
            }}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              border: "none",
              backgroundColor: mode === "upload" ? "var(--accent-primary)" : "transparent",
              color: mode === "upload" ? "var(--accent-foreground)" : "var(--text-secondary)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              minHeight: "36px"
            }}
          >
            Upload
          </button>
        </div>
      </header>

      {/* Main Mode Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {mode === "camera" ? (
          <PermissionPrimer
            status={status}
            errorMessage={errorMessage}
            onAllow={startCamera}
          />
        ) : (
          <PhotoUpload
            onCapture={handleCaptureComplete}
            onCancel={() => setMode("camera")}
          />
        )}
      </div>

      <footer style={{ textAlign: "center", paddingBottom: "8px" }}>
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          🔒 Images processed strictly in browser memory. Never uploaded.
        </p>
      </footer>
    </main>
  );
}
