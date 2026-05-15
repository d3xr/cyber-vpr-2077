import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Headless chromium, prod-only, one retry per spec
 * (most flakes are typewriter timing).
 *
 * Target URL is NOT hardcoded — set CVPR_BASE_URL (see scripts/deploy.env):
 *   CVPR_BASE_URL=https://your-domain/ npx playwright test e2e/
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // many tests touch shared localStorage/leaderboard — keep deterministic
  retries: 1,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.CVPR_BASE_URL || 'http://localhost:4173/',
    headless: true,
    actionTimeout: 12_000,
    navigationTimeout: 30_000,
    viewport: { width: 1440, height: 900 },
    locale: 'ru-RU',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
