use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::NaiveDateTime;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    #[serde(skip_serializing)] 
    pub password_hash: String,
    pub role: String, // 'admin', 'staff', 'student'
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Folder {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub owner_id: String,
    pub is_public: bool, // 0 or 1 in MySQL TINYINT(1) -> bool in sqlx
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct File {
    pub id: String,
    pub name: String,
    pub folder_id: String,
    pub owner_id: String,
    pub storage_key: String,
    pub size: i64,
    pub mime_type: Option<String>,
    pub is_public: bool,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct FolderPermission {
    pub id: String,
    pub folder_id: String,
    pub user_id: String,
    pub permission: String, // 'viewer', 'editor'
    pub created_at: Option<NaiveDateTime>,
}

// DTOs (Data Transfer Objects)
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateUserDto {
    pub name: String,
    pub email: String,
    pub password: String,
    pub role: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginDto {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: User,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateFolderDto {
    pub name: String,
    pub parent_id: Option<String>,
    pub is_public: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileUploadRequest {
    pub name: String,
    pub folder_id: String,
    pub size: i64,
    pub mime_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileUploadResponse {
    pub file_id: String,
    pub presigned_url: String,
    pub storage_key: String,
}
