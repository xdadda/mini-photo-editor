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
use std::path::{Path, PathBuf};

// Normalize a path by resolving . and .. components
fn normalize_path(path: &Path) -> PathBuf {
    let mut components = Vec::new();
    for component in path.components() {
        match component {
            std::path::Component::ParentDir => {
                components.pop();
            }
            std::path::Component::CurDir => {}
            comp => components.push(comp),
        }
    }
    components.iter().collect()
}

#[derive(Clone, serde::Serialize)]
struct InitialFilePayload {
    file_path: Option<String>,
}

// Control Bus Command Structure
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

// COMET-style: Pending command for browser to pick up
#[derive(Debug, Clone, Serialize)]
struct PendingCommand {
    request_id: String,
    command: String,
}

// Global registry for pending requests (request_id -> response channel)
type PendingRequests = Arc<Mutex<HashMap<String, oneshot::Sender<serde_json::Value>>>>;

// Queue of commands waiting for browser to poll (COMET/Selenium-RC style)
type CommandQueue = Arc<Mutex<HashMap<String, (PendingCommand, oneshot::Sender<()>)>>>;

// HTTP Server State
#[derive(Clone)]
struct ServerState {
    auth_token: String,
    pending_requests: PendingRequests,
    command_queue: CommandQueue,
}

// Browser polls this endpoint (long-polling / COMET style)
async fn poll_command(
    State(state): State<Arc<ServerState>>,
    headers: HeaderMap,
) -> Result<Json<Option<PendingCommand>>, StatusCode> {
    // Verify authentication token
    let auth_header = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !auth_header.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let provided_token = &auth_header[7..];
    if provided_token != state.auth_token {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Check if there's a pending command
    let mut queue = state.command_queue.lock().await;

    if let Some(request_id) = queue.keys().next().cloned() {
        // Take ownership of the command from queue
        if let Some((cmd, notify)) = queue.remove(&request_id) {
            drop(queue);

            // Notify the HTTP handler that browser picked up the command
            let _ = notify.send(());

            log::info!("Browser polled, sending command: {}", cmd.command);
            return Ok(Json(Some(cmd)));
        }
    }

    // No commands pending
    Ok(Json(None))
}

// Browser posts results back here
async fn post_result(
    State(state): State<Arc<ServerState>>,
    headers: HeaderMap,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Verify authentication token
    let auth_header = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !auth_header.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let provided_token = &auth_header[7..];
    if provided_token != state.auth_token {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let request_id = payload.get("request_id")
        .and_then(|v| v.as_str())
        .ok_or(StatusCode::BAD_REQUEST)?
        .to_string();

    let result = payload.get("result")
        .cloned()
        .unwrap_or(serde_json::Value::Null);

    log::info!("Received result for request {}: {:?}", request_id, result);

    // Find and remove the pending request
    let sender = {
        let mut pending = state.pending_requests.lock().await;
        pending.remove(&request_id)
    };

    // Send result through channel if still pending
    if let Some(tx) = sender {
        let _ = tx.send(result);
        Ok(Json(serde_json::json!({"status": "ok"})))
    } else {
        log::warn!("No pending request found for ID: {}", request_id);
        Err(StatusCode::NOT_FOUND)
    }
}

// HTTP API Handler (called by external Node.js REXX scripts)
async fn handle_control_bus(
    State(state): State<Arc<ServerState>>,
    headers: HeaderMap,
    Json(request): Json<ControlBusRequest>,
) -> Result<Json<ControlBusResponse>, StatusCode> {
    log::info!("Received HTTP request: command={:?}, params={:?}", request.command, request.params);

    // Verify authentication token
    let auth_header = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !auth_header.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let provided_token = &auth_header[7..];
    if provided_token != state.auth_token {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Command is already valid REXX syntax - use it directly
    let full_command = request.command.clone();
    log::info!("Received command: {}", full_command);

    // Generate unique request ID
    let request_id = uuid::Uuid::new_v4().to_string();

    // Create oneshot channel for response
    let (tx, rx) = oneshot::channel();
    let (notify_tx, notify_rx) = oneshot::channel();

    // Add to pending requests
    {
        let mut pending = state.pending_requests.lock().await;
        pending.insert(request_id.clone(), tx);
    }

    // Add command to queue for browser to poll
    let cmd = PendingCommand {
        request_id: request_id.clone(),
        command: full_command,
    };

    {
        let mut queue = state.command_queue.lock().await;
        queue.insert(request_id.clone(), (cmd, notify_tx));
    }

    log::info!("Command queued, waiting for browser to poll...");

    // Wait for browser to pick up command (with timeout)
    let pickup_timeout = tokio::time::timeout(Duration::from_secs(5), notify_rx).await;
    if pickup_timeout.is_err() {
        // Browser didn't pick up command
        let mut queue = state.command_queue.lock().await;
        queue.remove(&request_id);
        let mut pending = state.pending_requests.lock().await;
        pending.remove(&request_id);

        return Ok(Json(ControlBusResponse {
            success: false,
            result: None,
            error: Some("Browser did not poll for command within 5 seconds".to_string()),
        }));
    }

    log::info!("Browser picked up command, waiting for result...");

    // Wait for response with timeout
    let result = tokio::time::timeout(Duration::from_secs(10), rx).await;

    match result {
        Ok(Ok(value)) => {
            log::info!("Got result: {:?}", value);
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
                error: Some("Browser closed connection before responding".to_string()),
            }))
        }
        Err(_) => {
            // Timeout
            let mut pending = state.pending_requests.lock().await;
            pending.remove(&request_id);
            Ok(Json(ControlBusResponse {
                success: false,
                result: None,
                error: Some("Command execution timed out after 10 seconds".to_string()),
            }))
        }
    }
}

// Start HTTP server
async fn start_http_server(state: Arc<ServerState>, port: u16) {
    let app = Router::new()
        .route("/api/photoeditor", post(handle_control_bus))
        .route("/api/poll", get(poll_command))
        .route("/api/result", post(post_result))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(state);

    let addr = format!("127.0.0.1:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind HTTP server");

    log::info!("Control Bus HTTP API listening on http://{}", addr);
    log::info!("COMET-style polling enabled on /api/poll");

    axum::serve(listener, app)
        .await
        .expect("HTTP server error");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pending_requests: PendingRequests = Arc::new(Mutex::new(HashMap::new()));
    let command_queue: CommandQueue = Arc::new(Mutex::new(HashMap::new()));
    let pending_requests_for_setup = pending_requests.clone();
    let command_queue_for_setup = command_queue.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(move |app| {
            // Register signal handler to close window on process termination
            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                #[cfg(unix)]
                {
                    use signal_hook::consts::signal::*;
                    use signal_hook::iterator::Signals;

                    if let Ok(mut signals) = Signals::new(&[SIGTERM, SIGINT, SIGQUIT]) {
                        for _ in signals.forever() {
                            log::info!("Received termination signal, closing window...");
                            if let Some(window) = app_handle.get_webview_window("main") {
                                let _ = window.close();
                            }
                            std::process::exit(0);
                        }
                    }
                }
            });

            // Logging plugin disabled for now - using standard log crate instead
            // if cfg!(debug_assertions) {
            //     app.handle().plugin(
            //         tauri_plugin_log::Builder::default()
            //             .level(log::LevelFilter::Info)
            //             .build(),
            //     )?;
            // }

            // Get command-line arguments
            let args: Vec<String> = std::env::args().collect();

            // Find the first non-flag argument (file path)
            let file_path = args.iter()
                .skip(1) // Skip the binary name
                .find(|arg| !arg.starts_with("--") && !arg.starts_with("-"))
                .map(|path| {
                    // Convert relative paths to absolute
                    let path_buf = std::path::PathBuf::from(path);
                    if path_buf.is_absolute() {
                        path.clone()
                    } else {
                        let cwd = std::env::current_dir().unwrap();
                        let joined = cwd.join(&path_buf);

                        // We MUST normalize to remove ../ for Tauri security
                        if joined.exists() {
                            joined.canonicalize()
                                .ok()
                                .and_then(|p| p.to_str().map(|s| s.to_string()))
                                .unwrap_or_else(|| normalize_path(&joined).to_str().unwrap_or(path).to_string())
                        } else {
                            normalize_path(&joined).to_str().unwrap_or(path).to_string()
                        }
                    }
                });

            // Check for --control-bus flag (CLI) or environment variable (dev mode)
            let enable_http = args.contains(&"--control-bus".to_string())
                || std::env::var("ENABLE_CONTROL_BUS").is_ok();
            let auth_token = std::env::var("CONTROL_BUS_TOKEN")
                .unwrap_or_else(|_| "dev-token-12345".to_string());

            // Start HTTP server if requested
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

                log::info!("Control Bus HTTP API enabled on port 8083");
                log::info!("Auth token: {}", auth_token);
            }

            // Emit the file path to the frontend after a delay to ensure JS is ready
            if let Some(file_path_value) = file_path {
                let window = app.get_webview_window("main").unwrap();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(2000));
                    let _ = window.emit("initial-file", InitialFilePayload { file_path: Some(file_path_value) });
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
