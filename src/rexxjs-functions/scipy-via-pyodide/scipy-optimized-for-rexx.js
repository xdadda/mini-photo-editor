/**
 * Optimized SciPy via PyOdide for REXX Integration
 *
 * Maintains a global PyOdide session for improved performance in REXX contexts.
 * Provides REXX-friendly function wrappers that can be registered as REXX functions.
 */

// Global PyOdide session state
let globalPyodideInstance = null;
let pyodideInitialized = false;
let initializationPromise = null;

/**
 * Initialize global PyOdide session
 */
async function initializePyodide() {
  if (pyodideInitialized) {
    return globalPyodideInstance;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  console.log('🚀 Initializing global PyOdide session for SciPy...');

  initializationPromise = (async () => {
    try {
      if (typeof loadPyodide === 'undefined') {
        throw new Error('PyOdide not available. Make sure pyodide.js is loaded.');
      }

      globalPyodideInstance = await loadPyodide();
      console.log('✅ PyOdide loaded');

      // Load SciPy and NumPy packages
      console.log('📦 Loading SciPy and NumPy packages...');
      await globalPyodideInstance.loadPackage(['numpy', 'scipy']);
      console.log('✅ SciPy packages loaded');

      // Import required modules
      await globalPyodideInstance.runPythonAsync(`
import numpy as np
from scipy import ndimage, signal
import sys

print(f"NumPy version: {np.__version__}", file=sys.stderr)
print(f"SciPy version: {sys.modules['scipy'].__version__}", file=sys.stderr)
`);

      pyodideInitialized = true;
      console.log('✅ SciPy initialized successfully');

      return globalPyodideInstance;
    } catch (error) {
      initializationPromise = null;
      throw new Error(`Failed to initialize PyOdide/SciPy: ${error.message}`);
    }
  })();

  return initializationPromise;
}

/**
 * Convert ImageData to numpy array
 */
async function imageDataToNumpy(imageData) {
  const pyodide = await initializePyodide();
  const { width, height, data } = imageData;
  const flatArray = Array.from(data);

  pyodide.globals.set('img_width', width);
  pyodide.globals.set('img_height', height);
  pyodide.globals.set('img_data', flatArray);

  await pyodide.runPythonAsync(`
img_array = np.array(img_data, dtype=np.uint8).reshape((img_height, img_width, 4))
`);
}

/**
 * Convert numpy array back to ImageData
 */
async function numpyToImageData(width, height) {
  const pyodide = await initializePyodide();
  const result = await pyodide.runPythonAsync('img_array.flatten().tolist()');
  const uint8Array = new Uint8ClampedArray(result);
  return new ImageData(uint8Array, width, height);
}

// ============================================================================
// SCIPY FILTERS (REXX-optimized)
// ============================================================================

/**
 * GAUSSIAN_FILTER - Apply Gaussian blur
 * REXX-callable function
 */
async function GAUSSIAN_FILTER(imageData, sigma = 2.0) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  const pyodide = await initializePyodide();
  pyodide.globals.set('sigma_value', sigma);

  await pyodide.runPythonAsync(`
for channel in range(3):
    img_array[:, :, channel] = ndimage.gaussian_filter(
        img_array[:, :, channel],
        sigma=sigma_value
    )
`);

  return await numpyToImageData(width, height);
}

/**
 * SOBEL_FILTER - Apply Sobel edge detection
 * REXX-callable function
 */
async function SOBEL_FILTER(imageData, intensity = 1.0) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  const pyodide = await initializePyodide();
  pyodide.globals.set('intensity_value', intensity);

  await pyodide.runPythonAsync(`
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
 * MEDIAN_FILTER - Apply median filter for noise reduction
 * REXX-callable function
 */
async function MEDIAN_FILTER(imageData, size = 3) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  const pyodide = await initializePyodide();
  pyodide.globals.set('filter_size', size);

  await pyodide.runPythonAsync(`
for channel in range(3):
    img_array[:, :, channel] = ndimage.median_filter(
        img_array[:, :, channel],
        size=int(filter_size)
    )
`);

  return await numpyToImageData(width, height);
}

/**
 * LAPLACE_FILTER - Apply Laplace edge enhancement
 * REXX-callable function
 */
async function LAPLACE_FILTER(imageData, strength = 0.5) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  const pyodile = await initializePyodide();
  pyodile.globals.set('strength_value', strength);

  await pyodile.runPythonAsync(`
for channel in range(3):
    original = img_array[:, :, channel].astype(np.float32)
    laplace = ndimage.laplace(original)
    enhanced = original + laplace * strength_value
    img_array[:, :, channel] = np.clip(enhanced, 0, 255).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

/**
 * UNIFORM_FILTER - Apply uniform filter (box blur)
 * REXX-callable function
 */
async function UNIFORM_FILTER(imageData, size = 5) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  const pyodide = await initializePyodide();
  pyodide.globals.set('filter_size', size);

  await pyodide.runPythonAsync(`
for channel in range(3):
    img_array[:, :, channel] = ndimage.uniform_filter(
        img_array[:, :, channel],
        size=int(filter_size)
    )
`);

  return await numpyToImageData(width, height);
}

/**
 * MORPH_EROSION - Apply morphological erosion
 * REXX-callable function
 */
async function MORPH_EROSION(imageData, iterations = 1) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  const pyodide = await initializePyodide();
  await pyodide.runPythonAsync(`
for channel in range(3):
    img_array[:, :, channel] = ndimage.grey_erosion(
        img_array[:, :, channel],
        size=(3, 3)
    )
`);

  return await numpyToImageData(width, height);
}

/**
 * MORPH_DILATION - Apply morphological dilation
 * REXX-callable function
 */
async function MORPH_DILATION(imageData, iterations = 1) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  const pyodide = await initializePyodide();
  await pyodide.runPythonAsync(`
for channel in range(3):
    img_array[:, :, channel] = ndimage.grey_dilation(
        img_array[:, :, channel],
        size=(3, 3)
    )
`);

  return await numpyToImageData(width, height);
}

/**
 * UNSHARP_MASK - Apply unsharp mask for sharpening
 * REXX-callable function
 */
async function UNSHARP_MASK(imageData, radius = 1.0, amount = 1.0) {
  const { width, height } = imageData;
  await imageDataToNumpy(imageData);

  const pyodide = await initializePyodide();
  pyodide.globals.set('radius_value', radius);
  pyodide.globals.set('amount_value', amount);

  await pyodide.runPythonAsync(`
for channel in range(3):
    original = img_array[:, :, channel].astype(np.float32)
    blurred = ndimage.gaussian_filter(original, sigma=radius_value)
    sharpened = original + amount_value * (original - blurred)
    img_array[:, :, channel] = np.clip(sharpened, 0, 255).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

/**
 * Get metadata about available SciPy functions
 */
function SCIPY_META() {
  return {
    canonical: "org.rexxjs/scipy-via-pyodide",
    version: "1.0.0",
    name: 'SciPy Image Processing',
    description: 'SciPy ndimage and signal processing via PyOdide',
    provides: {
      functions: [
        'GAUSSIAN_FILTER',
        'SOBEL_FILTER',
        'MEDIAN_FILTER',
        'LAPLACE_FILTER',
        'UNIFORM_FILTER',
        'MORPH_EROSION',
        'MORPH_DILATION',
        'UNSHARP_MASK'
      ]
    },
    dependencies: {
      pyodide: "0.28.3",
      scipy: "latest",
      numpy: "latest"
    },
    status: {
      pyodideReady: pyodideInitialized
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

const scipyFunctions = {
  initializePyodide,
  GAUSSIAN_FILTER,
  SOBEL_FILTER,
  MEDIAN_FILTER,
  LAPLACE_FILTER,
  UNIFORM_FILTER,
  MORPH_EROSION,
  MORPH_DILATION,
  UNSHARP_MASK,
  SCIPY_META
};

export default scipyFunctions;

export {
  initializePyodide,
  GAUSSIAN_FILTER,
  SOBEL_FILTER,
  MEDIAN_FILTER,
  LAPLACE_FILTER,
  UNIFORM_FILTER,
  MORPH_EROSION,
  MORPH_DILATION,
  UNSHARP_MASK,
  SCIPY_META
};

// Make available globally for browser and REXX integration
if (typeof window !== 'undefined') {
  window.scipy_via_pyodide_rexx = scipyFunctions;
}

if (typeof global !== 'undefined') {
  global.scipy_via_pyodide_rexx = scipyFunctions;
}
