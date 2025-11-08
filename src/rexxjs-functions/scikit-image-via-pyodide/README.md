# Scikit-Image Processing via PyOdide

Advanced image processing using scikit-image library via PyOdide.

## Features

- **Denoising**: Total variation, bilateral, non-local means
- **Edge Detection**: Canny edge detector
- **Morphological Operations**: Opening, closing
- **Exposure Adjustment**: Gamma, log, adaptive equalization
- **Filters**: Unsharp mask
- **REXX Integration**: Optimized for REXX function calls

## Available Functions

### Denoising
- `denoiseTV(imageData, weight)` - Total variation denoising
- `denoiseBilateral(imageData, sigma_color, sigma_spatial)` - Bilateral filtering
- `denoiseNLMeans(imageData, h)` - Non-local means denoising

### Edge Detection
- `cannyEdges(imageData, sigma)` - Canny edge detection

### Morphological Operations
- `morphOpening(imageData, size)` - Morphological opening
- `morphClosing(imageData, size)` - Morphological closing

### Exposure
- `adjustGamma(imageData, gamma)` - Gamma correction
- `adjustLog(imageData, gain)` - Logarithmic adjustment
- `equalizeAdaptive(imageData, clip_limit)` - Adaptive histogram equalization
- `rescaleIntensity(imageData)` - Rescale intensity range

### Filters
- `unsharpMaskFilter(imageData, radius, amount)` - Unsharp masking

## Usage

```javascript
import skimage from './scikit-image.js';

await skimage.initializePyodide();

const denoised = await skimage.denoiseTV(imageData, 0.1);
const edges = await skimage.cannyEdges(imageData, 1.0);
```

## License

MIT
