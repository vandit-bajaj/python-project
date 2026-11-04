"use client";

import { evaluateCaptureQuality, type QualityGateEvaluation } from "@dermalens/analysis-core";
import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type CapturedFrame, useScanStore } from "@/store/useScanStore";

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  onCapture: (frame: CapturedFrame) => void;
  onCancel: () => void;
}

export function CameraView({ videoRef, onCapture, onCancel }: CameraViewProps) {
  const [evaluation, setEvaluation] = useState<QualityGateEvaluation | null>(null);
  const [consecutiveGoodFrames, setConsecutiveGoodFrames] = useState(0);
  const isCapturingRef = useRef(false);

  const setQualityEvaluation = useScanStore((s) => s.setQualityEvaluation);
  const setCapturedFrame = useScanStore((s) => s.setCapturedFrame);

  // Capture frame handler
  const captureFrame = useCallback(async (currentEval: QualityGateEvaluation | null) => {
    const video = videoRef.current;
    if (!video || isCapturingRef.current) {
      return;
    }
    isCapturingRef.current = true;

    const width = video.videoWidth || video.clientWidth || 360;
    const height = video.videoHeight || video.clientHeight || 480;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw un-mirrored raw capture
    ctx.drawImage(video, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);

    const finalEval = currentEval ?? evaluateCaptureQuality(imgData.data, width, height);
    const bitmap = await createImageBitmap(canvas);

    const captured: CapturedFrame = {
      bitmap,
      width,
      height,
      source: "camera",
      qualityReport: finalEval.report
    };

    setCapturedFrame(captured);
    onCapture(captured);
  }, [videoRef, onCapture, setCapturedFrame]);

  // Quality evaluation periodic loop
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const runQualitySample = () => {
      const video = videoRef.current;
      if (video && !isCapturingRef.current) {
        // Sample downscaled buffer for fast evaluation (width: 160)
        const sampleW = 160;
        const sampleH = Math.round(((video.videoHeight || 480) / (video.videoWidth || 640)) * sampleW);

        const canvas = document.createElement("canvas");
        canvas.width = sampleW;
        canvas.height = sampleH;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          try {
            ctx.drawImage(video, 0, 0, sampleW, sampleH);
            const imgData = ctx.getImageData(0, 0, sampleW, sampleH);

            const result = evaluateCaptureQuality(imgData.data, sampleW, sampleH);
            setEvaluation(result);
            setQualityEvaluation(result);

            if (result.isAcceptable) {
              setConsecutiveGoodFrames((prev) => {
                const next = prev + 1;
                if (next >= 4) {
                  // Auto capture!
                  captureFrame(result);
                }
                return next;
              });
            } else {
              setConsecutiveGoodFrames(0);
            }
          } catch {
            // Ignore temporary frame decoding errors during startup
          }
        }
      }

      timer = setTimeout(runQualitySample, 350);
    };

    timer = setTimeout(runQualitySample, 350);
    return () => clearTimeout(timer);
  }, [videoRef, captureFrame, setQualityEvaluation]);

  const isGoodQuality = evaluation?.isAcceptable ?? false;
  const guidance = evaluation?.primaryGuidance ?? "Align face in frame";

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100dvh",
      maxHeight: "100dvh",
      backgroundColor: "#000",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between"
    }}>
      {/* Mirrored Camera Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)"
        }}
      />

      {/* SVG Face Oval Guide */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <svg
          viewBox="0 0 360 640"
          style={{ width: "100%", height: "100%", maxHeight: "100dvh" }}
          aria-hidden="true"
        >
          <defs>
            <mask id="face-oval-mask">
              <rect width="100%" height="100%" fill="white" />
              <ellipse cx="180" cy="280" rx="105" ry="145" fill="black" />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.45)"
            mask="url(#face-oval-mask)"
          />
          <ellipse
            cx="180"
            cy="280"
            rx="105"
            ry="145"
            fill="none"
            stroke={isGoodQuality ? "var(--status-good)" : "rgba(255, 255, 255, 0.8)"}
            strokeWidth={isGoodQuality ? "3.5" : "2"}
            strokeDasharray={isGoodQuality ? "none" : "6 4"}
            style={{ transition: "stroke 250ms, stroke-width 250ms" }}
          />
        </svg>
      </div>

      {/* Top Header Bar & Live Quality Pill */}
      <header style={{
        position: "relative",
        zIndex: 10,
        padding: "16px",
        paddingTop: "calc(var(--safe-top) + 16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "none",
            color: "#fff",
            borderRadius: "var(--radius-full)",
            padding: "8px 14px",
            fontSize: "14px",
            cursor: "pointer",
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center"
          }}
        >
          Cancel
        </button>

        <div
          id="guidance-pill"
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            backgroundColor: isGoodQuality ? "rgba(22, 163, 74, 0.9)" : "rgba(15, 23, 42, 0.8)",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            backdropFilter: "blur(8px)",
            border: `1px solid ${isGoodQuality ? "rgba(34, 197, 94, 0.4)" : "rgba(255, 255, 255, 0.2)"}`,
            transition: "all 200ms ease"
          }}
        >
          {guidance}
        </div>
      </header>

      {/* Bottom Shutter Controls */}
      <footer style={{
        position: "relative",
        zIndex: 10,
        padding: "24px 16px",
        paddingBottom: "calc(var(--safe-bottom) + 24px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px"
      }}>
        {consecutiveGoodFrames > 0 && consecutiveGoodFrames < 4 && (
          <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "12px", fontWeight: 600 }}>
            Capturing in {4 - consecutiveGoodFrames}...
          </div>
        )}

        <button
          type="button"
          id="btn-shutter"
          aria-label="Capture photo"
          onClick={() => captureFrame(evaluation)}
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            backgroundColor: "transparent",
            border: "4px solid #ffffff",
            padding: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: isGoodQuality ? "var(--status-good)" : "#ffffff",
            transition: "background-color 200ms"
          }} />
        </button>
      </footer>
    </div>
  );
}
