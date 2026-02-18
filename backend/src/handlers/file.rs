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
use crate::middleware::auth::{AuthUser, OptionalAuthUser};

pub async fn upload_file(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(payload): Json<FileUploadRequest>,
) -> impl IntoResponse {
    // Role Check: Only admin, osis, media_guru can upload files
    let allowed_roles = ["admin", "osis", "media_guru"];
    if !allowed_roles.contains(&user.role.as_str()) {
        return (StatusCode::FORBIDDEN, "Insufficient role to upload files").into_response();
    }

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
    
    let db_folder_id = if payload.folder_id == "root" {
        None
    } else {
        Some(payload.folder_id.clone())
    };

    let result = query("INSERT INTO files (id, name, folder_id, owner_id, storage_key, size, mime_type, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(&file_id)
        .bind(&payload.name)
        .bind(&db_folder_id)
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
    OptionalAuthUser(opt_user): OptionalAuthUser,
    Path(file_id): Path<String>,
) -> impl IntoResponse {
    let user_sub = opt_user.as_ref().map(|u| u.sub.clone());
    let user_role = opt_user.as_ref().map(|u| u.role.clone());

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

    // 2. Check Permission
    let is_public = file.is_public;
    let is_owner = user_sub.as_ref() == Some(&file.owner_id);
    let is_admin = user_role.as_deref() == Some("admin");

    let mut access_granted = is_public || is_owner || is_admin;

    if !access_granted {
        if let Some(sub) = &user_sub {
             // Check folder permissions (simplistic check: if user has access to folder, they can download file?)
             // Or maybe file-specific sharing? The schema only has folder_permissions.
             // Assumption: Folder View/Edit permission grants access to files inside.
             let folder_id = &file.folder_id;
             
             // Reuse folder permission logic (or simple DB check)
             let has_perm: Option<i64> = sqlx::query_scalar("SELECT COUNT(*) FROM folder_permissions WHERE folder_id = ? AND user_id = ?") 
                .bind(folder_id)
                .bind(sub)
                .fetch_one(&state.db)
                .await
                .ok();
             
             if has_perm.unwrap_or(0) > 0 {
                 access_granted = true;
             }
        }
    }

    if !access_granted {
         if user_sub.is_none() {
             return (StatusCode::UNAUTHORIZED, "Login required").into_response();
         } else {
             return (StatusCode::FORBIDDEN, "Access denied").into_response();
         }
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
