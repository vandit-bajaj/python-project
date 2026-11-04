import { expect, test } from "@playwright/test";

test.describe("DermaLens Analyzers v1 Visualizer E2E", () => {
  test("renders analyzers visualizer, computes scores, and validates zero outbound requests", async ({ page }) => {
    const outboundRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (!url.startsWith("http://localhost:3000") && !url.startsWith("data:") && !url.startsWith("blob:")) {
        outboundRequests.push(url);
      }
    });

    await page.goto("/debug/analyzers");

    // Header & Canvas check
    await expect(page.locator("h1")).toContainText("Skin Analyzers v1 Visualizer");
    const canvas = page.locator("#heatmap-canvas");
    await expect(canvas).toBeVisible();

    // Verify all analyzer chips exist
    await expect(page.locator("#btn-analyzer-redness")).toBeVisible();
    await expect(page.locator("#btn-analyzer-pigmentation")).toBeVisible();
    await expect(page.locator("#btn-analyzer-oiliness")).toBeVisible();
    await expect(page.locator("#btn-analyzer-texture")).toBeVisible();
    await expect(page.locator("#btn-analyzer-acne")).toBeVisible();
    await expect(page.locator("#btn-analyzer-wrinkles")).toBeVisible();
    await expect(page.locator("#btn-analyzer-darkCircles")).toBeVisible();

    // Check acne / blemish detection
    await page.locator("#btn-analyzer-acne").click();
    await expect(page.getByText("Estimated Count:")).toBeVisible();
    await expect(page.getByText("Severity Band:")).toBeVisible();

    // Check wrinkles (Beta tier)
    await page.locator("#btn-analyzer-wrinkles").click();
    await expect(page.locator("#badge-beta")).toBeVisible();

    // Check dark circles (Beta tier)
    await page.locator("#btn-analyzer-darkCircles").click();
    await expect(page.locator("#badge-beta")).toBeVisible();

    // Verify aggregate score and latency
    await expect(page.getByText("Overall Composite Analysis")).toBeVisible();
    await expect(page.getByText("Benchmark Latency:")).toBeVisible();

    // Zero external outbound requests
    expect(outboundRequests).toHaveLength(0);

    // Save screenshots for visual verification
    const viewport = page.viewportSize();
    if (viewport) {
      await page.screenshot({
        path: `../../docs/screenshots/analyzers-${viewport.width}x${viewport.height}.png`,
        fullPage: true
      });
    }
  });
});
