import { defineConfig, devices } from "@playwright/test";

// Load `.env.local` into the test process so the auth fixture can reach the
// `mipin-test` project with the service role (Next loads it for the webServer
// on its own; this covers the Playwright process too). Absent in bare lanes —
// the auth-fixture specs then stay skipped behind RUN_DB_CONNECTIVITY.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local — fine; the gated specs skip.
}

/**
 * The repo's single, standing test seam: the browser/HTTP boundary, exercised
 * against a production build (`next build` + `next start`). CI-runnable — the
 * webServer builds and starts the app itself, so `npx playwright test` is
 * self-contained. See spec #18 (cluster 2) for why this is the only seam.
 *
 * Two servers share one build to exercise both branches of the `KOFI_URL`
 * env gate without a second `next build`: the default server on :3000 starts
 * without it (Ko-fi absent), and a second server on :3100 starts with it set
 * (Ko-fi present). The env is read at request time in the footer Server
 * Component, so the same build serves both. The build server clears `.next`
 * first and the :3100 command waits for the fresh BUILD_ID to appear, so it
 * can't start against a stale or mid-rebuild output.
 */
const PORT = 3000;
const KOFI_PORT = 3100;
const baseURL = `http://localhost:${PORT}`;
const kofiBaseURL = `http://localhost:${KOFI_PORT}`;

// Remove the previous build's BUILD_ID up front so the wait below keys off
// *this* build finishing, not a marker an earlier run left behind.
const rmBuildId = "node -e \"require('fs').rmSync('.next/BUILD_ID',{force:true})\"";

// Portable, dependency-free wait: after a 1s head start (so the build server's
// BUILD_ID deletion has certainly run), poll until the marker (re)appears, then
// hand off to `next start` on the Ko-fi port.
const waitForBuild =
  "node -e \"const fs=require('fs');const w=()=>{try{fs.accessSync('.next/BUILD_ID');process.exit(0)}catch(e){setTimeout(w,300)}};setTimeout(w,1000)\"";

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
      // The Ko-fi "present" case needs the :3100 server; everything else
      // (including the "absent" case) runs against the default :3000 server.
      testIgnore: /kofi-present\.spec\.ts/,
    },
    {
      name: "kofi",
      use: { ...devices["Desktop Chrome"], baseURL: kofiBaseURL },
      testMatch: /kofi-present\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: `${rmBuildId} && npm run build && npm run start`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: `${waitForBuild} && npm run start -- --port ${KOFI_PORT}`,
      url: kofiBaseURL,
      env: { KOFI_URL: "https://ko-fi.com/mipintest" },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
