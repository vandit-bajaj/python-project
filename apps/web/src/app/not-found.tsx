import Link from "next/link";
import { APP_CONTENT } from "@/content";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="mobile-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: "24px 16px",
        textAlign: "center",
        gap: "16px"
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-full)",
          backgroundColor: "var(--bg-tertiary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          fontWeight: 800
        }}
      >
        404
      </div>

      <h1 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}>
        Page Not Found
      </h1>
      <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "300px", lineHeight: 1.5 }}>
        The requested screen does not exist or has moved.
      </p>

      <Link
        href="/"
        id="btn-return-home"
        className="btn-primary"
        style={{ width: "100%", maxWidth: "260px", justifyContent: "center", textDecoration: "none", marginTop: "8px" }}
      >
        ← Back to {APP_CONTENT.common.appName}
      </Link>
    </main>
  );
}
