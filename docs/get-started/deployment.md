---
sidebar_position: 2
---

# Deployment

Deploying the Identivia stack using Docker Compose is straightforward. This guide assumes you have Docker and Docker Compose installed on your system.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed

## Docker Compose Configuration

Create a `docker-compose.yml` file with the following content:

```yaml
version: "3.8"

services:
  nginx-proxy-manager:
    image: jc21/nginx-proxy-manager:latest
    container_name: nginx-proxy-manager
    restart: unless-stopped
    ports:
      - "80:80"
      - "81:81"
      - "443:443"
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt

  pocketbase:
    image: pocketbase/pocketbase:latest
    container_name: pocketbase
    restart: unless-stopped
    command: 
      - --encryptionEnv
      - PB_ENCRYPTION_KEY
    environment:
      PB_ENCRYPTION_KEY: ${PB_ENCRYPTION_KEY}
    volumes:
      - ./pb_data:/pb/pb_data
    ports:
      - "8090:8090"

  admin-portal:
    image: ghcr.io/identivia/admin-portal:latest
    container_name: admin-portal
    restart: unless-stopped
    environment:
      - VITE_POCKETBASE_URL=https://pocketbase.example.com
    depends_on:
      - pocketbase

  web-app:
    image: ghcr.io/identivia/web-app:latest
    container_name: web-app
    restart: unless-stopped
    environment:
      - VITE_POCKETBASE_URL=https://pocketbase.example.com
      - VITE_API_URL=https://api.example.com
    depends_on:
      - pocketbase
      - backend-api

  backend-api:
    image: ghcr.io/identivia/backend-api:latest
    container_name: backend-api
    restart: unless-stopped
    environment:
      - POCKETBASE_URL=http://pocketbase:8090
      - API_KEY=${API_KEY}
    depends_on:
      - pocketbase
```

## Configuration

Create a `.env` file in the same directory as your `docker-compose.yml` and add your environment variables:

```bash
PB_ENCRYPTION_KEY=your_secret_encryption_key
API_KEY=your_secret_api_key
```

### Service Details

- **Nginx Proxy Manager**: Handles reverse proxying and SSL termination. Accessible at port `81` for administration.
- **PocketBase**: The backend database and authentication provider.
- **Admin Portal**: Interface for managing the Identivia system.
- **Web App**: The main user-facing application.
- **Backend API**: Internal API service for handling business logic.

## Running the Stack

To start all services, run:

```bash
docker-compose up -d
```

Check the logs to ensure everything started correctly:

```bash
docker-compose logs -f
```
