"use client";

import { ScoreRing } from "@dermalens/ui";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { APP_CONTENT } from "@/content";
import {
  clearAllData,
  deleteScan,
  exportHistoryJson,
  getAllScans,
  getStorageQuota,
  getUserSettings,
  importHistoryJson,
  requestStoragePersistence,
  type ScanRecord,
  type UserSettings,
  updateUserSettings
} from "@/storage/db";

export default function HistoryPage() {
  const [isReady, setIsReady] = useState(false);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    key: "user_settings",
    storeThumbnails: false,
    safariDismissWarning: false
  });
  const [storageInfo, setStorageInfo] = useState<{
    usedBytes: number;
    quotaBytes: number;
    isPersisted: boolean;
  }>({ usedBytes: 0, quotaBytes: 0, isPersisted: false });

  const [selectedScanIds, setSelectedScanIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load scans and settings on mount
  const refreshData = useCallback(async () => {
    const [loadedScans, loadedSettings, quota] = await Promise.all([
      getAllScans(),
      getUserSettings(),
      getStorageQuota()
    ]);
    setScans(loadedScans);
    setSettings(loadedSettings);
    setStorageInfo(quota);
    setIsReady(true);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleToggleSelect = (id: string) => {
    setSelectedScanIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        // Keep at most 2 selected for comparison
        return [prev[1] ?? "", id].filter(Boolean);
      }
      return [...prev, id];
    });
  };

  const handleDelete = async (id: string) => {
    await deleteScan(id);
    setSelectedScanIds((prev) => prev.filter((item) => item !== id));
    await refreshData();
    setStatusMessage("Scan deleted from local storage.");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to delete all saved scan history? This cannot be undone.")) {
      await clearAllData();
      setSelectedScanIds([]);
      setIsComparing(false);
      await refreshData();
      setStatusMessage("All local data has been permanently cleared.");
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleExportJson = async () => {
    const json = await exportHistoryJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dermalens-history-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage("History exported to JSON.");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await importHistoryJson(text);
      await refreshData();
      setStatusMessage(`Imported ${res.importedCount} scan(s) (${res.skippedCount} skipped as duplicate).`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to import JSON file");
    } finally {
      e.target.value = "";
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handlePersistStorage = async () => {
    const granted = await requestStoragePersistence();
    const quota = await getStorageQuota();
    setStorageInfo(quota);
    setStatusMessage(granted ? "Persistent storage granted by browser!" : "Persistent storage request not granted.");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleToggleThumbnails = async (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, storeThumbnails: enabled }));
    await updateUserSettings({ storeThumbnails: enabled });
  };

  const handleDismissSafari = async () => {
    await updateUserSettings({ safariDismissWarning: true });
    setSettings((prev) => ({ ...prev, safariDismissWarning: true }));
  };

  // Comparison data
  const scanA = scans.find((s) => s.id === selectedScanIds[0]);
  const scanB = scans.find((s) => s.id === selectedScanIds[1]);

  const hasEnvironmentalDrift =
    scanA &&
    scanB &&
    (Math.abs(scanA.quality.lightingEvenness - scanB.quality.lightingEvenness) > 0.12 ||
      Math.abs(scanA.quality.blurScore - scanB.quality.blurScore) > 35);

  const hasVersionMismatch = scanA && scanB && scanA.appVersion !== scanB.appVersion;

  return (
    <main
      className="mobile-container"
      data-ready={isReady ? "true" : "false"}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        padding: "16px",
        minHeight: "100dvh"
      }}
    >
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            href="/"
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
          <span style={{ color: "var(--border-subtle)" }}>/</span>
          <Link
            href="/report"
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              textDecoration: "none"
            }}
          >
            Report
          </Link>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <button
            id="btn-export-json"
            type="button"
            onClick={handleExportJson}
            disabled={scans.length === 0}
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              cursor: scans.length === 0 ? "not-allowed" : "pointer",
              opacity: scans.length === 0 ? 0.6 : 1
            }}
          >
            💾 Export Backup
          </button>
        </div>
      </header>

      {/* Title */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Scan History & Progress
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
          Private, on-device IndexedDB storage. No accounts, no cloud sync.
        </p>
      </div>

      {statusMessage && (
        <div
          id="status-banner"
          style={{
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--accent-muted)",
            color: "var(--accent-foreground)",
            fontSize: "12px",
            fontWeight: 600
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* iOS Safari Eviction Advisory Card */}
      {!settings.safariDismissWarning && (
        <section
          id="safari-advisory-card"
          style={{
            padding: "12px 14px",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "rgba(234, 179, 8, 0.08)",
            border: "1px solid rgba(234, 179, 8, 0.3)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            fontSize: "12px",
            lineHeight: 1.4
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontWeight: 700, color: "var(--status-attention)" }}>
              ⚠️ iOS Safari Storage Policy Notice
            </span>
            <button
              id="btn-dismiss-safari"
              type="button"
              onClick={handleDismissSafari}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "14px",
                cursor: "pointer",
                padding: "0 4px"
              }}
              aria-label="Dismiss Safari warning"
            >
              ✕
            </button>
          </div>
          <p style={{ color: "var(--text-secondary)" }}>
            Mobile Safari may automatically clear website local storage after ~7 days of inactivity. Use <strong>Export Backup</strong> to save your history as a file, or export before clearing browser data.
          </p>
        </section>
      )}

      {/* Storage Management Card */}
      <section
        style={{
          padding: "12px 14px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          fontSize: "12px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontWeight: 700 }}>Local Storage Quota: </span>
            <span style={{ color: "var(--text-secondary)" }}>
              {(storageInfo.usedBytes / 1024).toFixed(1)} KB used
            </span>
          </div>
          <button
            id="btn-persist-storage"
            type="button"
            onClick={handlePersistStorage}
            style={{
              padding: "3px 8px",
              borderRadius: "var(--radius-full)",
              fontSize: "10px",
              fontWeight: 600,
              backgroundColor: storageInfo.isPersisted ? "var(--accent-muted)" : "var(--bg-tertiary)",
              color: storageInfo.isPersisted ? "var(--accent-foreground)" : "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer"
            }}
          >
            {storageInfo.isPersisted ? "✓ Persistent" : "Request Persistence"}
          </button>
        </div>

        {/* Thumbnail Opt-in Switch */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px", borderTop: "1px solid var(--border-subtle)" }}>
          <div>
            <span style={{ fontWeight: 600, display: "block" }}>Store Low-Res Thumbnails</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Disabled by default for maximum privacy.
            </span>
          </div>
          <input
            id="toggle-thumbnail-optin"
            type="checkbox"
            disabled={!isReady}
            checked={settings.storeThumbnails}
            onChange={(e) => handleToggleThumbnails(e.target.checked)}
            style={{ width: "16px", height: "16px", cursor: isReady ? "pointer" : "default" }}
            aria-label="Store low-resolution thumbnails opt-in"
          />
        </div>
      </section>

      {/* Compare Button (When 2 are selected) */}
      {selectedScanIds.length === 2 && (
        <button
          id="btn-trigger-compare"
          type="button"
          onClick={() => setIsComparing(!isComparing)}
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center", cursor: "pointer" }}
        >
          {isComparing ? "Hide Comparison" : "📊 Compare 2 Selected Scans"}
        </button>
      )}

      {/* Side-by-Side Comparison Drawer/Card */}
      {isComparing && scanA && scanB && (
        <section
          id="comparison-section"
          style={{
            padding: "16px",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--bg-secondary)",
            border: "2px solid var(--accent-primary)",
            display: "flex",
            flexDirection: "column",
            gap: "14px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Side-by-Side Comparison</h2>
            <button
              type="button"
              onClick={() => setIsComparing(false)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          {/* Environmental Drift Alert */}
          {hasEnvironmentalDrift && (
            <div
              id="drift-warning"
              style={{
                padding: "8px 10px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "rgba(234, 179, 8, 0.12)",
                borderLeft: "3px solid var(--status-attention)",
                fontSize: "11px",
                lineHeight: 1.4,
                color: "var(--text-secondary)"
              }}
            >
              <strong style={{ color: "var(--status-attention)" }}>⚠️ Environmental Lighting Variance: </strong>
              Lighting uniformity differs between these scans. Observed index deltas may reflect room lighting rather than actual skin changes.
            </div>
          )}

          {/* Version Mismatch Alert */}
          {hasVersionMismatch && (
            <div
              id="version-warning"
              style={{
                padding: "8px 10px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                borderLeft: "3px solid #3b82f6",
                fontSize: "11px",
                lineHeight: 1.4,
                color: "var(--text-secondary)"
              }}
            >
              <strong>ℹ️ Analyzer Version Difference: </strong>
              Scans were captured under different app versions ({scanA.appVersion} vs {scanB.appVersion}).
            </div>
          )}

          {/* Comparison Table */}
          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                <th style={{ textAlign: "left", paddingBottom: "6px" }}>Metric</th>
                <th style={{ textAlign: "center", paddingBottom: "6px" }}>Scan 1</th>
                <th style={{ textAlign: "center", paddingBottom: "6px" }}>Scan 2</th>
                <th style={{ textAlign: "right", paddingBottom: "6px" }}>Delta</th>
              </tr>
            </thead>
            <tbody>
              {/* Overall Score */}
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "8px 0", fontWeight: 700 }}>Composite Index</td>
                <td style={{ textAlign: "center", fontWeight: 600 }}>{scanA.overallScore}</td>
                <td style={{ textAlign: "center", fontWeight: 600 }}>{scanB.overallScore}</td>
                <td
                  style={{
                    textAlign: "right",
                    fontWeight: 700,
                    color:
                      scanB.overallScore - scanA.overallScore >= 0
                        ? "var(--status-good)"
                        : "var(--status-alert)"
                  }}
                >
                  {scanB.overallScore - scanA.overallScore >= 0 ? "+" : ""}
                  {(scanB.overallScore - scanA.overallScore).toFixed(1)}
                </td>
              </tr>

              {/* Concern rows */}
              {scanB.concerns.map((cB) => {
                const cA = scanA.concerns.find((c) => c.id === cB.id);
                const valA = cA?.overallScore ?? 0;
                const valB = cB.overallScore;
                const delta = valB - valA;

                return (
                  <tr key={cB.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "6px 0", color: "var(--text-secondary)" }}>{cB.label}</td>
                    <td style={{ textAlign: "center" }}>{valA.toFixed(1)}</td>
                    <td style={{ textAlign: "center" }}>{valB.toFixed(1)}</td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 600,
                        color: delta === 0 ? "var(--text-muted)" : delta > 0 ? "var(--status-attention)" : "var(--status-good)"
                      }}
                    >
                      {delta >= 0 ? "+" : ""}
                      {delta.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* Timeline List of Scans */}
      <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700 }}>
            Timeline ({scans.length} {scans.length === 1 ? "scan" : "scans"})
          </h2>
          {selectedScanIds.length > 0 && (
            <span style={{ fontSize: "11px", color: "var(--accent-primary)", fontWeight: 600 }}>
              {selectedScanIds.length}/2 selected
            </span>
          )}
        </div>

        {scans.length === 0 ? (
          <div
            id="empty-history"
            style={{
              padding: "36px 16px",
              textAlign: "center",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "var(--bg-secondary)",
              border: "1px dashed var(--border-strong)",
              color: "var(--text-secondary)",
              fontSize: "13px"
            }}
          >
            <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
              No Saved Scans Yet
            </p>
            <p style={{ fontSize: "12px", maxWidth: "280px", margin: "0 auto 14px auto" }}>
              Perform a skin capture and tap "Save to History" on the report screen to begin tracking your journey.
            </p>
            <Link href="/scan" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
              Start First Scan
            </Link>
          </div>
        ) : (
          scans.map((scan) => {
            const isSelected = selectedScanIds.includes(scan.id);
            const dateStr = new Date(scan.timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div
                key={scan.id}
                id={`card-scan-${scan.id}`}
                style={{
                  padding: "14px",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: "var(--bg-secondary)",
                  border: isSelected ? "2px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  transition: "border-color var(--transition-fast)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(scan.id)}
                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                      aria-label={`Select scan from ${dateStr} for comparison`}
                    />
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 700, display: "block" }}>
                        {dateStr}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        Quality: {Math.round(scan.overallConfidence)}% • v{scan.appVersion}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ScoreRing score={scan.overallScore} size={42} strokeWidth={4} animate={false} />
                    <button
                      id={`btn-delete-${scan.id}`}
                      type="button"
                      onClick={() => handleDelete(scan.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        fontSize: "14px",
                        cursor: "pointer",
                        padding: "4px"
                      }}
                      title="Delete scan"
                      aria-label="Delete scan record"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Concerns badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {scan.concerns.slice(0, 4).map((c) => (
                    <span
                      key={c.id}
                      style={{
                        padding: "2px 8px",
                        borderRadius: "var(--radius-full)",
                        backgroundColor: "var(--bg-tertiary)",
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "var(--text-secondary)"
                      }}
                    >
                      {c.label}: {Math.round(c.overallScore)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Backup & Data Actions Footer */}
      <section style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "16px" }}>
        <label
          htmlFor="input-import-json"
          className="btn-secondary"
          style={{ width: "100%", justifyContent: "center", cursor: "pointer", textAlign: "center" }}
        >
          📥 Import Backup from JSON
          <input
            id="input-import-json"
            type="file"
            accept=".json"
            onChange={handleImportJson}
            style={{ display: "none" }}
          />
        </label>

        {scans.length > 0 && (
          <button
            id="btn-clear-all"
            type="button"
            onClick={handleClearAll}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "rgba(220, 38, 38, 0.08)",
              border: "1px solid rgba(220, 38, 38, 0.25)",
              color: "var(--status-alert)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            🗑️ Delete All My Data
          </button>
        )}

        <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.4, marginTop: "4px" }}>
          {APP_CONTENT.common.disclaimer}
        </p>
      </section>
    </main>
  );
}
