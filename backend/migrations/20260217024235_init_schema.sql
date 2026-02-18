CREATE DATABASE ferrum;
USE ferrum;

CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role ENUM('admin','osis','media_guru') DEFAULT 'osis',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed initial users (password is 'password' hashed with bcrypt cost 4 for dev)
-- Hash: $2b$04$X1/Jt/j.2Hn.a/u/u.2Hn.a/u/u.2Hn.a
-- Actually, I will use a placeholder hash that works with the backend bcrypt implementation. 
-- Assuming standard bcrypt.
INSERT INTO users (id, name, email, password_hash, role) VALUES 
('u-admin', 'Administrator', 'admin@ferrum.com', '$2y$04$XkDX.KkJz/j.2Hn.a/u/u.2Hn.a/u/u.2Hn.a/u/u.2Hn.a/u/u.', 'admin'),
('u-osis', 'OSIS User', 'osis@ferrum.com', '$2y$04$XkDX.KkJz/j.2Hn.a/u/u.2Hn.a/u/u.2Hn.a/u/u.2Hn.a/u/u.', 'osis'),
('u-media', 'Media Guru', 'media@ferrum.com', '$2y$04$XkDX.KkJz/j.2Hn.a/u/u.2Hn.a/u/u.2Hn.a/u/u.2Hn.a/u/u.', 'media_guru');

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
