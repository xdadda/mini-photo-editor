/**
 * Playwright Browser Tests for Scikit-Image via PyOdide
 */

const { test, expect } = require('@playwright/test');

test.describe('Scikit-Image via PyOdide - Browser Tests', () => {
  test.setTimeout(150000); // 2.5 minutes - scikit-image is larger

  test('should load PyOdide and run all 8 Scikit-Image filters', async ({ page }) => {
    console.log('Navigating to Scikit-Image test harness...');
    await page.goto('http://localhost:8083/src/rexxjs-functions/scikit-image-via-pyodide/web-tests/test-harness.html');

    await expect(page).toHaveTitle('Scikit-Image PyOdide Test Harness');

    console.log('Clicking run button to execute Scikit-Image tests...');
    await page.click('#runBtn');

    console.log('Waiting for tests to complete (this may take a while)...');
    await page.waitForSelector('#status:has-text("All tests passed!")', { timeout: 120000 });

    const logContent = await page.textContent('#log');
    console.log('Test output:', logContent);

    // Verify all 8 filters were tested
    expect(logContent).toContain('Testing TV Denoise');
    expect(logContent).toContain('Testing Bilateral Denoise');
    expect(logContent).toContain('Testing Canny Edge Detection');
    expect(logContent).toContain('Testing Morphological Opening');
    expect(logContent).toContain('Testing Morphological Closing');
    expect(logContent).toContain('Testing Gamma Adjustment');
    expect(logContent).toContain('Testing Adaptive Equalization');
    expect(logContent).toContain('Testing Unsharp Mask');

    // Verify all passed
    expect(logContent).toContain('All 8/8 Scikit-Image tests passed!');

    const status = await page.textContent('#status');
    expect(status).toContain('All tests passed!');
  });
});
