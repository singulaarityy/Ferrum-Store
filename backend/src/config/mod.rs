use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    // Database
    pub database_url: String,
    
    // Redis
    pub redis_url: String,
    
    // MinIO / S3
    pub s3_endpoint: String,
    pub s3_region: String,
    pub s3_bucket: String,
    pub s3_access_key: String,
    pub s3_secret_key: String,
    pub s3_public_url: String, // For public file access

    // Authentication
    pub jwt_secret: String,
    pub jwt_expiration: i64, 
    
    // App
    pub host: String, // e.g., 0.0.0.0
    pub port: u16,    // e.g., 8080
}

impl Config {
    pub fn new() -> Self {
        dotenv::dotenv().ok();
        
        Self {
            database_url: env::var("DATABASE_URL").expect("DATABASE_URL must be set"),
            redis_url: env::var("REDIS_URL").expect("REDIS_URL must be set"),
            s3_endpoint: env::var("S3_ENDPOINT").expect("S3_ENDPOINT must be set"),
            s3_region: env::var("S3_REGION").unwrap_or_else(|_| "us-east-1".to_string()),
            s3_bucket: env::var("S3_BUCKET").expect("S3_BUCKET must be set"),
            s3_access_key: env::var("S3_ACCESS_KEY").expect("S3_ACCESS_KEY must be set"),
            s3_secret_key: env::var("S3_SECRET_KEY").expect("S3_SECRET_KEY must be set"),
            s3_public_url: env::var("S3_PUBLIC_URL").expect("S3_PUBLIC_URL must be set"),
            jwt_secret: env::var("JWT_SECRET").expect("JWT_SECRET must be set"),
            jwt_expiration: env::var("JWT_EXPIRATION").unwrap_or_else(|_| "86400".to_string()).parse().unwrap_or(86400),
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("PORT").unwrap_or_else(|_| "8080".to_string()).parse().unwrap_or(8080),
        }
    }
}
