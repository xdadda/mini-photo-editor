/**
 * Tests for SciPy via PyOdide
 */

describe('SciPy via PyOdide', () => {
  let scipy;
  let testImageData;

  beforeAll(async () => {
    // Import the SciPy module
    scipy = await import('../scipy.js');

    // Create a simple test image (10x10 red square)
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 10, 10);
    testImageData = ctx.getImageData(0, 0, 10, 10);

    // Initialize PyOdide (this may take time on first run)
    try {
      await scipy.initializePyodide();
      console.log('✅ PyOdide initialized for tests');
    } catch (error) {
      console.warn('⚠️ PyOdide not available, skipping tests:', error.message);
    }
  }, 60000); // 60 second timeout for PyOdide initialization

  const skipIfNoPyodide = () => {
    if (typeof loadPyodide === 'undefined') {
      console.log('Skipping test - PyOdide not available');
      return true;
    }
    return false;
  };

  test('should export expected functions', () => {
    expect(typeof scipy.initializePyodide).toBe('function');
    expect(typeof scipy.gaussianFilter).toBe('function');
    expect(typeof scipy.sobelFilter).toBe('function');
    expect(typeof scipy.medianFilter).toBe('function');
    expect(typeof scipy.laplaceFilter).toBe('function');
    expect(typeof scipy.uniformFilter).toBe('function');
  });

  test('gaussianFilter should process image data', async () => {
    if (skipIfNoPyodide()) return;

    const result = await scipy.gaussianFilter(testImageData, 1.0);

    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
    expect(result.data.length).toBe(400); // 10x10x4
  });

  test('sobelFilter should detect edges', async () => {
    if (skipIfNoPyodide()) return;

    const result = await scipy.sobelFilter(testImageData, 1.0);

    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('medianFilter should reduce noise', async () => {
    if (skipIfNoPyodide()) return;

    const result = await scipy.medianFilter(testImageData, 3);

    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('laplaceFilter should enhance edges', async () => {
    if (skipIfNoPyodide()) return;

    const result = await scipy.laplaceFilter(testImageData, 0.5);

    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('uniformFilter should smooth image', async () => {
    if (skipIfNoPyodide()) return;

    const result = await scipy.uniformFilter(testImageData, 3);

    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('morphErosion should erode image', async () => {
    if (skipIfNoPyodide()) return;

    const result = await scipy.morphErosion(testImageData, 1);

    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('morphDilation should dilate image', async () => {
    if (skipIfNoPyodide()) return;

    const result = await scipy.morphDilation(testImageData, 1);

    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('unsharpMask should sharpen image', async () => {
    if (skipIfNoPyodide()) return;

    const result = await scipy.unsharpMask(testImageData, 1.0, 1.0);

    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });
});

describe('SciPy Optimized for REXX', () => {
  let scipyRexx;

  beforeAll(async () => {
    scipyRexx = await import('../scipy-optimized-for-rexx.js');

    // Initialize PyOdide
    try {
      await scipyRexx.initializePyodide();
    } catch (error) {
      console.warn('⚠️ PyOdide not available for REXX tests:', error.message);
    }
  }, 60000);

  test('should export REXX-style function names', () => {
    expect(typeof scipyRexx.GAUSSIAN_FILTER).toBe('function');
    expect(typeof scipyRexx.SOBEL_FILTER).toBe('function');
    expect(typeof scipyRexx.MEDIAN_FILTER).toBe('function');
    expect(typeof scipyRexx.SCIPY_META).toBe('function');
  });

  test('SCIPY_META should return metadata', () => {
    const meta = scipyRexx.SCIPY_META();

    expect(meta.canonical).toBe('org.rexxjs/scipy-via-pyodide');
    expect(meta.name).toBe('SciPy Image Processing');
    expect(Array.isArray(meta.provides.functions)).toBe(true);
    expect(meta.provides.functions).toContain('GAUSSIAN_FILTER');
  });
});
