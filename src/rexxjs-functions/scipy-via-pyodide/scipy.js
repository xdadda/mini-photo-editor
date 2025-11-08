/**
 * Real SciPy via PyOdide Integration
 * Uses the existing PyOdide infrastructure to provide full SciPy compatibility
 * Leverages browser-based Python execution for 100% authentic SciPy algorithms
 */

// Import or reference PyOdide
let pyodideHandler = null;
let pyodideInitialized = false;

/**
 * Initialize PyOdide using existing infrastructure or standalone
 */
async function initializePyodide() {
  if (pyodideInitialized) return;

  try {
    // Try to use existing PyOdide ADDRESS handler if available
    if (typeof window !== 'undefined' && window.ADDRESS_PYODIDE_HANDLER) {
      pyodideHandler = window.ADDRESS_PYODIDE_HANDLER;
    } else if (typeof global !== 'undefined' && global.ADDRESS_PYODIDE_HANDLER) {
      pyodideHandler = global.ADDRESS_PYODIDE_HANDLER;
    } else if (typeof loadPyodide !== 'undefined') {
      // Fallback: load PyOdide directly
      const pyodide = await loadPyodide();
      await pyodide.loadPackage(['numpy', 'scipy']);

      // Create a handler-like interface
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

    // Check PyOdide status
    if (pyodideHandler.run) {
      await pyodideHandler.run('import numpy as np; from scipy import ndimage, signal', {});
    }

    pyodideInitialized = true;
    console.log('✅ SciPy initialized via PyOdide');
  } catch (error) {
    throw new Error(`Failed to initialize SciPy: ${error.message}`);
  }
}

/**
 * Run Python code via PyOdide
 */
async function runPython(code) {
  await initializePyodide();

  if (pyodideHandler.run) {
    const result = await pyodideHandler.run(code, { code });
    return result;
  }
  throw new Error('PyOdide handler not initialized');
}

/**
 * Set context variable in Python
 */
async function setContext(key, value) {
  await initializePyodide();

  if (pyodideHandler.set_context) {
    await pyodideHandler.set_context('set_context', { key, value });
  } else if (pyodideHandler.run) {
    // Fallback
    await runPython(`${key} = ${JSON.stringify(value)}`);
  }
}

/**
 * Convert ImageData to numpy array
 */
async function imageDataToNumpy(imageData) {
  const { width, height, data } = imageData;
  const flatArray = Array.from(data);

  await setContext('img_width', width);
  await setContext('img_height', height);
  await setContext('img_data', flatArray);

  await runPython(`
import numpy as np
from scipy import ndimage, signal
img_array = np.array(img_data, dtype=np.uint8).reshape((img_height, img_width, 4))
`);
}

/**
 * Convert numpy array back to ImageData
 */
async function numpyToImageData(width, height) {
  const result = await runPython('img_array.flatten().tolist()');
  const uint8Array = new Uint8ClampedArray(result);
  return new ImageData(uint8Array, width, height);
}

// ============================================================================
// SCIPY FILTERS
// ============================================================================

/**
 * Apply Gaussian blur using scipy.ndimage.gaussian_filter
 */
async function gaussianFilter(imageData, sigma = 2.0) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('sigma_value', sigma);
  await runPython(`
for channel in range(3):
    img_array[:, :, channel] = ndimage.gaussian_filter(
        img_array[:, :, channel],
        sigma=sigma_value
    )
`);

  return await numpyToImageData(width, height);
}

/**
 * Apply Sobel edge detection using scipy.ndimage.sobel
 */
async function sobelFilter(imageData, intensity = 1.0) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('intensity_value', intensity);
  await runPython(`
gray = np.mean(img_array[:, :, :3], axis=2)
sobel_x = ndimage.sobel(gray, axis=0)
sobel_y = ndimage.sobel(gray, axis=1)
sobel_magnitude = np.hypot(sobel_x, sobel_y)
sobel_magnitude = (sobel_magnitude / sobel_magnitude.max() * 255).astype(np.uint8)

for channel in range(3):
    img_array[:, :, channel] = (
        img_array[:, :, channel] * (1 - intensity_value) +
        sobel_magnitude * intensity_value
    ).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

/**
 * Apply median filter for noise reduction
 */
async function medianFilter(imageData, size = 3) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('filter_size', size);
  await runPython(`
for channel in range(3):
    img_array[:, :, channel] = ndimage.median_filter(
        img_array[:, :, channel],
        size=int(filter_size)
    )
`);

  return await numpyToImageData(width, height);
}

/**
 * Apply Laplace edge enhancement
 */
async function laplaceFilter(imageData, strength = 0.5) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('strength_value', strength);
  await runPython(`
for channel in range(3):
    original = img_array[:, :, channel].astype(np.float32)
    laplace = ndimage.laplace(original)
    enhanced = original + laplace * strength_value
    img_array[:, :, channel] = np.clip(enhanced, 0, 255).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

/**
 * Apply uniform filter (box blur)
 */
async function uniformFilter(imageData, size = 5) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('filter_size', size);
  await runPython(`
for channel in range(3):
    img_array[:, :, channel] = ndimage.uniform_filter(
        img_array[:, :, channel],
        size=int(filter_size)
    )
`);

  return await numpyToImageData(width, height);
}

/**
 * Apply morphological erosion
 */
async function morphErosion(imageData, iterations = 1) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('iterations_value', iterations);
  await runPython(`
for channel in range(3):
    img_array[:, :, channel] = ndimage.grey_erosion(
        img_array[:, :, channel],
        size=(3, 3)
    )
`);

  return await numpyToImageData(width, height);
}

/**
 * Apply morphological dilation
 */
async function morphDilation(imageData, iterations = 1) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('iterations_value', iterations);
  await runPython(`
for channel in range(3):
    img_array[:, :, channel] = ndimage.grey_dilation(
        img_array[:, :, channel],
        size=(3, 3)
    )
`);

  return await numpyToImageData(width, height);
}

/**
 * Apply unsharp mask for sharpening
 */
async function unsharpMask(imageData, radius = 1.0, amount = 1.0) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  await setContext('radius_value', radius);
  await setContext('amount_value', amount);
  await runPython(`
for channel in range(3):
    original = img_array[:, :, channel].astype(np.float32)
    blurred = ndimage.gaussian_filter(original, sigma=radius_value)
    sharpened = original + amount_value * (original - blurred)
    img_array[:, :, channel] = np.clip(sharpened, 0, 255).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initializePyodide,
  gaussianFilter,
  sobelFilter,
  medianFilter,
  laplaceFilter,
  uniformFilter,
  morphErosion,
  morphDilation,
  unsharpMask
};

export {
  initializePyodide,
  gaussianFilter,
  sobelFilter,
  medianFilter,
  laplaceFilter,
  uniformFilter,
  morphErosion,
  morphDilation,
  unsharpMask
};

// Make available globally for browser use
if (typeof window !== 'undefined') {
  window.scipy_via_pyodide = {
    initializePyodide,
    gaussianFilter,
    sobelFilter,
    medianFilter,
    laplaceFilter,
    uniformFilter,
    morphErosion,
    morphDilation,
    unsharpMask
  };
}
