use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
    response::IntoResponse,
};
use sqlx::query;
use uuid::Uuid;
use std::time::Duration;
use crate::models::{FileUploadRequest, FileUploadResponse, File};
use crate::state::AppState;
use crate::services::minio::{get_presigned_put_url, get_presigned_get_url};
use crate::services::redis_cache::{increment_usage, invalidate_folder_listing, check_rate_limit};
use crate::middleware::auth::AuthUser;

pub async fn upload_file(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(payload): Json<FileUploadRequest>,
) -> impl IntoResponse {
    // 0. Rate Limiting (10 uploads per minute)
    let allowed = check_rate_limit(&state.redis, &user.sub, "upload", 10, 60).await.unwrap_or(true);
    if !allowed {
        return (StatusCode::TOO_MANY_REQUESTS, "Upload limit exceeded (10/min)").into_response();
    }

    let file_id = Uuid::new_v4().to_string();
    let storage_key = format!("{}/{}", payload.folder_id, file_id); // Simple key structure

    // 1. Generate Presigned URL
    let presigned_url = match get_presigned_put_url(
        &state.s3,
        &state.config.s3_bucket,
        &storage_key,
        Some(&payload.mime_type),
        Duration::from_secs(3600), // 1 hour
    ).await {
        Ok(url) => url,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    };

    // 2. Insert Metadata into DB (Optimistic)
    // Risk: Client fails upload, DB has record. Real systems use status column/webhooks.
    let result = query("INSERT INTO files (id, name, folder_id, owner_id, storage_key, size, mime_type, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(&file_id)
        .bind(&payload.name)
        .bind(&payload.folder_id)
        .bind(&user.sub)
        .bind(&storage_key)
        .bind(payload.size)
        .bind(&payload.mime_type)
        .bind(false)
        .execute(&state.db)
        .await;

    match result {
        Ok(_) => {
            // Update Cache
            let _ = increment_usage(&state.redis, &user.sub, payload.size).await;
            let _ = invalidate_folder_listing(&state.redis, &payload.folder_id).await;
            
            (StatusCode::CREATED, Json(FileUploadResponse {
                file_id,
                presigned_url,
                storage_key,
            })).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn download_file(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(file_id): Path<String>,
) -> impl IntoResponse {
    // 1. Get File Metadata
    let file: Option<File> = sqlx::query_as("SELECT * FROM files WHERE id = ?")
        .bind(&file_id)
        .fetch_optional(&state.db)
        .await
        .unwrap_or(None);

    let file = match file {
        Some(f) => f,
        None => return (StatusCode::NOT_FOUND, "File not found").into_response(),
    };

    // 2. Check Permission (Owner or Public or Shared)
    if file.owner_id != user.sub && !file.is_public {
        // Check folder permissions...
        // For brevity: Deny if not owner
        return (StatusCode::FORBIDDEN, "Access denied").into_response();
    }

    // 3. Generate Presigned GET URL
    let presigned_url = match get_presigned_get_url(
        &state.s3,
        &state.config.s3_bucket,
        &file.storage_key,
        Duration::from_secs(300), // 5 minutes
    ).await {
        Ok(url) => url,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    };

    (StatusCode::OK, Json(serde_json::json!({ "url": presigned_url }))).into_response()
}
