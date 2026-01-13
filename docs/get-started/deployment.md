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
    ports:
      - "8090:8090"
    healthcheck:
      test: wget --no-verbose --tries=1 --spider http://localhost:8090/api/health || exit 1
      interval: 5s
      timeout: 5s
      retries: 5

  admin-portal:
    image: ghcr.io/identivia/admin-portal:latest
    container_name: admin-portal
    restart: unless-stopped
    ports:
      - "3000:80"
    environment:
      - POCKETBASE_URL=${POCKETBASE_PUBLIC_URL}
    depends_on:
      pocketbase:
        condition: service_healthy

  web-app:
    image: ghcr.io/identivia/web-app:latest
    container_name: web-app
    restart: unless-stopped
    ports:
      - "3001:80"
    environment:
      - VITE_FINGERPRINT_PUBLIC_KEY=${VITE_FINGERPRINT_PUBLIC_KEY}
      - VITE_BACKEND_API_URL=${VITE_BACKEND_API_URL}
      - VITE_DEMO_SITE_URL=${VITE_DEMO_SITE_URL}
      - VITE_DOMAIN_URL=${VITE_DOMAIN_URL}
    depends_on:
      pocketbase:
        condition: service_healthy
      backend-api:
        condition: service_started

  backend-api:
    image: ghcr.io/identivia/backend-api:latest
    container_name: backend-api
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - POCKETBASE_URL=${POCKETBASE_INTERNAL_URL}
      - API_KEY=${API_KEY}
      - PB_USER_EMAIL=${POCKETBASE_ADMIN_EMAIL}
      - PB_USER_PASSWORD=${POCKETBASE_ADMIN_PASSWORD}
      - AWS_REGION=${AWS_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - FACE_LIVENESS_THRESHOLD=${FACE_LIVENESS_THRESHOLD}
      - OPENAI_MODEL=${OPENAI_MODEL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - FINGERPRINT_SECRET_KEY=${FINGERPRINT_SECRET_KEY}
      - CLIENT_URL=${CLIENT_URL}
    depends_on:
      pocketbase:
        condition: service_healthy
```

## Configuration

Create a `.env` file in the same directory as your `docker-compose.yml` and add your environment variables:

```bash
# PocketBase
PB_ENCRYPTION_KEY=your_secret_encryption_key
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=changeme

# Admin Portal
POCKETBASE_PUBLIC_URL=https://pocketbase.identivia.com

# Web App
VITE_FINGERPRINT_PUBLIC_KEY=your_fingerprint_public_key
VITE_BACKEND_API_URL=https://api.identivia.com
VITE_DEMO_SITE_URL=https://demo.identivia.com
VITE_DOMAIN_URL=identivia.com

# Backend API
POCKETBASE_INTERNAL_URL=http://172.31.37.205:8090
API_KEY=your_secret_api_key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
FACE_LIVENESS_THRESHOLD=75
OPENAI_MODEL=o4-mini
OPENAI_API_KEY=your_openai_api_key
FINGERPRINT_SECRET_KEY=your_fingerprint_secret_key
CLIENT_URL=https://identivia.com
```

### Service Details

- **Nginx Proxy Manager**: Handles reverse proxying and SSL termination. Accessible at port `81` for administration.
- **PocketBase**: The backend database and authentication provider.
- **Admin Portal**: Interface for managing the Identivia system.
- **Web App**: The main user-facing application.
- **Backend API**: Internal API service for handling business logic.

## Authenticating to the Container registry

:::note

GitHub Packages only supports authentication using a personal access token (classic). For more information, see [Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

:::

You need an access token to publish, install, and delete private, internal, and public packages.

You can use a personal access token (classic) to authenticate to GitHub Packages or the GitHub API. When you create a personal access token (classic), you can assign the token different scopes depending on your needs. For more information about packages-related scopes for a personal access token (classic), see [About permissions for GitHub Packages](https://docs.github.com/en/packages/learn-github-packages/about-permissions-for-github-packages).

To authenticate to a GitHub Packages registry within a GitHub Actions workflow, you can use:

*   `GITHUB_TOKEN` to publish packages associated with the workflow repository.
*   A personal access token (classic) with at least `read:packages` scope to install packages associated with other private repositories (`GITHUB_TOKEN` can be used if the repository is granted read access to the package. See [Configuring a package's access control and visibility](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility)).

For more information, see [Authenticating to the Container registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry).

## Running the Stack


To start all services, run:

```bash
docker-compose up -d
```

Check the logs to ensure everything started correctly:

```bash
docker-compose logs -f
```

## Configuring Nginx Proxy Manager

After the stack is running, you need to configure Nginx Proxy Manager to route traffic to the correct services.

![Nginx Proxy Manager Screenshot](/img/nginx-proxy-manager.png)

1.  **Access the Admin Interface**: Open your browser and navigate to `http://localhost:81`.
2.  **Login**: Use the default credentials:
    *   **Email**: `admin@example.com`
    *   **Password**: `changeme`
    *   *Note: You will be prompted to change these details after your first login.*
3.  **Add Proxy Hosts**: Go to the "Proxy Hosts" tab and click "Add Proxy Host".

### 1. Configure PocketBase

*   **Domain Names**: `pocketbase.example.com` (or your local domain)
*   **Scheme**: `http`
*   **Forward Hostname / IP**: `pocketbase`
*   **Forward Port**: `8090`
*   **Websockets Support**: Enable this option (Required for PocketBase realtime subscriptions).
*   **Block Common Exploits**: Enable this option.

### 2. Configure Admin Portal

*   **Domain Names**: `admin.example.com` (or your local domain)
*   **Scheme**: `http`
*   **Forward Hostname / IP**: `admin-portal`
*   **Forward Port**: `80`
*   **Block Common Exploits**: Enable this option.

### 3. Configure Web App

*   **Domain Names**: `app.example.com` (or your local domain)
*   **Scheme**: `http`
*   **Forward Hostname / IP**: `web-app`
*   **Forward Port**: `80`
*   **Block Common Exploits**: Enable this option.

> **Note**: Replace `.example.com` domains with your actual domain names or local hosts mapped in your `/etc/hosts` file.
