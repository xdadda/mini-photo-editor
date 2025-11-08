import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/rexxjs-functions',
  testMatch: '**/*.spec.js',
  timeout: 150000, // 2.5 minutes for PyOdide tests
  fullyParallel: false, // Run sequentially to avoid resource conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid conflicts with PyOdide
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8083',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
