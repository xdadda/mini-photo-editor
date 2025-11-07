# RexxJS Application Integration Guide

**How to integrate any web application with Tauri and RexxJS for scriptable control**

This guide explains how to take an existing web application and add:
1. **Tauri desktop app** packaging (native Mac/Windows/Linux apps)
2. **RexxJS scripting** capabilities (programmable control of the app)
3. **Control Bus** interface (HTTP API for remote scripting, inspired by Amiga's ARexx)

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [The Rust → JavaScript → Rexx Flow](#the-rust--javascript--rexx-flow)
3. [Step-by-Step Integration Guide](#step-by-step-integration-guide)
4. [RexxJS Integration Patterns](#rexxjs-integration-patterns)
5. [Control Bus Implementation](#control-bus-implementation)
6. [Reference Example: Spreadsheet POC](#reference-example-spreadsheet-poc)
7. [Next Example: Mini Photo Editor](#next-example-mini-photo-editor)
8. [Testing and Deployment](#testing-and-deployment)

---

## Architecture Overview

### Three-Layer Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    External Rexx Scripts                      │
│              (Command-line, CI/CD, Automation)                │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP API (Bearer Token Auth)
                         │ POST /api/app-name
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                   Tauri Backend (Rust)                        │
│  • HTTP Server (Axum) on localhost:8083                       │
│  • COMET-style long polling (browser picks up commands)       │
│  • Authentication with bearer tokens                          │
│  • Command queuing and response handling                      │
│  • CLI argument handling (--control-bus flag)                 │
└────────────────────────┬─────────────────────────────────────┘
                         │ /api/poll (browser polls for commands)
                         │ /api/result (browser posts results)
                         ↓
┌──────────────────────────────────────────────────────────────┐
│              JavaScript Control Bus Bridge                     │
│  • Polls /api/poll for pending commands                       │
│  • Executes commands on application model                     │
│  • Posts results back to /api/result                          │
│  • Handles postMessage for web iframe mode                    │
└────────────────────────┬─────────────────────────────────────┘
                         │ Command execution
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                   Application Model                           │
│  • Core application logic (pure JavaScript)                   │
│  • Business logic and state management                        │
│  • Independent of UI framework                                │
└────────────────────────┬─────────────────────────────────────┘
                         │ Lazy cell resolution
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                  RexxJS Adapter Layer                         │
│  • Creates RexxJS interpreter with custom context            │
│  • variableResolver callback for lazy value resolution        │
│  • Expression evaluation                                      │
│  • Custom function registration                               │
└────────────────────────┬─────────────────────────────────────┘
                         │ Interpreter API
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                    RexxJS Interpreter                         │
│  • Core RexxJS language engine (core/src/repl/dist/)          │
│  • Built-in functions (200+ functions)                        │
│  • REQUIRE system for loading libraries                       │
│  • ADDRESS mechanism for external systems                     │
└──────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Separation of Concerns**: Application logic lives in a pure JavaScript model, independent of UI framework
2. **Lazy Resolution**: Values are resolved on-demand via variableResolver callback (no pre-injection)
3. **Two Control Modes**:
   - **Web mode**: iframe postMessage communication
   - **Tauri mode**: HTTP API with long polling
4. **ARexx-Inspired**: Classic inter-process communication pattern from Amiga OS
5. **Security**: Bearer token authentication for HTTP endpoints

---

## The Rust → JavaScript → Rexx Flow

### End-to-End Command Flow

#### 1. External Rexx Script Sends Command

```rexx
/* External script controlling the app */
ADDRESS "http://localhost:8083/api/spreadsheet" AUTH "dev-token-12345" AS SPREADSHEET

"setCell A1 100"
"setCell A2 200"
"setCell A3 =A1+A2"

LET result = "getCellValue A3"
SAY "Result: " || result.value  /* Output: Result: 300 */
```

#### 2. Tauri Rust Backend Receives HTTP Request

**File: `src-tauri/src/lib.rs`**

```rust
// HTTP endpoint handler
async fn handle_control_bus(
    State(state): State<Arc<ServerState>>,
    headers: HeaderMap,
    Json(request): Json<ControlBusRequest>,
) -> Result<Json<ControlBusResponse>, StatusCode> {
    // 1. Verify bearer token
    let auth_header = headers.get("authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let provided_token = &auth_header[7..]; // Skip "Bearer "
    if provided_token != state.auth_token {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // 2. Generate unique request ID
    let request_id = uuid::Uuid::new_v4().to_string();

    // 3. Create channels for response
    let (tx, rx) = oneshot::channel();

    // 4. Queue command for browser to pick up
    let cmd = PendingCommand {
        request_id: request_id.clone(),
        command: request.command.clone(),
    };

    state.command_queue.lock().await.insert(request_id.clone(), cmd);
    state.pending_requests.lock().await.insert(request_id.clone(), tx);

    // 5. Wait for browser to pick up command (5 second timeout)
    // 6. Wait for result (10 second timeout)
    let result = tokio::time::timeout(Duration::from_secs(10), rx).await;

    // 7. Return result to caller
    Ok(Json(ControlBusResponse {
        success: true,
        result: Some(value),
        error: None,
    }))
}
```

#### 3. Browser JavaScript Polls for Commands

**File: `spreadsheet-controlbus-bridge.js`**

```javascript
class ControlBusBridge {
    async pollForCommands() {
        // Long polling to Rust backend
        const response = await fetch('http://localhost:8083/api/poll', {
            headers: {
                'Authorization': `Bearer ${this.authToken}`
            }
        });

        const command = await response.json();
        if (command) {
            // Execute command on application model
            const result = await this.executeCommand(command.command);

            // Post result back to Rust
            await fetch('http://localhost:8083/api/result', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    request_id: command.request_id,
                    result: result
                })
            });
        }

        // Continue polling
        setTimeout(() => this.pollForCommands(), 100);
    }

    async executeCommand(commandString) {
        // Parse command: "setCell A1 100"
        const parts = commandString.split(' ');
        const method = parts[0];
        const params = this.parseParams(parts.slice(1));

        // Execute on control bus
        return await this.controlBus.executeCommand(method, params);
    }
}
```

#### 4. Control Bus Executes Command on Model

**File: `app-controlbus.js`**

```javascript
class AppControlBus {
    constructor(model, adapter, appComponent) {
        this.model = model;
        this.adapter = adapter;
        this.appComponent = appComponent;

        this.commands = {
            setCell: this.handleSetCell.bind(this),
            getCellValue: this.handleGetCellValue.bind(this),
            // ... other commands
        };
    }

    async executeCommand(command, params) {
        const handler = this.commands[command];
        if (!handler) {
            throw new Error(`Unknown command: ${command}`);
        }
        return await handler(params);
    }

    async handleSetCell(params) {
        const { ref, content } = params;

        // Execute on model (evaluates with RexxJS if formula)
        await this.model.setCell(ref, content, this.adapter.interpreter);

        // Trigger UI update
        if (this.appComponent?.forceUpdate) {
            this.appComponent.forceUpdate();
        }

        return { success: true, ref: ref };
    }

    async handleGetCellValue(params) {
        const { ref } = params;
        return { value: this.model.getCellValue(ref) };
    }
}
```

#### 5. Model Uses RexxJS Adapter for Evaluation

**File: `app-rexx-adapter.js`**

```javascript
class AppRexxAdapter {
    constructor(model) {
        this.model = model;
        this.interpreter = null;
    }

    async initializeInterpreter(RexxInterpreter) {
        this.interpreter = new RexxInterpreter(null, {
            output: (text) => { /* suppress SAY output */ }
        });

        // Set up lazy variable resolution
        this.interpreter.variableResolver = (name) => {
            // Check if it's a cell reference (A1, B2, etc.)
            if (/^[A-Z]+\d+$/.test(name)) {
                const value = this.model.getCellValue(name);
                const numValue = parseFloat(value);
                return isNaN(numValue) ? value : numValue;
            }
            return undefined; // Let normal error handling occur
        };

        return this.interpreter;
    }

    async evaluate(expression) {
        // Parse expression
        const commands = parse(expression);

        // Wrap in LET statement to capture result
        const wrappedExpression = `LET RESULT = ${expression}`;
        const wrappedCommands = parse(wrappedExpression);

        // Execute
        await this.interpreter.run(wrappedCommands);

        // Return result
        return this.interpreter.getVariable('RESULT');
    }
}
```

### Data Flow Summary

```
External Rexx Script
    ↓ (HTTP POST with Bearer token)
Rust Axum Server
    ↓ (Queue command with unique ID)
JavaScript Long Polling
    ↓ (GET /api/poll)
Control Bus Bridge
    ↓ (Parse command string)
Control Bus Handler
    ↓ (Execute on model)
Application Model
    ↓ (Evaluate formula if needed)
RexxJS Adapter
    ↓ (variableResolver callback)
RexxJS Interpreter
    ↓ (Return computed value)
Back through the chain...
    ↑ (POST /api/result)
Rust Responds to HTTP
    ↑ (JSON response)
External Rexx Script Receives Result
```

---

## Step-by-Step Integration Guide

### Prerequisites

1. **Node.js and npm** installed
2. **Rust toolchain** installed (https://rustup.rs/)
3. **Tauri CLI** installed: `cargo install tauri-cli`
4. **RexxJS repository** cloned and core built

### Step 1: Prepare Your Web Application

Your web application should have:

1. **Pure JavaScript Model**: Business logic separated from UI
2. **ES6 Module Structure**: For Vite bundling
3. **React/Vue/Vanilla JS**: Any frontend framework works

**Example model structure:**

```javascript
// src/app-model.js
class AppModel {
    constructor() {
        this.data = {};
    }

    getData(key) {
        return this.data[key];
    }

    setData(key, value) {
        this.data[key] = value;
    }
}

export default AppModel;
```

### Step 2: Add RexxJS Integration

Create an adapter layer that connects your model to RexxJS.

**File: `src/app-rexx-adapter.js`**

```javascript
class AppRexxAdapter {
    constructor(model) {
        this.model = model;
        this.interpreter = null;
    }

    async initializeInterpreter(RexxInterpreter) {
        this.interpreter = new RexxInterpreter(null, {
            output: (text) => {
                console.log('[RexxJS output]', text);
            }
        });

        // Set up variableResolver for lazy value resolution
        this.interpreter.variableResolver = (name) => {
            // Example: resolve app-specific variables
            if (name.startsWith('APP_')) {
                return this.model.getData(name);
            }
            return undefined;
        };

        // Install custom functions
        this.installCustomFunctions();

        return this.interpreter;
    }

    installCustomFunctions() {
        // Register app-specific functions
        this.interpreter.builtinFunctions = this.interpreter.builtinFunctions || {};

        this.interpreter.builtinFunctions.GET_DATA = (key) => {
            return this.model.getData(key);
        };

        this.interpreter.builtinFunctions.SET_DATA = (key, value) => {
            this.model.setData(key, value);
            return value;
        };
    }

    async evaluate(expression) {
        const commands = parse(expression);
        const wrappedExpression = `LET RESULT = ${expression}`;
        const wrappedCommands = parse(wrappedExpression);
        await this.interpreter.run(wrappedCommands);
        return this.interpreter.getVariable('RESULT');
    }
}

export default AppRexxAdapter;
```

### Step 3: Add Control Bus

Create a control bus that exposes commands for remote scripting.

**File: `src/app-controlbus.js`**

```javascript
class AppControlBus {
    constructor(model, adapter, appComponent) {
        this.model = model;
        this.adapter = adapter;
        this.appComponent = appComponent;
        this.enabled = false;

        // Define available commands
        this.commands = {
            getData: this.handleGetData.bind(this),
            setData: this.handleSetData.bind(this),
            evaluate: this.handleEvaluate.bind(this),
            listCommands: this.handleListCommands.bind(this),
            getVersion: this.handleGetVersion.bind(this)
        };
    }

    enable() {
        if (this.enabled) return;
        this.enabled = true;

        // Listen for postMessage (web mode)
        if (typeof window !== 'undefined') {
            window.addEventListener('message', this.handleMessage.bind(this));
        }
    }

    async handleMessage(event) {
        if (!event.data || event.data.type !== 'app-control') {
            return;
        }

        const { command, params, requestId } = event.data;

        try {
            const result = await this.executeCommand(command, params);
            const response = {
                type: 'app-control-response',
                requestId: requestId,
                success: true,
                result: result
            };
            event.source.postMessage(response, event.origin);
        } catch (error) {
            const response = {
                type: 'app-control-response',
                requestId: requestId,
                success: false,
                error: error.message
            };
            event.source.postMessage(response, event.origin);
        }
    }

    async executeCommand(command, params = {}) {
        const handler = this.commands[command];
        if (!handler) {
            throw new Error(`Unknown command: ${command}`);
        }
        return await handler(params);
    }

    // Command handlers
    async handleGetData(params) {
        const { key } = params;
        if (!key) throw new Error('Missing parameter: key');
        return { value: this.model.getData(key) };
    }

    async handleSetData(params) {
        const { key, value } = params;
        if (!key) throw new Error('Missing parameter: key');
        this.model.setData(key, value);

        // Trigger UI update
        if (this.appComponent?.forceUpdate) {
            this.appComponent.forceUpdate();
        }

        return { success: true };
    }

    async handleEvaluate(params) {
        const { expression } = params;
        if (!expression) throw new Error('Missing parameter: expression');
        const result = await this.adapter.evaluate(expression);
        return { result: result };
    }

    async handleListCommands() {
        return { commands: Object.keys(this.commands) };
    }

    async handleGetVersion() {
        return {
            version: '1.0',
            name: 'MyApp Control Bus',
            compatibility: 'ARexx-inspired'
        };
    }
}

export default AppControlBus;
```

### Step 4: Add Control Bus Bridge (Tauri Mode)

Create a bridge that polls the Rust backend and executes commands.

**File: `src/app-controlbus-bridge.js`**

```javascript
class AppControlBusBridge {
    constructor(controlBus) {
        this.controlBus = controlBus;
        this.authToken = null;
        this.polling = false;
        this.baseUrl = 'http://localhost:8083';
    }

    async start(authToken) {
        this.authToken = authToken;
        this.polling = true;
        this.pollForCommands();
    }

    stop() {
        this.polling = false;
    }

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
                    await this.handleCommand(command);
                }
            }
        } catch (error) {
            console.error('Poll error:', error);
        }

        // Continue polling
        setTimeout(() => this.pollForCommands(), 100);
    }

    async handleCommand(command) {
        try {
            // Parse command string: "setData key value"
            const parts = command.command.split(' ');
            const method = parts[0];
            const params = this.parseParams(parts.slice(1));

            // Execute command
            const result = await this.controlBus.executeCommand(method, params);

            // Post result back
            await fetch(`${this.baseUrl}/api/result`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    request_id: command.request_id,
                    result: result
                })
            });
        } catch (error) {
            // Post error back
            await fetch(`${this.baseUrl}/api/result`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    request_id: command.request_id,
                    result: { error: error.message }
                })
            });
        }
    }

    parseParams(parts) {
        // Simple parsing: "key value" -> {key: "key", value: "value"}
        // For more complex parsing, use JSON or query string format
        const params = {};
        for (let i = 0; i < parts.length; i += 2) {
            if (parts[i] && parts[i + 1]) {
                params[parts[i]] = parts[i + 1];
            }
        }
        return params;
    }
}

export default AppControlBusBridge;
```

### Step 5: Initialize Tauri Backend

Create the Rust backend with HTTP server and command queue.

**File: `src-tauri/Cargo.toml`**

```toml
[package]
name = "myapp"
version = "0.1.0"
edition = "2021"

[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[dependencies]
tauri = { version = "2.1", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
axum = "0.7"
tower-http = { version = "0.5", features = ["cors"] }
tokio = { version = "1", features = ["full"] }
uuid = { version = "1", features = ["v4"] }
log = "0.4"

[target.'cfg(unix)'.dependencies]
signal-hook = "0.3"

[dependencies.tauri-plugin-log]
git = "https://github.com/tauri-apps/plugins-workspace"
branch = "v2"

[dependencies.tauri-plugin-fs]
git = "https://github.com/tauri-apps/plugins-workspace"
branch = "v2"
features = ["read-all", "scope-recursive"]
```

**File: `src-tauri/src/lib.rs`**

```rust
use tauri::{Manager, Emitter};
use serde::{Deserialize, Serialize};
use axum::{
    Router,
    routing::{post, get},
    extract::State,
    http::{StatusCode, HeaderMap},
    Json,
};
use tower_http::cors::{CorsLayer, Any};
use std::sync::Arc;
use std::collections::HashMap;
use tokio::sync::{oneshot, Mutex};
use std::time::Duration;

#[derive(Debug, Deserialize, Serialize, Clone)]
struct ControlBusRequest {
    command: String,
    params: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize, Serialize)]
struct ControlBusResponse {
    success: bool,
    result: Option<serde_json::Value>,
    error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
struct PendingCommand {
    request_id: String,
    command: String,
}

type PendingRequests = Arc<Mutex<HashMap<String, oneshot::Sender<serde_json::Value>>>>;
type CommandQueue = Arc<Mutex<HashMap<String, (PendingCommand, oneshot::Sender<()>)>>>;

#[derive(Clone)]
struct ServerState {
    auth_token: String,
    pending_requests: PendingRequests,
    command_queue: CommandQueue,
}

async fn poll_command(
    State(state): State<Arc<ServerState>>,
    headers: HeaderMap,
) -> Result<Json<Option<PendingCommand>>, StatusCode> {
    // Verify auth token
    let auth_header = headers.get("authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !auth_header.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let provided_token = &auth_header[7..];
    if provided_token != state.auth_token {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Check for pending command
    let mut queue = state.command_queue.lock().await;
    if let Some(request_id) = queue.keys().next().cloned() {
        if let Some((cmd, notify)) = queue.remove(&request_id) {
            drop(queue);
            let _ = notify.send(());
            return Ok(Json(Some(cmd)));
        }
    }

    Ok(Json(None))
}

async fn post_result(
    State(state): State<Arc<ServerState>>,
    headers: HeaderMap,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Verify auth
    let auth_header = headers.get("authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let provided_token = &auth_header[7..];
    if provided_token != state.auth_token {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let request_id = payload.get("request_id")
        .and_then(|v| v.as_str())
        .ok_or(StatusCode::BAD_REQUEST)?
        .to_string();

    let result = payload.get("result").cloned().unwrap_or(serde_json::Value::Null);

    let sender = {
        let mut pending = state.pending_requests.lock().await;
        pending.remove(&request_id)
    };

    if let Some(tx) = sender {
        let _ = tx.send(result);
        Ok(Json(serde_json::json!({"status": "ok"})))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

async fn handle_control_bus(
    State(state): State<Arc<ServerState>>,
    headers: HeaderMap,
    Json(request): Json<ControlBusRequest>,
) -> Result<Json<ControlBusResponse>, StatusCode> {
    // Verify auth
    let auth_header = headers.get("authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let provided_token = &auth_header[7..];
    if provided_token != state.auth_token {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let request_id = uuid::Uuid::new_v4().to_string();
    let (tx, rx) = oneshot::channel();
    let (notify_tx, notify_rx) = oneshot::channel();

    {
        let mut pending = state.pending_requests.lock().await;
        pending.insert(request_id.clone(), tx);
    }

    let cmd = PendingCommand {
        request_id: request_id.clone(),
        command: request.command.clone(),
    };

    {
        let mut queue = state.command_queue.lock().await;
        queue.insert(request_id.clone(), (cmd, notify_tx));
    }

    // Wait for browser pickup
    let pickup_timeout = tokio::time::timeout(Duration::from_secs(5), notify_rx).await;
    if pickup_timeout.is_err() {
        let mut queue = state.command_queue.lock().await;
        queue.remove(&request_id);
        let mut pending = state.pending_requests.lock().await;
        pending.remove(&request_id);

        return Ok(Json(ControlBusResponse {
            success: false,
            result: None,
            error: Some("Browser did not poll within 5 seconds".to_string()),
        }));
    }

    // Wait for result
    let result = tokio::time::timeout(Duration::from_secs(10), rx).await;

    match result {
        Ok(Ok(value)) => {
            Ok(Json(ControlBusResponse {
                success: true,
                result: Some(value),
                error: None,
            }))
        }
        Ok(Err(_)) => {
            Ok(Json(ControlBusResponse {
                success: false,
                result: None,
                error: Some("Browser closed connection".to_string()),
            }))
        }
        Err(_) => {
            let mut pending = state.pending_requests.lock().await;
            pending.remove(&request_id);
            Ok(Json(ControlBusResponse {
                success: false,
                result: None,
                error: Some("Timeout after 10 seconds".to_string()),
            }))
        }
    }
}

async fn start_http_server(state: Arc<ServerState>, port: u16) {
    let app = Router::new()
        .route("/api/myapp", post(handle_control_bus))
        .route("/api/poll", get(poll_command))
        .route("/api/result", post(post_result))
        .layer(CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any))
        .with_state(state);

    let addr = format!("127.0.0.1:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr).await.expect("Failed to bind");

    log::info!("Control Bus HTTP API listening on http://{}", addr);
    axum::serve(listener, app).await.expect("HTTP server error");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pending_requests: PendingRequests = Arc::new(Mutex::new(HashMap::new()));
    let command_queue: CommandQueue = Arc::new(Mutex::new(HashMap::new()));
    let pending_requests_for_setup = pending_requests.clone();
    let command_queue_for_setup = command_queue.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(move |app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Check for --control-bus flag
            let args: Vec<String> = std::env::args().collect();
            let enable_http = args.contains(&"--control-bus".to_string())
                || std::env::var("ENABLE_CONTROL_BUS").is_ok();

            let auth_token = std::env::var("CONTROL_BUS_TOKEN")
                .unwrap_or_else(|_| "dev-token-12345".to_string());

            if enable_http {
                let state = Arc::new(ServerState {
                    auth_token: auth_token.clone(),
                    pending_requests: pending_requests_for_setup.clone(),
                    command_queue: command_queue_for_setup.clone(),
                });

                let port = 8083;
                tauri::async_runtime::spawn(async move {
                    start_http_server(state, port).await;
                });

                log::info!("Control Bus enabled on port 8083");
                log::info!("Auth token: {}", auth_token);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**File: `src-tauri/src/main.rs`**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    app_lib::run();
}
```

### Step 6: Configure Vite Build

**File: `vite.config.js`**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    // Copy RexxJS bundle to dist
    {
      name: 'copy-rexxjs-bundle',
      closeBundle: () => {
        const source = path.resolve(__dirname, '../../core/src/repl/dist/rexxjs.bundle.js');
        const dest = path.resolve(__dirname, 'dist/rexxjs.bundle.js');

        if (fs.existsSync(source)) {
          fs.copyFileSync(source, dest);
          console.log('✓ Copied RexxJS bundle to dist/');
        } else {
          console.error('✗ RexxJS bundle not found at:', source);
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5173
  }
});
```

### Step 7: Configure Tauri

**File: `src-tauri/tauri.conf.json`**

```json
{
  "$schema": "https://schema.tauri.app/config/2.0",
  "productName": "MyApp",
  "identifier": "com.myapp.dev",
  "version": "0.1.0",
  "build": {
    "beforeDevCommand": "npm run dev:vite",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  },
  "app": {
    "windows": [
      {
        "title": "MyApp",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": null
    }
  }
}
```

### Step 8: Add NPM Scripts

**File: `package.json`**

```json
{
  "name": "myapp",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev:vite": "vite",
    "build": "vite build",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.0",
    "@tauri-apps/cli": "^2.1.0"
  }
}
```

### Step 9: Create Entry Point

**File: `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MyApp</title>
    <script src="/rexxjs.bundle.js"></script>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

**File: `src/main.jsx`**

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppModel from './app-model';
import AppRexxAdapter from './app-rexx-adapter';
import AppControlBus from './app-controlbus';
import AppControlBusBridge from './app-controlbus-bridge';

// Wait for RexxJS to load
async function initializeApp() {
    let attempts = 0;
    while (attempts < 50 && typeof window.RexxInterpreter === 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (typeof window.RexxInterpreter === 'undefined') {
        console.error('RexxJS not available');
        return;
    }

    // Initialize model
    const model = new AppModel();
    const adapter = new AppRexxAdapter(model);
    await adapter.initializeInterpreter(window.RexxInterpreter);

    // Initialize control bus
    const controlBus = new AppControlBus(model, adapter, null);
    controlBus.enable();

    // Start control bus bridge (Tauri mode)
    const bridge = new AppControlBusBridge(controlBus);
    const authToken = localStorage.getItem('control_bus_token') || 'dev-token-12345';
    bridge.start(authToken);

    // Render app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App model={model} adapter={adapter} controlBus={controlBus} />);
}

initializeApp().catch(console.error);
```

### Step 10: Test the Integration

1. **Build RexxJS bundle:**
   ```bash
   cd core/src/repl
   npm install
   npm run build
   ```

2. **Install dependencies:**
   ```bash
   cd examples/myapp
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run tauri:dev -- -- --control-bus
   ```

4. **Test with external Rexx script:**
   ```bash
   # In another terminal
   cd core
   ./rexx ../examples/myapp/test-control.rexx
   ```

**File: `test-control.rexx`**

```rexx
/* Test control script */
ADDRESS "http://localhost:8083/api/myapp" AUTH "dev-token-12345" AS MYAPP

"setData greeting Hello"
"setData name World"

LET greeting = "getData greeting"
LET name = "getData name"

SAY greeting.value || " " || name.value  /* Output: Hello World */
```

---

## RexxJS Integration Patterns

### Pattern 1: Lazy Variable Resolution (Recommended)

Use the `variableResolver` callback for on-demand value resolution.

```javascript
this.interpreter.variableResolver = (name) => {
    // Check pattern (e.g., cell references, app-specific prefixes)
    if (/^[A-Z]+\d+$/.test(name)) {
        return this.model.getValue(name);
    }
    return undefined; // Not handled
};
```

**Benefits:**
- No pre-injection of variables
- Values always current
- Memory efficient
- First-class interop with host environment

### Pattern 2: Custom Function Registration

Register app-specific functions in the interpreter.

```javascript
this.interpreter.builtinFunctions = this.interpreter.builtinFunctions || {};

this.interpreter.builtinFunctions.APP_FUNCTION = (arg1, arg2) => {
    // Implementation
    return result;
};
```

### Pattern 3: Setup Script Execution

Allow users to define constants and load libraries.

```javascript
async executeSetupScript(script) {
    if (!script || script.trim() === '') {
        return { success: true, message: 'No setup script' };
    }

    try {
        const commands = parse(script);
        await this.interpreter.run(commands);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
```

**Example setup script:**

```rexx
/* Setup script */
LET APP_VERSION = "1.0.0"
LET MAX_ITEMS = 100

REQUIRE "cwd:../../extras/functions/excel/src/excel-functions.js"
REQUIRE "cwd:custom-functions.js"
```

### Pattern 4: Expression Wrapping

Wrap expressions to capture results.

```javascript
async evaluate(expression) {
    const wrappedExpression = `LET RESULT = ${expression}`;
    const commands = parse(wrappedExpression);
    await this.interpreter.run(commands);
    return this.interpreter.getVariable('RESULT');
}
```

---

## Control Bus Implementation

### Command Structure

Commands follow this structure:

**Web Mode (postMessage):**
```javascript
{
    type: 'app-control',
    command: 'setData',
    params: { key: 'greeting', value: 'Hello' },
    requestId: 'unique-id'
}
```

**Tauri Mode (HTTP):**
```http
POST /api/myapp HTTP/1.1
Authorization: Bearer dev-token-12345
Content-Type: application/json

{
    "command": "setData greeting Hello",
    "params": null
}
```

### Security Considerations

1. **Bearer Token Authentication**: All HTTP requests require valid token
2. **Command Whitelisting**: Only registered commands are executable
3. **Parameter Validation**: Validate all input parameters
4. **CORS Configuration**: Restrict allowed origins in production
5. **Rate Limiting**: Consider adding rate limits for production

### Error Handling

```javascript
try {
    const result = await this.executeCommand(command, params);
    return { success: true, result: result };
} catch (error) {
    return { success: false, error: error.message };
}
```

---

## Reference Example: Spreadsheet POC

The spreadsheet-poc is a complete reference implementation located at `examples/spreadsheet-poc/`.

### Key Files

1. **Model**: `src/spreadsheet-model.js` (291 lines)
   - Pure JavaScript spreadsheet model
   - Cell storage, dependency tracking, recalculation
   - Independent of UI and RexxJS

2. **Adapter**: `src/spreadsheet-rexx-adapter.js` (260 lines)
   - RexxJS interpreter initialization
   - variableResolver for cell references (A1, B2, etc.)
   - Custom spreadsheet functions (SUM_RANGE, AVERAGE_RANGE, etc.)

3. **Control Bus**: `spreadsheet-controlbus.js` (388 lines)
   - Command handlers (setCell, getCell, evaluate, etc.)
   - postMessage handling for web mode
   - UI update triggers

4. **Control Bus Bridge**: `spreadsheet-controlbus-bridge.js` (not shown, but follows pattern)
   - Polls Rust backend for commands
   - Executes on control bus
   - Posts results back

5. **Rust Backend**: `src-tauri/src/lib.rs` (362 lines)
   - HTTP server with Axum
   - COMET-style long polling
   - Bearer token authentication
   - Command queuing and response handling

### Architecture Diagram

```
External Rexx Script (test-spreadsheet-address.rexx)
    ↓
Rust HTTP Server (src-tauri/src/lib.rs)
    ↓ (long polling)
Control Bus Bridge (JavaScript)
    ↓
SpreadsheetControlBus (spreadsheet-controlbus.js)
    ↓
SpreadsheetModel (spreadsheet-model.js)
    ↓
SpreadsheetRexxAdapter (spreadsheet-rexx-adapter.js)
    ↓
RexxJS Interpreter (rexxjs.bundle.js)
```

### Running the Spreadsheet POC

```bash
# Terminal 1: Start spreadsheet with control bus
cd examples/spreadsheet-poc
./rexxsheet-dev --control-bus

# Terminal 2: Control it with Rexx
cd core
./rexx ../examples/spreadsheet-poc/test-spreadsheet-address.rexx
```

---

## Next Example: Mini Photo Editor

The mini-photo-editor from https://github.com/xdadda/mini-photo-editor will be integrated following the same pattern.

### Integration Plan

1. **Fetch Source**: Clone the HEAD revision to `examples/mini-photo-editor/`
2. **Preserve Licensing**: Keep original LICENSE and authorship
3. **Add Tauri Structure**: Add `src-tauri/` directory
4. **Create Model Layer**: Extract photo editing logic into pure JavaScript model
5. **Add RexxJS Adapter**: Create `photo-editor-rexx-adapter.js`
6. **Add Control Bus**: Create `photo-editor-controlbus.js`
7. **Configure Vite**: Set up build configuration
8. **Test Integration**: Verify control via Rexx scripts

### Control Commands for Photo Editor

```rexx
/* Example control script for photo editor */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Load image */
"loadImage /path/to/image.jpg"

/* Apply filters */
"setBrightness 1.2"
"setContrast 1.1"
"setSaturation 0.9"

/* Apply effects */
"applyFilter grayscale"
"applyFilter blur 5"

/* Get current state */
LET state = "getState"
SAY "Image: " || state.image.width || "x" || state.image.height

/* Export */
"export /path/to/output.jpg quality=90"
```

---

## Testing and Deployment

### Unit Testing (Jest)

Test the model independently of UI:

```javascript
// app-model.spec.js
const AppModel = require('./src/app-model');

describe('AppModel', () => {
    let model;

    beforeEach(() => {
        model = new AppModel();
    });

    test('should set and get data', () => {
        model.setData('key', 'value');
        expect(model.getData('key')).toBe('value');
    });
});
```

### Integration Testing (Playwright)

Test the UI and control bus:

```javascript
// app-integration.spec.js
const { test, expect } = require('@playwright/test');

test('control bus should respond to commands', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Send postMessage command
    const result = await page.evaluate(async () => {
        return new Promise((resolve) => {
            window.addEventListener('message', (event) => {
                if (event.data.type === 'app-control-response') {
                    resolve(event.data.result);
                }
            });

            window.postMessage({
                type: 'app-control',
                command: 'setData',
                params: { key: 'test', value: 'hello' },
                requestId: '123'
            }, '*');
        });
    });

    expect(result.success).toBe(true);
});
```

### End-to-End Testing (Rexx Scripts)

Test via actual Rexx scripts:

```bash
# Run the app
npm run tauri:dev -- -- --control-bus

# In another terminal
cd core
./rexx ../examples/myapp/tests/integration-test.rexx
```

### Building for Distribution

```bash
# Build the desktop app
npm run tauri:build

# Output will be in src-tauri/target/release/bundle/
# - macOS: .dmg and .app
# - Windows: .msi and .exe
# - Linux: .deb and .AppImage
```

---

## Summary

This guide covers:

1. ✅ **Architecture Overview**: Three-layer architecture with Rust backend, JavaScript bridge, and RexxJS interpreter
2. ✅ **Rust → JavaScript → Rexx Flow**: Complete command flow from external script to model and back
3. ✅ **Step-by-Step Integration**: From zero to fully integrated Tauri app with RexxJS scripting
4. ✅ **RexxJS Patterns**: Lazy resolution, custom functions, setup scripts, expression wrapping
5. ✅ **Control Bus**: Implementation details for both web and Tauri modes
6. ✅ **Reference Example**: Spreadsheet POC as complete working example
7. ✅ **Next Steps**: Plan for integrating mini-photo-editor

### Key Takeaways

- **Separation of Concerns**: Keep model, adapter, and control bus separate
- **Lazy Resolution**: Use variableResolver for on-demand value resolution
- **Security First**: Always use bearer token authentication
- **ARexx-Inspired**: Classic inter-process communication pattern
- **Web + Desktop**: Same codebase works in both modes

### Next Steps

1. Integrate mini-photo-editor following this guide
2. Test with external Rexx scripts
3. Consider other web apps for integration (e.g., Rexx-a-Sketch)
4. Build distributable binaries for production use

---

## Resources

- **Tauri Documentation**: https://tauri.app/
- **RexxJS Repository**: https://github.com/paul-hammant/RexxJS
- **Spreadsheet POC**: `examples/spreadsheet-poc/`
- **Vite Documentation**: https://vitejs.dev/
- **Axum Documentation**: https://docs.rs/axum/

---

**Document Version**: 1.0
**Last Updated**: 2025-11-06
**Author**: Claude (Anthropic AI)
**License**: MIT (for this integration guide)
