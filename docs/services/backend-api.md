---
sidebar_position: 4
---

# Backend API

The Backend API is the core service responsible for handling business logic, external integrations, and processing requests from the Web App. It connects to various third-party services including AWS for facial recognition and OpenAI for AI-powered features.

## Overview

| Property | Value |
|----------|-------|
| **Image** | `ghcr.io/identivia/backend-api:latest` |
| **Container Name** | `backend-api` |
| **Internal Port** | `8000` |
| **External URL** | `https://api.${DOMAIN}` |

## Features

- **Identity Verification**: Core verification logic and workflow management
- **Face Liveness Detection**: AWS Rekognition integration for liveness checks
- **AI-Powered Analysis**: OpenAI integration for document analysis
- **Fingerprint Detection**: Fingerprint.js integration for device fingerprinting
- **PocketBase Integration**: Database operations and user management

## Docker Configuration

```yaml
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

## Environment Variables

### PocketBase Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `POCKETBASE_URL` | Internal URL to PocketBase service | Yes |
| `PB_USER_EMAIL` | Admin email for PocketBase authentication | Yes |
| `PB_USER_PASSWORD` | Admin password for PocketBase authentication | Yes |

### API Security

| Variable | Description | Required |
|----------|-------------|----------|
| `API_KEY` | Secret key for API authentication | Yes |
| `CLIENT_URL` | Allowed origin URL for CORS | Yes |

### AWS Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `AWS_REGION` | AWS region for Rekognition service | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key ID | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | Yes |
| `FACE_LIVENESS_THRESHOLD` | Threshold score for face liveness (0-100) | Yes |

### OpenAI Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_MODEL` | OpenAI model to use (e.g., `o4-mini`) | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |

### Fingerprint Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `FINGERPRINT_SECRET_KEY` | Secret key for Fingerprint.js verification | Yes |

### Example Configuration

```bash
# Backend API - PocketBase
POCKETBASE_INTERNAL_URL=http://pocketbase:8090
API_KEY=your_secret_api_key

# Backend API - AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
FACE_LIVENESS_THRESHOLD=75

# Backend API - OpenAI
OPENAI_MODEL=o4-mini
OPENAI_API_KEY=your_openai_api_key

# Backend API - Fingerprint
FINGERPRINT_SECRET_KEY=your_fingerprint_secret_key

# Backend API - CORS
CLIENT_URL=https://identivia.com
```

## Dependencies

The Backend API depends on:

- **PocketBase**: Must be healthy before starting (health check condition)

This ensures the database is available before the API starts processing requests.

## Integrations

### AWS Rekognition

The Backend API uses AWS Rekognition for face liveness detection:

- **Service**: Amazon Rekognition Face Liveness
- **Purpose**: Verify that the person in front of the camera is real
- **Threshold**: Configurable via `FACE_LIVENESS_THRESHOLD` (default: 75)

Required AWS IAM permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rekognition:CreateFaceLivenessSession",
        "rekognition:GetFaceLivenessSessionResults",
        "rekognition:DetectFaces",
        "rekognition:CompareFaces"
      ],
      "Resource": "*"
    }
  ]
}
```

### OpenAI

The Backend API uses OpenAI for:

- Document text extraction and analysis
- Fraud detection patterns
- Data validation and verification

### Fingerprint.js

Device fingerprinting is used to:

- Detect suspicious devices
- Prevent fraud and abuse
- Track verification attempts

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check endpoint |
| `/api/v1/verify` | POST | Start verification process |
| `/api/v1/liveness` | POST | Process face liveness check |
| `/api/v1/document` | POST | Process document verification |
| `/api/v1/status/{id}` | GET | Get verification status |

:::note
Refer to the [API Reference](/docs/api-reference) for complete endpoint documentation.
:::

## Security

### API Key Authentication

All API requests require the `X-API-Key` header:

```bash
curl -H "X-API-Key: your_api_key" https://api.identivia.com/api/v1/status/123
```

### CORS Configuration

The `CLIENT_URL` environment variable configures allowed origins for CORS. Only requests from this origin will be accepted for browser-based requests.

### Secrets Management

:::warning
Never commit API keys or secrets to version control. Use environment variables or a secrets manager.
:::

For production deployments, consider using:

- Docker Secrets
- HashiCorp Vault
- AWS Secrets Manager
- Environment-specific `.env` files

## Troubleshooting

### Connection to PocketBase Failed

1. Verify PocketBase is running and healthy
2. Check the internal URL is correct (`http://pocketbase:8090`)
3. Ensure both containers are on the same Docker network

### AWS Rekognition Errors

1. Verify AWS credentials are correct
2. Check IAM permissions for Rekognition
3. Ensure the AWS region is valid
4. Check AWS CloudWatch logs for detailed errors

### OpenAI API Errors

1. Verify the API key is valid
2. Check the model name is correct
3. Monitor OpenAI dashboard for quota limits
4. Check for rate limiting issues

### High Latency

1. Monitor PocketBase query performance
2. Check external API response times (AWS, OpenAI)
3. Review container resource limits
4. Consider scaling horizontally

## Monitoring

### Health Check

Check the API health status:

```bash
curl https://api.${DOMAIN}/health
```

### Logs

View container logs:

```bash
docker logs backend-api -f
```

### Metrics

Consider integrating with monitoring tools like:

- Prometheus
- Grafana
- DataDog
- New Relic

## Related Documentation

- [AWS Rekognition Documentation](https://docs.aws.amazon.com/rekognition/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Fingerprint.js Documentation](https://dev.fingerprint.com/docs)
