# Mini Photo Editor - RexxJS Integration

**WebGL2 Photo Editor with Scriptable RexxJS Control**

This is the original [Mini Photo Editor](https://github.com/xdadda/mini-photo-editor) by xdadda, integrated with Tauri and RexxJS to provide scriptable control via ARexx-inspired commands.

## What's Been Added

This integration adds three layers of scriptability:

1. **PhotoEditorModel** (`src/photo-editor-model.js`) - Pure JavaScript state management
2. **PhotoEditorRexxAdapter** (`src/photo-editor-rexx-adapter.js`) - RexxJS integration layer
3. **PhotoEditorControlBus** (`src/photo-editor-controlbus.js`) - Remote command interface
4. **Tauri Backend** (`src-tauri/`) - HTTP server for external control
5. **Comprehensive Tests** (`tests/test-moon-filter.rexx`) - Rexxt test suite

## Quick Start

### Run in Development Mode

```bash
# Start photo editor
./photoeditor-dev

# Or with control bus enabled (for scripting)
./photoeditor-dev --control-bus
```

### Test with RexxJS

```bash
# Terminal 1: Start photo editor with control bus
./photoeditor-dev --control-bus

# Terminal 2: Run moon filter test
cd ../../core
./rexxt ../examples/mini-photo-editor/tests/test-moon-filter.rexx
```

## Architecture

```
External Rexx Script (test-moon-filter.rexx)
    ↓ HTTP POST with Bearer token
Rust HTTP Server (src-tauri/src/lib.rs)
    ↓ COMET-style long polling
Control Bus Bridge (src/photo-editor-controlbus-bridge.js)
    ↓ Command parsing
PhotoEditorControlBus (src/photo-editor-controlbus.js)
    ↓ State manipulation
PhotoEditorModel (src/photo-editor-model.js)
    ↓ Parameter storage
WebGL Rendering (original mini-photo-editor)
```

## Available Commands

### Filter Operations

```rexx
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Apply moon filter */
"applyFilter name=moon intensity=0.8"

/* List all 27 filters */
LET filters = "listFilters"
```

### Light Adjustments

```rexx
/* Individual adjustments */
"setBrightness value=0.3"
"setContrast value=0.2"
"setExposure value=0.1"

/* Batch adjustment */
"adjustLights brightness=0.3 contrast=0.2 exposure=0.1"
```

### Color Adjustments

```rexx
"setSaturation value=0.2"
"setTemperature value=0.3"
"setTint value=-0.1"

/* Batch adjustment */
"adjustColors saturation=0.2 temperature=0.3 tint=-0.1"
```

### Effects

```rexx
"setClarity value=0.5"      /* Sharpening */
"setNoise value=-0.3"       /* Noise reduction */
"setVignette value=0.4"     /* Vignette effect */
```

### State Management

```rexx
/* Get all parameters */
LET params = "getAllParameters"

/* Export current state */
LET state = "exportState"

/* Reset to defaults */
"reset"
```

**See [README.rexx.md](README.rexx.md) for complete command reference.**

## File Structure

```
examples/mini-photo-editor/
├── README.md                        # Original project README
├── README.rexx.md                   # Complete RexxJS command reference
├── README.integration.md            # This file
├── REXXJS_INTEGRATION_PLAN.md       # Detailed integration architecture
├── photoeditor-dev                  # Development launcher script
├── sample-state.json                # Example state (moon filter + enhancements)
│
├── src/                             # Original source + integration layer
│   ├── photo-editor-model.js        # Pure JavaScript state management
│   ├── photo-editor-rexx-adapter.js # RexxJS integration
│   ├── photo-editor-controlbus.js   # Command interface (web mode)
│   ├── photo-editor-controlbus-bridge.js  # HTTP polling bridge (Tauri)
│   ├── app.js                       # Original photo editor UI
│   └── ... (original files)
│
├── src-tauri/                       # Tauri desktop app backend
│   ├── src/
│   │   ├── lib.rs                   # HTTP server with COMET polling
│   │   └── main.rs                  # Entry point
│   ├── Cargo.toml                   # Rust dependencies
│   └── tauri.conf.json              # Tauri configuration
│
└── tests/
    └── test-moon-filter.rexx        # Comprehensive Rexxt test suite
```

## Integration Components

### 1. PhotoEditorModel

Pure JavaScript model with no UI dependencies:

```javascript
const model = new PhotoEditorModel();

// Set parameter
model.setParameter('lights', 'brightness', 0.5);

// Get parameter
const brightness = model.getParameter('lights', 'brightness');

// Apply filter
model.applyFilter('moon', 0.8);

// Export state
const state = model.exportState();
```

### 2. PhotoEditorRexxAdapter

Connects model to RexxJS interpreter:

```javascript
const adapter = new PhotoEditorRexxAdapter(model);
await adapter.initializeInterpreter(window.RexxInterpreter, window.parse);

// Now RexxJS can access parameters
// e.g., LIGHTS_BRIGHTNESS resolves via variableResolver
```

### 3. PhotoEditorControlBus

Handles remote commands:

```javascript
const controlBus = new PhotoEditorControlBus(model, adapter, appComponent);
controlBus.enable();

// Executes commands from postMessage or HTTP bridge
await controlBus.executeCommand('applyFilter', { name: 'moon', intensity: 0.8 });
```

### 4. Tauri HTTP Backend

Rust server with COMET-style long polling:

- **Endpoint**: `POST http://localhost:8083/api/photoeditor`
- **Auth**: Bearer token (`dev-token-12345`)
- **Polling**: Browser polls `/api/poll` for commands
- **Results**: Browser posts to `/api/result`

## Testing Strategy

### Asserting Filter Application

Since visual verification is difficult, we verify:

1. **Filter index**: Moon filter = index 20, Moon2 = index 21
2. **Intensity**: Verify exact value (0.8, 0.7, etc.)
3. **State persistence**: Parameters stored in model
4. **Combination**: Filter + other adjustments work together
5. **Reset**: Clean slate after reset

**Example from test:**

```rexx
/* Apply moon filter */
LET moon_result = "applyFilter name=moon intensity=0.8"

/* Assert correct index */
ADDRESS TEST
EXPECT moon_result.index EQUALS 20

/* Assert correct intensity */
EXPECT moon_result.intensity EQUALS 0.8

/* Verify state */
LET params = "getAllParameters"
EXPECT params.parameters.filters.opt EQUALS 20
EXPECT params.parameters.filters.mix EQUALS 0.8
```

### Running Tests

```bash
# Run comprehensive moon filter test
cd ../../core
./rexxt ../examples/mini-photo-editor/tests/test-moon-filter.rexx

# Expected output:
# ✓ Version: 1.0
# ✓ Reset successful
# ✓ Initial filter: none (index 0)
# ✓ Moon filter applied successfully
# ✓ Filter parameters verified in state
# ✓ Found 27 filters including 'moon'
# ... (10 tests total)
# All tests passed! ✓
```

## Development Workflow

### 1. Make Changes

```bash
# Edit model
vim src/photo-editor-model.js

# Edit adapter
vim src/photo-editor-rexx-adapter.js

# Edit control bus
vim src/photo-editor-controlbus.js
```

### 2. Test Changes

```bash
# Start app with control bus
./photoeditor-dev --control-bus

# Run tests
cd ../../core
./rexxt ../examples/mini-photo-editor/tests/test-moon-filter.rexx
```

### 3. Commit Changes

```bash
git add .
git commit -m "Description of changes"
git push
```

## Building for Production

```bash
# Build desktop app
npm run tauri:build

# Output:
# - macOS: src-tauri/target/release/bundle/dmg/
# - Windows: src-tauri/target/release/bundle/msi/
# - Linux: src-tauri/target/release/bundle/deb/
```

## Example Use Cases

### 1. Batch Photo Processing

```rexx
/* Process all product photos */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Define processing recipe */
"adjustLights brightness=0.2 contrast=0.15"
"adjustColors saturation=0.1 vibrance=0.15"
"setClarity value=0.25"
"applyFilter name=lark intensity=0.6"

/* Repeat for each photo... */
```

### 2. CI/CD Integration

```yaml
# .github/workflows/process-images.yml
- name: Process product photos
  run: |
    ./photoeditor-dev --control-bus &
    sleep 2
    cd ../../core
    ./rexx ../examples/mini-photo-editor/scripts/batch-process.rexx
```

### 3. Interactive Scripting

```rexx
/* Create custom filter preset */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

SAY "Creating vintage portrait preset..."
"applyFilter name=1977 intensity=0.7"
"setTemperature value=0.3"
"setVignette value=0.4"
"setParameter category=blur param=bokehstrength value=0.2"

SAY "Preset applied! Export your image."
```

## Parameter Reference

### 13 Parameter Categories

1. **trs** (transform): translateX, translateY, angle, scale, flipv, fliph
2. **crop**: currentcrop, glcrop, canvas_angle, ar, arindex
3. **lights**: brightness, exposure, gamma, contrast, shadows, highlights, bloom
4. **colors**: temperature, tint, vibrance, saturation, sepia
5. **effects**: clarity, noise, vignette
6. **curve**: curvepoints
7. **filters**: opt (0-26), mix (0.0-1.0)
8. **perspective**: quad, modified
9. **perspective2**: before, after, modified
10. **blender**: blendmap, blendmix
11. **resizer**: width, height
12. **blur**: bokehstrength, bokehlensout, gaussianstrength, gaussianlensout, centerX, centerY
13. **heal**: healmask

### 27 Built-in Filters

none, chrome, fade, instant, transfer, mono, noir, process, tonal, 1977, aden, amaro, clarendon, clarendon2, crema, gingham, gingham2, juno, lark, ludwig, **moon**, moon2, perpetua, perpetua2, reyes, slumber, xpro

**See [README.rexx.md](README.rexx.md) for ranges and detailed descriptions.**

## Troubleshooting

### App Won't Start

```bash
# Check if RexxJS bundle is built
ls ../../core/src/repl/dist/rexxjs.bundle.js

# If missing, build it
cd ../../core/src/repl
npm install
npm run build
```

### Control Bus Not Responding

```bash
# Check if control bus is enabled
# Should see: "Control Bus HTTP API enabled on port 8083"

# Test connection
curl http://localhost:8083/api/photoeditor \
  -H "Authorization: Bearer dev-token-12345" \
  -H "Content-Type: application/json" \
  -d '{"command": "getVersion"}'
```

### Tests Failing

```bash
# Ensure app is running with control bus
./photoeditor-dev --control-bus

# Wait for "Control Bus enabled" message before running tests
```

## Credits

**Original Project**: [Mini Photo Editor](https://github.com/xdadda/mini-photo-editor) by xdadda
**License**: MIT
**RexxJS Integration**: Paul Hammant & Contributors
**Integration Guide**: [Rexxjs_App_Integration.md](/Rexxjs_App_Integration.md)

## Resources

- **Original README**: [README.md](README.md)
- **RexxJS Commands**: [README.rexx.md](README.rexx.md)
- **Integration Plan**: [REXXJS_INTEGRATION_PLAN.md](REXXJS_INTEGRATION_PLAN.md)
- **RexxJS Project**: [https://github.com/paul-hammant/RexxJS](https://github.com/paul-hammant/RexxJS)
- **Tauri**: [https://tauri.app/](https://tauri.app/)

---

**Version**: 1.0
**Last Updated**: 2025-11-06
**Status**: ✅ Complete Integration
