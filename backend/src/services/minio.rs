use aws_sdk_s3::Client;
use aws_sdk_s3::presigning::PresigningConfig;
use std::time::Duration;
use anyhow::{Result, Context};

pub async fn get_presigned_put_url(
    client: &Client,
    bucket: &str,
    key: &str,
    content_type: Option<&str>,
    expires_in: Duration,
) -> Result<String> {
    let mut builder = client
        .put_object()
        .bucket(bucket)
        .key(key);

    if let Some(ct) = content_type {
        builder = builder.content_type(ct);
    }
    
    // AWS SDK requires configuring the expiration
    let config = PresigningConfig::expires_in(expires_in)
        .context("Failed to create presigning config")?;

    let presigned_req = builder
        .presigned(config)
        .await
        .context("Failed to generate presigned PUT URL")?;

    Ok(presigned_req.uri().to_string())
}

pub async fn get_presigned_get_url(
    client: &Client,
    bucket: &str,
    key: &str,
    expires_in: Duration,
) -> Result<String> {
    let config = PresigningConfig::expires_in(expires_in)
        .context("Failed to create presigning config")?;
        
    let presigned_req = client
        .get_object()
        .bucket(bucket)
        .key(key)
        .presigned(config)
        .await
        .context("Failed to generate presigned GET URL")?;

    Ok(presigned_req.uri().to_string())
}
