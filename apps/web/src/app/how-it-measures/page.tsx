import Link from "next/link";
import { APP_CONTENT } from "@/content";

export const metadata = {
  title: "How DermaLens Measures — Scientific Transparency & Limitations",
  description: "An honest, technical explanation of DermaLens on-device computer vision algorithms, physical iris scale calibration, and limitations."
};

export default function HowItMeasuresPage() {
  return (
    <main
      id="main-content"
      className="mobile-container"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        padding: "16px",
        minHeight: "100dvh"
      }}
    >
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link
          href="/"
          id="link-home-back"
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          ← Home
        </Link>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--accent-muted)",
            color: "var(--accent-foreground)"
          }}
        >
          🔒 On-Device Science
        </span>
      </header>

      {/* Hero */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          {APP_CONTENT.transparency.howItMeasuresTitle}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
          {APP_CONTENT.transparency.howItMeasuresSubtitle}
        </p>
      </div>

      {/* Principle 1: 100% In-Browser Computation */}
      <section
        style={{
          padding: "16px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
          <span>⚡</span> 1. In-Browser Execution Boundary
        </h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          DermaLens does not have a backend server. Landmark detection, canonical UV mapping, and computer vision routines run entirely on your phone inside an isolated <strong>Web Worker</strong> thread. No image buffers, raw pixels, or biometric encodings are ever serialized over a network.
        </p>
      </section>

      {/* Principle 2: Physical Scale Normalisation via Iris Diameter */}
      <section
        style={{
          padding: "16px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📐</span> 2. Anatomical Scale Calibration (px to mm)
        </h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Phone cameras vary in sensor resolution and focal distance. To measure pores and blemishes in real-world units rather than raw pixels, DermaLens uses the human visible iris as a biological reference standard (~11.7 mm average corneal diameter). By calculating the pixel diameter of your irises, we determine a true <strong>pixels-per-millimetre (px/mm)</strong> scale for every scan.
        </p>
      </section>

      {/* Principle 3: Seven Classical CV Analyzers */}
      <section
        style={{
          padding: "16px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🔬</span> 3. The 7 Surface Analyzers
        </h2>
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", padding: 0 }}>
          <li style={{ fontSize: "12px", lineHeight: 1.4 }}>
            <strong>Facial Redness: </strong> Evaluates surface erythema by measuring CIELAB a* chrominance shifts within the segmented skin mask relative to neutral facial zones.
          </li>
          <li style={{ fontSize: "12px", lineHeight: 1.4 }}>
            <strong>Tone & Pigmentation: </strong> Computes the Individual Typology Angle (ITA° = arctan((L* - 50) / b*) * 180 / π) and local dark spot contrast via Difference-of-Gaussians (DoG).
          </li>
          <li style={{ fontSize: "12px", lineHeight: 1.4 }}>
            <strong>Surface Shine / Sebum: </strong> Detects specular highlights (high L*, low chroma) across T-zone and U-zone regions to reflect oiliness index.
          </li>
          <li style={{ fontSize: "12px", lineHeight: 1.4 }}>
            <strong>Texture & Pores: </strong> Extracts high-frequency surface spatial variations using Laplacian filters calibrated to iris millimetre dimensions.
          </li>
          <li style={{ fontSize: "12px", lineHeight: 1.4 }}>
            <strong>Estimated Blemishes (Acne): </strong> Detects circular erythematous lesions using multi-scale Difference-of-Gaussians with heuristic suppression of freckles, hair, and specular glints.
          </li>
          <li style={{ fontSize: "12px", lineHeight: 1.4 }}>
            <strong>Fine Lines & Creases (Beta): </strong> Measures directional ridge gradients in forehead and periorbital regions. Marked as Beta due to facial expression sensitivity.
          </li>
          <li style={{ fontSize: "12px", lineHeight: 1.4 }}>
            <strong>Under-Eye Tone (Beta): </strong> Measures infraorbital darkness relative to cheek baseline. Marked as Beta due to shadow variations from overhead room lighting.
          </li>
        </ul>
      </section>

      {/* Principle 4: Fitzpatrick Skin Phototype Calibration */}
      <section
        style={{
          padding: "16px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🌍</span> 4. Skin Tone Fairness & Calibration
        </h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Traditional computer vision algorithms often underperform on darker skin tones due to fixed contrast thresholds. DermaLens dynamically calibrates Difference-of-Gaussians sensitivity and erythema baseline offsets according to the user's measured Individual Typology Angle (ITA°), ensuring fair and balanced relative indices across Fitzpatrick skin types I through VI.
        </p>
      </section>

      {/* Principle 5: Honest Scientific Limitations */}
      <section
        style={{
          padding: "16px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
          <span>⚠️</span> 5. Honest Scientific Limitations
        </h2>
        <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, display: "flex", flexDirection: "column", gap: "6px" }}>
          <p>
            • <strong>Ambient Lighting: </strong> Direct sunlight, fluorescent bulbs, or warm tinted lamps shift perceived skin tones. Always scan in diffuse, natural daylight.
          </p>
          <p>
            • <strong>Single 2D Capture: </strong> 3D views and surface depth are biological approximations derived from frontal facial landmarks; they do not replace high-resolution stereophotogrammetry.
          </p>
          <p>
            • <strong>Cosmetic Index vs Clinical Diagnosis: </strong> All scores are relative personal indices (0–100 scale). They do not measure cellular pathology or diagnose dermatological diseases.
          </p>
        </div>
      </section>

      {/* Footer Navigation */}
      <nav style={{ display: "flex", justifyContent: "center", gap: "16px", fontSize: "12px", padding: "12px 0" }}>
        <Link href="/privacy" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
          Privacy Policy
        </Link>
        <span style={{ color: "var(--border-subtle)" }}>•</span>
        <Link href="/terms" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
          Terms & Disclaimer
        </Link>
        <span style={{ color: "var(--border-subtle)" }}>•</span>
        <Link href="/history" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
          Local History
        </Link>
      </nav>

      <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.4 }}>
        {APP_CONTENT.common.disclaimer}
      </p>
    </main>
  );
}
