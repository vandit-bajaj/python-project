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
      title: "Interactive Heatmaps",
      description: "Visualise skin concern distributions on canonical face maps with complete privacy."
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
    subtitle: "On-device cosmetic skin profile based on your frontal capture.",
    overallScoreLabel: "Composite Skin Index",
    confidencePrefix: "Quality Confidence",
    exportPdf: "Download PDF Report",
    printReport: "Print Report",
    retake: "Take Another Scan",
    primaryConcernsHeading: "Top Focus Areas",
    heatmapHeading: "Interactive Surface Heatmap",
    heatmapInstruction: "Drag the slider to compare original photo and heatmap overlay.",
    regionsHeading: "Regional Zone Breakdown",
    qualityHeading: "Capture Quality & Environmental Verification",
    methodologyHeading: "Methodology & Limitations",
    methodologyBody: "DermaLens executes classical computer vision algorithms entirely inside your browser's Web Worker. Camera lighting variations, phone lens optics, and head tilt inherently influence optical measurements. All values are relative cosmetic indices designed for personal skincare tracking, not medical diagnoses.",
    concerns: {
      redness: {
        label: "Facial Redness",
        meaning: "Relative surface erythema and vascular flush measured via CIELAB a* elevation relative to your skin baseline.",
        care: "Consider gentle, fragrance-free barrier moisturizers, avoid harsh physical scrubs, and protect your skin daily with broad-spectrum SPF 30+.",
        whenToConsult: "If redness is sudden, painful, burning, accompanied by swelling, or persistent across days, consult a certified dermatologist."
      },
      pigmentation: {
        label: "Tone & Pigmentation",
        meaning: "Overall tone uniformity (Individual Typology Angle) and localized dark spot contrast evaluated via Difference-of-Gaussians.",
        care: "Incorporate daily broad-spectrum sun protection, antioxidant serums (like vitamin C or niacinamide), and avoid picking or scratching blemishes.",
        whenToConsult: "If you notice new, irregular, changing, bleeding, or asymmetric spots (ABCDE criteria), schedule an in-person dermatology check."
      },
      oiliness: {
        label: "Surface Shine / Sebum",
        meaning: "Specular reflection density and highlight intensity across facial zones, with clinical weighting in the T-zone.",
        care: "Use lightweight gel-based moisturizers, gentle non-stripping foaming cleansers, and oil-free daily sunscreen.",
        whenToConsult: "If excessive oil is accompanied by intense flaking, itching, or persistent scaling along eyebrows or nasolabial folds, consult a specialist."
      },
      texture: {
        label: "Texture & Pores",
        meaning: "High-frequency surface roughness and visible pore distribution evaluated at anatomical millimetre scale via iris scale normalisation.",
        care: "Gentle chemical exfoliants (like mild lactic acid or BHA) and adequate surface hydration can support smoother skin texture.",
        whenToConsult: "If texture changes include raised plaques, deep pitted scarring, or non-healing lesions, consult a dermatologist."
      },
      acne: {
        label: "Estimated Blemishes",
        meaning: "Estimated count and regional distribution of active erythematous blemishes and surface papules.",
        care: "Use non-comedogenic skincare products, spot treatments with salicylic acid or benzoyl peroxide, and maintain a consistent cleansing routine.",
        whenToConsult: "If blemishes become deep, painful, cystic, or leave scarring, professional dermatological treatments may be recommended."
      },
      wrinkles: {
        label: "Fine Lines & Creases (Beta)",
        meaning: "Directional ridge response in forehead and periorbital regions. Labeled beta due to selfie lighting and facial expression variability.",
        care: "Maintain skin hydration with hyaluronic acid and ceramide creams, wear daily UV protection, and prioritize adequate sleep.",
        whenToConsult: "For personalized anti-aging or cosmetic treatment guidance, consult a board-certified dermatologist."
      },
      darkCircles: {
        label: "Under-Eye Tone (Beta)",
        meaning: "Relative under-eye darkness and infraorbital contrast compared to adjacent cheek skin. Subject to head tilt and overhead lighting shadows.",
        care: "Hydrating under-eye creams with caffeine or peptides, cold compresses, and sun protection can help refresh the orbital appearance.",
        whenToConsult: "If under-eye discoloration is accompanied by significant unilateral swelling, pain, or vision changes, seek medical care."
      }
    }
  }
} as const;

export type AppContent = typeof APP_CONTENT;
