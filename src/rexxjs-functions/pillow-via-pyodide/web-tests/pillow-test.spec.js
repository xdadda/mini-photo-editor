/**
 * Playwright Browser Tests for Pillow via PyOdide
 */

const { test, expect } = require('@playwright/test');

test.describe('Pillow via PyOdide - Browser Tests', () => {
  test.setTimeout(120000);

  test('should load PyOdide and run all 12 Pillow filters', async ({ page }) => {
    console.log('Navigating to Pillow test harness...');
    await page.goto('http://localhost:8083/src/rexxjs-functions/pillow-via-pyodide/web-tests/test-harness.html');

    await expect(page).toHaveTitle('Pillow PyOdide Test Harness');

    console.log('Clicking run button to execute Pillow tests...');
    await page.click('#runBtn');

    console.log('Waiting for tests to complete...');
    await page.waitForSelector('#status:has-text("All tests passed!")', { timeout: 90000 });

    const logContent = await page.textContent('#log');
    console.log('Test output:', logContent);

    // Verify all 12 filters were tested
    expect(logContent).toContain('Testing Blur Filter');
    expect(logContent).toContain('Testing Sharpen Filter');
    expect(logContent).toContain('Testing Emboss Filter');
    expect(logContent).toContain('Testing Find Edges Filter');
    expect(logContent).toContain('Testing Contour Filter');
    expect(logContent).toContain('Testing Detail Filter');
    expect(logContent).toContain('Testing Smooth Filter');
    expect(logContent).toContain('Testing Edge Enhance Filter');
    expect(logContent).toContain('Testing Auto-Contrast');
    expect(logContent).toContain('Testing Equalize');
    expect(logContent).toContain('Testing Posterize');
    expect(logContent).toContain('Testing Solarize');

    // Verify all passed
    expect(logContent).toContain('✓ Blur Filter: PASSED');
    expect(logContent).toContain('All 12/12 Pillow tests passed!');

    const status = await page.textContent('#status');
    expect(status).toContain('All tests passed!');
  });
});
