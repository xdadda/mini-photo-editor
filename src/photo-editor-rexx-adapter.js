/**
 * PhotoEditorRexxAdapter - Integration layer between PhotoEditorModel and RexxJS
 *
 * Responsibilities:
 * - Initialize RexxJS interpreter with photo editing context
 * - Provide variableResolver for parameter access (LIGHTS_BRIGHTNESS, etc.)
 * - Register custom photo editing functions
 * - Evaluate RexxJS expressions in editing context
 */

class PhotoEditorRexxAdapter {
    constructor(model) {
        this.model = model;
        this.interpreter = null;
    }

    /**
     * Initialize RexxJS interpreter with photo editing context
     */
    async initializeInterpreter(RexxInterpreter, parse) {
        // Store parse function for later use
        this.parse = parse;

        // Create interpreter with suppressed output
        this.interpreter = new RexxInterpreter(null, {
            output: (text) => {
                // Suppress SAY output during evaluation
                // console.log('[PhotoEditor RexxJS]', text);
            }
        });

        // Set up variableResolver for lazy parameter access
        this.setupVariableResolver();

        // Install custom photo editing functions
        this.installPhotoFunctions();

        return this.interpreter;
    }

    /**
     * Set up variableResolver callback for on-demand parameter resolution
     * Allows access like: LIGHTS_BRIGHTNESS, COLORS_SATURATION, etc.
     */
    setupVariableResolver() {
        const self = this;

        this.interpreter.variableResolver = function(name) {
            // Check for parameter pattern: CATEGORY_PARAM
            const parts = name.split('_');
            if (parts.length >= 2) {
                const category = parts[0].toLowerCase();
                const param = parts.slice(1).join('_').toLowerCase();

                try {
                    return self.model.getParameter(category, param);
                } catch {
                    // Not a valid parameter, fall through
                }
            }

            // Not handled by this resolver
            return undefined;
        };
    }

    /**
     * Install custom photo editing functions into RexxJS
     */
    installPhotoFunctions() {
        if (!this.interpreter.builtinFunctions) {
            this.interpreter.builtinFunctions = {};
        }

        const self = this;

        // Parameter manipulation functions
        this.interpreter.builtinFunctions.SET_BRIGHTNESS = function(value) {
            return self.model.setParameter('lights', 'brightness', parseFloat(value));
        };

        this.interpreter.builtinFunctions.SET_CONTRAST = function(value) {
            return self.model.setParameter('lights', 'contrast', parseFloat(value));
        };

        this.interpreter.builtinFunctions.SET_EXPOSURE = function(value) {
            return self.model.setParameter('lights', 'exposure', parseFloat(value));
        };

        this.interpreter.builtinFunctions.SET_GAMMA = function(value) {
            return self.model.setParameter('lights', 'gamma', parseFloat(value));
        };

        this.interpreter.builtinFunctions.SET_SHADOWS = function(value) {
            return self.model.setParameter('lights', 'shadows', parseFloat(value));
        };

        this.interpreter.builtinFunctions.SET_HIGHLIGHTS = function(value) {
            return self.model.setParameter('lights', 'highlights', parseFloat(value));
        };

        this.interpreter.builtinFunctions.SET_SATURATION = function(value) {
            return self.model.setParameter('colors', 'saturation', parseFloat(value));
        };

        this.interpreter.builtinFunctions.SET_TEMPERATURE = function(value) {
            return self.model.setParameter('colors', 'temperature', parseFloat(value));
        };

        this.interpreter.builtinFunctions.SET_TINT = function(value) {
            return self.model.setParameter('colors', 'tint', parseFloat(value));
        };

        this.interpreter.builtinFunctions.SET_VIBRANCE = function(value) {
            return self.model.setParameter('colors', 'vibrance', parseFloat(value));
        };

        this.interpreter.builtinFunctions.SET_CLARITY = function(value) {
            return self.model.setParameter('effects', 'clarity', parseFloat(value));
        };

        this.interpreter.builtinFunctions.SET_NOISE = function(value) {
            return self.model.setParameter('effects', 'noise', parseFloat(value));
        };

        this.interpreter.builtinFunctions.SET_VIGNETTE = function(value) {
            return self.model.setParameter('effects', 'vignette', parseFloat(value));
        };

        // Generic parameter setter
        this.interpreter.builtinFunctions.SET_PARAM = function(category, param, value) {
            return self.model.setParameter(category, param, parseFloat(value));
        };

        this.interpreter.builtinFunctions.GET_PARAM = function(category, param) {
            return self.model.getParameter(category, param);
        };

        // Filter functions
        this.interpreter.builtinFunctions.APPLY_FILTER = function(filterName, intensity) {
            const i = intensity !== undefined ? parseFloat(intensity) : 1.0;
            return self.model.applyFilter(filterName, i);
        };

        this.interpreter.builtinFunctions.LIST_FILTERS = function() {
            return self.model.listFilters();
        };

        // Batch adjustment functions
        this.interpreter.builtinFunctions.ADJUST_LIGHTS = function(brightness, contrast, exposure) {
            const results = [];
            if (brightness !== undefined && brightness !== null) {
                results.push(self.model.setParameter('lights', 'brightness', parseFloat(brightness)));
            }
            if (contrast !== undefined && contrast !== null) {
                results.push(self.model.setParameter('lights', 'contrast', parseFloat(contrast)));
            }
            if (exposure !== undefined && exposure !== null) {
                results.push(self.model.setParameter('lights', 'exposure', parseFloat(exposure)));
            }
            return { success: true, adjusted: results.length, results: results };
        };

        this.interpreter.builtinFunctions.ADJUST_COLORS = function(temperature, tint, saturation, vibrance) {
            const results = [];
            if (temperature !== undefined && temperature !== null) {
                results.push(self.model.setParameter('colors', 'temperature', parseFloat(temperature)));
            }
            if (tint !== undefined && tint !== null) {
                results.push(self.model.setParameter('colors', 'tint', parseFloat(tint)));
            }
            if (saturation !== undefined && saturation !== null) {
                results.push(self.model.setParameter('colors', 'saturation', parseFloat(saturation)));
            }
            if (vibrance !== undefined && vibrance !== null) {
                results.push(self.model.setParameter('colors', 'vibrance', parseFloat(vibrance)));
            }
            return { success: true, adjusted: results.length, results: results };
        };

        // Info functions
        this.interpreter.builtinFunctions.GET_IMAGE_INFO = function() {
            const metadata = self.model.getMetadata();
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
        };

        this.interpreter.builtinFunctions.GET_ALL_PARAMS = function() {
            return self.model.getAllParameters();
        };

        // Reset function
        this.interpreter.builtinFunctions.RESET_ALL = function() {
            return self.model.reset();
        };
    }

    /**
     * Evaluate a RexxJS expression in the photo editing context
     */
    async evaluate(expression) {
        if (!this.interpreter) {
            throw new Error('Interpreter not initialized');
        }

        if (!this.parse) {
            throw new Error('Parse function not available');
        }

        try {
            // Parse expression
            const commands = this.parse(expression);

            // Wrap in LET statement to capture result
            const wrappedExpression = `LET RESULT = ${expression}`;
            const wrappedCommands = this.parse(wrappedExpression);

            // Execute
            await this.interpreter.run(wrappedCommands);

            // Return result
            return this.interpreter.getVariable('RESULT');
        } catch (error) {
            throw new Error(`Expression evaluation failed: ${error.message}`);
        }
    }
}

// Export for both ES6 modules and CommonJS
export default PhotoEditorRexxAdapter;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhotoEditorRexxAdapter;
}
