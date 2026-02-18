use axum::{
    extract::State,
    http::StatusCode,
    Json,
    response::IntoResponse,
};
use bcrypt::{hash, verify, DEFAULT_COST};
use sqlx::{query, query_as, query_scalar};
use uuid::Uuid;

use crate::models::{CreateUserDto, LoginDto, User, AuthResponse};
use crate::state::AppState;
use crate::services::auth::create_jwt;

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<CreateUserDto>,
) ->  impl IntoResponse {
    // 1. Check if user exists
    let exists: Option<String> = query_scalar("SELECT id FROM users WHERE email = ?")
        .bind(&payload.email)
        .fetch_optional(&state.db)
        .await
        .unwrap_or(None);

    if exists.is_some() {
        return (StatusCode::CONFLICT, "User already exists").into_response();
    }

    // 2. Hash password
    let password_hash = hash(payload.password, DEFAULT_COST).expect("Failed to hash password");

    // 3. Create user
    let user_id = Uuid::new_v4().to_string();
    let role = payload.role.unwrap_or_else(|| "student".to_string());

    let result = query("INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)")
        .bind(&user_id)
        .bind(&payload.name)
        .bind(&payload.email)
        .bind(&password_hash)
        .bind(&role)
        .execute(&state.db)
        .await;

    match result {
        Ok(_) => (StatusCode::CREATED, "User created successfully").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginDto>,
) -> impl IntoResponse {
    // 1. Find user
    let user: Option<User> = query_as("SELECT * FROM users WHERE email = ?")
        .bind(&payload.email)
        .fetch_optional(&state.db)
        .await
        .unwrap_or(None);

    match user {
        Some(user) => {
            // 2. Verify password
            if verify(payload.password, &user.password_hash).unwrap_or(false) {
                // 3. Generate Token
                let token = create_jwt(&user.id, &user.role, &state.config).unwrap();
                
                (StatusCode::OK, Json(AuthResponse { token, user })).into_response()
            } else {
                (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response()
            }
        }
        None => (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response(),
    }
}
