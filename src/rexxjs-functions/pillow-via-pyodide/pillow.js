/**
 * Real Pillow (PIL) via PyOdide Integration
 * Uses PyOdide to provide full PIL/Pillow image processing compatibility
 */

let pyodideHandler = null;
let pyodideInitialized = false;

/**
 * Initialize PyOdide and load Pillow
 */
async function initializePyodide() {
  if (pyodideInitialized) return;

  try {
    if (typeof window !== 'undefined' && window.ADDRESS_PYODIDE_HANDLER) {
      pyodideHandler = window.ADDRESS_PYODIDE_HANDLER;
    } else if (typeof global !== 'undefined' && global.ADDRESS_PYODIDE_HANDLER) {
      pyodideHandler = global.ADDRESS_PYODIDE_HANDLER;
    } else if (typeof loadPyodide !== 'undefined') {
      const pyodide = await loadPyodide();
      await pyodide.loadPackage(['Pillow']);

      pyodideHandler = {
        run: async (method, params) => {
          if (params && params.code) {
            return await pyodide.runPythonAsync(params.code);
          }
          return await pyodide.runPythonAsync(method);
        },
        set_context: async (method, params) => {
          pyodide.globals.set(params.key, params.value);
        }
      };
    } else {
      throw new Error('PyOdide not available');
    }

    await runPython(`
from PIL import Image, ImageFilter, ImageEnhance, ImageOps
import io
import base64
`);

    pyodideInitialized = true;
    console.log('✅ Pillow initialized via PyOdide');
  } catch (error) {
    throw new Error(`Failed to initialize Pillow: ${error.message}`);
  }
}

async function runPython(code) {
  await initializePyodide();
  if (pyodideHandler.run) {
    return await pyodideHandler.run(code, { code });
  }
  throw new Error('PyOdide handler not initialized');
}

async function setContext(key, value) {
  await initializePyodide();
  if (pyodideHandler.set_context) {
    await pyodideHandler.set_context('set_context', { key, value });
  }
}

/**
 * Convert ImageData to PIL Image
 */
async function imageDataToPIL(imageData) {
  const { width, height, data } = imageData;
  const flatArray = Array.from(data);

  await setContext('img_width', width);
  await setContext('img_height', height);
  await setContext('img_data', flatArray);

  await runPython(`
import numpy as np
img_array = np.array(img_data, dtype=np.uint8).reshape((img_height, img_width, 4))
pil_image = Image.fromarray(img_array, mode='RGBA')
`);
}

/**
 * Convert PIL Image back to ImageData
 */
async function pilToImageData(width, height) {
  const result = await runPython(`
img_array = np.array(pil_image)
img_array.flatten().tolist()
`);

  const uint8Array = new Uint8ClampedArray(result);
  return new ImageData(uint8Array, width, height);
}

// ============================================================================
// PILLOW FILTERS
// ============================================================================

/**
 * Apply BLUR filter
 */
async function blurFilter(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await runPython(`
pil_image = pil_image.filter(ImageFilter.BLUR)
`);

  return await pilToImageData(width, height);
}

/**
 * Apply CONTOUR filter
 */
async function contourFilter(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await runPython(`
pil_image = pil_image.filter(ImageFilter.CONTOUR)
`);

  return await pilToImageData(width, height);
}

/**
 * Apply DETAIL filter
 */
async function detailFilter(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await runPython(`
pil_image = pil_image.filter(ImageFilter.DETAIL)
`);

  return await pilToImageData(width, height);
}

/**
 * Apply EDGE_ENHANCE filter
 */
async function edgeEnhanceFilter(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await runPython(`
pil_image = pil_image.filter(ImageFilter.EDGE_ENHANCE)
`);

  return await pilToImageData(width, height);
}

/**
 * Apply EDGE_ENHANCE_MORE filter
 */
async function edgeEnhanceMoreFilter(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await runPython(`
pil_image = pil_image.filter(ImageFilter.EDGE_ENHANCE_MORE)
`);

  return await pilToImageData(width, height);
}

/**
 * Apply EMBOSS filter
 */
async function embossFilter(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await runPython(`
pil_image = pil_image.filter(ImageFilter.EMBOSS)
`);

  return await pilToImageData(width, height);
}

/**
 * Apply FIND_EDGES filter
 */
async function findEdgesFilter(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await runPython(`
pil_image = pil_image.filter(ImageFilter.FIND_EDGES)
`);

  return await pilToImageData(width, height);
}

/**
 * Apply SHARPEN filter
 */
async function sharpenFilter(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await runPython(`
pil_image = pil_image.filter(ImageFilter.SHARPEN)
`);

  return await pilToImageData(width, height);
}

/**
 * Apply SMOOTH filter
 */
async function smoothFilter(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await runPython(`
pil_image = pil_image.filter(ImageFilter.SMOOTH)
`);

  return await pilToImageData(width, height);
}

/**
 * Enhance brightness
 */
async function enhanceBrightness(imageData, factor = 1.5) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await setContext('factor_value', factor);
  await runPython(`
enhancer = ImageEnhance.Brightness(pil_image)
pil_image = enhancer.enhance(factor_value)
`);

  return await pilToImageData(width, height);
}

/**
 * Enhance contrast
 */
async function enhanceContrast(imageData, factor = 1.5) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await setContext('factor_value', factor);
  await runPython(`
enhancer = ImageEnhance.Contrast(pil_image)
pil_image = enhancer.enhance(factor_value)
`);

  return await pilToImageData(width, height);
}

/**
 * Enhance color
 */
async function enhanceColor(imageData, factor = 1.5) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await setContext('factor_value', factor);
  await runPython(`
enhancer = ImageEnhance.Color(pil_image)
pil_image = enhancer.enhance(factor_value)
`);

  return await pilToImageData(width, height);
}

/**
 * Enhance sharpness
 */
async function enhanceSharpness(imageData, factor = 2.0) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await setContext('factor_value', factor);
  await runPython(`
enhancer = ImageEnhance.Sharpness(pil_image)
pil_image = enhancer.enhance(factor_value)
`);

  return await pilToImageData(width, height);
}

/**
 * Auto-contrast
 */
async function autoContrast(imageData, cutoff = 0) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await setContext('cutoff_value', cutoff);
  await runPython(`
pil_image = ImageOps.autocontrast(pil_image, cutoff=int(cutoff_value))
`);

  return await pilToImageData(width, height);
}

/**
 * Equalize histogram
 */
async function equalize(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await runPython(`
pil_image = ImageOps.equalize(pil_image)
`);

  return await pilToImageData(width, height);
}

/**
 * Posterize (reduce colors)
 */
async function posterize(imageData, bits = 4) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await setContext('bits_value', bits);
  await runPython(`
pil_image = ImageOps.posterize(pil_image, int(bits_value))
`);

  return await pilToImageData(width, height);
}

/**
 * Solarize
 */
async function solarize(imageData, threshold = 128) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);

  await setContext('threshold_value', threshold);
  await runPython(`
pil_image = ImageOps.solarize(pil_image, threshold=int(threshold_value))
`);

  return await pilToImageData(width, height);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initializePyodide,
  blurFilter,
  contourFilter,
  detailFilter,
  edgeEnhanceFilter,
  edgeEnhanceMoreFilter,
  embossFilter,
  findEdgesFilter,
  sharpenFilter,
  smoothFilter,
  enhanceBrightness,
  enhanceContrast,
  enhanceColor,
  enhanceSharpness,
  autoContrast,
  equalize,
  posterize,
  solarize
};

export {
  initializePyodide,
  blurFilter,
  contourFilter,
  detailFilter,
  edgeEnhanceFilter,
  edgeEnhanceMoreFilter,
  embossFilter,
  findEdgesFilter,
  sharpenFilter,
  smoothFilter,
  enhanceBrightness,
  enhanceContrast,
  enhanceColor,
  enhanceSharpness,
  autoContrast,
  equalize,
  posterize,
  solarize
};

if (typeof window !== 'undefined') {
  window.pillow_via_pyodide = {
    initializePyodide,
    blurFilter,
    contourFilter,
    detailFilter,
    edgeEnhanceFilter,
    edgeEnhanceMoreFilter,
    embossFilter,
    findEdgesFilter,
    sharpenFilter,
    smoothFilter,
    enhanceBrightness,
    enhanceContrast,
    enhanceColor,
    enhanceSharpness,
    autoContrast,
    equalize,
    posterize,
    solarize
  };
}
