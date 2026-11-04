export const APP_CONTENT = {
  common: {
    appName: "DermaLens",
    tagline: "On-Device Face Skin Insights",
    privacyBadge: "100% On-Device • Photos Never Leave Your Phone",
    disclaimer: "DermaLens provides cosmetic measurement indices only. It is not a medical device and does not diagnose, treat, or cure any skin condition. For medical concerns, consult a dermatologist."
  },
  landing: {
    heroTitle: "Private, honest face skin analysis.",
    heroSubtitle: "Evaluate redness, texture, pigmentation, and surface balance entirely on your device with zero cloud uploads.",
    ctaStartCamera: "Scan with Camera",
    ctaUploadPhoto: "Upload a Photo",
    howItWorksTitle: "How DermaLens measures",
    feature1: {
      title: "On-Device Processing",
      description: "Landmark tracking and vision algorithms execute directly in your browser. No server ever receives your photo."
    },
    feature2: {
      title: "Relative Cosmetic Indices",
      description: "Measurements are calibrated relative indices, not diagnostic labels, complete with capture quality confidence."
    },
    feature3: {
      title: "3D Face Heatmap",
      description: "Visualise skin concern distributions on an interactive 3D face model with complete privacy."
    }
  },
  camera: {
    permissionPrimerTitle: "Camera Access Required",
    permissionPrimerBody: "DermaLens uses your camera stream locally to detect facial landmarks and lighting quality. Your video stream is analyzed in browser memory and is never uploaded.",
    allowButton: "Enable Camera",
    deniedRecovery: "Camera access was denied. Please allow camera permissions in your browser address bar settings to continue.",
    feedbackHoldStill: "Hold still and face the light",
    feedbackTooDark: "Move into brighter, even lighting",
    feedbackMoveCloser: "Move slightly closer to frame your face",
    feedbackCenterFace: "Center your face in the guide"
  },
  report: {
    title: "Skin Analysis Report",
    confidencePrefix: "Quality Confidence",
    exportPdf: "Export PDF",
    retake: "Take Another Scan"
  }
} as const;
