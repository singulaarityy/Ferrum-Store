use axum::{
    routing::{get, post, delete},
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{CorsLayer, Any};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod state;
mod services;
mod middleware;
mod handlers;
mod models;
// mod db; // Handlers use state.db directly for now

use crate::config::Config;
use crate::state::AppState;
use crate::handlers::{user, folder, file};

#[tokio::main]
async fn main() {
    // 1. Initialize Logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "backend=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // 2. Load Config
    let config = Config::new();
    let port = config.port;
    let host = config.host.clone(); // Clone for later use if needed, though SocketAddr parse handles string

    // 3. Initialize App State (DB, Redis, S3)
    let state = AppState::new(Arc::new(config)).await;

    // 4. Define Routes
    let app = Router::new()
        // Auth Routes
        .route("/api/auth/register", post(user::register))
        .route("/api/auth/login", post(user::login))
        
        // Folder Routes
        .route("/api/folders", post(folder::create_folder))
        .route("/api/folders/:id", get(folder::list_folder))
        
        // File Routes
        .route("/api/files/upload", post(file::upload_file))
        .route("/api/files/:id/download", get(file::download_file))

        // Middleware
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any))
        .with_state(state);

    // 5. Run Server
    let addr_str = format!("{}:{}", host, port);
    let addr: SocketAddr = addr_str.parse().expect("Invalid address");
    
    tracing::info!("Server listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
