/**
 * Real Scikit-Image via PyOdide Integration
 * Provides advanced image processing algorithms from scikit-image
 */

let pyodideHandler = null;
let pyodideInitialized = false;

async function initializePyodide() {
  if (pyodideInitialized) return;

  try {
    if (typeof window !== 'undefined' && window.ADDRESS_PYODIDE_HANDLER) {
      pyodideHandler = window.ADDRESS_PYODIDE_HANDLER;
    } else if (typeof global !== 'undefined' && global.ADDRESS_PYODIDE_HANDLER) {
      pyodideHandler = global.ADDRESS_PYODIDE_HANDLER;
    } else if (typeof loadPyodide !== 'undefined') {
      const pyodide = await loadPyodide();
      await pyodide.loadPackage(['scikit-image']);

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
import numpy as np
from skimage import filters, restoration, morphology, exposure, feature, transform
`);

    pyodideInitialized = true;
    console.log('✅ Scikit-Image initialized via PyOdide');
  } catch (error) {
    throw new Error(`Failed to initialize Scikit-Image: ${error.message}`);
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

async function imageDataToNumpy(imageData) {
  const { width, height, data } = imageData;
  const flatArray = Array.from(data);

  await setContext('img_width', width);
  await setContext('img_height', height);
  await setContext('img_data', flatArray);

  await runPython(`
img_array = np.array(img_data, dtype=np.uint8).reshape((img_height, img_width, 4))
`);
}

async function numpyToImageData(width, height) {
  const result = await runPython('img_array.flatten().tolist()');
  const uint8Array = new Uint8ClampedArray(result);
  return new ImageData(uint8Array, width, height);
}

// ============================================================================
// DENOISING FILTERS
// ============================================================================

async function denoiseTV(imageData, weight = 0.1) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('weight_value', weight);
  await runPython(`
for channel in range(3):
    img_float = img_array[:, :, channel].astype(np.float32) / 255.0
    denoised = restoration.denoise_tv_chambolle(img_float, weight=weight_value)
    img_array[:, :, channel] = (denoised * 255).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

async function denoiseBilateral(imageData, sigma_color = 0.05, sigma_spatial = 15) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('sigma_color', sigma_color);
  await setContext('sigma_spatial', sigma_spatial);
  await runPython(`
for channel in range(3):
    img_float = img_array[:, :, channel].astype(np.float32) / 255.0
    denoised = restoration.denoise_bilateral(
        img_float,
        sigma_color=sigma_color,
        sigma_spatial=sigma_spatial
    )
    img_array[:, :, channel] = (denoised * 255).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

async function denoiseNLMeans(imageData, h = 0.1) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('h_value', h);
  await runPython(`
for channel in range(3):
    img_float = img_array[:, :, channel].astype(np.float32) / 255.0
    denoised = restoration.denoise_nl_means(img_float, h=h_value, fast_mode=True)
    img_array[:, :, channel] = (denoised * 255).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

// ============================================================================
// EDGE DETECTION
// ============================================================================

async function cannyEdges(imageData, sigma = 1.0) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('sigma_value', sigma);
  await runPython(`
gray = np.mean(img_array[:, :, :3], axis=2) / 255.0
edges = feature.canny(gray, sigma=sigma_value)
edges_uint8 = (edges * 255).astype(np.uint8)

for channel in range(3):
    img_array[:, :, channel] = edges_uint8
`);

  return await numpyToImageData(width, height);
}

// ============================================================================
// MORPHOLOGICAL OPERATIONS
// ============================================================================

async function morphOpening(imageData, size = 3) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('size_value', size);
  await runPython(`
selem = morphology.disk(int(size_value))
for channel in range(3):
    img_array[:, :, channel] = morphology.opening(img_array[:, :, channel], selem)
`);

  return await numpyToImageData(width, height);
}

async function morphClosing(imageData, size = 3) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('size_value', size);
  await runPython(`
selem = morphology.disk(int(size_value))
for channel in range(3):
    img_array[:, :, channel] = morphology.closing(img_array[:, :, channel], selem)
`);

  return await numpyToImageData(width, height);
}

// ============================================================================
// EXPOSURE ADJUSTMENT
// ============================================================================

async function adjustGamma(imageData, gamma = 1.0) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('gamma_value', gamma);
  await runPython(`
for channel in range(3):
    img_float = img_array[:, :, channel].astype(np.float32) / 255.0
    adjusted = exposure.adjust_gamma(img_float, gamma=gamma_value)
    img_array[:, :, channel] = (adjusted * 255).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

async function adjustLog(imageData, gain = 1.0) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('gain_value', gain);
  await runPython(`
for channel in range(3):
    img_float = img_array[:, :, channel].astype(np.float32) / 255.0
    adjusted = exposure.adjust_log(img_float, gain=gain_value)
    img_array[:, :, channel] = (adjusted * 255).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

async function equalizeAdaptive(imageData, clip_limit = 0.03) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('clip_limit', clip_limit);
  await runPython(`
for channel in range(3):
    img_array[:, :, channel] = exposure.equalize_adapthist(
        img_array[:, :, channel],
        clip_limit=clip_limit
    ).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

async function rescaleIntensity(imageData) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await runPython(`
for channel in range(3):
    img_array[:, :, channel] = exposure.rescale_intensity(img_array[:, :, channel])
`);

  return await numpyToImageData(width, height);
}

// ============================================================================
// FILTERS
// ============================================================================

async function unsharpMaskFilter(imageData, radius = 1.0, amount = 1.0) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('radius_value', radius);
  await setContext('amount_value', amount);
  await runPython(`
for channel in range(3):
    img_float = img_array[:, :, channel].astype(np.float32) / 255.0
    sharpened = filters.unsharp_mask(img_float, radius=radius_value, amount=amount_value)
    img_array[:, :, channel] = (sharpened * 255).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initializePyodide,
  denoiseTV,
  denoiseBilateral,
  denoiseNLMeans,
  cannyEdges,
  morphOpening,
  morphClosing,
  adjustGamma,
  adjustLog,
  equalizeAdaptive,
  rescaleIntensity,
  unsharpMaskFilter
};

export {
  initializePyodide,
  denoiseTV,
  denoiseBilateral,
  denoiseNLMeans,
  cannyEdges,
  morphOpening,
  morphClosing,
  adjustGamma,
  adjustLog,
  equalizeAdaptive,
  rescaleIntensity,
  unsharpMaskFilter
};

if (typeof window !== 'undefined') {
  window.skimage_via_pyodide = {
    initializePyodide,
    denoiseTV,
    denoiseBilateral,
    denoiseNLMeans,
    cannyEdges,
    morphOpening,
    morphClosing,
    adjustGamma,
    adjustLog,
    equalizeAdaptive,
    rescaleIntensity,
    unsharpMaskFilter
  };
}
