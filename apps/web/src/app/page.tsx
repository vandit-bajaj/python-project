import { APP_CONTENT } from "@/content";

export default function HomePage() {
  return (
    <main className="app-shell" style={{ justifyContent: "space-between", paddingTop: "24px", paddingBottom: "24px" }}>
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

      {/* Feature Highlights Card */}
      <section style={{
        marginTop: "32px",
        marginBottom: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
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
      </section>

      {/* Primary Actions & Disclaimers */}
      <footer style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <button
          type="button"
          id="btn-scan-camera"
          className="btn-primary"
          style={{ width: "100%" }}
        >
          {APP_CONTENT.landing.ctaStartCamera}
        </button>

        <button
          type="button"
          id="btn-upload-photo"
          className="btn-secondary"
          style={{ width: "100%" }}
        >
          {APP_CONTENT.landing.ctaUploadPhoto}
        </button>

        <p style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          textAlign: "center",
          lineHeight: 1.4,
          paddingTop: "8px"
        }}>
          {APP_CONTENT.common.disclaimer}
        </p>
      </footer>
    </main>
  );
}
