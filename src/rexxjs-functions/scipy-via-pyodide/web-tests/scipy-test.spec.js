/**
 * Playwright Browser Tests for SciPy via PyOdide
 * These tests actually run PyOdide in a real browser
 */

const { test, expect } = require('@playwright/test');

test.describe('SciPy via PyOdide - Browser Tests', () => {
  test.setTimeout(120000); // 2 minutes for PyOdide loading

  test('should load PyOdide and run all 8 SciPy filters', async ({ page }) => {
    console.log('Navigating to SciPy test harness...');
    await page.goto('http://localhost:8083/src/rexxjs-functions/scipy-via-pyodide/web-tests/test-harness.html');

    // Wait for test harness to be ready
    await expect(page).toHaveTitle('SciPy PyOdide Test Harness');

    console.log('Clicking run button to execute SciPy tests...');
    await page.click('#runBtn');

    // Wait for all tests to complete (PyOdide load + 8 filters)
    console.log('Waiting for tests to complete...');
    await page.waitForSelector('#status:has-text("All tests passed!")', { timeout: 90000 });

    // Get test results
    const logContent = await page.textContent('#log');
    console.log('Test output:', logContent);

    // Verify all filters were tested
    expect(logContent).toContain('Testing Gaussian Filter');
    expect(logContent).toContain('Testing Sobel Filter');
    expect(logContent).toContain('Testing Median Filter');
    expect(logContent).toContain('Testing Laplace Filter');
    expect(logContent).toContain('Testing Uniform Filter');
    expect(logContent).toContain('Testing Morphological Erosion');
    expect(logContent).toContain('Testing Morphological Dilation');
    expect(logContent).toContain('Testing Unsharp Mask');

    // Verify all tests passed
    expect(logContent).toContain('✓ Gaussian Filter: PASSED');
    expect(logContent).toContain('✓ Sobel Filter: PASSED');
    expect(logContent).toContain('✓ Median Filter: PASSED');
    expect(logContent).toContain('✓ Laplace Filter: PASSED');
    expect(logContent).toContain('✓ Uniform Filter: PASSED');
    expect(logContent).toContain('✓ Morphological Erosion: PASSED');
    expect(logContent).toContain('✓ Morphological Dilation: PASSED');
    expect(logContent).toContain('✓ Unsharp Mask: PASSED');

    // Final status check
    const status = await page.textContent('#status');
    expect(status).toContain('All tests passed!');
  });
});
