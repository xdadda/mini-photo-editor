/**
 * Optimized Scikit-Image via PyOdide for REXX Integration
 */

let globalPyodideInstance = null;
let pyodideInitialized = false;
let initializationPromise = null;

async function initializePyodide() {
  if (pyodideInitialized) return globalPyodideInstance;
  if (initializationPromise) return initializationPromise;

  console.log('🚀 Initializing PyOdide for Scikit-Image...');

  initializationPromise = (async () => {
    try {
      if (typeof loadPyodide === 'undefined') {
        throw new Error('PyOdide not available');
      }

      globalPyodideInstance = await loadPyodide();
      await globalPyodideInstance.loadPackage(['scikit-image', 'numpy']);

      await globalPyodideInstance.runPythonAsync(`
from skimage import filters, restoration, morphology, exposure, feature, transform
import numpy as np
`);

      pyodideInitialized = true;
      console.log('✅ Scikit-Image initialized');
      return globalPyodideInstance;
    } catch (error) {
      initializationPromise = null;
      throw new Error(`Failed to initialize Scikit-Image: ${error.message}`);
    }
  })();

  return initializationPromise;
}

async function imageDataToNumpy(imageData) {
  const pyodide = await initializePyodide();
  const { width, height, data } = imageData;

  pyodide.globals.set('img_width', width);
  pyodide.globals.set('img_height', height);
  pyodide.globals.set('img_data', Array.from(data));

  await pyodide.runPythonAsync(`
img_array = np.array(img_data, dtype=np.uint8).reshape((img_height, img_width, 4))
`);
}

async function numpyToImageData(width, height) {
  const pyodide = await initializePyodide();
  const result = await pyodide.runPythonAsync('img_array.flatten().tolist()');
  return new ImageData(new Uint8ClampedArray(result), width, height);
}

// REXX-callable functions
async function SKIMAGE_DENOISE_TV(imageData, weight = 0.1) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);
  const pyodide = await initializePyodide();

  pyodide.globals.set('weight_value', weight);
  await pyodide.runPythonAsync(`
for channel in range(3):
    img_float = img_array[:, :, channel].astype(np.float32) / 255.0
    denoised = restoration.denoise_tv_chambolle(img_float, weight=weight_value)
    img_array[:, :, channel] = (denoised * 255).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

async function SKIMAGE_DENOISE_BILATERAL(imageData, sigma_color = 0.05, sigma_spatial = 15) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);
  const pyodide = await initializePyodide();

  pyodide.globals.set('sigma_color', sigma_color);
  pyodide.globals.set('sigma_spatial', sigma_spatial);
  await pyodide.runPythonAsync(`
for channel in range(3):
    img_float = img_array[:, :, channel].astype(np.float32) / 255.0
    denoised = restoration.denoise_bilateral(img_float, sigma_color=sigma_color, sigma_spatial=sigma_spatial)
    img_array[:, :, channel] = (denoised * 255).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

async function SKIMAGE_CANNY_EDGES(imageData, sigma = 1.0) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);
  const pyodide = await initializePyodide();

  pyodide.globals.set('sigma_value', sigma);
  await pyodide.runPythonAsync(`
gray = np.mean(img_array[:, :, :3], axis=2) / 255.0
edges = feature.canny(gray, sigma=sigma_value)
edges_uint8 = (edges * 255).astype(np.uint8)
for channel in range(3):
    img_array[:, :, channel] = edges_uint8
`);

  return await numpyToImageData(width, height);
}

async function SKIMAGE_MORPH_OPENING(imageData, size = 3) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);
  const pyodide = await initializePyodide();

  pyodide.globals.set('size_value', size);
  await pyodide.runPythonAsync(`
selem = morphology.disk(int(size_value))
for channel in range(3):
    img_array[:, :, channel] = morphology.opening(img_array[:, :, channel], selem)
`);

  return await numpyToImageData(width, height);
}

async function SKIMAGE_MORPH_CLOSING(imageData, size = 3) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);
  const pyodide = await initializePyodide();

  pyodide.globals.set('size_value', size);
  await pyodide.runPythonAsync(`
selem = morphology.disk(int(size_value))
for channel in range(3):
    img_array[:, :, channel] = morphology.closing(img_array[:, :, channel], selem)
`);

  return await numpyToImageData(width, height);
}

async function SKIMAGE_ADJUST_GAMMA(imageData, gamma = 1.0) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);
  const pyodide = await initializePyodide();

  pyodide.globals.set('gamma_value', gamma);
  await pyodide.runPythonAsync(`
for channel in range(3):
    img_float = img_array[:, :, channel].astype(np.float32) / 255.0
    adjusted = exposure.adjust_gamma(img_float, gamma=gamma_value)
    img_array[:, :, channel] = (adjusted * 255).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

async function SKIMAGE_EQUALIZE_ADAPTIVE(imageData, clip_limit = 0.03) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);
  const pyodide = await initializePyodide();

  pyodide.globals.set('clip_limit', clip_limit);
  await pyodide.runPythonAsync(`
for channel in range(3):
    img_array[:, :, channel] = (exposure.equalize_adapthist(img_array[:, :, channel], clip_limit=clip_limit) * 255).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

async function SKIMAGE_UNSHARP_MASK(imageData, radius = 1.0, amount = 1.0) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);
  const pyodide = await initializePyodide();

  pyodide.globals.set('radius_value', radius);
  pyodide.globals.set('amount_value', amount);
  await pyodide.runPythonAsync(`
for channel in range(3):
    img_float = img_array[:, :, channel].astype(np.float32) / 255.0
    sharpened = filters.unsharp_mask(img_float, radius=radius_value, amount=amount_value)
    img_array[:, :, channel] = (sharpened * 255).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

function SKIMAGE_META() {
  return {
    canonical: "org.rexxjs/scikit-image-via-pyodide",
    version: "1.0.0",
    name: 'Scikit-Image Processing',
    description: 'Advanced image processing via scikit-image and PyOdide',
    provides: {
      functions: [
        'SKIMAGE_DENOISE_TV',
        'SKIMAGE_DENOISE_BILATERAL',
        'SKIMAGE_CANNY_EDGES',
        'SKIMAGE_MORPH_OPENING',
        'SKIMAGE_MORPH_CLOSING',
        'SKIMAGE_ADJUST_GAMMA',
        'SKIMAGE_EQUALIZE_ADAPTIVE',
        'SKIMAGE_UNSHARP_MASK'
      ]
    },
    dependencies: {
      pyodide: "0.28.3",
      "scikit-image": "latest"
    },
    status: {
      pyodideReady: pyodideInitialized
    }
  };
}

const skimageFunction = {
  initializePyodide,
  SKIMAGE_DENOISE_TV,
  SKIMAGE_DENOISE_BILATERAL,
  SKIMAGE_CANNY_EDGES,
  SKIMAGE_MORPH_OPENING,
  SKIMAGE_MORPH_CLOSING,
  SKIMAGE_ADJUST_GAMMA,
  SKIMAGE_EQUALIZE_ADAPTIVE,
  SKIMAGE_UNSHARP_MASK,
  SKIMAGE_META
};

export default skimageFunction;

export {
  initializePyodide,
  SKIMAGE_DENOISE_TV,
  SKIMAGE_DENOISE_BILATERAL,
  SKIMAGE_CANNY_EDGES,
  SKIMAGE_MORPH_OPENING,
  SKIMAGE_MORPH_CLOSING,
  SKIMAGE_ADJUST_GAMMA,
  SKIMAGE_EQUALIZE_ADAPTIVE,
  SKIMAGE_UNSHARP_MASK,
  SKIMAGE_META
};

if (typeof window !== 'undefined') {
  window.skimage_via_pyodide_rexx = skimageFunction;
}

if (typeof global !== 'undefined') {
  global.skimage_via_pyodide_rexx = skimageFunction;
}
