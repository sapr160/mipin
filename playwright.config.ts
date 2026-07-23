import { defineConfig, devices } from "@playwright/test";

/**
 * The repo's single, standing test seam: the browser/HTTP boundary, exercised
 * against a production build (`next build` + `next start`). CI-runnable — the
 * webServer builds and starts the app itself, so `npx playwright test` is
 * self-contained. See spec #18 (cluster 2) for why this is the only seam.
 */
const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
