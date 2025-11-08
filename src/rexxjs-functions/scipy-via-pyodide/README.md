# SciPy Image Processing via PyOdide

Real SciPy `ndimage` and `signal` processing for browser-based image manipulation using PyOdide.

## Features

- **100% Authentic SciPy**: Uses real Python SciPy library via PyOdide
- **REXX Integration**: Optimized version for use as REXX functions
- **Browser Compatible**: Works in all modern browsers with WebAssembly support
- **Comprehensive Filters**: Gaussian blur, Sobel edges, median filter, morphology, and more

## Available Filters

### Basic Filters
- `gaussianFilter(imageData, sigma)` - Gaussian blur
- `uniformFilter(imageData, size)` - Box blur/averaging
- `medianFilter(imageData, size)` - Median filter for noise reduction

### Edge Detection
- `sobelFilter(imageData, intensity)` - Sobel edge detection
- `laplaceFilter(imageData, strength)` - Laplace edge enhancement

### Morphological Operations
- `morphErosion(imageData, iterations)` - Morphological erosion
- `morphDilation(imageData, iterations)` - Morphological dilation

### Enhancement
- `unsharpMask(imageData, radius, amount)` - Unsharp masking for sharpening

## Usage

### Standard JavaScript

```javascript
import scipy from './scipy.js';

// Initialize PyOdide (first use only, ~10 seconds)
await scipy.initializePyodide();

// Get ImageData from canvas
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Apply Gaussian blur
const blurred = await scipy.gaussianFilter(imageData, 2.0);

// Apply Sobel edge detection
const edges = await scipy.sobelFilter(imageData, 1.0);

// Put result back on canvas
ctx.putImageData(blurred, 0, 0);
```

### REXX Integration

```javascript
// Load optimized version for REXX
import scipyRexx from './scipy-optimized-for-rexx.js';

// Initialize
await scipyRexx.initializePyodide();

// Register functions with REXX interpreter
const interpreter = createRexxInterpreter();

// Register all SciPy functions
for (const [funcName, func] of Object.entries(scipyRexx)) {
  if (funcName !== 'initializePyodide' && funcName !== 'SCIPY_META') {
    interpreter.registerFunction(funcName, func);
  }
}
```

Example REXX script:
```rexx
/* Apply SciPy filters to image */
REQUIRE "scipy-via-pyodide"

SAY "Applying Gaussian blur..."
result = GAUSSIAN_FILTER(imageData, 2.0)

SAY "Detecting edges..."
edges = SOBEL_FILTER(imageData, 1.0)

SAY "Sharpening image..."
sharp = UNSHARP_MASK(imageData, 1.0, 1.5)
```

## Parameters

### gaussianFilter(imageData, sigma)
- `imageData`: ImageData object
- `sigma`: Standard deviation for Gaussian kernel (default: 2.0)

### sobelFilter(imageData, intensity)
- `imageData`: ImageData object
- `intensity`: Blend intensity (0-1, default: 1.0)

### medianFilter(imageData, size)
- `imageData`: ImageData object
- `size`: Filter size (default: 3)

### laplaceFilter(imageData, strength)
- `imageData`: ImageData object
- `strength`: Enhancement strength (default: 0.5)

### uniformFilter(imageData, size)
- `imageData`: ImageData object
- `size`: Filter size (default: 5)

### morphErosion(imageData, iterations)
- `imageData`: ImageData object
- `iterations`: Number of erosion iterations (default: 1)

### morphDilation(imageData, iterations)
- `imageData`: ImageData object
- `iterations`: Number of dilation iterations (default: 1)

### unsharpMask(imageData, radius, amount)
- `imageData`: ImageData object
- `radius`: Blur radius (default: 1.0)
- `amount`: Sharpening amount (default: 1.0)

## Performance

- **First Load**: ~10 seconds (PyOdide + SciPy download)
- **Subsequent Loads**: Instant (cached)
- **Processing**: ~100-500ms per filter (depends on image size)

## Dependencies

- PyOdide 0.28.3+
- SciPy (auto-loaded)
- NumPy (auto-loaded)

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile: ✅ Works (slower on large images)

## Testing

```bash
npm test
```

Tests require PyOdide to be available. They will skip gracefully if PyOdide is not loaded.

## Future Extraction

This library is designed to be extracted into a separate npm package:
- `@rexxjs/scipy-via-pyodide`

All dependencies are already isolated within this directory.

## License

MIT
