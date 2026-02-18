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
use crate::middleware::auth::{AuthUser, OptionalAuthUser};

// ... other imports ...

// (Keep existing imports)

pub async fn create_folder(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(payload): Json<CreateFolderDto>,
) -> impl IntoResponse {
    // Role Check: Only admin, osis, media_guru can create folders
    let allowed_roles = ["admin", "osis", "media_guru"];
    if !allowed_roles.contains(&user.role.as_str()) {
        return (StatusCode::FORBIDDEN, "Insufficient role to create folders").into_response();
    }

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
                let has_perm: Option<i64> = sqlx::query_scalar("SELECT COUNT(*) FROM folder_permissions WHERE folder_id = ? AND user_id = ? AND permission = 'editor'")
                    .bind(parent_id)
                    .bind(&user.sub)
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
    OptionalAuthUser(opt_user): OptionalAuthUser,
    Path(folder_id): Path<String>,
) -> impl IntoResponse {
    let user_sub = opt_user.as_ref().map(|u| u.sub.clone());
    let user_role = opt_user.as_ref().map(|u| u.role.clone());

    // 1. Handle Root Special Case
    // "root" is strictly for logged-in users to see their own files/folders.
    if folder_id == "root" {
        if let Some(sub) = user_sub {
             let folder = Folder {
                id: "root".to_string(),
                name: "Drive Saya".to_string(),
                parent_id: None,
                owner_id: sub.clone(),
                is_public: false,
                created_at: Some(chrono::Utc::now().naive_utc()),
            };
            
            // Allow access (it's their root)
            // Fetch children
            // Cache logic for root... (simplified here for brevity, assume similar structure to existing)
             let cached_subfolders = get_cached_subfolders(&state.redis, "root").await.unwrap_or(None); // Ensure cache key distinguishes per user! ideally "root:{user_id}"
             // For simplicity, let's bypass cache for root or ensure cache invalidation touches user-specific keys. 
             // Current redis implementation might be simplistic. I'll just query DB for root to be safe or assume user-specific keys aren't implemented yet.
             
             let subfolders: Vec<Folder> = sqlx::query_as("SELECT * FROM folders WHERE parent_id IS NULL AND owner_id = ?")
                .bind(&sub)
                .fetch_all(&state.db)
                .await
                .unwrap_or_default();
                
             let files: Vec<File> = sqlx::query_as("SELECT * FROM files WHERE folder_id IS NULL AND owner_id = ?")
                .bind(&sub)
                .fetch_all(&state.db)
                .await
                .unwrap_or_default();
                
             let response = FolderContentResponse {
                folder,
                subfolders,
                files,
             };
             return (StatusCode::OK, Json(response)).into_response();

        } else {
            return (StatusCode::UNAUTHORIZED, "Please login to view your files").into_response();
        }
    }

    // 2. Fetch Folder
    let folder: Option<Folder> = query_as("SELECT * FROM folders WHERE id = ?")
        .bind(&folder_id)
        .fetch_optional(&state.db)
        .await
        .unwrap_or(None);

    let folder = match folder {
        Some(f) => f,
        None => return (StatusCode::NOT_FOUND, "Folder not found").into_response(),
    };

    // 3. Permission Check
    let is_public = folder.is_public;
    let is_owner = user_sub.as_ref() == Some(&folder.owner_id);
    let is_admin = user_role.as_deref() == Some("admin");

    let mut access_granted = is_owner || is_admin || is_public;

    if !access_granted {
        if let Some(sub) = &user_sub {
             // Check explicit permission (Cache-first)
             let perm_cache = check_permission(&state.redis, &folder_id, sub).await.unwrap_or(None);
             
             if let Some(role) = perm_cache {
                if role == "viewer" || role == "editor" {
                    access_granted = true;
                }
             } else {
                 // DB Fallback
                 let has_perm: Option<i64> = sqlx::query_scalar("SELECT COUNT(*) FROM folder_permissions WHERE folder_id = ? AND user_id = ?") 
                    .bind(&folder_id)
                    .bind(sub)
                    .fetch_one(&state.db)
                    .await
                    .ok();
                 
                 if has_perm.unwrap_or(0) > 0 {
                     access_granted = true;
                     // Ideally populate permission cache here
                 }
             }
        }
    }

    if !access_granted {
        return (StatusCode::FORBIDDEN, "Access denied").into_response();
    }

    // 4. Fetch Children
    // IMPORTANT: If user is viewing a public folder but is NOT the owner/admin, 
    // should they see ALL files in it, or only public files?
    // Assumption: If a folder is public, its contents are visible? 
    // Usually systems inherit permissions. Let's assume if you have access to folder, you see its content.
    // However, the prompt says "secara default, file/folder yang dibuat akan private... tapi jika folder/file aksesnya sudah dipublik maka link tersebut akan dapat diakses oleh publik".
    // This could mean granular control inside public folders? 
    // Let's stick to standard drive behavior: Valid folder access -> List all contents.

    let cached_subfolders = get_cached_subfolders(&state.redis, &folder_id).await.unwrap_or(None);
    let cached_files = get_cached_folder_files(&state.redis, &folder_id).await.unwrap_or(None);

    let subfolders = match cached_subfolders {
        Some(s) => s,
        None => {
            let s: Vec<Folder> = sqlx::query_as("SELECT * FROM folders WHERE parent_id = ?")
                .bind(&folder_id)
                .fetch_all(&state.db)
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
            let f: Vec<File> = sqlx::query_as("SELECT * FROM files WHERE folder_id = ?")
                .bind(&folder_id)
                .fetch_all(&state.db)
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
