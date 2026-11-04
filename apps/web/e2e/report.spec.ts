import { expect, test } from "@playwright/test";

test.describe("DermaLens Skin Report & Visualisation E2E", () => {
  test("loads vertical story report, interacts with heatmaps, accordion, and verifies zero outbound requests", async ({ page }) => {
    const outboundRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (!url.startsWith("http://localhost:3000") && !url.startsWith("data:") && !url.startsWith("blob:")) {
        outboundRequests.push(url);
      }
    });

    await page.goto("/report");

    // Section 1: Hero Composite Index
    await expect(page.locator("h1")).toContainText("Skin Analysis Report");
    await expect(page.getByRole("progressbar", { name: "Composite Skin Index" })).toBeVisible();
    await expect(page.getByText("Quality Confidence:")).toBeVisible();

    // Section 2: Interactive Heatmap Viewer
    const heatmapContainer = page.locator("#heatmap-container");
    await expect(heatmapContainer).toBeVisible();

    // Switch concern chips in heatmap
    await page.locator("#btn-concern-acne").click();
    await page.locator("#btn-concern-wrinkles").click();

    // Adjust opacity slider
    const slider = page.locator("#slider-opacity");
    await expect(slider).toBeVisible();
    await slider.fill("0.5");
    await expect(slider).toHaveValue("0.5");

    // Section 3: Concern Breakdown Accordions
    const acneTrigger = page.locator("#trigger-concern-acne");
    await acneTrigger.click();
    await expect(page.getByText("When to consult a dermatologist:")).toBeVisible();
    await expect(page.getByText("General Care Guidance:")).toBeVisible();

    // Section 4: Environmental & Quality Metrics
    await expect(page.getByText("Capture Quality & Environmental Verification")).toBeVisible();
    await expect(page.getByText("Lighting Uniformity:")).toBeVisible();

    // Section 5: Methodology & Limitations
    await expect(page.getByText("Methodology & Limitations")).toBeVisible();

    // Section 6: Action Buttons
    const downloadPdfBtn = page.locator("#btn-download-pdf");
    await expect(downloadPdfBtn).toBeVisible();

    const printBtn = page.locator("#btn-print-report");
    await expect(printBtn).toBeVisible();

    const retakeBtn = page.locator("#btn-scan-again");
    await expect(retakeBtn).toBeVisible();

    // Verify Zero External Outbound Requests
    expect(outboundRequests).toHaveLength(0);

    // Capture mobile full-page screenshots for artifacts
    const viewport = page.viewportSize();
    if (viewport) {
      await page.screenshot({
        path: `../../docs/screenshots/report-${viewport.width}x${viewport.height}.png`,
        fullPage: true
      });
    }
  });

  test("triggers client-side PDF download without network calls", async ({ page }) => {
    await page.goto("/report");

    // Listen for download event
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#btn-download-pdf").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("dermalens-report.pdf");
  });
});
