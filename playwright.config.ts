import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
export const E2E_DB = "postgres://postgres:postgres@localhost:5432/newsinmail_e2e";
// 15:00 in Lagos on a fixed day, so every run sees the same schedule.
export const E2E_NOW = "2026-10-05T14:00:00Z";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: E2E_DB,
      NEWSINMAIL_NOW: E2E_NOW,
      NEWSINMAIL_OFFLINE: "1",
      NEWSINMAIL_SCHEDULER: "off",
      SESSION_SECRET: "e2e-secret-e2e-secret-e2e-secret",
      SMTP_URL: "",
      OPENROUTER_API_KEY: "",
    },
  },
});
