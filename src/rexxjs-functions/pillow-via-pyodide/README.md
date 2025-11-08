# Pillow (PIL) Image Processing via PyOdide

Real Python Imaging Library (Pillow/PIL) for browser-based image manipulation using PyOdide.

## Features

- **100% Authentic Pillow**: Uses real Python PIL library via PyOdide
- **Rich Filter Set**: Blur, sharpen, emboss, edge detection, and more
- **Image Enhancement**: Brightness, contrast, color, sharpness adjustments
- **Image Operations**: Auto-contrast, equalize, posterize, solarize
- **REXX Integration**: Optimized version for use as REXX functions

## Available Filters

### Basic Filters
- `blurFilter(imageData)` - Blur filter
- `sharpenFilter(imageData)` - Sharpen filter
- `smoothFilter(imageData)` - Smooth filter
- `detailFilter(imageData)` - Detail enhancement

### Edge Filters
- `contourFilter(imageData)` - Contour detection
- `edgeEnhanceFilter(imageData)` - Edge enhancement
- `edgeEnhanceMoreFilter(imageData)` - More aggressive edge enhancement
- `findEdgesFilter(imageData)` - Find edges
- `embossFilter(imageData)` - Emboss effect

### Enhancements
- `enhanceBrightness(imageData, factor)` - Adjust brightness (factor: 0.0-2.0)
- `enhanceContrast(imageData, factor)` - Adjust contrast (factor: 0.0-2.0)
- `enhanceColor(imageData, factor)` - Adjust color saturation (factor: 0.0-2.0)
- `enhanceSharpness(imageData, factor)` - Adjust sharpness (factor: 0.0-2.0)

### Operations
- `autoContrast(imageData, cutoff)` - Automatic contrast adjustment
- `equalize(imageData)` - Histogram equalization
- `posterize(imageData, bits)` - Reduce colors (bits: 1-8)
- `solarize(imageData, threshold)` - Solarization effect (threshold: 0-255)

## Usage

### Standard JavaScript

```javascript
import pillow from './pillow.js';

await pillow.initializePyodide();

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Apply blur
const blurred = await pillow.blurFilter(imageData);

// Enhance contrast
const enhanced = await pillow.enhanceContrast(imageData, 1.5);

// Auto-contrast
const autoAdjusted = await pillow.autoContrast(imageData);

ctx.putImageData(blurred, 0, 0);
```

### REXX Integration

```rexx
/* Apply Pillow filters */
REQUIRE "pillow-via-pyodide"

SAY "Applying blur..."
result = PIL_BLUR(imageData)

SAY "Enhancing contrast..."
enhanced = PIL_ENHANCE_CONTRAST(imageData, 1.5)

SAY "Finding edges..."
edges = PIL_FIND_EDGES(imageData)
```

## Performance

- **First Load**: ~10 seconds (PyOdide + Pillow download)
- **Subsequent Loads**: Instant (cached)
- **Processing**: ~50-300ms per filter

## License

MIT
