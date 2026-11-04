import { expect, test } from "@playwright/test";

test.describe("DermaLens Transparency, Legal & Error Handling E2E", () => {
  test("navigates How It Measures, Privacy, and Terms with zero outbound requests", async ({ page }) => {
    const outboundRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (!url.startsWith("http://localhost:3000") && !url.startsWith("data:") && !url.startsWith("blob:")) {
        outboundRequests.push(url);
      }
    });

    // 1. Visit Home and test Skip Link
    await page.goto("/");
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
    await expect(page.locator("#main-content")).toBeVisible();

    // 2. Navigate to /how-it-measures
    await page.locator("#link-how-it-measures").click();
    await expect(page).toHaveURL(/\/how-it-measures/);
    await expect(page.locator("h1")).toContainText("How DermaLens Measures Your Skin");
    await expect(page.getByText("Anatomical Scale Calibration")).toBeVisible();
    await expect(page.getByText("Honest Scientific Limitations")).toBeVisible();

    // Capture mobile screenshot of scientific transparency page
    const viewport = page.viewportSize();
    if (viewport) {
      await page.screenshot({
        path: `../../docs/screenshots/how-it-measures-${viewport.width}x${viewport.height}.png`,
        fullPage: true
      });
    }

    // 3. Navigate to /privacy
    await page.goto("/privacy");
    await expect(page.locator("h1")).toContainText("Zero-Knowledge Privacy Policy");
    await expect(page.getByText("Zero Image Uploads")).toBeVisible();
    await expect(page.getByText("Zero Analytics, Tracking, or Advertising")).toBeVisible();
    await expect(page.getByText("Local-First IndexedDB Storage")).toBeVisible();

    // 4. Navigate to /terms
    await page.goto("/terms");
    await expect(page.locator("h1")).toContainText("Terms of Use & Cosmetic Disclaimer");
    await expect(page.getByText("Essential Medical Notice")).toBeVisible();
    await expect(page.getByText("When to See a Medical Doctor")).toBeVisible();

    // 5. Test 404 page
    await page.goto("/non-existent-route-404-test");
    await expect(page.locator("h1")).toContainText("Page Not Found");
    await expect(page.locator("#btn-return-home")).toBeVisible();

    // 6. Verify zero external outbound requests across all transparency routes
    expect(outboundRequests).toHaveLength(0);
  });
});
