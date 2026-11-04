"use client";

import { evaluateCaptureQuality } from "@dermalens/analysis-core";
import { type ChangeEvent, useRef, useState } from "react";
import { type CapturedFrame, useScanStore } from "@/store/useScanStore";

interface PhotoUploadProps {
  onCapture: (frame: CapturedFrame) => void;
  onCancel: () => void;
}

export function PhotoUpload({ onCapture, onCancel }: PhotoUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const setCapturedFrame = useScanStore((s) => s.setCapturedFrame);
  const setQualityEvaluation = useScanStore((s) => s.setQualityEvaluation);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorFeedback(null);

    try {
      // Decode image safely
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image file."));
        img.src = objectUrl;
      });

      URL.revokeObjectURL(objectUrl);

      // Downscale long edge to max 1920px
      const MAX_LONG_EDGE = 1920;
      let targetW = img.naturalWidth;
      let targetH = img.naturalHeight;

      if (targetW > MAX_LONG_EDGE || targetH > MAX_LONG_EDGE) {
        if (targetW > targetH) {
          targetH = Math.round((targetH / targetW) * MAX_LONG_EDGE);
          targetW = MAX_LONG_EDGE;
        } else {
          targetW = Math.round((targetW / targetH) * MAX_LONG_EDGE);
          targetH = MAX_LONG_EDGE;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize 2D canvas context.");

      ctx.drawImage(img, 0, 0, targetW, targetH);
      const imgData = ctx.getImageData(0, 0, targetW, targetH);

      // Evaluate quality with pure gate
      const evaluation = evaluateCaptureQuality(imgData.data, targetW, targetH);
      setQualityEvaluation(evaluation);

      if (!evaluation.isAcceptable && evaluation.report.overallScore < 0.35) {
        setErrorFeedback(
          `Image quality is too low: ${evaluation.primaryGuidance}. Please select a clear, well-lit portrait photo.`
        );
        setIsProcessing(false);
        return;
      }

      const bitmap = await createImageBitmap(canvas);
      const frame: CapturedFrame = {
        bitmap,
        width: targetW,
        height: targetH,
        source: "upload",
        qualityReport: evaluation.report
      };

      setCapturedFrame(frame);
      onCapture(frame);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorFeedback(error.message || "Failed to process photo.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      padding: "24px 16px",
      gap: "20px"
    }}>
      <input
        ref={fileInputRef}
        type="file"
        id="file-photo-input"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <div style={{
        width: "72px",
        height: "72px",
        borderRadius: "var(--radius-full)",
        backgroundColor: "var(--accent-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "36px"
      }}>
        📁
      </div>

      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
          Upload a Face Photo
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "340px", lineHeight: 1.5 }}>
          Select a front-facing photo from your library. The image is processed entirely on your device and will never be uploaded.
        </p>
      </div>

      {errorFeedback && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "var(--radius-md)",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          color: "var(--status-alert)",
          fontSize: "13px",
          lineHeight: 1.4,
          maxWidth: "340px",
          border: "1px solid rgba(239, 68, 68, 0.2)"
        }}>
          {errorFeedback}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "320px", gap: "12px" }}>
        <button
          type="button"
          id="btn-choose-photo"
          className="btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          {isProcessing ? "Analyzing photo..." : "Choose Photo from Device"}
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
