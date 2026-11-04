import Link from "next/link";
import { APP_CONTENT } from "@/content";

export default function HomePage() {
  return (
    <main
      id="main-content"
      className="app-shell"
      style={{ justifyContent: "space-between", paddingTop: "24px", paddingBottom: "24px" }}
    >
      {/* Top Header & Privacy Badge */}
      <header style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "var(--radius-full)",
          backgroundColor: "var(--accent-muted)",
          color: "var(--accent-foreground)",
          fontSize: "12px",
          fontWeight: 600
        }}>
          <span>🔒</span>
          <span>{APP_CONTENT.common.privacyBadge}</span>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          {APP_CONTENT.common.appName}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "16px", lineHeight: 1.4 }}>
          {APP_CONTENT.landing.heroSubtitle}
        </p>
      </header>

      {/* Feature Value Props */}
      <section style={{ display: "flex", flexDirection: "column", gap: "16px", margin: "24px 0" }}>
        <div style={{
          padding: "16px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)"
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>
            {APP_CONTENT.landing.feature1.title}
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
            {APP_CONTENT.landing.feature1.description}
          </p>
        </div>

        <div style={{
          padding: "16px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)"
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>
            {APP_CONTENT.landing.feature2.title}
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
            {APP_CONTENT.landing.feature2.description}
          </p>
        </div>

        <div style={{
          padding: "16px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)"
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>
            {APP_CONTENT.landing.feature3.title}
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
            {APP_CONTENT.landing.feature3.description}
          </p>
        </div>
      </section>

      {/* Bottom Actions & Privacy Guarantee */}
      <footer style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <Link
          href="/scan"
          id="btn-scan-camera"
          className="btn-primary"
          style={{ width: "100%", textAlign: "center", textDecoration: "none" }}
        >
          {APP_CONTENT.landing.ctaStartCamera}
        </Link>

        <Link
          href="/scan"
          id="btn-upload-photo"
          className="btn-secondary"
          style={{ width: "100%", textAlign: "center", textDecoration: "none" }}
        >
          {APP_CONTENT.landing.ctaUploadPhoto}
        </Link>

        <Link
          href="/history"
          id="btn-view-history"
          className="btn-secondary"
          style={{ width: "100%", textAlign: "center", textDecoration: "none" }}
        >
          📊 View Scan History & Progress
        </Link>

        <nav
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "12px",
            fontSize: "12px",
            paddingTop: "6px"
          }}
          aria-label="Legal and scientific transparency"
        >
          <Link href="/how-it-measures" id="link-how-it-measures" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
            How It Measures
          </Link>
          <span style={{ color: "var(--border-subtle)" }}>•</span>
          <Link href="/privacy" id="link-privacy" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
            Privacy Policy
          </Link>
          <span style={{ color: "var(--border-subtle)" }}>•</span>
          <Link href="/terms" id="link-terms" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
            Terms & Disclaimer
          </Link>
        </nav>

        <p style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          textAlign: "center",
          lineHeight: 1.4,
          paddingTop: "4px"
        }}>
          {APP_CONTENT.common.disclaimer}
        </p>
      </footer>
    </main>
  );
}
