-- ================================
-- EXTENSIONS
-- ================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ================================
-- ENUM TYPES
-- ================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE permission_type AS ENUM ('viewer', 'editor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- ================================
-- USERS TABLE
-- ================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);


-- ================================
-- FOLDERS TABLE
-- ================================

CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_owner ON folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_folders_public ON folders(is_public);


-- ================================
-- FILES TABLE
-- ================================

CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    storage_key TEXT NOT NULL UNIQUE,
    size BIGINT NOT NULL CHECK (size >= 0),
    mime_type TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_public ON files(is_public);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);

-- Fast search by file name
CREATE INDEX IF NOT EXISTS idx_files_name_trgm
ON files USING gin (name gin_trgm_ops);


-- ================================
-- FOLDER PERMISSIONS TABLE
-- ================================

CREATE TABLE IF NOT EXISTS folder_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission permission_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (folder_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_folder_perm_user ON folder_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_folder_perm_folder ON folder_permissions(folder_id);
