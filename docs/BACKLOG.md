# DermaLens — Backlog (Post-v1 & Out-of-Scope Ideas)

This document captures valuable feature ideas, extensions, and suggestions that are explicitly outside the scope of the v1 release to maintain focus on delivering the core on-device promise.

---

## Post-v1 Candidates (from Roadmap Section 12)

1. **Guided Multi-Angle Capture for Full 3D Unwrap**
   - Provide visual audio/visual cues guiding the user to turn their head ±30° to capture cheeks and jawline for a seamless 360°/180° face mesh reconstruction.

2. **Skincare Routine & Ingredient Progress Insights**
   - Correlate temporal score changes (e.g. reduction in redness or blemish count) with logged product usage or active ingredients (e.g. Niacinamide, Salicylic acid).

3. **Dermatologist-Share Export**
   - Generate a clinical summary format tailored for telemedicine consultations, including UV distribution maps, lighting/confidence metadata, and test dates.

4. **Undertone & Melanin / Fitzpatrick Calibration**
   - Detailed undertone profiling (cool, neutral, warm, olive) and deeper per-skin-tone cosmetic guidance.

5. **Internationalization & Localization (i18n)**
   - Expand beyond English (D6) to Hindi and other global languages.

6. **Native Wrapper for App Stores**
   - Wrap the on-device web client using Capacitor or Tauri for distribution on Apple App Store and Google Play Store if users request a standalone app.

7. **On-Device Plain Language Summaries via Local SLM / WebLLM**
   - Explore small on-device language models (e.g., Gemma 2B via WebGPU) to generate personalized explanations, strictly conditioned on the local numerical indices with zero server roundtrips. (Subject to device RAM constraints).
