# Redis Design for XeuzCloud

## 1. Key Naming Convention & Namespaces
Semua key menggunakan prefix `xc:` (XeuzCloud) dan versioning jika perlu.
Format: `xc:<entity>:<id>:<attribute>`

- Separator: `:` (colon)
- ID: UUID string
- Casing: lowercase

## 2. Data Structure & Schema

### A. Folder Listing Cache
Digunakan untuk mempercepat browsing folder.
- **Key**: `xc:folder:{folder_id}:listing`
- **Type**: `STRING` (Compressed JSON)
- **TTL**: 1 - 5 menit (short lived, re-validated often)
- **Invalidation**:
    - Saat File Upload: `DEL xc:folder:{parent_id}:listing`
    - Saat Create Subfolder: `DEL xc:folder:{parent_id}:listing`

### B. File Metadata Cache
Akses metadata file tanpa hit DB.
- **Key**: `xc:file:{file_id}:meta`
- **Type**: `HASH`
    - `name`: "tugas_akhir.pdf"
    - `size`: "1048576"
    - `mime`: "application/pdf"
    - `owner`: "{user_id}"
- **TTL**: 30 menit

### C. Permission Cache
Cek apakah user X boleh akses folder Y.
- **Key**: `xc:perm:{folder_id}:{user_id}`
- **Type**: `STRING`
- **Value**: "owner" | "editor" | "viewer"
- **TTL**: 10 - 30 menit
- **Invalidation**: Saat admin ubah role atau owner ubah permission.

### D. Storage Quota Counter
Tracking penggunaan storage user secara real-time.
- **Key**: `xc:quota:{user_id}:used`
- **Type**: `STRING` (Counter)
- **Operations**:
    - Upload success: `INCRBY xc:quota:{user_id}:used {file_size}`
    - Delete file: `DECRBY xc:quota:{user_id}:used {file_size}`
- **TTL**: No Expiry (Persistent-ish)

### E. Rate Limiting Upload
Mencegah spam upload.
- **Key**: `xc:rl:upload:{user_id}`
- **Type**: `STRING` (Integer)
- **TTL**: 60 detik
- **Logic**: Max 10 uploads per minute.

## 3. TTL & Invalidation Strategy

| Type | TTL | Strategy | Trigger |
|------|-----|----------|---------|
| Folder Listing | 60s | Write-Through / Invalidate | Upload, Delete, Rename |
| Permissions | 15m | Time-based + Event-based | Role update, Share update |
| File Meta | 30m | Time-based | Rename, Move |
| Quota | None | Persistent | - |

## 4. Fallback Strategy (Circuit Breaker Logic)
Jika Redis down/timeout:
1. Log error (warn level).
2. Langsung fallback ke MySQL query.
3. Jangan panic atau return 500 ke user hanya karena cache miss/error.

## 5. Production Setup
- **Memory Policy**: `allkeys-lru` (Evict keys paling jarang dipakai saat full).
- **Max Memory**: Set limit (e.g., 2GB) untuk mencegah OOM killer.
- **Persistence**: RDB tiap 15 menit (untuk backup quota), atau matikan jika murni cache.
- **Connection**: Gunakan Connection Pooling (deadpool/bb8) di Rust.

## 6. Rust Implementation using redis-rs
Lihat implementasi di `src/services/redis_cache.rs`.
