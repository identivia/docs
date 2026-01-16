---
sidebar_position: 2
---

# PocketBase

PocketBase serves as the backend database and authentication provider for the Identivia platform. It provides a real-time database, user authentication, file storage, and an admin dashboard out of the box.

## Overview

| Property | Value |
|----------|-------|
| **Image** | `ghcr.io/muchobien/pocketbase` |
| **Container Name** | `pocketbase` |
| **Internal Port** | `8090` |
| **External URL** | `https://pocketbase.${DOMAIN}` |

## Features

- **Real-time Database**: SQLite-based with real-time subscriptions
- **Authentication**: Built-in user authentication with OAuth2 support
- **File Storage**: Integrated file storage for user uploads
- **Admin Dashboard**: Web-based admin interface
- **REST API**: Auto-generated REST API for all collections
- **Encryption**: Data encryption at rest with configurable encryption key

## Docker Configuration

```yaml
pocketbase:
  image: ghcr.io/muchobien/pocketbase
  container_name: pocketbase
  restart: unless-stopped
  command:
    - --encryptionEnv
    - PB_ENCRYPTION_KEY
  environment:
    - PB_ENCRYPTION_KEY=${PB_ENCRYPTION_KEY}
    - POCKETBASE_ADMIN_EMAIL=${POCKETBASE_ADMIN_EMAIL}
    - POCKETBASE_ADMIN_PASSWORD=${POCKETBASE_ADMIN_PASSWORD}
  volumes:
    - ./pb_data:/pb_data
  healthcheck:
    test: wget --no-verbose --tries=1 --spider http://localhost:8090/api/health || exit 1
    interval: 5s
    timeout: 5s
    retries: 5
  labels:
    - traefik.enable=true
    - traefik.http.routers.pocketbase.rule=Host(`pocketbase.${DOMAIN}`)
    - traefik.http.routers.pocketbase.entrypoints=websecure
    - traefik.http.routers.pocketbase.tls.certresolver=letsencrypt
    - traefik.http.services.pocketbase.loadbalancer.server.port=8090
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PB_ENCRYPTION_KEY` | Secret key used to encrypt sensitive data at rest | Yes |
| `POCKETBASE_ADMIN_EMAIL` | Email address for the initial admin account | Yes |
| `POCKETBASE_ADMIN_PASSWORD` | Password for the initial admin account | Yes |

### Example Configuration

```bash
# PocketBase
PB_ENCRYPTION_KEY=your_secret_encryption_key_min_32_chars
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=changeme
```

:::warning
Use a strong, unique encryption key in production. The encryption key should be at least 32 characters long and stored securely.
:::

## Data Persistence

PocketBase data is persisted in the `./pb_data` volume, which contains:

- `data.db` - The main SQLite database
- `storage/` - Uploaded files
- `logs/` - Application logs

:::important
Always backup the `pb_data` directory regularly to prevent data loss.
:::

## Health Check

The container includes a health check that verifies PocketBase is running:

```bash
wget --no-verbose --tries=1 --spider http://localhost:8090/api/health
```

This health check runs every 5 seconds and is used by other services to ensure PocketBase is ready before starting.

## Accessing the Admin Dashboard

1. Navigate to `https://pocketbase.${DOMAIN}/_/` (note the trailing underscore and slash)
2. Log in with your admin credentials

The admin dashboard allows you to:

- Manage collections (database tables)
- View and edit records
- Manage users and authentication
- Configure OAuth providers
- View logs and system settings

## API Endpoints

PocketBase automatically generates REST API endpoints for all collections:

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check endpoint |
| `GET /api/collections` | List all collections |
| `GET /api/collections/{collection}/records` | List records in a collection |
| `POST /api/collections/{collection}/records` | Create a new record |
| `PATCH /api/collections/{collection}/records/{id}` | Update a record |
| `DELETE /api/collections/{collection}/records/{id}` | Delete a record |

## Troubleshooting

### Container Won't Start

1. Check if the `pb_data` directory has correct permissions
2. Verify the encryption key is set correctly
3. Check Docker logs: `docker logs pocketbase`

### Database Locked Error

If you see "database is locked" errors:

1. Ensure only one PocketBase instance is accessing the database
2. Check disk I/O performance
3. Consider increasing SQLite timeout settings

### Connection Refused

1. Verify the container is running: `docker ps`
2. Check if port 8090 is accessible within the Docker network
3. Verify Traefik routing configuration

## Related Documentation

- [Official PocketBase Documentation](https://pocketbase.io/docs/)
- [PocketBase GitHub Repository](https://github.com/pocketbase/pocketbase)
