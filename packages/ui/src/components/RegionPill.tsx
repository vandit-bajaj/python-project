import type React from "react";

export interface RegionPillProps {
  region: string;
  score: number;
}

export function RegionPill({ region, score }: RegionPillProps) {
  const statusColor =
    score <= 25
      ? "var(--status-good)"
      : score <= 50
      ? "var(--status-attention)"
      : "var(--status-alert)";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: "var(--radius-sm)",
        backgroundColor: "var(--bg-tertiary)",
        fontSize: "12px",
        gap: "8px"
      }}
    >
      <span style={{ textTransform: "capitalize", color: "var(--text-secondary)" }}>
        {region}
      </span>
      <span style={{ fontWeight: 700, color: statusColor }}>
        {score}
      </span>
    </div>
  );
}
