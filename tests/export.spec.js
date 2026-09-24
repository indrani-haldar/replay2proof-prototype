const { test, expect } = require('@playwright/test');
const fs = require('fs');

// The Jira key in the test name creates an obvious Jira-to-code link.
test('[KAN-1] Export starts a download', async ({ page }, testInfo) => {
  const consoleErrors = [];
  const failedRequests = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('requestfailed', request => {
    failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'unknown'}`);
  });

  await page.goto('/');
  await page.getByTestId('export-button').click();
  await expect(page.getByTestId('download-status')).toHaveText('Download started');

  fs.mkdirSync(testInfo.outputDir, { recursive: true });
  fs.writeFileSync(`${testInfo.outputDir}/browser-evidence.json`, JSON.stringify({
    url: page.url(),
    consoleErrors,
    failedRequests,
    expected: 'Download started',
    capturedAt: new Date().toISOString()
  }, null, 2));
});
