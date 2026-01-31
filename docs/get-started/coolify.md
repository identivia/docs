---
sidebar_position: 3
---

# Deploy on Coolify

Coolify is a self-hostable Heroku/Netlify alternative that makes deploying Docker Compose stacks incredibly easy. Since Coolify manages its own proxy (Traefik) by default, deploying Identivia requires valid Docker Compose configuration with slight modifications.

## Prerequisites

- A running instance of [Coolify](https://coolify.io/).

## Deployment Steps

### 1. Create a New Resource

1.  Log in to your Coolify dashboard.
2.  Go to your project and environment.
3.  Click **+ New**.
4.  Select **Docker Compose** (or **Stack** in some versions).
5.  You will be presented with an editor to input your Docker Compose configuration.

### 2. Configure Docker Compose

Copy and paste the following configuration into the Coolify editor. This configuration relies on pre-built Docker images and excludes the `traefik` service (as Coolify handles this globally).

```yaml
services:
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

### 3. Obtain API Keys

Before configuring environment variables, you'll need to obtain the following API keys:

#### AWS Credentials

AWS Rekognition is used for face liveness detection.

1. Sign in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Navigate to **IAM** (Identity and Access Management).
3. Create a new user with **Programmatic access**.
4. Attach the `AmazonRekognitionFullAccess` policy (or a custom policy with minimal permissions).
5. Save the **Access Key ID** and **Secret Access Key**.

> **Tip**: For production, use IAM roles with least-privilege permissions instead of root credentials.

#### OpenAI API Key

OpenAI is used for document analysis and verification.

1. Sign up or log in at [OpenAI Platform](https://platform.openai.com/).
2. Navigate to **API Keys** in your account settings.
3. Click **Create new secret key** and copy it immediately (it won't be shown again).

#### Fingerprint API Keys

Fingerprint is used for device identification and fraud prevention.

1. Sign up at [Fingerprint](https://fingerprint.com/).
2. Navigate to **App Settings** > **API Keys**.
3. Copy your **Public API Key** (for the frontend) and **Secret API Key** (for the backend).

---

### 4. Configure Environment Variables

In the Coolify dashboard for your resource, find the **Environment Variables** section and add all the required variables. You can often switch to "Raw" view to paste them in bulk.

> **Note**: Update the `DOMAIN` variable to match the domain you are using in Coolify.

```bash
# General
DOMAIN=yourdomain.com

# PocketBase
PB_ENCRYPTION_KEY=your_secret_encryption_key
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=changeme

# Admin Portal
POCKETBASE_PUBLIC_URL=https://pocketbase.yourdomain.com

# Web App
VITE_FINGERPRINT_PUBLIC_KEY=your_fingerprint_public_key
VITE_BACKEND_API_URL=https://api.yourdomain.com
VITE_DEMO_SITE_URL=https://demo.yourdomain.com
VITE_DOMAIN_URL=yourdomain.com

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
CLIENT_URL=https://yourdomain.com
```

### 5. Deploy

Click the **Deploy** button. Coolify will pull the images and start your application stack.

### 6. Domains

Coolify typically auto-generates domains or allows you to manage them in the resource settings. Ensure the domains you set in your `DOMAIN` environment variable and Traefik labels match the DNS records pointing to your Coolify instance.
