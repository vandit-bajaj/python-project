import Link from "next/link";
import { APP_CONTENT } from "@/content";

export const metadata = {
  title: "Terms of Use & Cosmetic Disclaimer — DermaLens",
  description: "DermaLens terms of service: educational cosmetic measurement tool, strictly non-diagnostic, no medical warranties."
};

export default function TermsPage() {
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
          📜 Terms & Scope
        </span>
      </header>

      {/* Hero */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          {APP_CONTENT.transparency.termsTitle}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
          {APP_CONTENT.transparency.termsSubtitle}
        </p>
      </div>

      {/* Primary Disclaimer Alert Box */}
      <section
        style={{
          padding: "14px 16px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "rgba(220, 38, 38, 0.08)",
          border: "1px solid rgba(220, 38, 38, 0.3)",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--status-alert)" }}>
          ⚠️ Essential Medical Notice
        </h2>
        <p style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: 1.5 }}>
          DermaLens is NOT a medical device and is NOT intended to replace clinical judgment, examination, or diagnosis by a qualified medical professional or dermatologist. It computes relative cosmetic surface indices for general consumer wellness and personal interest only.
        </p>
      </section>

      {/* Section 1 */}
      <section
        style={{
          padding: "16px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        <h2 style={{ fontSize: "15px", fontWeight: 700 }}>1. Scope of Service</h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          By using DermaLens, you acknowledge that all visual heatmaps, 3D meshes, and concern percentages are approximate mathematical approximations generated locally by your web browser. They do not constitute dermatological diagnosis, prognosis, prescription, or therapeutic recommendations.
        </p>
      </section>

      {/* Section 2 */}
      <section
        style={{
          padding: "16px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        <h2 style={{ fontSize: "15px", fontWeight: 700 }}>2. When to See a Medical Doctor</h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Do not delay or disregard professional medical advice because of any score or visualization presented in DermaLens. If you observe asymmetrical moles, irregularly bordered pigmentation, rapidly growing lesions, chronic ulcerations, bleeding spots, or severe inflammatory rashes, seek prompt in-person dermatological evaluation.
        </p>
      </section>

      {/* Section 3 */}
      <section
        style={{
          padding: "16px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        <h2 style={{ fontSize: "15px", fontWeight: 700 }}>3. No Warranty on Environmental Variations</h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Because calculations depend entirely on your device's camera hardware, ambient illumination, and browser runtime capabilities, DermaLens cannot guarantee repeatable numerical consistency across varying environments or different phone models.
        </p>
      </section>

      {/* Footer Navigation */}
      <nav style={{ display: "flex", justifyContent: "center", gap: "16px", fontSize: "12px", padding: "12px 0" }}>
        <Link href="/how-it-measures" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
          How It Measures
        </Link>
        <span style={{ color: "var(--border-subtle)" }}>•</span>
        <Link href="/privacy" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
          Privacy Policy
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
