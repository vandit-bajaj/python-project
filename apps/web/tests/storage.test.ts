import "fake-indexeddb/auto";
import Dexie from "dexie";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAllData,
  CURRENT_SCHEMA_VERSION,
  DermaLensDatabase,
  exportHistoryJson,
  getAllScans,
  getScan,
  importHistoryJson,
  saveScan,
  type ScanRecord
} from "../src/storage/db";

describe("DermaLens Local History & Progress Storage", () => {
  let testDb: DermaLensDatabase;

  beforeEach(async () => {
    // Generate unique test database instance
    const dbName = `test_dermalens_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    testDb = new DermaLensDatabase(dbName);
    await testDb.open();
  });

  const sampleScanPayload: Parameters<typeof saveScan>[0] = {
    timestamp: 1730700000000,
    overallScore: 78,
    overallConfidence: 94,
    primaryConcerns: ["redness", "oiliness"],
    concerns: [
      {
        id: "redness",
        label: "Facial Redness",
        overallScore: 24,
        regionScores: { forehead: 10, leftCheek: 28, rightCheek: 22 } as Record<string, number>,
        analyzerVersion: "1.0.0"
      },
      {
        id: "oiliness",
        label: "Surface Shine / Sebum",
        overallScore: 42,
        regionScores: { tZone: 65, forehead: 50 } as Record<string, number>,
        analyzerVersion: "1.0.0"
      }
    ],
    quality: {
      lightingEvenness: 0.94,
      blurScore: 195,
      scalePxMm: 4.5
    },
    appVersion: "0.7.0"
  };

  it("saves a valid scan record and reads it back by ID", async () => {
    const scanId = await saveScan(sampleScanPayload, testDb);
    expect(scanId).toMatch(/^scan_\d+_[a-z0-9]+$/);

    const record = await getScan(scanId, testDb);
    expect(record).toBeDefined();
    expect(record?.id).toBe(scanId);
    expect(record?.overallScore).toBe(78);
    expect(record?.overallConfidence).toBe(94);
    expect(record?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(record?.dateISO).toBe(new Date(1730700000000).toISOString());
    expect(record?.thumbnailBase64).toBeUndefined(); // Opt-in privacy policy: no photo by default
  });

  it("enforces Zod boundary validation on invalid scan data", async () => {
    const invalidScan = {
      ...sampleScanPayload,
      overallScore: 150 // Invalid: > 100
    };

    await expect(saveScan(invalidScan, testDb)).rejects.toThrow();
  });

  it("returns scans ordered chronologically descending (newest first)", async () => {
    await saveScan({ ...sampleScanPayload, timestamp: 1000 }, testDb);
    await saveScan({ ...sampleScanPayload, timestamp: 3000 }, testDb);
    await saveScan({ ...sampleScanPayload, timestamp: 2000 }, testDb);

    const scans = await getAllScans(testDb);
    expect(scans).toHaveLength(3);
    expect(scans[0]?.timestamp).toBe(3000);
    expect(scans[1]?.timestamp).toBe(2000);
    expect(scans[2]?.timestamp).toBe(1000);
  });

  it("exports and imports history JSON backup round-trip with zero data loss", async () => {
    const id1 = await saveScan({ ...sampleScanPayload, timestamp: 1000 }, testDb);
    const id2 = await saveScan({ ...sampleScanPayload, timestamp: 2000 }, testDb);

    const jsonString = await exportHistoryJson(testDb);
    expect(jsonString).toContain("dermalens_history_backup");

    // Clear database
    await clearAllData(testDb);
    expect(await getAllScans(testDb)).toHaveLength(0);

    // Import from JSON string
    const result = await importHistoryJson(jsonString, testDb);
    expect(result.importedCount).toBe(2);
    expect(result.skippedCount).toBe(0);

    const restored = await getAllScans(testDb);
    expect(restored).toHaveLength(2);
    expect(restored.map((s) => s.id)).toEqual([id2, id1]);
  });

  it("rejects corrupted or malicious JSON on import", async () => {
    await expect(importHistoryJson("not-a-valid-json", testDb)).rejects.toThrow();

    const maliciousJson = JSON.stringify({
      format: "dermalens_history_backup",
      version: 1,
      exportedAt: "now",
      scans: [{ id: "bad", overallScore: "should-be-a-number" }]
    });

    await expect(importHistoryJson(maliciousJson, testDb)).rejects.toThrow();
  });

  it("supports schema v1 to v2 migration populating missing dateISO", async () => {
    const migrationDbName = `migration_test_${Date.now()}`;
    const v1Db = new Dexie(migrationDbName);
    v1Db.version(1).stores({
      scans: "id, timestamp, overallScore, schemaVersion",
      settings: "key"
    });
    await v1Db.open();

    // Simulate v1 record without dateISO
    const v1Record = {
      id: "scan_v1_legacy",
      timestamp: 1600000000000,
      schemaVersion: 1,
      overallScore: 65,
      overallConfidence: 90,
      primaryConcerns: ["redness"],
      concerns: [],
      quality: { lightingEvenness: 0.9, blurScore: 180, scalePxMm: 4.0 },
      appVersion: "0.6.0"
    };

    await v1Db.table("scans").add(v1Record);
    await v1Db.close();

    // Reopen with full DermaLensDatabase which registers version 2 upgrade
    const upgradedDb = new DermaLensDatabase(migrationDbName);
    await upgradedDb.open();

    const upgraded = await upgradedDb.scans.get("scan_v1_legacy");
    expect(upgraded).toBeDefined();
    expect(upgraded?.schemaVersion).toBe(2);
    expect(upgraded?.dateISO).toBe(new Date(1600000000000).toISOString());
    await upgradedDb.close();
  });

  it("deletes single scan and wipes all data on request", async () => {
    const id1 = await saveScan(sampleScanPayload, testDb);
    const id2 = await saveScan({ ...sampleScanPayload, timestamp: Date.now() + 100 }, testDb);

    await testDb.scans.delete(id1);
    expect(await getScan(id1, testDb)).toBeUndefined();
    expect(await getScan(id2, testDb)).toBeDefined();

    await clearAllData(testDb);
    expect(await getAllScans(testDb)).toHaveLength(0);
  });
});
