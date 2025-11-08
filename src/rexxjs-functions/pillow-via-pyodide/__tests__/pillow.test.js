/**
 * Tests for Pillow via PyOdide
 */

describe('Pillow via PyOdide', () => {
  let pillow;
  let testImageData;

  beforeAll(async () => {
    pillow = await import('../pillow.js');

    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 10, 10);
    testImageData = ctx.getImageData(0, 0, 10, 10);

    try {
      await pillow.initializePyodide();
      console.log('✅ PyOdide+Pillow initialized for tests');
    } catch (error) {
      console.warn('⚠️ PyOdide not available, skipping tests:', error.message);
    }
  }, 60000);

  const skipIfNoPyodide = () => {
    if (typeof loadPyodide === 'undefined') {
      console.log('Skipping test - PyOdide not available');
      return true;
    }
    return false;
  };

  test('should export expected functions', () => {
    expect(typeof pillow.initializePyodide).toBe('function');
    expect(typeof pillow.blurFilter).toBe('function');
    expect(typeof pillow.sharpenFilter).toBe('function');
    expect(typeof pillow.embossFilter).toBe('function');
  });

  test('blurFilter should process image', async () => {
    if (skipIfNoPyodide()) return;

    const result = await pillow.blurFilter(testImageData);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('sharpenFilter should process image', async () => {
    if (skipIfNoPyodide()) return;

    const result = await pillow.sharpenFilter(testImageData);
    expect(result).toBeInstanceOf(ImageData);
  });

  test('enhanceContrast should adjust contrast', async () => {
    if (skipIfNoPyodide()) return;

    const result = await pillow.enhanceContrast(testImageData, 1.5);
    expect(result).toBeInstanceOf(ImageData);
  });

  test('autoContrast should adjust contrast automatically', async () => {
    if (skipIfNoPyodide()) return;

    const result = await pillow.autoContrast(testImageData, 0);
    expect(result).toBeInstanceOf(ImageData);
  });
});

describe('Pillow Optimized for REXX', () => {
  let pillowRexx;

  beforeAll(async () => {
    pillowRexx = await import('../pillow-optimized-for-rexx.js');

    try {
      await pillowRexx.initializePyodide();
    } catch (error) {
      console.warn('⚠️ PyOdide not available for REXX tests:', error.message);
    }
  }, 60000);

  test('should export REXX-style function names', () => {
    expect(typeof pillowRexx.PIL_BLUR).toBe('function');
    expect(typeof pillowRexx.PIL_SHARPEN).toBe('function');
    expect(typeof pillowRexx.PILLOW_META).toBe('function');
  });

  test('PILLOW_META should return metadata', () => {
    const meta = pillowRexx.PILLOW_META();

    expect(meta.canonical).toBe('org.rexxjs/pillow-via-pyodide');
    expect(meta.name).toBe('Pillow Image Processing');
    expect(Array.isArray(meta.provides.functions)).toBe(true);
    expect(meta.provides.functions).toContain('PIL_BLUR');
  });
});
