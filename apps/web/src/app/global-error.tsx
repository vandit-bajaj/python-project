"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: "24px 16px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          backgroundColor: "#090d16",
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center"
        }}
      >
        <div style={{ maxWidth: "340px", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
          <div style={{ fontSize: "36px" }}>⚠️</div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>Application Fault</h1>
          <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
            A fatal client error occurred. No image or biometric data was leaked. Please reload the application.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              fontWeight: 700,
              fontSize: "15px",
              cursor: "pointer",
              marginTop: "8px"
            }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
