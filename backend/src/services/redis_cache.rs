use redis::{Client, AsyncCommands, RedisResult};
use serde::{Deserialize, Serialize};
use crate::models::{File, Folder};
use anyhow::{Result, Context};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CacheError {
    #[error("Redis connection failed")]
    ConnectionFailed,
    #[error("Cache set failed")]
    SetFailed,
    #[error("Cache get failed")]
    GetFailed,
    #[error("Cache key not found")]
    NotFound,
}

const PREFIX: &str = "xeuz"; // Updated to match design

// Public High-level Methods

// 1. Folder Listing specific (ZSET + HASH)
// This returns a list of File objects if cache hit, None if miss.
pub async fn get_cached_folder_files(client: &Client, folder_id: &str) -> Result<Option<Vec<File>>> {
    let mut con = client.get_multiplexed_async_connection().await
        .context("Failed to get Redis connection")?;

    let zkey = format!("{}:folder:{}:children", PREFIX, folder_id);
    let empty_key = format!("{}:folder:{}:empty", PREFIX, folder_id);

    // Check if "empty" marker exists
    let is_empty: bool = con.exists(&empty_key).await.unwrap_or(false);
    if is_empty {
        return Ok(Some(Vec::new()));
    }
    
    // Check if key exists first to distinguish empty folder vs cache miss
    let exists: bool = con.exists(&zkey).await?;
    if !exists {
        return Ok(None);
    }

    // Get all file IDs from ZSET
    let file_ids: Vec<String> = con.zrange(&zkey, 0, -1).await?;
    
    if file_ids.is_empty() {
        // Should have been caught by empty_key technically, but if not:
        return Ok(None); // Treat as miss to be safe
    }

    // Pipeline to fetch all metadata
    let mut pipe = redis::pipe();
    for fid in &file_ids {
        pipe.hgetall(format!("{}:file:{}:meta", PREFIX, fid));
    }
    
    let results: Vec<std::collections::HashMap<String, String>> = pipe.query_async(&mut con).await?;
    
    let mut files = Vec::new();
    for map in results {
        if map.is_empty() {
             continue;
        }
        
        let file = File {
            id: map.get("id").cloned().unwrap_or_default(),
            name: map.get("name").cloned().unwrap_or_default(),
            folder_id: folder_id.to_string(),
            owner_id: map.get("owner_id").cloned().unwrap_or_default(),
            storage_key: map.get("storage_key").cloned().unwrap_or_default(), // Added storage_key
            size: map.get("size").and_then(|s| s.parse().ok()).unwrap_or(0),
            mime_type: map.get("mime").cloned(),
            is_public: map.get("is_public").map(|s| s == "1").unwrap_or(false),
            // CreatedAt is tricky with string storage, skipping for now or parsing if stored as int
            created_at: None, 
        };
        files.push(file);
    }

    Ok(Some(files))
}

pub async fn cache_folder_files(client: &Client, folder_id: &str, files: &[File]) -> Result<()> {
    let mut con = client.get_multiplexed_async_connection().await
        .context("Failed to connect for caching")?;

    let zkey = format!("{}:folder:{}:children", PREFIX, folder_id);
    let empty_key = format!("{}:folder:{}:empty", PREFIX, folder_id);
    
    if files.is_empty() {
        let _: () = con.set_ex(empty_key, "1", 3600).await?;
        return Ok(());
    }

    let mut pipe = redis::pipe();
    pipe.atomic(); 
    
    // Clear old list if we are overwriting
    // pipe.del(&zkey); // atomic pipe will handle sequence
    
    for file in files {
        // Add to ZSET (Score = created_at timestamp or 0)
        let score = file.created_at.map(|t| t.timestamp()).unwrap_or(0);
        pipe.zadd(&zkey, &file.id, score);
        
        // Add Metadata to HASH
        let meta_key = format!("{}:file:{}:meta", PREFIX, file.id);
        
        let mut d = vec![
            ("id", file.id.clone()),
            ("name", file.name.clone()),
            ("owner_id", file.owner_id.clone()),
            ("storage_key", file.storage_key.clone()),
            ("size", file.size.to_string()),
            ("mime", file.mime_type.clone().unwrap_or_default()),
            ("is_public", if file.is_public { "1".to_string() } else { "0".to_string() }),
        ];
        
        pipe.hset_multiple(&meta_key, &d);
        pipe.expire(&meta_key, 3600); // 1 hour TTL for file meta
    }
    
    // Set TTL for the folder list itself
    pipe.expire(&zkey, 3600);
    
    pipe.query_async(&mut con).await?;

    Ok(())
}

// 2. Permission Cache
pub async fn check_permission(client: &Client, folder_id: &str, user_id: &str) -> Result<Option<String>> {
    let key = format!("{}:perm:{}:{}", PREFIX, folder_id, user_id);
    get_string(client, &key).await
}

pub async fn cache_permission(client: &Client, folder_id: &str, user_id: &str, role: &str) -> Result<()> {
    let key = format!("{}:perm:{}:{}", PREFIX, folder_id, user_id);
    set_string(client, &key, role, 900).await
}

// Subfolders Cache
pub async fn get_cached_subfolders(client: &Client, folder_id: &str) -> Result<Option<Vec<Folder>>> {
    let mut con = client.get_multiplexed_async_connection().await
        .context("Failed to get Redis connection")?;

    let zkey = format!("{}:folder:{}:subfolders", PREFIX, folder_id);
    let empty_key = format!("{}:folder:{}:subfolders:empty", PREFIX, folder_id);

    let is_empty: bool = con.exists(&empty_key).await.unwrap_or(false);
    if is_empty {
        return Ok(Some(Vec::new()));
    }
    
    let exists: bool = con.exists(&zkey).await?;
    if !exists {
        return Ok(None);
    }

    let folder_ids: Vec<String> = con.zrange(&zkey, 0, -1).await?;
    if folder_ids.is_empty() {
        return Ok(None);
    }

    let mut pipe = redis::pipe();
    for fid in &folder_ids {
        pipe.hgetall(format!("{}:folder:{}:meta", PREFIX, fid));
    }
    
    let results: Vec<std::collections::HashMap<String, String>> = pipe.query_async(&mut con).await?;
    
    let mut folders = Vec::new();
    for map in results {
        if map.is_empty() { continue; }
        
        folders.push(Folder {
            id: map.get("id").cloned().unwrap_or_default(),
            name: map.get("name").cloned().unwrap_or_default(),
            parent_id: Some(folder_id.to_string()),
            owner_id: map.get("owner_id").cloned().unwrap_or_default(),
            is_public: map.get("is_public").map(|s| s == "1").unwrap_or(false),
            created_at: None,
        });
    }

    Ok(Some(folders))
}

pub async fn cache_subfolders(client: &Client, parent_id: &str, folders: &[Folder]) -> Result<()> {
    let mut con = client.get_multiplexed_async_connection().await?;
    let zkey = format!("{}:folder:{}:subfolders", PREFIX, parent_id);
    let empty_key = format!("{}:folder:{}:subfolders:empty", PREFIX, parent_id);
    
    if folders.is_empty() {
        let _: () = con.set_ex(empty_key, "1", 3600).await?;
        return Ok(());
    }

    let mut pipe = redis::pipe();
    pipe.atomic(); 
    
    for folder in folders {
        let score = folder.created_at.map(|t| t.timestamp()).unwrap_or(0);
        pipe.zadd(&zkey, &folder.id, score);
        
        let meta_key = format!("{}:folder:{}:meta", PREFIX, folder.id);
        pipe.hset_multiple(&meta_key, &[
            ("id", folder.id.clone()),
            ("name", folder.name.clone()),
            ("owner_id", folder.owner_id.clone()),
            ("is_public", if folder.is_public { "1".to_string() } else { "0".to_string() }),
        ]);
        pipe.expire(&meta_key, 3600);
    }
    pipe.expire(&zkey, 3600);
    pipe.query_async(&mut con).await?;
    Ok(())
}

pub async fn invalidate_folder_listing(client: &Client, folder_id: &str) -> Result<()> {
    let zkey_files = format!("{}:folder:{}:children", PREFIX, folder_id);
    let empty_key_files = format!("{}:folder:{}:empty", PREFIX, folder_id);
    let zkey_subs = format!("{}:folder:{}:subfolders", PREFIX, folder_id);
    let empty_key_subs = format!("{}:folder:{}:subfolders:empty", PREFIX, folder_id);
    
    let mut con = client.get_multiplexed_async_connection().await?;
    // Ignoring errors on del
    let _: () = con.del(&[zkey_files, empty_key_files, zkey_subs, empty_key_subs]).await.unwrap_or(());
    
    Ok(())
}

// Private Helpers
async fn get_string(client: &Client, key: &str) -> Result<Option<String>> {
    let mut con = client.get_multiplexed_async_connection().await
        .context("Redis conn failed")?;
    let res: Option<String> = con.get(key).await.unwrap_or(None);
    Ok(res)
}

async fn set_string(client: &Client, key: &str, value: &str, ttl: u64) -> Result<()> {
    let mut con = client.get_multiplexed_async_connection().await
        .context("Redis conn failed")?;
    let _: () = con.set_ex(key, value, ttl).await?;
    Ok(())
}
