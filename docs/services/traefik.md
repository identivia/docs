---
sidebar_position: 3
---

# Traefik

Traefik is a modern reverse proxy and load balancer that automatically handles SSL certificates and service discovery. It serves as the entry point for all traffic to the Identivia platform.

## Overview

| Property | Value |
|----------|-------|
| **Image** | `traefik:v3.0` |
| **Container Name** | `traefik` |
| **HTTP Port** | `80` |
| **HTTPS Port** | `443` |
| **Dashboard Port** | `8080` |

## Features

- **Automatic SSL**: Let's Encrypt integration for automatic certificate provisioning and renewal
- **Service Discovery**: Automatic detection of Docker services via labels
- **Load Balancing**: Built-in load balancing for high availability
- **Dashboard**: Web-based dashboard for monitoring and configuration
- **Dynamic Configuration**: No restart required when services change

## Docker Configuration

```yaml
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
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DOMAIN` | Base domain for all services (e.g., `identivia.com`) | Yes |
| `ACME_EMAIL` | Email address for Let's Encrypt certificate notifications | Yes |

### Example Configuration

```bash
# Traefik
DOMAIN=identivia.com
ACME_EMAIL=admin@identivia.com
```

## Entrypoints

Traefik exposes three entrypoints:

| Entrypoint | Port | Description |
|------------|------|-------------|
| `web` | 80 | HTTP traffic (redirects to HTTPS) |
| `websecure` | 443 | HTTPS traffic with SSL/TLS |
| `dashboard` | 8080 | Traefik dashboard (insecure mode) |

## Service Discovery

Traefik automatically discovers services through Docker labels. Each service needs the following labels:

```yaml
labels:
  - traefik.enable=true                                           # Enable Traefik for this service
  - traefik.http.routers.<name>.rule=Host(`subdomain.${DOMAIN}`)  # Domain routing rule
  - traefik.http.routers.<name>.entrypoints=websecure             # Use HTTPS entrypoint
  - traefik.http.routers.<name>.tls.certresolver=letsencrypt      # Enable automatic SSL
  - traefik.http.services.<name>.loadbalancer.server.port=<port>  # Container port
```

## SSL Certificates

### Automatic Certificate Provisioning

Traefik automatically obtains SSL certificates from Let's Encrypt using HTTP-01 challenge:

1. When a new service is added, Traefik detects the domain from labels
2. Traefik requests a certificate from Let's Encrypt
3. Let's Encrypt validates domain ownership via HTTP challenge
4. Certificate is stored in `./letsencrypt/acme.json`

### Certificate Storage

Certificates are stored in `./letsencrypt/acme.json`. This file should be:

- Backed up regularly
- Have restrictive permissions (`chmod 600`)
- Persisted across container restarts

:::warning
Never expose or commit `acme.json` to version control as it contains private keys.
:::

## Dashboard

### Accessing the Dashboard

The Traefik dashboard is accessible at:

- **Local development**: `http://localhost:8080`
- **Production**: `https://traefik.${DOMAIN}` (SSL protected)

### Dashboard Features

- **HTTP Routers**: View all configured routes and their rules
- **HTTP Services**: Monitor backend services and health
- **HTTP Middlewares**: View active middlewares
- **Entrypoints**: See configured entrypoints and traffic
- **TLS Certificates**: View and manage SSL certificates

## Configured Routes

The default configuration sets up the following routes:

| Service | Domain | Description |
|---------|--------|-------------|
| PocketBase | `pocketbase.${DOMAIN}` | Backend database and auth |
| Admin Portal | `admin.${DOMAIN}` | Admin interface |
| Web App | `app.${DOMAIN}` | Main user application |
| Backend API | `api.${DOMAIN}` | API service |
| Traefik Dashboard | `traefik.${DOMAIN}` | Traefik admin dashboard |

## Security Considerations

### Dashboard Access

The dashboard is configured with `--api.insecure=true` for simplicity. In production, consider:

1. **Adding authentication** using a middleware:

```yaml
labels:
  - traefik.http.routers.dashboard.middlewares=auth
  - traefik.http.middlewares.auth.basicauth.users=admin:$$apr1$$...
```

2. **Restricting access** to internal networks only

### Docker Socket

The Docker socket is mounted read-only (`:ro`) to prevent container modifications. This is a security best practice.

## Advanced Configuration

### HTTP to HTTPS Redirect

Add a global redirect middleware:

```yaml
command:
  - --entrypoints.web.http.redirections.entrypoint.to=websecure
  - --entrypoints.web.http.redirections.entrypoint.scheme=https
```

### Rate Limiting

Add rate limiting to protect services:

```yaml
labels:
  - traefik.http.middlewares.ratelimit.ratelimit.average=100
  - traefik.http.middlewares.ratelimit.ratelimit.burst=50
  - traefik.http.routers.backend-api.middlewares=ratelimit
```

### Custom Headers

Add security headers:

```yaml
labels:
  - traefik.http.middlewares.security-headers.headers.stsSeconds=31536000
  - traefik.http.middlewares.security-headers.headers.browserXssFilter=true
  - traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true
```

## Troubleshooting

### Certificate Not Issued

1. Ensure DNS records point to your server
2. Check that port 80 is accessible from the internet
3. Verify the ACME email is valid
4. Check Traefik logs: `docker logs traefik`

### Service Not Discovered

1. Verify `traefik.enable=true` label is set
2. Check Docker socket is mounted correctly
3. Ensure the service is running: `docker ps`

### 404 Not Found

1. Verify the Host rule matches your domain
2. Check the service port is correct
3. Ensure the service container is healthy

### SSL Handshake Error

1. Wait for certificate provisioning (can take a few minutes)
2. Check `acme.json` for errors
3. Verify the domain is accessible via HTTP first

## Related Documentation

- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Traefik Docker Provider](https://doc.traefik.io/traefik/providers/docker/)
- [Let's Encrypt ACME](https://doc.traefik.io/traefik/https/acme/)
