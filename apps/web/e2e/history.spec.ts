import { expect, test } from "@playwright/test";

test.describe("DermaLens Local History & Progress E2E", () => {
  test("saves scan from report, reviews timeline, compares scans, tests storage controls, and verifies zero outbound requests", async ({ page }) => {
    const outboundRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (!url.startsWith("http://localhost:3000") && !url.startsWith("data:") && !url.startsWith("blob:")) {
        outboundRequests.push(url);
      }
    });

    // 1. Visit report page and save to history
    await page.goto("/report");
    await expect(page.locator("h1")).toContainText("Skin Analysis Report");

    const saveHistoryBtn = page.locator("#btn-save-history");
    await expect(saveHistoryBtn).toBeVisible();
    await expect(saveHistoryBtn).toBeEnabled();
    await saveHistoryBtn.click();

    // Verify confirmation and history link appear
    const viewHistoryLink = page.locator("#link-view-history");
    await expect(viewHistoryLink).toBeVisible();

    // 2. Navigate to /history
    await viewHistoryLink.click();
    await expect(page).toHaveURL(/\/history/);
    await expect(page.locator("h1")).toContainText("Scan History & Progress");
    await expect(page.locator('main[data-ready="true"]')).toBeVisible();

    // Verify timeline has 1 scan card
    const scanCards = page.locator('[id^="card-scan-"]');
    await expect(scanCards).toHaveCount(1);

    // 3. Test iOS Safari advisory card dismissal
    const safariCard = page.locator("#safari-advisory-card");
    await expect(safariCard).toBeVisible();
    await page.locator("#btn-dismiss-safari").click();
    await expect(safariCard).not.toBeVisible();

    // 4. Test Storage Quota and thumbnail opt-in switch
    const thumbnailToggle = page.locator("#toggle-thumbnail-optin");
    await expect(thumbnailToggle).toBeEnabled();
    await expect(thumbnailToggle).not.toBeChecked();
    await thumbnailToggle.click();
    await expect(thumbnailToggle).toBeChecked();
    await thumbnailToggle.click();
    await expect(thumbnailToggle).not.toBeChecked();

    // 5. Test persistence request button
    const persistBtn = page.locator("#btn-persist-storage");
    await expect(persistBtn).toBeVisible();
    await persistBtn.click();

    // 6. Test Export Backup button
    const exportBtn = page.locator("#btn-export-json");
    await expect(exportBtn).toBeEnabled();

    // 7. Import a second scan via JSON backup to test import flow, side-by-side comparison & environmental drift
    const backupJson = JSON.stringify({
      format: "dermalens_history_backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      scans: [
        {
          id: "scan_imported_drift_test",
          timestamp: Date.now() - 86400000 * 7,
          dateISO: new Date(Date.now() - 86400000 * 7).toISOString(),
          schemaVersion: 2,
          overallScore: 68,
          overallConfidence: 88,
          primaryConcerns: ["redness", "pigmentation"],
          concerns: [
            {
              id: "redness",
              label: "Facial Redness",
              overallScore: 40,
              regionScores: { forehead: 35, leftCheek: 45, rightCheek: 42 },
              analyzerVersion: "1.0.0"
            },
            {
              id: "pigmentation",
              label: "Tone Evenness & Spots",
              overallScore: 32,
              regionScores: { forehead: 30, nose: 34 },
              analyzerVersion: "1.0.0"
            }
          ],
          quality: {
            lightingEvenness: 0.75, // Intentionally lower (> 0.12 delta to trigger drift warning)
            blurScore: 140, // Intentionally different to trigger blur drift
            scalePxMm: 4.4
          },
          appVersion: "0.6.0" // Different version to test cross-version badge
        }
      ]
    });

    await page.locator("#input-import-json").setInputFiles({
      name: "dermalens-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(backupJson)
    });

    // Verify timeline now has 2 scan cards
    await expect(page.locator('[id^="card-scan-"]')).toHaveCount(2);

    // Select both checkboxes
    const checkboxes = page.locator('input[type="checkbox"][aria-label*="Select scan"]');
    await expect(checkboxes).toHaveCount(2);
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    // Trigger side-by-side comparison
    const compareBtn = page.locator("#btn-trigger-compare");
    await expect(compareBtn).toBeVisible();
    await compareBtn.click();

    // Verify comparison section, environmental drift, and cross-version advisory
    const comparisonSection = page.locator("#comparison-section");
    await expect(comparisonSection).toBeVisible();
    await expect(page.locator("#drift-warning")).toBeVisible();
    await expect(page.locator("#version-warning")).toBeVisible();
    await expect(comparisonSection.locator("table")).toBeVisible();
    await expect(comparisonSection.getByText("Composite Index")).toBeVisible();

    // 8. Capture mobile screenshots for documentation artifacts
    const viewport = page.viewportSize();
    if (viewport) {
      await page.screenshot({
        path: `../../docs/screenshots/history-${viewport.width}x${viewport.height}.png`,
        fullPage: true
      });
    }

    // 9. Test Clear All Data
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    const clearAllBtn = page.locator("#btn-clear-all");
    await expect(clearAllBtn).toBeVisible();
    await clearAllBtn.click();

    // Verify empty history state is rendered
    await expect(page.locator("#empty-history")).toBeVisible();
    await expect(page.locator('[id^="card-scan-"]')).toHaveCount(0);

    // 10. Verify Zero External Outbound Requests
    expect(outboundRequests).toHaveLength(0);
  });
});
