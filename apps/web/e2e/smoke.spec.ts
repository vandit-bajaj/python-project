import { expect, test } from "@playwright/test";

test.describe("DermaLens Mobile Smoke & Privacy Verification", () => {
  test("loads landing page with zero external outbound requests", async ({ page }) => {
    const outboundRequests: string[] = [];

    // Listen to every outgoing request initiated by the page
    page.on("request", (req) => {
      const url = req.url();
      // Allow localhost same-origin, data URLs, and blob URLs
      if (!url.startsWith("http://localhost:3000") && !url.startsWith("data:") && !url.startsWith("blob:")) {
        outboundRequests.push(url);
      }
    });

    await page.goto("/");

    // Verify main header and brand presence
    await expect(page.locator("h1")).toHaveText("DermaLens");
    await expect(page.getByText("100% On-Device")).toBeVisible();

    // Verify primary action buttons meet mobile touch target minimum (44px)
    const scanBtn = page.locator("#btn-scan-camera");
    await expect(scanBtn).toBeVisible();
    const scanBox = await scanBtn.boundingBox();
    expect(scanBox).not.toBeNull();
    if (scanBox) {
      expect(scanBox.height).toBeGreaterThanOrEqual(44);
    }

    const uploadBtn = page.locator("#btn-upload-photo");
    await expect(uploadBtn).toBeVisible();
    const uploadBox = await uploadBtn.boundingBox();
    expect(uploadBox).not.toBeNull();
    if (uploadBox) {
      expect(uploadBox.height).toBeGreaterThanOrEqual(44);
    }

    // Assert strictly zero outbound requests occurred
    expect(outboundRequests).toHaveLength(0);

    // Capture mobile viewport screenshot
    const viewport = page.viewportSize();
    const screenshotName = viewport
      ? `docs/screenshots/landing-${viewport.width}x${viewport.height}.png`
      : "docs/screenshots/landing-mobile.png";
    await page.screenshot({ path: `../../${screenshotName}`, fullPage: true });
  });
});
