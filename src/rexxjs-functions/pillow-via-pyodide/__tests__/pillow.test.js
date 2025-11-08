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
    expect(typeof pillow.findEdgesFilter).toBe('function');
    expect(typeof pillow.contourFilter).toBe('function');
    expect(typeof pillow.detailFilter).toBe('function');
    expect(typeof pillow.smoothFilter).toBe('function');
    expect(typeof pillow.edgeEnhanceFilter).toBe('function');
    expect(typeof pillow.autoContrast).toBe('function');
    expect(typeof pillow.equalize).toBe('function');
    expect(typeof pillow.posterize).toBe('function');
    expect(typeof pillow.solarize).toBe('function');
  });

  // Test all 12 Pillow filters individually

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

  test('embossFilter should create emboss effect', async () => {
    if (skipIfNoPyodide()) return;

    const result = await pillow.embossFilter(testImageData);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('findEdgesFilter should detect edges', async () => {
    if (skipIfNoPyodide()) return;

    const result = await pillow.findEdgesFilter(testImageData);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('contourFilter should detect contours', async () => {
    if (skipIfNoPyodide()) return;

    const result = await pillow.contourFilter(testImageData);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('detailFilter should enhance detail', async () => {
    if (skipIfNoPyodide()) return;

    const result = await pillow.detailFilter(testImageData);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('smoothFilter should smooth image', async () => {
    if (skipIfNoPyodide()) return;

    const result = await pillow.smoothFilter(testImageData);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('edgeEnhanceFilter should enhance edges', async () => {
    if (skipIfNoPyodide()) return;

    const result = await pillow.edgeEnhanceFilter(testImageData);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('edgeEnhanceMoreFilter should enhance edges more aggressively', async () => {
    if (skipIfNoPyodide()) return;

    const result = await pillow.edgeEnhanceMoreFilter(testImageData);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
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

  test('equalize should equalize histogram', async () => {
    if (skipIfNoPyodide()) return;

    const result = await pillow.equalize(testImageData);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('posterize should reduce colors', async () => {
    if (skipIfNoPyodide()) return;

    const result = await pillow.posterize(testImageData, 4);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('solarize should apply solarization effect', async () => {
    if (skipIfNoPyodide()) return;

    const result = await pillow.solarize(testImageData, 128);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
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
    expect(typeof pillowRexx.PIL_EMBOSS).toBe('function');
    expect(typeof pillowRexx.PIL_FIND_EDGES).toBe('function');
    expect(typeof pillowRexx.PIL_CONTOUR).toBe('function');
    expect(typeof pillowRexx.PIL_DETAIL).toBe('function');
    expect(typeof pillowRexx.PIL_SMOOTH).toBe('function');
    expect(typeof pillowRexx.PIL_EDGE_ENHANCE).toBe('function');
    expect(typeof pillowRexx.PIL_AUTOCONTRAST).toBe('function');
    expect(typeof pillowRexx.PIL_EQUALIZE).toBe('function');
    expect(typeof pillowRexx.PIL_POSTERIZE).toBe('function');
    expect(typeof pillowRexx.PIL_SOLARIZE).toBe('function');
    expect(typeof pillowRexx.PIL_ENHANCE_BRIGHTNESS).toBe('function');
    expect(typeof pillowRexx.PIL_ENHANCE_CONTRAST).toBe('function');
    expect(typeof pillowRexx.PIL_ENHANCE_COLOR).toBe('function');
    expect(typeof pillowRexx.PILLOW_META).toBe('function');
  });

  test('PILLOW_META should return metadata', () => {
    const meta = pillowRexx.PILLOW_META();

    expect(meta.canonical).toBe('org.rexxjs/pillow-via-pyodide');
    expect(meta.name).toBe('Pillow Image Processing');
    expect(Array.isArray(meta.provides.functions)).toBe(true);
    expect(meta.provides.functions).toContain('PIL_BLUR');
    expect(meta.provides.functions).toContain('PIL_SHARPEN');
    expect(meta.provides.functions).toContain('PIL_AUTOCONTRAST');
    expect(meta.provides.functions.length).toBe(15); // 12 filters + 3 enhance functions
  });
});
