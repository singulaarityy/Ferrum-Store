use axum::{
    async_trait,
    extract::{FromRequestParts, FromRef},
    http::{header, request::Parts, StatusCode},
};
use crate::state::AppState;
use crate::services::auth::{verify_jwt, Claims};


pub struct AuthUser(pub Claims);

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = (StatusCode, &'static str);

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(header::AUTHORIZATION)
            .and_then(|value| value.to_str().ok());

        let token = match auth_header {
            Some(token) if token.starts_with("Bearer ") => &token[7..],
            _ => return Err((StatusCode::UNAUTHORIZED, "Missing or invalid bearer token")),
        };

        let app_state = AppState::from_ref(state);
        let secret = &app_state.config.jwt_secret;

        match verify_jwt(token, secret) {
            Ok(claims) => Ok(AuthUser(claims)),
            Err(_) => Err((StatusCode::UNAUTHORIZED, "Invalid token")),
        }
    }
}
