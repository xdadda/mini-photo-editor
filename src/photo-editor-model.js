/**
 * PhotoEditorModel - Pure JavaScript model for photo editing state
 *
 * Responsibilities:
 * - Maintain editing parameters (lights, colors, effects, filters)
 * - Provide getter/setter methods for parameters
 * - Store image metadata
 * - Independent of UI framework and RexxJS
 */

class PhotoEditorModel {
    constructor() {
        this.image = null;
        this.metadata = null;
        this.minigl = null;
        this.params = this.getDefaultParams();
    }

    /**
     * Get default parameter values
     */
    getDefaultParams() {
        return {
            trs: { translateX:0, translateY:0, angle:0, scale:0, flipv:0, fliph:0 },
            crop: { currentcrop:0, glcrop:0, canvas_angle:0, ar:0, arindex:0 },
            lights: { brightness:0, exposure:0, gamma:0, contrast:0, shadows:0, highlights:0, bloom:0 },
            colors: { temperature:0, tint:0, vibrance:0, saturation:0, sepia:0 },
            effects: { clarity:0, noise:0, vignette:0 },
            curve: { curvepoints: 0 },
            filters: { opt:0, mix:0 },
            perspective: { quad:0, modified:0 },
            perspective2: { before:0, after:0, modified:0 },
            blender: { blendmap:0, blendmix:0.5 },
            resizer: { width:0, height:0 },
            blur: { bokehstrength:0, bokehlensout:0.5, gaussianstrength:0, gaussianlensout:0.5, centerX:0.5, centerY:0.5 },
            heal: { healmask:0 }
        };
    }

    /**
     * Set a parameter value
     * @param {string} category - Parameter category (lights, colors, etc.)
     * @param {string} param - Parameter name
     * @param {number} value - Parameter value
     */
    setParameter(category, param, value) {
        if (this.params[category] && this.params[category].hasOwnProperty(param)) {
            this.params[category][param] = value;
            return { success: true, category, param, value };
        }
        throw new Error(`Unknown parameter: ${category}.${param}`);
    }

    /**
     * Get a parameter value
     * @param {string} category - Parameter category
     * @param {string} param - Parameter name
     */
    getParameter(category, param) {
        if (this.params[category] && this.params[category].hasOwnProperty(param)) {
            return this.params[category][param];
        }
        throw new Error(`Unknown parameter: ${category}.${param}`);
    }

    /**
     * Get all parameters
     */
    getAllParameters() {
        return JSON.parse(JSON.stringify(this.params));
    }

    /**
     * Set image metadata
     */
    setMetadata(metadata) {
        this.metadata = metadata;
    }

    /**
     * Get image metadata
     */
    getMetadata() {
        return this.metadata;
    }

    /**
     * Apply a named filter
     * Filter names: none, chrome, fade, instant, transfer, mono, noir, process, tonal
     */
    applyFilter(filterName, intensity = 1.0) {
        const filterMap = {
            'none': 0,
            'chrome': 1,
            'fade': 2,
            'instant': 3,
            'transfer': 4,
            'mono': 5,
            'noir': 6,
            'process': 7,
            'tonal': 8,
            '1977': 9,
            'aden': 10,
            'amaro': 11,
            'clarendon': 12,
            'clarendon2': 13,
            'crema': 14,
            'gingham': 15,
            'gingham2': 16,
            'juno': 17,
            'lark': 18,
            'ludwig': 19,
            'moon': 20,
            'moon2': 21,
            'perpetua': 22,
            'perpetua2': 23,
            'reyes': 24,
            'slumber': 25,
            'xpro': 26
        };

        const filterIndex = filterMap[filterName.toLowerCase()];
        if (filterIndex === undefined) {
            throw new Error(`Unknown filter: ${filterName}`);
        }

        this.params.filters.opt = filterIndex;
        this.params.filters.mix = Math.max(0, Math.min(1, intensity));

        return {
            success: true,
            filter: filterName,
            index: filterIndex,
            intensity: this.params.filters.mix
        };
    }

    /**
     * List all available filters
     */
    listFilters() {
        return [
            'none', 'chrome', 'fade', 'instant', 'transfer', 'mono', 'noir',
            'process', 'tonal', '1977', 'aden', 'amaro', 'clarendon',
            'clarendon2', 'crema', 'gingham', 'gingham2', 'juno', 'lark',
            'ludwig', 'moon', 'moon2', 'perpetua', 'perpetua2', 'reyes',
            'slumber', 'xpro'
        ];
    }

    /**
     * Reset all parameters to defaults
     */
    reset() {
        this.params = this.getDefaultParams();
        return { success: true };
    }

    /**
     * Export current state as JSON
     */
    exportState() {
        return {
            params: this.getAllParameters(),
            metadata: this.metadata ? {
                width: this.metadata.file?.width,
                height: this.metadata.file?.height,
                size: this.metadata.file?.size,
                format: this.metadata.format,
                colorspace: this.metadata.colorspace
            } : null
        };
    }

    /**
     * Import state from JSON
     */
    importState(state) {
        if (state.params) {
            // Merge params (in case structure has changed)
            for (const category in state.params) {
                if (this.params[category]) {
                    for (const param in state.params[category]) {
                        if (this.params[category].hasOwnProperty(param)) {
                            this.params[category][param] = state.params[category][param];
                        }
                    }
                }
            }
        }
        return { success: true };
    }
}

// Export for both ES6 modules and CommonJS
export default PhotoEditorModel;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhotoEditorModel;
}
