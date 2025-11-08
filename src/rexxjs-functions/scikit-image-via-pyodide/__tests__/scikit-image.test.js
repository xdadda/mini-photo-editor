/**
 * Tests for Scikit-Image via PyOdide
 */

describe('Scikit-Image via PyOdide', () => {
  let skimage;
  let testImageData;

  beforeAll(async () => {
    skimage = await import('../scikit-image.js');

    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 10, 10);
    testImageData = ctx.getImageData(0, 0, 10, 10);

    try {
      await skimage.initializePyodide();
      console.log('✅ PyOdide+Scikit-Image initialized for tests');
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
    expect(typeof skimage.initializePyodide).toBe('function');
    expect(typeof skimage.denoiseTV).toBe('function');
    expect(typeof skimage.denoiseBilateral).toBe('function');
    expect(typeof skimage.cannyEdges).toBe('function');
    expect(typeof skimage.morphOpening).toBe('function');
    expect(typeof skimage.morphClosing).toBe('function');
    expect(typeof skimage.adjustGamma).toBe('function');
    expect(typeof skimage.equalizeAdaptive).toBe('function');
    expect(typeof skimage.unsharpMaskFilter).toBe('function');
  });

  // Test all 8 scikit-image filters individually

  test('denoiseTV should denoise image using total variation', async () => {
    if (skipIfNoPyodide()) return;

    const result = await skimage.denoiseTV(testImageData, 0.1);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
    expect(result.data.length).toBe(400);
  });

  test('denoiseBilateral should apply bilateral filtering', async () => {
    if (skipIfNoPyodide()) return;

    const result = await skimage.denoiseBilateral(testImageData, 0.05, 15);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('denoiseNLMeans should apply non-local means denoising', async () => {
    if (skipIfNoPyodide()) return;

    const result = await skimage.denoiseNLMeans(testImageData, 0.1);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('cannyEdges should detect edges using Canny algorithm', async () => {
    if (skipIfNoPyodide()) return;

    const result = await skimage.cannyEdges(testImageData, 1.0);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('morphOpening should perform morphological opening', async () => {
    if (skipIfNoPyodide()) return;

    const result = await skimage.morphOpening(testImageData, 3);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('morphClosing should perform morphological closing', async () => {
    if (skipIfNoPyodide()) return;

    const result = await skimage.morphClosing(testImageData, 3);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('adjustGamma should apply gamma correction', async () => {
    if (skipIfNoPyodide()) return;

    const result = await skimage.adjustGamma(testImageData, 1.5);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('adjustLog should apply logarithmic adjustment', async () => {
    if (skipIfNoPyodide()) return;

    const result = await skimage.adjustLog(testImageData, 1.0);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('equalizeAdaptive should apply adaptive histogram equalization', async () => {
    if (skipIfNoPyodide()) return;

    const result = await skimage.equalizeAdaptive(testImageData, 0.03);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('rescaleIntensity should rescale intensity range', async () => {
    if (skipIfNoPyodide()) return;

    const result = await skimage.rescaleIntensity(testImageData);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('unsharpMaskFilter should sharpen image', async () => {
    if (skipIfNoPyodide()) return;

    const result = await skimage.unsharpMaskFilter(testImageData, 1.0, 1.0);
    expect(result).toBeInstanceOf(ImageData);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });
});

describe('Scikit-Image Optimized for REXX', () => {
  let skimageRexx;

  beforeAll(async () => {
    skimageRexx = await import('../scikit-image-optimized-for-rexx.js');

    try {
      await skimageRexx.initializePyodide();
    } catch (error) {
      console.warn('⚠️ PyOdide not available for REXX tests:', error.message);
    }
  }, 60000);

  test('should export REXX-style function names', () => {
    expect(typeof skimageRexx.SKIMAGE_DENOISE_TV).toBe('function');
    expect(typeof skimageRexx.SKIMAGE_DENOISE_BILATERAL).toBe('function');
    expect(typeof skimageRexx.SKIMAGE_CANNY_EDGES).toBe('function');
    expect(typeof skimageRexx.SKIMAGE_MORPH_OPENING).toBe('function');
    expect(typeof skimageRexx.SKIMAGE_MORPH_CLOSING).toBe('function');
    expect(typeof skimageRexx.SKIMAGE_ADJUST_GAMMA).toBe('function');
    expect(typeof skimageRexx.SKIMAGE_EQUALIZE_ADAPTIVE).toBe('function');
    expect(typeof skimageRexx.SKIMAGE_UNSHARP_MASK).toBe('function');
    expect(typeof skimageRexx.SKIMAGE_META).toBe('function');
  });

  test('SKIMAGE_META should return metadata', () => {
    const meta = skimageRexx.SKIMAGE_META();

    expect(meta.canonical).toBe('org.rexxjs/scikit-image-via-pyodide');
    expect(meta.name).toBe('Scikit-Image Processing');
    expect(Array.isArray(meta.provides.functions)).toBe(true);
    expect(meta.provides.functions).toContain('SKIMAGE_DENOISE_TV');
    expect(meta.provides.functions).toContain('SKIMAGE_CANNY_EDGES');
    expect(meta.provides.functions.length).toBe(8);
  });
});
