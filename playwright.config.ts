import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
// Container cloud menyediakan Chromium di luar cache Playwright; CI memakai `playwright install`.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const launchOptions = executablePath ? { executablePath } : {};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 5'], launchOptions } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions } },
  ],
  webServer: {
    // Endpoint analitik di origin yang sama agar e2e bisa menguji persetujuan (PRD S6); bawaan build tanpa endpoint.
    command: `VITE_TELEMETRY_ENDPOINT=/__telemetry pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
