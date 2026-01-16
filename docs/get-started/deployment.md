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
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    command:
      - --api.dashboard=true
      - --api.insecure=true
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.httpchallenge=true
      - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
      - --certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    labels:
      - traefik.enable=true
      - traefik.http.routers.dashboard.rule=Host(`traefik.${DOMAIN}`)
      - traefik.http.routers.dashboard.service=api@internal
      - traefik.http.routers.dashboard.entrypoints=websecure
      - traefik.http.routers.dashboard.tls.certresolver=letsencrypt

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

  admin-portal:
    image: ghcr.io/identivia/admin-portal:latest
    container_name: admin-portal
    restart: unless-stopped
    environment:
      - POCKETBASE_URL=${POCKETBASE_PUBLIC_URL}
    depends_on:
      pocketbase:
        condition: service_healthy
    labels:
      - traefik.enable=true
      - traefik.http.routers.admin-portal.rule=Host(`admin.${DOMAIN}`)
      - traefik.http.routers.admin-portal.entrypoints=websecure
      - traefik.http.routers.admin-portal.tls.certresolver=letsencrypt
      - traefik.http.services.admin-portal.loadbalancer.server.port=80

  web-app:
    image: ghcr.io/identivia/web-app:latest
    container_name: web-app
    restart: unless-stopped
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
    labels:
      - traefik.enable=true
      - traefik.http.routers.web-app.rule=Host(`app.${DOMAIN}`)
      - traefik.http.routers.web-app.entrypoints=websecure
      - traefik.http.routers.web-app.tls.certresolver=letsencrypt
      - traefik.http.services.web-app.loadbalancer.server.port=80

  backend-api:
    image: ghcr.io/identivia/backend-api:latest
    container_name: backend-api
    restart: unless-stopped
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
    labels:
      - traefik.enable=true
      - traefik.http.routers.backend-api.rule=Host(`api.${DOMAIN}`)
      - traefik.http.routers.backend-api.entrypoints=websecure
      - traefik.http.routers.backend-api.tls.certresolver=letsencrypt
      - traefik.http.services.backend-api.loadbalancer.server.port=8000
```

## Configuration

Create a `.env` file in the same directory as your `docker-compose.yml` and add your environment variables:

```bash
# Traefik
DOMAIN=identivia.com
ACME_EMAIL=admin@identivia.com

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
POCKETBASE_INTERNAL_URL=http://pocketbase:8090
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

- **Traefik**: Modern reverse proxy and load balancer with automatic SSL via Let's Encrypt. Dashboard accessible at port `8080`.
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

## Configuring Traefik

Unlike traditional reverse proxies, Traefik uses Docker labels for automatic service discovery and routing. The configuration is already defined in the `docker-compose.yml` file through labels on each service.

### How Traefik Works

Traefik automatically detects services through Docker labels:

- `traefik.enable=true` - Enables Traefik for this service
- `traefik.http.routers.<name>.rule=Host(...)` - Defines the domain routing rule
- `traefik.http.routers.<name>.entrypoints=websecure` - Uses HTTPS entrypoint
- `traefik.http.routers.<name>.tls.certresolver=letsencrypt` - Enables automatic SSL
- `traefik.http.services.<name>.loadbalancer.server.port=<port>` - Specifies the container port

### Accessing the Dashboard

1.  **Access the Traefik Dashboard**: Open your browser and navigate to `http://localhost:8080`.
2.  The dashboard shows all detected services, routers, and their health status.
3.  No additional configuration is needed - services are automatically registered.

### Default Routes

With the provided configuration, the following routes are automatically configured:

| Service | Domain | Description |
|---------|--------|-------------|
| PocketBase | `pocketbase.${DOMAIN}` | Backend database and auth |
| Admin Portal | `admin.${DOMAIN}` | Admin interface |
| Web App | `app.${DOMAIN}` | Main user application |
| Backend API | `api.${DOMAIN}` | API service |
| Traefik Dashboard | `traefik.${DOMAIN}` | Traefik admin dashboard |

### SSL Certificates

Traefik automatically obtains and renews SSL certificates from Let's Encrypt. Certificates are stored in `./letsencrypt/acme.json`.

> **Note**: Replace `${DOMAIN}` with your actual domain (e.g., `identivia.com`) in the `.env` file. Ensure your DNS records point to your server.
