# FerrumStore

![Rust](https://img.shields.io/badge/rust-%23000000.svg?style=for-the-badge&logo=rust&logoColor=white)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![MUI](https://img.shields.io/badge/MUI-%230081CB.svg?style=for-the-badge&logo=mui&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

**FerrumStore** adalah platform penyimpanan cloud berkinerja tinggi yang dirancang untuk mereplikasi pengalaman intuitif Google Drive, didukung oleh arsitektur backend modern yang tangguh. Dibangun untuk kecepatan, skalabilitas, dan interaksi pengguna yang mulus.

## ✨ Fitur Utama

- **Core Berkinerja Tinggi**: Backend direkayasa menggunakan **Rust** untuk performa super cepat dan keamanan memori.
- **Smart Caching**: Integrasi **Redis** dengan pola ZSET/HASH canggih untuk browsing folder dan listing file instan.
- **Penyimpanan Skalabel**: Mendukung object storage kompatibel S3 (MinIO) untuk skalabilitas tanpa batas.
- **UI/UX Modern**: Antarmuka responsif dan *pixel-perfect* dibangun dengan **Next.js** dan **Material UI**, mendukung upload *drag-and-drop* dan progres real-time.
- **Akses Aman**: Otentikasi berbasis JWT dengan kontrol akses berbasis peran (RBAC).

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Sistem UI**: Material UI (MUI) v6
- **Manajemen State**: React Hooks & Context
- **Interaksi**: React Dropzone, Framer Motion

### Backend
- **Bahasa**: Rust
- **Web Framework**: Axum
- **Database**: MySQL (Metadata), Redis (Caching & Akselerasi)
- **Storage**: MinIO / AWS S3
- **ORM**: SQLx (Performa Async raw SQL)

## 🚀 Arsitektur

Sistem ini menggunakan strategi **Write-Through Caching**:
1.  **Metadata**: Disimpan dengan andal di MySQL.
2.  **Akselerator**: Data panas (struktur folder, izin) disimpan di Redis untuk akses sub-milidetik.
3.  **Storage**: File fisik di-stream langsung ke S3/MinIO melalui URL yang ditandatangani (*presigned URLs*).

## 📦 Memulai

### Prasyarat
- Docker & Docker Compose
- Node.js 18+
- Rust (stable terbaru)

### Instalasi

1.  **Jalankan Infrastruktur**
    ```bash
    cd backend
    docker-compose up -d
    ```

2.  **Jalankan Backend**
    ```bash
    cd backend
    cargo run
    ```

3.  **Jalankan Frontend**
    ```bash
    npm install
    npm run dev
    ```

4.  Akses aplikasi di `http://localhost:3000`.

## 💎 Kredit & Penghargaan

Dirancang dan dikembangkan dengan fokus pada minimalisme dan standar rekayasa profesional.

**Lead Developer**: [Singularityy](https://github.com/singulaarityy)
**Desain Arsitektur**: Advanced Agentic Coding Team
**Inspirasi UI**: Google Workspace Design System

---
*© 2026 FerrumStore Project. All rights reserved.*
