use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
    response::IntoResponse,
};
use sqlx::{query_as, query};
use uuid::Uuid;
use serde::{Deserialize, Serialize};

use crate::models::{CreateFolderDto, Folder, File};
use crate::state::AppState;
use crate::middleware::auth::AuthUser;
use crate::services::redis_cache::{
    get_cached_subfolders, get_cached_folder_files,
    cache_subfolders, cache_folder_files,
    invalidate_folder_listing, 
    check_permission
};

#[derive(Serialize, Deserialize, Clone)]
pub struct FolderContentResponse {
    pub folder: Folder,
    pub subfolders: Vec<Folder>,
    pub files: Vec<File>,
}

pub async fn create_folder(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(payload): Json<CreateFolderDto>,
) -> impl IntoResponse {
    let folder_id = Uuid::new_v4().to_string();
    let is_public = payload.is_public.unwrap_or(false);

    // Normalize parent_id: "root" -> None
    let db_parent_id = match &payload.parent_id {
        Some(id) if id == "root" => None,
        Some(id) => Some(id.clone()),
        None => None,
    };

    // Verify parent permission if valid parent_id exists
    if let Some(parent_id) = &db_parent_id {
        // Check if parent folder exists and user has write permission
        let parent: Option<Folder> = sqlx::query_as("SELECT * FROM folders WHERE id = ?")
            .bind(parent_id)
            .fetch_optional(&state.db)
            .await
            .unwrap_or(None);
            
        if let Some(p) = parent {
            if p.owner_id != user.sub && user.role != "admin" {
                // Check explicit editor permission
                let has_perm: Option<i64> = query("SELECT COUNT(*) FROM folder_permissions WHERE folder_id = ? AND user_id = ? AND permission = 'editor'")
                    .bind(parent_id)
                    .bind(&user.sub)
                    .map(|row: sqlx::mysql::MySqlRow| {
                        use sqlx::Row;
                        row.try_get(0).unwrap_or(0)
                    })
                    .fetch_one(&state.db)
                    .await
                    .ok();
                
                if has_perm.unwrap_or(0) == 0 {
                     return (StatusCode::FORBIDDEN, "No permission to create folder here").into_response();
                }
            }
        } else {
             return (StatusCode::NOT_FOUND, "Parent folder not found").into_response();
        }
    }

    let result = query("INSERT INTO folders (id, name, parent_id, owner_id, is_public) VALUES (?, ?, ?, ?, ?)")
        .bind(&folder_id)
        .bind(&payload.name)
        .bind(&db_parent_id)
        .bind(&user.sub)
        .bind(is_public)
        .execute(&state.db)
        .await;

    match result {
        Ok(_) => {
            if let Some(parent_id) = &db_parent_id {
                let _ = invalidate_folder_listing(&state.redis, parent_id).await;
            } else {
                // Invalidate root cache if created in root
                let _ = invalidate_folder_listing(&state.redis, "root").await;
            }
            (StatusCode::CREATED, Json(serde_json::json!({ "id": folder_id }))).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn list_folder(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(folder_id): Path<String>,
) -> impl IntoResponse {
    // 1. Handle Root Special Case
    let folder: Folder = if folder_id == "root" {
        Folder {
            id: "root".to_string(),
            name: "Drive Saya".to_string(),
            parent_id: None,
            owner_id: user.sub.clone(),
            is_public: false,
            created_at: Some(chrono::Utc::now().naive_utc()),
        }
    } else {
        let f: Option<Folder> = query_as("SELECT * FROM folders WHERE id = ?")
            .bind(&folder_id)
            .fetch_optional(&state.db)
            .await
            .unwrap_or(None);

        match f {
            Some(f) => f,
            None => return (StatusCode::NOT_FOUND, "Folder not found").into_response(),
        }
    };

    // 2. Permission Check
    // Logic: Owner OR Admin OR Permission Entry OR Public
    let is_owner = folder.owner_id == user.sub;
    let is_admin = user.role == "admin";
    let is_public = folder.is_public;
    let is_root = folder_id == "root";

    let mut access_granted = is_owner || is_admin || is_public || is_root;

    if !access_granted && user.role == "staff" {
        // Staff can access student folders
        let owner_role: Option<String> = sqlx::query_scalar("SELECT role FROM users WHERE id = ?")
            .bind(&folder.owner_id)
            .fetch_optional(&state.db)
            .await
            .unwrap_or(None);
        
        if let Some(role) = owner_role {
            if role == "student" {
                access_granted = true;
            }
        }
    }

    if !access_granted {
         // Check explicit permission (Cache-first)
         let perm_cache = check_permission(&state.redis, &folder_id, &user.sub).await.unwrap_or(None);
         
         if let Some(role) = perm_cache {
            if role == "viewer" || role == "editor" {
                access_granted = true;
            }
         } else {
             // DB Fallback
             let has_perm: Option<i64> = query("SELECT COUNT(*) FROM folder_permissions WHERE folder_id = ? AND user_id = ?") 
                .bind(&folder_id)
                .bind(&user.sub)
                .map(|row: sqlx::mysql::MySqlRow| {
                    use sqlx::Row;
                    row.try_get(0).unwrap_or(0)
                })
                .fetch_one(&state.db)
                .await
                .ok();
             
             if has_perm.unwrap_or(0) > 0 {
                 access_granted = true;
                 // Ideally populate permission cache here
             }
         }
         
         if !access_granted {
             return (StatusCode::FORBIDDEN, "Access denied").into_response();
         }
    }

    // 3. Fetch Children (Try Cache First)
    // Note: ensure cache key uses "root" if folder_id is "root"
    let cached_subfolders = get_cached_subfolders(&state.redis, &folder_id).await.unwrap_or(None);
    let cached_files = get_cached_folder_files(&state.redis, &folder_id).await.unwrap_or(None);

    let subfolders = match cached_subfolders {
        Some(s) => s,
        None => {
            let sql = if folder_id == "root" {
                "SELECT * FROM folders WHERE parent_id IS NULL AND owner_id = ?" 
            } else {
                 "SELECT * FROM folders WHERE parent_id = ?"
            };
            
            let mut q = query_as(sql);
            if folder_id == "root" {
                q = q.bind(&user.sub); // For root, show own root folders
            } else {
                q = q.bind(&folder_id);
            }

            let s: Vec<Folder> = q.fetch_all(&state.db)
                .await
                .unwrap_or_default();
            // Populate cache
            let _ = cache_subfolders(&state.redis, &folder_id, &s).await;
            s
        }
    };

    let files = match cached_files {
        Some(f) => f,
        None => {
            let sql = if folder_id == "root" {
                "SELECT * FROM files WHERE folder_id IS NULL AND owner_id = ?" 
            } else {
                 "SELECT * FROM files WHERE folder_id = ?"
            };

            let mut q = query_as(sql);
            if folder_id == "root" {
                q = q.bind(&user.sub);
            } else {
                q = q.bind(&folder_id);
            }
            
            let f: Vec<File> = q.fetch_all(&state.db)
                .await
                .unwrap_or_default();
             // Populate cache
             let _ = cache_folder_files(&state.redis, &folder_id, &f).await;
             f
        }
    };

    let response = FolderContentResponse {
        folder,
        subfolders,
        files,
    };

    (StatusCode::OK, Json(response)).into_response()
}
