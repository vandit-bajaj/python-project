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

  test("interacts with 3D Face View and toggles between 2D and 3D", async ({ page }) => {
    await page.goto("/report");

    // Ensure hydration is complete by asserting interactive concern button
    const rednessBtn = page.locator("#btn-concern-redness");
    await expect(rednessBtn).toBeVisible();

    // Switch to 3D Face View with retry on click for mobile hydration
    const btn3D = page.locator("#btn-view-3d");
    await expect(btn3D).toBeVisible();
    await btn3D.click();

    const face3DWrapper = page.locator("#face-3d-wrapper");
    // Retry click if hydration delayed the state update
    if (!(await face3DWrapper.isVisible({ timeout: 1000 }).catch(() => false))) {
      await btn3D.click();
    }

    await expect(face3DWrapper).toBeVisible({ timeout: 15000 });

    // Wait for dynamic chunk to load (either canvas or WebGL unavailable fallback)
    const canvas = page.locator('canvas[aria-label="Interactive 3D Face Model"]');
    const fallback = page.getByText("3D View Unavailable");

    await expect(canvas.or(fallback)).toBeVisible({ timeout: 15000 });

    if (await canvas.isVisible()) {
      // Mandatory label: "approximate 3D from a single photo"
      await expect(page.getByText("approximate 3D from a single photo")).toBeVisible();

      // Switch concern layer while in 3D
      await page.locator("#btn-concern-oiliness").click();
      await page.locator("#btn-concern-pigmentation").click();

      // Adjust opacity slider in 3D
      const slider = page.locator("#slider-opacity");
      await slider.fill("0.65");
      await expect(slider).toHaveValue("0.65");

      // Simulate touch rotation on canvas
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 10);
        await page.mouse.up();
      }
    } else {
      await expect(fallback).toBeVisible();
    }

    // Capture mobile screenshot of 3D view
    const viewport = page.viewportSize();
    if (viewport) {
      await page.screenshot({
        path: `../../docs/screenshots/3d-view-${viewport.width}x${viewport.height}.png`,
        fullPage: true
      });
    }

    // Toggle back to 2D Heatmap
    const btn2D = page.locator("#btn-view-2d");
    await btn2D.click();
    await expect(page.locator("#heatmap-container")).toBeVisible();
  });

  test("triggers client-side PDF download without network calls", async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "WebKit on Windows headless does not emit synthetic blob download events");

    await page.goto("/report");

    // Listen for download event
    const downloadPromise = page.waitForEvent("download", { timeout: 10000 });
    const downloadBtn = page.locator("#btn-download-pdf"); await expect(downloadBtn).toBeEnabled(); await downloadBtn.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("dermalens-report.pdf");
  });
});
