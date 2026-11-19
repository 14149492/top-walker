import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', timeout: 60000, expect: { timeout: 15000 }, workers: 1,
  use: { baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000', channel: 'msedge', headless: true, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [360, 768, 1920].map(width => ({ name: `width-${width}`, use: { viewport: { width, height: 1080 } } })),
});
