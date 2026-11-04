import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "Mobile Chrome (360x800)",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 360, height: 800 }
      }
    },
    {
      name: "Mobile Safari (390x844)",
      use: {
        ...devices["iPhone 14"],
        viewport: { width: 390, height: 844 }
      }
    }
  ],
  webServer: {
    command: "pnpm start",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
