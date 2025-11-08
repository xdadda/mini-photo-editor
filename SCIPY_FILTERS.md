# SciPy Image Filters

This photo editor now includes advanced image processing capabilities using **real SciPy** via PyOdide integration.

## Features

### Available Filters

1. **Gaussian Blur** (`gaussian`)
   - Smooth blur using Gaussian kernel
   - Uses `scipy.ndimage.gaussian_filter`
   - Parameters: sigma=2.0

2. **Sobel Edge Detection** (`sobel`)
   - Detect edges using Sobel operator
   - Uses `scipy.ndimage.sobel`
   - Combines X and Y gradients
   - Parameters: intensity=1.0

3. **Median Filter** (`median`)
   - Noise reduction using median filtering
   - Uses `scipy.ndimage.median_filter`
   - Excellent for salt-and-pepper noise
   - Parameters: size=3

4. **Laplace Enhancement** (`laplace`)
   - Edge enhancement using Laplacian
   - Uses `scipy.ndimage.laplace`
   - Sharpens image by enhancing edges
   - Parameters: strength=0.5

5. **Uniform Blur** (`uniform`)
   - Box blur smoothing
   - Uses `scipy.ndimage.uniform_filter`
   - Fast averaging filter
   - Parameters: size=5

## UI Usage

1. Load an image in the photo editor
2. Click on the **"scipy"** section in the right sidebar
3. Select a filter button (Gaussian, Sobel, Median, Laplace, or Uniform)
4. Wait for processing (first use: ~10 seconds to load PyOdide)
5. View the result

## Command Bus Usage (REXX Integration)

The SciPy filters are fully accessible via the command bus, making them callable from REXX scripts or external applications.

### Example 1: Apply Gaussian Blur

```rexx
ADDRESS "http://localhost:8083/api/photoeditor" AS PHOTO

/* Apply Gaussian blur filter */
"applySciPyFilter filterType=gaussian"
```

### Example 2: List Available Filters

```rexx
ADDRESS "http://localhost:8083/api/photoeditor" AS PHOTO

/* Get list of all SciPy filters */
"listSciPyFilters"
```

### Example 3: Full Processing Pipeline

```rexx
ADDRESS "http://localhost:8083/api/photoeditor" AS PHOTO

/* Load image */
"loadImage path=/path/to/image.jpg"

/* Apply adjustments */
"setBrightness value=0.1"
"setContrast value=0.2"

/* Apply SciPy edge detection */
"applySciPyFilter filterType=sobel"

/* Export result */
"export processed.jpg"
```

## Command Bus API

### `applySciPyFilter`

Apply a SciPy-based image filter.

**Parameters:**
- `filterType` (required): One of `gaussian`, `sobel`, `median`, `laplace`, `uniform`
- `options` (optional): Filter-specific options (reserved for future use)

**Returns:**
```json
{
  "success": true,
  "filterType": "gaussian",
  "options": {}
}
```

### `listSciPyFilters`

Get a list of available SciPy filters.

**Returns:**
```json
{
  "filters": [
    {
      "type": "gaussian",
      "label": "Gaussian Blur",
      "description": "Smooth blur using Gaussian kernel"
    },
    ...
  ]
}
```

## Technical Details

### Architecture

The SciPy integration follows the RexxJS pattern established by `numpy-via-pyodide`:

1. **PyOdide Loading**: Lazy-loaded on first use (~10 seconds)
2. **Package Management**: Automatically loads NumPy and SciPy from CDN
3. **Data Flow**:
   - WebGL canvas → ImageData
   - ImageData → NumPy array (via PyOdide)
   - SciPy processing in Python
   - NumPy array → ImageData
   - ImageData → WebGL texture

### Performance

- **First Use**: ~10 seconds (PyOdide + SciPy download and initialization)
- **Subsequent Uses**: ~100-500ms per filter (depending on image size)
- **Memory**: Processes full-resolution images in Python

### File Structure

```
src/
├── scipy-via-pyodide.js    # PyOdide/SciPy integration module
├── _scipy.js               # UI component for scipy section
├── photo-editor-model.js   # Model with scipy parameters
├── photo-editor-controlbus.js  # Command bus handlers
└── app.js                  # Main app with scipy pipeline

index.html                  # PyOdide CDN loaded here
example-scipy-usage.rexx    # Example REXX usage
```

## Dependencies

- **PyOdide 0.28.3**: Python runtime in the browser
- **NumPy**: Array operations (bundled with PyOdide)
- **SciPy**: Scientific computing library (auto-loaded)

All dependencies are loaded from CDN (jsdelivr) on first use.

## Offline Support

After the first load, PyOdide and packages are cached by the browser. Subsequent sessions will work offline (assuming browser cache is intact).

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (may be slower)
- Mobile: ✅ Works but slower on large images

## Future Enhancements

Potential additions for future versions:

1. **Custom Parameters**: Expose sigma, size, strength as UI controls
2. **More Filters**: Add morphological operations (erosion, dilation)
3. **Batch Processing**: Apply multiple filters in sequence
4. **Filter Presets**: Save and recall filter combinations
5. **OpenCV Integration**: Add cv2 filters alongside SciPy
6. **Real-time Preview**: Show before/after comparison

## Comparison with WebGL Filters

| Feature | WebGL Filters | SciPy Filters |
|---------|---------------|---------------|
| Speed | ⚡ Real-time (~16ms) | 🐌 Slower (~200ms) |
| Startup | ✅ Instant | ⏳ ~10s first time |
| Accuracy | ⚠️ Approximations | ✅ 100% authentic |
| Offline | ✅ Built-in | ✅ Cached after first load |
| Algorithms | Limited | 🚀 Full SciPy library |

**Recommendation**: Use WebGL for real-time adjustments (brightness, contrast, filters). Use SciPy for algorithmic processing (edge detection, morphology, advanced filters).

## Related Examples

This implementation is inspired by examples in the RexxJS repository:

- `extras/addresses/pyodide/` - PyOdide ADDRESS handler
- `extras/functions/numpy-via-pyoide/` - NumPy integration pattern
- `examples/spreadsheet-poc/` - Spreadsheet with NumPy functions

## License

MIT License - Same as the main photo editor project.

## Credits

- **RexxJS**: REXX interpreter and command bus framework
- **PyOdide**: Python runtime in WebAssembly
- **SciPy**: Scientific computing library
- **NumPy**: Numerical computing foundation
