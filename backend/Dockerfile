# Build Stage
FROM rust:1.76-slim-bullseye as builder
WORKDIR /app
COPY . .
RUN cargo build --release

# Runtime Stage
FROM debian:bullseye-slim
WORKDIR /app
COPY --from=builder /app/target/release/backend /usr/local/bin/backend
COPY --from=builder /app/.env .env

# Install necessary runtime libs (e.g. openssl if not statically linked)
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

EXPOSE 8080
CMD ["backend"]
