import type { QualityGateEvaluation, QualityReport } from "@dermalens/analysis-core";
import { create } from "zustand";

export interface CapturedFrame {
  readonly bitmap: ImageBitmap;
  readonly width: number;
  readonly height: number;
  readonly source: "camera" | "upload";
  readonly qualityReport: QualityReport;
}

interface ScanState {
  capturedFrame: CapturedFrame | null;
  qualityEvaluation: QualityGateEvaluation | null;
  isProcessing: boolean;
  setCapturedFrame: (frame: CapturedFrame | null) => void;
  setQualityEvaluation: (evaluation: QualityGateEvaluation | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  resetScan: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  capturedFrame: null,
  qualityEvaluation: null,
  isProcessing: false,
  setCapturedFrame: (capturedFrame) => set({ capturedFrame }),
  setQualityEvaluation: (qualityEvaluation) => set({ qualityEvaluation }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  resetScan: () => {
    set((state) => {
      // Ensure memory is released
      if (state.capturedFrame?.bitmap) {
        state.capturedFrame.bitmap.close();
      }
      return {
        capturedFrame: null,
        qualityEvaluation: null,
        isProcessing: false
      };
    });
  }
}));
