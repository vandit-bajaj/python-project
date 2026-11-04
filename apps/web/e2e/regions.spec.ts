import { expect, test } from "@playwright/test";

test.describe("DermaLens Region & Geometry Visualizer E2E", () => {
  test("renders debug regions visualizer with zero outbound requests", async ({ page }) => {
    const outboundRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (!url.startsWith("http://localhost:3000") && !url.startsWith("data:") && !url.startsWith("blob:")) {
        outboundRequests.push(url);
      }
    });

    await page.goto("/debug/regions");

    // Header & canvas check
    await expect(page.locator("h1")).toContainText("Region & Geometry Engine Visualizer");
    const canvas = page.locator("#debug-regions-canvas");
    await expect(canvas).toBeVisible();

    // Toggle region select
    const select = page.locator("#select-region");
    await select.selectOption("forehead");
    await expect(select).toHaveValue("forehead");

    // Toggle skin mask button
    const toggleBtn = page.locator("#btn-toggle-mask");
    await expect(toggleBtn).toHaveText("Enabled");
    await toggleBtn.click();
    await expect(toggleBtn).toHaveText("Disabled");

    // Verify metrics text
    await expect(page.getByText("Iris Reference Scale:")).toBeVisible();
    await expect(page.getByText("CIELAB Coordinates:")).toBeVisible();

    // Zero external outbound requests
    expect(outboundRequests).toHaveLength(0);
  });
});
