/**
 * PhotoEditorControlBus - Remote control interface for photo editor
 *
 * Responsibilities:
 * - Listen for remote commands via postMessage (web mode)
 * - Execute commands on PhotoEditorModel
 * - Return results to caller
 * - ARexx-inspired command interface
 *
 * Tauri HTTP mode is handled by control bus bridge (separate file)
 */

class PhotoEditorControlBus {
    constructor(model, adapter, appComponent) {
        this.model = model;
        this.adapter = adapter;
        this.appComponent = appComponent;
        this.enabled = false;

        // Define available commands
        this.commands = {
            // Parameter operations
            setParameter: this.handleSetParameter.bind(this),
            getParameter: this.handleGetParameter.bind(this),
            getAllParameters: this.handleGetAllParameters.bind(this),

            // Convenience setters
            setBrightness: this.handleSetBrightness.bind(this),
            setContrast: this.handleSetContrast.bind(this),
            setExposure: this.handleSetExposure.bind(this),
            setGamma: this.handleSetGamma.bind(this),
            setShadows: this.handleSetShadows.bind(this),
            setHighlights: this.handleSetHighlights.bind(this),
            setSaturation: this.handleSetSaturation.bind(this),
            setTemperature: this.handleSetTemperature.bind(this),
            setTint: this.handleSetTint.bind(this),
            setVibrance: this.handleSetVibrance.bind(this),
            setClarity: this.handleSetClarity.bind(this),
            setNoise: this.handleSetNoise.bind(this),
            setVignette: this.handleSetVignette.bind(this),

            // Batch operations
            adjustLights: this.handleAdjustLights.bind(this),
            adjustColors: this.handleAdjustColors.bind(this),

            // Filter operations
            applyFilter: this.handleApplyFilter.bind(this),
            listFilters: this.handleListFilters.bind(this),

            // Info operations
            getImageInfo: this.handleGetImageInfo.bind(this),
            exportState: this.handleExportState.bind(this),
            importState: this.handleImportState.bind(this),

            // Utility operations
            reset: this.handleReset.bind(this),
            evaluate: this.handleEvaluate.bind(this),

            // Introspection
            listCommands: this.handleListCommands.bind(this),
            getVersion: this.handleGetVersion.bind(this)
        };
    }

    /**
     * Enable control bus (start listening for messages)
     */
    enable() {
        if (this.enabled) return;
        this.enabled = true;

        if (typeof window !== 'undefined') {
            window.addEventListener('message', this.handleMessage.bind(this));
            console.log('PhotoEditorControlBus: Enabled (web mode)');
        }
    }

    /**
     * Disable control bus
     */
    disable() {
        if (!this.enabled) return;
        this.enabled = false;

        if (typeof window !== 'undefined') {
            window.removeEventListener('message', this.handleMessage.bind(this));
            console.log('PhotoEditorControlBus: Disabled');
        }
    }

    /**
     * Handle incoming postMessage
     */
    async handleMessage(event) {
        // Validate message structure
        if (!event.data || typeof event.data !== 'object') {
            return;
        }

        const { type, command, params, requestId } = event.data;

        // Only handle photoeditor-control messages
        if (type !== 'photoeditor-control') {
            return;
        }

        console.log('PhotoEditorControlBus received:', command, params);

        try {
            // Execute command
            const result = await this.executeCommand(command, params);

            // Send response
            const response = {
                type: 'photoeditor-control-response',
                requestId: requestId,
                success: true,
                result: result
            };

            if (event.source) {
                event.source.postMessage(response, event.origin);
            }
        } catch (error) {
            // Send error response
            const response = {
                type: 'photoeditor-control-response',
                requestId: requestId,
                success: false,
                error: error.message
            };

            if (event.source) {
                event.source.postMessage(response, event.origin);
            }
        }
    }

    /**
     * Execute a command
     */
    async executeCommand(command, params = {}) {
        const handler = this.commands[command];

        if (!handler) {
            throw new Error(`Unknown command: ${command}`);
        }

        return await handler(params);
    }

    // Command handlers

    async handleSetParameter(params) {
        const { category, param, value } = params;
        if (!category || !param || value === undefined) {
            throw new Error('Missing required parameters: category, param, value');
        }

        const result = this.model.setParameter(category, param, parseFloat(value));

        // Trigger UI update
        if (this.appComponent && this.appComponent.forceUpdate) {
            this.appComponent.forceUpdate();
        }

        return result;
    }

    async handleGetParameter(params) {
        const { category, param } = params;
        if (!category || !param) {
            throw new Error('Missing required parameters: category, param');
        }

        const value = this.model.getParameter(category, param);
        return { category, param, value };
    }

    async handleGetAllParameters() {
        return { parameters: this.model.getAllParameters() };
    }

    // Convenience setters
    async handleSetBrightness(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'lights', param: 'brightness', value });
    }

    async handleSetContrast(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'lights', param: 'contrast', value });
    }

    async handleSetExposure(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'lights', param: 'exposure', value });
    }

    async handleSetGamma(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'lights', param: 'gamma', value });
    }

    async handleSetShadows(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'lights', param: 'shadows', value });
    }

    async handleSetHighlights(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'lights', param: 'highlights', value });
    }

    async handleSetSaturation(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'colors', param: 'saturation', value });
    }

    async handleSetTemperature(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'colors', param: 'temperature', value });
    }

    async handleSetTint(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'colors', param: 'tint', value });
    }

    async handleSetVibrance(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'colors', param: 'vibrance', value });
    }

    async handleSetClarity(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'effects', param: 'clarity', value });
    }

    async handleSetNoise(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'effects', param: 'noise', value });
    }

    async handleSetVignette(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'effects', param: 'vignette', value });
    }

    // Batch operations
    async handleAdjustLights(params) {
        const { brightness, contrast, exposure, gamma, shadows, highlights } = params;
        const results = [];

        if (brightness !== undefined) {
            results.push(await this.handleSetBrightness({ value: brightness }));
        }
        if (contrast !== undefined) {
            results.push(await this.handleSetContrast({ value: contrast }));
        }
        if (exposure !== undefined) {
            results.push(await this.handleSetExposure({ value: exposure }));
        }
        if (gamma !== undefined) {
            results.push(await this.handleSetGamma({ value: gamma }));
        }
        if (shadows !== undefined) {
            results.push(await this.handleSetShadows({ value: shadows }));
        }
        if (highlights !== undefined) {
            results.push(await this.handleSetHighlights({ value: highlights }));
        }

        return { success: true, adjusted: results.length, results: results };
    }

    async handleAdjustColors(params) {
        const { temperature, tint, saturation, vibrance } = params;
        const results = [];

        if (temperature !== undefined) {
            results.push(await this.handleSetTemperature({ value: temperature }));
        }
        if (tint !== undefined) {
            results.push(await this.handleSetTint({ value: tint }));
        }
        if (saturation !== undefined) {
            results.push(await this.handleSetSaturation({ value: saturation }));
        }
        if (vibrance !== undefined) {
            results.push(await this.handleSetVibrance({ value: vibrance }));
        }

        return { success: true, adjusted: results.length, results: results };
    }

    // Filter operations
    async handleApplyFilter(params) {
        const { name, intensity = 1.0 } = params;
        if (!name) throw new Error('Missing parameter: name');

        const result = this.model.applyFilter(name, intensity);

        // Trigger UI update
        if (this.appComponent && this.appComponent.forceUpdate) {
            this.appComponent.forceUpdate();
        }

        return result;
    }

    async handleListFilters() {
        return { filters: this.model.listFilters() };
    }

    // Info operations
    async handleGetImageInfo() {
        const metadata = this.model.getMetadata();
        if (!metadata) {
            return { error: 'No image loaded' };
        }

        return {
            width: metadata.file?.width || 0,
            height: metadata.file?.height || 0,
            size: metadata.file?.size || 0,
            format: metadata.format || 'unknown',
            colorspace: metadata.colorspace || 'srgb'
        };
    }

    async handleExportState() {
        return this.model.exportState();
    }

    async handleImportState(params) {
        const { state } = params;
        if (!state) throw new Error('Missing parameter: state');

        const result = this.model.importState(state);

        // Trigger UI update
        if (this.appComponent && this.appComponent.forceUpdate) {
            this.appComponent.forceUpdate();
        }

        return result;
    }

    // Utility operations
    async handleReset() {
        const result = this.model.reset();

        // Trigger UI update
        if (this.appComponent && this.appComponent.forceUpdate) {
            this.appComponent.forceUpdate();
        }

        return result;
    }

    async handleEvaluate(params) {
        const { expression } = params;
        if (!expression) throw new Error('Missing parameter: expression');

        const result = await this.adapter.evaluate(expression);
        return { result: result };
    }

    // Introspection
    async handleListCommands() {
        return { commands: Object.keys(this.commands), version: '1.0' };
    }

    async handleGetVersion() {
        return {
            version: '1.0',
            name: 'Mini Photo Editor Control Bus',
            compatibility: 'ARexx-inspired'
        };
    }
}

// Export for both ES6 modules and CommonJS
export default PhotoEditorControlBus;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhotoEditorControlBus;
}
