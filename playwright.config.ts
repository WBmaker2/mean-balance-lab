import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${Number(process.env.PLAYWRIGHT_PORT ?? (process.env.CI ? 4173 : 4174))}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${Number(process.env.PLAYWRIGHT_PORT ?? (process.env.CI ? 4173 : 4174))}`,
    url: process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${Number(process.env.PLAYWRIGHT_PORT ?? (process.env.CI ? 4173 : 4174))}`,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === 'true',
  },
});
