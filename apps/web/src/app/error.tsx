"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In strict on-device mode, never log errors to external services
    console.error("DermaLens application error boundary caught:", error);
  }, [error]);

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
          backgroundColor: "rgba(220, 38, 38, 0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px"
        }}
      >
        ⚠️
      </div>

      <h1 style={{ fontSize: "20px", fontWeight: 800 }}>Something went wrong</h1>
      <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "320px", lineHeight: 1.5 }}>
        An unexpected error occurred during client-side processing. Your photo data remains strictly in device memory and has not been stored or transmitted.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "280px", marginTop: "8px" }}>
        <button
          id="btn-retry-error"
          type="button"
          onClick={() => reset()}
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center", cursor: "pointer" }}
        >
          🔄 Try Again
        </button>

        <Link
          href="/"
          id="btn-home-error"
          className="btn-secondary"
          style={{ width: "100%", textAlign: "center", textDecoration: "none" }}
        >
          ← Return to Home
        </Link>
      </div>
    </main>
  );
}
