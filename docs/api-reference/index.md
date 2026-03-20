---
sidebar_position: 1
---

# API Reference

Complete reference for the Identivia Backend API.

## Base URL

```
https://api.<your-domain>
```

## Authentication

All endpoints (except `GET /api/profiles/:id` and health check) require an API key passed via the `x-api-key` header.

```bash
x-api-key: your_api_key
```

## Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | [`/`](#health-check) | No | Health check |
| `POST` | [`/api/profiles/create`](#create-profile) | Yes | Create a verification profile |
| `GET` | [`/api/profiles/:id`](#get-profile) | No | Retrieve a profile by ID |
| `PATCH` | [`/api/profiles/:id`](#update-profile) | Yes | Update a profile (status, files) |
| `POST` | [`/api/face-liveness/session`](#create-face-liveness-session) | Yes | Create an AWS Face Liveness session |
| `GET` | [`/api/face-liveness/results/:sessionId`](#get-face-liveness-results) | Yes | Get Face Liveness session results |
| `POST` | [`/api/ollama/document-analysis`](#document-analysis) | Yes | Analyze a document image with AI |
| `GET` | [`/api/aws/credentials`](#get-temporary-aws-credentials) | Yes | Get temporary AWS credentials |
| `GET` | [`/api/settings`](#get-settings) | Yes | Fetch application settings |
| `POST` | [`/api/status_history/:id`](#create-status-history) | Yes | Create a status history record |
| `POST` | [`/api/verification_history/:id`](#create-verification-history) | Yes | Create a verification history record |

---

## Health Check

Check if the API is running and view service status.

```
GET /
```

#### Response

```json
{
  "status": "OK",
  "service": "Identivia Integration API with AWS Face Liveness",
  "timestamp": "2026-03-21T00:00:00.000Z",
  "uptime": 12345.67,
  "memory": {
    "rss": "120 MB",
    "heapTotal": "60 MB",
    "heapUsed": "45 MB"
  },
  "pocketbase_status": "authenticated",
  "pocketbase_url": "https://pocketbase.identivia.com",
  "pocketbase_user_email": "admin@example.com",
  "aws_faceliveness_status": "configured",
  "openai_model": "o4-mini",
  "openai_status": "configured",
  "faceliveness_threshold": 75,
  "fingerprint_status": "configured"
}
```

---

## Create Profile

Create a new verification profile. If a profile with the same `userID` already exists, the existing profile is returned instead.

```
POST /api/profiles/create
```

#### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `x-api-key` | Yes | Your API key |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userID` | `string` | **Yes** | Unique identifier for the user (used to deduplicate profiles) |
| `name` | `string` | No | Full name of the individual |
| `documentType` | `string` | No | Type of document (e.g., `passport`, `national_id`, `driving_license`) |
| `documentNumber` | `string` | No | Document number |
| `country` | `string` | No | Country of origin or document issuance |
| `phoneNumber` | `string` | No | Phone number |
| `email` | `string` | No | Email address |
| `securityLevel` | `string` | No | Security level for the verification |
| `gender` | `string` | No | Gender (`male`, `female`, `unknown`) |
| `ipAddress` | `string` | No | IP address of the user |
| `language` | `string` | No | Preferred language |
| `team` | `string` | No | Team ID to associate the profile with. Defaults to the authenticated user's team if omitted. |

#### Example Request

```bash
curl -X POST https://api.identivia.com/api/profiles/create \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{
    "userID": "user-12345",
    "name": "John Doe",
    "documentType": "passport",
    "documentNumber": "A12345678",
    "country": "US",
    "email": "john@example.com",
    "securityLevel": "high"
  }'
```

#### Success Response (201 Created)

Returned when a new profile is created.

```json
{
  "success": true,
  "url": "https://app.identivia.com/abc123def456",
  "id": "abc123def456"
}
```

#### Success Response (200 OK)

Returned when a profile with the given `userID` already exists.

```json
{
  "success": true,
  "url": "https://app.identivia.com/abc123def456",
  "id": "abc123def456",
  "message": "Existing record found"
}
```

#### Error Response (400 Bad Request)

```json
{
  "error": "Missing required fields",
  "required": ["userID"]
}
```

#### Error Response (401 Unauthorized)

```json
{
  "error": "Invalid or missing API key"
}
```

---

## Get Profile

Retrieve a profile by its ID. This endpoint does **not** require an API key, making it suitable for public-facing verification pages.

```
GET /api/profiles/:id
```

#### Path Parameters

| Parameter | Description |
|-----------|-------------|
| `id` | The profile record ID |

#### Example Request

```bash
curl https://api.identivia.com/api/profiles/abc123def456
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "document_type": "passport",
    "document_number": "A12345678",
    "country": "US",
    "language": "en",
    "verification_status": "unverified",
    "status": "pending",
    "security_level": "high",
    "createdAt": "2026-03-21 00:00:00.000Z",
    "verification_history": {
      "id": "vh_record_id",
      "profile": "abc123def456",
      "status": "pending",
      "liveness_session_id": "session-xyz",
      "liveness_confidence": 95.5,
      "liveness_status": "live",
      "document_type": "passport",
      "name": "John Doe",
      "document_number": "A12345678",
      "country": "US",
      "created": "2026-03-21 00:00:00.000Z",
      "updated": "2026-03-21 00:00:00.000Z"
    }
  }
}
```

:::info
The `status` field reflects the **latest status** from `status_history`, while `verification_status` reflects the profile's own status field. These may differ if a status change has been recorded.
:::

#### Error Response (404 Not Found)

```json
{
  "error": "Identivia record not found",
  "message": "Invalid or expired ID"
}
```

---

## Update Profile

Update an existing profile's verification status and upload files.

```
PATCH /api/profiles/:id
```

#### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `multipart/form-data` |
| `x-api-key` | Yes | Your API key |

#### Path Parameters

| Parameter | Description |
|-----------|-------------|
| `id` | The profile record ID |

#### Request Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `verification_status` | `string` | No | One of: `unverified`, `pending`, `verified`, `rejected` |
| `document_type` | `string` | No | Document type |
| `document_number` | `string` | No | Document number |
| `document_name` | `string` | No | Document name |
| `country` | `string` | No | Country |
| `face_liveness_session_id` | `string` | No | AWS Face Liveness session ID |
| `face_liveness_confidence` | `number` | No | Face liveness confidence score |
| `face_liveness_status` | `string` | No | Face liveness status |
| `face_liveness_result` | `string/object` | No | Full face liveness result |
| `document_front` | `file` | No | Front of the identity document |
| `document_back` | `file` | No | Back of the identity document |
| `facial_photo` | `file` | No | Facial photo for liveness/verification |
| `facial_video` | `file` | No | Facial video for liveness/verification |

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Record updated successfully",
  "data": {
    "id": "abc123def456",
    "status": "pending",
    "document_type": "passport",
    "document_number": "A12345678",
    "document_name": "John Doe",
    "country": "US",
    "document_front": "filename.jpg",
    "document_back": "filename.jpg",
    "facial_photo": "photo.jpg",
    "facial_video": "video.webm",
    "updated": "2026-03-21 00:00:00.000Z"
  }
}
```

---

## Create Face Liveness Session

Create a new AWS Rekognition Face Liveness session.

```
POST /api/face-liveness/session
```

#### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `x-api-key` | Yes | Your API key |

#### Success Response (200 OK)

```json
{
  "success": true,
  "sessionId": "session-uuid-here",
  "message": "Face Liveness session created successfully",
  "challengeType": "FaceMovementAndLightChallenge"
}
```

#### Error Response (501 Not Implemented)

```json
{
  "error": "AWS credentials not configured",
  "message": "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set in environment variables"
}
```

---

## Get Face Liveness Results

Retrieve the results of a completed Face Liveness session.

```
GET /api/face-liveness/results/:sessionId
```

#### Path Parameters

| Parameter | Description |
|-----------|-------------|
| `sessionId` | The Face Liveness session ID |

#### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `x-api-key` | Yes | Your API key |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "sessionId": "session-uuid-here",
    "confidenceScore": 95.5,
    "isLive": true,
    "referenceImage": {
      "bytes": "base64-encoded-image",
      "boundingBox": { "Width": 0.5, "Height": 0.6, "Left": 0.2, "Top": 0.1 }
    },
    "auditImages": []
  },
  "message": "Face Liveness results retrieved successfully"
}
```

#### Error Response (404 Not Found)

```json
{
  "error": "Session not found",
  "message": "Face Liveness session ID is invalid or expired"
}
```

---

## Document Analysis

Analyze an identity document image using OpenAI Vision to extract structured data.

```
POST /api/ollama/document-analysis
```

#### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `multipart/form-data` |
| `x-api-key` | Yes | Your API key |

#### Request Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `document_front` | `file` | **Yes** | Image of the document to analyze |
| `document_type_hint` | `string` | No | Hint for the document type |
| `document_number_hint` | `string` | No | Hint for the document number |
| `full_name_hint` | `string` | No | Hint for the full name on the document |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "model": "o4-mini",
    "analysis": "{ ... raw JSON string ... }",
    "analysis_json": {
      "name": "John Doe",
      "document_number": "A12345678",
      "country": "US",
      "document_type": "passport",
      "address": "",
      "gender": "male",
      "date_of_birth": "1990-01-15 00:00:00.000Z",
      "authenticity": "authentic"
    },
    "verification_history_fields": {
      "name": "John Doe",
      "document_number": "A12345678",
      "country": "US",
      "address": null,
      "gender": "male",
      "date_of_birth": "1990-01-15"
    },
    "document": {
      "name": "passport.jpg",
      "mimetype": "image/jpeg",
      "size": 102400
    },
    "usage": {
      "prompt_tokens": 500,
      "completion_tokens": 120,
      "total_tokens": 620
    }
  }
}
```

---

## Get Temporary AWS Credentials

Retrieve temporary AWS credentials scoped to Rekognition Face Liveness operations for direct client-side usage.

```
GET /api/aws/credentials
```

#### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `x-api-key` | Yes | Your API key |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "accessKeyId": "ASIA...",
    "secretAccessKey": "...",
    "sessionToken": "...",
    "expiration": "2026-03-21T00:15:00.000Z"
  }
}
```

:::note
Credentials expire after **15 minutes** and are scoped only to `rekognition:StartFaceLivenessSession` and `rekognition:GetFaceLivenessSessionResults`.
:::

---

## Get Settings

Fetch application settings stored in the PocketBase `settings` collection.

```
GET /api/settings
```

#### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `x-api-key` | Yes | Your API key |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "setting_key_1": "value_1",
    "setting_key_2": "value_2"
  }
}
```

---

## Create Status History

Record a status change for a profile.

```
POST /api/status_history/:id
```

#### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `x-api-key` | Yes | Your API key |

#### Path Parameters

| Parameter | Description |
|-----------|-------------|
| `id` | The profile record ID |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `previous_status` | `string` | **Yes** | The previous status value |
| `new_status` | `string` | **Yes** | The new status value |
| `notes` | `string` | **Yes** | Notes about the status change |
| `verification` | `string` | No | Associated verification record ID |

#### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Status history record created",
  "data": {
    "id": "sh_record_id",
    "profile": "abc123def456",
    "updated_by": "user_record_id",
    "previous_status": "unverified",
    "new_status": "pending",
    "notes": "Verification submitted",
    "created": "2026-03-21 00:00:00.000Z"
  }
}
```

---

## Create Verification History

Create a detailed verification history record for a profile, including liveness data, document images, and Fingerprint device data.

```
POST /api/verification_history/:id
```

#### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `multipart/form-data` |
| `x-api-key` | Yes | Your API key |

#### Path Parameters

| Parameter | Description |
|-----------|-------------|
| `id` | The profile record ID |

#### Request Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `liveness_session_id` | `string` | **Yes** | AWS Face Liveness session ID |
| `liveness_confidence` | `number` | **Yes** | Liveness confidence score |
| `document_type` | `string` | **Yes** | Document type |
| `liveness_status` | `string` | **Yes** | Liveness status (e.g., `live`, `not_live`) |
| `document_number` | `string` | No | Document number |
| `country` | `string` | No | Country |
| `name` | `string` | No | Full name extracted from document |
| `address` | `string` | No | Address extracted from document |
| `gender` | `string` | No | Gender extracted from document |
| `date_of_birth` | `string` | No | Date of birth (ISO format) |
| `fingerprint` | `string/object` | No | FingerprintJS visitor data (JSON) |
| `ip_address` | `string` | No | Client IP address |
| `facial_photo` | `file` | No* | Facial photo (falls back to profile's file) |
| `document_front` | `file` | No* | Document front (falls back to profile's file) |
| `document_back` | `file` | No* | Document back (required for non-passport documents, falls back to profile's file) |

:::info
Files (`facial_photo`, `document_front`, `document_back`) are required for the verification record. If not uploaded in this request, the API will attempt to copy them from the parent profile record. The request will fail if required files are unavailable from either source.
:::

#### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Verification history record created",
  "data": {
    "id": "vh_record_id",
    "profile": "abc123def456",
    "liveness_session_id": "session-xyz",
    "liveness_confidence": 95.5,
    "document_type": "passport",
    "document_number": "A12345678",
    "facial_photo": "photo.jpg",
    "document_front": "front.jpg",
    "document_back": "",
    "country": "US",
    "liveness_status": "live",
    "name": "John Doe",
    "address": "",
    "created": "2026-03-21 00:00:00.000Z",
    "updated": "2026-03-21 00:00:00.000Z"
  }
}
```

---

## Error Codes

Common error responses across all endpoints:

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request — Missing or invalid fields |
| `401` | Unauthorized — Missing or invalid API key |
| `403` | Forbidden — AWS access denied |
| `404` | Not Found — Resource not found |
| `500` | Internal Server Error |
| `501` | Not Implemented — Required service not configured (e.g., AWS credentials) |
| `502` | Bad Gateway — External service request failed (e.g., OpenAI) |
