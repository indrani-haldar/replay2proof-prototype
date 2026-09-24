const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  outputDir: 'test-results',
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL,
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'on'
  }
});
