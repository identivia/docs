---
sidebar_position: 1
---

# Overview

The Identivia platform consists of several interconnected services that work together to provide a complete identity verification solution. This section provides detailed documentation for each service.

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                          Traefik                               │
│                    (Reverse Proxy & SSL)                       │
└─────┬──────────┬──────────┬──────────────┬────────────────────┘
      │          │          │              │
      ▼          ▼          ▼              ▼
┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐
│ Web App  │ │  Admin   │ │  Backend  │ │  PocketBase  │
│          │ │  Portal  │ │    API    │ │  (Database)  │
└────┬─────┘ └────┬─────┘ └─────┬─────┘ └──────────────┘
     │            │             │               ▲
     │            │             │               │
     └────────────┴─────────────┴───────────────┘
                    (Internal Network)
```

## Services

| Service | Description | Default Port |
|---------|-------------|--------------|
| [Traefik](./traefik) | Reverse proxy and load balancer with automatic SSL | 80, 443, 8080 |
| [PocketBase](./pocketbase) | Backend database and authentication provider | 8090 |
| [Backend API](./backend-api) | API service for business logic and integrations | 8000 |
| [Admin Portal](./admin-portal) | Administration interface for system management | 80 |
| [Web App](./web-app) | Main user-facing application for identity verification | 80 |

## Service Dependencies

- **Web App** depends on: PocketBase (healthy), Backend API (started)
- **Admin Portal** depends on: PocketBase (healthy)
- **Backend API** depends on: PocketBase (healthy)
- **PocketBase** is the core service with no dependencies
- **Traefik** routes traffic to all services

## Quick Links

- [Deployment Guide](/docs/get-started/deployment) - How to deploy the entire stack
- [Configuration](/docs/get-started/deployment#configuration) - Environment variables reference
