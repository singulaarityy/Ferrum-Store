use sqlx::MySqlPool;
use redis::Client;
use aws_sdk_s3::Client as S3Client;
use std::sync::Arc;
use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: MySqlPool,
    pub redis: Client,
    pub s3: S3Client,
    pub config: Arc<Config>,
}

impl AppState {
    pub async fn new(config: Arc<Config>) -> Self {
        // Connect to Database
        let db = MySqlPool::connect(&config.database_url)
            .await
            .expect("Failed to connect to MySQL");

        // Connect to Redis
        let redis = Client::open(config.redis_url.clone())
            .expect("Failed to create Redis client");
        
        // Connect to MinIO / S3
        let s3_config = aws_config::from_env()
            .endpoint_url(&config.s3_endpoint)
            .region(aws_sdk_s3::config::Region::new(config.s3_region.clone()))
            .credentials_provider(aws_sdk_s3::config::Credentials::new(
                &config.s3_access_key,
                &config.s3_secret_key,
                None,
                None,
                "static",
            ))
            .load()
            .await;
        
        let s3 = S3Client::new(&s3_config);

        Self {
            db,
            redis,
            s3,
            config,
        }
    }
}
