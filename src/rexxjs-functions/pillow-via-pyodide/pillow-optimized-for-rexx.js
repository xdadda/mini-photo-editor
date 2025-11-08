/**
 * Optimized Pillow via PyOdide for REXX Integration
 *
 * Provides PIL/Pillow image processing with REXX-friendly function names
 */

let globalPyodideInstance = null;
let pyodideInitialized = false;
let initializationPromise = null;

async function initializePyodide() {
  if (pyodideInitialized) {
    return globalPyodideInstance;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  console.log('🚀 Initializing global PyOdide session for Pillow...');

  initializationPromise = (async () => {
    try {
      if (typeof loadPyodide === 'undefined') {
        throw new Error('PyOdide not available');
      }

      globalPyodideInstance = await loadPyodide();
      console.log('✅ PyOdide loaded');

      console.log('📦 Loading Pillow package...');
      await globalPyodideInstance.loadPackage(['Pillow', 'numpy']);
      console.log('✅ Pillow loaded');

      await globalPyodideInstance.runPythonAsync(`
from PIL import Image, ImageFilter, ImageEnhance, ImageOps
import numpy as np
import sys

print(f"Pillow version: {Image.__version__}", file=sys.stderr)
`);

      pyodideInitialized = true;
      console.log('✅ Pillow initialized successfully');

      return globalPyodideInstance;
    } catch (error) {
      initializationPromise = null;
      throw new Error(`Failed to initialize Pillow: ${error.message}`);
    }
  })();

  return initializationPromise;
}

async function imageDataToPIL(imageData) {
  const pyodide = await initializePyodide();
  const { width, height, data } = imageData;
  const flatArray = Array.from(data);

  pyodide.globals.set('img_width', width);
  pyodide.globals.set('img_height', height);
  pyodide.globals.set('img_data', flatArray);

  await pyodide.runPythonAsync(`
img_array = np.array(img_data, dtype=np.uint8).reshape((img_height, img_width, 4))
pil_image = Image.fromarray(img_array, mode='RGBA')
`);
}

async function pilToImageData(width, height) {
  const pyodide = await initializePyodide();
  const result = await pyodide.runPythonAsync(`
img_array = np.array(pil_image)
img_array.flatten().tolist()
`);

  const uint8Array = new Uint8ClampedArray(result);
  return new ImageData(uint8Array, width, height);
}

// ============================================================================
// PILLOW FILTERS (REXX-callable)
// ============================================================================

async function PIL_BLUR(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);
  const pyodide = await initializePyodide();

  await pyodide.runPythonAsync('pil_image = pil_image.filter(ImageFilter.BLUR)');
  return await pilToImageData(width, height);
}

async function PIL_CONTOUR(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);
  const pyodide = await initializePyodide();

  await pyodide.runPythonAsync('pil_image = pil_image.filter(ImageFilter.CONTOUR)');
  return await pilToImageData(width, height);
}

async function PIL_DETAIL(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);
  const pyodide = await initializePyodide();

  await pyodide.runPythonAsync('pil_image = pil_image.filter(ImageFilter.DETAIL)');
  return await pilToImageData(width, height);
}

async function PIL_EDGE_ENHANCE(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);
  const pyodide = await initializePyodide();

  await pyodide.runPythonAsync('pil_image = pil_image.filter(ImageFilter.EDGE_ENHANCE)');
  return await pilToImageData(width, height);
}

async function PIL_EMBOSS(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);
  const pyodide = await initializePyodide();

  await pyodide.runPythonAsync('pil_image = pil_image.filter(ImageFilter.EMBOSS)');
  return await pilToImageData(width, height);
}

async function PIL_FIND_EDGES(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);
  const pyodide = await initializePyodide();

  await pyodide.runPythonAsync('pil_image = pil_image.filter(ImageFilter.FIND_EDGES)');
  return await pilToImageData(width, height);
}

async function PIL_SHARPEN(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);
  const pyodide = await initializePyodide();

  await pyodide.runPythonAsync('pil_image = pil_image.filter(ImageFilter.SHARPEN)');
  return await pilToImageData(width, height);
}

async function PIL_SMOOTH(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);
  const pyodide = await initializePyodide();

  await pyodide.runPythonAsync('pil_image = pil_image.filter(ImageFilter.SMOOTH)');
  return await pilToImageData(width, height);
}

async function PIL_ENHANCE_BRIGHTNESS(imageData, factor = 1.5) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);
  const pyodide = await initializePyodide();

  pyodide.globals.set('factor_value', factor);
  await pyodide.runPythonAsync(`
enhancer = ImageEnhance.Brightness(pil_image)
pil_image = enhancer.enhance(factor_value)
`);

  return await pilToImageData(width, height);
}

async function PIL_ENHANCE_CONTRAST(imageData, factor = 1.5) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);
  const pyodide = await initializePyodide();

  pyodide.globals.set('factor_value', factor);
  await pyodide.runPythonAsync(`
enhancer = ImageEnhance.Contrast(pil_image)
pil_image = enhancer.enhance(factor_value)
`);

  return await pilToImageData(width, height);
}

async function PIL_ENHANCE_COLOR(imageData, factor = 1.5) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);
  const pyodide = await initializePyodide();

  pyodide.globals.set('factor_value', factor);
  await pyodide.runPythonAsync(`
enhancer = ImageEnhance.Color(pil_image)
pil_image = enhancer.enhance(factor_value)
`);

  return await pilToImageData(width, height);
}

async function PIL_AUTOCONTRAST(imageData, cutoff = 0) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);
  const pyodide = await initializePyodide();

  pyodide.globals.set('cutoff_value', cutoff);
  await pyodide.runPythonAsync('pil_image = ImageOps.autocontrast(pil_image, cutoff=int(cutoff_value))');

  return await pilToImageData(width, height);
}

async function PIL_EQUALIZE(imageData) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);
  const pyodide = await initializePyodide();

  await pyodide.runPythonAsync('pil_image = ImageOps.equalize(pil_image)');
  return await pilToImageData(width, height);
}

async function PIL_POSTERIZE(imageData, bits = 4) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);
  const pyodide = await initializePyodide();

  pyodide.globals.set('bits_value', bits);
  await pyodide.runPythonAsync('pil_image = ImageOps.posterize(pil_image, int(bits_value))');

  return await pilToImageData(width, height);
}

async function PIL_SOLARIZE(imageData, threshold = 128) {
  const { width, height } = imageData;
  await imageDataToPIL(imageData);
  const pyodide = await initializePyodide();

  pyodide.globals.set('threshold_value', threshold);
  await pyodide.runPythonAsync('pil_image = ImageOps.solarize(pil_image, threshold=int(threshold_value))');

  return await pilToImageData(width, height);
}

function PILLOW_META() {
  return {
    canonical: "org.rexxjs/pillow-via-pyodide",
    version: "1.0.0",
    name: 'Pillow Image Processing',
    description: 'PIL/Pillow image processing via PyOdide',
    provides: {
      functions: [
        'PIL_BLUR', 'PIL_CONTOUR', 'PIL_DETAIL', 'PIL_EDGE_ENHANCE',
        'PIL_EMBOSS', 'PIL_FIND_EDGES', 'PIL_SHARPEN', 'PIL_SMOOTH',
        'PIL_ENHANCE_BRIGHTNESS', 'PIL_ENHANCE_CONTRAST', 'PIL_ENHANCE_COLOR',
        'PIL_AUTOCONTRAST', 'PIL_EQUALIZE', 'PIL_POSTERIZE', 'PIL_SOLARIZE'
      ]
    },
    dependencies: {
      pyodide: "0.28.3",
      pillow: "latest"
    },
    status: {
      pyodideReady: pyodideInitialized
    }
  };
}

const pillowFunctions = {
  initializePyodide,
  PIL_BLUR,
  PIL_CONTOUR,
  PIL_DETAIL,
  PIL_EDGE_ENHANCE,
  PIL_EMBOSS,
  PIL_FIND_EDGES,
  PIL_SHARPEN,
  PIL_SMOOTH,
  PIL_ENHANCE_BRIGHTNESS,
  PIL_ENHANCE_CONTRAST,
  PIL_ENHANCE_COLOR,
  PIL_AUTOCONTRAST,
  PIL_EQUALIZE,
  PIL_POSTERIZE,
  PIL_SOLARIZE,
  PILLOW_META
};

export default pillowFunctions;

export {
  initializePyodide,
  PIL_BLUR,
  PIL_CONTOUR,
  PIL_DETAIL,
  PIL_EDGE_ENHANCE,
  PIL_EMBOSS,
  PIL_FIND_EDGES,
  PIL_SHARPEN,
  PIL_SMOOTH,
  PIL_ENHANCE_BRIGHTNESS,
  PIL_ENHANCE_CONTRAST,
  PIL_ENHANCE_COLOR,
  PIL_AUTOCONTRAST,
  PIL_EQUALIZE,
  PIL_POSTERIZE,
  PIL_SOLARIZE,
  PILLOW_META
};

if (typeof window !== 'undefined') {
  window.pillow_via_pyodide_rexx = pillowFunctions;
}

if (typeof global !== 'undefined') {
  global.pillow_via_pyodide_rexx = pillowFunctions;
}
