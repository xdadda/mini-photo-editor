# RexxJS Control Interface for Mini Photo Editor

**Scriptable Photo Editing via ARexx-Inspired Commands**

This document describes how to control the Mini Photo Editor programmatically using RexxJS scripts. The editor exposes a comprehensive control bus that allows batch processing, automation, and integration with other tools.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Connection](#connection)
3. [Available Commands](#available-commands)
4. [Parameter Categories](#parameter-categories)
5. [Filters](#filters)
6. [Examples](#examples)
7. [Testing](#testing)

---

## Quick Start

```rexx
/* Basic photo editing script */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Apply basic adjustments */
"setBrightness value=1.2"
"setContrast value=1.1"
"setSaturation value=0.9"

/* Apply a filter */
"applyFilter name=moon intensity=0.8"

/* Get result info */
LET info = "getImageInfo"
SAY "Edited image: " || info.width || "x" || info.height
```

---

## Connection

### Tauri Desktop Mode (HTTP)

```rexx
/* Connect to running desktop app */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO
```

**Starting the app with control bus:**
```bash
cd examples/mini-photo-editor
npm run tauri:dev -- -- --control-bus
```

### Web Mode (iframe postMessage)

For web mode, see `INTEGRATION_PLAN.md` for iframe communication setup.

---

## Available Commands

### Parameter Operations

**Generic Parameter Access:**
```rexx
/* Set any parameter */
"setParameter category=lights param=brightness value=1.2"

/* Get parameter value */
LET val = "getParameter category=lights param=brightness"
SAY "Brightness: " || val.value

/* Get all parameters */
LET all = "getAllParameters"
```

### Light Adjustments

```rexx
/* Individual adjustments */
"setBrightness value=0.5"      /* Range: -1.0 to 1.0 */
"setContrast value=0.3"        /* Range: -1.0 to 1.0 */
"setExposure value=0.2"        /* Range: -1.0 to 1.0 */
"setGamma value=0.1"           /* Range: -1.0 to 1.0 */
"setShadows value=-0.2"        /* Range: -1.0 to 1.0 */
"setHighlights value=0.3"      /* Range: -1.0 to 1.0 */

/* Batch light adjustment */
"adjustLights brightness=0.5 contrast=0.3 exposure=0.2"
```

### Color Adjustments

```rexx
/* Individual adjustments */
"setSaturation value=0.4"      /* Range: -1.0 to 1.0 */
"setTemperature value=0.3"     /* Range: -1.0 to 1.0 */
"setTint value=-0.1"           /* Range: -1.0 to 1.0 */
"setVibrance value=0.2"        /* Range: -1.0 to 1.0 */

/* Batch color adjustment */
"adjustColors temperature=0.3 tint=-0.1 saturation=0.4"
```

### Effects

```rexx
"setClarity value=0.5"         /* Sharpening, range: 0.0 to 1.0 */
"setNoise value=-0.3"          /* Noise reduction, range: -1.0 to 0.0 */
"setVignette value=0.4"        /* Vignette strength, range: 0.0 to 1.0 */
```

### Transform Operations

```rexx
/* Rotation and flip */
"setParameter category=trs param=angle value=90"          /* Rotate degrees */
"setParameter category=trs param=flipv value=1"           /* Flip vertical */
"setParameter category=trs param=fliph value=1"           /* Flip horizontal */

/* Scale and translate */
"setParameter category=trs param=scale value=1.5"         /* Scale factor */
"setParameter category=trs param=translateX value=100"    /* Pan X */
"setParameter category=trs param=translateY value=50"     /* Pan Y */
```

### Blur Effects

```rexx
/* Bokeh blur (lens blur with circular shapes) */
"setParameter category=blur param=bokehstrength value=0.5"
"setParameter category=blur param=bokehlensout value=0.6"
"setParameter category=blur param=centerX value=0.5"
"setParameter category=blur param=centerY value=0.5"

/* Gaussian blur (smooth blur) */
"setParameter category=blur param=gaussianstrength value=0.3"
"setParameter category=blur param=gaussianlensout value=0.7"
```

### Crop Operations

```rexx
/* Crop aspect ratio */
"setParameter category=crop param=ar value=1.5"           /* Aspect ratio */
"setParameter category=crop param=canvas_angle value=0"   /* Crop rotation */
```

### Resize Operations

```rexx
"setParameter category=resizer param=width value=1920"
"setParameter category=resizer param=height value=1080"
```

---

## Parameter Categories

### 1. Transform (trs)
- **translateX** (number): Horizontal pan offset
- **translateY** (number): Vertical pan offset
- **angle** (degrees): Rotation angle
- **scale** (number): Zoom scale
- **flipv** (0/1): Flip vertical
- **fliph** (0/1): Flip horizontal

### 2. Crop (crop)
- **currentcrop** (number): Current crop state
- **glcrop** (number): GL crop state
- **canvas_angle** (degrees): Crop rotation
- **ar** (number): Aspect ratio
- **arindex** (number): Aspect ratio index

### 3. Lights (lights)
- **brightness** (-1.0 to 1.0): Brightness adjustment
- **exposure** (-1.0 to 1.0): Exposure adjustment
- **gamma** (-1.0 to 1.0): Gamma adjustment
- **contrast** (-1.0 to 1.0): Contrast adjustment
- **shadows** (-1.0 to 1.0): Shadow recovery
- **highlights** (-1.0 to 1.0): Highlight recovery
- **bloom** (0.0 to 1.0): Bloom effect strength

### 4. Colors (colors)
- **temperature** (-1.0 to 1.0): Color temperature (warm/cool)
- **tint** (-1.0 to 1.0): Tint adjustment (magenta/green)
- **vibrance** (-1.0 to 1.0): Vibrance (smart saturation)
- **saturation** (-1.0 to 1.0): Saturation
- **sepia** (0.0 to 1.0): Sepia tone strength

### 5. Effects (effects)
- **clarity** (0.0 to 1.0): Sharpening/clarity
- **noise** (-1.0 to 0.0): Noise reduction
- **vignette** (0.0 to 1.0): Vignette strength

### 6. Blur (blur)
- **bokehstrength** (0.0 to 1.0): Bokeh blur strength
- **bokehlensout** (0.0 to 1.0): Bokeh lens outer radius
- **gaussianstrength** (0.0 to 1.0): Gaussian blur strength
- **gaussianlensout** (0.0 to 1.0): Gaussian lens outer radius
- **centerX** (0.0 to 1.0): Blur center X (normalized)
- **centerY** (0.0 to 1.0): Blur center Y (normalized)

### 7. Filters (filters)
- **opt** (0-26): Filter index (see filters list below)
- **mix** (0.0 to 1.0): Filter intensity/mix

### 8. Resizer (resizer)
- **width** (pixels): Target width
- **height** (pixels): Target height

### 9. Blender (blender)
- **blendmap** (image): Blend overlay image
- **blendmix** (0.0 to 1.0): Blend strength

### 10. Perspective (perspective)
- **quad** (array): Perspective quad points
- **modified** (0/1): Modification flag

### 11. Curve (curve)
- **curvepoints** (array): Color curve control points

### 12. Heal (heal)
- **healmask** (mask): Inpainting mask data

---

## Filters

### Available Filters

```rexx
/* List all available filters */
LET filters = "listFilters"
/* Returns: filters array with all filter names */
```

**Filter List:**
1. **none** - No filter
2. **chrome** - Chrome effect
3. **fade** - Faded film look
4. **instant** - Instant camera look
5. **transfer** - Transfer film emulation
6. **mono** - Monochrome
7. **noir** - Film noir
8. **process** - Cross-process effect
9. **tonal** - Tonal effect
10. **1977** - Retro 1977 look
11. **aden** - Aden filter
12. **amaro** - Amaro filter
13. **clarendon** - Clarendon filter
14. **clarendon2** - Clarendon variant 2
15. **crema** - Crema filter
16. **gingham** - Gingham filter
17. **gingham2** - Gingham variant 2
18. **juno** - Juno filter
19. **lark** - Lark filter
20. **ludwig** - Ludwig filter
21. **moon** - Moon filter ⭐
22. **moon2** - Moon variant 2
23. **perpetua** - Perpetua filter
24. **perpetua2** - Perpetua variant 2
25. **reyes** - Reyes filter
26. **slumber** - Slumber filter
27. **xpro** - Cross-process filter

### Applying Filters

```rexx
/* Apply filter with default intensity (1.0) */
"applyFilter name=moon"

/* Apply filter with custom intensity */
"applyFilter name=vintage intensity=0.7"

/* Mix multiple effects */
"applyFilter name=moon intensity=0.5"
"setBrightness value=0.2"
"setContrast value=0.1"
```

---

## Examples

### Example 1: Basic Enhancement

```rexx
/* Enhance photo with basic adjustments */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Brighten and add contrast */
"setBrightness value=0.3"
"setContrast value=0.2"
"setSaturation value=0.1"

/* Add sharpness */
"setClarity value=0.3"

SAY "Basic enhancement complete"
```

### Example 2: Vintage Film Look

```rexx
/* Create vintage film aesthetic */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Warm temperature */
"setTemperature value=0.3"

/* Reduce saturation slightly */
"setSaturation value=-0.2"

/* Add vignette */
"setVignette value=0.4"

/* Apply vintage filter */
"applyFilter name=1977 intensity=0.7"

SAY "Vintage look applied"
```

### Example 3: Moon Filter with Enhancements

```rexx
/* Apply moon filter with custom adjustments */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Apply moon filter */
"applyFilter name=moon intensity=0.8"

/* Boost the effect */
"setContrast value=0.2"
"setClarity value=0.3"

/* Get final state */
LET params = "getAllParameters"
SAY "Filter applied: " || params.parameters.filters.opt
SAY "Intensity: " || params.parameters.filters.mix
```

### Example 4: Batch Processing

```rexx
/* Process multiple images with same settings */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Define processing function */
PROCEDURE PROCESS_IMAGE
  /* Apply consistent adjustments */
  "adjustLights brightness=0.2 contrast=0.15 exposure=0.1"
  "adjustColors saturation=0.1 vibrance=0.15"
  "setClarity value=0.25"
  "applyFilter name=lark intensity=0.6"
  RETURN

/* Would process each image (requires image loading support) */
SAY "Batch processing template ready"
CALL PROCESS_IMAGE
```

### Example 5: Portrait Enhancement

```rexx
/* Enhance portrait photo */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Soft focus with bokeh blur */
"setParameter category=blur param=bokehstrength value=0.3"
"setParameter category=blur param=centerX value=0.5"
"setParameter category=blur param=centerY value=0.4"

/* Warm skin tones */
"setTemperature value=0.2"
"setTint value=-0.05"

/* Subtle vignette */
"setVignette value=0.2"

/* Light clarity for detail */
"setClarity value=0.15"

SAY "Portrait enhancement complete"
```

### Example 6: Black & White Conversion

```rexx
/* Convert to dramatic black and white */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Apply mono filter */
"applyFilter name=noir intensity=1.0"

/* Boost contrast */
"setContrast value=0.4"

/* Adjust shadows and highlights */
"setShadows value=-0.2"
"setHighlights value=0.2"

/* Add clarity */
"setClarity value=0.5"

SAY "Black and white conversion complete"
```

### Example 7: HDR-Style Effect

```rexx
/* Create HDR-style look */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Recover shadows and highlights */
"setShadows value=0.5"
"setHighlights value=-0.3"

/* Boost saturation and clarity */
"setSaturation value=0.4"
"setClarity value=0.6"

/* Reduce contrast for flat look */
"setContrast value=-0.2"

SAY "HDR-style effect applied"
```

### Example 8: Using RexxJS Expressions

```rexx
/* Use RexxJS functions for dynamic values */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Use variable resolver to read current values */
LET current_brightness = "evaluate expression=LIGHTS_BRIGHTNESS"
SAY "Current brightness: " || current_brightness.result

/* Calculate new value */
LET new_val = current_brightness.result + 0.2
"setBrightness value=" || new_val

/* Conditional adjustments */
IF current_brightness.result < 0 THEN DO
    "setBrightness value=0.3"
    SAY "Brightened dark image"
END
```

---

## Testing

### Manual Testing

```bash
# Terminal 1: Start photo editor with control bus
cd examples/mini-photo-editor
npm run tauri:dev -- -- --control-bus

# Terminal 2: Run test script
cd core
./rexx ../examples/mini-photo-editor/tests/test-moon-filter.rexx
```

### Automated Testing with Rexxt

**File: `tests/photo-editor-filters.rexx`**

```rexx
/* Test all filters */
ADDRESS TEST

/* Connect to photo editor */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Test filter application */
ADDRESS TEST
EXPECT THAT "applyFilter name=moon intensity=0.8" SUCCEEDS

/* Verify filter was applied */
LET params = "getAllParameters"
ADDRESS TEST
EXPECT params.parameters.filters.opt EQUALS 20      /* moon = index 20 */
EXPECT params.parameters.filters.mix EQUALS 0.8

SAY "✓ Moon filter test passed"
```

### Asserting Filter Application

Since visual verification is difficult, we can assert:

1. **Parameter values**: Check that filter index and intensity are set correctly
2. **State export**: Export state before/after and compare
3. **Batch consistency**: Apply same settings to multiple images, verify identical params

**Example assertion:**

```rexx
/* Test moon filter sets correct parameters */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Reset first */
"reset"

/* Apply moon filter */
LET result = "applyFilter name=moon intensity=0.75"

/* Assert success */
IF result.success != 1 THEN DO
    SAY "✗ FAILED: Filter application failed"
    EXIT 1
END

/* Assert correct filter index */
IF result.index != 20 THEN DO
    SAY "✗ FAILED: Expected filter index 20, got " || result.index
    EXIT 1
END

/* Assert correct intensity */
IF result.intensity != 0.75 THEN DO
    SAY "✗ FAILED: Expected intensity 0.75, got " || result.intensity
    EXIT 1
END

/* Get parameters to verify state */
LET params = "getAllParameters"
IF params.parameters.filters.opt != 20 THEN DO
    SAY "✗ FAILED: Filter not applied to state"
    EXIT 1
END

SAY "✓ PASSED: Moon filter correctly applied with intensity 0.75"
```

---

## Command Reference

### Info Commands

```rexx
"getImageInfo"           /* Get image dimensions, format, colorspace */
"getAllParameters"       /* Get all current parameter values */
"exportState"            /* Export complete state as JSON */
"importState"            /* Import state from JSON */
"listCommands"           /* List all available commands */
"listFilters"            /* List all available filters */
"getVersion"             /* Get control bus version */
```

### Utility Commands

```rexx
"reset"                  /* Reset all parameters to defaults */
"evaluate expression=X"  /* Evaluate RexxJS expression */
```

---

## Integration with Other Tools

### CI/CD Pipeline

```yaml
# .github/workflows/process-images.yml
- name: Process product photos
  run: |
    cd core
    ./rexx ../examples/mini-photo-editor/scripts/batch-process.rexx
```

### Image Processing Pipeline

```rexx
/* Integrate with image pipeline */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Process RAW -> JPEG workflow */
/* 1. Load image (via app UI or future loadImage command) */
/* 2. Apply adjustments */
"adjustLights brightness=0.2 contrast=0.1"
/* 3. Apply filter */
"applyFilter name=lark intensity=0.7"
/* 4. Export (via app UI or future exportImage command) */
```

---

## Future Enhancements

Planned features for complete control bus:

- [ ] `loadImage url=... name=...` - Load image programmatically
- [ ] `exportImage format=jpeg quality=0.9` - Export processed image
- [ ] `applyCrop x=... y=... width=... height=...` - Apply crop
- [ ] `applyPerspective points=[...]` - Apply perspective correction
- [ ] `applyHeal mask=...` - Apply healing/inpainting
- [ ] `setColorCurve points=[...]` - Set custom color curve

---

## Troubleshooting

### Connection Issues

```rexx
/* Test connection */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

LET version = "getVersion"
IF version.version THEN DO
    SAY "✓ Connected: " || version.name || " v" || version.version
END
ELSE DO
    SAY "✗ Connection failed"
END
```

### Parameter Out of Range

```rexx
/* Parameters should be in valid ranges */
/* Lights/colors: -1.0 to 1.0 */
/* Effects: 0.0 to 1.0 */
/* Filter intensity: 0.0 to 1.0 */

/* This will work */
"setBrightness value=0.5"

/* This may be clamped or error */
"setBrightness value=2.0"  /* Out of range */
```

---

## License

This control interface follows the original MIT License of the Mini Photo Editor.

**Original Author**: xdadda (https://github.com/xdadda/mini-photo-editor)
**RexxJS Integration**: Paul Hammant & Contributors

---

## Resources

- **Mini Photo Editor**: https://github.com/xdadda/mini-photo-editor
- **RexxJS**: https://github.com/paul-hammant/RexxJS
- **Integration Guide**: `/Rexxjs_App_Integration.md`
- **Tauri Documentation**: https://tauri.app/

---

**Version**: 1.0
**Last Updated**: 2025-11-06
