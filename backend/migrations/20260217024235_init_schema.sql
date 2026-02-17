CREATE DATABASE ferrum;
USE ferrum;

CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role ENUM('admin','staff','student') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);

CREATE TABLE folders (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id CHAR(36),
    owner_id CHAR(36) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_folders_parent ON folders(parent_id);
CREATE INDEX idx_folders_owner ON folders(owner_id);

CREATE TABLE files (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    folder_id CHAR(36) NOT NULL,
    owner_id CHAR(36) NOT NULL,
    storage_key VARCHAR(500) NOT NULL UNIQUE,
    size BIGINT NOT NULL,
    mime_type VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_files_folder ON files(folder_id);
CREATE INDEX idx_files_owner ON files(owner_id);

CREATE TABLE folder_permissions (
    id CHAR(36) PRIMARY KEY,
    folder_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    permission ENUM('viewer','editor') NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE KEY unique_permission (folder_id, user_id),
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
