import Link from "next/link";
import { APP_CONTENT } from "@/content";

export const metadata = {
  title: "Zero-Knowledge Privacy Policy — DermaLens",
  description: "DermaLens privacy policy: 100% on-device skin analysis. Photos never leave your phone. Zero cloud servers, zero analytics, zero cookies."
};

export default function PrivacyPage() {
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
          🛡️ Zero Cloud Egress
        </span>
      </header>

      {/* Hero */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          {APP_CONTENT.transparency.privacyPolicyTitle}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
          {APP_CONTENT.transparency.privacyPolicySubtitle}
        </p>
      </div>

      {/* Principle 1 */}
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
        <h2 style={{ fontSize: "15px", fontWeight: 700 }}>1. Zero Image Uploads</h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          DermaLens has zero image ingestion infrastructure. Photos taken with your camera or chosen from your photo gallery are loaded into an in-memory HTML5 Canvas and processed inside a local Web Worker. They are discarded immediately from active memory when you leave or reload the page.
        </p>
      </section>

      {/* Principle 2 */}
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
        <h2 style={{ fontSize: "15px", fontWeight: 700 }}>2. Zero Analytics, Tracking, or Advertising</h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          We do not embed Google Analytics, Mixpanel, Sentry, Facebook Pixels, or any third-party tracking scripts. The application makes exactly zero outbound network requests during and after scanning. Our Content Security Policy (CSP) strictly prohibits outbound communication.
        </p>
      </section>

      {/* Principle 3 */}
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
        <h2 style={{ fontSize: "15px", fontWeight: 700 }}>3. Local-First IndexedDB Storage</h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Your scan scores, timestamps, and quality indices are saved only when you tap "Save to Local History". All records reside exclusively inside your device's browser IndexedDB. By default, face photographs are never saved to disk—only numerical measurements are retained. Saving low-resolution thumbnails is entirely opt-in.
        </p>
      </section>

      {/* Principle 4 */}
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
        <h2 style={{ fontSize: "15px", fontWeight: 700 }}>4. Complete Data Portability & Erasure</h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          You retain complete ownership over your data. You can export a JSON backup file at any time, import it on another device, or permanently wipe all stored history with a single tap on the "Delete All My Data" button.
        </p>
      </section>

      {/* Footer Navigation */}
      <nav style={{ display: "flex", justifyContent: "center", gap: "16px", fontSize: "12px", padding: "12px 0" }}>
        <Link href="/how-it-measures" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
          How It Measures
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
