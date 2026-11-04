import { expect, test } from "@playwright/test";

test.describe("DermaLens Mobile Capture & Quality Gate E2E", () => {
  test("permission primer and upload mode navigation with zero outbound requests", async ({ page }) => {
    const outboundRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (!url.startsWith("http://localhost:3000") && !url.startsWith("data:") && !url.startsWith("blob:")) {
        outboundRequests.push(url);
      }
    });

    await page.goto("/scan");

    // Expect Permission Primer
    await expect(page.getByText("Camera Access Required")).toBeVisible();
    await expect(page.locator("#btn-enable-camera")).toBeVisible();

    // Switch to Upload Tab
    const uploadTab = page.locator("#tab-upload");
    await uploadTab.click();
    await expect(page.getByText("Upload a Face Photo")).toBeVisible();
    await expect(page.locator("#btn-choose-photo")).toBeVisible();

    // Switch back to Camera Tab
    const cameraTab = page.locator("#tab-camera");
    await cameraTab.click();
    await expect(page.getByText("Camera Access Required")).toBeVisible();

    // Capture scan primer screenshot
    const viewport = page.viewportSize();
    const screenshotName = viewport
      ? `docs/screenshots/scan-${viewport.width}x${viewport.height}.png`
      : "docs/screenshots/scan-mobile.png";
    await page.screenshot({ path: `../../${screenshotName}`, fullPage: true });

    // Assert strictly zero outbound requests
    expect(outboundRequests).toHaveLength(0);
  });

  test("runs fake camera stream and manual capture on supported browser", async ({ page, browserName }) => {
    // WebKit cannot run Chromium fake-device flags
    test.skip(browserName === "webkit", "Fake camera streaming is automated on Chromium; WebKit is tested on physical device.");

    const outboundRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (!url.startsWith("http://localhost:3000") && !url.startsWith("data:") && !url.startsWith("blob:")) {
        outboundRequests.push(url);
      }
    });

    await page.goto("/scan");

    // Click Enable Camera
    const enableBtn = page.locator("#btn-enable-camera");
    await enableBtn.click();

    // Verify video stream renders
    const video = page.locator("video");
    await expect(video).toBeVisible();

    // Verify guidance pill is present
    const guidancePill = page.locator("#guidance-pill");
    await expect(guidancePill).toBeVisible();

    // Verify manual shutter button
    const shutter = page.locator("#btn-shutter");
    await expect(shutter).toBeVisible();
    await shutter.click();

    // Review screen should now be displayed
    await expect(page.getByText("Capture Review")).toBeVisible();
    await expect(page.locator("#captured-preview-canvas")).toBeVisible();

    // Test retake
    const retakeBtn = page.locator("#btn-retake");
    await expect(retakeBtn).toBeVisible();
    await retakeBtn.click();

    // Should return back to streaming
    await expect(page.locator("video")).toBeVisible();

    // Zero external outbound requests
    expect(outboundRequests).toHaveLength(0);
  });
});
