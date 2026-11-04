"use client";

import { APP_CONTENT } from "@/content";

interface PermissionPrimerProps {
  status: "idle" | "requesting" | "streaming" | "denied" | "no-camera" | "error";
  errorMessage: string | null;
  onAllow: () => void;
}

export function PermissionPrimer({ status, errorMessage, onAllow }: PermissionPrimerProps) {
  const isDenied = status === "denied";
  const isError = status === "error" || status === "no-camera";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "32px 16px",
      gap: "20px",
      minHeight: "360px"
    }}>
      <div style={{
        width: "64px",
        height: "64px",
        borderRadius: "var(--radius-full)",
        backgroundColor: isDenied ? "rgba(239, 68, 68, 0.15)" : "var(--accent-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "32px"
      }}>
        {isDenied ? "⚠️" : "📷"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700 }}>
          {isDenied ? "Camera Access Blocked" : APP_CONTENT.camera.permissionPrimerTitle}
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "340px", lineHeight: 1.5 }}>
          {isDenied
            ? APP_CONTENT.camera.deniedRecovery
            : APP_CONTENT.camera.permissionPrimerBody}
        </p>
        {isError && errorMessage && (
          <p style={{ fontSize: "12px", color: "var(--status-alert)", marginTop: "8px" }}>
            {errorMessage}
          </p>
        )}
      </div>

      {!isDenied ? (
        <button
          type="button"
          id="btn-enable-camera"
          className="btn-primary"
          style={{ width: "100%", maxWidth: "320px" }}
          onClick={onAllow}
          disabled={status === "requesting"}
        >
          {status === "requesting" ? "Requesting..." : APP_CONTENT.camera.allowButton}
        </button>
      ) : (
        <button
          type="button"
          className="btn-secondary"
          style={{ width: "100%", maxWidth: "320px" }}
          onClick={onAllow}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
