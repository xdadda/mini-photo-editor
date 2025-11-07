/**
 * PhotoEditorControlBusBridge - Connects Tauri HTTP server to control bus
 *
 * Responsibilities:
 * - Poll Rust HTTP server for pending commands (COMET-style)
 * - Parse command strings and extract parameters
 * - Execute commands via PhotoEditorControlBus
 * - Post results back to Rust HTTP server
 */

class PhotoEditorControlBusBridge {
    constructor(controlBus) {
        this.controlBus = controlBus;
        this.authToken = null;
        this.polling = false;
        this.baseUrl = 'http://localhost:8083';
    }

    /**
     * Start polling for commands
     */
    async start(authToken) {
        this.authToken = authToken;
        this.polling = true;
        console.log('PhotoEditorControlBusBridge: Started polling');
        this.pollForCommands();
    }

    /**
     * Stop polling
     */
    stop() {
        this.polling = false;
        console.log('PhotoEditorControlBusBridge: Stopped polling');
    }

    /**
     * Poll for pending commands (COMET-style long polling)
     */
    async pollForCommands() {
        if (!this.polling) return;

        try {
            const response = await fetch(`${this.baseUrl}/api/poll`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const command = await response.json();
                if (command) {
                    console.log('Bridge received command:', command);
                    await this.handleCommand(command);
                }
            } else if (response.status === 401) {
                console.error('Authentication failed - check token');
                this.stop();
                return;
            }
        } catch (error) {
            console.error('Poll error:', error);
        }

        // Continue polling (small delay to avoid overwhelming server)
        if (this.polling) {
            setTimeout(() => this.pollForCommands(), 100);
        }
    }

    /**
     * Handle a command from the Rust backend
     */
    async handleCommand(command) {
        try {
            // Parse command string: "setBrightness value=1.2"
            const parts = command.command.split(' ');
            const method = parts[0];
            const params = this.parseParams(parts.slice(1));

            console.log('Executing command:', method, params);

            // Execute command on control bus
            const result = await this.controlBus.executeCommand(method, params);

            console.log('Command result:', result);

            // Post result back to Rust
            await this.postResult(command.request_id, result);

        } catch (error) {
            console.error('Command execution error:', error);

            // Post error back to Rust
            await this.postResult(command.request_id, {
                error: error.message,
                success: false
            });
        }
    }

    /**
     * Parse command parameters from string
     * Supports formats:
     *   - "key=value" pairs
     *   - "value" (positional, becomes {value: "value"})
     */
    parseParams(parts) {
        const params = {};

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (part.includes('=')) {
                // Key-value pair: "value=1.2"
                const [key, ...valueParts] = part.split('=');
                const value = valueParts.join('='); // Handle values with '=' in them

                // Try to parse as number
                const numValue = parseFloat(value);
                params[key] = isNaN(numValue) ? value : numValue;
            } else {
                // Positional parameter: just "value"
                // Try to parse as number
                const numValue = parseFloat(part);
                params['value'] = isNaN(numValue) ? part : numValue;
            }
        }

        return params;
    }

    /**
     * Post command result back to Rust HTTP server
     */
    async postResult(request_id, result) {
        try {
            const response = await fetch(`${this.baseUrl}/api/result`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    request_id: request_id,
                    result: result
                })
            });

            if (!response.ok) {
                console.error('Failed to post result:', response.status);
            }
        } catch (error) {
            console.error('Error posting result:', error);
        }
    }
}

// Export for both ES6 modules and CommonJS
export default PhotoEditorControlBusBridge;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhotoEditorControlBusBridge;
}
