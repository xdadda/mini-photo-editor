/* Example: Using SciPy Filters via Command Bus
 *
 * This example demonstrates how to use SciPy-based image processing
 * filters from outside the photo editor app via the command bus.
 *
 * The command bus allows REXX scripts to control the photo editor
 * and apply advanced Python-based image processing filters.
 */

SAY "=== SciPy Filter Demo via Command Bus ==="
SAY ""

/* List available SciPy filters */
SAY "Available SciPy filters:"
/* You would call the command bus here to list filters */
/* Example: ADDRESS PHOTOEDITOR "listSciPyFilters" */
SAY "  - gaussian: Gaussian blur"
SAY "  - sobel: Edge detection"
SAY "  - median: Noise reduction"
SAY "  - laplace: Edge enhancement"
SAY "  - uniform: Box blur"
SAY ""

/* Apply a Gaussian blur filter */
SAY "Applying Gaussian blur filter..."
/* Example command bus call: */
/* ADDRESS PHOTOEDITOR "applySciPyFilter filterType=gaussian" */
SAY "  Filter: gaussian"
SAY "  Status: Applied successfully"
SAY ""

/* Apply a Sobel edge detection filter */
SAY "Applying Sobel edge detection..."
/* Example command bus call: */
/* ADDRESS PHOTOEDITOR "applySciPyFilter filterType=sobel" */
SAY "  Filter: sobel"
SAY "  Status: Applied successfully"
SAY ""

/* Apply a Median filter for noise reduction */
SAY "Applying Median filter..."
/* Example command bus call: */
/* ADDRESS PHOTOEDITOR "applySciPyFilter filterType=median" */
SAY "  Filter: median"
SAY "  Status: Applied successfully"
SAY ""

SAY "=== Demo Complete ==="
SAY ""
SAY "Note: To use these filters from REXX, you need to:"
SAY "  1. Have PyOdide loaded (first use takes ~10 seconds)"
SAY "  2. Use the command bus to send commands to the photo editor"
SAY "  3. The photo editor will process images using real SciPy/NumPy"
SAY ""
SAY "Real-world usage pattern:"
SAY "  ADDRESS 'http://localhost:8083/api/photoeditor' AS PHOTO"
SAY "  'applySciPyFilter filterType=gaussian'"
SAY "  'export processed-image.jpg'"
