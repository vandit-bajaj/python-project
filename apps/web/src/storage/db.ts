import Dexie, { type EntityTable } from "dexie";
import { z } from "zod";

export const CURRENT_SCHEMA_VERSION = 2;
export const CURRENT_APP_VERSION = "0.7.0";

export const ScanConcernRecordSchema = z.object({
  id: z.string(),
  label: z.string(),
  overallScore: z.number().min(0).max(100),
  isBeta: z.boolean().optional(),
  regionScores: z.record(z.string(), z.number()),
  analyzerVersion: z.string()
});
export type ScanConcernRecord = z.infer<typeof ScanConcernRecordSchema>;

export const ScanQualityRecordSchema = z.object({
  lightingEvenness: z.number(),
  blurScore: z.number(),
  scalePxMm: z.number()
});
export type ScanQualityRecord = z.infer<typeof ScanQualityRecordSchema>;

export const ScanRecordSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  dateISO: z.string(),
  schemaVersion: z.number().int().positive(),
  overallScore: z.number().min(0).max(100),
  overallConfidence: z.number().min(0).max(100),
  primaryConcerns: z.array(z.string()),
  concerns: z.array(ScanConcernRecordSchema),
  quality: ScanQualityRecordSchema,
  thumbnailBase64: z.string().optional(),
  notes: z.string().optional(),
  appVersion: z.string().default(CURRENT_APP_VERSION)
});
export type ScanRecord = z.infer<typeof ScanRecordSchema>;

export const UserSettingsSchema = z.object({
  key: z.string(),
  storeThumbnails: z.boolean().default(false),
  safariDismissWarning: z.boolean().default(false)
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const HistoryExportSchema = z.object({
  format: z.literal("dermalens_history_backup"),
  version: z.number(),
  exportedAt: z.string(),
  scans: z.array(ScanRecordSchema)
});
export type HistoryExport = z.infer<typeof HistoryExportSchema>;

export class DermaLensDatabase extends Dexie {
  scans!: EntityTable<ScanRecord, "id">;
  settings!: EntityTable<UserSettings, "key">;

  constructor(databaseName = "dermalens_db") {
    super(databaseName);

    // Schema Version 1
    this.version(1).stores({
      scans: "id, timestamp, overallScore, schemaVersion",
      settings: "key"
    });

    // Schema Version 2: Index dateISO, ensure schemaVersion: 2
    this.version(2)
      .stores({
        scans: "id, timestamp, overallScore, schemaVersion, dateISO",
        settings: "key"
      })
      .upgrade((tx) => {
        return tx
          .table("scans")
          .toCollection()
          .modify((scan: ScanRecord) => {
            if (!scan.dateISO && scan.timestamp) {
              scan.dateISO = new Date(scan.timestamp).toISOString();
            }
            scan.schemaVersion = 2;
          });
      });
  }
}

// Singleton database instance
export const db = new DermaLensDatabase();

/**
 * Saves a new scan outcome to IndexedDB. Validates schema before writing.
 */
export async function saveScan(
  data: Omit<ScanRecord, "id" | "dateISO" | "schemaVersion">,
  customDb: DermaLensDatabase = db
): Promise<string> {
  const timestamp = data.timestamp || Date.now();
  const id = `scan_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
  const dateISO = new Date(timestamp).toISOString();

  const record: ScanRecord = {
    ...data,
    id,
    timestamp,
    dateISO,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    appVersion: CURRENT_APP_VERSION
  };

  // Validate boundary
  const validated = ScanRecordSchema.parse(record);
  await customDb.scans.add(validated);
  return id;
}

/**
 * Retrieves a single scan by ID.
 */
export async function getScan(
  id: string,
  customDb: DermaLensDatabase = db
): Promise<ScanRecord | undefined> {
  return customDb.scans.get(id);
}

/**
 * Retrieves all saved scans, sorted chronologically descending (newest first).
 */
export async function getAllScans(
  customDb: DermaLensDatabase = db
): Promise<ScanRecord[]> {
  return customDb.scans.orderBy("timestamp").reverse().toArray();
}

/**
 * Deletes a single scan by ID.
 */
export async function deleteScan(
  id: string,
  customDb: DermaLensDatabase = db
): Promise<void> {
  await customDb.scans.delete(id);
}

/**
 * Permanently wipes all scans and user settings from local IndexedDB.
 */
export async function clearAllData(
  customDb: DermaLensDatabase = db
): Promise<void> {
  await customDb.transaction("rw", customDb.scans, customDb.settings, async () => {
    await customDb.scans.clear();
    await customDb.settings.clear();
  });
}

/**
 * Exports all scans as a validated JSON backup string.
 */
export async function exportHistoryJson(
  customDb: DermaLensDatabase = db
): Promise<string> {
  const scans = await getAllScans(customDb);
  const payload: HistoryExport = {
    format: "dermalens_history_backup",
    version: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    scans
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Imports scans from a JSON string. Validates schema per record.
 */
export async function importHistoryJson(
  jsonString: string,
  customDb: DermaLensDatabase = db
): Promise<{ importedCount: number; skippedCount: number }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("Invalid JSON file format");
  }

  // Validate envelope
  const backup = HistoryExportSchema.safeParse(parsed);
  let scansToProcess: ScanRecord[] = [];

  if (backup.success) {
    scansToProcess = backup.data.scans;
  } else if (Array.isArray(parsed)) {
    // Also accept raw array of scan records
    for (const item of parsed) {
      const single = ScanRecordSchema.safeParse(item);
      if (single.success) {
        scansToProcess.push(single.data);
      }
    }
  } else {
    throw new Error("JSON structure does not match DermaLens history backup format");
  }

  let importedCount = 0;
  let skippedCount = 0;

  for (const scan of scansToProcess) {
    const existing = await customDb.scans.get(scan.id);
    if (!existing) {
      await customDb.scans.put(scan);
      importedCount++;
    } else {
      skippedCount++;
    }
  }

  return { importedCount, skippedCount };
}

/**
 * Retrieves storage quota and persistence state.
 */
export async function getStorageQuota(): Promise<{
  usedBytes: number;
  quotaBytes: number;
  isPersisted: boolean;
}> {
  if (typeof navigator === "undefined" || !navigator.storage) {
    return { usedBytes: 0, quotaBytes: 0, isPersisted: false };
  }

  let isPersisted = false;
  if (navigator.storage.persisted) {
    try {
      isPersisted = await navigator.storage.persisted();
    } catch {
      isPersisted = false;
    }
  }

  let usedBytes = 0;
  let quotaBytes = 0;
  if (navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      usedBytes = estimate.usage ?? 0;
      quotaBytes = estimate.quota ?? 0;
    } catch {
      // Ignore quota check failure
    }
  }

  return { usedBytes, quotaBytes, isPersisted };
}

/**
 * Requests persistent storage from the browser.
 */
export async function requestStoragePersistence(): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Gets user settings.
 */
export async function getUserSettings(
  customDb: DermaLensDatabase = db
): Promise<UserSettings> {
  const current = await customDb.settings.get("user_settings");
  if (current) {
    return current;
  }
  return {
    key: "user_settings",
    storeThumbnails: false,
    safariDismissWarning: false
  };
}

/**
 * Updates user settings.
 */
export async function updateUserSettings(
  settings: Partial<UserSettings>,
  customDb: DermaLensDatabase = db
): Promise<void> {
  const existing = await getUserSettings(customDb);
  const updated: UserSettings = {
    ...existing,
    ...settings,
    key: "user_settings"
  };
  await customDb.settings.put(updated);
}
