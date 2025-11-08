/**
 * SciPy Image Processing via PyOdide Integration
 *
 * Provides real SciPy signal/ndimage filters for advanced image processing
 * Uses PyOdide to run authentic Python SciPy code for 100% compatibility
 *
 * Features:
 * - Gaussian blur
 * - Sobel edge detection
 * - Median filter
 * - Laplace edge enhancement
 * - Uniform smoothing
 */

// Global PyOdide session state
let globalPyodideInstance = null;
let pyodideInitialized = false;
let initializationPromise = null;

/**
 * Initialize PyOdide and load SciPy
 */
async function initializePyodide() {
  if (pyodideInitialized) {
    return globalPyodideInstance;
  }

  // If already initializing, return the same promise
  if (initializationPromise) {
    return initializationPromise;
  }

  console.log('🚀 Initializing PyOdide for SciPy image processing...');

  initializationPromise = (async () => {
    try {
      // Load PyOdide from CDN
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
from scipy import ndimage
from scipy.signal import convolve2d
import sys

print(f"NumPy version: {np.__version__}", file=sys.stderr)
print(f"SciPy version: {sys.modules['scipy'].__version__}", file=sys.stderr)
`);

      pyodideInitialized = true;
      console.log('✅ SciPy initialized successfully');

      return globalPyodideInstance;
    } catch (error) {
      initializationPromise = null; // Reset on error
      throw new Error(`Failed to initialize PyOdide/SciPy: ${error.message}`);
    }
  })();

  return initializationPromise;
}

/**
 * Convert ImageData to numpy array in PyOdide
 */
async function imageDataToNumpy(imageData) {
  const pyodide = await initializePyodide();

  const { width, height, data } = imageData;

  // Convert Uint8ClampedArray to regular array (RGBA format)
  const flatArray = Array.from(data);

  // Create numpy array in Python
  pyodide.globals.set('img_width', width);
  pyodide.globals.set('img_height', height);
  pyodide.globals.set('img_data', flatArray);

  await pyodide.runPythonAsync(`
# Reshape flat array to (height, width, 4) for RGBA
img_array = np.array(img_data, dtype=np.uint8).reshape((img_height, img_width, 4))
`);
}

/**
 * Convert numpy array back to ImageData
 */
async function numpyToImageData(width, height) {
  const pyodide = await initializePyodide();

  const result = await pyodide.runPythonAsync(`
# Flatten and convert to list
img_array.flatten().tolist()
`);

  // Convert to Uint8ClampedArray
  const uint8Array = new Uint8ClampedArray(result);

  return new ImageData(uint8Array, width, height);
}

/**
 * Apply Gaussian blur using scipy.ndimage
 */
export async function applyGaussianFilter(imageData, sigma = 2.0) {
  const pyodide = await initializePyodide();
  const { width, height } = imageData;

  await imageDataToNumpy(imageData);

  pyodide.globals.set('sigma_value', sigma);

  await pyodide.runPythonAsync(`
# Apply Gaussian filter to RGB channels (preserve alpha)
for channel in range(3):
    img_array[:, :, channel] = ndimage.gaussian_filter(
        img_array[:, :, channel],
        sigma=sigma_value
    )
`);

  return await numpyToImageData(width, height);
}

/**
 * Apply Sobel edge detection
 */
export async function applySobelFilter(imageData, intensity = 1.0) {
  const pyodide = await initializePyodide();
  const { width, height } = imageData;

  await imageDataToNumpy(imageData);

  pyodide.globals.set('intensity_value', intensity);

  await pyodide.runPythonAsync(`
# Convert to grayscale for edge detection
gray = np.mean(img_array[:, :, :3], axis=2)

# Apply Sobel in both directions
sobel_x = ndimage.sobel(gray, axis=0)
sobel_y = ndimage.sobel(gray, axis=1)
sobel_magnitude = np.hypot(sobel_x, sobel_y)

# Normalize to 0-255
sobel_magnitude = (sobel_magnitude / sobel_magnitude.max() * 255).astype(np.uint8)

# Apply intensity and blend with original
for channel in range(3):
    img_array[:, :, channel] = (
        img_array[:, :, channel] * (1 - intensity_value) +
        sobel_magnitude * intensity_value
    ).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

/**
 * Apply median filter (noise reduction)
 */
export async function applyMedianFilter(imageData, size = 3) {
  const pyodide = await initializePyodide();
  const { width, height } = imageData;

  await imageDataToNumpy(imageData);

  pyodide.globals.set('filter_size', size);

  await pyodide.runPythonAsync(`
# Apply median filter to RGB channels
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
export async function applyLaplaceFilter(imageData, strength = 0.5) {
  const pyodide = await initializePyodide();
  const { width, height } = imageData;

  await imageDataToNumpy(imageData);

  pyodide.globals.set('strength_value', strength);

  await pyodide.runPythonAsync(`
# Apply Laplace filter to RGB channels and blend
for channel in range(3):
    original = img_array[:, :, channel].astype(np.float32)
    laplace = ndimage.laplace(original)

    # Enhance edges by adding weighted Laplace
    enhanced = original + laplace * strength_value

    # Clip to valid range
    img_array[:, :, channel] = np.clip(enhanced, 0, 255).astype(np.uint8)
`);

  return await numpyToImageData(width, height);
}

/**
 * Apply uniform filter (box blur)
 */
export async function applyUniformFilter(imageData, size = 5) {
  const pyodide = await initializePyodide();
  const { width, height } = imageData;

  await imageDataToNumpy(imageData);

  pyodide.globals.set('filter_size', size);

  await pyodide.runPythonAsync(`
# Apply uniform filter to RGB channels
for channel in range(3):
    img_array[:, :, channel] = ndimage.uniform_filter(
        img_array[:, :, channel],
        size=int(filter_size)
    )
`);

  return await numpyToImageData(width, height);
}

/**
 * Check if PyOdide is ready
 */
export function isPyodideReady() {
  return pyodideInitialized;
}

/**
 * Get initialization status
 */
export function getStatus() {
  return {
    initialized: pyodideInitialized,
    available: typeof loadPyodide !== 'undefined'
  };
}

export default {
  initializePyodide,
  applyGaussianFilter,
  applySobelFilter,
  applyMedianFilter,
  applyLaplaceFilter,
  applyUniformFilter,
  isPyodideReady,
  getStatus
};
