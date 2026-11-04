import type React from "react";

export interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  animate?: boolean;
}

export function ScoreRing({
  score,
  size = 90,
  strokeWidth = 8,
  label = "Skin score",
  animate = true
}: ScoreRingProps) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Accessible color based on severity: 0-25 good, 26-50 attention, >50 alert
  const strokeColor =
    clampedScore <= 25
      ? "var(--status-good)"
      : clampedScore <= 50
      ? "var(--status-attention)"
      : "var(--status-alert)";

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)", overflow: "visible" }}
      >
        <title>{label}</title>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="var(--bg-tertiary)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: animate ? "stroke-dashoffset 800ms cubic-bezier(0.4, 0, 0.2, 1)" : "none"
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <span style={{ fontSize: `${Math.round(size * 0.28)}px`, fontWeight: 800, lineHeight: 1 }}>
          {clampedScore}
        </span>
        <span style={{ fontSize: `${Math.round(size * 0.12)}px`, color: "var(--text-muted)", fontWeight: 600 }}>
          /100
        </span>
      </div>
    </div>
  );
}
